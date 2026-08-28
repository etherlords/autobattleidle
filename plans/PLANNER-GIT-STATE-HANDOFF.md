# Planner Git State Handoff

## Decision for this repository

Autobattle Idle uses Planner in `in-repo` storage mode. Code, `plans/`, Vault knowledge, and the
canonical Planner state are reviewed and checkpointed together by the root manager.

Do not ignore `.planner/operations/`. In the currently installed Planner, committed operation
journals provide durable recovery and exact idempotency evidence across processes and sessions.
They belong to the same coherent Git checkpoint as the task and sprint files changed by those
operations.

Do not stage all of `.planner/` blindly. It also contains machine-local and transient files.

## Commit matrix

| Path | Git policy | Reason |
| --- | --- | --- |
| `.planner/config.json` | Commit | Canonical project, sprint, workflow, and task-path mapping. |
| `.planner/operations/*.json` | Commit after `planner_doctor` confirms every journal is `committed` | Durable atomic-operation, recovery, and idempotency record. Keep it with the canonical files changed by the operation. |
| `plans/**` | Commit | Canonical sprint, task, lifecycle, gate, and delivery records. |
| `.docs/knowledge/**` | Commit | Canonical Vault documentation stored in this repository. |
| `.planner/youtrack.profile.json` | Commit when YouTrack is enabled and the file contains identifiers plus an environment-variable name only | Project-owned non-secret synchronization policy. Tokens must never be stored in it. |
| `.planner/tracker/identity-map.json`, durable outbox, plans, and evidence | Commit when the tracker feature creates them | Required synchronization identity, recovery, and audit state. Never commit credentials. |
| `.planner/planner-install.json` | Do not commit | Machine-local binding containing absolute runtime paths. It is already ignored. |
| `.planner/locks/**` | Do not commit | Ephemeral process locks. No lock may be present at a Git checkpoint. |
| `.planner-cache/**` | Do not commit | Rebuildable SQLite index and rebuild lock. It is already ignored. |
| `.vault-cache/**` | Do not commit | Rebuildable Vault indexes and embeddings. |
| `.tools/*runtime/**` | Do not commit | Installed machine-local Planner/Vault runtimes. |
| `.planner/recovery-survivors/**` | Conditional; never blanket-stage or delete | Preserve while recovery or an incident is unresolved. After clean doctor/readback, keep only survivors explicitly referenced by reviewed incident evidence; removal or retention is a separate manager decision. Existing tracked survivors remain untouched until that decision. |

## Coherent checkpoint procedure

1. Stop starting new Planner mutations and let the current operation finish.
2. Run `planner_doctor`. Do not checkpoint a pending/prepared journal or an active operation lock.
3. Read back the affected task, sprint board, and gate/claim state. A failed MCP response after a
   canonical write must be resolved by exact readback; never replay it blindly.
4. Inspect `git status --short` and the new operation journals. Confirm that each journal staged for
   the checkpoint has `state: "committed"` and targets only the intended batch.
5. Stage explicit surfaces rather than the whole directory, for example:

   ```powershell
   git add -- .planner/config.json .planner/operations plans .docs/knowledge
   ```

   Add code, tests, configuration, and approved tracker files explicitly. Review recovery survivors
   separately.
6. Review the staged diff, run the required checks, then commit the coherent code/documentation/task
   batch. Planner and Vault tools never commit or push.
7. Push before a machine/session handoff that needs this state. Git preserves reviewed history; live
   task claims and dependency checks, not Git branches, coordinate concurrent agents.

## Current ABI observation

This repository already tracks hundreds of committed operation journals, and the active ABI-015
work has produced additional committed journals. Omitting only the new journals would create an
inconsistent retention boundary and weaken exact replay behavior.

The unbounded growth is a Planner product action item, not a reason to ignore the directory in the
consumer today. A future Planner release should define and test safe compaction/archive semantics
for terminal committed journals without removing pending recovery evidence or reusable
idempotency keys.

## Planner product follow-up

Planner setup and doctor should expose this policy directly:

- setup should install/check ignore rules for `planner-install.json`, locks, and rebuildable caches,
  while explicitly keeping operations trackable;
- doctor or a read-only Git-policy tool should classify canonical, durable, transient, secret, and
  conditional paths for the selected storage mode;
- any journal compaction command must be explicit, reviewed, backup-aware, and separately tested.
