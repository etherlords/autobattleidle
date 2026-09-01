---
plannerFormat: 1
id: ABI-042
artifact: brief
project: ABI
profile: high-assurance
revision: 4
status: In QA
sprintId: ABI-S1
dependencies:
  - ABI-017
  - ABI-018
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-042: Show the exact next-upgrade effect gained by each purchase

## Goal

Show the exact next-upgrade effect gained by each purchase

## Work item

- Type: task
- Priority: normal
- Status: In QA

## Acceptance criteria

- [ ] Every repeatable upgrade row shows the exact displayed-stat delta the next click will buy, derived from the same domain formula and next effective level used by purchase validation.
- [ ] Damage, armor penetration, critical chance, double-reward chance, and APS use readable units and the existing display precision; one-click multi-level skips show the combined purchased delta rather than an internal per-level delta.
- [ ] The preview updates immediately after purchases and restored progress, never displays +0 for an enabled purchase, and exposes an accessible full-precision label where compact visual rounding could hide a change.
- [ ] One-time automatic unlock and unavailable numeric endpoints use clear capability or disabled-reason copy instead of a misleading delta.
- [ ] Focused unit/UI tests and deployed desktop/narrow QA prove prices, purchase results, and shown deltas stay consistent.

## Dependencies

- ABI-017
- ABI-018

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A798F2

## Constraints

- Follow the resolved workflow contract and project instructions.
