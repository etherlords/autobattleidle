---
plannerFormat: 1
id: ABI-020
artifact: brief
project: ABI
profile: high-assurance
revision: 4
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-010
  - ABI-016
  - ABI-018
  - ABI-022
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-020: Rebalance combat progression with a deterministic headless simulator

## Goal

Balance ordinary enemy health with a deterministic headless progression simulator

## Work item

- Type: task
- Priority: high
- Status: Blocked

## Acceptance criteria

- [ ] A pure deterministic headless balance simulator uses production spawnEnemy, attack, and purchaseUpgrade without Three.js or DOM, supports at least 3000 configurable ordinary encounters, fixed rolls, and bounded runtime with approximately 2 seconds as the target.
- [ ] After each defeated ordinary enemy the simulator attempts at most one affordable repeatable upgrade in round-robin order across all repeatable upgrades for economy fidelity; combat-affecting damage, armor penetration, critical chance, and automatic speed levels are reported separately from double reward.
- [ ] Bosses are measured and reported separately; boss health multipliers remain unchanged, deterministic boss-cadence candidates keep gaps within the requested 50-150 encounter range, and selection is made only from simulator telemetry after ABI-016 camera work and ABI-018 automatic-speed behavior are accepted.
- [ ] Telemetry is grouped by normal, veteran, elite, authored ABI-022 family/modifier, boss, and encounter bands and reports hits-to-kill and time-to-kill p50, p90, maximum, one-hit/5-plus/10-plus fractions, grade transitions, upgrade levels, spikes, walls, boss gaps, and deterministic repeatability.
- [ ] The implementation compares ordinary-only exponential base health round(140 * (1 + r)^(encounter - 1)) with safe saturation for r=0.5% and r=0.8%, leads with 0.5% as the safer candidate, and selects a rate only from measured envelopes; 1.0% is excluded unless new evidence disproves its late-wall risk.
- [ ] Candidate reference values are approximately 229/292/374/1607 HP at encounters 100/150/200/500 for 0.5%, and 308/459/684/7463 for 0.8%; tests calculate rather than hard-code rounded prose values.
- [ ] In encounter bands 100-150 and 1000-1100 ordinary enemies retain intentional one-hit cases of at least 5%, 5-plus-hit cases of at least 20%, and 10-plus-hit cases of at least 5%; veteran and elite have nonzero 10-plus-hit cases without depending only on the armor modifier.
- [ ] No adjacent encounter-band median hits-to-kill jump exceeds 2x, every ordinary time-to-kill remains finite, no ordinary wall exceeds 60 seconds under the reference strategy, and safe-integer/epoch rollover remains valid.
- [ ] Reward telemetry compares a lower ordinary reward curve against the production Golden Bug economy delivered by ABI-010; the accepted curve avoids current excess currency without changing reward event ordering, safe-integer saturation, or save schema.
- [ ] Critical chance and armor penetration each compare two explicit strategies: an asymptotic curve that approaches but never reaches 100 percent, and documented overflow semantics above 100 percent. The simulator reports their combat/economy effects separately and the task adopts neither without measured evidence and a named product decision.
- [ ] Focused tests prove metric calculations, fixed-seed repeatability, round-robin one-purchase-per-defeat behavior, grade/boss separation, 0.5-versus-0.8 candidate comparison, boss-gap candidates, Golden Bug reward accounting, critical/penetration strategy alternatives, safe saturation, runtime bound, and accepted telemetry envelopes.
- [ ] Independent review, headless QA, save-compatibility proof, pnpm check, and exact-SHA CI/Pages pass with no unresolved P0-P2.
- [ ] Vault Enemy Tiers and Boss Cadence, Economy and Upgrade Curves, and Combat Loop are updated from planned candidates to the accepted formulas and measured report before Manager closure.
- [ ] Armored enemies are reported as a separate modifier cohort in early, mid, and late encounter bands with raw damage, effective armor, prevented damage, minimum-one-damage hit fraction, armor-penetration level, hits-to-kill, and time-to-kill; the preflight freezes explicit acceptable early and late envelopes before tuning.
- [ ] Measured candidates tune enemy armor growth and player armor penetration together: the accepted result must remove the early-game pattern where reachable armored encounters are dominated by repeated 1-damage hits, while late-game armored enemies still prevent a measurable nonzero share of incoming damage instead of becoming visually armored but mechanically irrelevant.
- [ ] Focused simulator and production-path tests cover the first armored encounters, representative midgame and 1000-plus late bands, the exact minimum-damage transition, adjacent penetration upgrades, and save reload; a candidate fails if it fixes early armor only by making late armor ineffective or introduces a new progression wall.

## Dependencies

- ABI-010
- ABI-016
- ABI-018
- ABI-022

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7FD1F
- AUTOBATTLEIDLE-DOC-20260827-A798F2
- AUTOBATTLEIDLE-DOC-20260827-584401
- AUTOBATTLEIDLE-DOC-20260828-ECBD82

## Constraints

- Follow the resolved workflow contract and project instructions.
