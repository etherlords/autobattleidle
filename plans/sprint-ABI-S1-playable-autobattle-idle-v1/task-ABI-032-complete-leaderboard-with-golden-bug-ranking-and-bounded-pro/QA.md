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

## Verdict

PASS — public Worker and Pages satisfy the deployed acceptance layers at exact SHA
`a7b34c3b501fd891a9c1d120c05b65a1b5320d0f`.

## Release receipts

- CI run `33347871511`: success.
- Pages run `33347871496`: success.
- Worker run `33347871505`: success.
- Worker version: `1834553a-7e67-42a9-8b4f-d0b1dba864e8`.
- D1 migration `0002_golden_bugs.sql` was applied by the preceding exact-SHA release; the repair
  deployment reported no pending migrations.

## Deployed browser and API evidence

- A bounded production QA dataset exposes 40 visible players.
- Level Top shows varied QA levels `400`, `370`, `340`, and `310` at ranks 3-6.
- Golden Bugs Top orders QA players by `20`, `17`, `14`, `11`, and `3`, followed by zero-count
  players.
- Pages loaded -> Leaderboard clicked -> dialog opened.
- Golden Bugs clicked -> `20`, `17`, `14`, `11`, and `3 Golden Bugs` were visible.
- Around me clicked -> `Your rank: 40` was visible.
- Identity creation returned 201; Level Top, Golden Bugs Top, and Golden Bugs Around returned 200.
- Desktop and 390x844 interactions retained Level/Golden Bugs and Top/Around controls without
  clipping.
- Console after interaction contained zero errors and zero warnings.
- Initial level 1 -> eight real battlefield clicks -> level 2 produced no leaderboard score request,
  proving ordinary level progression does not spam submissions.

## Deterministic acceptance evidence

- `pnpm check`: 20 test files / 147 tests, lint, formatting, Worker TypeScript, and build passed.
- Fake-time tests cover boss submission, five-minute boundary, success reset, in-flight coalescing,
  bounded retry, and disposal.
- Domain and persistence tests cover lethal-versus-escape Golden Bug counting and V1/V2/V3 -> V4
  migration/save/reload.
- A real browser boss defeat and Golden Bug encounter were not forced during the bounded deployed
  run; their deterministic behavioral coverage is green.

## Artifacts

- `output/playwright/abi032-a7b34-desktop.png`
- `output/playwright/abi032-a7b34-narrow.png`
