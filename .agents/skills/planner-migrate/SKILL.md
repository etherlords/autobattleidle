---
name: planner-migrate
description: Plan and perform a reversible semantic migration from legacy local sprint, task, backlog, incident, or handoff files into canonical Planner packets. Use for adopting an existing project, not for routine task execution.
---

# Planner Migration

Migrate meaning, not filenames. First inventory the source read-only and produce
a mapping plan. Separate active executable work from historical evidence and
durable knowledge before creating anything.

## Required route

1. Confirm the exact source root, target Planner project/root, workflow profile,
   storage mode, and whether YouTrack reconciliation is enabled. Inspect the
   consumer `.planner/planner-install.json`: concurrent worktrees require its
   one configured `external-repo` root, never separate writable packet copies.
   Never infer a live tracker target or mutate YouTrack during migration
   planning.
2. Classify every candidate as active task, backlog candidate, incident,
   historical work record, durable Vault knowledge, duplicate, or out of scope.
3. Present IDs, dependencies, acceptance criteria, target profile/artifacts,
   unresolved fields, and proposed source disposition as a dry-run mapping.
4. After approval, create a new sprint with `planner_sprint_bootstrap` or add
   items with `planner_task_create`. Preserve original IDs only when valid and
   unambiguous; never invent completion, review, QA, or Manager verdicts.
5. Run `planner_doctor`, verify current/next/dependency behavior, and compare the
   created packets with the approved map. Keep source files unchanged until the
   user accepts the migration and Git provides a recoverable checkpoint.
6. If adopting existing YouTrack work, first build valid local packets or use a
   reviewed empty-root pull bootstrap. Later remote changes require a new pull
   plan; conflicts are evidence for a human merge decision, never a reason to
   overwrite local packets.

## Migration checkpoint

Before migration writes, the manager fetches/pulls and reconciles the selected
canonical Planner repository. After the approved migration batch, run
`planner_doctor` and migration tests, review the resulting packets, and commit
one coherent checkpoint. Push it before handoff when another machine, agent, or
session needs the migrated state. Planner tools never fetch, pull, stage,
commit, or push; cached ahead/behind data never proves remote freshness.

Read [references/migration.md](references/migration.md) for classification,
rollback, and tracker boundaries.
