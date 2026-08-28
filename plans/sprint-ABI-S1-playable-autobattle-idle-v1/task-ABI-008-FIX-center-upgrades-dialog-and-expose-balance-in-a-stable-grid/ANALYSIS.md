---
plannerFormat: 1
id: ABI-008-FIX
artifact: analysis
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

# ABI-008-FIX analysis

## Verified current state

- `src/style.css` makes `.upgrades-modal` itself a full-viewport opaque flex column aligned to the bottom, so the controls read as a narrow strip and hide the battlefield HUD.
- `src/ui/hud.ts` renders coins only in the passive top status, outside the modal. The modal already owns upgrade/reset/restore controls and focus behavior.
- The native `hidden` repair, exactly-once battlefield input, persistence contract, and modal lifecycle are green and must remain unchanged.
- Vault requires a fixed non-reflowing modal with explicit pointer ownership but does not prescribe card geometry. The user's follow-up supplies the missing UX authority: centered bounded card, visible in-modal balance, and a stable larger grid.
- Persistence impact: no schema change. V1/V2 load/reload coverage remains the regression boundary.

## Approach

- Keep the existing modal element as the full-viewport backdrop/input blocker and add one `.upgrades-dialog` child as the centered visual card.
- Reuse the existing coins render value in a second in-modal text node; do not add application or persistence state.
- Use CSS Grid with fixed responsive tracks and fixed minimum button height so labels and disabled reasons do not resize or reorder the layout.
- Change only HUD markup, CSS, and focused HUD assertions; preserve input, focus, reset/restore, and domain behavior.

## Risks

- Long upgrade labels can overflow or grow rows; constrain wrapping and give every action a fixed minimum height with grid items stretched equally.
- The centered card can exceed 390px height; bound it to the viewport and scroll inside the card, never the document.
- Moving controls under a new wrapper can break test lookup or focus containment; retain class names and verify close/Escape restoration plus modal click blocking in real browsers.
