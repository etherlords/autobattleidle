---
plannerFormat: 1
id: ABI-005
artifact: analysis
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

# ABI-005 analysis

## Verified current state

- ABI-002/004 own a deterministic immutable `CombatState` inside `startApplication`; renderers consume
  derived `BattleSnapshot` values. The current persistence placeholder incorrectly receives the
  snapshot and performs no load, save, flush, or reset.
- `CombatState` contains canonical player, enemy, coins, and unlock/progression values plus
  `nextAutomaticAttackAtMs`, which is a live scheduling deadline and must not be persisted.
- The browser composition currently creates a new state before it creates the persistence boundary.
  ABI-005 must load and validate canonical state before starting the application, then save only after
  meaningful state transitions.
- Vault `AUTOBATTLEIDLE-DOC-20260827-85CBFC` requires a schema version, strict field validation, safe
  new-game fallback, short debounce plus page-hide flush, user-confirmed reset, and no V1 offline
  rewards.

## Approach

- Define one schema-v1 DTO containing only canonical simulation fields: coins, automatic unlock,
  player upgrades/stats, and current enemy identity/health/reward data. Exclude DOM, Three.js,
  snapshots, events, RAF handles, absolute deadlines, and derived HUD values.
- Parse `unknown` once with explicit finite/range/integer/enum/object checks. Malformed or unsupported
  versions return the supplied new-game fallback without throwing or rewriting the stored value.
- Rehydrate the live automatic deadline from the current application time and canonical interval;
  locked games use zero. Offline reward/time progression remains out of scope.
- Reuse one localStorage key. Debounce state changes, flush on page hide/dispose, keep at most one
  pending timer/listener, catch storage errors, and never remove/overwrite the prior good value as an
  error-recovery action.
- Add a HUD reset control whose activation requires `window.confirm`; accepted reset clears storage
  and replaces live state with a fresh game in the existing application owner.

## Risks

- Persisting `BattleSnapshot` would lose authoritative enemy/player fields and duplicate derived data.
- Accepting structurally partial JSON can create impossible combat states or NaN/infinite formulas.
- Saving every RAF render would create unbounded writes; save calls must originate from actual attacks,
  purchases, reset, and final/page-hide flush rather than render.
- A failed `setItem` must leave the previous valid localStorage payload intact and retain a bounded
  retryable pending state without throwing into gameplay.
- Reset must clear both persisted and live state only after confirmation; cancellation is a no-op.

## Acceptance classification

- Unit: schema-v1 round trip, strict field/range/version rejection, fresh deadline rehydration,
  debounced/flush write bounds, write failure preservation, reset removal, and idempotent disposal.
- Integration: application loads before first render, saves canonical state only after meaningful
  combat/upgrades, reset replaces live state and storage, and snapshots/timers are absent from DTOs.
- Deployed: real browser save/reload restoration, malformed/unsupported recovery, confirmed/cancelled
  reset, bounded storage writes, desktop+narrow usability, and clean console on GitHub Pages.
