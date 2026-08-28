---
plannerFormat: 1
id: ABI-015
artifact: implementation_guide
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

# ABI-015 implementation-guide

## Architecture decisions

| Concern | Decision | Why it earns its complexity | Explicit ceiling |
| --- | --- | --- | --- |
| Combat model | Immutable serializable types plus pure transitions | Determinism, save compatibility, cheap tests | No class per enemy/player/upgrade record |
| Controller | One lifecycle-owning `BattleController` with typed commands/events | Owns session state, time, event sequence, and command ordering | No global bus, DOM, Three.js, or storage dependency |
| Presenter | Pure typed-event to existing snapshot/message mapping | Keeps view text and event ordering compatible | No mutable presentation store |
| Body creation | Exhaustive `EnemyViewFactory`/body registry | New families have one explicit registration point | No reflection or DI container |
| View construction | `EnemyViewBuilder` with one-body, named-root, sealed-build invariants | Prevents partial/detached views and centralizes animation/disposal registration | No generic fluent object builder |
| View variation | Grade, modifier, and seeded-decoration decorators | Independently compose real optional layers and animation hooks | No class per color/mesh/config row |
| Battlefield | Lifecycle-owning class plus typed effect definitions | Owns renderer, scene, replacement, effects, resize, disposal | No engine registry or package split |
| Events | Local exhaustive listener set owned by controller | Decouples commands/state changes from rendering/persistence side effects | No bubbling, priorities, async queue, or third-party emitter |

## V2 profile compatibility contract

Recognition and normalization are ordered and strict:

1. Parse the exact V2 envelope/player/enemy shape once.
2. Validate every derived enemy field against the current cadence-35 profile.
3. Only when current validation fails, validate every derived enemy field against the historical
   cadence-15 profile. This is a separate recognizer, not relaxed current validation.
4. If both profiles match the same semantics, use the current result. If both match but imply different
   semantics, reject and stop the refactor until the ambiguity is resolved.
5. Preserve the validated enemy, including current/max health and therefore its exact health ratio.
   Preserve player, coins, and unlock state. Reconstruct only `nextAutomaticAttackAtMs`: `0` while
   locked, otherwise `nowMs + automaticInterval(validatedEnemy, validatedPlayer)`.
6. Saving a recognized historical state writes the unchanged current V2 schema. Reloading that output
   must reproduce the same semantic state and health ratio.

Required fixtures: current cadence-35; cadence-15 ordinary; cadence-15 boss at encounter 15;
cadence-15 unlocked automatic-speed state; malformed near-match with one wrong derived field; and
historical load -> save -> reload. A failed recognizer must not debit, reset, respawn, or publish.

## Controller event and side-effect parity

`BattleEvent` means the existing bounded six-row user-visible history. A controller event is a new typed
internal notification; it does not authorize extra history, persistence, or renders.

| Input/result | Controller event | Existing history mutation | Persistence | Application render |
| --- | --- | --- | --- | --- |
| Accepted manual hit | `attack-resolved` | append `Manual hit: {damage} damage` | `onStateChanged` once | once after command |
| Accepted automatic hit | `attack-resolved` | append `Automatic hit: {damage} damage` | `onStateChanged` once | once in that frame |
| Accepted manual kill | `attack-resolved` | append `Manual kill: +{reward} coins` | `onStateChanged` once | once after command |
| Accepted automatic kill | `attack-resolved` | append `Automatic kill: +{reward} coins` | `onStateChanged` once | once in that frame |
| Ignored attack | deliberate absence | none | none | manual attempt once; automatic frame once |
| Successful purchase | `upgrade-purchased` | append `Purchased {existing label}` | `onStateChanged` once | once after command |
| Failed/disabled purchase | `upgrade-rejected` | append the exact existing reason | none; no debit | once after command |
| Frame before auto deadline | deliberate absence | none | none | once |
| Confirmed reset | `session-reset` | clear history and reset next id to 1 | `reset` once; no `onStateChanged` | once |
| Cancelled reset | no command/event | none | none | none |
| Successful restore | `session-restored` | clear history and reset next id to 1 | restore boundary owns its existing publication; no extra `onStateChanged` | once after status report/state replace |
| Failed restore | `restore-rejected` | none; exact persistence status is reported only through HUD status | no extra write | none |

For a kill, the single hit/kill controller notification is emitted only after reward and next-enemy
state are complete; it never emits a separate implicit kill history row. Controller listeners run
synchronously in subscription order. Unsubscribe is idempotent and prevents later delivery. Disposal is
idempotent, clears listeners, and makes subsequent commands emit nothing. Only `application.ts` invokes
rendering and persistence, and it follows the table even when a command has no state change.

## Executable visual matrix

| Row | Deterministic input | Required product/cues | Proof layer |
| --- | --- | --- | --- |
| Normal | normal level 1 | brute, `none` grade cue, seeded decorations | factory plus browser |
| Veteran | veteran level 2 | wisp, `crest`, seeded decorations | factory plus browser |
| Elite armor | elite level 3, modifier `armor` | beetle, `spikes`, `shield-plates` | factory plus browser |
| Elite health | elite level 3, modifier `health` | beetle, `spikes`, `vitality-core` | factory plus browser |
| Elite slow | elite level 3, modifier `automatic-slow` | beetle, `spikes`, animated `time-ring` | factory plus browser |
| Boss hydra | boss level 35 | `boss-hydra`, `crown`, seeded decorations | factory plus browser |
| Boss colossus | boss level 70 | `boss-colossus`, `crown`, seeded decorations | factory plus browser |
| Compatibility wealth | presentation-only modifier `wealth` | `wealth-orbitals` | factory only; never claim combat reachability |
| Decoration coverage | deterministic bounded level scan with fixed grade/modifier | fins, horns, orbitals, satellites, scar all observed | factory; browser rows retain their fixed seeds |

Each browser-reachable row runs at 1280x720 and 390x844. Assert the view is attached to the expected
named roots; every required child exists; projected player/body/crown/decorator bounds remain inside the
viewport; parts are neither embedded nor detached; the time ring advances only while live; replacement
removes the prior root; repeated disposal is bounded and harmless. Screenshots support these probes but
do not replace them.

## Owner-level stop gates

| Owner boundary | Focused proof before continuing |
| --- | --- |
| Combat contracts/progression/upgrades/attacks/facade | deterministic domain characterization and exact public import/output comparison |
| V2 compatibility | all ordered-recognizer fixtures plus load -> save -> reload parity |
| Controller/application | full command/event/side-effect table and snapshot/message comparison |
| Enemy composition | exhaustive registry, builder invariant, decorator, seed, animation, and disposal tests |
| Battlefield | replacement/effect/lifecycle tests plus desktop and 390px projected bounds |
| HUD | pointer/keyboard/modal/focus/accessibility/listener parity |
| Persistence facade/lifecycle | v1/legacy-v2/current/malformed/publication/reset/restore/pagehide fixtures |

At each boundary: run the focused proof, compare the exact baseline, and stop on mismatch. Record the
differing contract, make at most one bounded repair, then run one fresh owner check. Do not begin the next
owner while red and do not hide a mismatch by updating expected behavior.

## Independent architecture checklist

- [ ] Exactly one `BattleController` owns mutable combat-session/time/event state.
- [ ] No global event bus, dependency/container framework, async event queue, or new dependency.
- [ ] `EnemyViewBuilder` only constructs/seals one view and enforces its named-root/body/animation invariants.
- [ ] Decorators own only grade, modifier, or seeded-decoration layers and their local animation/disposal.
- [ ] No class per mesh, color, config row, enemy data record, upgrade, or immutable state transition.
- [ ] No speculative Unit inheritance, public plugin API, engine abstraction, package split, or ABI-016-022 feature code.

## Detailed implementation sequence

1. Re-read the canonical BRIEF, current Vault architecture rules, and the original user quality diagnosis.
2. Inventory every current public export/import of `combat`, `snapshot`, `enemy-visual`, `battlefield`,
   `hud`, and `persistence-boundary`; freeze these as compatibility facades.
3. Run the unchanged pre-repair `pnpm check` and preserve exact combat, snapshot, event-message, save,
   seed/spec, object-count, animation, and disposal characterization outputs.
   The user's working `bossInterval = 35` and `automaticAttackMinimumIntervalMs = 100` are authoritative;
   update expected telemetry instead of reverting them, while retaining compatibility with saves created
   under the prior cadence.
4. Name `BattleEnemySnapshot` and use finite `EnemyGrade`/`EliteModifier` unions at the domain-to-view seam;
   keep an explicit presentation-only modifier union only where existing compatibility requires it.
5. Move all unchanged combat formula constants into `combat-balance.ts`, including chance, damage, grade,
   boss, armor, reward, and automatic timing coefficients.
6. Extract enemy grade/modifier selection, boss multiplier, armor, health, reward, and `spawnEnemy` into
   `combat-progression.ts`; preserve arithmetic order and safe-integer guards byte-for-byte in behavior.
7. Extract player normalization, upgrade definitions, levels, costs, disabled reasons, exhaustive policy
   strategies, and `purchaseUpgrade` into `combat-upgrades.ts`.
8. Extract armor/critical/reward resolution and `attack` into `combat-attacks.ts`; preserve roll consumption,
   ignored commands, event order, reward saturation, and next-enemy creation.
9. Reduce `combat.ts` to the stable public facade and prove every prior import compiles unchanged.
10. Re-characterize deterministic progression for the user-authored balance and extend V2 validation so
    previously published cadence-15 saves still load without weakening structural/derived-field checks.
11. Define exhaustive `BattleCommand`, `BattleControllerEvent`, `BattleUpdate`, and listener/unsubscribe
    contracts in `battle-controller-contracts.ts`.
12. Implement `BattleController` as the only mutable combat-session owner: state, current time, event IDs,
    bounded event history, attack/purchase/reset/restore commands, and idempotent disposal.
13. Implement the local typed listener set inside the controller; dispatch synchronously after a complete
    state transition and never expose a partially updated state.
14. Implement a pure presenter that maps typed controller events to the exact existing `BattleEvent`
    messages and constructs the unchanged `BattleSnapshot` upgrade list.
15. Rewire `application.ts` so HUD and RAF send controller commands, controller updates drive one coherent
    render, and persistence runs only for the same successful state changes as before.
16. Add controller tests for manual/automatic attack, ignored attack, purchase success/failure, reset,
    restore, event ID/order/cap, persistence-change flag, snapshot parity, unsubscribe, and disposal.
17. Define finite enemy-view component/factory/builder/decorator/animation contracts and named layer roots:
    `body`, `grade`, `modifier`, and `decoration`.
18. Move enemy palette, geometry dimensions, offsets, rotations, material values, anchors, and scale into
    feature-local named visual configuration; preserve all accepted desktop visual values initially.
19. Implement exhaustive body factories for beetle, brute, wisp, boss-colossus, and boss-hydra; each
    returns a complete body component without conditional family selection.
20. Implement `EnemyViewBuilder` invariants: exactly one body, every layer attaches under its named root,
    animation components register once, duplicate body/post-build mutation throws, and build seals state.
21. Implement independent grade, modifier, and seeded-decoration decorators backed by exhaustive typed
    registries; the time-ring decorator owns its animation hook.
22. Implement `EnemyViewFactory`: compute the unchanged stable spec, select the body factory, apply the
    decorators in documented order, build one `ThreeEnemyVisual`, and retain `createEnemyVisual` facade.
23. Make `ThreeEnemyVisual` own the built roots, animation tick, full geometry/material traversal, parent
    removal, and idempotent disposal; prove no component leaks or double-disposes.
24. Move battlefield scene/player/effect/camera values into feature-local config and replace effect
    branch selection with exhaustive typed definitions.
25. Make battlefield lifecycle ownership explicit (class or equivalently cohesive owner) while retaining
    `createBattlefield`, `createBattlefieldWithRenderer`, frame semantics, effect bounds, and disposal.
26. Repair the proven 390px clipping using aspect-aware framing/anchors; keep desktop framing stable and
    do not implement ABI-016 orbit/cadence behavior.
27. Add focused factory/builder/decorator tests for registry exhaustiveness, every body/cue/modifier,
    builder failures, layer attachment, deterministic seeds, animation, replacement, bounds, and disposal.
28. Add only zero-baseline installed ESLint rules that express real AST invariants; keep numeric size limits
    as review triggers and keep path aliases/pre-commit hook implementation in ABI-021.
29. Run focused owner tests after domain/controller, game composition, HUD, and persistence boundaries,
    followed by fresh `pnpm check` and `git diff --check`.
30. Run a new independent full-diff review against this detailed contract; repair only concrete P0-P2,
    then require a fresh independent re-review after any code change.
31. Run independent browser/visual QA at desktop and 390px across every reachable body/grade/modifier,
    boss transition, animation, focus/input/save compatibility, and long-run resources. QA records only
    its independent verdict and does not perform Manager publication or closure.
32. After independent review and QA both pass, Manager records verification, synchronizes accepted Vault
    rules, runs the final root audit, creates and pushes the coherent Git checkpoint, waits for exact-SHA
    CI and Pages, proves the deployed URL, records Manager closure, releases the claim, and confirms the
    next task remains dependency-safe.

The managed checklist retains `v3-01` through `v3-31` because Planner preserves 19 earlier terminal
history entries and enforces a 50-step cap. Step 32 is therefore represented by the profile's separate
required `verification` and `manager-closure` gates rather than by overloading independent QA or editing
terminal history. It remains mandatory even though it cannot be appended as `v3-32`.

## Frozen scope

- ABI-015 only. Preserve deterministic combat, current balance, public UI, enemy visuals/seeds/cues,
  persistence schema/keys/fixtures, and app composition behavior.
- Preserve existing public import paths through stable facades/barrels: `domain/combat`,
  `game/enemy-visual`, `game/battlefield`, `ui/hud`, and `persistence/persistence-boundary`.
- Plain data and pure functions own immutable combat and save transformations. Classes own real controller,
  construction, Three.js, or DOM lifecycle. The enemy builder enforces concrete composition invariants;
  no one-class-per-record Unit inheritance, package split, Golden Bug, cadence, rebalance, save-version
  bump, or UI redesign.
- Use only installed TypeScript/ESLint/Prettier/Vitest/Vite tooling. Add enforceable zero-baseline rules;
  numeric size limits remain reviewer triggers.
- Preserve `.playwright-cli`; it is excluded from commits.

## Verification matrix

- Unit: exact deterministic attack/progression/upgrade outputs; exhaustive policy keys; stable visual
  family/spec/seed/cues; save v1/legacy-v2/current validation/migration/round-trip; malformed/future reject.
- Integration: public facade imports compile; battlefield replacement/effect bounds/idempotent disposal;
  HUD pointer/keyboard/modal/focus/accessibility/listener symmetry; storage publication failure/restore/
  reset/pagehide behavior; app frame/resize lifecycle.
- Browser desktop and 390px: initial load, one manual attack, automatic unlock/speed, every enemy grade and
  boss transition, purchases/disabled reasons, modal controls, keyboard/pointer, reload and malformed-save
  recovery, no overflow, clean console/network.
- Long run: repeated enemy replacement and HUD render/modal cycles keep scene children, renderer resources,
  DOM nodes, and listeners bounded; save/reload preserves semantic progress.
- Publication: independent review and QA have no unresolved P0-P2; `pnpm check`, Vault doctor/index,
  coherent commit/push, exact-SHA CI and Pages, public URL proof, Planner Manager close, and next-task audit.
