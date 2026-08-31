---
plannerFormat: 1
id: ABI-020
artifact: brief
project: ABI
profile: high-assurance
revision: 19
status: In Progress
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
- Priority: critical
- Status: In Progress

## Acceptance criteria

- [ ] A deterministic balance harness has two modes: an exact production-path oracle that calls spawnEnemy, attack, Golden Bug transitions, and purchaseUpgrade, plus a mathematically equivalent event-jump fast-forward mode. Sampled and boundary runs prove both modes agree; the fast-forward run simulates a 48-hour real-time horizon in approximately two seconds of test runtime without iterating idle milliseconds or rendering.
- [ ] Progression is reported in six explicit elapsed-time stages: Start 0-1 hour, Start+ 1-4 hours, End of Start 4-8 hours, Midgame 8-24 hours, Endgame Start 24-48 hours, and Endgame from 48 hours onward. Every stage reports reached encounter, encounters per second, player levels/stats, currency, purchases, and ordinary/boss/Golden Bug outcomes.
- [ ] From a fresh deterministic save with no manual attacks, automatic unlock and sequential affordable upgrade purchases produce a playable curve whose Endgame begins at approximately 48 real hours with plus or minus 20 percent tolerance. The encounter reached at that boundary is an emergent measured result, not a one-million-encounter target, and the report accounts for every boss and Golden Bug delay.
- [ ] Golden Bug health calculation is retained as the accepted reference because its approximately 900,000 HP at encounter 2,000-plus feels correct against approximately 11,000 damage per click and its ten-second window. ABI-020 must not weaken or redesign that formula; it uses the Golden Bug hit budget as a calibration anchor for ordinary and boss health.
- [ ] Ordinary enemies use a centralized monotonic safe-saturated formula tied to reachable player damage and a lower fraction of the accepted Golden Bug hit budget. Each elapsed-time stage retains nonzero one-hit, five-plus-hit, and ten-plus-hit populations across normal, veteran, elite, armor, and non-armor cohorts; a late enemy with about 200 HP against about 11,000 damage is an explicit failing fixture.
- [ ] Boss health and cadence are measured separately from ordinary enemies and below/against the same Golden Bug reference envelope according to their role. Each elapsed-time stage records boss hit and TTK p50/p90/max plus cadence contribution to the 48-hour horizon; no boss creates an unexplained wall or becomes negligible relative to ordinary progression.
- [ ] The exact and fast-forward simulations preserve the production Golden Bug ten-second kill/escape behavior and report its manual-plus-automatic and automatic-only outcomes. The balance decision scales ordinary/boss formulas around the Golden Bug reference rather than changing a Golden Bug calculation that already produces the intended click feel.
- [ ] Health, reward, boss, damage, attack-speed, critical, armor-penetration, and upgrade-cost alternatives are real measured simulator inputs. MEASURED-REPORT.json is generated from those runs, records accepted/rejected reasons, and contains no unsupported static conclusion string; Golden Bug health is a retained measured reference, not a tuning candidate.
- [ ] After each defeated progression enemy the reference strategy attempts at most one affordable repeatable upgrade in a deterministic declared order. Upgrade families may use different costs according to measured marginal value and stage affordability; equal pricing is not required.
- [ ] Every successful repeatable purchase strictly improves its gameplay stat by at least its minimum meaningful/displayed quantum. The player is never charged for a +0 step; if several internal levels are required for the next representable effect, one purchase atomically buys that effect and charges the combined monotonic cost once.
- [ ] Damage, automatic speed, critical chance, double reward, and armor penetration remain finite, monotonic, safe-saturated, and useful through the 48-hour horizon plus a bounded post-48-hour Endgame sample. Focused tests cover adjacent purchases at time-stage boundaries and high levels, including prices that differ by upgrade family.
- [ ] Reward telemetry includes ordinary, boss, Golden Bug, and double-reward income, purchase spend by family, excess currency, unaffordable gaps, and saturation. The accepted economy funds the declared sequential policy without trivializing all later prices or creating a permanent upgrade drought.
- [ ] Telemetry groups normal, veteran, elite, every authored ABI-022 modifier, boss, Golden Bug, and all six elapsed-time stage bands. It reports hit and TTK p50/p90/max, one-hit/5-plus/10-plus fractions, grade transitions, adjacent spikes, walls, armor raw/effective/prevented/minimum-damage fractions, upgrade levels, boss gaps, timed-event delays, and deterministic repeatability.
- [ ] Critical chance and armor penetration compare current asymptotic behavior against explicit alternative semantics; attack speed compares curves needed for useful progression across the elapsed-time stages. Production changes are selected only from measured evidence and retain input validation and safe-number behavior.
- [ ] Persistence impact is classified explicitly. Current and every supported historical save load, derive the accepted formulas, save, and reload without silent reset; any changed stored meaning requires a versioned migration, while formula-only derived changes retain schema compatibility.
- [ ] Focused tests prove exact-versus-fast-forward equivalence, elapsed-time stage boundaries, the 48-hour Endgame boundary, the retained Golden Bug encounter-2,000-plus reference, rejection of the 200-HP ordinary late-game fixture, ordinary/boss hit distributions, upgrade nonzero deltas and family pricing, reward accounting, candidate rejection, deterministic report equality, safe saturation, rollover, and bounded CPU runtime.
- [ ] Independent review, headless QA, save-compatibility verification, pnpm check, exact-SHA CI/Pages, and public deployed smoke pass with no unresolved P0-P2.
- [ ] Vault Enemy Tiers and Boss Cadence, Economy and Upgrade Curves, and Combat Loop are updated from planned candidates to the accepted elapsed-time formulas, fast-forward model, measured 48-hour Endgame receipt, retained Golden Bug reference, and upgrade economics before Manager closure.
- [ ] Effective automatic attack speed remains useful beyond the former approximately 3 APS ceiling and reaches at least 10 APS in the measured progression. Combat truth batches that throughput into at most approximately three visible attack ticks per second: each tick applies effectiveAPS divided by visualTickRate attack units as full attack packets plus at most one proportional fractional packet, so 3.3 APS at 3 Hz produces one full-damage packet plus 10 percent damage and 6 APS at 3 Hz produces two full-damage packets.
- [ ] Each full or fractional automatic attack packet resolves critical chance independently using the existing deterministic roll contract; the fractional packet scales its resolved attack damage by its fraction. Presentation may aggregate simultaneous damage numbers to avoid visual spam, but aggregation never changes domain damage, event order, rewards, armor, critical, Golden Bug, simulator, or save truth.
- [ ] The retained Golden Bug manual-click health calibration and ten-second behavior are re-measured at 10-plus effective automatic APS. The report must expose automatic-only and manual-plus-automatic outcomes and must not secretly cancel attack-speed upgrades by scaling Golden Bug health one-for-one with newly batched throughput.

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
