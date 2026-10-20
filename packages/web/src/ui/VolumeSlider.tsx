import React from 'react';

/** Props for the labelled volume slider. */
export interface VolumeSliderProps {
  /** DOM id linking the label to its range input. */
  id: string;
  /** Visible label text. */
  label: string;
  /** Current volume in the normalized 0..1 range. */
  value: number;
  /** Called with the new normalized volume when the slider moves. */
  onChange: (value: number) => void;
}

/**
 * Labelled range input for a normalized audio volume.
 *
 * Keeps the slider markup and accessible label association consistent across
 * master, music, and SFX volume controls.
 */
export function VolumeSlider({ id, label, value, onChange }: VolumeSliderProps): JSX.Element {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        style={{ width: '100%' }}
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
