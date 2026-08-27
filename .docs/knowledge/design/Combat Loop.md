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

The simulation owns elapsed time, enemy state, player statistics, attack cooldown, rewards, and
progression. Rendering consumes immutable snapshots and never changes combat state directly.

Manual input calls one bounded attack command per accepted pointer activation. There is no gameplay
rate limit for intentional clicks, but one browser event must never produce duplicate attacks.
Automatic attacks are locked initially, then start at one attack per second and become faster through
upgrades. Grade +2 slow effects modify only the automatic interval; manual clicks remain unaffected.

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
