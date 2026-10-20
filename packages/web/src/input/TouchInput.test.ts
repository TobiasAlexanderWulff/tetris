/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import { TouchInput } from './TouchInput';

function makeBoard(): HTMLDivElement {
  const element = document.createElement('div');
  Object.defineProperty(element, 'getBoundingClientRect', {
    value: () => ({
      left: 0,
      top: 0,
      right: 200,
      bottom: 400,
      width: 200,
      height: 400,
      x: 0,
      y: 0,
      toJSON: () => '',
    }),
  });
  document.body.appendChild(element);
  return element;
}

function pointer(
  type: string,
  init: {
    clientX: number;
    clientY: number;
    pointerId?: number;
    pointerType?: string;
    timeStamp?: number;
  },
): PointerEvent {
  const event = new MouseEvent(type, {
    clientX: init.clientX,
    clientY: init.clientY,
    bubbles: true,
    cancelable: true,
  }) as PointerEvent;
  Object.defineProperties(event, {
    pointerId: { value: init.pointerId ?? 1 },
    pointerType: { value: init.pointerType ?? 'touch' },
    timeStamp: { value: init.timeStamp ?? 0 },
  });
  return event;
}

describe('TouchInput', () => {
  let board: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    board = makeBoard();
  });

  it('emits horizontal cell steps and retains partial-cell distance', () => {
    const input = new TouchInput({ enabled: true });
    input.setBoundsElement(board);
    input.attach(board);

    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100 }));
    board.dispatchEvent(pointer('pointermove', { clientX: 125, clientY: 100 }));
    expect(input.poll(10).map((event) => event.type)).toEqual(['MoveRight']);

    board.dispatchEvent(pointer('pointermove', { clientX: 141, clientY: 100 }));
    expect(input.poll(20).map((event) => event.type)).toEqual(['MoveRight']);

    board.dispatchEvent(pointer('pointermove', { clientX: 79, clientY: 100 }));
    expect(input.poll(30).map((event) => event.type)).toEqual(['MoveLeft', 'MoveLeft', 'MoveLeft']);
  });

  it('starts soft drop after one downward cell and stops on release', () => {
    const input = new TouchInput({ enabled: true });
    input.setBoundsElement(board);
    input.attach(board);

    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100 }));
    board.dispatchEvent(pointer('pointermove', { clientX: 100, clientY: 119 }));
    expect(input.poll(10)).toEqual([]);

    board.dispatchEvent(pointer('pointermove', { clientX: 100, clientY: 120 }));
    expect(input.poll(20).map((event) => event.type)).toEqual(['SoftDropStart']);

    board.dispatchEvent(pointer('pointerup', { clientX: 100, clientY: 120 }));
    expect(input.poll(30).map((event) => event.type)).toEqual(['SoftDropStop']);
  });

  it('stops soft drop on cancel, reset, and detach', () => {
    const input = new TouchInput({ enabled: true });
    input.setBoundsElement(board);
    input.attach(board);

    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100 }));
    board.dispatchEvent(pointer('pointermove', { clientX: 100, clientY: 121 }));
    input.poll(10);
    board.dispatchEvent(pointer('pointercancel', { clientX: 100, clientY: 121 }));
    expect(input.poll(20).map((event) => event.type)).toEqual(['SoftDropStop']);

    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100 }));
    board.dispatchEvent(pointer('pointermove', { clientX: 100, clientY: 121 }));
    input.poll(30);
    input.reset();
    expect(input.poll(40).map((event) => event.type)).toEqual(['SoftDropStop']);

    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100 }));
    board.dispatchEvent(pointer('pointermove', { clientX: 100, clientY: 121 }));
    input.poll(50);
    input.detach();
    expect(input.poll(60).map((event) => event.type)).toEqual(['SoftDropStop']);
  });

  it('ignores mouse pointers, additional fingers, and touches outside the board', () => {
    const input = new TouchInput({ enabled: true });
    input.setBoundsElement(board);
    input.attach(board);

    board.dispatchEvent(
      pointer('pointerdown', {
        clientX: 100,
        clientY: 100,
        pointerType: 'mouse',
      }),
    );
    board.dispatchEvent(
      pointer('pointermove', {
        clientX: 140,
        clientY: 100,
        pointerType: 'mouse',
      }),
    );
    board.dispatchEvent(pointer('pointerdown', { clientX: 220, clientY: 100 }));
    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100, pointerId: 1 }));
    board.dispatchEvent(pointer('pointermove', { clientX: 140, clientY: 100, pointerId: 2 }));

    expect(input.poll(10)).toEqual([]);
  });

  it('queues button actions while enabled and filters disabled 180 degree rotation', () => {
    const input = new TouchInput({ enabled: true, allow180: false });

    input.triggerAction('Hold');
    input.triggerAction('RotateCCW');
    input.triggerAction('RotateCW');
    input.triggerAction('Rotate180');
    input.triggerAction('HardDrop');

    expect(input.poll(10).map((event) => event.type)).toEqual([
      'Hold',
      'RotateCCW',
      'RotateCW',
      'HardDrop',
    ]);

    input.updateConfig({ enabled: false, allow180: true });
    input.triggerAction('Rotate180');
    expect(input.poll(20)).toEqual([]);
  });

  it('rotates counterclockwise for a left-board tap and clockwise for a right-board tap', () => {
    const input = new TouchInput({ enabled: true });
    input.setBoundsElement(board);
    input.attach(board);

    board.dispatchEvent(pointer('pointerdown', { clientX: 40, clientY: 100, timeStamp: 100 }));
    board.dispatchEvent(pointer('pointerup', { clientX: 40, clientY: 100, timeStamp: 400 }));
    board.dispatchEvent(pointer('pointerdown', { clientX: 160, clientY: 100, timeStamp: 500 }));
    board.dispatchEvent(pointer('pointerup', { clientX: 160, clientY: 100, timeStamp: 799 }));

    expect(input.poll(10).map((event) => event.type)).toEqual(['RotateCCW', 'RotateCW']);
  });

  it('requires tap release within 300 milliseconds', () => {
    const input = new TouchInput({ enabled: true });
    input.setBoundsElement(board);
    input.attach(board);

    board.dispatchEvent(pointer('pointerdown', { clientX: 40, clientY: 100, timeStamp: 100 }));
    board.dispatchEvent(pointer('pointerup', { clientX: 40, clientY: 100, timeStamp: 401 }));

    expect(input.poll(10)).toEqual([]);
  });

  it('requires movement to remain below half a cell', () => {
    const input = new TouchInput({ enabled: true });
    input.setBoundsElement(board);
    input.attach(board);

    board.dispatchEvent(pointer('pointerdown', { clientX: 40, clientY: 100, timeStamp: 100 }));
    board.dispatchEvent(pointer('pointermove', { clientX: 49.9, clientY: 100, timeStamp: 150 }));
    board.dispatchEvent(pointer('pointerup', { clientX: 49.9, clientY: 100, timeStamp: 200 }));
    expect(input.poll(10).map((event) => event.type)).toEqual(['RotateCCW']);

    board.dispatchEvent(pointer('pointerdown', { clientX: 40, clientY: 100, timeStamp: 300 }));
    board.dispatchEvent(pointer('pointermove', { clientX: 50, clientY: 100, timeStamp: 350 }));
    board.dispatchEvent(pointer('pointerup', { clientX: 50, clientY: 100, timeStamp: 400 }));

    expect(input.poll(20)).toEqual([]);
  });

  it('does not rotate when a tap ends outside the rendered board', () => {
    const input = new TouchInput({ enabled: true });
    input.setBoundsElement(board);
    input.attach(board);

    board.dispatchEvent(pointer('pointerdown', { clientX: 40, clientY: 100, timeStamp: 100 }));
    board.dispatchEvent(pointer('pointerup', { clientX: -1, clientY: 100, timeStamp: 200 }));

    expect(input.poll(10)).toEqual([]);
  });

  it('does not rotate after horizontal movement or soft drop activation', () => {
    const input = new TouchInput({ enabled: true });
    input.setBoundsElement(board);
    input.attach(board);

    board.dispatchEvent(pointer('pointerdown', { clientX: 40, clientY: 100, timeStamp: 100 }));
    board.dispatchEvent(pointer('pointermove', { clientX: 60, clientY: 100, timeStamp: 150 }));
    board.dispatchEvent(pointer('pointerup', { clientX: 60, clientY: 100, timeStamp: 200 }));
    expect(input.poll(10).map((event) => event.type)).toEqual(['MoveRight']);

    board.dispatchEvent(pointer('pointerdown', { clientX: 40, clientY: 100, timeStamp: 300 }));
    board.dispatchEvent(pointer('pointermove', { clientX: 40, clientY: 120, timeStamp: 350 }));
    board.dispatchEvent(pointer('pointerup', { clientX: 40, clientY: 120, timeStamp: 400 }));

    expect(input.poll(20).map((event) => event.type)).toEqual(['SoftDropStart', 'SoftDropStop']);
  });

  it('does not rotate after cancel, reset, a second finger, or disabled input', () => {
    const input = new TouchInput({ enabled: true });
    input.setBoundsElement(board);
    input.attach(board);

    board.dispatchEvent(pointer('pointerdown', { clientX: 40, clientY: 100, timeStamp: 100 }));
    board.dispatchEvent(pointer('pointercancel', { clientX: 40, clientY: 100, timeStamp: 200 }));

    board.dispatchEvent(pointer('pointerdown', { clientX: 40, clientY: 100, timeStamp: 300 }));
    input.reset();
    board.dispatchEvent(pointer('pointerup', { clientX: 40, clientY: 100, timeStamp: 400 }));

    board.dispatchEvent(
      pointer('pointerdown', {
        clientX: 40,
        clientY: 100,
        pointerId: 1,
        timeStamp: 500,
      }),
    );
    board.dispatchEvent(
      pointer('pointerdown', {
        clientX: 160,
        clientY: 100,
        pointerId: 2,
        timeStamp: 550,
      }),
    );
    board.dispatchEvent(
      pointer('pointerup', {
        clientX: 40,
        clientY: 100,
        pointerId: 1,
        timeStamp: 600,
      }),
    );

    board.dispatchEvent(pointer('pointerdown', { clientX: 40, clientY: 100, timeStamp: 700 }));
    input.updateConfig({ enabled: false });
    board.dispatchEvent(pointer('pointerup', { clientX: 40, clientY: 100, timeStamp: 800 }));

    expect(input.poll(10)).toEqual([]);
  });

  it.each([
    {
      distance: 40,
      duration: 180,
      moveX: 20,
      label: 'inclusive distance, duration, and vertical-dominance thresholds',
    },
    {
      distance: 60,
      duration: 120,
      moveX: 0,
      label: 'a fast downward release below the board',
    },
  ])('hard drops for $label', ({ distance, duration, moveX }) => {
    const input = new TouchInput({ enabled: true });
    input.setBoundsElement(board);
    input.attach(board);

    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 380, timeStamp: 100 }));
    board.dispatchEvent(
      pointer('pointerup', {
        clientX: 100 + moveX,
        clientY: 380 + distance,
        timeStamp: 100 + duration,
      }),
    );

    expect(input.poll(10).map((event) => event.type)).toEqual(['HardDrop']);
  });

  it('stops an active soft drop before emitting exactly one hard drop', () => {
    const input = new TouchInput({ enabled: true });
    input.setBoundsElement(board);
    input.attach(board);

    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100, timeStamp: 100 }));
    board.dispatchEvent(pointer('pointermove', { clientX: 100, clientY: 120, timeStamp: 150 }));
    expect(input.poll(10).map((event) => event.type)).toEqual(['SoftDropStart']);

    board.dispatchEvent(pointer('pointerup', { clientX: 100, clientY: 140, timeStamp: 280 }));

    expect(input.poll(20).map((event) => event.type)).toEqual(['SoftDropStop', 'HardDrop']);
  });

  it.each([
    {
      label: 'the gesture takes 181 milliseconds',
      moveX: 0,
      moveY: 40,
      duration: 181,
    },
    {
      label: 'the downward distance is below two cells',
      moveX: 0,
      moveY: 39.9,
      duration: 180,
    },
    {
      label: 'the downward distance is not twice the sideways distance',
      moveX: 20.1,
      moveY: 40,
      duration: 180,
    },
  ])('does not hard drop when $label', ({ moveX, moveY, duration }) => {
    const input = new TouchInput({ enabled: true });
    input.setBoundsElement(board);
    input.attach(board);

    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100, timeStamp: 100 }));
    board.dispatchEvent(
      pointer('pointerup', {
        clientX: 100 + moveX,
        clientY: 100 + moveY,
        timeStamp: 100 + duration,
      }),
    );

    expect(input.poll(10).map((event) => event.type)).not.toContain('HardDrop');
  });

  it('allows sub-cell sideways drift but rejects a gesture after a horizontal cell step', () => {
    const input = new TouchInput({ enabled: true });
    input.setBoundsElement(board);
    input.attach(board);

    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100, timeStamp: 100 }));
    board.dispatchEvent(pointer('pointerup', { clientX: 119, clientY: 140, timeStamp: 280 }));
    expect(input.poll(10).map((event) => event.type)).toEqual(['HardDrop']);

    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100, timeStamp: 300 }));
    board.dispatchEvent(pointer('pointermove', { clientX: 120, clientY: 100, timeStamp: 340 }));
    board.dispatchEvent(pointer('pointerup', { clientX: 100, clientY: 140, timeStamp: 480 }));

    expect(input.poll(20).map((event) => event.type)).toEqual(['MoveRight']);
  });

  it('does not hard drop after cancel, reset, disabled input, or a second finger', () => {
    const input = new TouchInput({ enabled: true });
    input.setBoundsElement(board);
    input.attach(board);

    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100, timeStamp: 100 }));
    board.dispatchEvent(pointer('pointercancel', { clientX: 100, clientY: 140, timeStamp: 200 }));

    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100, timeStamp: 300 }));
    input.reset();
    board.dispatchEvent(pointer('pointerup', { clientX: 100, clientY: 140, timeStamp: 400 }));

    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100, timeStamp: 500 }));
    input.updateConfig({ enabled: false });
    board.dispatchEvent(pointer('pointerup', { clientX: 100, clientY: 140, timeStamp: 600 }));
    input.updateConfig({ enabled: true });

    board.dispatchEvent(
      pointer('pointerdown', {
        clientX: 100,
        clientY: 100,
        pointerId: 1,
        timeStamp: 700,
      }),
    );
    board.dispatchEvent(
      pointer('pointerdown', {
        clientX: 120,
        clientY: 100,
        pointerId: 2,
        timeStamp: 720,
      }),
    );
    board.dispatchEvent(
      pointer('pointerup', {
        clientX: 100,
        clientY: 140,
        pointerId: 1,
        timeStamp: 800,
      }),
    );

    expect(input.poll(10).map((event) => event.type)).not.toContain('HardDrop');
  });

  it.each([
    {
      distance: 40,
      duration: 180,
      moveX: 20,
      label: 'inclusive distance, duration, and vertical-dominance thresholds',
    },
    {
      distance: 60,
      duration: 120,
      moveX: 0,
      label: 'a fast upward release above the board',
    },
  ])('holds for $label', ({ distance, duration, moveX }) => {
    const input = new TouchInput({ enabled: true });
    input.setBoundsElement(board);
    input.attach(board);

    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 40, timeStamp: 100 }));
    board.dispatchEvent(
      pointer('pointerup', {
        clientX: 100 + moveX,
        clientY: 40 - distance,
        timeStamp: 100 + duration,
      }),
    );

    expect(input.poll(10).map((event) => event.type)).toEqual(['Hold']);
  });

  it('stops an active soft drop before emitting exactly one hold', () => {
    const input = new TouchInput({ enabled: true });
    input.setBoundsElement(board);
    input.attach(board);

    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100, timeStamp: 100 }));
    board.dispatchEvent(pointer('pointermove', { clientX: 100, clientY: 120, timeStamp: 130 }));
    expect(input.poll(10).map((event) => event.type)).toEqual(['SoftDropStart']);

    board.dispatchEvent(pointer('pointerup', { clientX: 100, clientY: 60, timeStamp: 280 }));

    expect(input.poll(20).map((event) => event.type)).toEqual(['SoftDropStop', 'Hold']);
  });

  it.each([
    {
      label: 'the gesture takes 181 milliseconds',
      moveX: 0,
      moveY: -40,
      duration: 181,
    },
    {
      label: 'the upward distance is below two cells',
      moveX: 0,
      moveY: -39.9,
      duration: 180,
    },
    {
      label: 'the upward distance is not twice the sideways distance',
      moveX: 20.1,
      moveY: -40,
      duration: 180,
    },
  ])('does not hold when $label', ({ moveX, moveY, duration }) => {
    const input = new TouchInput({ enabled: true });
    input.setBoundsElement(board);
    input.attach(board);

    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100, timeStamp: 100 }));
    board.dispatchEvent(
      pointer('pointerup', {
        clientX: 100 + moveX,
        clientY: 100 + moveY,
        timeStamp: 100 + duration,
      }),
    );

    expect(input.poll(10).map((event) => event.type)).not.toContain('Hold');
  });

  it('allows sub-cell sideways drift but rejects hold after a horizontal cell step', () => {
    const input = new TouchInput({ enabled: true });
    input.setBoundsElement(board);
    input.attach(board);

    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100, timeStamp: 100 }));
    board.dispatchEvent(pointer('pointerup', { clientX: 119, clientY: 60, timeStamp: 280 }));
    expect(input.poll(10).map((event) => event.type)).toEqual(['Hold']);

    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100, timeStamp: 300 }));
    board.dispatchEvent(pointer('pointermove', { clientX: 120, clientY: 100, timeStamp: 340 }));
    board.dispatchEvent(pointer('pointerup', { clientX: 100, clientY: 60, timeStamp: 480 }));

    expect(input.poll(20).map((event) => event.type)).toEqual(['MoveRight']);
  });

  it('does not hold after cancel, reset, disabled input, or a second finger', () => {
    const input = new TouchInput({ enabled: true });
    input.setBoundsElement(board);
    input.attach(board);

    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100, timeStamp: 100 }));
    board.dispatchEvent(pointer('pointercancel', { clientX: 100, clientY: 60, timeStamp: 200 }));

    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100, timeStamp: 300 }));
    input.reset();
    board.dispatchEvent(pointer('pointerup', { clientX: 100, clientY: 60, timeStamp: 400 }));

    board.dispatchEvent(pointer('pointerdown', { clientX: 100, clientY: 100, timeStamp: 500 }));
    input.updateConfig({ enabled: false });
    board.dispatchEvent(pointer('pointerup', { clientX: 100, clientY: 60, timeStamp: 600 }));
    input.updateConfig({ enabled: true });

    board.dispatchEvent(
      pointer('pointerdown', {
        clientX: 100,
        clientY: 100,
        pointerId: 1,
        timeStamp: 700,
      }),
    );
    board.dispatchEvent(
      pointer('pointerdown', {
        clientX: 120,
        clientY: 100,
        pointerId: 2,
        timeStamp: 720,
      }),
    );
    board.dispatchEvent(
      pointer('pointerup', {
        clientX: 100,
        clientY: 60,
        pointerId: 1,
        timeStamp: 800,
      }),
    );

    expect(input.poll(10).map((event) => event.type)).not.toContain('Hold');
  });
});
