---
plannerFormat: 1
id: ABI-050
artifact: brief
project: ABI
profile: high-assurance
revision: 5
status: Ready for Manager
sprintId: ABI-S1
dependencies:
  - ABI-048
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-050: Fix Visual Lab family selector reachability transitions

## Goal

Fix Visual Lab family selector reachability transitions

## Work item

- Type: bug
- Priority: high
- Status: Ready for Manager

## Acceptance criteria

- [ ] Every valid registered family remains selectable from every compatible current Visual Lab state; changing family never silently reverts to the previous family.
- [ ] Family changes deterministically choose a reachable grade, modifier, and variant while preserving affinity when possible, and dependent controls refresh to the resulting valid combination.
- [ ] Hydra-to-Colossus, Colossus-to-Hydra, Beetle-to-Brute/Wisp, and modifier/grade transition cases are covered; no valid family is randomly disabled because incompatible stale dependent fields are retained.
- [ ] Invalid boss-only recipes and genuinely unreachable combinations remain explained or disabled rather than silently falling back to an unrelated family.
- [ ] URL serialization, reload, canonical receipts, production registry parity, and Golden Bug behavior remain unchanged and deterministic.
- [ ] Focused tests and real-browser QA prove selector transitions on desktop and narrow Visual Lab layouts with clean console; independent review/QA and exact-SHA deployment proof pass.

## Dependencies

- ABI-048

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7FD1F
- AUTOBATTLEIDLE-DOC-20260827-D74E4E

## Constraints

- Follow the resolved workflow contract and project instructions.
