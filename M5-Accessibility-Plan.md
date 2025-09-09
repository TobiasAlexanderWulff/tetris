# M5 — Accessibility — Plan

Goal: Ensure menus, settings, overlays, and HUD meet accessibility standards for keyboard navigation, ARIA semantics, focus management, contrast, and motion.

## Current State

- UI architecture in place (`packages/web/src/ui/*`), `SettingsModal`, `PauseOverlay`, `GameOverOverlay`, `HelpModal` exist.
- Themes include `high-contrast`; animations toggle present.

## Tasks

- Keyboard navigation: ensure Tab order intuitive; Arrow/Enter/Escape for menus; restore focus to invoker when closing modals.
- Focus trap: reusable `Modal` with trap and inert background semantics; hide background from screen readers when open.
- ARIA roles/labels: `dialog`, `aria-labelledby`, `aria-describedby`, labeled controls for sliders/toggles/selects.
- Contrast audit: verify text/icons vs background ≥ 4.5:1; adjust variables if needed; document deltas.
- Reduced motion: default to off when `prefers-reduced-motion`; reflect in settings as auto state; prevent flashes.
- Screen reader checks: ensure status changes (e.g., Game Over) announce via ARIA live region.

## Tests

- Unit: component accessibility props presence (roles/labels) and focus trap behavior in isolation.
- E2E: keyboard-only flows for opening/closing modals, adjusting settings, starting game; verify focus restoration; snapshot Axe checks if integrated.

## Acceptance

- Keyboard-only fully usable; screen readers get appropriate announcements; contrast targets met; reduced motion defaults respected.

