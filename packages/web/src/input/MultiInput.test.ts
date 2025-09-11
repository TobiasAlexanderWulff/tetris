import { describe, it, expect } from 'vitest';
import type { InputEvent } from '@tetris/core';
import type { IInputSource } from '../game/types';
import { MultiInput } from './MultiInput';

class StubInput implements IInputSource {
  constructor(private events: InputEvent[] = []) {}
  attach(): void {}
  detach(): void {}
  poll(): InputEvent[] { return this.events.splice(0); }
  reset(): void { this.events = []; }
  push(e: InputEvent): void { this.events.push(e); }
}

describe('MultiInput', () => {
  it('concatenates events from all children', () => {
    const a = new StubInput([{ type: 'MoveLeft', at: 1 } as InputEvent]);
    const b = new StubInput([{ type: 'RotateCW', at: 1 } as InputEvent]);
    const mi = new MultiInput([a, b]);
    const out = mi.poll(1000);
    expect(out.map((e) => e.type)).toEqual(['MoveLeft', 'RotateCW']);
  });

  it('forwards reset to children', () => {
    const a = new StubInput([{ type: 'MoveLeft', at: 1 } as InputEvent]);
    const b = new StubInput([{ type: 'RotateCW', at: 1 } as InputEvent]);
    const mi = new MultiInput([a, b]);
    mi.reset();
    expect(mi.poll(0)).toEqual([]);
  });
});

