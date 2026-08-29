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

ABI-017 is a blocked follow-up after the behavior-preserving ABI-015 refactor; this section is a planned contract, not current deployed behavior. A default upgrade click requests one level, Shift-click requests up to 10, and Ctrl-click requests up to 100, with Ctrl taking precedence when both modifiers are present. The HUD emits one named `(upgradeId, quantity)` request and shows one compact aria-readable modifier hint in the existing dialog space.

The application applies the existing pure single-level purchase sequentially and stops on the first disabled or unaffordable result. Every successful level keeps the existing `Purchased ...` event in order. The failed attempt emits no event, debit, or level change. After the loop, the application performs one coherent render and persistence update; summarizing the events requires a separate product decision.

The follow-up does not change the save schema, modal layout model, focus trap, keyboard activation, dismissal, disabled reasons, or listener ownership. Focused tests and desktop/390px browser QA prove modifier precedence, caps, partial-stop parity with repeated single purchases, event count/order, failed-attempt identity, coherent persistence, accessibility, and no modal/focus regression.

## Planned current upgrade stats and automatic-speed balance

ABI-018 follows ABI-015 and ABI-017; this is planned behavior, not the current deployed balance. The upgrades dialog will add a compact aria-readable panel for current damage, armor penetration, critical chance, double-reward chance, and automatic attacks per second without changing the modal layout model.

Automatic speed will use `APS(level) = 0.1 + 2.9 * level^2 / (level^2 + 150^2)` and `intervalMs = 1000 / APS(level)`: about 0.1 APS at level 0, 0.99 at level 100, 1.96 at level 200, asymptotically below 3 APS. Armor penetration and critical chance keep their existing diminishing-return formulas; double reward is displayed but not rebalanced. ABI-014 starter behavior and ABI-016 cadence timing require fresh simulation evidence after this change.

## Planned automatic-attack pause control

ABI-019 follows ABI-018; this is planned behavior. A compact real button beside the automatic-attack status pauses only automatic attacks. Running state exposes a pause action; paused state exposes a play/resume action with non-color and aria-readable state. Pausing freezes the remaining cooldown and resuming continues from it without catch-up or duplicate attacks.

Manual attacks, upgrades, modal interaction, rendering, persistence, and enemy animation remain active. Pause is session-only and is not added to the save schema; reload resumes normal automatic operation.

## Persistence

Progress is stored in version-addressed `localStorage` slots after meaningful state changes with a short debounce and on page hide. The current V2 slot is `etherlords.autobattleidle.save.v2`; retained V1 is `etherlords.autobattleidle.save.v1`; `etherlords.autobattleidle.save` is the historical unversioned compatibility source. Normal saves and reset affect only V2.

Every task preflight classifies persistence impact as `no schema change`, `compatible extension`, or `schema migration`. A task with no schema change must still prove that the supported historical save fixtures load without semantic progress loss. A task that changes the shape or meaning of saved data ships the version bump, the next-version migration adapter, source and target fixtures, and load -> migrate -> save -> reload proof in the same delivery.

Supported saves never silently reset. Before gameplay, HUD, timers, or autosave, a valid versioned V2 wins. When it is missing, empty, or invalid, a valid schema-V2 document from the unversioned compatibility key is validated as V2 and published to the V2 slot without changing the original bytes; only then may bootstrap fall back to migrating V1. Failed publication leaves the valid in-memory state and every source value intact for bounded retry.

A visible native Restore from previous version action may explicitly repair a missing, empty, or invalid V2 from V1: it rereads/revalidates V1, remigrates, validates, and writes V2 before replacing live state; its accessible status reports success or failure. Malformed data and unsupported future versions fall back safely without crashing. A user-confirmed reset removes only V2.

## Delivery lifecycle

Every task follows `implement -> independent review -> independent QA -> manager close`. A failed gate returns concrete findings to the implementation owner; one new independent gate run follows the fix. There is no unbounded review/QA loop.

The manager records the persistence-impact classification during preflight. Reviewer verifies that a feature did not bypass the save boundary; QA loads the oldest supported fixture affected by the task and proves semantic progress after reload. When a schema changed, QA also proves the migrated current-version payload survives a second reload. These checks are required even when persistence is not the feature's main UI surface.

Each task records short timestamped high-level events in `PROGRESS.md`, including claim, implementation checkpoint, review result, QA result, return-to-implementation reason, and close. Review and QA details remain in their dedicated artifacts. Final release QA includes reload persistence, malformed save recovery, long-running progression, input behavior, responsive layout, and the deployed GitHub Pages build.

## Related


- [[quality/Testing Strategy|Testing Strategy]]
- [[architecture/Persistence Contract|Persistence Contract]]
