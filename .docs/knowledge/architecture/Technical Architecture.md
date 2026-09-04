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

- `src/domain` owns serializable combat contracts, deterministic immutable transitions, balance, tier definitions, model modifier strategies, attack-source policies, upgrade strategies, stat accessors, and snapshots; it imports no DOM or Three.js APIs. Enemy modifier IDs are finite and save-validatable; hardened, critical-guard, and manual-guard add derived behavior without a save-shape or version change.
- `src/game/units/core` owns the shared runtime Unit MVC lifecycle. UnitModel owns presented model state/events, UnitView owns a Three.js subtree/animation/disposal, UnitController routes local commands/events, and Unit is the entity entry point.
- `src/game/units/player` and `src/game/units/enemy` own concrete models, views, products, factories, and the full `EnemyUnitBuilder`. The player module owns the finite authored evolution catalogue: canonical encounter level selects a major form plus the bounded milestone identity across 100–900, 1000–9000, 10000–48000, 50000–95000, and 100000 clamp bands; each milestone uses one bounded authored marker, and changing identity replaces and disposes only the owned evolution subtree while retaining attack and aura sockets. The typed factory registry composes real player/enemy products. `EnemyUnitBuilder` validates the model/view/controller trio; `EnemyViewBuilder` validates one body, keyed components, named roots, command handlers, deterministic decorator order, disposal hooks, and sealed construction. Enemy body factories are exhaustive across beetle, brute, wisp, mantis, sentinel, drake, boss-colossus, and boss-hydra. Stable family-local profiles provide three bounded palette/decor/attachment compositions per family, while grade/modifier decorators remain independently attachable.
- `src/game/enemy-visual` owns the deterministic composition receipt and boss geometry profile registry. Production boss geometry builders are the single geometry source for production and Visual Lab candidates; the factory exposes an explicit `legacy/no-overlay` composition mode so lab recipes do not silently retain production overlays.
- `src/debug/visual-lab` owns bounded, URL-addressable visual probes. Its enemy selectors reuse production family, affinity, grade, modifier, variant, and receipt registries; its recipe selector explains boss-only invalid combinations; its player selector exposes exact milestone levels and reports the resolved level/milestone receipt.
- `src/game/battlefield` owns scene, camera, renderer, bounded effects, Unit attachment/replacement, responsive framing, and final teardown. It renders domain snapshots and does not mutate combat truth.
- `src/ui` owns DOM HUD components, accessible controls, listener lifecycle, and one typed intent stream.
- `src/persistence` owns validated save DTO serialization, migration, and localStorage lifecycle. Runtime Unit classes, Three.js objects, and derived player visual identity are never persisted.
- `src/app` is the only cross-layer composition root: it creates modules, maps HUD intents to command objects, schedules frames, consumes controller events, and coordinates coherent render/save side effects.

## Data flow

Browser input emits a typed HUD intent. The application maps it to a battle command object. BattleController executes a named handler over pure domain transitions, then publishes a typed controller event. The application persists successful state changes once and renders a BattleSnapshot once.

Battlefield maps snapshots and frame differences to PlayerUnit/EnemyUnit sync, spawn, hit, death, tick, and disposal commands. Player visual identity is derived at render time from `BattleSnapshot.enemy.level`: levels 1000–1999 add one bounded detail each 200 levels, level 2000 replaces the whole form with Aether Warden, and higher levels reuse explicit authored endpoints rather than allocating per literal 1000 levels. Structured outbound damage cues animate the player attack only; enemy impact cues never trigger player recoil. UnitController routes an enemy command into EnemyUnitView, which dispatches it to keyed body/component handlers; only an accepted view command produces a typed EnemyUnitEvent, and battlefield converts that event into the existing bounded spawn/hit/death effect while preserving frame order. UnitView owns Three.js attachment, local animation handlers, and subtree disposal. Persistence stores only canonical plain CombatState data; Unit models, views, controllers, subscriptions, scene resources, derived visual identity, and timers are rebuilt after load.

## Stack

V1 is a static Vite browser application using TypeScript, Three.js, DOM controls, and browser localStorage. It uses the installed Vite, TypeScript, Vitest, ESLint, Prettier, and Three.js toolchain. No backend, asset pipeline, or network service is part of the release.

## Related




- [[decisions/V1 Scope Decisions|V1 Scope Decisions]]
- [[quality/Testing Strategy|Testing Strategy]]
- [[architecture/Persistence Contract|Persistence Contract]]
