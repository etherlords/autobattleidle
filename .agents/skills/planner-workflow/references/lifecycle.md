# Planner lifecycle reference

## Default route

`Manager -> implementation owner -> independent Reviewer -> independent QA -> Manager close`

Projects may use different state names, but the profile declares allowed
transitions and required gates.

## Authority

- YouTrack: identity, project, board/sprint membership, assignment, shared
  lifecycle, estimate, and configured organizational fields.
- Planner: detailed brief, analysis, implementation plan, progress events,
  evidence index, and local recovery state.
- Vault: durable architecture/decisions/guides and read-only work-record search
  projection.
- Git/runtime/test systems: code and executable evidence.

## Current MCP tools

- Core read: `planner_workflow_get`, `planner_get_current`,
  `planner_next_task`, `planner_tasks_list`, `planner_activity_list`,
  `planner_get_execution_context`, `planner_doctor`, and
  `planner_tracker_policy_get`, `planner_sync_status`.
- Core write: `planner_sprint_bootstrap`, `planner_task_create`,
  `planner_task_update`, `planner_execution_plan_update`, `planner_progress_append`, `planner_gate_record`,
  `planner_task_claim`, and `planner_task_advance`.

For routine resume of an already bootstrapped project, begin with
`planner_get_current`. Use `planner_workflow_get` only for current or explicitly
requested alternative-profile resolution, an explicit workflow request, or uncertainty/recovery
reported by `planner_get_current` or `planner_doctor`.

When the optional tracker tier is explicitly enabled, inspect `planner_sync_status`
and invoke bounded `planner_sync_once` only with authorization. Never use a timer,
retry an ambiguous intent, or manually edit `.planner/outbox`.
- Optional tracker tier: `planner_tracker_pull_plan`,
  `planner_tracker_push_plan`, `planner_tracker_apply`,
  `planner_tracker_recovery_get`, and `planner_tracker_recover`.

`planner_task_create` atomically adds a profile-valid task packet and board row;
`planner_task_update` atomically updates selected non-lifecycle metadata. Both
require idempotency and never contact YouTrack. `planner_debt_add` remains
unimplemented. Use `planner_tasks_list` for bounded task search and
`planner_activity_list` for canonical event history. Acquire/renew/release a
lease only with `planner_task_claim`, which records canonical `PROGRESS.md`
events under the local operation lock; never steal a live foreign claim. Record required gates with `planner_gate_record` and use
`planner_task_advance` for lifecycle and Manager-close transitions. Use the
canonical Markdown fallback only for an operation the surface does not expose,
after confirming no pending recovery, and update all projections explicitly.

## Managed execution plan

`PROGRESS.md` has a managed `Execution plan` section between `Current state`
and append-only `Events`. Bootstrap may supply initial steps; otherwise
initialize it explicitly, then use `planner_execution_plan_update` for every
step mutation. Markers are `[ ]` pending, `[~]` in progress, `[x]` complete,
and `[-]` cancelled. Only one step may be in progress; complete and cancelled
steps are terminal; every update records a summary and evidence. Current/list/
context reads return the bounded plan and event-derived claim/start/completion
attribution.

## Recovery

- Stale revision: reread and reconcile.
- Invalid transition or open dependency: do not bypass; return blocker.
- Partial local operation: stop mutations and run Planner doctor/recovery.
- Partial tracker operation: preserve operation report/outbox and resume only
  after identity revalidation.
- MCP unavailable: use direct packet files and record fallback.
