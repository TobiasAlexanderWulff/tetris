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
});
