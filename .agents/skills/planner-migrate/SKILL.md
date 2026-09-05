---
name: planner-migrate
description: Plan and perform a reversible semantic migration from legacy local sprint, task, backlog, incident, or handoff files into canonical Planner packets. Use for adopting an existing project, not for routine task execution.
---

# Planner Migration

Migrate meaning, not filenames. First inventory the source read-only and produce
a mapping plan. Separate active executable work from historical evidence and
durable knowledge before creating anything.

Read [semantic packet conversion](references/migration.md#semantic-packet-conversion)
before importing legacy sprints. A source-linked card is an inventory stub, not
a completed migration when the source contains plans, steps, or review reports.
Use an agent to interpret each sprint/task/document; scripts may inventory,
hash, validate and apply reviewed payloads, but must not decide meaning from
filenames or globally replace source structure.

For a new installation or a topology change, first use the installed
`planner-workflow` skill's installation/worktree registration route. Migration
uses that selected topology: one in-repo writable checkout, or one shared
external canonical root with per-worktree MCP registrations. Verify every
consumer's actual tools and roots before importing; copying a main checkout's
config or bootstrapping each worktree is not registration.

## Required route

1. Confirm the exact source root, target Planner project/root, workflow profile,
   storage mode, and whether YouTrack reconciliation is enabled. Inspect the
   consumer `.planner/planner-install.json`: concurrent worktrees require its
   one configured `external-repo` root, never separate writable packet copies.
   Never infer a live tracker target or mutate YouTrack during migration
   planning.
2. Before any write, complete a per-source inventory: full content and
   structure, missing metadata, link graph, classification, ownership, and
   split/merge evidence. Classify every candidate as active task, backlog
   candidate, incident, historical work record, durable Vault knowledge,
   duplicate, or out of scope. A document that contains executable work is not
   durable knowledge by default: route its active/future work to Planner or
   backlog, and retain completed material as history.
3. Apply the installed Planner
   [work-item type and hierarchy rules](../planner-workflow/references/lifecycle.md#work-item-types-and-hierarchy).
   Present IDs, explicit type mappings, `parentId` containment separately from
   dependencies, acceptance criteria, target profile/artifacts,
   unresolved fields, and proposed source disposition as a dry-run mapping.
   Do not convert every legacy Feature into an Epic or every document into a
   Research task. Preserve the original type and mapping rationale; unresolved
   mappings remain conflicts. Include required parents in the approved import
   selection, since the tracker does not import missing parents implicitly.
4. After approval, bootstrap only an empty intended project through
   `planner_sprint_bootstrap`. In an existing project use `planner_sprint_create`
   for a missing Planned, Completed or Archived sprint without changing the
   active sprint. A Completed or Archived create may atomically include bounded
   local-only `historicalTasks` with source locator/hash, original-status
   provenance, and an explicit `source.terminalDone: true` acknowledgement of
   the reviewed terminal mapping. The sprint's completion does not establish
   each task's state: reconcile conflicting plan/progress/report/remote states
   first and leave unresolved tasks unaccepted.
   Discover the installed schema, not only candidate checkout source. When it
   supports `historicalContent`, use it to preserve mapped canonical artifacts
   and steps; `planner_historical_enrich`, when exposed, enriches an existing
   sparse historical record under its revision/hash preconditions. Read the
   actual schema's limits and preserve full narrative and overflow evidence
   through supported artifacts, not a truncated synopsis. A `brief-only`
   import is appropriate only for genuinely sparse sources or explicitly
   incomplete staging. Keep supported content in canonical Planner artifacts;
   for unsupported overflow, the approved combined map may use a portable
   Vault asset plus an exact link and meaningful Planner summary. Create and
   verify that asset/link before accepting the packet. If neither native
   Planner nor the approved linked Vault representation preserves the mapped
   content, report the capability gap and stop the affected import; do not
   discard evidence or write files by hand. None of these routes may
   fabricate fresh gates, claims or execution evidence.
   `planner_task_create` creates active/backlog items only; it cannot
   target that historical sprint or preserve a completed status. Import
   tracker-owned items through the reviewed pull route below instead of creating
   duplicate tasks. Never recreate history as active work or invent completion,
   review, QA, or Manager verdicts. Preserve original IDs only when valid and
   unambiguous.
5. Execute the approved ordered queue one source at a time through native
   Planner tools, read back each created packet, then perform a second link
   resolution pass for forward references. Run `planner_doctor`, verify
   current/next/dependency behavior, and compare the created packets with the
   approved map. Keep source files unchanged until the user accepts the
   migration and Git provides a recoverable checkpoint.
   First finish one representative sprint end-to-end, including all task
   sections, sprint reports and links, and review its source/target evidence
   matrix. Only then continue the next sprint. Large inventories do not justify
   repeating an unaccepted shallow conversion across the project.
6. If adopting existing YouTrack work, compare local and remote inventories
   before creating duplicates. Use a reviewed pull plan with exact project
   scope/sprint IDs and explicit archived/backlog inclusion. History remains
   historical, backlog remains unsprinted, and imports must not change the
   active sprint. Preserve Epic/Story containment separately from dependency
   edges and source Type/State provenance. Unknown mappings are conflicts,
   not permission to normalize the tracker. Later remote changes require a new
   plan; never overwrite local packets to resolve a mismatch.

## Migration checkpoint

For correction of an already imported packet, read
[maintenance versus execution](references/migration.md#maintenance-versus-execution)
before selecting a tool. A rejected ordinary update is not permission to enable
maintenance or to rewrite canonical files.

Before migration writes, the manager fetches/pulls and reconciles the selected
canonical Planner repository. After the approved migration batch, run
`planner_doctor` and migration tests, review the resulting packets, and commit
one coherent checkpoint. Push it before handoff when another machine, agent, or
session needs the migrated state. Planner tools never fetch, pull, stage,
commit, or push; cached ahead/behind data never proves remote freshness.

Read [references/migration.md](references/migration.md) for inventory,
classification, execution ledger, rollback, and tracker boundaries.
Read [references/prompts.md](references/prompts.md) when preparing a migration
request or resuming an approved batch.
