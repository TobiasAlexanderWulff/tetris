# M5 — Key Remapping — Plan

Goal: Ship a robust, accessible key binding editor that updates the input layer live, prevents conflicts, and persists to localStorage.

## Current State

- Settings store persists bindings (`packages/web/src/state/settings.tsx`).
- Input layer consumes `InputConfig` (`packages/web/src/input/types.ts`).
- `SettingsModal` exists; no dedicated key capture UI yet.

## Tasks

- ControlsPanel component: list actions with current bindings; “Rebind” button enters capture mode per action.
- Key capture: listen to `keydown` with visual prompt; handle Escape to cancel; ignore non‑remappable/system keys.
- Conflict handling: prevent duplicate `code` across actions or surface conflict and swap/remove previous mapping after confirmation.
- Multiple bindings per action (optional, v1 supports single mapping per action; document stretch goal).
- Live apply: updating bindings updates `GameHost` input configuration without full reinit; persist immediately.
- Accessibility: focus management during capture; ARIA live region for prompts; keyboard‑only operation.

## Tests

- Unit (React Testing Library):
  - Capture flow updates a specific action binding and persists settings.
  - Conflicting binding shows an error or resolves via swap as designed.
  - ESC cancels capture and restores previous binding.
- E2E (Playwright):
  - Remap Left/Right; verify in gameplay the new keys move piece; persists after reload.

## Acceptance

- Users can remap all gameplay actions; conflicts are handled; changes apply live and persist. UI is accessible and keyboard‑navigable.

