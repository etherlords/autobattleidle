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

- Own one optional current-boss encounter identity beside `azimuth` in `BattlefieldLifecycle`.
- Reset azimuth only at the existing `replaceEnemy` visual lifecycle seam when the next boss identity differs or the replacement is not a boss.
- Preserve HUD gestures, camera constants, attack arbitration, modal isolation, effects/death sequencing, save schema, and dependencies.

## Implementation sequence

1. Add the smallest boss-owner field and replacement-time comparison in `src/game/battlefield/lifecycle.ts`.
2. Extend the existing orbit lifecycle test; do not create a second camera controller or input gate.
3. Prove same-boss hits and resize preserve rotation, defeated-boss animation does not snap, ordinary/Golden Bug are locked, and a later boss starts at azimuth zero.
4. Run focused Vitest and `pnpm check`.

## Verification matrix

- Unit/integration: pointer/touch/keyboard intents remain unchanged; non-finite and non-boss rotation ignored; boss rotation persists through hit/resize; replacement and next boss reset; disposal remains idempotent.
- Persistence: valid historical V1/V2/V3 load/reload remains green and no azimuth/owner field appears in serialized saves.
- Deployed: desktop pointer + keyboard and 390px touch prove ordinary -> boss -> ordinary -> next boss, stationary attack, drag suppression, modal isolation, responsive framing, reload reset, clean console/network.
- Gates: implementation self-check, independent review, independent QA, exact-SHA CI/Pages verification, and Manager closure.
