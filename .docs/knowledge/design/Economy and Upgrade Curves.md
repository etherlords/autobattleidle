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

`simulateProgression(3)` runs production attack, purchase, spawn, cost, interval, chance, penetration, safe-currency, and encounter-transition paths with deterministic rolls. After the initial automatic unlock it attempts exactly one affordable repeatable purchase per defeated enemy, in the declared order, and none after non-defeating hits. It reaches boss encounters 15, 30, and 45 at 596,085.714285711 ms, 1,296,381.36645964 ms, and 2,135,163.9751553102 ms. Intervals are 596,085.714285711 ms, 700,295.652173929 ms, and 838,782.6086956701 ms; later targets increase materially.

The report performs 2,262 automatic attacks and 0 manual attacks, ends at encounter 46 with 18,081 coins, records 50,313 armor-prevented damage, and finishes at penetration 0.25. Purchases are automatic unlock 1, damage 31, armor penetration 10, critical 0, double reward 0, and automatic speed 3. The 44 repeatable purchases do not exceed the 45 defeated encounters, and unpurchased choices remain open before and after the first boss.

Tests assert the complete exact report plus the one-purchase-per-defeat invariant, first/later target envelopes, minimum damage, all five million-level adjacent effects, effect-aware representation-boundary blocking/no-spend, integer good-save round-trip and mismatched fallback, encounter 100→101 and safe epoch rollover, saturated cost/reward/currency, highest-boss persistence, and stale-attack rejection after rollover. `pnpm check` covers lint, formatting, 14 Vitest tests, TypeScript, and Vite build. Source: `src/domain/combat.ts`, `src/domain/progression-simulator.ts`, `src/domain/combat.test.ts`, and `src/persistence/persistence-boundary.ts`.
