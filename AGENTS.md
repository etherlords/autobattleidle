# Autobattle Idle Agent Rules

This repository dogfoods Etherlords Planner and Vault. Read `.agents/AGENTS.md`, the active Planner
task packet, and relevant Vault articles before non-trivial work.

## Canonical state

- Code, `plans/`, and `.docs/knowledge/` live in this one Git repository and are checkpointed together.
- Planner is the only writable task-state interface. Never hand-edit lifecycle/status fields.
- Vault is the canonical design source. Use Vault tools for article and link mutations.
- Planner and Vault never commit or push. The root manager owns coherent Git checkpoints after gates.

## Quality

- TypeScript strict; no `any`, unsafe assertions, ignored errors, or duplicated state owners.
- Keep deterministic simulation in `src/domain`, Three.js in `src/game`, DOM in `src/ui`, persistence
  in `src/persistence`, and composition in `src/app`.
- Prefer named types and small responsibility-based modules. No giant object literals or speculative
  factories/builders; use a builder only when construction has real invariants or repeated steps.
- Every behavior change has a focused test. Run `pnpm check` before handoff.

## Delivery

The required lifecycle is `implement -> independent review -> independent QA -> manager close`.
Before implementation, the manager must claim/reserve the task and complete a fresh task preflight:
current BRIEF, Vault/code evidence, ANALYSIS, implementation guide, and managed step-by-step plan.
Failed review or QA returns concrete findings to the implementation owner, followed by one fresh gate
run; do not create an unbounded loop. Record concise high-level events in task `PROGRESS.md`; detailed
evidence belongs in `REVIEW.md`, `QA.md`, and `VERIFICATION.md`.

Do not mutate dependencies, Git history, Planner state, or Vault content outside the delegated scope.
