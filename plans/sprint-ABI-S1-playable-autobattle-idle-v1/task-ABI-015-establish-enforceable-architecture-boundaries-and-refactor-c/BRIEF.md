---
plannerFormat: 1
id: ABI-015
artifact: brief
project: ABI
profile: high-assurance
revision: 1
status: Ready
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
- Status: Ready

## Acceptance criteria

- [ ] The change is behavior-preserving: no gameplay rebalance, Golden Bug work, new unit behavior, UI redesign, persistence schema change, engine migration, or package split; current deterministic outputs and public application behavior remain unchanged.
- [ ] Combat is decomposed by ownership into named contracts, balance/formulas, enemy progression/creation, attacks, and upgrades behind one stable public module; immutable serializable state and deterministic policies remain plain data plus pure functions.
- [ ] Upgrade selection uses an exhaustive typed policy/strategy registry or equally readable named policies; nested ternaries and repeated behavior-selection switches are removed without introducing one class per data record or a speculative combat-unit inheritance hierarchy.
- [ ] Enemy presentation uses lifecycle-owning Three.js view components: a small typed factory selects the five proven body families, grade/modifier/seeded-decoration layers compose independently, animation stays with the owning view, authored visual values live in named owner-local config, and disposal is complete and idempotent.
- [ ] HUD is decomposed into lifecycle-owning DOM components for battle status, upgrade dialog, and event log, composed by a narrow HUD facade; each component owns its subtree/listeners while pointer, keyboard, focus, accessibility, render, restore/reset, and disposal behavior remains unchanged.
- [ ] Persistence is decomposed into named save contracts/validation, version migrations, and browser storage lifecycle while all supported legacy/v1/v2/current fixtures preserve load, repair, migrate, save, and reload semantics with no valid-progress loss.
- [ ] Public and cross-module contracts are explicitly named; production TypeScript contains no indexed-access contract aliases such as BattleSnapshot["enemy"], no nested ternaries, and no upward/cross-layer imports that violate domain/game/ui/persistence/app ownership.
- [ ] Blocking quality gates use the installed toolchain wherever possible and make pnpm check enforce strict TypeScript, ESLint, Prettier, focused tests, and production build; numeric file/function thresholds remain review triggers rather than fragmentation-inducing hard quotas.
- [ ] Characterization and focused regression tests prove deterministic combat/progression, historical-save compatibility, enemy seed/spec/animation/replacement/disposal bounds, and HUD interaction/listener behavior; independent review has no unresolved P0-P2, independent real-browser QA covers desktop and 390px plus long-run resources, and exact-SHA CI/Pages/deployed proof passes.

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
