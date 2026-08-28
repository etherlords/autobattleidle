---
vaultFormat: 1
project: autobattleidle
vaultId: AUTOBATTLEIDLE-DOC-20260827-D74E4E
kind: architecture
status: active
summary: 'V1 module ownership, data flow, and browser stack boundaries.'
tags:
  - architecture
  - modules
  - threejs
---
# Technical Architecture

## Ownership

- `src/domain` owns serializable combat contracts, deterministic immutable transitions, balance, tier definitions, model modifier strategies, upgrade strategies, stat accessors, and snapshots; it imports no DOM or Three.js APIs.
- `src/game/units/core` owns the shared runtime Unit MVC lifecycle. UnitModel owns presented model state/events, UnitView owns a Three.js subtree/animation/disposal, UnitController routes local commands/events, and Unit is the entity entry point.
- `src/game/units/player` and `src/game/units/enemy` own concrete models, views, products, factories, and the full `EnemyUnitBuilder`. The typed factory registry composes real player/enemy products. `EnemyUnitBuilder` validates the model/view/controller trio; `EnemyViewBuilder` validates one body, keyed components, named roots, command handlers, deterministic decorator order, disposal hooks, and sealed construction.
- `src/game/battlefield` owns scene, camera, renderer, bounded effects, Unit attachment/replacement, responsive framing, and final teardown. It renders domain snapshots and does not mutate combat truth.
- `src/ui` owns DOM HUD components, accessible controls, listener lifecycle, and one typed intent stream.
- `src/persistence` owns validated save DTO serialization, migration, and localStorage lifecycle. Runtime Unit classes and Three.js objects are never persisted.
- `src/app` is the only cross-layer composition root: it creates modules, maps HUD intents to command objects, schedules frames, consumes controller events, and coordinates coherent render/save side effects.

## Data flow

Browser input emits a typed HUD intent. The application maps it to a battle command object. BattleController executes a named handler over pure domain transitions, then publishes a typed controller event. The application persists successful state changes once and renders a BattleSnapshot once.

Battlefield maps snapshots and frame differences to PlayerUnit/EnemyUnit sync, spawn, hit, death, tick, and disposal commands. UnitController routes an enemy command into EnemyUnitView, which dispatches it to keyed body/component handlers; only an accepted view command produces a typed EnemyUnitEvent, and battlefield converts that event into the existing bounded spawn/hit/death effect while preserving frame order. UnitView owns Three.js attachment, local animation handlers, and subtree disposal. Persistence stores only canonical plain CombatState data; Unit models, views, controllers, subscriptions, scene resources, and timers are rebuilt after load.

## Stack

V1 is a static Vite browser application using TypeScript, Three.js, DOM controls, and browser localStorage. It uses the installed Vite, TypeScript, Vitest, ESLint, Prettier, and Three.js toolchain. No backend, asset pipeline, or network service is part of the release.

## Related



- [[decisions/V1 Scope Decisions|V1 Scope Decisions]]
- [[quality/Testing Strategy|Testing Strategy]]
- [[architecture/Persistence Contract|Persistence Contract]]
