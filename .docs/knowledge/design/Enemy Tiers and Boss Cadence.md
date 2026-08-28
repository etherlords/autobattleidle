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

The initial modifier catalog contains armor (shield plates or orbiting shields), vitality (larger body or
pulsing core), automatic slow (time ring), and wealth (gold ornaments and increased reward). Warded
(first-hit shield) and regenerating (bounded recovery) are candidates only when their domain rules and
balance proof are implemented; visual-only modifiers must never imply nonexistent gameplay.

Bosses use dedicated body families plus the same modifier layer. Decorative horns, fins, orbitals,
satellites, scars and crown variants are seeded from enemy identity so reloads reproduce the same model.
Color supports identity but silhouette, motion and attachments carry the primary cue.

## Boss cadence

V1 uses formula-driven encounters rather than handcrafted boss records. Bosses occur every 15 encounters. Base enemy health is `round(140 * (1 + (1.002 - 1) * (encounter - 1)))`; ordinary grade multipliers are normal 1x, veteran 1.5x, and elite 2x. A boss at zero-based boss index `i = ceil(encounter / 15) - 1` uses `10 + 120*i + 5*i^2`, producing multipliers 10, 135, and 270 for the first three bosses. Base rewards use `1.2 * encounter * grade multiplier`.

The deterministic unattended reference strategy unlocks automatic attack, then attempts exactly one affordable purchase after each defeated enemy in this order: damage, armor penetration, automatic speed, critical chance, and double reward. It never purchases after a non-defeating hit. Fixed rolls are 0.25 for critical/reward and 0 for the next elite modifier. Boss arrivals are encounter 15 at 596,085.714285711 ms, encounter 30 at 1,296,381.36645964 ms, and encounter 45 at 2,135,163.9751553102 ms. Intervals are 596,085.714285711 ms (9.93 min), 700,295.652173929 ms (11.67 min), and 838,782.6086956701 ms (13.98 min). Manual input is outside this unattended report and can only accelerate progress.

The run makes 44 repeatable purchases across 45 defeated encounters, plus the initial automatic unlock. This invariant prevents the simulator from buying several upgrades from one reward and keeps the measured cadence tied to the declared strategy.

Encounters use deterministic safe-number epochs. At the largest encounter whose armor remains safe, boss health and reward saturate to safe integers; the next defeated enemy rolls to encounter 1 while preserving player upgrades and safe saturated currency. This representation rollover prevents a crash or terminal combat cap; it is not a finite content list.

## Presentation

A single enemy-model factory composes body, grade, modifier and seeded decoration layers from an
immutable snapshot. It must not own combat state or randomize differently on every render. Replacement
and disposal are deterministic and bounded for long sessions.

Normal enemies use the shared body catalog; bosses use dedicated bodies with larger silhouettes and
boss cues. Armor, slow, vitality and wealth remain recognizable without relying only on color.
Decorations provide variation without changing stats.

A rare `Golden Bug` is a timed event enemy with a dedicated compact body and metallic gold material
that reacts to scene lighting with readable highlights. Its event rules, timer, reward and escape path
are separate from ordinary grade cadence.
