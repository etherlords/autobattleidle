---
plannerFormat: 1
id: ABI-023
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-015
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-023 analysis

## Verified current state

- ABI-015 is published at implementation SHA `1f2b4c46d713f8d97f86469638656ab6a3f8c422` and closure SHA `94157ee0a611c239d63fd46466dd102e53184016`, but the user rejected its architectural acceptance after inspecting the result. This packet is a corrective bug, not unrelated future cleanup.
- Fresh preflight `pnpm check` passes: ESLint, Prettier, 38 Vitest tests, TypeScript, and Vite build. This is the behavior baseline before corrective moves.
- The current code has useful seams: pure deterministic combat, a mutable `BattleController`, stable compatibility facades, an enemy visual builder, finite registries, DOM component classes, and persistence owners. These are inputs to preserve, not proof that the requested architecture is complete.
- `BattleController.dispatch` and the presenter still select actions through switches. Enemy progression still selects grade, modifier, armor, health, and multipliers through conditionals with silent default behavior. Upgrade metadata is an array separate from the policy registry, and stat-level normalization is duplicated between upgrades and attacks.
- `ThreeEnemyVisual` is a single enemy-only lifecycle class; the player remains an inline group constructed inside `ThreeBattlefield`. There is no shared runtime `Unit`, no explicit unit model/controller boundary, and no common player/enemy lifecycle proving that new entity families have one extension path.
- Current visual decorators are factory functions returning component records. They provide composition, but they are not independently lifecycle-addressable view components and do not receive typed unit commands/events.
- `application.ts` wires four independent HUD callbacks. Render and persistence are coherent, but UI intent routing is not one typed event seam.
- Current ESLint enforces strict TypeScript, layer imports, complexity/depth, nested ternaries, indexed-access contract bans, and unsafe assertion bans. It does not yet enforce explicit module-boundary return types, root composition, or one significant class per file.
- The Vault article currently says not to introduce a base combat-unit hierarchy until a future proven need. The user has now supplied the concrete need: player and enemy share scene attachment, model-to-view synchronization, animation command routing, tick, and disposal; enemy families/modifiers require composable construction. The article must be corrected before closure.
- Persistence impact is `no schema change`. Combat/save DTOs remain plain data; runtime models/views/controllers never enter localStorage payloads.
- User-authored balance is authoritative: `bossInterval = 35` and `automaticAttackMinimumIntervalMs = 100`. ABI-023 does not rebalance formulas or implement ABI-016 through ABI-022 behavior.

## Approach

### Target ownership

- `src/domain/combat/` remains pure and deterministic. It gains compiler-complete enemy tier/modifier and upgrade strategy objects, but no DOM, Three.js, subscriptions, or saved class instances.
- `src/game/units/` becomes the runtime entity feature. `UnitModel` owns the latest presented unit data and typed model-change events; `UnitView` owns a Three.js root, view components, animation commands, and disposal; `UnitController` routes unit commands between them; `Unit` is the public entry point that composes those three owners.
- Real `PlayerUnit` and `EnemyUnit` products prove the shared lifecycle. Specific subclasses exist only where behavior or construction differs. The base classes contain shared lifecycle, not game-wide combat rules.
- `src/game/units/player/` owns player model, view, components, builder/factory, and configuration. `src/game/units/enemy/` owns enemy model, view, body families, modifiers, builder/factory, and configuration. Compatibility facade `src/game/enemy-visual.ts` remains available while callers migrate.
- Model modifiers are deterministic strategies/decorators applied to an enemy construction draft. View modifiers are separate attachable components applied to named roots. A model modifier never mutates Three.js; a visual modifier never changes combat truth.
- `BattleController` remains the session combat owner but delegates each real action to named command handlers. Controller events remain typed and synchronous. Application remains the only owner of browser persistence/render side effects.
- HUD emits one typed intent union through subscribe/unsubscribe. Application maps intents to battle commands without moving DOM ownership into the controller.

### Pattern decisions

- Base class: justified for shared player/enemy attach, sync, tick, command, and dispose lifecycle. It must not contain enemy-specific formulas or become a God object.
- Factory: justified because player/enemy and enemy body families are distinct real products with different models/views/components.
- Builder: justified for construction order and invariants: required model/view/controller, exactly one body, named roots, modifier ordering, animation-name uniqueness, and sealed build.
- Decorator/strategy: justified because armor, vitality, automatic slow, wealth, grade cues, and seeded decorations are independently composable model/view additions.
- Command: justified for attack, frame, purchase, restore/reset, unit sync, animation, and disposal because they cross owners and produce typed outcomes/events.
- Event: local typed subscriptions only. No global event bus, service locator, reflection, dependency-injection container, or package split.
- Pure functions: retained for formulas, validation, codecs, deterministic arithmetic, and immutable transitions. The requested object architecture wraps lifecycle and variation; it does not make saved data opaque or nondeterministic.

### Compatibility facades

Keep current exports of `src/domain/combat.ts`, `src/domain/snapshot.ts`, `src/game/enemy-visual.ts`, `src/game/battlefield.ts`, `src/ui/hud.ts`, and `src/persistence/persistence-boundary.ts`. Internal callers may move, but external signatures and deterministic outputs remain characterized.

## Risks

- A runtime model can accidentally become a second combat truth. Mitigation: it is presentation state synchronized from `BattleSnapshot`; only pure domain transitions and `BattleController` may create authoritative combat state.
- A base class can hide responsibilities. Mitigation: the base owns only shared lifecycle; family construction, combat policy, visual components, and scene orchestration stay in their feature owners.
- Decorators can double-apply stats or resources. Mitigation: builders enforce modifier keys/order and tests assert exact armor/health/reward/slow outputs plus one attachment/disposal.
- Event routing can duplicate render/persist or change message order. Mitigation: preserve controller characterization and assert one coherent render, persistence only for successful state changes, ignored commands emit nothing, and event ordering remains exact.
- Replacing inline player construction can alter object counts/framing. Mitigation: baseline recursive counts/bounds and desktop/390px screenshots before move; compare after every unit/view stage.
- Save classes could leak into JSON. Mitigation: persistence accepts/returns only existing `CombatState` DTOs and fixtures; no schema/version change.
- ESLint can encode brittle architecture guesses. Mitigation: add only installed rules with a zero baseline; semantic factory/decorator/disposal quality is enforced by tests and independent review.
- Scope expansion could absorb planned gameplay. Mitigation: ABI-016 through ABI-022 now depend on ABI-023 where needed; this task changes architecture only and preserves current balance/content.
