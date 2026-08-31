---
vaultFormat: 1
project: autobattleidle
vaultId: AUTOBATTLEIDLE-DOC-20260827-E27CD3
kind: architecture
status: active
summary: >-
  Versioned localStorage save schema, validation, stepwise migration, and
  no-progress-loss recovery rules.
tags:
  - persistence
  - localstorage
  - migration
  - recovery
---
# Persistence Contract

## Payload

The browser stores one versioned canonical game-state document in localStorage. It contains a numeric schema version and only deterministic state required to resume: progression, currency, upgrades, and other domain-owned values. It excludes Three.js objects, DOM state, listeners, animation state, and derived presentation data.

## Write and load

Save after meaningful state changes using a short debounce and on page hide. Version 1 lives at `etherlords.autobattleidle.save.v1`, version 2 at `.save.v2`, version 3 at `.save.v3`, and current version 4 at `.save.v4`; the historical unversioned key remains `etherlords.autobattleidle.save`.

Bootstrap first loads valid V4. Otherwise it validates the newest supported V3, V2, V1, or unversioned source, preserves its exact bytes, and applies exactly one deterministic adapter per version until V4. Only after current-schema validation and domain reconstruction succeeds may V4 be published. Valid V4 always wins.

V4 persists progression, currency, upgrades, enemy, optional Golden Bug identity/resume encounter, and the cumulative non-negative safe-integer `goldenBugDefeats`. The counter increments exactly once only for a lethal active Golden Bug. V1-V3 cannot reconstruct historical kills, so migration truthfully initializes it to zero while preserving every older field and source payload. The live event deadline and presentation state remain excluded; an active event receives a fresh ten-second deadline at load.

## Migration commit and recovery

Keep the original localStorage payload until parsing, migration, current-schema validation, and in-memory reconstruction all succeed. Persist the new version atomically only after success. If that write fails, continue the valid migrated in-memory session and leave the previous payload available for a later retry; never replace it with a partial document.

Malformed JSON, wrong types, invalid values, unsupported future versions, unavailable storage, or a failed migration must not crash startup. Known supported historical versions must not silently fall back to a new game. A user-confirmed reset removes only the known save key.

## Historical V1 to V2 requirement

Repository history contains schema V1 before armor-penetration/expanded levels, V2 before timed-event state, V3 before cumulative Golden Bug defeats, and current V4. V1-to-V2 preserves coins, enemy/progression, automatic unlock, damage, critical, double reward, and automatic speed while deriving levels and defaulting armor penetration to zero. V2-to-V3 preserves every V2 field and defaults `goldenBug` to null. V3-to-V4 preserves every V3 field and defaults `goldenBugDefeats` to zero because past defeats versus escapes are unknowable.

Golden V1/V2/V3 fixtures prove one-version-at-a-time load, migration, V4 save, reload, unchanged semantic progress, and unchanged source bytes. Active V3/V4 tests prove event identity/resume encounter round-trip without a stored deadline; load reconstructs a fresh ten-second window. Supported historical data must never shortcut versions or silently reset.

## V1 gameplay limit

Offline elapsed-time rewards are not stored or calculated in V1. Reload resumes the saved canonical state only.

## Summary

Versioned localStorage save schema, validation, stepwise migration, and no-progress-loss recovery rules.
