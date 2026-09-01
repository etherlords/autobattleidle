---
plannerFormat: 1
id: ABI-028
artifact: brief
project: ABI
profile: high-assurance
revision: 13
status: Done
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-020
  - ABI-022
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-028: Distribute ordinary-enemy time-to-kill bands across every non-boss stage

## Goal

Distribute ordinary-enemy time-to-kill bands across every non-boss stage

## Work item

- Type: bug
- Priority: high
- Status: Done

## Acceptance criteria

- [ ] This task remains Blocked and unclaimed until ABI-020 records the explicit product decision for the verified 2100-second early-game auto-only TTK; its implementation must consume that decision and must not silently replace or bypass it.
- [ ] A deterministic headless audit reports manual-only, automatic-only, and combined time-to-kill distributions for ordinary enemies between bosses across representative early, mid, late, and long-run progression bands using real upgrade and modifier states.
- [ ] Within each audited non-boss stage band after one-shot kills become possible, the ordinary roster deliberately contains readable fast, medium, and durable encounters, including one-hit, several-hit, and approximately ten-hit experiences under the approved reference build rather than collapsing all ordinary enemies to one hit.
- [ ] Difficulty variety comes from centralized health/grade/family/modifier composition and deterministic encounter selection, not hidden per-render randomness, boss leakage, or compensating reward inflation; boss and Golden Bug identities remain separately balanced.
- [ ] The approved ABI-020 early-game automatic progression envelope remains satisfied, and no audited band introduces an unintended wall, infinite fight, reward dead zone, or regression in manual versus automatic usefulness.
- [ ] Focused tests freeze TTK band membership, deterministic encounter composition, boundary promotion, boss exclusion, Golden Bug exclusion, reward compatibility, historical-save continuity, and very large finite values.
- [ ] Independent balance review validates the model and decision trace; headless and browser QA prove representative stage sequences, upgrade transitions, long-run stability, desktop/narrow observability, and exact-SHA Pages behavior.

## Dependencies

- ABI-006
- ABI-020
- ABI-022

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7FD1F

## Constraints

- Follow the resolved workflow contract and project instructions.
