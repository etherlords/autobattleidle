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

ABI-020 remains the health owner. Ordinary and boss health is derived from the player's current integer
damage rather than a fixed low encounter base: normal targets 1 hit, veteran 5 hits, elite 10 hits, and
bosses 30 hits before deterministic elite modifiers and armor. ABI-044 changes only the armor added by
the armor and hardened elite modifiers: their encounter-derived raw armor is capped at half the current
canonical non-critical player damage. At zero penetration this bounds armored elites to at most 20
attacks and hardened elites to at most 25; penetration lowers both. Boss armor and health, boss cadence,
Golden Bug, rewards, upgrades, and ordinary HP variety are unchanged.

The endgame boundary is time-based, not a promised encounter number. Under the accepted unattended
production strategy, the corrected exact 48-hour non-boss probe is encounter 250,863 after boss 250,845,
and the 49-hour state is encounter 257,354. These receipts supersede 24,920/30,234: the prior measurements
included hundreds or thousands of minimum-damage packets from the uncapped armored-elite defect.
Exact and event-jump simulation still agree. The warmed 48-hour event-jump leg measures about 6.17
seconds on the reference workstation and is guarded by an 8-second portable bound.

The prior 0.5% and 0.8% exponential ordinary-health candidates were each measured over 3,000 ordinary
encounters and rejected for walls and adjacent-band jumps. Cadence, damage, APS, critical, penetration,
reward, and upgrade-cost alternatives remain measured through the production simulator. The retained
policies preserve 35-encounter bosses, asymptotic critical and penetration curves, current damage/economy,
and bounded 3 Hz presentation; the generated measurement receipt is rebaselined after the armor repair.

ABI-028 remains the measurement and regression contract. Its headless simulator reports automatic-only,
manual-only, and combined ordinary-enemy TTK across early `1–99`, start+ `100–499`, late start
`500–999`, midgame `1,000–9,999`, endgame start `10,000–250,862`, and open-ended endgame
`250,863+`. The endgame probe begins at the actual 48-hour current non-boss encounter; it does not
replace the ABI-020 health owner.

Raw attack packet events remain separate from logical attack units. Fractional high-APS packets
accumulate as integer micro-units, per-enemy attribution preserves mid-batch spill and event-jump work,
manual-only state remains finite without automatic unlocks, and exact/event-jump reports agree through
49 hours. Historical V3/V4 saves with an active pre-cap armored or hardened elite are recognized only
when their former derived enemy is exact, then normalized to the capped spawn while preserving health
fraction, encounter, player, currency, and V4 counters. The save schema does not change.

See [[Combat Loop#Accepted headless ordinary-balance telemetry|accepted simulator ownership]] and
[[Economy and Upgrade Curves#Accepted ordinary-balance simulator|accepted economy evidence]]. Reviewed
ABI-020 measurements remain preserved in [[ABI-020 Reviewed Measurement Receipt]]; revision-bound
metadata and stored-source evidence are at
[[ABI-020 Reviewed Measurement Receipt#L19-L25|receipt summary and asset link]]
(contentHash `a3450bcde391b5135fbf34125b0fbbef35d0e5557c3d306e2ed962561123e79d`).

## Presentation

The accepted implementation uses one shared deterministic family identity contract in `src/domain` and one snapshot-driven enemy composition path in `src/game`. Beetle, brute, wisp, mantis, sentinel, drake, colossus, and hydra expose named semantic parts instead of anonymous placement. Stable family, variant, and seed values reproduce the same composition after reload without entering save data.

Enemy bodies own animated semantic sockets for `pose`, `head`, `top`, `overhead`, `front`, `left`, `right`, `flank`, `orbit`, and `combat`. Grade, modifier, and seeded decorations attach only through those sockets and inherit deformation. First-frame fit, orbit extrema, boss HUD clearance, ground contact, and desktop/narrow projection are regression-tested. Battlefield camera framing uses stable neutral bounds rather than live deformation bounds, so idle, hit, critical, and death motion cannot make the scene pulse.

The Drake is a coherent +X-facing low-poly rig: center-hinged paired wings remain separately readable in the production projection, a curved animated chain of decreasing tail vertebrae ends in a terminal spike, the head and native/elite horns share the facing basis, and Manual Guard is a solid rimmed shield with a central boss. Other families retain their authored anatomy and family-local fit profiles. The Time Warp clock remains on the overhead socket and is tilted 11.5 degrees toward the camera while its hands animate.

Spawn, hit, critical, and death commands are routed exactly once through the unit view. Hit and critical interpolate continuously from the current pose and return to neutral without snapping, including repeated commands and reduced motion. A lethal event completes its 10-frame hit or 12-frame critical presentation, holds the defeated actor for an explicit six-frame pause, plays 14 death frames, and only then disposes and replaces it once. Rewards and deterministic combat state remain immediate; only presentation replacement is delayed. Boss identity, framing receipt, and camera pose stay bound to the displayed defeated boss until the sequence ends.

Ordinary and critical battlefield strikes use bounded translucent slash trails; armor and hardened impacts are smaller and more transparent. Active effects remain capped at 12, expired or evicted resources are disposed exactly once, and the visual layer does not own combat state. Golden Bug retains the beetle identity with metallic gold, crown/orbital cues, and its existing event lifecycle. The visual repair changes no reward, progression, save schema, or persistence rule.

Deterministic tests cover every current family and three authored profiles, semantic attachment and deformation, projection readability, exact animation endpoints and lethal ordering, reduced motion, camera stability, disposal, and reload identity. Browser QA uses isolated fixtures and binds desktop/narrow evidence to the exact production asset SHA. Exact published-SHA CI, Pages asset identity, and public functional proof remain Manager closure gates.
