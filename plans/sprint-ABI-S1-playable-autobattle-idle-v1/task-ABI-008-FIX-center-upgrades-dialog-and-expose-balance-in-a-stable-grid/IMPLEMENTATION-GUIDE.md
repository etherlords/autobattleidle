---
plannerFormat: 1
id: ABI-008-FIX
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-008
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-008-FIX implementation-guide

## Frozen scope

- Change only `src/ui/hud.ts`, `src/style.css`, focused HUD/application tests if required, and task-owned evidence.
- Preserve battlefield pointer/keyboard input, `[hidden]` semantics, focus trap/restoration, persistence/reset/restore behavior, and all domain/game code.
- Do not modify or claim ABI-009, ABI-014, or other planned features.

## Implementation sequence

1. Wrap existing modal content in a centered `.upgrades-dialog` card and add an accessible coins line driven by the current snapshot.
2. Make `.upgrades-modal` a translucent centered backdrop; bound the card to the viewport with internal overflow.
3. Replace the wrapping flex upgrades list with a stable responsive grid and larger equal-height buttons.
4. Add the smallest DOM/CSS assertions proving card/balance ownership and fixed grid rules.
5. Run focused tests and `pnpm check`, then independent review and desktop/narrow browser QA before publication.

## Verification matrix

- Unit/DOM: modal has a dialog card and in-modal balance; render updates both coin readouts; hidden modal stays `display:none`.
- CSS regression: backdrop centers the card; card is bounded; upgrades use grid; buttons retain stable minimum size.
- Browser desktop and 390px: centered visible card, readable balance, stable controls, internal-only scroll if needed, no page overflow, no canvas click-through, close/Escape focus restoration.
- Release: exact-SHA CI and Pages pass; deployed browser proof repeats the same layout and interaction checks.
