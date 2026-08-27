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

- `+0 Normal`: baseline health and reward.
- `+1 Veteran`: increased health and reward, no special modifier.
- `+2 Elite`: further increased health and reward plus one visible modifier selected from armor,
  additional health, or automatic-attack slow. Click attacks ignore slow.
- `+3 Boss`: appears every fixed encounter interval and marks completion of a progression cycle.

Grade selection must be deterministic from encounter number except for an explicitly seeded elite
modifier. The UI always shows grade, health, reward preview, and active modifier.

## Boss cadence

V1 targets roughly ten minutes of unattended progression to the first boss after sensible purchases.
Each later boss target adds approximately one minute. Runtime formulas may calculate health and reward
from boss index; the game must not contain a finite list of handcrafted bosses.

Balance validation uses a headless simulation with representative purchase rules. The target is a
measured envelope, not an exact promise for every player. Manual clicking should accelerate progress.

## Presentation

Enemies use distinct primitive silhouettes, scale, color, and a short spawn/hit/death animation. Bosses
must be immediately recognizable without relying only on color. Effects remain bounded so long sessions
do not accumulate objects or listeners.
