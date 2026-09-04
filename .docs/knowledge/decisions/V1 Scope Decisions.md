---
vaultFormat: 1
project: autobattleidle
vaultId: AUTOBATTLEIDLE-DOC-20260827-26DD42
kind: decision
status: active
summary: 'Deliberate V1 boundaries for runtime, assets, rewards, and module ownership.'
tags:
  - adr
  - v1
  - scope
---
# V1 Scope Decisions

## Decisions

- No backend, accounts, remote persistence, analytics, or network gameplay.
- No external asset pipeline: Three.js primitives and lightweight effects provide the battlefield.
- No offline rewards: saved progress resumes after reload without elapsed-time simulation.
- Domain, game, UI, persistence, and app remain separate owners as defined by Technical Architecture.
- GitHub Pages is the production deployment target; the deployed static build is part of release verification.

## Consequences

The game works offline after its static assets load and has no server-side recovery. New capabilities must preserve deterministic domain behavior and add a new decision only when they cross a V1 boundary.

## Related

- [[audio/ABI-034 Audio Runtime and Rights|ABI-034 Audio Runtime and Rights]]
