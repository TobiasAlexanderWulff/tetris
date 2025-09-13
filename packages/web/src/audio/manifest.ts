import type { AudioManifest } from './types';

/**
 * Audio asset manifest.
 *
 * Note: URLs are placeholders; add real assets under `public/audio/` and update paths.
 * For now we keep the lists empty to avoid network fetches before assets exist.
 */
export const audioManifest: AudioManifest = {
  sfx: {
    // rotate_cw: { url: '/audio/sfx/rotate_cw.ogg', gain: 0.8, maxPoly: 6 },
    // line_clear: { url: '/audio/sfx/line_clear.ogg', gain: 1.0, maxPoly: 8 },
  },
  music: {
    // theme_main: { url: '/audio/music/theme_main.ogg', gain: 0.7, loopStart: 2.0, loopEnd: 66.0 },
    // menu_ambient: { url: '/audio/music/menu_ambient.ogg', gain: 0.6, loop: true },
  },
};

