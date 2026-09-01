---
vaultFormat: 1
project: autobattleidle
vaultId: AUTOBATTLEIDLE-DOC-20260827-85CBFC
kind: workflow
status: active
summary: 'HUD ownership, localStorage contract, lifecycle gates, and release QA scope.'
tags:
  - ui
  - persistence
  - qa
---
# UI, Persistence, and QA

## Summary

HUD ownership, localStorage contract, lifecycle gates, and release QA scope.

## HUD and input

The battlefield canvas is the primary manual-attack target. One accepted stationary pointer activation anywhere
on the playable canvas issues exactly one manual attack; there is no permanent Attack button. Keyboard
Enter/Space remains an accessible equivalent when the battlefield is focused. Manual input still
bypasses and never resets the automatic cooldown.

Primary-pointer or touch drag rotates the battlefield camera around the arena-center azimuth for every
currently displayed enemy, including ordinary enemies, bosses, and Golden Bug encounters.
ArrowLeft/ArrowRight while the battlefield is focused provide the keyboard equivalent. The orbit keeps
the PerspectiveCamera field of view, arena-center target, responsive elevation, and enemy-specific
responsive framing fixed for the current viewport; zoom and pan are unavailable. Drag or pointer cancel
never attacks, while stationary activation still attacks exactly once.

Orbit azimuth is battlefield-session presentation state. It persists through ordinary, boss, and Golden
Bug replacements, hits, automatic attacks, the delayed lethal presentation, and resize. Explicit game
Reset returns the camera to canonical front framing before presenting reset progress; full page reload
also resets orbit because camera and gesture state never enter CombatState, snapshots, save codecs, or
localStorage. The battlefield interaction surface uses `touch-action: none` so native pan/pinch cannot
cancel the bounded touch orbit.

The HUD is a fixed overlay that does not participate in page layout. Enemy name is centered at the top;
a nearly viewport-width current/max health bar sits directly below it; the automatic-attack bar follows
at roughly 35-45% viewport width; coins appear below the bars. Health and automatic bars are display
only: they are not clickable, draggable, selectable, or pointer targets. DOM progress elements are
preferred over Three.js geometry because they preserve accessible names and exact numeric values.

The bounded combat/reward log remains fixed at the lower right and never changes document height. The
page itself must not expose vertical or horizontal scrollbars at supported desktop and narrow sizes.

Upgrades are hidden by default. A fixed `Upgrades` launcher sits over the canvas near the lower left.
Activating it opens a centered bounded dialog card over a viewport backdrop without reflowing the
battlefield. The dialog repeats the current coin balance and presents every upgrade as a stable
three-row action: `TITLE - LEVEL`, `PRICE coins`, then the exact displayed-stat gain bought by the next
activation. Damage, armor penetration, critical chance, double-reward chance, and APS reuse the domain
purchase selector and existing display precision; a one-click internal level skip shows its combined
purchased delta. Coin-only-disabled rows retain the gain beside their disabled reason, while one-time,
already-unlocked, prerequisite, and numeric-endpoint rows never invent a gain. Compact visual values
retain full precision in accessible names and titles.

The modal owns only its controls, traps/restores focus, toggles with `U`, closes by an explicit control,
Escape, or a backdrop-only pointer activation, and does not turn the passive HUD into click targets or
leak input or camera rotation to the battlefield.

Overlay layering is explicit: passive HUD and log ignore pointer events; upgrade launcher/modal accept
them; the remaining viewport routes pointer input to the battlefield. Responsive QA proves no overlap,
selection, accidental double attack, camera-input leak, page scroll, or layout growth.

## Planned modifier-click bulk purchasing

ABI-017 implements modifier-click bulk purchasing after the behavior-preserving ABI-015/ABI-023 architecture work. A default pointer click requests one level, Shift-click requests up to 10, and Ctrl-click requests up to 100, with Ctrl taking precedence when both pointer modifiers are present. Keyboard activation always requests one level. The HUD emits one named `(upgradeId, quantity)` request and shows one compact aria-readable modifier hint in the existing dialog space.

The controller applies the existing pure single-level purchase sequentially and stops on the first disabled or unaffordable result. Every successful level keeps the existing `Purchased ...` event in order within the bounded event history. The failed attempt emits no event, debit, or level change. A non-empty batch publishes once, so the application performs one coherent battlefield render, HUD render, and persistence update; there is no summarized batch event.

The implementation does not change the save schema, balance, modal layout model, focus trap, keyboard activation, dismissal, disabled reasons, or listener ownership. Focused tests and desktop/390px browser QA prove modifier precedence, x100 parity, partial-stop behavior, bounded event order, failed-attempt identity, coherent persistence/reload, accessibility, responsive layout, and no modal/focus regression.

## Planned current upgrade stats and automatic-speed balance

ABI-018 is accepted current behavior. The primary automatic-attack HUD reports APS while locked and reports APS plus remaining cooldown while unlocked. The upgrades dialog adds a compact aria-readable panel for current damage, armor penetration, critical chance, double-reward chance, and APS without changing its layout model.

Automatic speed uses `APS(level) = 0.1 + 2.9 * level^2 / (level^2 + 150^2)` and `intervalMs = 1000 / APS(level)`: 0.1 APS at level 0, about 0.99 at level 100 and 1.96 at level 200, finite and asymptotically below 3 APS. The elite automatic-slow modifier still adds 500 ms. Armor penetration and critical chance keep their existing diminishing-return formulas; double reward is displayed but not rebalanced.

The change has no save-schema impact: levels remain canonical and displayed stats are recomputed into immutable snapshots. Independent desktop/390px browser QA proved locked/unlocked APS, cooldown, an automatic-speed purchase changing 0.11 to 0.12 APS, modal ARIA/layout, V3 reload, V2 migration without reset, no overflow, and a clean console.

## Planned automatic-attack pause control

ABI-019 is accepted current behavior. A compact native button sits beside the automatic cooldown bar. Running exposes `⏸` with `Pause auto attack` and `aria-pressed=false`; paused exposes `▶` with `Resume auto attack` and `aria-pressed=true`. The button is disabled until automatic attack is unlocked.

Pausing freezes the exact current automatic cooldown remainder. Frames, Golden Bug expiry, enemy animation, upgrades, dialogs, rendering, persistence, and manual pointer/keyboard attacks continue normally. Resuming rebases the next automatic deadline from the frozen remainder, so there is no catch-up or duplicate attack. Reset, restore, and reload start automatic attacks running.

Pause state and its frozen remainder are controller-session state only. They never enter CombatState, save codecs, localStorage, migrations, or leaderboard payloads. Independent review, 154 tests, and deployed desktop/390px QA on SHA `703c7248dbaac5641f9efc4b304f8df327f9febb` verified timing, accessibility, modal coexistence, responsive placement, reload default, and a clean console.

## Persistence

Progress is stored in version-addressed `localStorage` slots after meaningful state changes with a short debounce and on page hide. Current V3 is `etherlords.autobattleidle.save.v3`; retained predecessors are `.v2` and `.v1`; `etherlords.autobattleidle.save` remains the unversioned compatibility source. Normal saves and reset affect only V3.

V3 adds canonical `goldenBug` identity plus `resumeEncounter`. It never stores the absolute ten-second deadline, Three.js objects, DOM state, or presentation objects. Loading an active event reconstructs a fresh deadline at load time; independent browser QA read 9.9 s 100 ms after reload. Manual input never resets the event deadline or automatic cooldown.

Golden Bug reward growth is a no-schema balance change. A V3 payload created while the prior 10-times reward was active is accepted only when its stored reward exactly matches that legacy derived value; load normalizes it to the current 50-times reward before the next save. Arbitrary altered rewards remain invalid. A literal historical active-event load -> save -> reload regression and isolated browser QA prove that unrelated coins and progression are preserved.

Bootstrap prefers valid V3. If V3 is missing/invalid, it validates V2, preserves its raw bytes, migrates one version to V3, validates and publishes V3, then reloads stably. V1 composes through V2 to V3; the unversioned V2 source remains byte-for-byte intact. Failed publication preserves valid in-memory state and every source. Restore repairs only missing/invalid V3 from supported prior sources. Malformed/future values recover safely; explicit reset removes only V3.

Every task still classifies persistence impact. No-schema work proves historical loads; schema work ships one-version adapters, fixtures, and load -> migrate -> save -> reload proof. ABI-010 direct tests and browser QA prove V1/V2 retention, active-event reload, malformed V3 plus valid V2 recovery, and unchanged semantic progress.

## Delivery lifecycle

Every task follows `implement -> independent review -> independent QA -> manager close`. A failed gate returns concrete findings to the implementation owner, followed by one bounded repair and one fresh independent gate run. Gate history remains append-only; a later PASS does not erase prior blocked or failed evidence.

The manager records persistence impact during preflight. Reviewer verifies that behavior did not bypass the save boundary; QA loads the oldest supported affected fixture and proves semantic progress after reload. Schema changes additionally require migrated current-version payload survival across a second reload.

Release QA uses production-codec fixtures and must bind claimed visual identity to read-only canvas receipts before accepting screenshots. Fixture inputs and generated receipts use distinct filenames so a rerun cannot overwrite its own source. Candidate QA may target a local production preview explicitly; the public Pages URL remains the default. Candidate PASS and post-push exact-SHA proof are separate gates.

Each task records concise lifecycle events in `PROGRESS.md`; detailed review, QA, and verification evidence remains in the dedicated artifacts. Final release QA covers real pointer and keyboard input, automatic timing and slow semantics, responsive/reduced-motion layouts, upgrades, repeated boss progression, Golden Bug, supported migrations and recovery, bounded effects/resources, clean console/network state, and all shipped visual families before and after reload. The Manager then binds the exact commit, CI run, Pages deployment, loaded assets, and public functional observations before closure.

## Related


- [[quality/Testing Strategy|Testing Strategy]]
- [[architecture/Persistence Contract|Persistence Contract]]
