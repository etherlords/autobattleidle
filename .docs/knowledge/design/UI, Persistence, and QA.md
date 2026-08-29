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

During boss encounters only, primary-pointer or touch drag rotates the battlefield camera around the
arena-center azimuth. ArrowLeft/ArrowRight while the battlefield is focused provide the keyboard
equivalent. The orbit keeps the PerspectiveCamera field of view, arena-center target, responsive
elevation, and responsive radius fixed for the current viewport; zoom and pan are unavailable. Drag or
pointer cancel never attacks, while stationary activation still attacks exactly once. Ordinary
encounters retain azimuth-zero framing and ignore rotation requests. Resize preserves the boss azimuth;
reload resets it because camera and gesture state are session-only presentation state and never enter
CombatState, snapshots, save codecs, or localStorage. The battlefield interaction surface uses
`touch-action: none` so native pan/pinch cannot cancel the bounded touch orbit.

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
two-row action (`TITLE - LEVEL`, then `PRICE coins`) in a two-column desktop grid and one-column narrow
grid; disabled reasons remain available through accessible names and titles without resizing the
visible controls. The modal owns only its controls, traps/restores focus, toggles with `U`, closes by an
explicit control, Escape, or a backdrop-only pointer activation, and does not turn the passive HUD into
click targets or leak input or camera rotation to the battlefield.

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

ABI-019 follows ABI-018; this is planned behavior. A compact real button beside the automatic-attack status pauses only automatic attacks. Running state exposes a pause action; paused state exposes a play/resume action with non-color and aria-readable state. Pausing freezes the remaining cooldown and resuming continues from it without catch-up or duplicate attacks.

Manual attacks, upgrades, modal interaction, rendering, persistence, and enemy animation remain active. Pause is session-only and is not added to the save schema; reload resumes normal automatic operation.

## Persistence

Progress is stored in version-addressed `localStorage` slots after meaningful state changes with a short debounce and on page hide. Current V3 is `etherlords.autobattleidle.save.v3`; retained predecessors are `.v2` and `.v1`; `etherlords.autobattleidle.save` remains the unversioned compatibility source. Normal saves and reset affect only V3.

V3 adds canonical `goldenBug` identity plus `resumeEncounter`. It never stores the absolute ten-second deadline, Three.js objects, DOM state, or presentation objects. Loading an active event reconstructs a fresh deadline at load time; independent browser QA read 9.9 s 100 ms after reload. Manual input never resets the event deadline or automatic cooldown.

Bootstrap prefers valid V3. If V3 is missing/invalid, it validates V2, preserves its raw bytes, migrates one version to V3, validates and publishes V3, then reloads stably. V1 composes through V2 to V3; the unversioned V2 source remains byte-for-byte intact. Failed publication preserves valid in-memory state and every source. Restore repairs only missing/invalid V3 from supported prior sources. Malformed/future values recover safely; explicit reset removes only V3.

Every task still classifies persistence impact. No-schema work proves historical loads; schema work ships one-version adapters, fixtures, and load -> migrate -> save -> reload proof. ABI-010 direct tests and browser QA prove V1/V2 retention, active-event reload, malformed V3 plus valid V2 recovery, and unchanged semantic progress.

## Delivery lifecycle

Every task follows `implement -> independent review -> independent QA -> manager close`. A failed gate returns concrete findings to the implementation owner; one new independent gate run follows the fix. There is no unbounded review/QA loop.

The manager records the persistence-impact classification during preflight. Reviewer verifies that a feature did not bypass the save boundary; QA loads the oldest supported fixture affected by the task and proves semantic progress after reload. When a schema changed, QA also proves the migrated current-version payload survives a second reload. These checks are required even when persistence is not the feature's main UI surface.

Each task records short timestamped high-level events in `PROGRESS.md`, including claim, implementation checkpoint, review result, QA result, return-to-implementation reason, and close. Review and QA details remain in their dedicated artifacts. Final release QA includes reload persistence, malformed save recovery, long-running progression, input behavior, responsive layout, and the deployed GitHub Pages build.

## Related


- [[quality/Testing Strategy|Testing Strategy]]
- [[architecture/Persistence Contract|Persistence Contract]]
