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

Combat derives player effects from centralized safe-integer levels. Integer damage at level `L` is `min(Number.MAX_SAFE_INTEGER, 1 + L + floor(10 * sqrt(L)))`: practical levels gain at least one damage while the square-root bonus and relative gain diminish. Critical and double-reward chances are `0.6 * L / (L + 20)`. Armor penetration is `0.75 * L / (L + 20)`, and effective armor is `floor(armor * (1 - penetration))`, bounded at zero. A valid hit deals `max(1, base damage - effective armor)` before the 2x critical multiplier. `armorPreventedDamage` records only damage actually prevented after the minimum-hit rule.

Automatic interval is `1000 - 600 * L / (L + 20)` milliseconds, plus 500 ms only for the automatic-slow modifier. All five curves have strictly measurable adjacent effects at tested levels 999,999 and 1,000,000 without a repeatable gameplay cap. Before currency is spent, one shared guard requires the next representable level to strictly improve its effect; a non-improving IEEE-754 endpoint returns the original state with no debit. Runtime and deterministic simulator both call `attack`, `purchaseUpgrade`, `spawnEnemy`, and the same helpers; rendering owns no combat formula.

Defeat rewards are granted exactly once, with a 2x request when the roll is below the level-derived double-reward chance. Enemy rewards, the awarded amount, and total coins saturate safely, and the event reports the actual added amount. Integer damage keeps live enemy health persistence-compatible. V2 saves are exact-key validated and cross-check stored damage/chance values against levels; malformed, inconsistent, or V1 values recover to the supplied safe state. The highest accepted boss enemy also round-trips through V2 with safe saturated health and reward.

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

## Planned automatic timing and pause follow-ups

ABI-018 will replace only automatic attack timing with the bounded curve `APS(level) = 0.1 + 2.9 * level^2 / (level^2 + 150^2)`, converted by `intervalMs = 1000 / APS(level)`. The curve starts at 0.1 APS, is approximately 1 APS at level 100 and 2 APS at level 200, and approaches but never reaches 3 APS. Deterministic rolls, manual attacks, upgrade costs, armor penetration, critical chance, double reward, saves, and safe-number rollover remain unchanged.

ABI-019 will add a session-only pause for automatic attacks. Pause freezes the exact cooldown remainder; resume continues from it with no catch-up attack. Manual attacks and the rest of the application continue. Reload clears the pause state. Both follow-ups require fresh progression/cadence simulation, automatic-slow coverage, historical-save proof, and desktop/390px browser QA before these planned rules become current authority.

## Planned headless ordinary-balance telemetry

ABI-020 will exercise existing spawn, attack, and purchase operations without Three.js or DOM for at least 3,000 ordinary encounters using fixed rolls. It attempts at most one round-robin affordable repeatable purchase after each defeated ordinary enemy and records normal/veteran/elite hit and time distributions, transition spikes, walls, upgrade state, safe-number behavior, and bosses separately.

The simulation compares 0.5% and 0.8% safe-saturated exponential ordinary base-health growth after ABI-018 speed and ABI-016 cadence land. It must be deterministic, target roughly two seconds of test runtime, keep ordinary time-to-kill finite with no 60-second wall, and preserve intentional one-hit plus meaningful 5- and 10-hit cases. Boss cadence and multiplier are not changed.
