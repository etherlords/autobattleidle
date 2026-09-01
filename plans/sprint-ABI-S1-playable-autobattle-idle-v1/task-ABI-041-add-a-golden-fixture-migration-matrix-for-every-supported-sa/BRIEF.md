---
plannerFormat: 1
id: ABI-041
artifact: brief
project: ABI
profile: high-assurance
revision: 16
status: Done
sprintId: ABI-S1
dependencies:
  - ABI-040
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-041: Add a golden-fixture migration matrix for every supported save version

## Goal

Add a golden-fixture migration matrix for every supported save version

## Work item

- Type: task
- Priority: critical
- Status: Done

## Acceptance criteria

- [ ] Committed immutable golden fixtures cover authentic V1, V2, unversioned legacy, V3 before player-relative health, active-Golden V3, and current V4.
- [ ] Each supported source proves load -> deterministic migration -> V4 save -> reload while preserving canonical progression, currency, upgrades, unlock, event state, and historical source bytes.
- [ ] The matrix proves strict V3 -> V2 -> unversioned -> V1 repair precedence, valid-V4 startup precedence, explicit Restore precedence, malformed-newer fallback, failed-write retry, and stale-pending cancellation.
- [ ] Any future save-version or persisted-derived-formula change must update the matrix in the same change; pnpm check runs it by default.
- [ ] Independent review and QA verify the fixtures are production-authentic and fail when a supported historical decoder is removed or current formulas drift.

## Dependencies

- ABI-040

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-E27CD3

## Constraints

- Follow the resolved workflow contract and project instructions.
