---
name: planner-workflow
description: Set up Planner for a single checkout or parallel code worktrees, then inspect, bootstrap, and maintain task packets through MCP. Use for project adoption, sprint planning, dependencies, claims, gates, evidence, or explicit YouTrack reconciliation.
---

# Planner Workflow

Use Planner for work items and their planning hierarchy. Use Vault for durable knowledge and RepoMapper
for code symbols.

## Choose work-item types before planning

Before creating or decomposing work, read
[work-item types and hierarchy](references/lifecycle.md#work-item-types-and-hierarchy).
Use `epic` for a larger outcome, `story` for an independently acceptable slice,
and `task`, `bug`, `incident`, or `research` for the actual work. Small standalone
work needs no artificial Epic/Story wrapper. Containment uses `parentId`;
execution ordering uses `dependsOn`, not the hierarchy or card position.

## Setup or change storage topology

For an installation request (including a repository URL), read
[references/lifecycle.md](references/lifecycle.md#installation-and-worktree-registration)
before writing configuration. Resolve the reviewed package/version, consumer
checkout, and canonical data roots; a repository URL is not a runtime path.
Use `in-repo` for one writable checkout or `external-repo` for concurrent code
worktrees on one host. Do not silently convert existing storage.

Shared worktrees use one pinned package installation, one canonical Planner
repository, and a separate discoverable `.codex/config.toml` in every checkout.
Each client starts its own stdio process; no broker/service is required. Verify
MCP discovery from each actual worktree CWD. For legacy data, use
`planner-migrate` after registration; setup does not migrate or re-bootstrap an
existing canonical root. If Vault is also installed, preserve both MCP blocks
and follow `vault-use` for its separate data/config/cache binding.

## Start or resume work

### Monorepo project context

For a configured project collection, begin with `planner_workspace_get` to
discover registered project IDs. Select the project from the user's request or
an exact task identity, not from the current directory, a title, or a UI tab.
Pass `projectId` to current/next, creation, sprint and tracker operations.
An exact task ID may infer its project only when it is unique in the collection;
otherwise supply both IDs. Confirm returned project identity before any write.
No global "selected project" is shared between agents or browser tabs.

Use the returned project context throughout the task and keep it in the task
handoff: project ID, canonical task ID, current revision/lease, and intended
Vault knowledge projects. Use the same stable project key for the corresponding
Vault context; shared engine knowledge can be included through its configured
knowledge mapping. Broaden to another context or all projects deliberately,
then verify each article's actual owner and authority before applying findings.
Do not create a second context document merely to duplicate the task packet.

If a project cannot be determined unambiguously, stop selection/mutation and
ask the user directly. A suggested ID is not a resolved identity: use bounded
`planner_tasks_list` discovery, select the canonical ID, and reread its revision.
Never auto-correct an ID and retry a write. `workspaceProject` on legacy flat
plans is a task filter, not a replacement for isolated collection `projectId`.

1. Confirm the returned `projectId`, canonical Planner root, storage mode, and
   sprint before selecting or mutating work. All
   worktrees of that project share one root; another project must have another
   `projectId` and root. `in-repo` and `submodule` modes are single-writer
   modes; concurrent worktrees require the one `external-repo` root configured
   by setup. Do not use a Planner instance bound to another project or a
   writable plan copy inside a product-code worktree.
2. If Planner MCP tools are exposed, call `planner_get_current` for bounded
   current state. Use `planner_doctor` only when health or recovery must be
   diagnosed.
   For a routine resume of an already bootstrapped project, do not call
   `planner_workflow_get` first.
3. Use `planner_next_task` to select dependency-ready work, then call
   `planner_task_claim` to acquire a revision-checked agent/session lease before
   implementation. If the task is claimed by another live session, blocked, or
   has an incomplete dependency, select other work or stop; never bypass it.
   Do not infer order from filenames or table position. A current `Planned`
   sprint may be preplanned and populated, but it must be promoted to `Active`
   before next-task selection or claim acquisition.
4. Use `planner_tasks_list` for bounded exact/filter/full-text discovery and
   `planner_activity_list` for append-only evidence history. Use
   `planner_workspace_get` before task creation, sprint allocation, or sprint
   status changes when the current sprint or backlog revision is needed.
5. Call `planner_get_execution_context` for bounded task artifacts and deeper
   read handles instead of scanning the whole packet.
   It is read-only: native Planner does not yet expose writes for task-local
   `ANALYSIS.md` or `IMPLEMENTATION-GUIDE.md`. Put durable design material in
   Vault; for required task-data changes with no native tool, report the
   capability gap and follow `planner_and_vault_rules.md` rather than editing
   task files autonomously.
6. Use Vault to resolve architecture and previous incidents before designing a
   solution. Cite Vault evidence with stable headings or the portable `#L21`,
   `#L21-L25`, and `#L21C5-L23C12` locator forms; include `contentHash` for
   revision-bound line evidence.
7. Initialize the managed execution plan with `planner_execution_plan_update`,
   add concrete steps, and move exactly one step through pending, in-progress,
   complete, or cancelled. Read the bounded plan and attribution from current,
   list, or execution-context results; do not edit the checklist manually.
   Record broader evidence checkpoints through `planner_progress_append`; renew
   the lease while active and release it for handoff.
8. Record required verdicts through `planner_gate_record`, then change lifecycle
   state through `planner_task_advance`. These tools enforce the active profile,
   dependencies, gates, expected revisions, and atomic projections. Reopen a
   completed task with the explicit `Done -> Ready` transition instead of
   creating a replacement task. Reopening preserves history but starts a fresh
   attribution and gate cycle, so old review/QA evidence cannot close new work.
9. Use `planner_sprint_create` for a missing non-current `Planned`,
   `Completed`, or `Archived` local sprint after `planner_workspace_get` returns
   the exact active-board revision. It never creates `Active`, replaces an
   existing packet, or calls YouTrack. For a `Completed` or `Archived` sprint it
   may atomically add bounded `historicalTasks`: terminal `Done` records
   with required source locator, SHA-256, original-status provenance,
   and an explicit `source.terminalDone: true` acknowledgement of the approved
   mapping to Done. A historical sprint alone does not establish task completion.
   For rich sources, follow `planner-migrate` and use source-backed
   `historicalContent` when exposed by the installed schema; sparse imports
   remain `brief-only`. `planner_historical_enrich` can enrich an existing
   sparse historical record under exact revision/hash preconditions. Imported
   artifacts and steps are historical evidence, never fresh gates, leases or
   execution events. The internal `historical` profile cannot be selected for
   ordinary bootstrap or live task creation. Use `planner_task_create`
   for a new profile-valid task packet and `planner_task_update` for selected metadata changes and `planner_sprint_update`
   for revision-checked sprint status/current-sprint changes; do not rewrite config,
   BRIEF, or board files manually. Update cannot alter ID/type/status and fails
   while another agent holds a live claim.
   Use `planner_backlog_allocate` to place dependent backlog packets on a sprint
   board during preplanning; incomplete dependencies keep them in `Backlog`.

## Maintenance is not a workflow fallback

`planner_maintenance_plan` / `planner_maintenance_apply`, when installed, are
for explicitly authorized historical migration repair only. Never select them
because a task is blocked, a claim belongs to another agent, a gate failed, or
an ordinary update was refused. Do not enable maintenance policy yourself to
get past a rejection. Continue through normal lifecycle/recovery tools or report
the blocker. For an actual migration correction request, read `planner-migrate`
and verify the exact supported operation and project policy first. Imported
review/QA text is evidence about the past, not a current PASS gate.

## Git checkpoint cadence

- Before shared writes, the designated manager fetches/pulls and reconciles the
  selected canonical Planner repository. `planner_doctor` reports only local
  cached ahead/behind information; it never proves that the remote is current.
- After bootstrap, migration, or a coherent batch of task-state changes, run
  `planner_doctor` and the relevant tests. The manager reviews and commits the
  canonical Planner Markdown as one checkpoint.
- Before handoff or context switch, push that checkpoint when another machine,
  agent, or session needs it. Do not call an unpublished local commit shared.
- Planner MCP tools never fetch, pull, stage, commit, or push. Git operations
  remain explicit human/manager-owned steps; claims and revisions remain the
  concurrency controls.

## Bootstrap and close

- Validate versioned sprint/task JSON before `planner_sprint_bootstrap`.
- Persist acceptance criteria, dependencies, owners, risks, gates, and debt.
- Record implementation self-check, independent review, independent QA, and
  Manager closure as separate gates.
- Never mark `Done` while a required gate is pending/failed/blocked.

## YouTrack

Treat synchronization as reconciliation: diff, pull/push plan, inspect exact
targets, then separately authorized apply. Never use timestamp-based
last-write-wins or silently overwrite local analysis/remote organizational
fields. It is optional: if `planner_tracker_policy_get` returns disabled, work
locally and do not request credentials. For an empty local root, inspect a
fresh pull plan before bootstrap. For an existing root, pull can reconcile only
the profile-owned status after revision, dependency, and lifecycle checks;
title, type, priority, dependencies, and acceptance criteria stay local. A
local+remote edit or an old fingerprint baseline is a conflict. Never manually
edit the identity map.
`planner_sync_once` is one explicit outbox delivery pass, never a background
daemon. `planner_sync_comments` separately previews and explicitly delivers
selected progress/Review/QA events. Inspect its returned delivery evidence;
never retry an ambiguous POST blindly. No background sync is implied.

Pull supports exact sprint selection, project history (explicit archived
selection), and unsprinted backlog. Backlog push requires explicit local IDs
and never assigns a sprint. Use the four `planner_tracker_sprint_sync_*` tools
to plan/apply/inspect/recover creation of a missing local `Planned` sprint on an
already configured remote board. Existing bindings use IDs, not title guesses.
Historical sprints are pull-only for this adapter. Projects/boards, attachments,
worklogs, remote deletion and reparenting are not supported by this slice.

Generic topology provisioning is not part of ordinary task sync. The CLI can
produce a credential-free reviewed topology plan and explicitly apply selected
creation phases with an exact token and recovery directory. It is not a live
MCP operation; do not infer permission to provision a project or board. The
narrow native missing-sprint adapter above is separate from that CLI flow.

## Availability and fallback

The core MCP surface is `planner_workflow_get`, `planner_sprint_bootstrap`, `planner_sprint_create`, `planner_sprint_update`,
`planner_get_current`, `planner_next_task`, `planner_tasks_list`, `planner_workspace_get`,
`planner_activity_list`, `planner_get_execution_context`, `planner_historical_enrich`,
`planner_maintenance_plan`, `planner_maintenance_apply`, `planner_task_create`,
`planner_task_update`, `planner_task_claim`, `planner_execution_plan_update`, `planner_progress_append`,
`planner_gate_record`, `planner_task_advance`, `planner_doctor`,
`planner_tracker_policy_get`, and `planner_sync_status`. `planner_sync_once` and
the explicit sync/comment/sprint tracker tools are exposed only when the
project explicitly enables the extended tracker tier.

Maintenance apply is rejected unless `maintenance.historicalRepair` is enabled
by separately authorized policy. Tool availability does not authorize its use
or a policy change; the maintenance restrictions above still apply.

Use `planner_workflow_get` only to resolve the current workflow or an explicitly
requested alternative profile during bootstrap/planning, when the user
explicitly asks for workflow details, or when
`planner_get_current`/`planner_doctor` reports uncertainty or recovery. It is
not the routine-resume entry point for a bootstrapped project.

If MCP is unavailable or the required operation is not exposed, report the
tool failure and follow the consumer root's `planner_and_vault_rules.md`.
Do not read or edit canonical Planner files as an autonomous fallback. Never
invent a tool name or pretend a nonexistent call succeeded.

Read [references/lifecycle.md](references/lifecycle.md) for lifecycle, authority,
and recovery rules.

Use the separately installed `planner-migrate` skill when adopting legacy task
files. Migration is never part of routine resume or lifecycle advancement.
