---
plannerFormat: 1
id: ABI-008-FIX
artifact: brief
project: ABI
profile: high-assurance
revision: 6
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
- [ ] Upgrade actions use a clear responsive grid with larger controls whose width and layout do not change when labels, levels, costs, or disabled reasons change
- [ ] Desktop and 390px browser QA prove the centered card stays in bounds, modal input cannot reach the battlefield, close and Escape restore focus, and the page has no overflow
- [ ] Focused HUD tests and pnpm check pass; independent review, independent browser QA, commit, CI, Pages, and public exact-SHA proof are recorded

## Dependencies

- ABI-008

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-85CBFC
- AUTOBATTLEIDLE-DOC-20260827-584401
- AUTOBATTLEIDLE-DOC-20260827-A7F881

## Constraints

- Follow the resolved workflow contract and project instructions.
