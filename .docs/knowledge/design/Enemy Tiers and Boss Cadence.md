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
serializable derived enemy state. Armor and hardened elites retain their encounter-derived armor only
while it is below half the current canonical non-critical player damage; this player-relative ceiling
bounds zero-penetration durability at 20 and 25 attacks respectively, and penetration reduces it further.
Vitality, automatic-slow, cadence, boss armor, Golden Bug, reward, and upgrade formulas remain unchanged.
The factory also contains a gold-orbital wealth composition for explicitly labeled synthetic visual
proof, but it is dormant: the current domain has no wealth enemy modifier or wealth reward multiplier.
Wealth must not activate until a domain rule and balance proof supply it through the snapshot.
Regeneration, ward charges, thorns, lifesteal, and evasion remain excluded because they require
unsupported mutable state, player health, or hidden randomness.

Ordinary enemies retain beetle, brute, and wisp for existing modifier/null identities. Hardened,
critical-guard, and manual-guard elites select authored mantis, sentinel, and drake families
respectively; bosses retain dedicated colossus and hydra bodies. Every shipped family has three
family-local authored palette/decor/attachment profiles selected from stable enemy identity, so
reload-equivalent snapshots reproduce the same composition. Grade and modifier cues remain independent
non-color layers. Shields and ornaments attach through family surface anchors with bounded mesh counts;
random primitive placement and detached global offsets are rejected.

Golden Bug keeps the every-50-encounters, ten-second event cadence and five-times health, but its reward
is now 50 times the resumed ordinary encounter reward so a successful timed kill is visibly significant.
The existing double-reward roll applies once to that payout; escape pays zero and resumes the stored
encounter. The combat log labels the Golden payout explicitly and includes the exact amount when compact
formatting would hide it.

## Boss cadence

A fresh run uses one explicit encounter-1 exception: the starter enemy has 10 maximum health, so baseline 1-damage, non-critical manual input defeats it in exactly 10 accepted attacks. Initial state construction applies the exception through `spawnStarterEnemy`; ordinary `spawnEnemy` retains the existing 140-base formula, including the safe endless rollover from the maximum encounter back to numeric encounter 1. Encounter 2 and later enemies, grades, modifiers, bosses, rewards, and endless-growth formulas retain their existing balance. The save schema does not change: new encounter-1 saves round-trip at 10 HP, while valid historical V1/V2 encounter-1 progress keeps its accepted 140-based semantics and is never reset or rewritten merely by this balance release.

V1 uses formula-driven encounters rather than handcrafted boss records. Bosses occur every 35 encounters. Base enemy health is `round(140 * (1 + (1.002 - 1) * (encounter - 1)))`; ordinary grade multipliers are normal 1x, veteran 1.5x, and elite 2x. A boss at zero-based boss index `i = ceil(encounter / 35) - 1` uses `10 + 120*i + 5*i^2`, producing multipliers 10, 135, and 270 for the first three bosses. Base rewards use `1.2 * encounter * grade multiplier`.

The deterministic unattended reference strategy unlocks automatic attack, then attempts exactly one affordable purchase after each defeated enemy in this order: damage, armor penetration, automatic speed, critical chance, and double reward. It never purchases after a non-defeating hit. Fixed rolls are 0.25 for critical/reward and 0 for the next elite modifier. Boss arrivals are encounter 35 at 777,468.7521174462 ms, encounter 70 at 2,830,992.261538386 ms, and encounter 105 at 4,694,837.4228284955 ms. Manual input is outside this unattended report and can only accelerate progress.

The run makes 104 repeatable purchases across 105 defeated encounters, plus the initial automatic unlock. This invariant prevents the simulator from buying several upgrades from one reward and keeps the measured cadence tied to the declared strategy.

Encounters use deterministic safe-number epochs. At the largest encounter whose armor remains safe, boss health and reward saturate to safe integers; the next defeated enemy rolls to encounter 1 while preserving player upgrades and safe saturated currency. This representation rollover prevents a crash or terminal combat cap; it is not a finite content list.

## Accepted ordinary-enemy health calibration

ABI-020 remains the ordinary-health owner: normal targets 1 hit, veteran 5 hits, and elite 10 hits before deterministic elite modifiers and armor. ABI-044 caps only Armor and Hardened elite armor at half the current canonical non-critical player damage, bounding zero-penetration durability at 20 and 25 attacks respectively.

ABI-043 owns boss durability. Boss maximum health is the safe-rounded value `min(legacyStageHealth, max(postArmorNonCriticalDamage * 30, expectedAutomaticDps * 180 seconds))`. The floor is 30 accepted non-critical hits after the existing boss armor and penetration calculation, not the rejected raw-damage floor that produced 77.5- and 142.3-minute early automatic walls. Expected DPS reuses canonical damage, effective boss armor, penetration, critical chance, `criticalDamageMultiplier`, and APS; the legacy curve remains only a stage-aware ceiling.

At the authentic encounter-2170 player state, boss max health is `19,373,445`; the historical V3 remaining fraction normalizes to `1,805,505`. The immediately previous V4 30-raw-hit boss is recognized separately and normalized by remaining-health fraction. Valid source slots, encounter, coins, counters, and player upgrades are preserved; the save schema remains V4.

The endgame boundary is time-based, not a promised encounter number. Under the accepted unattended production strategy, the exact 48-hour boundary is boss encounter `36,365`, the first ordinary endgame probe is `36,366`, and 49 hours reaches encounter `37,135`. Continued 49-hour progress is required; encounter number is measured output.

Five production-snapshot boss receipts cover automatic-only, 100 ms manual-only, and combined combat. Automatic TTK is 300.000 s at boss 35, 216.308 s at boss 70, 140.777 s at boss 1,015, and 143.750 s at bosses 10,010 and 36,365. Manual/combined receipts remain finite; combined is never slower than either isolated mode. Ordinary 1/5/10-hit bands, Golden Bug health/reward/window, rewards, boss armor, upgrade formulas, and attack packet rules are unchanged.

Exact and event-jump simulation agree through 49 hours. The regenerated `MEASURED-REPORT.json` is the canonical current receipt. The earlier `24,920/30,234` and `250,863/257,354` checkpoints in [[ABI-020 Reviewed Measurement Receipt]] are historical and superseded by ABI-043.

See [[Combat Loop#Accepted headless ordinary-balance telemetry|accepted simulator ownership]] and [[Economy and Upgrade Curves#Accepted ordinary-balance simulator|accepted economy evidence]].

## Presentation

The accepted implementation uses one shared deterministic family identity contract in `src/domain` and one snapshot-driven enemy composition path in `src/game`. Beetle, brute, wisp, mantis, sentinel, drake, colossus, and hydra expose named semantic parts instead of anonymous placement. Stable family, variant, and seed values reproduce the same composition after reload without entering save data.

ABI-029 extends the identity with 12 deterministic elemental affinity themes. Affinity is selected from the canonical encounter seed, derives the display label, palette, bounded cue, and measured reward multiplier together, and yields at least 96 family-affinity identities without per-combination classes. Reward factors are balanced across four 0.99, four 1.00, and four 1.01 themes. Golden Bug remains distinct: its authored metallic gold palette and 50x reward contract are not overridden by affinity presentation.

Enemy bodies own animated semantic sockets for `pose`, `head`, `top`, `overhead`, `front`, `left`, `right`, `flank`, `orbit`, and `combat`. Grade, modifier, affinity cues, and seeded decorations attach only through those sockets and inherit deformation. Affinity cues are bounded and boss-only crown, elemental spines, and orbital rune geometry is guarded to Hydra/Colossus. First-frame fit, orbit extrema, boss HUD clearance, ground contact, and desktop/narrow projection are regression-tested.

Reduced-motion resolution is shared across body, affinity cues, and boss geometry, including production snapshots that omit the optional override; Orbital Runes remain static under native `prefers-reduced-motion`. Active effects remain capped at 12 and resources dispose exactly once. Deterministic tests cover all 12 affinity themes, distribution receipts, reduced motion, disposal, and reload identity. Browser QA covers desktop/narrow ordinary and boss cases, historical save migration, replacement loops, and clean console/resource receipts.
