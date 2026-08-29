---
plannerFormat: 1
id: ABI-025
artifact: brief
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-016
  - ABI-023
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-025: Bind camera orbit to the current boss fight only

## Goal

Bind camera orbit to the current boss fight only

## Work item

- Type: bug
- Priority: normal
- Status: Ready

## Acceptance criteria

- [ ] Pointer, touch, and ArrowLeft/ArrowRight camera orbit are accepted only while the current enemy is a boss; ordinary enemies and Golden Bug encounters remain locked to canonical framing
- [ ] Orbit azimuth belongs to the current boss fight identity: it persists through hits and resize during that fight, then resets when the boss is defeated, replaced, escaped from, or a different boss fight begins
- [ ] A later boss always starts from canonical front framing and never inherits rotation from an earlier boss
- [ ] Stationary attack, drag-versus-click suppression, modal input isolation, responsive radius/elevation, disposal, and session-only no-save behavior remain unchanged
- [ ] Focused boss-identity lifecycle tests plus desktop, touch, keyboard, ordinary-to-boss-to-ordinary-to-next-boss browser QA, pnpm check, independent review, CI/Pages, and deployed proof pass

## Dependencies

- ABI-016
- ABI-023

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-85CBFC
- AUTOBATTLEIDLE-DOC-20260827-A7FD1F

## Constraints

- Follow the resolved workflow contract and project instructions.
