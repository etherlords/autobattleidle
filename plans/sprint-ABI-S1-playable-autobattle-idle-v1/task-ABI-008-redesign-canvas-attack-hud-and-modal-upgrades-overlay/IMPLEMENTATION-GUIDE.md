---
plannerFormat: 1
id: ABI-008
artifact: implementation_guide
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

# ABI-008 implementation-guide

## Frozen scope

- Change only ABI-008 presentation and input ownership in `src/ui/hud.ts`, its focused tests, the minimal `src/app/application.ts` composition seam needed to supply the canvas, and `src/style.css`.
- Do not change combat formulas, progression, persistence schemas/migrations, Three.js rendering rules, ABI-009, ABI-014, or later task behavior.
- Preserve the user-owned excluded `.playwright-cli/` tree. Task-owned browser evidence belongs under `output/playwright/`.

## Implementation sequence

1. Expose the battlefield canvas to the HUD through the existing application composition path; bind one pointer activation and focused non-repeating Enter/Space activation to `onAttack`.
2. Remove the permanent Attack button and partition HUD markup into passive top status, fixed log, and interactive fixed controls.
3. Add the lower-left Upgrades launcher and modal. Keep existing upgrade/reset/restore/persistence controls and disabled reasons; implement explicit close, Escape, initial focus, and launcher focus restoration.
4. Make passive status/log non-interactive and non-selectable; size health nearly to viewport width and automatic progress to 35-45vw; lock page layout to the viewport.
5. Extend the existing HUD fake-DOM test instead of adding a browser test framework. Prove exactly-once input, no repeat, modal lifecycle, upgrade routing, focus restoration, and listener disposal.
6. Run focused tests and `pnpm check`; then independent Reviewer and independent real-browser QA at desktop and 390px, including supported historical-save reload.

## Verification matrix

- Unit: pointer, Enter, Space, repeat suppression, close/Escape/focus restore, disabled upgrades, and post-dispose no-op.
- Integration: one canvas activation decreases HP exactly once; manual input does not reset automatic countdown; modal controls never attack; no document scroll or overlay overlap at desktop and 390px.
- Persistence regression: current V2 plus supported V1 migration/load survive reload with coins, enemy progress, unlock, and upgrades intact; malformed data still recovers safely.
- Deployed: exact published SHA loads from GitHub Pages and repeats the desktop/narrow input, modal, layout, and reload scenarios with no console errors.
