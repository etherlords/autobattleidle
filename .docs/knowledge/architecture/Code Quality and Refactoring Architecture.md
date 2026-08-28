---
vaultFormat: 1
project: autobattleidle
vaultId: AUTOBATTLEIDLE-DOC-20260828-ECBD82
kind: architecture
status: active
summary: >-
  Ownership-first TypeScript refactoring rules, pattern-selection boundaries,
  blocking gates, and behavior-preserving proof.
tags:
  - architecture
  - code-quality
  - refactoring
  - typescript
---
# Code Quality and Refactoring Architecture

## Summary

Ownership-first TypeScript refactoring rules, pattern-selection boundaries, blocking gates, and behavior-preserving proof.

## Purpose

Keep Autobattle Idle readable and extensible without replacing small deterministic code with pattern ceremony. Refactors preserve gameplay, save compatibility, presentation semantics, and the module ownership in [[architecture/Technical Architecture|Technical Architecture]].

## Ownership and module shape

- Organize by feature and mutable-truth owner, not by file length alone. A layer directory must not become a flat dumping ground.
- Keep stable compatibility facades at `src/domain/combat.ts`, `src/game/enemy-visual.ts`, `src/game/battlefield.ts`, `src/ui/hud.ts`, and `src/persistence/persistence-boundary.ts`.
- Runtime entity composition lives under `src/game/units/`:
  - `core/` owns the generic `UnitModel`, `UnitView`, `UnitController`, `Unit`, typed local commands/events, subscription lifecycle, Three.js root attachment, tick, animation dispatch, and idempotent disposal.
  - `player/` and `enemy/` own concrete models, views, products, factories, and family-local configuration. Player and enemy are the real products proving the shared lifecycle.
  - `UNIT_FACTORIES` is the compiler-complete player/enemy product registry. A new runtime unit kind must add a concrete model/view/product/factory and satisfy the registry.
- `src/domain/combat/` keeps serializable contracts and pure deterministic transitions. Enemy tier definitions, modifier strategy/decorator classes, upgrade strategies, and stat accessors are compiler-complete owners; no Three.js object or runtime class enters a save payload.
- Model modifiers transform deterministic enemy construction drafts. View decorators attach independent grade, modifier, and seeded-decoration components to named roots. Model modifiers never mutate Three.js; visual decorators never change combat truth.
- Enemy construction has two enforced boundaries. `EnemyUnitBuilder` requires one coherent model/view/controller trio, verifies that the controller owns those exact instances, and seals one-shot construction. `EnemyViewBuilder` requires exactly one body, unique component keys, named layer roots, deterministic decorator order, unique animation names, component-local dispose hooks, and a sealed build. Body factories own concrete products; decorators own optional composition.
- Runtime actions use typed commands and local events: HUD intent -> battle command object -> BattleController handler -> pure domain transition -> controller event -> application-owned render/persistence. Enemy presentation uses the local chain `EnemyUnitCommand -> UnitController -> EnemyUnitView -> keyed body/component handler -> EnemyUnitEvent -> battlefield effect queue`; an event is emitted only when the view route accepted the command. Spawn, hit, and death keep their existing effect count and frame order.
- `src/game/battlefield/` owns scene, camera, renderer, effect resources, unit attachment/replacement, resize, and final teardown. Each UnitView owns its subtree and local animation/disposal.
- `src/ui/hud/` owns DOM components and emits one typed intent stream with symmetric unsubscribe/dispose. `src/persistence/save/` owns DTOs, codecs, migrations, validation, and browser storage. `src/app/` is the only cross-layer composition root.
- Shared `types.ts`, `helpers.ts`, or `shared` bags are not default destinations. Put a named contract or helper beside its owner; extract only when multiple local owners consume it.
- Path aliases remain deferred while feature directories keep imports shallow and make upward dependencies visible.

## Classes, composition, and pure functions

Use classes when an object owns mutable state, subscriptions, command routing, Three.js/DOM resources, animation state, construction invariants, or ordered disposal.

The runtime Unit contract is intentional and concrete:

- `UnitModel<TSnapshot>` owns immutable replacement of the latest presented model and local typed change events. It is not the authoritative combat/save state.
- `UnitView<TSnapshot>` wraps one Three.js container, owns attachment, synchronization, named animation handlers, tick, subtree resources, and idempotent disposal.
- `UnitController<TSnapshot>` routes typed local commands/events between exactly one model and one view.
- `Unit<TSnapshot>` is the public entity entry point. Concrete `PlayerUnit` and `EnemyUnit` products supply family behavior without moving combat formulas into the base.
- Specific subclasses are justified only by different lifecycle, construction, command, or view behavior. Do not create one subclass merely for each data row.

Use factories for multiple real products and an invariant builder for multi-step enemy view construction. Use model strategy/decorator classes for independently composable combat modifiers and view decorator classes for independently attachable visual components. Each significant production class lives in its owner file.

Keep formulas, codecs, validation, finite mappings, formatting, and immutable combat transitions pure. Plain save DTOs and snapshots remain plain data. A class-based God object, global event bus, service locator, reflection container, or decorator that only renames an object spread is rejected.

Typed lookup tables remain appropriate for finite exhaustive data mappings. Selection/display orders for grades, body families, modifiers, and upgrades must be compile-time complete as well as runtime validated, so a new union member cannot compile while silently disappearing from selection. Strategy/factory/command objects are required when variants perform genuinely different construction or behavior. Branches remain valid for guards and small state checks; branch-heavy product construction and repeated behavior selection belong in exhaustive factories/registries.

## Readability rules

- Public and cross-module contracts have explicit names. Do not expose indexed-access aliases such as `BattleSnapshot["enemy"]`.
- Nested ternaries are prohibited. Resolve decisions with named policies, lookup tables, or readable branches.
- Switches are acceptable only for small exhaustive state transitions. Repeated product construction or behavior selection uses an exhaustive typed registry/strategy.
- Production files at 300 lines and functions at 80 lines are mandatory review triggers, not automatic proof of bad design. New complexity requires a recorded split or conscious keep decision.
- Authored colors, dimensions, offsets, scales, timing, and animation rates live in named owner-local configuration. Do not create a global bag of constants or meaningless aliases for ordinary arithmetic.
- One significant lifecycle/view class per file. Small owner-local types and pure helpers stay colocated when splitting would only add navigation.
- Domain imports no DOM or Three.js. UI/game/persistence do not mutate combat truth. App may import all layers only for composition.

## Automated gates

The blocking quality command remains `pnpm check` and includes strict TypeScript, ESLint, Prettier check, Vitest, and the production build.

ESLint blocks nested ternaries, TypeScript indexed-access types in production contracts, ignored compiler diagnostics, unsafe/double assertions, explicit `any`, excessive complexity/depth, upward/cross-layer imports, implicit exported boundaries, lonely/avoidable else branches, multiple significant production classes in one file, and root imports that bypass the application boundary.

The one-class rule applies to production owners, not test fixtures. It exists to keep lifecycle/strategy/decorator ownership navigable; small data types and pure helpers stay beside their owner. Layer rules keep domain pure and make application the only cross-layer composition root.

Use the installed ESLint and TypeScript tooling. Do not add a custom architecture scanner for semantic claims ESLint cannot prove. Correct component attachment, factory completeness, builder invariants, event/render/persistence semantics, and resource disposal require focused tests plus independent review.

Numeric file/function thresholds remain review triggers rather than fragmentation quotas.

## Refactor proof

The refactor is behavior-preserving:

1. Record the green baseline and characterization tests before moving ownership.
2. Move one responsibility at a time while preserving public behavior.
3. Keep deterministic combat snapshots and fixed-roll progression outputs identical.
4. Keep save v1/v2/current load, migrate, save, and reload behavior identical.
5. Keep enemy visual specs, stable seeds, scene-child bounds, animation cues, and disposal behavior identical.
6. Keep HUD pointer/keyboard/modal/accessibility/listener behavior identical on desktop and 390px layouts.
7. Require focused tests, `pnpm check`, independent review, independent browser QA, and deployed Pages proof.

## Non-goals

- No gameplay rebalance, Golden Bug implementation, new unit type, new animation feature, save schema change, UI redesign, engine migration, or package split.
- No mandatory class, factory, decorator, builder, or inheritance quota.
- No copy of Dungeon Crawler engine-specific Stage2D/Stage3D APIs.

## Related

- [[architecture/Technical Architecture|Technical Architecture]]
- [[quality/Testing Strategy|Testing Strategy]]
- [[design/Enemy Tiers and Boss Cadence|Enemy Tiers and Boss Cadence]]

## Planned local commit enforcement and alias decision

ABI-021 will add a tracked native Git pre-commit hook that runs the canonical `pnpm check` and blocks a commit on lint, Prettier check, tests, TypeScript, or build failure. The hook will not auto-format or mutate staged files; the developer fixes or runs `pnpm format`, stages the result, and retries. Exact-SHA CI runs the same command independently because local hooks can be bypassed.

No hook framework dependency is planned. Installation must be idempotent, repository-scoped through `core.hooksPath`, and proven on Windows without creating a real publication. Reviewer and Manager evidence must cite fresh command output or exact-SHA CI, not a prose claim.

Path aliases remain deferred while imports are shallow and ownership direction is clearer with relative paths. Reconsider aliases only when repeated deep traversal creates measured friction and TypeScript, Vite, Vitest, plus layer-lint can share one mapping without hiding upward dependencies.
