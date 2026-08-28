---
plannerFormat: 1
id: ABI-005
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-002
  - ABI-004
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-005 implementation-guide

## Frozen scope

- Implement schema-v1 localStorage persistence for live canonical combat progress only.
- Include strict validation, safe malformed/unsupported fallback, short debounced writes, page-hide and
  disposal flush, storage-failure containment, load/save/reset composition, and confirmed reset UI.
- Exclude DOM/Three.js/BattleSnapshot/event-log data, RAF/timer deadlines, offline rewards, migrations
  beyond explicitly supported versions, cloud sync, multiple save slots, and ABI-006 balance changes.

## Implementation sequence

1. Define the smallest named schema-v1 save DTO and pure encode/decode/rehydrate functions beside the
   persistence boundary.
2. Validate every unknown field and enum; return the caller's safe new-game state for invalid JSON or
   unsupported versions without mutating storage.
3. Replace the placeholder with one localStorage adapter owning one debounce timer and one page-hide
   listener; flush the latest canonical state and contain read/write/remove failures.
4. Compose browser load before `startApplication`; pass live `CombatState` changes to persistence only
   after attacks and successful purchases, not every render.
5. Add HUD reset registration/control. On confirm, clear the save and replace live state with a new
   state; on cancel, do nothing.
6. Add focused codec/adapter/application/HUD tests, run focused tests and `pnpm check`, then self-review
   the full ABI-005 diff.

## Verification matrix

- Unit: exact schema round trip; malformed JSON, partial objects, invalid numbers/enums and unknown
  version fallback; timer/snapshot absence; debounce coalescing; page-hide/dispose flush; failed
  `setItem` preserves the old payload; reset removes once; disposal removes listener/timer once.
- Integration: attack/purchase produces a bounded pending save, reload restores coins/enemy/player,
  automatic scheduling restarts from current time, confirmed reset clears storage and live progress,
  cancelled reset is unchanged.
- Browser: local desktop and narrow proof for save/reload, corruption and unsupported-version recovery,
  reset cancel/confirm, write-count bounds and clean console.
- Delivery: fresh `pnpm check`, independent Review and QA PASS, coherent commit/push, CI/Pages success,
  then repeat persistence scenarios at `https://etherlords.github.io/autobattleidle/`.
