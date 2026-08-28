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

The simulation owns elapsed time, enemy state, player statistics, automatic cooldown, rewards,
progression and timed-event state. Rendering consumes immutable snapshots and never changes outcomes.

One accepted pointer activation on the battlefield canvas or one Enter/Space activation while it is
focused issues exactly one manual attack. Passive HUD bars/logs never receive attack clicks, while the
upgrade modal consumes its own controls without leaking attacks to the canvas. Manual attacks bypass
and never alter automatic scheduling.

Automatic attacks remain independently scheduled. Their countdown reaches zero, issues exactly one
attack, and resets. Timed event enemies reuse the same attack command path but may add a visible
deadline and escape transition.

## Damage and rewards

Base damage and armor penetration are derived from centralized repeatable upgrade curves. Effective armor
uses a bounded formula; a valid hit still deals at least one. Critical hits and reward multipliers use
documented diminishing-return curves and remain finite at high levels.

A Golden Bug is offered for a fixed initial target window of ten seconds. Before spawn, its health is
derived from the maximum automatic damage possible during that window, multiplied by a tuned factor
(initial candidate 5x-10x), so automatic combat alone cannot defeat it before timeout. A measured manual
click-rate envelope must still make it killable through active input. On timeout it escapes with no
reward and normal progression resumes.

Golden Bug reward is likewise a tuned large multiplier (initial candidate 5x-10x ordinary reward).
Kill, timeout and reward are each exactly-once transitions and are included in deterministic simulator
evidence.

## State transitions

1. Spawn an ordinary enemy, boss, or eligible timed event from deterministic progression state.
2. Accept canvas/keyboard manual attacks and scheduled automatic attacks through one command path.
3. Apply armor penetration, armor, critical and damage formulas; emit one presentation event.
4. On ordinary death, grant reward once, advance encounter and spawn the next enemy.
5. On Golden Bug death, grant the event reward once and resume ordinary progression.
6. On Golden Bug timeout, grant nothing, emit escape feedback and resume ordinary progression.
7. Emit bounded presentation cues for hit, armored hit, critical hit, death, reward, boss transition and
   Golden Bug outcomes; effects never alter simulation state.
8. Continue without a terminal encounter or repeatable-upgrade cap.

Pure formulas and transitions require focused unit tests. Presentation owns effect lifetime and
deterministic cleanup.
