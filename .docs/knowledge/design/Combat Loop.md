---
vaultFormat: 1
project: autobattleidle
vaultId: AUTOBATTLEIDLE-DOC-20260827-584401
kind: workflow
status: active
summary: 'Deterministic attack, damage, reward, and encounter transition rules.'
tags:
  - combat
  - simulation
  - input
---
# Combat Loop

## Summary

Deterministic attack, damage, reward, and encounter transition rules.

## Runtime loop

The simulation owns elapsed time, enemy state, player statistics, automatic-attack cooldown, rewards, and progression. Rendering consumes immutable snapshots and never changes combat state directly.

Manual pointer or keyboard activation calls one bounded attack command per accepted browser activation. Manual attacks bypass automatic scheduling: they may occur while the automatic cooldown is running and never reset, extend, shorten, or otherwise change that cooldown. One browser activation must never produce duplicate attacks.

Automatic attacks are locked initially. After the one-time unlock, the scheduler counts down the current automatic interval. When remaining time reaches zero it issues exactly one automatic attack, then starts the next interval. The default interval is one second and speed upgrades may shorten it to the documented minimum. Grade +2 slow modifies only the automatic interval; manual attacks remain unaffected.

The presentation snapshot exposes the automatic locked state, total interval, and remaining milliseconds. The UI renders a countdown progress bar that drains to zero and a visible seconds-plus-milliseconds readout; reaching zero corresponds to the scheduled attack.

## Damage and rewards

Base damage is upgraded additively or multiplicatively through one documented formula. A critical hit
deals exactly 2x final damage. Armor reduces damage through a bounded formula and can never reduce a
valid hit below one. On death, reward is granted once; the double-reward roll can multiply it by two.

## State transitions

1. Spawn an enemy for the current encounter number.
2. Accept manual and scheduled automatic attacks.
3. Apply damage and emit a presentation event.
4. On death, grant reward exactly once and advance the encounter.
5. Spawn the next grade or boss and continue without a terminal level cap.

Pure formulas and state transitions require focused unit tests. Visual effects must not alter outcomes.
