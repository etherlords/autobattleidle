---
plannerFormat: 1
id: ABI-025
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-016
  - ABI-023
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-025 implementation-guide

## Frozen scope

- Orbit ordinary, boss, and Golden enemies through the existing `BattlefieldLifecycle` camera owner.
- Preserve one session-level azimuth across every enemy replacement; reset only on battlefield/session initialization or explicit reset.
- Preserve enemy-specific radius/elevation/framing, HUD gestures, attack arbitration, modal isolation, effects/death sequencing, save schema, and dependencies.

## Implementation sequence

1. Remove the boss-only rotation guard and use the existing finite-delta validation for every displayed enemy.
2. Apply the stored azimuth to ordinary, boss, and Golden camera positions while retaining current distance/elevation selection.
3. Remove boss encounter ownership and replacement-time azimuth reset; keep initialization/disposal boundaries unchanged.
4. Replace old boss-only assertions with transition continuity tests for ordinary -> ordinary -> boss -> ordinary -> Golden -> boss, including lethal handoff and resize.
5. Run focused Vitest and `pnpm check`, then fresh independent review, independent browser QA, verification, and Manager closure.

## Verification matrix

- Unit/integration: pointer/touch/keyboard intents remain unchanged; non-finite rotation ignored; all enemy types rotate; azimuth persists through hits, resize, lethal animation, and every replacement pair; disposal remains idempotent.
- Persistence: valid historical V1/V2/V3 load/reload remains green and no azimuth/owner field appears in serialized saves.
- Deployed: desktop pointer + keyboard and 390px touch prove ordinary -> ordinary -> boss -> ordinary -> Golden -> boss continuity, stationary attack, drag suppression, modal isolation, responsive framing, reload reset, clean console/network.
- Gates: implementation self-check, independent review, independent QA, exact-SHA CI/Pages verification, and Manager closure.
