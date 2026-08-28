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

V1 targets roughly ten minutes of unattended progression to the first boss after sensible purchases.
Each later boss target adds approximately one minute. Runtime formulas may calculate health and reward
from boss index; the game must not contain a finite list of handcrafted bosses.

Balance validation uses a headless simulation with representative purchase rules. The target is a
measured envelope, not an exact promise for every player. Manual clicking should accelerate progress.

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
