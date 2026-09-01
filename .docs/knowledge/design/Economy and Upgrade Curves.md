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
- `Auto attack speed`: repeatable; `APS(L) = 0.1 + 11.9 * L^2 / (L^2 + 100^2)` and `intervalMs = 1000 / APS(L)` before an enemy slow modifier. The curve starts at 0.1 APS, is finite and strictly increasing, and approaches but never exceeds 12 APS.

All five repeatable paths have no catalog/gameplay maximum and have a positive adjacent effect at tested 999,999→1,000,000. The shared effect-aware guard disables only a next step that the numeric representation cannot express as strictly better. Safe saturated costs prevent high-level HUD rendering failures. Purchases validate, subtract once, apply once, and persist. The UI consumes derived snapshot values; no combat formula is duplicated in the HUD.

## Balance proof

Golden Bug health is five times the base automatic damage envelope in its 10,000 ms window: `ceil(window / automaticInterval) * baseDamage * 5`. This guarantees automatic-only failure even with critical outcomes while a measured 10 Hz manual envelope can succeed without resetting automatic cooldown. Kill reward is exactly ten times the resumed progression enemy base reward, safe-saturated, unaffected by double-reward randomness, and awarded once; timeout awards zero.

The deterministic simulator is the current balance proof: it reuses production attack, purchase, spawn, cost, interval, chance, penetration, currency, boss, and Golden Bug timeout paths. Current receipts are generated from the simulator and verified by the repository check; historical 2.9-APS run totals and the former `14 files / 89 tests` count are not a production contract.

## Accepted derived-stat presentation and automatic-speed curve

ABI-018's derived-stat presentation remains current, while ABI-020 raises the automatic-throughput ceiling. Automatic speed now uses `APS(L) = 0.1 + 11.9 * L^2 / (L^2 + 100^2)`, remains finite and strictly increasing, and approaches but never exceeds 12 APS. The combat simulation consumes full throughput; presentation is bounded to 3 visual ticks per second.

At more than 3 APS, one visual tick resolves `APS / 3` attack-equivalent packets: whole packets have multiplier 1 and the optional remainder is a fractional multiplier. Examples are 3.3 APS -> `[1, 0.1]`, 6 APS -> `[1, 1]`, 10.2 APS -> `[1, 1, 1, 0.4]`, and 12 APS -> four full packets. Every packet rolls critical independently; remaining packets may continue against the next enemy at the same timestamp. Automatic-slow retains its existing 500 ms addition to the next tick.

A paid repeatable upgrade always advances to the next level that changes the displayed gameplay quantum. Skipped internal levels are charged as one combined cost, preventing repeated purchases that display `+0`. Damage uses integer steps; penetration, critical, and reward chance use thousandths; APS uses hundredths. A non-improving numeric endpoint remains disabled without debit.

The concrete packet values are preserved in [[High-APS Packet Batching Example]]. Revision-bound metadata and stored-source evidence: [[High-APS Packet Batching Example#L20-L26|example summary and asset link]] (contentHash `4f74cde6b85769893cdf4f602ee379c796dfcf7e829a26b050ed474cbc7de9d1`). See [[Combat Loop#Accepted automatic timing and pause follow-ups|runtime packet ownership]].

## Accepted ordinary-balance simulator

ABI-020 remains the ordinary-health and unattended-economy owner. The pure deterministic simulator reuses production spawn, attack, packet schedule, purchase, reward, critical, penetration, boss, and Golden Bug operations. It supports an exact oracle and a mathematically equivalent event-jump mode; final combat state matches at exact 1, 4, 8, 24, 48, and 49-hour horizons.

The accepted unattended strategy attempts at most one affordable repeatable purchase after each defeated progression enemy in deterministic round-robin order. Per-stage receipts separate ordinary, boss, and Golden outcomes; ordinary telemetry reports grade/modifier hit and time distributions, one/5/10-hit fractions, transitions, armor, walls, and bands. Golden observations are excluded from every ordinary cohort including grade transitions.

ABI-043 replaces the old boss 30-raw-hit target with a stage-aware envelope: a 30 post-armor non-critical-hit floor, 180 seconds of expected automatic DPS, and the historical stage curve as ceiling. It changes no price, reward, purchase-order, ordinary-health, Golden Bug, or upgrade formula.

The 48-hour checkpoint reaches boss encounter `36,365` at approximately 11.995 APS with unsaturated currency; 49 hours reaches `37,135` and proves continued progression. Endgame is defined by elapsed time, while encounter number is measured output. The earlier `24,920/30,234` and `250,863/257,354` checkpoints are superseded.

The regenerated task `MEASURED-REPORT.json` contains named automatic/manual/combined boss TTK receipts for bosses 35, 70, 1,015, 10,010, and 36,365, plus exact 48/49-hour economy and cohort telemetry. Linear-capped critical and penetration, altered cadence, damage, APS, reward, upgrade-cost, and exponential ordinary-health candidates remain rejected; production policies remain the baseline.

Vault preserves the earlier portable [[ABI-020 Reviewed Measurement Receipt]] and [[High-APS Packet Batching Example]] as historical reviewed evidence. The current ABI-043 conclusions in this section and the regenerated Planner task asset supersede only their old boss/48-hour checkpoint values.
