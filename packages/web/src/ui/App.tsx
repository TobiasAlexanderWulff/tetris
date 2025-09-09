import React from 'react';
import { GameCanvas } from './GameCanvas';

/**
 * Root application component.
 *
 * Renders a minimal full-screen layout with a canvas placeholder and an
 * on-canvas FPS counter to validate rendering and timing.
 */
export function App(): JSX.Element {
  return <div style={{ display: 'grid', height: '100dvh' }}><GameCanvas /></div>;
}
