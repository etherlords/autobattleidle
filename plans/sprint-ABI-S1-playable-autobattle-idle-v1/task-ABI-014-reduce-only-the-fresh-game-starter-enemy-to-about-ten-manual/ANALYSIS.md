---
plannerFormat: 1
id: ABI-014
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-013
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-014 analysis

## Verified current state

- `planner_next_task` selects ABI-014 at task revision 4; ABI-013, ABI-015, and ABI-023 are Done, `openDependencies=[]`, and ABI-014 was unclaimed before the Manager lease.
- `HEAD` and fetched `origin/main` both resolve to `5982d98dc1a102a3826f486d250ba2d7480a8b70`; the worktree was clean apart from Planner writes made under this task.
- Planner doctor is healthy with no findings or recovery, and Vault status/doctor report a fresh 14-article index with no findings.
- `src/domain/combat/progression.ts::spawnEnemy` is the shared normal progression constructor used by encounter transitions, persistence recognition/migration, and rollover. Fresh runtime and `simulateProgression` start through `createCombatState`, which now uses the explicit `spawnStarterEnemy` wrapper.
- Normal numeric encounter 1 has 140 HP and remains the endless-rollover target. Only `spawnStarterEnemy` overlays 10 HP for the initial fresh state; encounter 2+ health, grades, modifiers, armor, rewards, bosses, and endless rollover remain derived by `spawnEnemy`.
- V2 validation accepts the fresh 10-HP starter plus current/historical 140-HP encounter-1 semantics. Historical encounter-1 saves therefore remain valid after the fresh-start rule.

## Approach

- Add one named `starterEnemyHealth: 10` balance value and apply it only in `spawnStarterEnemy`, called by `createCombatState`; leave `spawnEnemy` and its normal encounter-1/later formulas unchanged for progression and rollover.
- Prove exactly 10 baseline manual attacks through the production `attack` path, and snapshot representative encounter 2, elite, boss, and high-encounter enemies before/after the change.
- Prove a newly encoded encounter-1 save round-trips and the existing historical V2 fixture still loads with its saved partial health. No save version, slot, migration, or payload field changes.
- Acceptance classification: hit count and unchanged samples are unit evidence; save compatibility and runtime reload are integration evidence; fresh start, historical/current reload, CI/Pages, and public browser behavior are deployed evidence.
- Persistence impact: **no schema change**. Existing payloads retain their saved enemy health and are neither reset nor rewritten merely because fresh encounter-1 balance changed.

## Risks

- Changing `baseEnemyHealth` or keying only on numeric encounter 1 would rebalance later enemies or endless rollover; keep the exception in the explicit fresh-state constructor.
- Tightening V2 recognition to only new semantics would reject valid historical encounter-1 saves; preserve the existing current-or-historical recognition path and cover it directly.
- A test that calls only an enemy constructor would not prove accepted manual input count; use repeated production `attack` commands with non-critical rolls and separately prove MAX_ENCOUNTER rollover uses normal `spawnEnemy(1)` semantics.
- Browser reload can preserve a partially damaged current save rather than demonstrate a fresh start; QA must clear only the app save slots for the fresh-start case and separately seed historical/current saves.
