---
vaultFormat: 1
project: autobattleidle
vaultId: AUTOBATTLEIDLE-DOC-20260827-E27CD3
kind: architecture
status: active
summary: 'Versioned localStorage save schema, validation, migration, and recovery rules.'
tags:
  - persistence
  - localstorage
  - recovery
---
# Persistence Contract

## Payload

The browser stores one versioned canonical game-state document in localStorage. It contains a numeric schema version and only deterministic state required to resume: progression, currency, upgrades, and other domain-owned values. It excludes Three.js objects, DOM state, listeners, animation state, and derived presentation data.

## Write and load

Save after meaningful state changes using a short debounce and on page hide. Load parses defensively, validates every field and invariant, migrates supported prior versions, then reconstructs derived state through the domain.

## Recovery

Malformed JSON, wrong types, invalid values, unsupported versions, unavailable storage, or failed migration must not crash startup. Discard the unusable payload and start a safe new game. A user-confirmed reset removes the known save key.

## V1 limit

Offline elapsed-time rewards are not stored or calculated in V1. Reload resumes the saved canonical state only.
