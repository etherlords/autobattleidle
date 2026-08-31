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
- The reviewed local warmed 48-hour receipt is 1.524 seconds. The executable CI regression remains non-skipped and bounds the measured run below 5 seconds across hosted hardware; its 12-second wrapper covers a warm-up plus measured run. Fresh QA repeated the full test at 2.86-3.13 seconds.
- Ordinary telemetry excludes bosses and Golden Bug from grades, modifiers, armor, walls, bands, and adjacent grade transitions. Golden automatic-only input escapes with zero reward; deterministic manual plus automatic input defeats it and grants one reward.
- Every paid repeatable upgrade advances by at least one displayed gameplay quantum and charges all skipped internal levels together. V1, V2, V3, V4, and current saves load/reload compatibly.
- The reviewed measurement receipt and high-APS example are stored as portable Vault assets. Vault readback reports 17 articles, 45 resolved links, zero unresolved links, a fresh lexical/vector index, and no doctor findings.
- Fresh independent review v12: APPROVE with no findings after the portable CI performance repair.
- Fresh independent QA v14: PASS. `pnpm check` passed lint, format, 20 test files / 178 tests, Worker TypeScript, and production build; exact horizon/report equality and `git diff --check` passed.
- Exact release SHA: `e4df33709cdadd673cc2a388fdcbc0d446a3149b`.
- CI run `33432331520`: success. Pages run `33432331590`: success. The leaderboard Worker workflow was correctly not triggered because this release changed no `worker/**` path.
- Deployed health: `https://etherlords.github.io/autobattleidle/` returned HTTP 200, title `Etherlords Autobattle Idle`, and asset `assets/index-Mgw-pTlb.js` returned HTTP 200 with 660,355 bytes.

## Sign-off

- Reviewer: PASS — `abi020-independent-review-v12`.
- QA: PASS — `abi020-independent-qa-v14`.
- Manager close: PASS — acceptance, Vault evidence, exact-SHA CI/Pages, and deployed health are coherent; unrelated Planner/tooling work remains excluded from the ABI-020 release.
