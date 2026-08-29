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

Save after meaningful state changes using a short debounce and on page hide. Version 1 lives at `etherlords.autobattleidle.save.v1`, version 2 at `.save.v2`, and current version 3 at `.save.v3`; the historical unversioned key remains `etherlords.autobattleidle.save`.

Bootstrap first loads valid V3. Otherwise it validates a supported V2 source, preserves its exact bytes, applies the deterministic V2-to-V3 adapter, validates/reconstructs V3, and only then publishes V3. V1 upgrades compose one version at a time through V2; a valid unversioned schema-V2 document follows the same validation and publication rule without changing its source bytes. Valid V3 always wins.

V3 persists progression, currency, upgrades, enemy, and optional Golden Bug identity/resume encounter. It excludes the live event deadline and all presentation state; an active event receives a fresh ten-second deadline at load. Derived damage/chance/cooldown fields are recomputed or cross-validated from canonical levels. A schema bump must continue to provide one deterministic adapter per supported predecessor.

## Migration commit and recovery

Keep the original localStorage payload until parsing, migration, current-schema validation, and in-memory reconstruction all succeed. Persist the new version atomically only after success. If that write fails, continue the valid migrated in-memory session and leave the previous payload available for a later retry; never replace it with a partial document.

Malformed JSON, wrong types, invalid values, unsupported future versions, unavailable storage, or a failed migration must not crash startup. Known supported historical versions must not silently fall back to a new game. A user-confirmed reset removes only the known save key.

## Historical V1 to V2 requirement

Repository history contains schema V1 before armor-penetration/expanded levels, V2 before timed-event state, and current V3. V1-to-V2 preserves coins, enemy/progression, automatic unlock, damage, critical, double reward, and automatic speed while deriving levels and defaulting armor penetration to zero. V2-to-V3 preserves every V2 field and defaults `goldenBug` to null.

Golden V1/V2 fixtures prove one-version-at-a-time load, migration, save, reload, and unchanged semantic progress. A direct version-addressed V2 test proves its raw bytes remain intact while V3 is published and stably reloaded. Active V3 tests prove event identity/resume encounter round-trip without a stored deadline; load reconstructs a fresh ten-second window. Browser QA additionally proved malformed V3 plus valid V2 recovery and historical enemy/coin preservation.

## V1 gameplay limit

Offline elapsed-time rewards are not stored or calculated in V1. Reload resumes the saved canonical state only.

## Summary

Versioned localStorage save schema, validation, stepwise migration, and no-progress-loss recovery rules.
