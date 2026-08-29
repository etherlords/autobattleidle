---
plannerFormat: 1
id: ABI-018
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-015
  - ABI-017
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-018 analysis

## Verified current state

- `src/domain/combat/upgrades.ts` owns all player curves and automatic scheduling; the current speed curve is interval-first (`1000 - 600 * L / (L + 20)`) plus the elite `500 ms` slow.
- `src/domain/snapshot.ts` exposes automatic interval/remainder and upgrade rows but no named current-stat contract. `src/ui/hud/upgrade-dialog.ts` owns the existing modal and has spare space without a redesign.
- Damage, armor penetration, critical chance, and double reward already derive from normalized safe-integer levels. Save V3 persists canonical levels/state and deliberately excludes derived presentation data.
- ABI-014 starter health is already `10`; ABI-016 is camera-only. The deterministic progression simulator is the timing regression owner.

## Approach

- Replace only automatic timing with `APS(L) = 0.1 + 2.9 * L^2 / (L^2 + 150^2)` and `intervalMs = 1000 / APS(L)`; keep the elite slow as a `500 ms` interval addition.
- Reuse existing formula helpers to expose one named immutable `playerStats` snapshot and render five compact aria-readable values in the existing upgrade dialog.
- Add focused formula-table/bounds tests, snapshot-to-modal integration proof, automatic-slow proof, historical V1/V2/V3 load-save-reload proof, and update the deterministic progression reference.
- Acceptance layers: formula and progression criteria are unit; snapshot/modal/persistence are integration; desktop/390px interaction and exact-SHA Pages behavior are deployed.
- Persistence impact: **no schema change**. Canonical levels remain stored; all displayed stats are recomputed.

## Risks

- Squaring near `Number.MAX_SAFE_INTEGER` can overflow; compute the ratio as `1 / (1 + (150 / L)^2)` for positive normalized levels.
- Early automation becomes materially slower, so cooldown, Golden Bug envelopes, and reference progression timings must be refreshed from executable evidence without changing unrelated balance.
- Percentage rounding must remain presentation-only and must not imply the asymptotic caps are reachable.
