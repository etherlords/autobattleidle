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

The live modifier catalog contains armor (paired shield plates), vitality (a visible core), automatic
slow (an animated time ring), hardened (combined bounded health and armor plus a reinforced band),
critical guard (critical-multiplier suppression plus a prism guard), and manual guard (manual-only
post-armor reduction plus a directional barrier). All six use deterministic finite roll ranges and
serializable derived enemy state. Existing armor, vitality, automatic-slow, cadence, and reward formulas
remain unchanged. The factory also contains a gold-orbital wealth composition for explicitly labeled
synthetic visual proof, but it is dormant: the current domain has no wealth enemy modifier or wealth
reward multiplier. Wealth must not activate until a domain rule and balance proof supply it through the
snapshot. Regeneration, ward charges, thorns, lifesteal, and evasion remain excluded because they require
unsupported mutable state, player health, or hidden randomness.

Ordinary enemies retain beetle, brute, and wisp for existing modifier/null identities. Hardened,
critical-guard, and manual-guard elites select authored mantis, sentinel, and drake families
respectively; bosses retain dedicated colossus and hydra bodies. Every shipped family has three
family-local authored palette/decor/attachment profiles selected from stable enemy identity, so
reload-equivalent snapshots reproduce the same composition. Grade and modifier cues remain independent
non-color layers. Shields and ornaments attach through family surface anchors with bounded mesh counts;
random primitive placement and detached global offsets are rejected.

## Boss cadence

A fresh run uses one explicit encounter-1 exception: the starter enemy has 10 maximum health, so baseline 1-damage, non-critical manual input defeats it in exactly 10 accepted attacks. Initial state construction applies the exception through `spawnStarterEnemy`; ordinary `spawnEnemy` retains the existing 140-base formula, including the safe endless rollover from the maximum encounter back to numeric encounter 1. Encounter 2 and later enemies, grades, modifiers, bosses, rewards, and endless-growth formulas retain their existing balance. The save schema does not change: new encounter-1 saves round-trip at 10 HP, while valid historical V1/V2 encounter-1 progress keeps its accepted 140-based semantics and is never reset or rewritten merely by this balance release.

V1 uses formula-driven encounters rather than handcrafted boss records. Bosses occur every 35 encounters. Base enemy health is `round(140 * (1 + (1.002 - 1) * (encounter - 1)))`; ordinary grade multipliers are normal 1x, veteran 1.5x, and elite 2x. A boss at zero-based boss index `i = ceil(encounter / 35) - 1` uses `10 + 120*i + 5*i^2`, producing multipliers 10, 135, and 270 for the first three bosses. Base rewards use `1.2 * encounter * grade multiplier`.

The deterministic unattended reference strategy unlocks automatic attack, then attempts exactly one affordable purchase after each defeated enemy in this order: damage, armor penetration, automatic speed, critical chance, and double reward. It never purchases after a non-defeating hit. Fixed rolls are 0.25 for critical/reward and 0 for the next elite modifier. Boss arrivals are encounter 35 at 777,468.7521174462 ms, encounter 70 at 2,830,992.261538386 ms, and encounter 105 at 4,694,837.4228284955 ms. Manual input is outside this unattended report and can only accelerate progress.

The run makes 104 repeatable purchases across 105 defeated encounters, plus the initial automatic unlock. This invariant prevents the simulator from buying several upgrades from one reward and keeps the measured cadence tied to the declared strategy.

Encounters use deterministic safe-number epochs. At the largest encounter whose armor remains safe, boss health and reward saturate to safe integers; the next defeated enemy rolls to encounter 1 while preserving player upgrades and safe saturated currency. This representation rollover prevents a crash or terminal combat cap; it is not a finite content list.

## Planned ordinary-enemy health calibration

ABI-020 follows ABI-016 and ABI-018; this is a telemetry-driven candidate, not current deployed balance. Ordinary base health will compare safe-saturated exponential rates of 0.5% and 0.8% per encounter through the production combat path. The safer 0.5% candidate is evaluated first: approximate normal base health is 229, 292, 374, and 1,607 at encounters 100, 150, 200, and 500. The 0.8% candidate is approximately 308, 459, 684, and 7,463. A 1.0% candidate is excluded unless evidence disproves its late-wall risk.

The accepted rate must come from a deterministic headless simulation of at least 3,000 ordinary encounters with one round-robin affordable repeatable upgrade attempt after each defeat. Telemetry separates normal, veteran, elite, and bosses and reports hit/time-to-kill distributions, one-hit/5-plus/10-plus fractions, grade transitions, spikes, walls, and upgrade levels. Boss multipliers and ABI-016 cadence are not rebalanced by ABI-020.

## Presentation

The accepted implementation uses one snapshot-driven enemy-model factory in `src/game`. It owns only its Three.js group and inspectable composition metadata; combat remains in `src/domain`. Battlefield replacement retains snapshot identity and deterministically disposes retired geometry and materials.

Golden Bug uses a dedicated compact beetle body, metallic gold material that reacts to scene lighting, and crown/orbital silhouette cues so event identity does not depend on color. Its immutable snapshot identity and countdown replace through the same unit lifecycle as progression enemies.

Independent browser QA at 1440x900 and 390x844 proved readable Golden Bug identity, passive countdown/input ownership, one canvas, 55 DOM nodes, zero console errors or warnings, no failed requests, auto-only escape, manual kill, ordinary and boss resume, and historical-save recovery. Focused tests cover visual selection, metallic/non-color composition, replacement, and idempotent disposal.
