---
plannerFormat: 1
id: ABI-039
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-006
  - ABI-020
  - ABI-026
  - ABI-029
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-039 analysis

## Verified current state

- `spawnEnemy` selects every 35th encounter as a boss through `encounter % bossInterval === 0`. ABI-020 accepted current health targets and its measured report explicitly rejects a variable cadence candidate, so this follow-up must begin from the final closed report rather than overwrite active balance work.
- Family/profile selection is deterministic, but the user observed repeated Cinder Hydra-style bosses. ABI-029 will provide reusable family-affinity combinations; ABI-026/031 already provide semantic anchors, animation, camera reset, and disposal.
- The simulator already reports boss gaps, TTK, rewards, Golden Bug delays, exact/event-jump behavior, and long elapsed-time stages. Extending that same harness is safer than adding a second scheduler.
- Persistence impact is provisionally **no schema change** if boss schedule/identity is a stateless function of encounter and seedable existing inputs. Stateful anti-repeat history would require a V5 migration and is not the default.

## Approach

- Compare a small set of deterministic cadence-band functions with explicit min/max gaps against fixed 35. Seed variation from canonical encounter identity; do not use wall clock or render randomness.
- Compose boss family/profile/affinity through canonical registries with a bounded anti-repeat rule. Prefer stateless permutation/window selection so reload reconstructs the same boss without stored history.
- Extend ABI-020 exact and event-jump modes to report stage gaps, distribution, repeat streaks, TTK, time share, rewards, Golden interactions, and walls. Select only a candidate inside the accepted elapsed-time envelope.
- Keep boss health/reward/modifier formulas centralized and separate from ordinary/Golden identities. Presentation consumes resulting snapshot identity and reuses current boss camera/replacement lifecycle.

## Risks

- Cadence variation can invalidate ABI-020's 48-hour receipt and economy. Re-run the complete measured report and reject candidates that create walls, droughts, trivial streaks, or Golden schedule drift.
- Anti-repeat state can silently change after reload. Use a stateless schedule or explicitly migrate canonical history.
- More visual variety can mask identical gameplay or create unreadable modifier combinations. Require both measured stats and all-angle/browser proof.
- ABI-029 is blocked on ABI-020. This task stays Blocked until both contracts close; refresh dependencies and Vault evidence before claim.
