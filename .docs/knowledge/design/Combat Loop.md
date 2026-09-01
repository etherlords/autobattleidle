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

1. Spawn progression enemies with the existing ordinary/boss cadence. After each 50th defeated progression encounter, interrupt before the next spawn with one Golden Bug and retain that exact next encounter as `resumeEncounter`.
2. Give the bug one fixed 10,000 ms live deadline. Accepted manual and automatic hits use the shared attack path and never move that deadline or the automatic cooldown schedule.
3. Derive bug health as `ceil(10000 / automaticInterval) * baseDamage * 5`. Even the automatic-only envelope cannot kill it; the measured 10 Hz manual envelope plus automatic attacks can.
4. On Golden Bug death, grant exactly one safe-saturated reward equal to ten times the resumed enemy base reward, clear event state, and spawn `resumeEncounter`.
5. At deadline equality, timeout wins before automatic damage: grant nothing, emit escape feedback, clear event state, and spawn the same `resumeEncounter`.
6. Ordinary/boss death, reward, rollover, and progression otherwise retain their existing rules. Presentation consumes immutable event identity/countdown and never changes outcomes.

Focused tests cover spawn/kill/escape, deadline anchoring/equality, reward/saturation, envelopes, stale attacks, and progression. Independent browser QA proved 9.9 s immediately after reload, auto-only escape after 10.2 s with zero reward, exactly 50 baseline manual hits for a +1,220 reward once, and boss resume at encounter 70.

## Accepted automatic timing and pause follow-ups

ABI-020 is accepted current automatic timing. Automatic throughput uses `APS(L) = 0.1 + 11.9 * L^2 / (L^2 + 100^2)` and approaches 12 APS. Combat presentation stays bounded at 3 visual ticks per second: each tick resolves `APS / 3` whole and optional fractional attack packets. The controller, exact simulator, event-jump simulator, and Golden evidence share the same packet scheduler.

Packets in one visual tick share a timestamp but roll critical independently. When an earlier packet defeats an enemy, remaining packets may continue against the spawned enemy at the same timestamp; the next automatic tick is committed only after the batch. The elite automatic-slow modifier keeps its existing 500 ms addition. See [[High-APS Packet Batching Example]] and its revision-bound [[High-APS Packet Batching Example#L20-L26|metadata plus stored-source link]] (contentHash `4f74cde6b85769893cdf4f602ee379c796dfcf7e829a26b050ed474cbc7de9d1`).

ABI-035 preserves each transient visual cue's `manual` or `automatic` source plus the resolved packet count and effective packet units from controller through presenter, snapshot, battlefield, and effects. Manual cues live for 8 frames; automatic cues scale within 6–12 frames from effective APS. Every bounded lifetime completes the same fixed authored trajectory and retires at zero opacity; reduced motion remains non-displacing. These values are presentation-only and add no scheduler, timer, or save state.

ABI-019 remains a separate planned session-only pause for automatic attacks. Pause must freeze the exact cooldown remainder, resume without a catch-up attack, leave manual attacks active, and clear on reload. ABI-020 changes no pause ownership.

## Accepted headless ordinary-balance telemetry

The headless harness executes production `spawnEnemy`, `attack`, `purchaseUpgrade`, reward, packet, boss, and Golden transitions without Three.js or DOM. It has an exact oracle and an event-jump implementation whose final state matches at exact 1, 4, 8, 24, 48, and 49-hour horizons.

Ordinary observations are filtered to non-boss, non-Golden encounters before grade/modifier distributions, walls, armor, bands, and adjacent grade transitions are computed. Boss and Golden metrics are separate. Golden automatic-only scheduling escapes with zero reward; deterministic manual plus automatic input defeats it and grants one reward.

Ordinary player-relative health remains normal 1 hit, veteran 5 hits, and elite 10 hits before modifiers and armor. Boss health is now `min(legacyStageHealth, max(postArmorNonCriticalDamage * 30, expectedAutomaticDps * 180 seconds))`. This preserves a real 30 accepted-hit floor under boss armor, uses the shared critical multiplier and APS, restores encounter 2,170 to `19,373,445` HP, and avoids the rejected early minimum-damage walls.

Named production-snapshot boss receipts cover automatic-only, 100 ms manual-only, and combined modes at encounters 35, 70, 1,015, 10,010, and 36,365. Automatic TTKs are respectively 300.000 s, 216.308 s, 140.777 s, 143.750 s, and 143.750 s; manual and combined receipts remain finite and combined is never slower.

Endgame begins by elapsed time around 48 hours. The corrected checkpoint is boss encounter `36,365`, its first ordinary probe is `36,366`, and 49 hours reaches `37,135` at approximately 11.995 APS. Valid V3 legacy and previous V4 30-raw-hit boss saves normalize by health fraction without resetting progress; the save schema remains V4.

The full regenerated report remains a rebuildable Planner task asset. [[ABI-020 Reviewed Measurement Receipt]] remains historical evidence; its earlier boss and time checkpoints are superseded by ABI-043. Economy and upgrade ownership is linked at [[Economy and Upgrade Curves#Accepted ordinary-balance simulator|accepted simulator economy]].
