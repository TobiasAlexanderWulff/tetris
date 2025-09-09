# M5 — Polish & Accessibility — Plan

Purpose: Deliver the milestone-5 polish and accessibility items called out in plan.md, with focused sub‑plans and test coverage. This plan catalogs scope, success criteria, sub‑tasks, and verification.

## Scope

- Responsive resize and HiDPI scaling polish (canvas + HUD).
- Accessible, color‑blind‑friendly palettes and theme integration.
- Key remapping UX (conflict handling, persistence, live apply).
- Simple juice/animations with a global toggle and reduced‑motion support.
- Accessibility pass across menus/overlays and visual contrast.

## Success Criteria (Exit)

- Canvas and HUD resize smoothly; DPR applied; no blurriness; stable 60 FPS.
- Themes include a color‑blind‑friendly option; contrast ≥ 4.5:1 for HUD text.
- Users can remap keys; conflicts prevented or resolved; settings persist and apply live.
- Animations exist for line clear flash and spawn pop (optional particles); disabling animations removes motion without breaking UX; prefers‑reduced‑motion honored.
- Keyboard navigation across menus is complete; ARIA roles on dialogs and controls; focus trap works.

## Sub‑Plans

1) See `M5-Resize-HiDPI-Plan.md`
2) See `M5-Color-Palettes-Plan.md`
3) See `M5-Key-Remapping-Plan.md`
4) See `M5-Animations-Polish-Plan.md`
5) See `M5-Accessibility-Plan.md`

## Testing Strategy

- Unit (Vitest): renderer resize/DPR, settings store, bindings editor logic, theme palette mapping, animation toggle behavior.
- E2E (Playwright): resize behavior, settings flow, theme switch, reduced‑motion handling, keyboard nav in modals, toasts disabled when animations off.
- Performance: basic FPS budget smoke; avoid extra reflows on resize; no GC churn from animation.

## Notes

- Follow AGENTS.md: modular structure, add docstrings for new components and methods, keep files small; if any sub‑task grows, split and update the corresponding sub‑plan first.

