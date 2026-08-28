---
plannerFormat: 1
id: ABI-015
artifact: brief
project: ABI
profile: high-assurance
revision: 12
status: In QA
sprintId: ABI-S1
dependencies:
  - ABI-008
  - ABI-009
  - ABI-013
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-015: Establish enforceable architecture boundaries and refactor core modules

## Goal

Establish enforceable architecture boundaries and refactor core modules

## Work item

- Type: task
- Priority: critical
- Status: In QA

## Acceptance criteria

- [ ] The change remains behavior-preserving: no gameplay rebalance, ABI-016-022 feature implementation, UI redesign, persistence schema change, engine migration, or package split; deterministic outputs, events, saves, seeds, cues, and public behavior remain compatible.
- [ ] Combat is decomposed behind the stable combat.ts facade into named contracts/balance, enemy progression and creation, attacks, and upgrades; immutable serializable CombatState remains model data and deterministic transitions remain pure.
- [ ] A lifecycle-owning application CombatController is the command entry point for attack, purchase, time/frame, reset, and restore state replacement; it emits a small exhaustive typed event union so application composition renders and persists from explicit events instead of duplicating closure-side effects.
- [ ] Enemy presentation is a component-composed Three.js view: a typed factory selects every proven body family, a builder enforces one root/body plus named grade/modifier/decoration layers and animation hooks, and exhaustive decorators add grade, modifier, and seeded decoration components without selection switch/if ladders.
- [ ] View-specific geometry, colors, positions, rotations, scales, effect lifetimes, and narrow-layout framing are named in feature-local visual configuration; every body/grade/modifier combination remains readable at desktop and 390px with no clipping or detached/embedded decorations.
- [ ] HUD remains decomposed into lifecycle-owning DOM components composed by a narrow facade, preserving pointer, keyboard, focus, accessibility, listener symmetry, restore/reset, render, and disposal behavior.
- [ ] Persistence remains decomposed into named save contracts/validation, version migrations, and browser storage lifecycle while all supported legacy/v1/v2/current fixtures preserve load, repair, migrate, save, and reload semantics with no valid-progress loss.
- [ ] Public and cross-module contracts are explicitly named and finite; production TypeScript has no indexed-access contract aliases, nested ternaries, branch-heavy variant construction, or upward/cross-layer imports; installed ESLint rules enforce every reliable zero-baseline invariant.
- [ ] Factories, builders, decorators, controllers, classes, and events must own real variation, construction invariants, or lifecycle; no one-class-per-data-record hierarchy, global event bus, dependency growth, package split, or engine-specific framework is introduced.
- [ ] Characterization and focused tests prove combat/controller event order, factory extensibility and exhaustive registries, builder invariants, decorator attachment/animation/disposal, save compatibility, HUD behavior, and unchanged outputs; independent review has no unresolved P0-P2, independent visual/browser QA covers every reachable family/grade/modifier at desktop and 390px plus long-run resources, and exact-SHA CI/Pages/deployed proof passes.

## Dependencies

- ABI-008
- ABI-009
- ABI-013

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260828-ECBD82
- AUTOBATTLEIDLE-DOC-20260827-D74E4E
- AUTOBATTLEIDLE-DOC-20260827-D1B235
- AUTOBATTLEIDLE-DOC-20260827-A7FD1F

## Constraints

- Follow the resolved workflow contract and project instructions.
