---
plannerFormat: 1
id: ABI-008
artifact: brief
project: ABI
profile: high-assurance
revision: 3
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

# ABI-008: Redesign canvas attack HUD and modal upgrades overlay

## Goal

Redesign canvas attack HUD and modal upgrades overlay

## Work item

- Type: task
- Priority: high
- Status: Ready

## Acceptance criteria

- [ ] One accepted pointer activation on the battlefield canvas performs exactly one manual attack; the permanent Attack button is removed and Enter/Space remains an accessible exactly-once equivalent
- [ ] A fixed passive top overlay shows centered enemy name, a nearly viewport-width current/max HP bar, a 35-45% viewport-width automatic countdown bar, and coins below
- [ ] Health and automatic bars are non-clickable, non-selectable, non-draggable, expose accessible values, and never intercept canvas pointer attacks
- [ ] The bounded reward/combat log is fixed at the lower right and never changes document height or introduces page scrollbars
- [ ] A fixed lower-left Upgrades launcher opens a modal above the battlefield without reflow; focus, Escape/close, costs, disabled reasons, and click-through prevention are verified
- [ ] Desktop and 390px narrow browser QA prove no overlap, no horizontal/vertical page scroll, no duplicate attack, and stable cleanup/listeners
- [ ] Focused DOM/application tests and pnpm check pass; independent review, browser QA, Pages deployment, and public functional proof are recorded

## Dependencies

- ABI-004
- ABI-005

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-85CBFC
- AUTOBATTLEIDLE-DOC-20260827-584401
- AUTOBATTLEIDLE-DOC-20260827-A7F881

## Constraints

- Follow the resolved workflow contract and project instructions.
