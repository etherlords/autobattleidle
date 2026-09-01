---
plannerFormat: 1
id: ABI-046
artifact: analysis
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

# ABI-046 analysis

## Verified current state

- `BattleSnapshot.enemy.level` is the canonical persisted-progression projection already delivered to `Battlefield.render`; `PlayerUnitSnapshot` currently carries only position and the production view always builds one static core/platform.
- ABI-038/ABI-045 already provide six finite authored forms, one tested Runeblade-to-Warden transition, attack/aura sockets, reduced-motion behavior, and exact disposal in `src/debug/visual-lab/player-evolution.ts`.
- Player rendering is owned by `src/game/units/player`; battlefield owns sync/tick/camera and persistence stores only `CombatState`. Therefore this is **no schema change**.
- Baseline focused proof passed 4/4 tests before the ownership move.
- Vault authority: `Game Design Overview#Player promise` (`AUTOBATTLEIDLE-DOC-20260827-A7F881`, hash `4535a96f5e57f3889d2485bb0dcfd92304c43e758a2281c9017e1a65154a01fc`) fixes the 200-level cadence/four-detail ceiling; Technical Architecture keeps Three.js in `src/game` and runtime objects out of persistence.

## Approach

- Move the approved form catalogue, selector, builders, sockets, animation state, and disposal into one production player-evolution module; the debug lab imports that owner rather than remaining a production dependency.
- Add canonical progression level to `PlayerUnitSnapshot`, sync it from `BattleSnapshot.enemy.level`, and replace only the authored form subtree when selected form/detail identity changes.
- Preserve the existing UnitModel/View/Controller lifecycle, player anchor, combat/economy/scheduling/input contracts, finite catalogue, and resource ownership.
- Treat levels 1000-1999 as the bounded four-detail transition and level 2000 as its authored Warden endpoint; hold finite authored forms between explicit milestones instead of generating meshes per literal 1000 levels.

## Risks

- A form swap can double-dispose or leak geometry/materials; test repeated identity changes and final teardown with exact receipts.
- Larger forms can obscure narrow/boss framing; verify production desktop/narrow projection and existing camera orbit.
- Historical saves can regress indirectly if render identity is persisted; prove V1-V4 load -> render -> save -> reload while keeping save version 4 and source bytes intact.
