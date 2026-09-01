---
plannerFormat: 1
id: ABI-046
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-038
  - ABI-045
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-046 implementation-guide

## Frozen scope

- Production player visuals only: finite form selection, one 200-level/four-detail transition, sockets, presentation animation, sync, and disposal.
- No combat, balance, rewards, leaderboard, input, worker, dependency, or save-schema changes.
- Reuse the approved ABI-038/ABI-045 geometry; no new major forms or abstraction layer.

## Implementation sequence

1. Move the approved player evolution owner from debug into `src/game/units/player` and keep the lab as a thin consumer.
2. Add `level` to `PlayerUnitSnapshot`; select form/detail identity with one pure finite function.
3. Sync the player from `BattleSnapshot.enemy.level`, replace and dispose only when identity changes, and retain attack/aura sockets plus tick/hit/attack presentation.
4. Add boundary, repeated-swap, battlefield integration, reduced-motion, and V1-V4 reload-equivalence tests.

## Verification matrix

- Unit: exact thresholds 1/100/500/1000/1200/1400/1600/1800/2000/10000/36365 and at most four details.
- Integration: battlefield syncs the player without changing combat snapshots, high-APS effects, camera azimuth, or input ordering.
- Persistence: every supported V1-V4 fixture loads, renders the same derived identity, saves V4, and reloads without progress loss or a new field.
- Resources/UI: repeated transitions dispose each old geometry/material once; desktop, 390×844, and reduced motion remain readable.
