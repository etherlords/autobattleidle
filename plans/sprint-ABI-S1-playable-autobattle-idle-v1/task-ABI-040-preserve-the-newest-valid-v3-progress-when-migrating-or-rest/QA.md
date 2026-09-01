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

PASS — local and exact-SHA deployed Pages proof complete.

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
- Published commit `204cb4c3ede153d925d7ad58654efe892212f5b7`: CI `33454549754` and Pages
  `33454549765` succeeded. Served `assets/index--QT5leaw.js` was 660,672 bytes with SHA-256
  `d1b667064807f107a50df363bb898dd2347ab4eb3327a1386b801c49bdd2a252`.
- Deployed `1280x800` fixture proved v3 2170 -> v4 2170, reload 2170, explicit Restore 2170,
  valid-V4 startup precedence, identical historical V3 bytes, zero console errors, and zero network failures.
