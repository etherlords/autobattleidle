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

The browser view contains the player on the left, enemy on the right, health and encounter status,
currency, attack feedback, and an upgrade panel. Pointer and keyboard activation share one command path.
Controls expose accessible names, visible focus, disabled reasons, and readable contrast.

The scene scales to common desktop and mobile widths. Text and controls remain DOM-owned; Three.js owns
only the animated battlefield.

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
