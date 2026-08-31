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
- `Auto attack speed`: repeatable; `APS(L) = 0.1 + 2.9 * L^2 / (L^2 + 150^2)` and `intervalMs = 1000 / APS(L)` before an enemy slow modifier. The curve starts at 0.1 APS, is about 0.99 at level 100 and 1.96 at level 200, and remains strictly below 3 APS.

All five repeatable paths have no catalog/gameplay maximum and have a positive adjacent effect at tested 999,999→1,000,000. The shared effect-aware guard disables only a next step that the numeric representation cannot express as strictly better. Safe saturated costs prevent high-level HUD rendering failures. Purchases validate, subtract once, apply once, and persist. The UI consumes derived snapshot values; no combat formula is duplicated in the HUD.

## Balance proof

Golden Bug health is five times the base automatic damage envelope in its 10,000 ms window: `ceil(window / automaticInterval) * baseDamage * 5`. This guarantees automatic-only failure even with critical outcomes while a measured 10 Hz manual envelope can succeed without resetting automatic cooldown. Kill reward is exactly ten times the resumed progression enemy base reward, safe-saturated, unaffected by double-reward randomness, and awarded once; timeout awards zero.

`simulateProgression(3)` uses production attack, purchase, spawn, cost, interval, chance, penetration, safe-currency, ordinary/boss, and Golden Bug timeout paths with deterministic rolls. With the accepted APS curve it reaches bosses 35, 70, and 105 at 8,079,407.359888906 ms, 18,222,883.009831183 ms, and 25,581,417.26164943 ms. The report performs 2,780 automatic attacks, ends at encounter 106 with 36,501 coins, records 142,681 armor-prevented damage, and finishes at penetration 0.35526315789473684. Purchases remain unlock 1, damage 72, armor penetration 18, automatic speed 11, critical 3, and double reward 0.

Tests assert the exact deterministic report, one purchase per defeated progression enemy, Golden Bug zero-reward timeouts, manual/automatic envelope, exact reward, safe saturation, APS formula levels/bounds, elite +500 ms slow, persistence, rollover, and stale-attack rejection. `pnpm check` passes 14 files and 89 tests.

## Accepted derived-stat presentation and automatic-speed curve

ABI-018's derived-stat presentation remains current, while ABI-020 raises the automatic-throughput ceiling. Automatic speed now uses `APS(L) = 0.1 + 11.9 * L^2 / (L^2 + 100^2)`, remains finite and strictly increasing, and approaches but never exceeds 12 APS. The combat simulation consumes full throughput; presentation is bounded to 3 visual ticks per second.

At more than 3 APS, one visual tick resolves `APS / 3` attack-equivalent packets: whole packets have multiplier 1 and the optional remainder is a fractional multiplier. Examples are 3.3 APS -> `[1, 0.1]`, 6 APS -> `[1, 1]`, 10.2 APS -> `[1, 1, 1, 0.4]`, and 12 APS -> four full packets. Every packet rolls critical independently; remaining packets may continue against the next enemy at the same timestamp. Automatic-slow retains its existing 500 ms addition to the next tick.

A paid repeatable upgrade always advances to the next level that changes the displayed gameplay quantum. Skipped internal levels are charged as one combined cost, preventing repeated purchases that display `+0`. Damage uses integer steps; penetration, critical, and reward chance use thousandths; APS uses hundredths. A non-improving numeric endpoint remains disabled without debit.

The concrete packet values are preserved in [[High-APS Packet Batching Example]]. Revision-bound metadata and stored-source evidence: [[High-APS Packet Batching Example#L20-L26|example summary and asset link]] (contentHash `4f74cde6b85769893cdf4f602ee379c796dfcf7e829a26b050ed474cbc7de9d1`). See [[Combat Loop#Accepted automatic timing and pause follow-ups|runtime packet ownership]].

## Accepted ordinary-balance simulator

ABI-020 is accepted current behavior. The pure deterministic simulator reuses production spawn, attack, packet schedule, purchase, reward, critical, penetration, boss, and Golden Bug operations. It supports an exact oracle and a mathematically equivalent event-jump mode; final combat state matches at exact 1, 4, 8, 24, 48, and 49-hour horizons.

The accepted unattended strategy attempts at most one affordable repeatable purchase after each defeated progression enemy in deterministic round-robin order. Per-stage receipts separate ordinary, boss, and Golden outcomes; ordinary telemetry reports grade/modifier hit and time distributions, one/5/10-hit fractions, transitions, armor, walls, and bands. Golden observations are excluded from every ordinary cohort including grade transitions.

The 48-hour checkpoint reaches encounter 24,920 at approximately 11.995 APS with unsaturated currency; 49 hours reaches encounter 30,234 and proves continued progression. This time-based boundary defines the start of endgame. Linear-capped critical and penetration, altered cadence, damage, APS, reward, upgrade-cost, and both exponential health candidates were measured over at least 3,000 ordinary encounters and rejected; production policies remain the baseline.

The complete generated JSON stays with the task packet. Vault preserves only the reviewed portable [[ABI-020 Reviewed Measurement Receipt]] and the concrete [[High-APS Packet Batching Example]]. The receipt's revision-bound metadata is [[ABI-020 Reviewed Measurement Receipt#L19-L25|summary and stored-source link]] (contentHash `a3450bcde391b5135fbf34125b0fbbef35d0e5557c3d306e2ed962561123e79d`).
