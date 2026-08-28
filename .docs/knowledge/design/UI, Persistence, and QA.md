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

The battlefield canvas is the primary manual-attack target. One accepted pointer activation anywhere
on the playable canvas issues exactly one manual attack; there is no permanent Attack button. Keyboard
Enter/Space remains an accessible equivalent when the battlefield is focused. Manual input still
bypasses and never resets the automatic cooldown.

The HUD is a fixed overlay that does not participate in page layout. Enemy name is centered at the top;
a nearly viewport-width current/max health bar sits directly below it; the automatic-attack bar follows
at roughly 35-45% viewport width; coins appear below the bars. Health and automatic bars are display
only: they are not clickable, draggable, selectable, or pointer targets. DOM progress elements are
preferred over Three.js geometry because they preserve accessible names and exact numeric values.

The bounded combat/reward log remains fixed at the lower right and never changes document height. The
page itself must not expose vertical or horizontal scrollbars at supported desktop and narrow sizes.

Upgrades are hidden by default. A fixed `Upgrades` launcher sits over the canvas near the lower left.
Activating it opens a fixed modal above all content without reflowing the battlefield. The modal owns
only its controls, explains costs and disabled reasons, traps/restores focus, closes by an explicit
control and Escape, and does not turn the passive HUD into click targets.

Overlay layering is explicit: passive HUD and log ignore pointer events; upgrade launcher/modal accept
them; the remaining viewport routes pointer input to the canvas. Responsive QA proves no overlap,
selection, accidental double attack, page scroll, or layout growth.

## Persistence

Progress is stored in `localStorage` after meaningful state changes with a short debounce and on page
hide. The payload has a schema version and contains only canonical simulation state. Load validates every
field, applies migrations for supported older versions, and falls back to a safe new game for malformed or
unsupported data without crashing. A user-confirmed reset removes the save.

Offline elapsed-time rewards are deferred from V1 unless implementation and QA prove a bounded formula;
ordinary saved progress must still resume exactly.

## Delivery lifecycle

Every task follows `implement -> independent review -> independent QA -> manager close`. A failed gate
returns concrete findings to the implementation owner; one new independent gate run follows the fix.
There is no unbounded review/QA loop.

Each task records short timestamped high-level events in `PROGRESS.md`, including claim, implementation
checkpoint, review result, QA result, return-to-implementation reason, and close. Review and QA details
remain in their dedicated artifacts. Final release QA includes reload persistence, malformed save recovery,
long-running progression, input behavior, responsive layout, and the deployed GitHub Pages build.

## Related


- [[quality/Testing Strategy|Testing Strategy]]
- [[architecture/Persistence Contract|Persistence Contract]]
