/**
 * Effects module implementing lightweight UI juice for the canvas renderer.
 *
 * Provides a small scheduler for time-based visual effects that are triggered by
 * engine events (LinesCleared, PieceSpawned). Effects are drawn during the same
 * canvas pass in the renderer to avoid additional React renders.
 */

import type { Snapshot, TetrominoId, Vec2 } from '@tetris/core';
import { TETROMINO_SHAPES } from '@tetris/core';
import type { Palette } from '../renderer/colors';
import { colorForCellWithPalette } from '../renderer/colors';
import { computeBoardLayout } from '../renderer/layout';

/** A line flash effect highlighting cleared rows for a short duration. */
interface LineFlashEffect {
  kind: 'line-flash';
  /** Absolute start time in ms. */
  start: number;
  /** Duration in ms. */
  duration: number;
  /** Visible row indices (0..visible-1). */
  rows: number[];
}

/** A small scale-in pop for the newly spawned active piece. */
interface SpawnPopEffect {
  kind: 'spawn-pop';
  start: number;
  duration: number;
  /** Piece id to pop; used for color. */
  id: TetrominoId;
  /** Spawn position in absolute board coords (including buffer rows). */
  position: Vec2;
  rotation: 0 | 1 | 2 | 3;
}

/** Minimal particle burst on Tetris (optional, disabled on mobile). */
interface ParticleEffect {
  kind: 'particles';
  start: number;
  duration: number;
  /** Centered around cleared rows and board width. */
  rows: number[];
}

type Effect = LineFlashEffect | SpawnPopEffect | ParticleEffect;

/**
 * EffectScheduler stores transient effects and renders them when asked.
 */
export class EffectScheduler {
  private effects: Effect[] = [];
  private enabled = true;
  private allowParticles = false;

  /**
   * Enable/disable all effects (e.g., settings.animations).
   */
  setEnabled(v: boolean): void {
    this.enabled = v;
    if (!v) this.effects = [];
  }

  /**
   * Enable optional particles (auto-disabled on mobile or reduced motion).
   */
  setAllowParticles(v: boolean): void {
    this.allowParticles = v;
  }

  /** Trigger a line flash effect for the given cleared rows. */
  onLinesCleared(rows: number[], now: number): void {
    if (!this.enabled) return;
    // Clamp to visible-space rows handled in renderer; store as given
    this.effects.push({ kind: 'line-flash', start: now, duration: 120, rows: [...rows] });
    // If four lines (Tetris): spawn subtle particles if allowed
    if (this.allowParticles && rows.length === 4) {
      this.effects.push({ kind: 'particles', start: now, duration: 300, rows: [...rows] });
    }
  }

  /** Trigger a small scale-in pop on piece spawn. */
  onPieceSpawned(id: TetrominoId, position: Vec2, rotation: number, now: number): void {
    if (!this.enabled) return;
    this.effects.push({
      kind: 'spawn-pop',
      start: now,
      duration: 120,
      id,
      position,
      rotation: (rotation & 3) as 0 | 1 | 2 | 3,
    });
  }

  /**
   * Render active effects to the canvas, removing any that have expired.
   * Draws in board space using the provided snapshot and palette.
   */
  render(ctx: CanvasRenderingContext2D, snapshot: Snapshot, palette: Palette, now: number): void {
    if (!this.enabled || this.effects.length === 0) return;

    // Purge expired while iterating using index filter
    const stillActive: Effect[] = [];

    const layout = computeBoardLayout(
      ctx.canvas.width / (ctx.getTransform().a || 1),
      ctx.canvas.height / (ctx.getTransform().d || 1),
      snapshot.width,
      snapshot.heightVisible,
      0,
    );

    for (const eff of this.effects) {
      const t = now - eff.start;
      if (t < 0 || t > eff.duration) continue; // draw only active window; drop later
      // Normalize 0..1
      const u = Math.max(0, Math.min(1, t / eff.duration));

      switch (eff.kind) {
        case 'line-flash': {
          // Flash intensity: quick ease-out from 0.6 -> 0
          const alpha = (1 - u) * 0.6;
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = alpha;
          for (const r of eff.rows) {
            const y = r - snapshot.bufferRows; // convert to visible-space index
            if (y < 0 || y >= snapshot.heightVisible) continue;
            ctx.fillRect(
              layout.ox + 1,
              layout.oy + y * layout.cell + 1,
              layout.bw - 2,
              layout.cell - 2,
            );
          }
          ctx.restore();
          break;
        }
        case 'spawn-pop': {
          if (!snapshot.active) break;
          // Scale from 1.12 -> 1.0, ease-out cubic
          const ease = 1 - Math.pow(1 - u, 3);
          const scale = 1.12 - ease * 0.12;
          // Draw a scaled overlay of the active piece on top
          const id = eff.id;
          const offs = TETROMINO_SHAPES[id][eff.rotation];
          const color = colorForCellWithPalette(
            id === 'I' ? 1 : id === 'O' ? 2 : id === 'T' ? 3 : id === 'S' ? 4 : id === 'Z' ? 5 : id === 'J' ? 6 : 7,
            palette,
          );
          // Compute visual-space center of the active piece
          let minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity;
          for (const o of offs) {
            const ax = eff.position.x + o.x;
            const ay = eff.position.y + o.y;
            minX = Math.min(minX, ax);
            maxX = Math.max(maxX, ax);
            minY = Math.min(minY, ay);
            maxY = Math.max(maxY, ay);
          }
          // Convert to visible space (subtract bufferRows)
          minY -= snapshot.bufferRows;
          maxY -= snapshot.bufferRows;
          const cx = layout.ox + ((minX + maxX + 1) / 2) * layout.cell;
          const cy = layout.oy + ((minY + maxY + 1) / 2) * layout.cell;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.scale(scale, scale);
          ctx.translate(-cx, -cy);
          for (const o of offs) {
            const ax = eff.position.x + o.x;
            const ay = eff.position.y + o.y - snapshot.bufferRows;
            if (ay < 0) continue;
            ctx.globalAlpha = 0.9; // slightly translucent overlay
            ctx.fillStyle = color;
            ctx.fillRect(
              layout.ox + ax * layout.cell + 1,
              layout.oy + ay * layout.cell + 1,
              layout.cell - 2,
              layout.cell - 2,
            );
          }
          ctx.restore();
          break;
        }
        case 'particles': {
          // Very lightweight: draw a few fading squares across the cleared rows
          const alpha = (1 - u) * 0.4;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = palette.grid;
          for (const r of eff.rows) {
            const y = r - snapshot.bufferRows;
            if (y < 0 || y >= snapshot.heightVisible) continue;
            // 6 small squares spaced across the row
            const count = 6;
            for (let i = 0; i < count; i++) {
              const px = layout.ox + ((i + 0.5) * layout.bw) / count;
              const py = layout.oy + y * layout.cell + layout.cell / 2;
              const size = 2 + (1 - u) * 2;
              // Alternate drift up/down slightly
              const dy = ((i % 2 === 0 ? -1 : 1) * u * layout.cell) / 6;
              ctx.fillRect(px - size / 2, py + dy - size / 2, size, size);
            }
          }
          ctx.restore();
          break;
        }
      }

      stillActive.push(eff);
    }

    this.effects = stillActive;
  }
}
