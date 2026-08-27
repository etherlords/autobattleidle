---
plannerFormat: 1
id: ABI-001
artifact: analysis
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

# ABI-001 analysis

## Verified current state

- ABI-000 is Done and the selected task is dependency-ready under the manager-root lease.
- The application is a Vite scaffold: `src/main.ts` only validates `#app`; `src/style.css` contains baseline layout. No domain, game, UI, persistence, or composition modules exist yet.
- Vault architecture requires deterministic `src/domain`, Three.js-only `src/game`, DOM-only `src/ui`, validated persistence in `src/persistence`, and orchestration in `src/app`.
- Tooling already contains Vite, TypeScript, Three.js, Vitest, ESLint, and Prettier; no dependency is needed for this shell.
- Planner doctor is healthy with no recovery required. BRIEF has known duplicated acceptance/dependency/knowledge lines from the Planner section-regex defect; its lifecycle and metadata are not manually repaired in this task.

## Approach

- Delegate the smallest real shell: a composition root creates isolated domain/game/UI/persistence boundaries, starts one render loop, handles resize, and exposes deterministic teardown.
- Add focused tests for the app lifecycle and the smallest pure boundary needed to prove ownership/disposal. Keep gameplay rules, progression, economy, and full persistence behavior for their dependency tasks.
- Record the two Planner pilot receipts in task evidence: `285daec` fixes Done-dependency masking under a foreign lease; `74fb996` supplies claim `progressRevision`. The current MCP still requires `planner_tasks_list` readback for that revision.

## Risks

- Three.js lifecycle must dispose renderer/scene resources and unregister the resize handler without starting a second loop.
- Browser APIs must stay at game/UI/persistence boundaries; domain remains deterministic and import-safe.
- The initial scaffold has no analogue modules, so the implementation owner must keep the new surface minimal and run `pnpm check` before handoff.
