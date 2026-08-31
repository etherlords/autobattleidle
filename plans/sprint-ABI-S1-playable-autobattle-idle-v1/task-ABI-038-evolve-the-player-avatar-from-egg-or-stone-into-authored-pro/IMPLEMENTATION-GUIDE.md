---
plannerFormat: 1
id: ABI-038
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-020
  - ABI-023
  - ABI-026
  - ABI-037
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-038 implementation-guide

## Frozen scope

- A minimal approved sequence of deterministic visual forms derived from existing progression. No stats, inventory, cosmetics UI, or new currency.
- Depend on closed ABI-020 stage semantics and ABI-037 concept approval. Reuse PlayerUnit MVC and current battlefield/camera/effect ownership.
- Default persistence is no schema change; any exception requires a same-task versioned migration and fixtures before code delegation.

## Implementation sequence

1. Measure candidate milestone boundaries and prototype the minimum form sequence in the visual lab.
2. Record user/design approval for all-angle, idle, hit, and attack views and freeze named form recipes.
3. Add one pure derived form selector and player-local body/component factories with semantic sockets.
4. Synchronize form replacement only on identity change; implement bounded visual handoff and exact disposal.
5. Test milestone boundaries, current/historical reload, high APS, reduced motion, resize/boss camera, reset, and long-run resource stability.
6. Complete independent review/QA, Vault design update, `pnpm check`, exact-SHA deployment and Manager closure.

## Verification matrix

- **Unit:** form derivation around every boundary; finite identity at supported limits; no schema field; V1-V4 reload equivalence.
- **Integration:** PlayerUnit sync/replacement/events/sockets/disposal; unchanged combat stats/input/rewards/leaderboard; reset/reload and high APS.
- **Browser/deployed:** every approved form at representative stages, all angles, idle/attack/hit, transition, reduced motion, desktop/390px, no occlusion/resource leak, exact SHA.
