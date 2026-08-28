---
vaultFormat: 1
project: autobattleidle
vaultId: AUTOBATTLEIDLE-DOC-20260827-A7FD1F
kind: game-design
status: active
summary: >-
  Enemy grade modifiers, infinite boss progression, timing targets, and
  presentation rules.
tags:
  - enemies
  - bosses
  - balance
---
# Enemy Tiers and Boss Cadence

## Summary

Enemy grade modifiers, infinite boss progression, timing targets, and presentation rules.

## Enemy grades

Enemy presentation is composed from independent deterministic layers:

1. an archetype body selected from a small body catalog;
2. grade/boss silhouette, scale and non-color-only cues;
3. one gameplay modifier attachment;
4. seeded decorative ornaments chosen from several variants.

The live modifier catalog contains armor (paired shield plates), vitality (a visible core), and
automatic slow (an animated time ring). The factory also contains a gold-orbital wealth composition
for explicitly labeled synthetic visual proof, but it is dormant: the current domain has no wealth
enemy modifier or wealth reward multiplier. Runtime reward semantics remain the deterministic enemy
base reward plus the player-owned double-reward roll applied on defeat. Wealth must not activate until
a domain rule and balance proof supply it through the snapshot. Warded and regenerating remain
candidates only when their domain rules are implemented.

Ordinary enemies use three body families: beetle, brute, and wisp. Bosses use dedicated colossus and
hydra bodies plus the same composable modifier layer. Decorative horns, fins, orbitals, satellites,
scars, and grade crowns are selected from stable enemy identity so reload-equivalent snapshots
reproduce the same model. Color supports identity, while silhouette, motion, and attachments carry
the primary cue.

## Boss cadence

V1 uses formula-driven encounters rather than handcrafted boss records. Bosses occur every 15 encounters. Base enemy health is `round(140 * (1 + (1.002 - 1) * (encounter - 1)))`; ordinary grade multipliers are normal 1x, veteran 1.5x, and elite 2x. A boss at zero-based boss index `i = ceil(encounter / 15) - 1` uses `10 + 120*i + 5*i^2`, producing multipliers 10, 135, and 270 for the first three bosses. Base rewards use `1.2 * encounter * grade multiplier`.

The deterministic unattended reference strategy unlocks automatic attack, then attempts exactly one affordable purchase after each defeated enemy in this order: damage, armor penetration, automatic speed, critical chance, and double reward. It never purchases after a non-defeating hit. Fixed rolls are 0.25 for critical/reward and 0 for the next elite modifier. Boss arrivals are encounter 15 at 596,085.714285711 ms, encounter 30 at 1,296,381.36645964 ms, and encounter 45 at 2,135,163.9751553102 ms. Intervals are 596,085.714285711 ms (9.93 min), 700,295.652173929 ms (11.67 min), and 838,782.6086956701 ms (13.98 min). Manual input is outside this unattended report and can only accelerate progress.

The run makes 44 repeatable purchases across 45 defeated encounters, plus the initial automatic unlock. This invariant prevents the simulator from buying several upgrades from one reward and keeps the measured cadence tied to the declared strategy.

Encounters use deterministic safe-number epochs. At the largest encounter whose armor remains safe, boss health and reward saturate to safe integers; the next defeated enemy rolls to encounter 1 while preserving player upgrades and safe saturated currency. This representation rollover prevents a crash or terminal combat cap; it is not a finite content list.

## Planned ordinary-enemy health calibration

ABI-020 follows ABI-016 and ABI-018; this is a telemetry-driven candidate, not current deployed balance. Ordinary base health will compare safe-saturated exponential rates of 0.5% and 0.8% per encounter through the production combat path. The safer 0.5% candidate is evaluated first: approximate normal base health is 229, 292, 374, and 1,607 at encounters 100, 150, 200, and 500. The 0.8% candidate is approximately 308, 459, 684, and 7,463. A 1.0% candidate is excluded unless evidence disproves its late-wall risk.

The accepted rate must come from a deterministic headless simulation of at least 3,000 ordinary encounters with one round-robin affordable repeatable upgrade attempt after each defeat. Telemetry separates normal, veteran, elite, and bosses and reports hit/time-to-kill distributions, one-hit/5-plus/10-plus fractions, grade transitions, spikes, walls, and upgrade levels. Boss multipliers and ABI-016 cadence are not rebalanced by ABI-020.

## Presentation

The accepted implementation uses one snapshot-driven enemy-model factory in `src/game`. It owns
only its Three.js group and inspectable composition metadata; combat remains in `src/domain`.
Battlefield replacement retains the snapshot identity key and deterministically disposes retired
geometry and materials.

Desktop and 390px browser QA covered all ordinary bodies, both dedicated bosses, every active
modifier, boss/modifier compositions, and the explicitly synthetic dormant wealth cue. A 120-replacement
real WebGL run kept scene children bounded at 12, preserved stable seeds, disposed retired groups, and
reported no console or network errors.

A rare `Golden Bug` is a timed event enemy with a dedicated compact body and metallic gold material
that reacts to scene lighting with readable highlights. Its event rules, timer, reward and escape path
are separate from ordinary grade cadence and belong to ABI-010.
