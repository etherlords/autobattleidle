---
vaultFormat: 1
project: autobattleidle
vaultId: AUTOBATTLEIDLE-DOC-20260827-A798F2
kind: game-design
status: active
summary: 'Currency invariants, upgrade catalog, cost growth, and balance proof.'
tags:
  - economy
  - upgrades
  - balance
---
# Economy and Upgrade Curves

## Summary

Currency invariants, upgrade catalog, cost growth, and balance proof.

## Currency and costs

Coins are integer-valued and never negative. Upgrade prices grow geometrically from explicit base
costs. The initial curve must prevent buying every upgrade before the first boss while still offering
a meaningful choice during the first few enemies.

## Upgrade catalog

- `Auto attack unlock`: purchased once; starts at one automatic attack per second.
- `Damage`: repeatable; increases base damage.
- `Critical chance`: repeatable and capped below guaranteed critical hits; critical damage is 2x.
- `Double reward chance`: repeatable and capped below guaranteed double rewards.
- `Auto attack speed`: repeatable after unlock; reduces interval to a safe documented minimum.

Purchases are atomic: validate availability and funds, subtract once, apply once, then persist. Disabled
controls explain whether funds, prerequisite, or cap blocks the purchase.

## Balance proof

A deterministic simulator records time-to-boss, upgrades purchased, attack counts, and currency flow for
the first several bosses. The release gate checks that progression neither stalls nor trivializes all
choices before the first boss. Exact constants remain centralized in one balance module.
