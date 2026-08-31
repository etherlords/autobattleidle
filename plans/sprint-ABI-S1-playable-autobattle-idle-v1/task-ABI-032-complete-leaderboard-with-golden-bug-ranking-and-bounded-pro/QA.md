---
plannerFormat: 1
id: ABI-032
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-010
  - ABI-013
  - ABI-030
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-032 qa

## Pre-deployment verdict

BLOCKED_DEPLOYMENT — local acceptance passes; public Worker and Pages still serve the previous release.

## Evidence

- `pnpm check`: passed, 20 test files / 147 tests.
- Focused domain, save, sync, and Worker suites: passed, 5 files / 52 tests.
- Pinned Wrangler 4.127.1 local `0001 -> seed -> 0002`: passed. The seeded row retained
  `best_level=42` and received `best_golden_bugs=0`.
- Public Pages health and desktop/390px layout are clean, but the stale UI still exposes only Level.
- Public Worker responds and correctly rejects a request without an allowed origin.
- Local browser integration was blocked at Wrangler CORS preflight; deployed acceptance must prove the
  final configured Worker/Pages origin contract.

## Artifacts

- `output/playwright/abi032-public-desktop.png`
- `output/playwright/abi032-local-cors-blocked.png`

## Remaining deployed proof

After D1, Worker, and Pages rollout: both ranking modes with Top/Around/current rank, enough visible
users, boss/no-level-spam cadence, V3 -> V4 reload and real Golden Bug count, responsive interaction,
clean console/network, and exact-SHA receipts.
