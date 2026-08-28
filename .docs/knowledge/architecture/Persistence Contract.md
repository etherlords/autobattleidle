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

Save after meaningful state changes using a short debounce and on page hide. Load parses unknown data once, validates the source-version shape, migrates every supported historical version step by step, validates the current shape and invariants, then reconstructs derived state through the domain.

A deployment that does not change the schema must continue to load the current payload unchanged. A schema bump must ship together with a deterministic adapter for every supported predecessor; version `N` migrates to `N+1`, and longer upgrades compose those adapters. Do not scatter version checks through application or UI code.

Migration preserves player progress: coins, encounter/enemy position, automatic unlock, upgrade levels, armor penetration, and other canonical domain values. New fields receive explicit safe defaults. Derived damage/chance/cooldown fields are recomputed from canonical levels instead of trusting stale serialized copies.

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
