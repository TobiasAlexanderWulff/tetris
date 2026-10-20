/* @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebAudioAdapter } from './WebAudioAdapter';
import type { AudioManifest } from './types';

/** Minimal fake AudioParam recording scheduled automation. */
class FakeParam {
  value = 1;
  scheduled: Array<{ type: 'set' | 'ramp'; value: number; time: number }> = [];
  cancelScheduledValues(): void {
    this.scheduled = [];
  }
  setValueAtTime(value: number, time: number): void {
    this.value = value;
    this.scheduled.push({ type: 'set', value, time });
  }
  linearRampToValueAtTime(value: number, time: number): void {
    this.scheduled.push({ type: 'ramp', value, time });
  }
}

class FakeGainNode {
  gain = new FakeParam();
  disconnected = 0;
  connect(): void {
    /* graph wiring is irrelevant for these tests */
  }
  disconnect(): void {
    this.disconnected += 1;
  }
}

class FakeBufferSource {
  buffer: AudioBuffer | null = null;
  loop = false;
  loopStart = 0;
  loopEnd = 0;
  onended: (() => void) | null = null;
  stopCalls = 0;
  disconnected = 0;
  starts: Array<{ when: number; offset: number }> = [];
  connect(): void {
    /* graph wiring is irrelevant for these tests */
  }
  disconnect(): void {
    this.disconnected += 1;
  }
  start(when = 0, offset = 0): void {
    this.starts.push({ when, offset });
  }
  stop(): void {
    this.stopCalls += 1;
  }
}

class FakeAudioContext {
  currentTime = 0;
  state: AudioContextState = 'running';
  destination = {} as AudioDestinationNode;
  gains: FakeGainNode[] = [];
  sources: FakeBufferSource[] = [];

  createGain(): GainNode {
    const gain = new FakeGainNode();
    this.gains.push(gain);
    return gain as unknown as GainNode;
  }

  createBufferSource(): AudioBufferSourceNode {
    const source = new FakeBufferSource();
    this.sources.push(source);
    return source as unknown as AudioBufferSourceNode;
  }

  async resume(): Promise<void> {
    /* no-op */
  }

  async decodeAudioData(): Promise<AudioBuffer> {
    return {} as AudioBuffer;
  }
}

const manifest: AudioManifest = {
  sfx: {},
  music: {
    menu: { url: '/menu.ogg', gain: 0.4, loop: true },
    theme: { url: '/theme.ogg', gain: 0.7, loop: true },
  },
};

let ctx: FakeAudioContext;
let originalAudioContext: unknown;

beforeEach(() => {
  ctx = new FakeAudioContext();
  originalAudioContext = (window as unknown as { AudioContext?: unknown }).AudioContext;
  Object.defineProperty(window, 'AudioContext', {
    configurable: true,
    writable: true,
    value: class extends FakeAudioContext {
      constructor() {
        super();
        ctx = this as FakeAudioContext;
      }
    },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ arrayBuffer: async () => new ArrayBuffer(8) })),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  Object.defineProperty(window, 'AudioContext', {
    configurable: true,
    writable: true,
    value: originalAudioContext,
  });
});

/** Preload the manifest and return an adapter backed by the fake context. */
async function createAdapter(): Promise<WebAudioAdapter> {
  const adapter = new WebAudioAdapter();
  await adapter.preload(manifest);
  return adapter;
}

describe('WebAudioAdapter music transitions', () => {
  it('keeps the previous track playing until the crossfade finishes', async () => {
    vi.useFakeTimers();
    const adapter = await createAdapter();
    adapter.startMusic('menu', {});
    const prev = ctx.sources[0]!;

    adapter.crossfade('theme', 0.5);

    // The old source must not be cut off when the new track starts.
    expect(prev.stopCalls).toBe(0);
    expect(prev.disconnected).toBe(0);

    vi.advanceTimersByTime(500);
    expect(prev.stopCalls).toBe(0);
    vi.advanceTimersByTime(40);
    expect(prev.stopCalls).toBe(1);
  });

  it('ramps both tracks and honors the per-track gain', async () => {
    vi.useFakeTimers();
    const adapter = await createAdapter();
    adapter.startMusic('menu', {});
    const prevGain = ctx.gains[3]!;

    adapter.crossfade('theme', 0.5);
    const nextGain = ctx.gains[4]!;

    expect(nextGain.gain.scheduled).toEqual(
      expect.arrayContaining([{ type: 'ramp', value: 0.7, time: 0.5 }]),
    );
    expect(prevGain.gain.scheduled).toEqual(
      expect.arrayContaining([{ type: 'ramp', value: 0, time: 0.5 }]),
    );
  });

  it('startMusic still replaces the current track immediately', async () => {
    const adapter = await createAdapter();
    adapter.startMusic('menu', {});
    const prev = ctx.sources[0]!;

    adapter.startMusic('theme', {});

    expect(prev.stopCalls).toBe(1);
    expect(ctx.sources).toHaveLength(2);
  });

  it('ignores unknown tracks without stopping the current music', async () => {
    const adapter = await createAdapter();
    adapter.startMusic('menu', {});
    const prev = ctx.sources[0]!;

    adapter.startMusic('missing', {});
    adapter.crossfade('missing', 0.5);

    expect(prev.stopCalls).toBe(0);
    expect(ctx.sources).toHaveLength(1);
  });
});
