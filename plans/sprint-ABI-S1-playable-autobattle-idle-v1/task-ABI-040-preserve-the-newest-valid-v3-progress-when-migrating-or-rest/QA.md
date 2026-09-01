---
plannerFormat: 1
id: ABI-040
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-013
  - ABI-020
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-040 qa

## Verdict

LOCAL PASS — exact-SHA deployed Pages proof remains pending.

## Evidence

- Focused persistence suite: 20/20 passed. Full `pnpm check`: 20 files / 183 tests, lint,
  formatting, Worker TypeScript, and production build passed.
- Exact V3 2170 plus legacy 30 selected 2170 and preserved 427,622,176 coins, damage level 5620,
  automatic-speed level 4093, unlock, and bounded remaining-health proportion.
- Valid V4 won ordinary startup; explicit Restore selected V3; corrupt V3 fell through safely;
  historical bytes stayed unchanged; stale failed autosave could not overwrite Restore.
- Isolated browser migration/Restore preserved encounter 2170 and reload continued at 2171 only
  because live automatic combat progressed. Console errors: zero.
- User Chrome and its real localStorage were not modified.
