---
plannerFormat: 1
id: ABI-008-FIX
artifact: brief
project: ABI
profile: high-assurance
revision: 10
status: In QA
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

# ABI-008-FIX: Center upgrades dialog and expose balance in a stable grid

## Goal

Center upgrades dialog and expose balance in a stable grid

## Work item

- Type: bug
- Priority: high
- Status: In QA

## Acceptance criteria

- [ ] Upgrades opens as a centered bounded dialog card over a translucent backdrop instead of rendering its content as a bottom strip across the viewport
- [ ] The dialog visibly includes the current coin balance while the top battlefield HUD may be obscured
- [ ] Every upgrade action uses a fixed-size two-line layout: TITLE - LEVEL on the first line and PRICE coins on the second; dynamic disabled Need text is not shown visually, while the full disabled reason remains accessible
- [ ] The U key toggles the upgrades modal open and closed without producing a battlefield attack, and closing restores focus to the Upgrades launcher
- [ ] A pointer activation on the backdrop outside the dialog card closes the modal and restores launcher focus; pointer activation inside the card does not close or click through
- [ ] Desktop and 390px browser QA prove the centered card stays in bounds, modal input cannot reach the battlefield, close/Escape/U/backdrop dismissal restore focus, stable button geometry, and no page overflow
- [ ] Focused HUD tests and pnpm check pass; independent review, independent browser QA, commit, CI, Pages, and public exact-SHA proof are recorded

## Dependencies

- ABI-008

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-85CBFC
- AUTOBATTLEIDLE-DOC-20260827-584401
- AUTOBATTLEIDLE-DOC-20260827-A7F881

## Constraints

- Follow the resolved workflow contract and project instructions.
