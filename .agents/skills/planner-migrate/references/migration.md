# Planner migration reference

## Classification

- Active work: a bounded outcome still intended for execution.
- Backlog: potentially useful work without current execution approval.
- Incident: failure evidence whose remediation may be active or complete.
- Historical work record: completed analysis, review, QA, handoff, or progress.
- Durable knowledge: architecture, decision, guide, or reusable troubleshooting;
  route this to Vault rather than creating a Planner task.

Do not turn every old file into an active task. Preserve conflicting or unclear
records in the migration report until a human chooses authority.

## Canonical target

Use one shared Planner root for all worktrees of one project. Another project
must use another `projectId` and root. `in-repo` and `submodule` are valid only
for a single writable checkout. For concurrent worktrees, the consumer install
must select `external-repo` and point every MCP process to the same existing
Git checkout. Product-code branches may be recorded in claims, but they do not
own separate writable plan copies. A designated manager checkpoints the shared
plans repository in Git; task tools, not concurrent Git index writes, update
live lifecycle state.

## YouTrack

Local migration and tracker reconciliation are separate operations. First build
valid local packets. Then use a fresh pull/push plan, inspect exact identities
and phases, and obtain authorization before apply. Existing packets reconcile
only the profile-owned status when its identity-map local fingerprint,
dependencies, and lifecycle allow it; local title/type/priority/dependencies/
acceptance criteria are never overwritten. Both-side edits or legacy fingerprint
baselines stop as conflicts. Never use timestamps as a merge rule or post
migration comments implicitly.

## Rollback

Keep a source manifest and approved mapping. New Planner files are additive.
Rollback restores the pre-migration Git revision or removes only the exact new
packet after verifying no later lifecycle events depend on it.
