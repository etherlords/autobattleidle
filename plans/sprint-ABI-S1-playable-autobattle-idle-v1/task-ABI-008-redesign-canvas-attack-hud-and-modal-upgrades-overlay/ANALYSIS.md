---
plannerFormat: 1
id: ABI-008
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-004
  - ABI-005
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-008 analysis

## Verified current state

- ABI-004 and ABI-005 are Done; Planner selected ABI-008 as dependency-ready at task revision 3 and progress revision 2.
- `src/ui/hud.ts` owns the current permanent Attack button, status bars, upgrade buttons, reset/restore controls, persistence status, event log, and their listeners.
- `src/game/battlefield.ts` owns the canvas but exposes no input surface. `src/app/application.ts` already routes one HUD attack callback into the shared manual attack command and renders immediately.
- `src/style.css` overlays one flex HUD over the battlefield, but its controls and log still participate in that flex layout. The current body/app sizing can grow vertically and the mobile log becomes full-width.
- Vault contracts `AUTOBATTLEIDLE-DOC-20260827-85CBFC`, `AUTOBATTLEIDLE-DOC-20260827-584401`, and `AUTOBATTLEIDLE-DOC-20260827-A7F881` require canvas/Enter/Space exactly-once input, passive fixed status/log layers, and an accessible non-reflowing upgrades modal.
- Persistence impact: no schema change. ABI-008 changes presentation/input only; historical V1/V2 load and reload remain required release regression evidence.

## Approach

- Keep one UI owner: extend `Hud` to bind the existing battlefield canvas, rather than adding a second input/controller module.
- Replace the Attack button with canvas pointer and focused Enter/Space listeners that call the existing `onAttack` callback once per accepted event; consume modal/control input inside the HUD layer.
- Restructure the same HUD DOM into passive top status, fixed lower-right log, and fixed controls. Add one lower-left launcher plus a native accessible dialog surface with close/Escape, initial focus, and launcher focus restoration.
- Preserve the existing upgrade/reset/restore/persistence behavior inside the modal. Add focused DOM tests for input, modal lifecycle, disabled reasons, and listener disposal, then run `pnpm check` and real browser QA.
- Acceptance layers: focused DOM/application tests are unit/integration proof; desktop and 390px browser interaction are integration proof; exact-SHA GitHub Pages interaction is deployed proof.

## Risks

- Canvas pointer and keyboard handlers can double-fire if click and key activation share browser synthesis; bind pointer input only to canvas and key input only to focused Enter/Space, with repeat suppression.
- A full-screen HUD container can intercept attacks even when children look transparent; passive layers must use `pointer-events: none`, while only launcher/modal controls opt in.
- Modal close/dispose can leak document key handlers or focus restoration. Use stable named listeners and remove each during close/dispose.
- Fixed controls can overlap at 390px or create scrollbars. Constrain viewport overflow and size the modal/log with viewport-relative maximums.
