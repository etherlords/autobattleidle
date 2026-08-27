---
vaultFormat: 1
project: autobattleidle
vaultId: AUTOBATTLEIDLE-DOC-20260827-E60ECD
kind: reference
status: active
summary: 'Shared V1 terms for game rules, runtime boundaries, and delivery evidence.'
tags:
  - glossary
  - reference
  - v1
---
# Glossary

## Terms

- **Canonical state**: deterministic domain data required to resume gameplay.
- **Snapshot**: read-only domain view consumed by game and UI rendering.
- **Encounter**: one spawned enemy in the endless progression sequence.
- **Grade**: Normal, Veteran, Elite, or Boss classification with defined modifiers.
- **Boss cycle**: fixed encounter interval ending in a boss and a harder continued cycle.
- **Manual attack**: player-triggered domain command from pointer or keyboard input.
- **Automatic attack**: scheduled domain command unlocked by an upgrade.
- **Safe reset**: recovery path that discards an unusable save and starts a playable new game.
- **Planner evidence**: task lifecycle and independent gate records; it is not durable game design authority.
- **Vault knowledge**: durable architecture, decision, guide, and reference authority.
