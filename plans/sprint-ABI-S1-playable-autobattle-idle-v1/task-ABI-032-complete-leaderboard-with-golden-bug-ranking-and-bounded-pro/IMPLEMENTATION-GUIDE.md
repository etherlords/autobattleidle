---
plannerFormat: 1
id: ABI-032
artifact: implementation_guide
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

# ABI-032 implementation-guide

## Frozen scope

- Exactly ABI-032: cumulative Golden Bug defeats, Save V4 migration, additive D1 migration, atomic
  dual-metric submit, Level/Golden Bugs ranking modes, and boss-or-five-minute synchronization.
- Five minutes is the fixed default. Only dirty progress sends. A successful send resets the window;
  one request may be active; failures retain dirty progress with bounded retry delay.
- Worker ownership is `routes -> handler -> service -> repository -> db/schema`. SQL/D1 access belongs
  only to repositories; handlers own HTTP and services own use-case orchestration. Drizzle ORM is the
  only new runtime dependency. Do not add repository interfaces, DI containers, factories, or Drizzle
  Kit while Wrangler remains the production migration runner.
- Excluded: combined scores, accounts, historical-count estimation, rewards from ranking, background
  service workers, and changes to unrelated ABI tasks.

## Implementation sequence

1. Extend the pure combat state and lethal Golden Bug transition; add focused exactly-once/escape/
   saturation tests.
2. Add Save V4 contracts, one-hop migrations, strict validation, storage lifecycle changes, fixtures,
   and load -> migrate -> save -> reload proof while retaining V1/V2/V3 bytes.
3. Add `0002` as an expand-only D1 migration, dual metric/timestamp row types, atomic snapshot update,
   and parameterized bounded ranking queries with current-player rank.
4. Extend browser contracts/client and dialog with explicit Level/Golden Bugs mode controls while
   preserving Top/Around, focus, keyboard, responsive, offline, and rate-limit behavior.
5. Add the progress-sync state machine and wire controller snapshots. Detect a boss defeat from the
   pre-transition enemy plus lethal outcome; do not confuse Golden Bug defeats with boss triggers.
6. Add the Drizzle D1 schema and client, move persistence into repositories, and keep handlers free of
   SQL/D1 calls. Add feature services only where a use case has orchestration or policy to own.
7. Run focused suites, local D1 migrations from `0001` to `0002`, API smoke, historical-save proof,
   and `pnpm check`; then independent review, independent deployed QA, Vault update, exact-SHA release,
   and Manager closure.

## Verification matrix

- Unit: Golden Bug lethal/escape/duplicate/saturation; V1/V2/V3 -> V4; malformed V4; atomic independent
  maxima; metric ranking/ties; dirty/no-change; boss trigger; five-minute trigger/reset; in-flight
  coalescing; failed-request backoff; disposal.
- Integration: application does not submit each level; boss and timer paths submit latest level plus
  Golden Bugs; both modes retain Top/Around/rename/delete; reset/reload semantics remain explicit.
- Migration: existing D1 rows survive `0002` with zero Golden Bugs; both indexes/query plans are bounded;
  prior save bytes remain unchanged and migrated V4 reloads identically.
- Deployed: remote migration receipt, existing seeded players preserved, dual Top/Around views, current
  ranks, real Golden Bug increment, boss/timer network cadence, desktop/390px interaction, clean console,
  exact Worker version, and exact-SHA CI/Pages/Worker.
