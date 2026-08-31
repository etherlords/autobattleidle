---
plannerFormat: 1
id: ABI-033
artifact: brief
project: ABI
profile: high-assurance
revision: 6
status: In QA
sprintId: ABI-S1
dependencies:
  - ABI-032
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-033: Clarify leaderboard tabs, immediate rank, centered Around Me, and aligned rows

## Goal

Clarify leaderboard tabs, immediate rank, centered Around Me, and aligned rows

## Work item

- Type: bug
- Priority: critical
- Status: In QA

## Acceptance criteria

- [ ] The leaderboard dialog has two clearly separated tab rows: Level / Golden Bugs selects the ranking metric, and Top 100 / Around Me selects the view.
- [ ] The dialog uses a compact top-right icon close button while preserving backdrop click, Escape, focus restoration, and accessible naming.
- [ ] The ranking renders as an aligned three-column table: Place, Name, and the selected statistic, with no duplicated ordered-list and #rank numbering.
- [ ] Community ranking — Your rank is #N is visible immediately in both Top 100 and Around Me views.
- [ ] Around Me returns and displays at most ten players above and ten below the current player; the current player is visibly highlighted and remains correctly ranked near board edges.
- [ ] Level and Golden Bugs mode changes retain the selected Top/Around view instead of silently returning to Top.
- [ ] Focused tests cover semantic table structure, tab state/order, immediate own rank, Around Me bounds, current-row highlight, close behavior, and responsive layout.
- [ ] Independent review and deployed browser QA pass on desktop and 390px, followed by exact-SHA CI and Pages publication.

## Dependencies

- ABI-032

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260830-86F521

## Constraints

- Follow the resolved workflow contract and project instructions.
