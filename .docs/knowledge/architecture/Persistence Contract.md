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

Save after meaningful state changes using a short debounce and on page hide. Version 1 lives at `etherlords.autobattleidle.save.v1`; version 2 lives at `etherlords.autobattleidle.save.v2`. The historical unversioned key is `etherlords.autobattleidle.save`.

Bootstrap first loads a valid version-addressed V2 slot. If that slot is missing, empty, or invalid, bootstrap next parses the unversioned value once: a valid schema-V2 document is imported into the V2 slot without applying the V1 adapter, while its original raw bytes remain unchanged. Only when neither source supplies valid V2 does bootstrap parse the V1 slot, validate the historical shape, apply the V1-to-V2 adapter, validate/reconstruct V2 domain state, and publish V2. A valid version-addressed V2 always wins and no compatibility source may overwrite it.

A deployment that does not change the schema must continue to load the current payload unchanged. A schema bump ships a deterministic one-version adapter for each supported predecessor; longer upgrades compose those adapters. Do not scatter version checks through application or UI code.

Migration and compatibility import preserve player progress: coins, encounter and remaining-health progress, automatic unlock, upgrade levels, armor penetration, and other canonical domain values. New fields receive explicit safe defaults only during schema migration. Derived damage/chance/cooldown fields are recomputed from canonical levels instead of trusting stale serialized copies.

## Migration commit and recovery

Keep the original localStorage payload until parsing, migration, current-schema validation, and in-memory reconstruction all succeed. Persist the new version atomically only after success. If that write fails, continue the valid migrated in-memory session and leave the previous payload available for a later retry; never replace it with a partial document.

Malformed JSON, wrong types, invalid values, unsupported future versions, unavailable storage, or a failed migration must not crash startup. Known supported historical versions must not silently fall back to a new game. A user-confirmed reset removes only the known save key.

## Historical V1 to V2 requirement

Repository history contains schema version 1 before armor-penetration and expanded level fields, while the current runtime writes schema version 2. The V1 to V2 adapter must preserve coins, encounter/enemy state, automatic unlock, damage, critical chance, double-reward chance, and automatic speed; it derives the corresponding levels where required and defaults armor penetration to level 0.

Golden V1 and V2 fixtures must prove load, migration, save, reload, and unchanged semantic progress. Browser QA must seed an actual historical payload, load the deployed application, observe the same progress plus safe new defaults, reload again, and confirm the upgraded V2 payload remains stable.

## V1 gameplay limit

Offline elapsed-time rewards are not stored or calculated in V1. Reload resumes the saved canonical state only.

## Summary

Versioned localStorage save schema, validation, stepwise migration, and no-progress-loss recovery rules.
