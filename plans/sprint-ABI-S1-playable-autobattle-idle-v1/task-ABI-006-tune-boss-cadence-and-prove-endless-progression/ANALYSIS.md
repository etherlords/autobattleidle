---
plannerFormat: 1
id: ABI-006
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-003
  - ABI-004
  - ABI-005
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-006 analysis

## Verified current state

- Planner readback: ABI-006 is Ready at task revision 2, unclaimed, with ABI-003/004/005 satisfied. The preserved ten-step managed plan is still pending.
- BRIEF normalization fallback removed only duplicated structured values from commit `7733ca5`; Planner doctor is healthy with no recovery journal and bounded readback now shows 8 acceptance criteria, 3 dependencies, and 3 Vault IDs.
- Vault `A7FD1F` requires an infinite formula-driven boss cadence targeting about ten unattended minutes to the first boss and roughly one additional minute per later boss. Vault `A798F2` requires only the automatic unlock to be finite, with repeatable diminishing upgrades and explicit supported numeric limits. Vault `584401` keeps one deterministic attack/reward transition owner and minimum hit damage.
- `src/domain/combat.ts` currently owns all formulas, but uses linear enemy health, finite upgrade caps, geometric costs, no penetration stat, and a ten-encounter boss cadence. Runtime, persistence, snapshots, HUD, and tests consume these contracts directly; the battlefield only renders immutable snapshots and needs no balance ownership.
- Persistence V1 validates the old finite player bounds and exact keys, so adding penetration/endless levels requires a compatible versioned boundary or an explicit safe reset path with regression proof.

## Approach

- Keep deterministic formulas and simulator in `src/domain`; both runtime and simulator must call the same exported functions/constants. Do not duplicate a balance model in UI or tests.
- Add armor penetration as a repeatable upgrade and player field. Apply one bounded effective-armor formula before `Math.max(1, ...)`, preserving critical ordering and minimum damage.
- Replace terminal caps with finite monotonic cost/effect formulas over a documented safe integer level range. Probability and speed effects approach ceilings without reaching unsafe values.
- Build one finite deterministic reference simulator with fixed rolls and a simple declared purchase strategy. Report elapsed time, purchases, attacks, mitigation/penetration, coins, encounters, and at least three bosses; use measurements to tune rather than hard-coded report fixtures.
- Keep application composition, persistence, snapshots, HUD, and battlefield changes limited to consuming the expanded domain contract. ABI-007+ presentation/content work is excluded.

## Risks

- JavaScript exponentiation can reach Infinity; every public cost/enemy/reward/effect formula needs an explicit safe domain and finite result.
- A simulator that reimplements attacks, rewards, or upgrades can pass while runtime differs; parity must be structural and reviewed.
- Persisted V1 state can become invalid when exact player keys change; migration/reset behavior must preserve safe recovery and never accept malformed values.
- Ten minutes is a measured reference envelope, not a wall-clock test. Unit proof covers formulas/determinism; integration proof covers runtime purchases, persistence, and snapshots; deployed QA must exercise real-browser upgrades, armor damage, and several bosses using bounded deterministic acceleration without changing production outcomes.
