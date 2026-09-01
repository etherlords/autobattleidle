---
plannerFormat: 1
id: ABI-045
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-038
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-045 implementation-guide

## Frozen scope

- Lab-only research prototype; production `PlayerUnit`, combat formulas, persistence, and leaderboard remain unchanged.
- One representative 1000-level transition and a finite reusable detail palette.
- Compare cadence 100/200/250, then expose only the selected candidate in the lab.

## Implementation sequence

1. Add one pure bounded selector for minor detail state.
2. Reuse the existing `LabPlayerEvolution` construction/disposal path to attach the selected finite details.
3. Expose the representative milestone in the existing URL-addressable player lab controls and receipt.
4. Add one focused deterministic test for cadence boundaries, finite resource counts, reduced motion, and disposal.
5. Record GO/NO-GO. Only a GO may reopen ABI-038 for production implementation.

## Verification matrix

- Unit: 100/200/250 comparison and selected boundary/clamp behavior.
- Lab integration: representative levels, named details, sockets, finite bounds and resources, replacement disposal.
- Browser: desktop and narrow framing, orbit/front/side/top, reduced motion, immediate URL/receipt synchronization.
- Persistence: no schema change; visual state derives from level and production save code is untouched.
