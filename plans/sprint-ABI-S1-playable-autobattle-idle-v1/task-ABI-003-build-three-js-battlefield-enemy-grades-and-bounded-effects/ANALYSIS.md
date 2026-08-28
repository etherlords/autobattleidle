---
plannerFormat: 1
id: ABI-003
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-002
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-003 analysis

## Verified current state

- ABI-002 and ABI-004 already supply the deterministic combat state, immutable `BattleSnapshot`,
  one application RAF, responsive HUD, manual/automatic attacks, rewards, upgrades, and disposal.
- `src/game/battlefield.ts` currently owns one Three.js scene, renderer, camera, lights, ground, and
  static player/enemy meshes. Its `render` ignores the snapshot; the enemy has no grade identity or
  bounded combat effects yet.
- `src/app/application.ts` is the sole composition owner and already passes the same snapshot to the
  battlefield, HUD, and persistence boundary. Visual code must remain a consumer only.
- Canonical design is fixed by Vault articles `AUTOBATTLEIDLE-DOC-20260827-A7FD1F` and
  `AUTOBATTLEIDLE-DOC-20260827-584401`: four distinct grades, non-color-only elite/boss cues,
  short spawn/hit/death feedback, and no visual mutation of combat outcomes.

## Approach

- Reuse the existing scene and application RAF. Derive visual transitions by comparing consecutive
  immutable snapshots inside the battlefield; do not add another scheduler or simulation owner.
- Replace only the enemy presentation when encounter/grade changes. Use distinct primitive
  silhouettes and scale for normal, veteran, elite, and boss; add geometry-based modifier/boss cues.
- Keep effects in a small bounded collection updated by the existing render timestamp/snapshot flow.
  Remove and dispose expired or replaced objects immediately and make `dispose()` idempotent.
- Add focused Three.js lifecycle tests with a minimal renderer seam if needed, then verify integrated
  application behavior and the deployed browser presentation.

## Risks

- WebGL is unavailable in the unit DOM, so tests must exercise scene ownership without coupling to a
  real GPU context.
- Replacing meshes can leak geometry/materials unless every retired object is disposed exactly once.
- HP deltas and encounter changes can occur in one simulation transition; effect derivation must not
  duplicate hit/death/spawn feedback or change combat state.
- Responsive proof and silhouette recognizability require real-browser desktop and narrow checks.

## Acceptance classification

- Unit: grade-to-silhouette mapping, non-color-only modifier/boss cues, bounded effect counts,
  replacement cleanup, and idempotent disposal.
- Integration: immutable snapshots drive visible enemy/player state and hit/death/spawn transitions
  through the existing single application RAF without changing domain outcomes.
- Deployed: desktop and narrow layouts visibly separate combatants, expose all four recognizable
  grades/cues/effects, remain stable over a bounded long run, and produce no console errors.
