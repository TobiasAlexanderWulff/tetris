import type {
  EngineConfig,
  EngineEvent,
  InputEvent,
  PieceState,
  Rotation,
  Snapshot,
  TetrominoId,
  Vec2,
} from '../types';
import { BagRandomizer } from '../random/bag';
import { TETROMINO_SHAPES } from '../pieces/tetromino';
import { applyRotation, getKickTable } from '../rotations/srs';
import { BoardSpec, clearFullRows, collides, createGrid, place } from '../board/board';

/** Default engine configuration suitable for tests and MVP. */
export const DEFAULT_CONFIG: EngineConfig = {
  width: 10,
  heightVisible: 20,
  bufferRows: 2,
  allow180: false,
  lockDelayMs: 500,
  maxLockResets: 15,
  gravityTable: {
    0: 1.0,
    1: 1.2,
    2: 1.5,
    3: 1.9,
    4: 2.3,
    5: 3.0,
    6: 4.0,
    7: 5.0,
    8: 6.5,
    9: 8.0,
    10: 10.0,
  },
  showNext: 5,
  scoring: {
    single: 100,
    double: 300,
    triple: 500,
    tetris: 800,
    softPerCell: 1,
    hardPerCell: 2,
    b2bMultiplier: 1.5,
    comboBase: 50,
    levelLines: 10,
  },
};

/**
 * Internal engine state.
 */
interface InternalState {
  readonly config: EngineConfig;
  readonly spec: BoardSpec;
  readonly grid: Uint8Array;
  readonly bag: BagRandomizer;
  active: PieceState | null;
  softDropping: boolean;
  hold: TetrominoId | null;
  canHold: boolean;
  queue: TetrominoId[];
  lockMsLeft: number | null;
  lockResetsUsed: number;
  accumulatorMs: number;
  events: EngineEvent[];
  // M3 metrics
  score: number;
  level: number;
  linesClearedTotal: number;
  combo: number; // -1 when not in combo chain
  b2b: boolean;
  // Drop counters for current piece
  softDropCells: number;
  hardDropCells: number;
}

/**
 * Engine orchestrates piece spawn, movement, rotation, gravity and locking.
 * It is deterministic when given the same seed and sequence of InputEvents.
 */
export class Engine {
  private s: InternalState;
  private inputQueue: InputEvent[] = [];

  /** Create an engine with configuration and optional seed. */
  constructor(config?: Partial<EngineConfig>, seed = 123456789) {
    const cfg = { ...DEFAULT_CONFIG, ...config } satisfies EngineConfig;
    const spec: BoardSpec = {
      width: cfg.width,
      heightVisible: cfg.heightVisible,
      bufferRows: cfg.bufferRows,
    };
    const grid = createGrid(spec);
    const bag = new BagRandomizer(seed);
    const queue = [bag.next(), bag.next(), bag.next(), bag.next(), bag.next()];
    this.s = {
      config: cfg,
      spec,
      grid,
      bag,
      active: null,
      softDropping: false,
      hold: null,
      canHold: true,
      queue,
      lockMsLeft: null,
      lockResetsUsed: 0,
      accumulatorMs: 0,
      events: [],
      score: 0,
      level: 0,
      linesClearedTotal: 0,
      combo: -1,
      b2b: false,
      softDropCells: 0,
      hardDropCells: 0,
    };
    this.spawnNext();
  }

  /** Queue a normalized input event. */
  enqueueInput(evt: InputEvent): void {
    this.inputQueue.push(evt);
    this.inputQueue.sort((a, b) => a.at - b.at);
  }

  /** Advance simulation by dtMs using a fixed 16.6667ms tick accumulator. */
  update(dtMs: number): void {
    const TICK_MS = 1000 / 60;
    this.s.accumulatorMs += dtMs;
    while (this.s.accumulatorMs >= TICK_MS) {
      this.processInputsUpToTick();
      this.fixedUpdate(TICK_MS);
      this.s.accumulatorMs -= TICK_MS;
    }
  }

  /** Get a render-friendly snapshot. */
  getSnapshot(): Snapshot {
    const { spec, grid, active, hold, canHold, queue, lockMsLeft } = this.s;
    return {
      board: grid,
      width: spec.width,
      heightVisible: spec.heightVisible,
      bufferRows: spec.bufferRows,
      active,
      ghost: active ? this.computeGhost(active) : null,
      hold,
      canHold,
      next: queue.slice(0, this.s.config.showNext),
      timers: { lockMsLeft },
      score: this.s.score,
      level: this.s.level,
      linesClearedTotal: this.s.linesClearedTotal,
    };
  }

  /** Subscribe to engine events. Returns an unsubscribe function. */
  subscribe(listener: (e: EngineEvent) => void): () => void {
    // Simple immediate-drain every update; here we just expose a pump on demand
    let disposed = false;
    const interval = setInterval(() => {
      if (disposed) return;
      let e: EngineEvent | undefined;
      // Drain events
      while ((e = this.s.events.shift())) listener(e);
    }, 0);
    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }

  private processInputsUpToTick(): void {
    // For M1, process all queued inputs immediately each tick, ignoring timestamps.
    // Events are sorted on enqueue for deterministic ordering.
    while (this.inputQueue.length) {
      const evt = this.inputQueue.shift()!;
      this.applyInput(evt);
    }
  }

  private applyInput(evt: InputEvent): void {
    switch (evt.type) {
      case 'MoveLeft':
        this.tryShift(-1);
        break;
      case 'MoveRight':
        this.tryShift(1);
        break;
      case 'RotateCW':
        this.tryRotate(+1);
        break;
      case 'RotateCCW':
        this.tryRotate(-1);
        break;
      case 'Rotate180':
        if (this.s.config.allow180) this.tryRotate(+2);
        break;
      case 'SoftDropStart':
        this.s.softDropping = true;
        break;
      case 'SoftDropStop':
        this.s.softDropping = false;
        break;
      case 'HardDrop':
        this.hardDrop();
        break;
      case 'Hold':
        this.holdSwap();
        break;
    }
  }

  private fixedUpdate(dtMs: number): void {
    // Gravity progression
    const baseCps = this.lookupGravityCps(this.s.level);
    const cps = this.s.softDropping ? baseCps * 20 : baseCps;
    const cellsToDrop = this.advanceGravity(dtMs, cps);
    for (let i = 0; i < cellsToDrop; i++) this.gravityStep();

    // Lock countdown
    if (this.s.lockMsLeft !== null) {
      this.s.lockMsLeft -= dtMs;
      if (this.s.lockMsLeft <= 0) this.lockActive();
    }
  }

  private lookupGravityCps(level: number): number {
    const table = this.s.config.gravityTable;
    const keys = Object.keys(table)
      .map((k) => parseInt(k, 10))
      .sort((a, b) => a - b);
    let last = 1;
    for (const k of keys) {
      if (level >= k) last = table[k]!;
    }
    return last;
  }

  private advanceGravity(dtMs: number, cps: number): number {
    const cellsPerMs = cps / 1000;
    const cellsFloat = cellsPerMs * dtMs;
    // accumulate fractional cells in accumulatorMs low bits? Keep simple for M1: round down
    let drop = 0;
    this._gravFrac = (this._gravFrac ?? 0) + cellsFloat;
    while (this._gravFrac >= 1) {
      drop++;
      this._gravFrac -= 1;
    }
    return drop;
  }
  private _gravFrac = 0;

  private gravityStep(): void {
    const a = this.s.active!;
    const nextPos = { x: a.position.x, y: a.position.y + 1 };
    if (!collides(this.s.spec, this.s.grid, a.id, a.rotation, nextPos)) {
      this.s.active = { ...a, position: nextPos };
      // moving off ground cancels lock timer
      this.s.lockMsLeft = null;
      if (this.s.softDropping) this.s.softDropCells += 1;
      return;
    }
    // Grounded
    if (this.s.lockMsLeft === null) this.s.lockMsLeft = this.s.config.lockDelayMs;
  }

  private tryShift(dx: number): void {
    const a = this.s.active!;
    const pos = { x: a.position.x + dx, y: a.position.y };
    if (!collides(this.s.spec, this.s.grid, a.id, a.rotation, pos)) {
      this.s.active = { ...a, position: pos };
      this.resetLockTimerOnMove();
      this.s.events.push({ type: 'PieceMoved' });
    }
  }

  private tryRotate(delta: number): void {
    const a = this.s.active!;
    const to = applyRotation(a.rotation, delta);
    const kicks = getKickTable(a.id)[`${a.rotation}-${to}` as const] ?? [{ x: 0, y: 0 }];
    for (const k of kicks) {
      const pos = { x: a.position.x + k.x, y: a.position.y + k.y };
      if (!collides(this.s.spec, this.s.grid, a.id, to, pos)) {
        this.s.active = { id: a.id, rotation: to, position: pos };
        this.resetLockTimerOnMove();
        this.s.events.push({ type: 'PieceRotated' });
        return;
      }
    }
    // No rotation if all kicks fail
  }

  private hardDrop(): void {
    let a = this.s.active!;
    for (;;) {
      const pos = { x: a.position.x, y: a.position.y + 1 };
      if (collides(this.s.spec, this.s.grid, a.id, a.rotation, pos)) break;
      a = { ...a, position: pos };
      this.s.hardDropCells += 1;
    }
    this.s.active = a;
    this.s.events.push({ type: 'HardDropped' });
    this.lockActive();
  }

  private holdSwap(): void {
    if (!this.s.canHold || !this.s.active) return;
    const currentId = this.s.active.id;
    const taken = this.s.hold;
    this.s.hold = currentId;
    this.s.canHold = false;
    if (taken) {
      // spawn held piece
      this.spawnSpecific(taken, /*resetHold*/ false);
    } else {
      // spawn next
      this.spawnNext(/*resetHold*/ false);
    }
  }

  private spawnNext(resetHold: boolean = true): void {
    // ensure queue has at least one to consume
    this.fillQueue();
    const id = this.s.queue.shift()!;
    this.spawnSpecific(id, resetHold);
  }

  private spawnSpecific(id: TetrominoId, resetHold: boolean = true): void {
    const spawnPos = this.spawnPosition(id);
    const rotation: Rotation = 0;
    const a: PieceState = { id, position: spawnPos, rotation };
    if (collides(this.s.spec, this.s.grid, id, rotation, spawnPos)) {
      this.s.events.push({ type: 'GameOver' });
      this.s.active = null;
      return;
    }
    this.s.active = a;
    this.s.lockMsLeft = null;
    this.s.lockResetsUsed = 0;
    if (resetHold) this.s.canHold = true;
    // reset per-piece drop counters
    this.s.softDropCells = 0;
    this.s.hardDropCells = 0;
    this.s.events.push({ type: 'PieceSpawned', id });
  }

  private spawnPosition(id: TetrominoId): Vec2 {
    const width = this.s.spec.width;
    // SRS spawn at top-center; use y = bufferRows - 1 to allow overhang
    const y = 0; // top row of combined buffer+visible space
    const x = Math.floor(width / 2);
    // Center adjustment for I and O pieces per SRS spawn conventions
    if (id === 'I') return { x: x - 2, y };
    if (id === 'O') return { x: x - 1, y };
    return { x: x - 1, y };
  }

  private fillQueue(): void {
    while (this.s.queue.length < this.s.config.showNext + 1) {
      this.s.queue.push(this.s.bag.next());
    }
  }

  private resetLockTimerOnMove(): void {
    // Only if active piece is grounded should this count as a reset
    if (!this.s.active) return;
    const below = { x: this.s.active.position.x, y: this.s.active.position.y + 1 };
    const grounded = collides(
      this.s.spec,
      this.s.grid,
      this.s.active.id,
      this.s.active.rotation,
      below,
    );
    if (grounded) {
      if (this.s.lockResetsUsed < this.s.config.maxLockResets) {
        this.s.lockMsLeft = this.s.config.lockDelayMs;
        this.s.lockResetsUsed++;
      }
    }
  }

  private lockActive(): void {
    const a = this.s.active;
    if (!a) return;
    // If piece is not actually grounded, ignore (can happen if timer elapsed but moved up)
    const below = { x: a.position.x, y: a.position.y + 1 };
    if (!collides(this.s.spec, this.s.grid, a.id, a.rotation, below)) {
      this.s.lockMsLeft = null;
      return;
    }
    place(this.s.spec, this.s.grid, a.id, a.rotation, a.position);
    this.s.events.push({ type: 'Locked' });
    this.s.active = null;
    this.s.lockMsLeft = null;
    this.s.lockResetsUsed = 0;
    // Clear lines
    const rows = clearFullRows(this.s.spec, this.s.grid);
    // Scoring and metrics
    this.applyScoring(rows.length);
    if (rows.length > 0)
      this.s.events.push({ type: 'LinesCleared', count: rows.length, rows, b2b: this.s.b2b, combo: Math.max(0, this.s.combo) });
    // After a lock, the next spawn should re-enable hold
    this.spawnNext(/*resetHold*/ true);
  }

  /** Apply scoring, combo, b2b, and level progression for a lock event. */
  private applyScoring(linesCleared: number): void {
    const sc = this.s.config.scoring;
    let base = 0;
    if (linesCleared === 1) base = sc.single;
    else if (linesCleared === 2) base = sc.double;
    else if (linesCleared === 3) base = sc.triple;
    else if (linesCleared === 4) base = sc.tetris;

    // B2B handling (only for Tetris in M3)
    if (linesCleared === 4) {
      base = Math.round(base * (this.s.b2b ? sc.b2bMultiplier : 1));
      this.s.b2b = true;
    } else if (linesCleared > 0) {
      this.s.b2b = false;
    }

    // Combo handling
    if (linesCleared > 0) this.s.combo = this.s.combo + 1;
    else this.s.combo = -1;
    const comboBonus = this.s.combo > 0 ? sc.comboBase * this.s.combo : 0;

    // Drop bonuses (per piece)
    const dropBonus = this.s.softDropCells * sc.softPerCell + this.s.hardDropCells * sc.hardPerCell;

    const delta = base + comboBonus + dropBonus;
    if (delta !== 0) {
      this.s.score += delta;
      this.s.events.push({ type: 'ScoreChanged', delta, score: this.s.score });
    }

    // Lines + level
    this.s.linesClearedTotal += linesCleared;
    const newLevel = Math.floor(this.s.linesClearedTotal / sc.levelLines);
    if (newLevel !== this.s.level) {
      this.s.level = newLevel;
      this.s.events.push({ type: 'LevelChanged', level: this.s.level });
    }
  }

  private computeGhost(a: PieceState): Vec2[] {
    let y = a.position.y;
    for (;;) {
      const pos = { x: a.position.x, y: y + 1 };
      if (collides(this.s.spec, this.s.grid, a.id, a.rotation, pos)) break;
      y++;
    }
    const cells = TETROMINO_SHAPES[a.id][a.rotation];
    return cells.map((c) => ({ x: a.position.x + c.x, y: y + c.y }));
  }
}

/**
 * Factory to create an Engine instance.
 */
export function createEngine(config?: Partial<EngineConfig>, seed?: number): Engine {
  return new Engine(config, seed);
}
