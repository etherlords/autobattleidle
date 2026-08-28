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

The battlefield keeps the player and enemy visually separated. A large enemy-status HUD spans the top of the viewport and shows the enemy name, encounter level, grade and active modifier. Its health bar visibly shrinks as damage is applied and contains the exact centered value in `current/max` form, for example `1000/1000`. The accessible name exposes the same values without relying on color.

The automatic-attack HUD is separate from manual input. Before purchase it clearly shows that automatic attacks are locked. After unlock it shows a labeled countdown progress bar that drains from the full interval to zero, plus a live numeric countdown in seconds and milliseconds. At zero the scheduler issues one automatic attack and the bar restarts for the next interval. Manual pointer clicks and keyboard activation bypass this scheduler, execute exactly one immediate manual attack, and never reset or otherwise disturb the automatic cooldown.

A compact bounded event log sits at the lower right. It records recent combat and economy feedback, including the coins granted for each kill. It retains only a small recent window, is readable on narrow layouts, and uses a polite live region so new rewards are announced without stealing focus.

Currency, attack feedback, and upgrade controls remain DOM-owned. Controls expose accessible names, visible focus, disabled reasons, and readable contrast; Three.js owns only the animated battlefield. Desktop and common mobile widths must keep the enemy HUD, countdown, click target, and recent log usable without overlap.

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
