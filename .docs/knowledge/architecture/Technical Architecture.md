---
vaultFormat: 1
project: autobattleidle
vaultId: AUTOBATTLEIDLE-DOC-20260827-D74E4E
kind: architecture
status: active
summary: 'V1 module ownership, data flow, and browser stack boundaries.'
tags:
  - architecture
  - modules
  - threejs
---
# Technical Architecture

## Ownership

- `src/domain` owns deterministic state, rules, balance, commands, and snapshots; it imports no DOM or Three.js APIs.
- `src/game` owns Three.js scene setup, primitive actors, effects, and disposal; it renders domain snapshots and emits no game rules.
- `src/ui` owns DOM HUD, accessible controls, and input routing into domain commands.
- `src/persistence` owns validated save serialization, migration, and localStorage I/O.
- `src/app` is the composition root: it creates modules, schedules frames, and coordinates save triggers.

## Data flow

Input becomes a domain command. The domain returns a snapshot. Game and UI render that snapshot. Persistence stores only canonical domain state; presentation objects and timers are rebuilt after load.

## Stack

V1 is a static Vite browser application using TypeScript, Three.js, DOM controls, and browser localStorage. It uses the installed Vite, TypeScript, Vitest, ESLint, Prettier, and Three.js toolchain. No backend, asset pipeline, or network service is part of the release.

## Related



- [[decisions/V1 Scope Decisions|V1 Scope Decisions]]
- [[quality/Testing Strategy|Testing Strategy]]
- [[architecture/Persistence Contract|Persistence Contract]]
