/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MouseInput } from './MouseInput';

// Minimal PointerEvent polyfill for jsdom
// JSDOM may not provide PointerEvent in this environment
if (typeof (globalThis as unknown as { PointerEvent?: unknown }).PointerEvent === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error - define global PointerEvent for tests
  globalThis.PointerEvent = class PointerEvent extends MouseEvent {
    constructor(type: string, eventInitDict?: MouseEventInit) {
      super(type, eventInitDict);
    }
  } as unknown as typeof PointerEvent;
}

function makeCanvas(): HTMLDivElement {
  const el = document.createElement('div');
  // Provide deterministic size for layout (10x20 → 20px cell if 200x400)
  Object.defineProperty(el, 'getBoundingClientRect', {
    value: () => ({ left: 0, top: 0, right: 200, bottom: 400, width: 200, height: 400, x: 0, y: 0, toJSON: () => '' }),
  });
  document.body.appendChild(el);
  return el;
}

describe('MouseInput', () => {
  let el: HTMLDivElement;
  beforeEach(() => {
    document.body.innerHTML = '';
    el = makeCanvas();
  });

  it('emits horizontal moves based on pointer delta', () => {
    const mi = new MouseInput({ enabled: true, allow180: false, deadzonePx: 0 });
    mi.attach(el);
    // Move from x=0 to x=45 across 20px cell → 2 right moves
    el.dispatchEvent(new PointerEvent('pointermove', { clientX: 0, clientY: 10, bubbles: true }));
    el.dispatchEvent(new PointerEvent('pointermove', { clientX: 45, clientY: 10, bubbles: true }));
    const evts = mi.poll(1000);
    expect(evts.map((e) => e.type)).toEqual(['MoveRight', 'MoveRight']);
  });

  it('emits rotations on wheel', () => {
    const mi = new MouseInput({ enabled: true, allow180: false });
    mi.attach(el);
    const prevent = vi.fn();
    const up = new WheelEvent('wheel', { deltaY: -53, bubbles: true, cancelable: true });
    Object.defineProperty(up, 'preventDefault', { value: prevent });
    el.dispatchEvent(up);
    const down = new WheelEvent('wheel', { deltaY: 53, bubbles: true, cancelable: true });
    Object.defineProperty(down, 'preventDefault', { value: prevent });
    el.dispatchEvent(down);
    const evts = mi.poll(1100);
    expect(evts.map((e) => e.type)).toEqual(['RotateCCW', 'RotateCW']);
    expect(prevent).toHaveBeenCalled();
  });

  it('no extra baseline threshold away from edges', () => {
    const mi = new MouseInput({ enabled: true, allow180: false, deadzonePx: 0 });
    mi.attach(el);
    // Piece width matters only for edge guard; set to 3
    mi.armStartDragThresholdForPiece(3);
    // Start well inside the board, away from guards
    el.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 10, bubbles: true }));
    // Move by 25px → 1 step right (20px per cell)
    el.dispatchEvent(new PointerEvent('pointermove', { clientX: 125, clientY: 10, bubbles: true }));
    const evts = mi.poll(1050);
    expect(evts.map((e) => e.type)).toEqual(['MoveRight']);
  });

  it('ignores movement until cursor passes board edge + half piece width on re-entry', () => {
    const mi = new MouseInput({ enabled: true, allow180: false, deadzonePx: 0 });
    mi.attach(el);
    // Active piece is 3-wide → half = 1.5 cells = 30px guard from edges
    mi.armStartDragThresholdForPiece(3);
    // Move outside left first → triggers out-of-bounds reset
    el.dispatchEvent(new PointerEvent('pointermove', { clientX: -10, clientY: 10, bubbles: true }));
    // Enter inside but still within half-piece guard (25px < 30px)
    el.dispatchEvent(new PointerEvent('pointermove', { clientX: 25, clientY: 10, bubbles: true }));
    expect(mi.poll(2000)).toEqual([]);
    // Move deeper inside across guard to 65px; baseline within guard means 40px → 2 steps
    el.dispatchEvent(new PointerEvent('pointermove', { clientX: 65, clientY: 10, bubbles: true }));
    const evts = mi.poll(2010);
    expect(evts.map((e) => e.type)).toEqual(['MoveRight', 'MoveRight']);
  });

  it('emits 180° on middle click only if allowed', () => {
    const mi = new MouseInput({ enabled: true, allow180: false });
    mi.attach(el);
    el.dispatchEvent(new PointerEvent('pointerdown', { button: 1, bubbles: true }));
    expect(mi.poll(1200)).toEqual([]);
    mi.updateConfig({ allow180: true });
    el.dispatchEvent(new PointerEvent('pointerdown', { button: 1, bubbles: true }));
    const evts = mi.poll(1201);
    expect(evts.map((e) => e.type)).toEqual(['Rotate180']);
  });

  it('soft drop starts/stops on right press/release', () => {
    const mi = new MouseInput({ enabled: true, allow180: false });
    mi.attach(el);
    el.dispatchEvent(new PointerEvent('pointerdown', { button: 2, bubbles: true }));
    let evts = mi.poll(1300);
    expect(evts.map((e) => e.type)).toEqual(['SoftDropStart']);
    el.dispatchEvent(new PointerEvent('pointerup', { button: 2, bubbles: true }));
    evts = mi.poll(1301);
    expect(evts.map((e) => e.type)).toEqual(['SoftDropStop']);
  });

  it('left+right chord emits hold and suppresses singles', async () => {
    const mi = new MouseInput({ enabled: true, allow180: true });
    mi.attach(el);
    // Left down, then right down within chord window
    el.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true }));
    el.dispatchEvent(new PointerEvent('pointerdown', { button: 2, bubbles: true }));
    const evts = mi.poll(1400);
    expect(evts.map((e) => e.type)).toEqual(['Hold']);
  });
});
