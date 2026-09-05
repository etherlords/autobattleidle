# Planner lifecycle reference

## Installation and worktree registration

1. Select one writable checkout (`in-repo`) or parallel code worktrees on one
   host (`external-repo`). Multi-host concurrent writers are not supported by
   this shared-files strategy. Monorepo project/search scope is a separate
   setting, not a reason to duplicate the canonical root.
2. Obtain a reviewed pinned Planner package or a built source checkout. A
   shared install under `workspace/.tools/` is sufficient; each MCP client runs
   its own process from those files. Do not add a broker or a daemon.
3. For external mode, use one existing canonical Git checkout outside all
   product worktrees, on its default branch. Give every consumer the same
   project ID/root and its own actual consumer path. Resolve paths rather than
   assuming a `../../` depth.
4. Run the package's `scripts/setup-project.mjs` with the required project,
   sprint, initial task and profile arguments; preview with `--dry-run` first.
   The local project ID is its namespace, not a YouTrack binding; the reviewed
   profile and identity map separately pin the remote project ID/short name.
   Inspect a pull plan before bootstrapping an empty tracker-owned project.
   For external mode add `--planner-data-root <canonical-root> --storage-mode
   external-repo`; otherwise use `--storage-mode in-repo`. Pass each checkout
   as `--project-root`. Setup prints its registration and bootstrap request;
   only an empty intended target may be bootstrapped, once, through MCP.
5. Existing config/skills are not replaceable boilerplate. If the MCP config
   conflicts, generate `--codex-config .codex/planner.generated.toml` and merge
   only the reviewed Planner block, retaining Vault and other servers. Merge
   the sidecar into the consumer's `.codex/config.toml` before preflight: Codex
   does not discover `planner.generated.toml` as its active config. Resolve
   skill differences explicitly; never overwrite `.agents` or `.codex` trees.
   Machine-specific config/install bindings and caches stay local; regenerate
   them for a new worktree instead of copying the main checkout's paths.
   Tracker-enabled setup uses `tool_timeout_sec = 180` (local-only: `30`);
   preserve that reviewed timeout when merging older tracker registrations.
6. Run `scripts/preflight-project.mjs --project-root <consumer>` from the main
   checkout and every worktree. Respect Codex project trust and restart the
   affected MCP clients after registration changes. In each actual session,
   verify tools, `planner_get_current` and `planner_doctor` identify the intended
   common root. A working direct SDK connection alone does not prove discovery.
7. Before parallel implementation, prove distinct tasks can progress and a
   competing claim/stale revision is rejected in disposable test tasks. Keep
   one Git checkpoint owner; per-file locks do not serialize the Git index.
   Pause operations for package upgrades, preserve customized skills/config,
   restart all clients and recheck roots and tool schemas before resuming.

For legacy adoption, inventory/map/import through `planner-migrate`; do not run
bootstrap once per worktree, move submodules, delete old plans, or turn history
into active work merely to make setup pass. Keep sources until acceptance and
report unresolved mappings or unavailable tools instead of direct file repair.

## Monorepo collections

Keep one registered canonical root per project inside the shared Planner
repository, for example `projects/CHD/plans/` and `projects/GE/plans/`.
Each root retains its own config, active sprint, backlog, identity map, tracker
profile, journals and locks. Code worktrees share these roots; they do not copy
them. The collection registry maps stable project IDs to reviewed relative
roots and contains no mutable current-project setting. Register roots through
the setup flow, never by editing live task configuration as a fallback.

For collection setup, provide a reviewed manifest outside managed roots using
`--project-collection <manifest.json>` together with `--planner-data-root`,
`--storage-mode external-repo` and the selected `--project-id` on the ordinary
setup command. Inspect `--dry-run` first. It registers the collection and emits
a routed bootstrap request, not task imports. Only bootstrap an empty intended
child; preflight identifies unbootstrapped children explicitly. Preserve existing
skills/config and use the same registry when registering further code worktrees.

Existing single-project installations need no registry or new arguments.
Existing flat `workspaceProject` task tags remain compatible but do not isolate
sprints or trackers. Moving those packets into isolated roots is a separately
reviewed migration with a complete source map, not a runtime upgrade side effect.
Project switching in the preview is navigation only; it never selects work or
changes an agent's context. Cross-project dependencies/hierarchy are not implied
by similar IDs or a shared repository; keep explicit coordination evidence when
the native lifecycle cannot express an external prerequisite.

## Default route

`Manager -> implementation owner -> independent Reviewer -> independent QA -> Manager close`

Projects may use different state names, but the profile declares allowed
transitions and required gates.

## Work-item types and hierarchy

Choose type by the outcome, not its size or priority:

| Type | Use for | Placement and parent |
| --- | --- | --- |
| `epic` | A larger outcome grouping independently deliverable slices | Sprint-independent backlog container; no parent; cannot be claimed or selected for execution |
| `story` | A user-visible or independently acceptable slice | May belong to a sprint or backlog; optional Epic parent |
| `task` | Bounded implementation, integration, or operational work | Optional Story or Epic parent |
| `bug` | A reproducible deviation from intended behavior | Optional Story or Epic parent; include regression acceptance |
| `incident` | An operational failure requiring investigation or recovery | Optional Story or Epic parent; preserve impact and recovery evidence |
| `research` | An investigation whose output is evidence, decisions, or answered questions | Optional Story or Epic parent; define the decision/review outcome |

Recommended planning flow:

1. Discover existing items with `planner_tasks_list` before creating wrappers or
   duplicates. Add an Epic only when a larger outcome benefits from grouping;
   a small fix or investigation may remain standalone.
2. Define Story acceptance, then split it into leaf work with bounded outcomes.
   Create parents before children with `planner_task_create`; read workspace
   revisions before each write and set `parentId` explicitly. Direct work under
   an Epic is valid when a Story adds no useful acceptance boundary.
3. Keep unscheduled work in the project backlog. Allocate only intended sprint
   work through `planner_backlog_allocate`; never allocate an Epic. A Story is
   claimable, unlike an Epic: do not mark a grouping-only Story Ready until its
   own acceptance/integration work is intended for execution.
4. Keep containment separate from `dependsOn`. Children do not automatically
   wait for a parent, nor does completing children automatically close it.
   Add only genuine execution prerequisites; never create a parent/child
   dependency cycle. Select executable work through `planner_next_task`.
5. Use `planner_task_update` for an intentional local `parentId` correction,
   with exact revision and readback. Type is immutable through this update;
   do not rewrite a packet or create a replacement just to relabel it.

Types do not waive the resolved workflow gates. Research acceptance should
check sources, conclusions, requested user answers, and their documented
analysis, not fabricate runtime QA for a document. If a profile demands an
inapplicable gate, report the mismatch and resolve it explicitly rather than
silently skipping it. Review remains meaningful for research and planning.

The UI shows distinct type badges, parent links, and unique descendant counts.
Its step rollup is `(completed + cancelled) / total`, with cancelled steps
reported separately; it is not a lifecycle verdict. `No steps planned` is not
100% completion. Complexity has no canonical estimate field yet: do not derive
an average from priority, number of steps, or type. Bounded hierarchy previews
may be incomplete; use native reads before making execution decisions.

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
  `planner_workspace_get`, `planner_tracker_policy_get`, `planner_sync_status`.
- Core write: `planner_sprint_bootstrap`, `planner_sprint_create`,
  `planner_sprint_update`, `planner_historical_enrich`, `planner_backlog_allocate`, `planner_task_create`,
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
  Selected event delivery uses `planner_sync_comments`; missing future sprint
  creation uses `planner_tracker_sprint_sync_plan`,
  `planner_tracker_sprint_sync_apply`, `planner_tracker_sprint_sync_recovery_get`
  and `planner_tracker_sprint_sync_recover`. Inspect current schemas rather
  than guessing parameters or inferring permission from tool availability.

`planner_task_create` atomically adds a profile-valid task packet and board row;
`planner_task_update` atomically updates selected non-lifecycle metadata. Both
require idempotency and never contact YouTrack. `planner_debt_add` remains
unimplemented. Use `planner_tasks_list` for bounded task search and
`planner_activity_list` for canonical event history. Acquire/renew/release a
lease only with `planner_task_claim`, which records canonical `PROGRESS.md`
events under the local operation lock; never steal a live foreign claim. Record required gates with `planner_gate_record` and use
`planner_task_advance` for lifecycle and Manager-close transitions. If an
operation is absent from the surface, report it and follow the consumer root's
`planner_and_vault_rules.md`; do not use canonical Markdown as an autonomous
fallback.

## Managed execution plan

`PROGRESS.md` has a managed `Execution plan` section between `Current state`
and append-only `Events`. Bootstrap may supply initial steps; otherwise
initialize it explicitly, then use `planner_execution_plan_update` for every
step mutation. Markers are `[ ]` pending, `[~]` in progress, `[x]` complete,
and `[-]` cancelled. Only one step may be in progress; complete and cancelled
steps are terminal; every update records a summary and evidence. Current/list/
context reads return the bounded plan and event-derived claim/start/completion
attribution.

Use the revision belonging to the operation, not the most visible number:
`planner_progress_append`, `planner_execution_plan_update`, `planner_task_claim`,
and `planner_gate_record` require `progress.revision`; task metadata/lifecycle
operations require the task revision. Read the current schema and native
readback before writing. A stale conflict means reread and reconcile, not
retry the same expected revision or reuse another actor's checkpoint.

Independent review, QA and manager-closure gates must use genuinely separate
actors from prior passing gates. A manager who recorded self-check or
verification must delegate final closure to an independent checker; changing
the same actor's name does not provide independence.

## Recovery

- Stale revision: reread and reconcile.
- Invalid transition or open dependency: do not bypass; return blocker.
- Partial local operation: stop mutations and run Planner doctor/recovery.
- Partial tracker operation: preserve operation report/outbox and resume only
  after identity revalidation.
- MCP unavailable: preserve the tool failure report and request the user's
  explicit path-scoped authorization before any exceptional direct access.
