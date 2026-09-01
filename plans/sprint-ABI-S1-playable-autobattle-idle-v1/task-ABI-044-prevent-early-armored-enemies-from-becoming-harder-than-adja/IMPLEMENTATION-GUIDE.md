---
plannerFormat: 1
id: ABI-044
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-018
  - ABI-028
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-044 implementation-guide

## Frozen scope

- Fix only elite `armor` and `hardened` modifier armor scaling.
- Retain the existing encounter-derived armor when it is below the player-relative ceiling.
- Ceiling contract: before penetration, modifier armor may prevent at most half of the player's current
  non-critical production damage. This bounds armored elite durability at 20 attacks and hardened at
  25 when penetration is zero; partial penetration improves both.
- Expose enemy raw armor, effective armor, and player penetration through the existing battle snapshot
  and HUD. No new panel, configuration system, persistence field, dependency, or combat engine.
- Boss armor/HP, Golden Bug, rewards, upgrade curves, save version, and ABI-043 remain unchanged.
- Endgame remains defined by 48 hours of production simulation. Rebaseline the derived probe encounter
  from the old wall-contaminated receipt to the corrected exact checkpoint; do not add compensating
  armor walls or economy changes merely to preserve the old encounter number.

## Implementation sequence

1. Add focused production-path regressions for encounters 36/48/57 and freeze the pre-fix evidence.
2. Thread the canonical player damage budget through the existing modifier decoration path and apply
   one shared ceiling to the armor added by `armor` and `hardened`.
3. Extend `BattleEnemySnapshot` with raw/effective armor derived from the same `effectiveArmor` helper.
4. Add one compact HUD status row and accessible text; keep zero-armor enemies uncluttered.
5. Prove exact/event-jump equivalence and the unchanged ordinary, boss, Golden Bug, reward, and upgrade
   contracts.
6. Run supported V3/V4 load -> save -> reload regression and `pnpm check`.
7. Recognize the exact former uncapped armored/hardened derived enemy in V3/V4, normalize it through
   the current spawn owner with proportional health, and reject shapes outside either supported form.

## Verification matrix

- **Unit:** zero/partial/high penetration, finite safe values, armored <=20 attacks, hardened <=25
  attacks, and unchanged boss/Golden formulas.
- **Integration:** encounter 36/48/57 production simulation; automatic-only, manual-only, and combined
  TTK; exact/event-jump equality; corrected 48h/49h checkpoints `250,863`/`257,354`; V3/V4 load ->
  save -> reload with active pre-cap armored and hardened fixtures preserving health fraction,
  encounter, player, currency, and V4 counters.
- **Performance:** warm the 48-hour event-jump path, require the measured run below 8 seconds, and keep
  the 45-second exact/event-jump equality gate; neither timing allowance may replace state equality.
- **UI integration:** snapshot values equal attack resolution; zero armor hides the line; armored and
  hardened enemies show raw armor, effective armor, and penetration in visible and accessible text.
- **Deployed:** exact-SHA Pages fixture on desktop and narrow viewport records
  `initial state -> attack/time -> resulting HP`, verifies readable mitigation and reload persistence,
  and reports console/network errors.
