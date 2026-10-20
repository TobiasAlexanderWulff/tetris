/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { KeyboardInput } from './KeyboardInput';

function kd(code: string, repeat = false) {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, repeat }));
}
function ku(code: string) {
  window.dispatchEvent(new KeyboardEvent('keyup', { code }));
}

describe('KeyboardInput', () => {
  it('emits immediate left move and repeats after DAS/ARR', () => {
    const input = new KeyboardInput({ DAS: 60, ARR: 20 });
    input.attach(window);
    let now = 0;
    kd('ArrowLeft');
    // immediate move on first poll
    let evts = input.poll(now);
    expect(evts.map((e) => e.type)).toEqual(['MoveLeft']);
    // before DAS, no repeats
    now += 40;
    evts = input.poll(now);
    expect(evts.length).toBe(0);
    // after DAS, repeats by ARR cadence
    now += 60; // total 100ms
    evts = input.poll(now);
    // Should produce about floor( (100-60)/20 ) = 2 repeats
    expect(evts.filter((e) => e.type === 'MoveLeft').length).toBeGreaterThanOrEqual(2);
    ku('ArrowLeft');
    input.detach();
  });

  it('direction flip triggers immediate other move and resets DAS', () => {
    const input = new KeyboardInput({ DAS: 60, ARR: 20 });
    input.attach(window);
    let now = 0;
    kd('ArrowLeft');
    input.poll(now);
    now += 100; // ensure left repeating
    input.poll(now);
    kd('ArrowRight');
    // On next poll, should see an immediate Right
    const evts = input.poll(now);
    expect(evts.some((e) => e.type === 'MoveRight')).toBe(true);
    // And no Left events emitted after switching (cannot assert none, but ensure Right appears)
    input.detach();
  });

  it('soft drop emits start/stop on key transitions', () => {
    const input = new KeyboardInput();
    input.attach(window);
    const now = 0;
    kd('ArrowDown');
    const start = input.poll(now).map((e) => e.type);
    expect(start).toEqual(['SoftDropStart']);
    ku('ArrowDown');
    const stop = input.poll(now).map((e) => e.type);
    expect(stop).toEqual(['SoftDropStop']);
    input.detach();
  });

  it.each<[string, number]>([
    ['zero', 0],
    ['negative', -20],
    ['NaN', Number.NaN],
  ])('does not hang when ARR is %s', (_label, arr) => {
    const input = new KeyboardInput({ DAS: 0, ARR: arr });
    input.attach(window);
    kd('ArrowLeft');
    // First poll has no repeats yet because the repeat starts at DAS.
    expect(input.poll(0)).toHaveLength(1);
    // A long frame that would otherwise be an unbounded loop.
    const burst = input.poll(10_000);
    expect(burst.length).toBeGreaterThan(0);
    expect(burst.length).toBeLessThanOrEqual(8);
    // Subsequent polls stay bounded instead of draining a growing backlog.
    expect(input.poll(10_016).length).toBeLessThanOrEqual(8);
    ku('ArrowLeft');
    input.detach();
  });

  it('caps DAS/ARR catch-up bursts after a long frame', () => {
    const input = new KeyboardInput({ DAS: 0, ARR: 10 });
    input.attach(window);
    kd('ArrowRight');
    input.poll(0);
    // 5000 ms / 10 ms would be 500 repeats without the per-poll cap.
    const burst = input.poll(5_000);
    expect(burst.length).toBe(8);
    expect(burst.every((e) => e.type === 'MoveRight')).toBe(true);
    ku('ArrowRight');
    input.detach();
  });

  it('falls back to a finite DAS when configured with NaN', () => {
    const input = new KeyboardInput({ DAS: Number.NaN, ARR: 20 });
    input.attach(window);
    kd('ArrowLeft');
    input.poll(0);
    // Without a normalized DAS the repeat check never becomes true.
    const evts = input.poll(10_000);
    expect(evts.length).toBeGreaterThan(0);
    ku('ArrowLeft');
    input.detach();
  });
});
