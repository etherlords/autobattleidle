---
plannerFormat: 1
id: ABI-002
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-001
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-002 analysis

## Verified current state

- ABI-001 is Done at task revision 12; `origin/main` is `b335eda` and contains that commit.
- ABI-002 is Ready, dependency-ready, and has no foreign lease. The manager lease was acquired at progress revision 1.
- The application shell currently owns a static `BattleSnapshot`; no combat state owner exists yet.
- Vault `AUTOBATTLEIDLE-DOC-20260827-584401` is authoritative for the shared attack path, damage, critical, armor, death, reward, and encounter transition rules.
- Related Vault rules require deterministic encounter grades, integer non-negative coins, 2x critical damage, bounded armor damage of at least one, and exactly-once rewards.
- Vault semantic runtime is configured for Vulkan adapter 0. The first ABI-002 hybrid call proved RTX 5060 Ti GPU offload with 25 GPU layers; CPU/auto fallback was not used.

## Approach

- Add the smallest pure domain simulation owner and centralized balance constants under `src/domain`.
- Route manual and scheduled automatic attacks through one exported attack command, with the attack source affecting only automatic-slow eligibility.
- Make randomness explicit input so critical and double-reward outcomes remain deterministic and testable.
- Spawn the next encounter in the same death transition and make stale/repeated attack attempts unable to grant the defeated enemy reward twice.
- Cover formulas, manual/automatic parity, grade advancement, and exactly-once reward behavior with focused Vitest tests; run `pnpm check`.

## Risks

- Scope creep into UI scheduling, persistence, purchases, or visual enemy presentation would overlap ABI-003+ and is prohibited.
- Ambiguous balance constants could become accidental product promises; keep them centralized, simple, and deterministic without claiming final tuning.
- Reward duplication is the material state risk; the command must transition atomically from live enemy to next encounter.
- `planner_next_task` returned no actionable task despite canonical dependency-ready state. Claim used the exact bounded task-list progress revision after healthy doctor; this runtime fallback must remain visible in evidence.
