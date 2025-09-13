import type { AudioManifest } from './types';

/**
 * Audio asset manifest.
 *
 * Note: URLs are placeholders; add real assets under `public/audio/` and update paths.
 * For now we keep the lists empty to avoid network fetches before assets exist.
 */
export const audioManifest: AudioManifest = {
  sfx: {
    rotate: { url: '/audio/sfx/rotate.ogg', gain: 0.8, maxPoly: 6 },
    rotate_180: { url: '/audio/sfx/rotate_180.ogg', gain: 0.8, maxPoly: 4 },
    hard_drop: { url: '/audio/sfx/hard_drop.ogg', gain: 0.9, maxPoly: 4 },
    lock: { url: '/audio/sfx/lock.ogg', gain: 0.7, maxPoly: 8 },
    line_clear: { url: '/audio/sfx/line_clear.ogg', gain: 1.0, maxPoly: 8 },
    tetris: { url: '/audio/sfx/tetris.ogg', gain: 1.0, maxPoly: 2 },
    level_up: { url: '/audio/sfx/level_up.ogg', gain: 0.9, maxPoly: 1 },
    game_over: { url: '/audio/sfx/game_over.ogg', gain: 0.9, maxPoly: 1 },
    hold: { url: '/audio/sfx/hold.ogg', gain: 0.7, maxPoly: 2 },
    ui_click: { url: '/audio/sfx/ui_click.ogg', gain: 0.6, maxPoly: 6 },
    ui_confirm: { url: '/audio/sfx/ui_confirm.ogg', gain: 0.6, maxPoly: 4 },
    ui_back: { url: '/audio/sfx/ui_back.ogg', gain: 0.6, maxPoly: 4 },
  },
  music: {
    // If you have precise loop points, set loopStart/loopEnd; otherwise rely on file-seamless loop
    theme_main: { url: '/audio/music/theme_main.ogg', gain: 0.5, loop: true },
    menu_ambient: { url: '/audio/music/menu_ambient.ogg', gain: 0.6, loop: true },
  },
};
