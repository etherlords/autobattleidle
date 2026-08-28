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

Coins are integer-valued and never negative. Repeatable upgrade prices increase forever through
centralized formulas that stay finite and monotonic across the simulator's supported long-run range.
The first curve must prevent buying every useful path before the first boss while still offering
meaningful early choices.

Geometric growth may be used only while numeric stability and measured progression remain valid. Cost,
reward, and level formulas must define their long-run ceiling/representation explicitly instead of
overflowing JavaScript numbers or silently producing Infinity/NaN.

## Upgrade catalog

- `Auto attack unlock`: one-time prerequisite; starts automatic combat.
- `Damage`: indefinitely repeatable; increases base damage with a measured long-run curve.
- `Armor penetration`: indefinitely repeatable; reduces effective armor through a bounded formula
  while preserving the minimum-hit invariant.
- `Critical`: indefinitely levelled with diminishing returns toward a documented probability/effect
  ceiling; it never creates invalid or guaranteed overflow behavior.
- `Double reward`: indefinitely levelled with diminishing returns toward a documented ceiling.
- `Auto attack speed`: indefinitely levelled with diminishing returns toward a safe minimum interval.

The one-time unlock is the only finite purchase. Every repeatable level must have a measurable effect,
even when a probability or interval approaches its safe limit. Purchases remain atomic: validate,
subtract once, apply once, then persist. The UI shows current level, next effect, cost, prerequisite and
disabled reason.

## Balance proof

A deterministic simulator records time-to-boss, upgrade levels, purchase order, manual/automatic attack
counts, armor mitigation, effective penetration, and currency flow for several bosses and a high-level
long-run sample. Runtime and simulator consume the same constants and formulas.

Acceptance proves early choices are not exhausted, armor-heavy enemies remain beatable through
investment, later purchases remain meaningful, and no supported encounter/level produces Infinity,
NaN, negative costs, zero-cost loops, or a terminal maximum. Exact constants are tuned from measured
reports rather than guessed in UI code.
