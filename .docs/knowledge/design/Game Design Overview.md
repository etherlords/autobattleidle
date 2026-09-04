---
vaultFormat: 1
project: autobattleidle
vaultId: AUTOBATTLEIDLE-DOC-20260827-A7F881
kind: architecture
status: active
summary: >-
  Canonical product goal, architecture boundaries, release acceptance, and
  delivery evidence.
tags:
  - overview
  - architecture
  - release
---
# Game Design Overview

## Summary

Canonical product goal, architecture boundaries, release acceptance, and delivery evidence.

## Product goal

Deliver a small browser game that reaches a stable, endlessly playable loop: fight, earn coins,
buy upgrades, defeat a boss, and continue into a harder cycle. The first release must work without
an account or backend and remain playable after a reload.

## Player promise

- The current enemy is always understandable through a prominent name, encounter level, grade, modifier, and a large numeric health bar that decreases with damage.
- Clicking or keyboard activation always performs an immediate manual attack when accepted; manual attacks remain useful and never disturb the automatic-attack cooldown.
- Automation reduces effort without disabling manual play. Its locked state and time to the next attack are visible through a countdown bar and seconds-plus-milliseconds readout.
- Every enemy defeat advances either purchasing power or boss progress, and a small recent log makes the granted reward visible.
- Progress is deterministic enough to test, while critical hits and rewards add readable variance.
- Player visual evolution uses a finite authored major-form catalogue plus bounded deterministic milestone identities: 100–900 uses 100-level cadence, 1000–9000 uses 1000-level cadence, 10000–48000 uses 2000-level cadence, 50000–95000 uses 5000-level cadence, and 100000 is the upper clamp. Every adjacent milestone has one distinct bounded visual marker; production replacement retains sockets, reduced-motion behavior, disposal, and the no-save-field rule. The Visual Lab can reopen each exact milestone through its URL level parameter.

## Technical boundaries

- `src/domain`: deterministic simulation and balance formulas; no DOM or Three.js imports.
- `src/game`: Three.js presentation and animation driven by domain snapshots.
- `src/ui`: DOM HUD, upgrade controls, accessible text, and input routing.
- `src/persistence`: versioned localStorage save/load with validation and safe reset.
- `src/app`: composition root and frame/update scheduling.

The game uses primitives and lightweight effects; no asset pipeline is required for V1.

## Release acceptance

The game starts in a browser, supports click and automatic attacks, shows enemy grades and bosses,
persists progress, survives malformed saves, continues beyond the first boss, and passes review plus
independent QA without known blocking defects.

## Delivery evidence

Planner `PROGRESS.md` records concise high-level events for every task. `REVIEW.md`, `QA.md`, and
`VERIFICATION.md` remain canonical gate evidence. These records will later generate a project
timeline visualization; no second manual event database is introduced.

## Related








- [[operations/Release and Deployment Operations|Release and Deployment Operations]]
- [[decisions/V1 Scope Decisions|V1 Scope Decisions]]
- [[architecture/Technical Architecture|Technical Architecture]]
- [[reference/Project Knowledge Map|Project Knowledge Map]]
- [[design/UI, Persistence, and QA|UI, Persistence, and QA]]
- [[design/Economy and Upgrade Curves|Economy and Upgrade Curves]]
- [[design/Enemy Tiers and Boss Cadence|Enemy Tiers and Boss Cadence]]
- [[design/Combat Loop|Combat Loop]]
