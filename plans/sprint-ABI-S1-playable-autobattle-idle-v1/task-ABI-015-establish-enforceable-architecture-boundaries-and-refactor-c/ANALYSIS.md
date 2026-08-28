---
plannerFormat: 1
id: ABI-015
artifact: analysis
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

# ABI-015 analysis

## Verified current state

- User-authored working balance is authoritative input: `bossInterval = 35` and
  `automaticAttackMinimumIntervalMs = 100`. Do not normalize these values to the published commit.
  Re-characterize current progression and preserve load compatibility for V2 saves produced under the
  previous cadence.
- Published planning baseline `9bdbbd7c8ee8b8c323e6da9d1eba877bf090d94d` passed exact-SHA CI and
  Pages. Fresh local `pnpm check` passed strict lint/format, 23/23 tests, typecheck, and build before
  any production move.
- The current responsibility owners are `src/domain/combat.ts` (362 lines),
  `src/game/enemy-visual.ts` (214), `src/game/battlefield.ts` (164), `src/ui/hud.ts` (258),
  `src/persistence/persistence-boundary.ts` (525), and `src/app/application.ts` (212).
- Stable public seams already exist: combat state/formula/attack/upgrade exports, `createEnemyVisual`,
  `createBattlefield`, `createHud`, `encodeSave`/`decodeSave`/`createPersistenceBoundary`, and the thin
  application composition boundary. Refactoring must preserve these observable contracts or provide a
  compatibility barrel at the existing import path.
- Concrete debt matches the task: upgrade selection repeats switches; battlefield exposes an indexed
  `BattleSnapshot["enemy"]` alias; HUD owns several independent DOM subtrees/listener sets; persistence
  combines DTOs, validation, migration, storage, repair, and page lifecycle in one file.
- Persistence impact is **no schema change**. V1, direct legacy V2, versioned V2/current, malformed,
  failed-publication, restore, reset, save, and reload semantics remain supported.

## Approach

- Reopened repair contract after user acceptance review: the first pass preserved behavior but left
  `combat.ts` as a mixed owner and `enemy-visual.ts` as conditional primitive assembly. ABI-015 now
  explicitly requires the original factory/builder/decorator and controller-event architecture before
  verification.
- Split pure combat owners into progression, attacks, and upgrades while retaining `combat.ts` as the
  compatibility facade. Keep `CombatState`/enemy/player as immutable serializable model data.
- Add a lifecycle-owning application `BattleController` as the command/state/event-order owner. It emits
  an exhaustive typed controller event union; a presenter preserves the exact existing `BattleEvent`
  messages and `BattleSnapshot` facade for HUD, battlefield, and persistence consumers.
- Build enemies through an exhaustive body factory, an invariant-enforcing builder, and independent
  grade/modifier/seeded-decoration decorators. The built Three.js view owns named layer roots,
  animation components, and idempotent disposal.
- Move visual palette, geometry/layout, scene anchors, effects, and camera framing to feature-local named
  configuration. Repair the proven 390px actor/boss-crown clipping without changing desktop semantics.
- Preserve behavior with one responsibility move at a time and run the focused owner test after each
  move. Keep current import paths as narrow public barrels/facades so app and tests do not churn.
- Keep combat contracts and transitions as immutable data plus pure functions. Use the existing exhaustive
  upgrade-policy strategy registry; classes own controller or rendering lifecycle rather than data rows.
- Use classes for proven mutable lifecycle/construction owners: controller, battlefield/enemy views,
  invariant-enforcing enemy builder, animated decorators, and HUD DOM components. Keep public facades
  narrow and disposal symmetric.
- Split persistence by existing responsibility into save contracts/validation, migrations/codecs, and
  browser storage lifecycle while retaining the current facade and keys/version.
- Add zero-baseline ESLint ownership/readability rules using installed configuration and AST selectors
  where reliable. Keep 300-line file and 80-line function thresholds as review evidence, not lint quotas.
- Acceptance layers: deterministic combat/visual/save contracts are unit; application, listener,
  replacement, disposal, and historical-save parity are integration; desktop, 390px, long-run resource,
  reload, exact-SHA Pages, and public behavior are deployed/browser proof.

## Binding pre-implementation contracts

### V2 profile compatibility

- Decode a same-version V2 payload against the current cadence-35 derived-field profile first. Only if
  that fails may a strict cadence-15 profile recognizer run; it must validate every persisted derived
  enemy field and the unchanged player invariants rather than weakening the current decoder.
- A recognized historical payload keeps its validated enemy id, encounter, current/max health, armor,
  reward, grade, modifier, coins, player, and unlock state. Absolute health and therefore the exact
  health ratio remain unchanged. Only the runtime timer is reconstructed: locked is `0`; unlocked is
  `nowMs + automaticInterval(validatedEnemy, validatedPlayer)`.
- If both profiles match the same semantic state, current-profile interpretation wins. If both match but
  imply different semantics, decoding stops and rejects the payload; it must never guess or respawn.
- Required fixtures are: current cadence-35; cadence-15 ordinary; cadence-15 boss at encounter 15;
  cadence-15 automatic-speed unlocked; malformed near-match with one corrupted derived field; and
  historical load -> current save -> reload. The last fixture must preserve state and health ratio.

### Controller and application parity

- The detailed guide owns the executable command/event table. It freezes exact existing history text,
  ordering, persistence calls, and render counts for manual/automatic hit and kill, ignored attacks,
  successful/failed purchases, idle frames, reset, and successful/failed restore.
- Listeners run synchronously in subscription order only after a transition is complete. Unsubscribe and
  controller disposal are idempotent; disposed controllers emit nothing. Only application composition
  may call HUD/game render or persistence.

### Visual reachability

- Browser rows use real deterministic snapshots for normal, veteran, elite armor/health/automatic-slow,
  boss hydra, and boss colossus. They cover all three ordinary body families, every grade cue, every
  reachable modifier cue, both boss bodies, and seeded decorations.
- Exact reachable ordinary anchors are normal level 1 -> brute, veteran level 2 -> wisp, and elite
  level 3 -> beetle. Arbitrary family inputs remain factory-only proof rather than fake browser states.
- The retained `wealth` cue is explicitly presentation-only compatibility input and is proved by factory
  tests, not described as a reachable combat state. Deterministic fixture discovery must cover every
  seeded decoration without changing the seed formula.
- Every reachable row is exercised at 1280x720 and 390x844 with attached-layer, projected-bounds,
  no-embedding/detachment, applicable animation, replacement, and bounded-disposal proof.

### Owner stop conditions

After each combat, V2 compatibility, controller/application, enemy composition, battlefield, HUD, and
persistence move, run its focused test and compare the exact characterized contract. A mismatch stops
the next owner move. Record the mismatch, perform at most one bounded repair, then run a fresh owner
check; a remaining mismatch returns to Manager instead of continuing while red.

### Independent pattern-restraint checklist

Review must prove exactly one combat-session controller; no global event bus, dependency container, or
new framework; one enemy builder limited to construction/sealing invariants; decorators limited to
grade, modifier, and seeded-decoration layers; no class per mesh/data row; and no plugin API, package
split, or speculative Unit hierarchy. These are review gates, not numeric lint quotas.

Planner preserves 19 earlier terminal execution entries and caps the managed checklist at 50, so the
31-step v3 route exhausts its remaining capacity. Independent QA stays step 31; Manager verification,
Vault/Git publication, exact-SHA deployment proof, and closure are a distinct step 32 in the guide and
are enforced through the profile's required `verification` and `manager-closure` gates.

## Risks

- Moving code can accidentally change arithmetic order, random-roll consumption, enemy identity seeds,
  event ordering, or save key precedence. Characterize outputs first and compare exact snapshots/fixtures.
- New classes can duplicate state ownership or hide disposal. Classes are limited to objects that own
  resources/listeners; pure state and policies remain functions/data.
- Layer-import lint can create false positives if applied to tests/configuration. Scope it to production
  TypeScript and prove a zero baseline before making it blocking.
- DOM decomposition can leak listeners or alter focus/backdrop/keyboard behavior. Each component owns a
  symmetric attach/remove path and is checked through the existing facade.
- Refactor breadth can invite ABI-016 cadence/camera work or gameplay cleanup. Those changes are excluded;
  any behavior mismatch is a regression, not an opportunity to redesign.
