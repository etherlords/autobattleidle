---
plannerFormat: 1
id: ABI-039
artifact: implementation_guide
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

# ABI-039 implementation-guide

## Frozen scope

- Deterministic varied boss timing and identity only after ABI-020 and ABI-029 close. Preserve Golden Bug rules, ordinary selection, current boss camera, and centralized balance ownership.
- Prefer a stateless seeded schedule with explicit min/max gaps and bounded anti-repeat. No wall-clock randomness, backend, unbounded history, or duplicate simulator.

## Implementation sequence

1. Refresh the final ABI-020 report and baseline fixed-35 cadence/repetition across all elapsed-time stages.
2. Define two or three bounded deterministic cadence/identity candidates and their persistence/rollback behavior.
3. Extend the production-path exact/event-jump simulator with gap, distribution, streak, TTK, reward, Golden interaction, and wall metrics.
4. Select one measured candidate; implement it at the centralized encounter/registry owners and reuse existing boss presentation lifecycle.
5. Add boundary, seed/reload, anti-repeat, long-run, exact-equivalence, save, camera-reset, and resource tests.
6. Complete independent review/QA, Vault formula update, `pnpm check`, exact-SHA multi-boss deployment proof, and Manager closure.

## Verification matrix

- **Unit:** min/max gap boundaries; deterministic seed/reload; anti-repeat; family/affinity distribution; Golden separation; finite long-run schedule.
- **Integration:** exact/event-jump equality; ABI-020 stage envelope/economy; current and historical save classification; ordinary selection unchanged; boss replacement/camera/disposal.
- **Browser/deployed:** representative varied bosses without immediate repetition, correct camera reset and semantic effects, desktop/390px, clean resources/console, exact SHA and published measured report.
