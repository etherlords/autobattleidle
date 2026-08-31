---
plannerFormat: 1
id: ABI-020
artifact: qa
project: ABI
profile: high-assurance
revision: 2
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-016
  - ABI-018
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-020 qa

## Verdict

PASS — independent headless/domain and application/controller acceptance passed.

## Evidence

- `pnpm vitest run src/domain/combat.test.ts --reporter=verbose`: 34/34 passed. This covers exact 1/4/8/24/48/49-hour horizons and state equivalence, 3 Hz packets at 3.3/6/10.2/12 APS, fractional carry-over, independent critical rolls, Golden outcomes, ordinary-only telemetry, target hit distributions, nonzero upgrade quanta, all 3,000-plus alternatives, deterministic reporting, 48-hour APS above 10, and warmed runtime below 2.5 seconds.
- `pnpm vitest run src/persistence/persistence-boundary.test.ts src/app/application.test.ts src/app/battle/controller.test.ts --reporter=verbose`: 38/38 passed, covering V1/V2/V3/V4/current saves, malformed recovery, reload, and controller/application integration.
- `pnpm check`: PASS; ESLint, Prettier, 20 files and 178 tests, Worker TypeScript, app TypeScript, and production build.
- `git diff --check`: PASS; only line-ending notices.
- Receipt observations: 48-hour APS is approximately 11.995; 49 hours continues progression; economy is not saturated; automatic-only Golden escapes, while manual plus automatic defeats it and grants one reward.
- Browser QA was not required because ABI-020 is a pure combat/domain balance task; application/controller integration is covered by executable tests.

## Scope

Independent QA was read-only and changed no product, Planner, Vault, Git, dependencies, ABI-031, or tooling files.
