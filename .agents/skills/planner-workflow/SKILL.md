---
name: planner-workflow
description: Inspect, bootstrap, validate, and record progress for local sprints and task packets through Planner MCP or its Markdown fallback. Use for sprint creation, current progress, next actionable work, dependencies, blockers, review/QA gates, evidence, handoffs, or explicit YouTrack reconciliation.
---

# Planner Workflow

Use Planner for executable work. Use Vault for durable knowledge and RepoMapper
for code symbols.

## Start or resume work

1. Confirm the returned `projectId`, canonical Planner root, storage mode, and
   sprint before selecting or mutating work. Read the consumer project's
   `.planner/planner-install.json` when setup provenance is needed. All
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
   Do not infer order from filenames or table position.
4. Use `planner_tasks_list` for bounded exact/filter/full-text discovery and
   `planner_activity_list` for append-only evidence history.
5. Call `planner_get_execution_context` for bounded task artifacts and deeper
   read handles instead of scanning the whole packet.
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
   dependencies, gates, expected revisions, and atomic projections.
9. Use `planner_task_create` for a new profile-valid task packet and
   `planner_task_update` for selected metadata changes; do not rewrite config,
   BRIEF, or board files manually. Update cannot alter ID/type/status and fails
   while another agent holds a live claim.

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
daemon. This release does not create remote boards/sprints/projects, comments,
attachments, worklogs, or delete remote records.

Generic topology provisioning is not part of ordinary task sync. The CLI can
produce a credential-free reviewed topology plan. Its apply core is still an
offline/fake-transport checkpoint and is not exposed as a live MCP operation;
do not infer permission to create a project, field, board, or sprint.

## Availability and fallback

The core MCP surface is `planner_workflow_get`, `planner_sprint_bootstrap`,
`planner_get_current`, `planner_next_task`, `planner_tasks_list`,
`planner_activity_list`, `planner_get_execution_context`, `planner_task_create`,
`planner_task_update`, `planner_task_claim`, `planner_execution_plan_update`, `planner_progress_append`,
`planner_gate_record`, `planner_task_advance`, `planner_doctor`,
`planner_tracker_policy_get`, and `planner_sync_status`. `planner_sync_once` and
five tracker tools are exposed only when the
project explicitly enables the extended tracker tier.

Use `planner_workflow_get` only to resolve the current workflow or an explicitly
requested alternative profile during bootstrap/planning, when the user
explicitly asks for workflow details, or when
`planner_get_current`/`planner_doctor` reports uncertainty or recovery. It is
not the routine-resume entry point for a bootstrapped project.

If MCP is unavailable, or the required operation is not exposed and doctor
reports no pending recovery,
read `SPRINT-BOARD.md` and the active task's `BRIEF.md`, `ANALYSIS.md`, and
`PROGRESS.md`, make the narrow canonical Markdown change, update its required
projections, and state that fallback was used. Never invent a tool name or
pretend a nonexistent call succeeded.

Read [references/lifecycle.md](references/lifecycle.md) for lifecycle, authority,
and recovery rules.

Use the separately installed `planner-migrate` skill when adopting legacy task
files. Migration is never part of routine resume or lifecycle advancement.
