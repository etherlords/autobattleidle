---
plannerFormat: 1
id: ABI-023
artifact: implementation_guide
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

# ABI-023 implementation-guide

## Frozen scope

Correct the prematurely accepted ABI-015 architecture while preserving all public behavior. The target is a concrete, testable Unit/Model/View/Controller component architecture, not a naming exercise. Player and enemy must be real products of the shared lifecycle; enemy families and modifiers must be composed through factories, invariant builders, model strategies/decorators, and independently attachable view components.

Keep combat DTOs and save payloads plain and serializable. Keep formulas deterministic and pure. Keep `BattleController` as the sole mutable combat-session owner and application as the browser side-effect composition root. No global event bus, DI framework, reflection, package split, save migration, UI redesign, gameplay rebalance, or implementation of ABI-016 through ABI-022.

The authoritative balance inputs remain boss interval 35 and automatic minimum interval 100ms. Preserve historical cadence-15 V2 save recognition. Preserve `.playwright-cli` exclusion.

## Implementation sequence

1. Record exact green baseline output for `pnpm check`, current exports/imports, deterministic fixed-roll snapshots, event messages/order, save fixtures, visual specs/seeds/counts/bounds/animation/disposal, HUD input/modal/focus/listener behavior, and current user balance.
2. Record the ABI-015 acceptance failure and the gap matrix: no shared Unit lifecycle, inline player view, enemy-only view lifecycle, conditional combat variant selection, split upgrade metadata/policies, duplicated stat accessors, switch-based commands, function-record visual decorators, and incomplete lint boundaries.
3. Freeze the target dependency graph: domain pure; game runtime units depend on domain snapshots; battlefield depends on unit factories; UI/persistence depend on domain contracts only; app composes all; main imports only the application facade.
4. Create feature-owned directories under `src/game/units/core`, `src/game/units/player`, and `src/game/units/enemy`; do not create generic `types`, `helpers`, `shared`, or a flat `src/game` collection.
5. Define named `UnitKind`, `UnitCommand`, `UnitEvent`, model/view/controller lifecycle, component, modifier, animation, and unsubscribe contracts. Avoid indexed-access types and unsafe assertions.
6. Implement `UnitModel<TSnapshot>` as the owner of the latest presented snapshot and local typed change subscription. It must use immutable replacement, compare identity explicitly, and never write combat/save state.
7. Implement `UnitView<TSnapshot>` as the owner of one Three.js `Group`, named component roots, synchronization, typed animation commands, tick ordering, parent removal, and idempotent recursive disposal.
8. Implement `UnitController<TSnapshot>` to route `sync`, `animate`, `tick`, and `dispose` commands between one model and one view; model-change events drive view synchronization exactly once.
9. Implement `Unit<TModel,TView>` as the public orchestration entry point exposing the composed model, view root, typed dispatch, tick, and dispose lifecycle without absorbing family rules.
10. Move the existing player mesh/platform/config into `src/game/units/player`. Create `PlayerUnitModel`, `PlayerUnitView`, and `PlayerUnit` using the shared lifecycle; preserve recursive object count, materials, transform, and framing.
11. Move the existing enemy presentation snapshot mapping into `EnemyUnitModel`. Preserve grade, modifier, level, health identity, and stable seed inputs without importing Three.js into the model.
12. Adapt `ThreeEnemyVisual` into `EnemyUnitView` on the shared view base. Preserve current stable facade and `EnemyVisual` contract during migration.
13. Add an exhaustive `UnitFactory` registry for real `player` and `enemy` products. Construction selection must be compiler-complete and contain no fallback product.
14. Replace `progression.ts` grade multipliers/armor/health modifier conditionals with named immutable `EnemyTierDefinition` and `EnemyModifierStrategy` objects keyed exhaustively by `EnemyGrade` and `EliteModifier`.
15. Implement concrete armor, vitality, and automatic-slow model modifier strategies. Each receives a bounded construction draft and returns a new draft; application order and safe-integer arithmetic order are characterized.
16. Make enemy grade selection and modifier selection named strategies with explicit boss/elite applicability. Remove silent defaults that would give a future grade multiplier 1 or armor 0.
17. Convert static visual parts into `UnitViewComponent` products that declare key, target root, nodes, optional animations, and local dispose hooks. Parent view remains the final resource owner.
18. Convert grade, armor, vitality, automatic-slow, wealth, and seeded decorations into concrete view modifier/decorator objects. Each attaches independently to the correct named root and may react only to typed view commands relevant to it.
19. Retain distinct body factory products for beetle, brute, wisp, boss colossus, and boss hydra. Move family selection into an exhaustive enemy definition/catalog so new family registration is compiler-guided.
20. Expand `EnemyUnitBuilder` invariants to require one model, one view, one controller, exactly one body, named roots, unique component/modifier keys, deterministic modifier order, unique animation names, and a sealed one-shot build.
21. Implement `EnemyUnitFactory` that resolves one enemy definition, applies model modifier strategies, builds body/components, applies view modifiers, and returns a complete `EnemyUnit`; no switch/if ladder may construct meshes or modifier combinations.
22. Define typed view commands/events for spawn, hit, critical hit, death, modifier cue, sync, and dispose. Route current battlefield frame changes through the unit boundary and preserve existing visible effects and animation cadence.
23. Split battle command handlers into named owners for attack, frame, purchase, reset, and restore. Replace `BattleController.dispatch` switch with an exhaustive handler registry or equivalent compiler-complete command factory; retain synchronous publish and ignored-command semantics.
24. Consolidate upgrade metadata and behavior into one exhaustive keyed `UpgradeStrategy` registry plus explicit display order. Move damage/critical/reward/penetration/speed level normalization into one stat accessor owner consumed by attack and upgrade paths.
25. Route purchase through a named command/result/event handler. Preserve exact cost arithmetic, debit, automatic schedule updates, disabled identity, message text/order, one render, and successful-change persistence.
26. Reduce `ThreeBattlefield` to scene/camera/renderer/effect orchestration over `PlayerUnit` and `EnemyUnit`. It owns scene attachment/replacement, while each unit owns its subtree lifecycle. Preserve aspect framing and ABI-016 orbit exclusion.
27. Move remaining effect geometry, actor anchors, offsets, colors, segment counts, lifetimes, caps, and animation growth literals into owner-local typed configuration.
28. Replace the four HUD callback slots with one `HudIntent` union and subscribe/unsubscribe lifecycle. Preserve pointer/keyboard attack, dialog navigation, focus restoration, accessibility names, restore/reset behavior, and listener cleanup.
29. Keep `application.ts` as the composition root: map HUD intents to battle commands, subscribe once to controller events, persist successful changes once, render coherently once, drive RAF/resize, and dispose in dependency-safe order.
30. Add zero-baseline installed-tool ESLint rules: explicit module-boundary types, main-to-application-only imports, one significant class per production file where the baseline and design permit it, existing strict/unsafe/indexed-access/complexity/depth/nested-ternary rules, and refined layer restrictions for unit feature ownership. Do not add a custom lint script or dependency.
31. Add compile-time/exhaustive tests using fixture-only registry construction proving a new enemy family, modifier, view component, stat, and upgrade has one named registration path and missing handlers/definitions cannot silently fall back.
32. Add runtime parity tests for exact domain snapshots, arithmetic order, command/event order, ignored actions, render/persist counts, save fixtures, HUD interactions, visual specs/seeds/attachments/animation commands/object counts/bounds/replacement/disposal, and player/enemy shared lifecycle.
33. Run focused owner checks after each responsibility move; then run fresh `pnpm check` and `git diff --check`. Repair only root causes inside ABI-023 scope.
34. Run an independent full-diff architecture review against the original user diagnosis and this guide. Any P0-P2 returns to implementation once, followed by fresh self-check and independent re-review.
35. Run independent real-browser QA at desktop and 390px across normal/veteran/elite modifiers, boss hydra/colossus, player, seeded decorations, attachment/clipping/animation intent, modal/focus/input behavior, and compatible save reload.
36. Run a 120+ enemy replacement/effect lifecycle probe with bounded scene/resource counts, idempotent disposal, deterministic repeatability, and no valid-save reset.
37. Update the Vault code-quality and technical architecture articles so the implemented Unit/MVC/component contract, extension recipes, commands/events, ownership, and non-goals are canonical.
38. Record implementation self-check, independent review, independent QA, verification, and manager closure through Planner. No gate is inferred from prose or self-reviewed by the implementation actor.
39. Commit code, Planner, Vault, dependency updates, and operation receipts as one coherent corrective checkpoint; preserve excluded `.playwright-cli`; push `main`.
40. Wait exact-SHA CI and Pages, prove the deployed app at desktop/narrow plus save/input smoke, record receipts, audit root cleanliness and dependency safety, then release the claim and finish idle.

## Verification matrix

- Unit: deterministic tier/modifier/upgrade strategies, stat accessors, builder invariants, factory exhaustiveness, model events, view commands, components/modifiers, animation routing, disposal idempotency.
- Integration: BattleController command handlers/events, one authoritative state owner, HUD intent mapping, one render/persist policy, battlefield unit replacement, player/enemy shared lifecycle, stable facades.
- Persistence: existing v1/v2/historical fixtures, malformed recovery, load -> render -> change -> save -> reload, exact schema/version, no class instance serialization.
- Visual: all body families, grades, modifiers, five seeded decoration types, named roots, intended attachments, recursive bounds, animation response, desktop/390px framing, 120+ replacement/effect resource bound.
- Quality: `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build`, combined `pnpm check`, `git diff --check`, negative layer/root import probes, explicit public return-type probe.
- Independent review: original user requirements, real pattern responsibility, extensibility path, no God base class, no duplicated truth, no P0-P2.
- Independent QA: real browser desktop/narrow, pointer/keyboard/modal/focus/accessibility, save compatibility, visual matrix, long-run resources, console clean.
- Deployed: exact-SHA CI/Pages success, HTTP/assets, current behavior smoke, root clean/synced, ABI-016 through ABI-022 remain unimplemented and safely ordered.
