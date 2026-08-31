---
plannerFormat: 1
id: ABI-032
artifact: analysis
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

# ABI-032 analysis

## Verified current state

- `src/app/application.ts` submits `enemy.encounter` after every controller event and marks the
  level as submitted before the request succeeds. Requests may overlap and a failed value is not
  retried. There is no timer or coalescing owner.
- `CombatState` has an active `goldenBug` encounter but no cumulative defeat count. The pure lethal
  transition in `src/domain/combat/attacks.ts` is the narrow owner that can distinguish a defeated
  Golden Bug from an escape, boss, ordinary kill, nonlethal hit, or ignored duplicate attack.
- Persistence currently writes V3. Historical saves cannot reveal whether earlier Golden Bugs were
  defeated or escaped, so a truthful V4 migration must initialize the new count to zero.
- D1 migration `0001_leaderboard.sql`, the score endpoint, player row, ranking queries, browser DTO,
  and dialog all contain only `best_level`/`level`.
- ABI-030's active Vault decision documents only best-level ranking and must be amended in this task.
- Worker HTTP handlers currently call D1 store functions directly. Feature folders are readable, but
  request mapping, use-case orchestration, and persistence ownership are not explicit enough for the
  next leaderboard capability.
- Persistence impact: **schema migration**. The browser save requires V4 and D1 requires an additive,
  forward-only `0002` migration. Existing player rows and V1/V2/V3 source bytes must be preserved.

## Approach

- Add `goldenBugDefeats` to `CombatState`, saturating at `Number.MAX_SAFE_INTEGER`, and increment it
  exactly once in the lethal active-Golden-Bug branch. Fresh games and resets start at zero.
- Add explicit one-hop V1 -> V2 -> V3 -> V4 adapters, a strict V4 decoder/key, and historical fixtures.
  V1-V3 migrate to zero Golden Bug defeats without removing or rewriting their source storage.
- Add D1 columns for Golden Bug maximum and achievement time plus a dedicated ranking index. Existing
  rows default to zero. Submit `{ level, goldenBugs }` in one validated atomic update with independent
  monotonic maxima/timestamps.
- Keep two transparent modes, `level` and `golden-bugs`; both reuse bounded Top 100 and Around Me
  queries and order by metric descending, its achievement timestamp ascending, then player ID.
- Introduce one small progress-sync owner. It tracks latest, acknowledged, in-flight, dirty, next
  timer, and a boss trigger. Metric changes only mark dirty. A defeated boss or five elapsed minutes
  triggers one request. Success acknowledges the captured snapshot and restarts five minutes; changes
  made in flight remain dirty. A boss trigger received in flight coalesces into one immediate follow-up;
  ordinary changes wait for the reset timer. Failure keeps dirty state and applies one five-minute
  retry delay, never a frame/level retry loop.
- Use Drizzle's native D1 adapter with one named SQLite schema. Keep `routes -> handler -> service ->
  repository -> db`: handlers map HTTP/auth/results, services orchestrate use cases, and repositories
  alone query D1. Do not add one-implementation interfaces, factories, or a second migration runner;
  Wrangler SQL migrations remain the production rollout contract.

## Risks

- Historical Golden Bug totals are unknowable; fabricating them from encounter number would count
  escapes as defeats. The UI/documentation must state that the counter starts with V4.
- Reset may lower local progress but the public ranking remains monotonic until the user explicitly
  deletes the leaderboard identity; save reset and leaderboard deletion remain separate actions.
- A tab may suspend timers. Resume/frame processing may send one overdue dirty snapshot, but never a
  catch-up burst.
- Worker and Pages can overlap during rollout. Expand-first D1 defaults and a Worker accepting the new
  payload are deployed before Pages uses dual ranking; rollback keeps the additive columns/index.
- The Drizzle schema and Wrangler SQL can drift. Repository tests plus a real local `0001 -> 0002`
  migration/API smoke must prove that the mapped columns and constraints match before deployment.
