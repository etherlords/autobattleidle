---
plannerFormat: 1
id: ABI-020
artifact: verification
project: ABI
profile: high-assurance
revision: 2
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-010
  - ABI-016
  - ABI-018
  - ABI-022
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-020 verification

## Acceptance evidence

- Production health is player-relative: normal 1 hit, veteran 5 hits, elite 10 hits, and boss 30 hits before modifiers and armor. Golden Bug keeps its separate time-window formula.
- Automatic throughput approaches 12 APS while presentation remains at 3 visual ticks per second. Packet regressions cover 3.3, 6, 10.2, and 12 APS, fractional carry-over, independent critical rolls, and continued packets against the next enemy.
- Exact and event-jump simulations match final state at 1, 4, 8, 24, 48, and 49 hours. The 48-hour checkpoint reaches encounter 24,920 at approximately 11.995 APS; 49 hours reaches 30,234 without currency saturation.
- The warmed 48-hour event-jump remains explicitly bounded below 2.5 seconds. Fresh QA measured the full warm-up plus measured-test wrapper at 3.294 seconds and the separate 3,000-encounter deterministic telemetry test at 1.962 seconds.
- Ordinary telemetry excludes bosses and Golden Bug from grades, modifiers, armor, walls, bands, and adjacent grade transitions. Golden automatic-only input escapes with zero reward; deterministic manual plus automatic input defeats it and grants one reward.
- Every paid repeatable upgrade advances by at least one displayed gameplay quantum and charges all skipped internal levels together. V1, V2, V3, V4, and current saves load/reload compatibly.
- The reviewed measurement receipt and high-APS example are stored as portable Vault assets. Vault readback reports 17 articles, 45 resolved links, zero unresolved links, a fresh lexical/vector index, and no doctor findings.
- Fresh independent review v11: APPROVE with no P0-P3 findings.
- Fresh independent QA v12 after the narrow timing repair: PASS. `pnpm check` passed lint, format, 20 test files / 178 tests, Worker TypeScript, and production build; `git diff --check` passed.
- Exact release SHA and GitHub Actions/Pages receipts are pending publication of this coherent checkpoint.

## Sign-off

- Reviewer: PASS — `abi020-independent-review-v11`.
- QA: PASS — `abi020-independent-qa-v12`.
- Manager close: pending exact-SHA CI, Worker/Pages deployment, deployed health, and final Planner verification/closure gates.
