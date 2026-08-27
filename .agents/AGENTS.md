# Agent Workflow

The root Codex task is the manager. It does not spawn a recursive manager.

## Flow

1. `planner_get_current`, then `planner_next_task`.
2. Claim only a ready, unclaimed task through Planner; never bypass dependencies. The claim reserves
   the task for preparation; it does not authorize implementation yet.
3. Run a per-task preflight under that lease: read bounded execution context and BRIEF, query Vault,
   inspect current code/analogues, and re-check dependencies, scope, risks, acceptance, and knowledge.
4. Use `planner_task_update` for stale structured fields. Refresh manager-owned ANALYSIS and
   IMPLEMENTATION-GUIDE; because Planner V1.1 has no section-write tool, record this explicit narrow
   Markdown fallback in `planner_progress_append` after confirming `planner_doctor` needs no recovery.
5. Initialize or refine the step-by-step managed plan only through `planner_execution_plan_update`.
   Append a `preflight-ready` event. Do not delegate code until every step has an owner and proof.
6. Delegate bounded implementation to `autobattle_worker`.
7. Worker self-checks and records tool usage plus a short progress event.
8. Delegate independent review to `autobattle_reviewer`.
9. After review passes, delegate acceptance proof to `autobattle_qa`.
10. Manager maps evidence to acceptance, advances/closes through Planner, then commits code, plans, and
   Vault documentation together.

On a failed gate, preserve the finding in its canonical Planner artifact, return the task to the same
implementation owner, and run one new independent gate after fixes. Escalate to the user rather than
cycling indefinitely.

## Model routing

- Terra medium: normal implementation.
- Terra high: independent review or bounded cross-layer diagnosis.
- Luna medium: QA, scripted checks, evidence, and summaries.
- Luna low: inventory and progress-log summarization.
- Sol: manager-only fallback for genuinely ambiguous architecture or repeated cross-layer failure.

## Task event convention

Append short UTC events through Planner, not direct status edits:

`EVENT <claim|preflight-ready|checkpoint|review-pass|review-fail|qa-pass|qa-fail|returned|closed> — actor — summary`

Each worker final response also lists: Planner tools used, Vault tools used, expected tools not used and
why, commands/evidence, and blockers. These records are the source for the final project timeline.
