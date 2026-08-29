---
plannerFormat: 1
id: ABI-014
artifact: implementation_guide
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

# ABI-014 implementation-guide

## Frozen scope

- Only the first enemy created for encounter 1 in a fresh run receives 10 max HP, yielding exactly 10 accepted baseline non-critical manual attacks at 1 damage.
- Encounter 2+, ordinary grades, elite modifiers, bosses, rewards, armor, endless rollover, player damage, `COMBAT_BALANCE` values unrelated to the starter exception, UI layout, and save schema remain unchanged.
- Existing valid V1/V2/current-slot/historical-slot data stays loadable; saved health is authoritative within the already validated historical/current enemy semantics.

## Implementation sequence

1. Add one named starter-health value beside existing combat balance constants.
2. Add `spawnStarterEnemy` as the explicit initial-state wrapper and keep ordinary `spawnEnemy`, including numeric encounter-1 rollover, on the existing base-health formula.
3. Add the smallest focused combat regression for ten production manual attacks and representative later-enemy equality.
4. Add/adjust one persistence regression proving new encounter-1 round-trip while retaining the existing historical fixture proof.
5. Run focused tests, `pnpm check`, and `git diff --check`; update the canonical enemy-tier Vault article after reviewable behavior is fixed.

## Verification matrix

- Unit: `spawnStarterEnemy(0).maxHealth === 10`; ten accepted baseline manual attacks defeat it, while nine do not; ordinary `spawnEnemy(1, 0)` and MAX_ENCOUNTER rollover remain 140 HP, and encounter 2 plus representative elite/boss/high encounters retain pre-change semantics.
- Integration: runtime and simulator start through `createCombatState -> spawnStarterEnemy` and continue through the shared `attack -> spawnEnemy` path; a fresh encounter-1 save round-trips, while historical V1/V2 fixtures and source slots remain supported without schema mutation.
- Browser QA: fresh app storage starts at 10/10 HP, nine canvas/keyboard attacks leave 1 HP, tenth advances to encounter 2; current save reload retains partial progress; seeded historical encounter-1 V2 reload retains its saved 140-based partial health.
- Deployed: exact pushed SHA passes CI and Pages; public URL repeats fresh-start and historical/current reload scenarios with zero console errors.
