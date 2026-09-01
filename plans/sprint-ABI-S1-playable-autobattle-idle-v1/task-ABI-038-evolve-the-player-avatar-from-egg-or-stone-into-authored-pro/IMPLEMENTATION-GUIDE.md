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
- Candidate stage starts are exactly `1`, `100`, `500`, `1,000`, `10,000`, and `36,365`; the last boundary is the measured 48-hour endgame checkpoint. Do not store form identity or add an evolution resource.
- Cap the candidate set at six forms and allow approval to merge adjacent early forms. Each retained form needs a different silhouette plus one semantic/animation change; palette-only tiers are rejected.
- Before approval, ownership is limited to ABI-037 lab recipes/cases/tests and Planner evidence. Production `src/game/units/player/**` remains untouched.

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

## Fresh preflight evidence

- Production fast-forward receipt: 0.25h -> encounter 15, 1h -> 53, 6h -> 3,535, 12h -> 8,225, 24h -> 17,605, 48h -> 36,365. The measurement used the production event-jump simulator and completed in 6.704 seconds.
- Player ownership: `PlayerUnitModel` owns snapshot identity, `PlayerUnitView` owns Three.js resources, and `ThreeBattlefield` owns attachment, camera, effects, and final disposal. Form replacement must stay inside the player product and occur only when derived stage identity changes.
- Required approval artifact: reproducible lab URLs for every candidate form, front/side/back/top and orbit inspection, idle/hit/attack playback, reduced-motion behavior, desktop/narrow framing, semantic socket overlays, and a resource-disposal receipt.
