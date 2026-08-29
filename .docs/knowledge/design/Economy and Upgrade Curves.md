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

Coins are non-negative safe integers and saturate at `Number.MAX_SAFE_INTEGER`; a reward event reports only the amount actually added. Automatic unlock is the only one-time upgrade. Every repeatable upgrade accepts non-negative safe-integer levels without a gameplay maximum. A repeatable upgrade with base cost `b` and current level `L` costs `ceil(b * (L + 1)^1.35)`, saturated at `Number.MAX_SAFE_INTEGER`. Base costs are automatic unlock 1, damage 2, armor penetration 3, critical chance 3, double reward 4, and automatic speed 5.

Safe saturation keeps price, reward, enemy, and currency paths finite, positive, nondecreasing, persistable, and renderable. Before spending, the shared upgrade guard verifies that the next representable level strictly improves its derived effect: damage/chances/penetration must increase and automatic interval must decrease. When IEEE-754 can no longer represent an improvement, the purchase returns `Level cannot advance safely` with the identical state and no debit. This is a numeric representation boundary, not a low gameplay cap.

V2 persistence validates safe levels and cross-checks stored derived damage/chance values. Tests prove adjacent 999,999→1,000,000 effects remain measurable for every repeatable path, block all five non-improving final representation steps without spending, and cover max-cost, max-boss-reward, currency saturation, and highest-boss round-trip behavior.

## Upgrade catalog

- `Auto attack unlock`: one-time prerequisite; costs 1 and starts automatic combat.
- `Damage`: repeatable safe-integer levels; integer base damage is `min(Number.MAX_SAFE_INTEGER, 1 + L + floor(10 * sqrt(L)))`.
- `Armor penetration`: repeatable; `0.75 * L / (L + 20)` reduces effective armor while minimum hit damage remains one.
- `Critical`: repeatable; chance is `0.6 * L / (L + 20)` and critical damage is 2x.
- `Double reward`: repeatable; chance uses the same `0.6 * L / (L + 20)` curve and requested reward multiplier is 2x.
- `Auto attack speed`: repeatable; interval is `1000 - 600 * L / (L + 20)` ms before an enemy slow modifier.

All five repeatable paths have no catalog/gameplay maximum and have a positive adjacent effect at tested 999,999→1,000,000. The shared effect-aware guard disables only a next step that the numeric representation cannot express as strictly better. Safe saturated costs prevent high-level HUD rendering failures. Purchases validate, subtract once, apply once, and persist. The UI consumes the shared catalog; no formula is duplicated in the HUD.

## Balance proof

Golden Bug health is five times the base automatic damage envelope in its 10,000 ms window: `ceil(window / automaticInterval) * baseDamage * 5`. This guarantees automatic-only failure even with critical outcomes while a measured 10 Hz manual envelope can succeed without resetting automatic cooldown. Kill reward is exactly ten times the resumed progression enemy base reward, safe-saturated, unaffected by double-reward randomness, and awarded once; timeout awards zero.

`simulateProgression(3)` uses production attack, purchase, spawn, cost, interval, chance, penetration, safe-currency, ordinary/boss, and Golden Bug timeout paths with deterministic rolls. It reaches bosses 35, 70, and 105 at 777,468.7521174462 ms, 1,736,457.3179502685 ms, and 2,448,779.8985953485 ms. The report performs 2,885 automatic attacks, ends at encounter 106 with 36,501 coins, records 142,681 armor-prevented damage, and finishes at penetration 0.35526315789473684. Purchases are unlock 1, damage 72, armor penetration 18, automatic speed 11, critical 3, and double reward 0.

Tests assert the exact deterministic report, one purchase per defeated progression enemy, Golden Bug zero-reward timeouts, manual/automatic envelope, exact reward, safe saturation, million-level effects, persistence, rollover, and stale-attack rejection. `pnpm check` passes 14 files and 88 tests.

## Planned derived-stat presentation and automatic-speed curve

ABI-018 plans a compact current-stat presentation for damage, armor penetration, critical chance, double-reward chance, and automatic attacks per second. The automatic-speed upgrade will use `0.1 + 2.9 * level^2 / (level^2 + 150^2)` APS, remaining strictly increasing and asymptotically below 3 APS. Formula-table tests cover levels 0, 1, 10, 50, 100, 200, 500, and 1000.

The existing armor penetration `0.75 * level / (level + 20)` and critical chance `0.6 * level / (level + 20)` already have diminishing returns and never reach their caps, so they remain unchanged. Double reward is shown with its current formula but is not rebalanced; changing it would alter the reward economy and needs a separate product decision.

## Planned ordinary-balance simulator

ABI-020 will add a pure headless production-path simulator for at least 3,000 configurable ordinary encounters. After each defeat it attempts at most one affordable repeatable upgrade in round-robin order across the full repeatable catalog, while reporting combat-affecting levels separately from double reward. Candidate ordinary health growth is 0.5% versus 0.8% exponential per encounter; selection is based on measured hit/time-to-kill envelopes, not a hard-coded preference.

The report includes per-grade and per-band p50/p90/max hits and time, one-hit/5-plus/10-plus fractions, transitions, spikes, walls, safe saturation, and deterministic repeatability. No adjacent-band median may jump more than 2x and no ordinary wall may exceed 60 seconds under the reference strategy. Boss balance stays separate.
