---
plannerFormat: 1
id: ABI-001
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies: []
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-001 implementation-guide

## Frozen scope

- ABI-001 only: replace the Vite scaffold with one playable application shell and the five Vault-prescribed module boundaries.
- Include composition, an immediately visible Three.js battlefield, DOM HUD/input surface, deterministic domain snapshot seam, a persistence boundary, resize handling, teardown, and focused lifecycle tests.
- Exclude combat balancing, encounter progression, upgrades, durable save schema, release QA, and all ABI-002+ work.
- Do not change Planner BRIEF metadata with the current MCP runtime or hand-edit lifecycle/status Markdown. Do not touch `.playwright-cli`.

## Implementation sequence

1. Create the smallest named module boundary in `src/domain`, `src/game`, `src/ui`, `src/persistence`, and `src/app`.
2. Compose them only from `src/main.ts`; start exactly one frame loop and wire a single resize listener.
3. Make teardown idempotent: cancel the frame, remove listeners, dispose Three.js-owned resources, and empty the application root.
4. Add focused Vitest proof for lifecycle/ownership; run `pnpm check`.
5. Record self-check evidence and hand off unchanged scope to independent review and QA.

## Verification matrix

- Architecture: imports preserve the five-module ownership split from AUTOBATTLEIDLE-DOC-20260827-D74E4E.
- Runtime: a built Vite page renders a battlefield/HUD and survives resize; teardown leaves no active listener or loop.
- Quality: focused tests plus `pnpm check` pass.
- Delivery: worker self-check, independent Reviewer, independent QA, manager verification and closure are separate Planner gates.
