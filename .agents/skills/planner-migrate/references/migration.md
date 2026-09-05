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

## Inventory, ownership, and execution

Before writes, inventory every source in the requested scope, including active,
future/backlog, historical, and tracker scope when requested. For each source,
inspect complete content and structure (including fenced code and portable
assets), metadata completeness, links/backlinks and unresolved references,
classification, and evidence for any split or merge. Assign explicit project
and shared-content ownership before choosing a destination.

The approved map must name the destination structure and ordered queue, not
just totals. Keep a source-to-target ledger with source path, portable
provenance/revision, SHA-256, classification, owner, target IDs/paths, status
and disposition reason. Reconcile all sources by disposition: imported,
split/merged, routed to Vault, excluded, duplicate, conflict, pending, or
unchanged. Covered counts must equal the inventory, not merely the imported
total.

For a combined Planner/Vault migration, use one batch ledger, with separate
targets per source. A split source counts once in source coverage, not once per
target. Search and read existing canonical candidates before deciding duplicate
versus conflict. Recheck source revision/hash immediately before its write;
changed input returns to preflight rather than using a stale approved mapping.

Use source-supported task fields; keep knowledge summaries, tags and authority
in the linked Vault article, not invented Planner fields. Preserve code and
portable assets. Process the queue sequentially through native tools, creating
parents and prerequisite tasks before dependants. Dependency cycles or unknown
targets are conflicts, never reasons to drop dependencies temporarily or make
unready work Ready. For native atomic batches such as historical sprint import,
map every source before the batch and read back every resulting item before
advancing its ledger entry. Resolve optional forward knowledge links in a
second pass against actual target IDs. A passing doctor proves structural
health only, not semantic coverage.

Before writes, verify the native Planner tools from each consumer's actual
working directory and selected canonical root. A successful SDK/preflight in a
different process or cwd is not proof of usable migration tools. If that
runtime check fails, preserve the failure and stop; do not substitute direct
file writes or silently continue. Keep all existing approval, security,
tracker, and lifecycle gates.

Compare installed migration/setup skills with the selected package version
before starting. Merge missing instructions while preserving project additions;
an updated runtime does not prove that its skills were updated. Record the
merged/preserved/conflicted files and stop on unresolved instruction conflicts.
Use the trusted previously installed version as the merge base when available;
without it, retain both versions for explicit review rather than guessing which
changes are project-owned.

Migration is complete only when every inventoried source has a reconciled
ledger disposition, requested active/future/history/backlog/tracker scope is
accounted for, and every conflict or pending item is an explicit blocker. Keep
legacy sources until user acceptance and a recoverable checkpoint.

## Semantic packet conversion

Read the whole sprint bundle, then every task bundle, including reports stored
outside the task directory. Build a section-level map before writing:

| Source meaning (wherever found) | Canonical destination |
| --- | --- |
| Goal, scope, constraints, acceptance, task identity | Task BRIEF |
| Investigation, decisions and rejected alternatives | ANALYSIS |
| Implementation approach and dependencies | IMPLEMENTATION-GUIDE where supported |
| Execution steps, outcomes, cancellations and original chronology | PROGRESS, explicitly historical for imported history |
| Reviewer findings, repairs and verdict | REVIEW with original attribution/date |
| Test scenarios, commands, results and limitations | QA / VERIFICATION with source provenance |
| Sprint goal, sequence, task relationships and completion summary | Sprint plan/board projections and supported historical sprint records |
| Reusable knowledge not owned by the task packet | Curated Vault article linked from the packet |
| Raw source/examples too large or unsuitable for a packet | Portable Vault artifact plus linked analysis, not an inaccessible machine path |

Map by meaning, not filename: review evidence inside BRIEF or PROGRESS still
belongs in the reviewed historical evidence. Preserve contradictory outcomes,
dates, authors, meaningful code and tables; deduplicate only with a recorded
source mapping. Historical evidence is not a newly executed gate, test or
manager decision. Missing evidence is `not recorded`; do not invent a PASS or
empty completed step. A completed sprint does not make every task Done.

Each accepted task needs a source-section -> target-artifact/section map,
source hashes, original status, preserved steps and evidence, and an explicit
disposition for every omitted/split section. Native full readback and UI checks
must confirm artifact visibility and step counts. Compare substance, not just
file counts or frontmatter validity. A capability gap is pending work, not
permission to relabel a rich source as brief-only.

When available in the installed schema, `planner_sprint_update.historicalPlan`
preserves the curated source plan/report/review narrative in the canonical
SPRINT-PLAN for a non-current Completed/Archived sprint under exact plan/board
CAS. It does not prove the source sprint was terminal or replace its task map.
Preserve unsupported long/raw attachments through the approved linked Vault
route rather than inventing arbitrary canonical files.

For long task artifacts, use `planner_get_execution_context.artifactOffset`
when exposed and follow each artifact's returned `nextOffset` until null.
Keep the artifact revision unchanged across pages; a changed revision requires
fresh readback. `truncated: true` or a deeper-read URI alone is not proof that
the remaining content was reviewed. If pagination is absent, use a supported
full-read route or report the limitation, not an unsupported MCP resource call.

Choose short readable sprint/task names from existing identity: retain a valid
unique tracker ID such as `HC-238`, and a meaningful title such as `Action
intake`. Do not automatically prepend `hist-`, `migrated-`, duplicate sprint
names, or the whole source path. Provenance belongs in metadata/ledger, not
every display title. Check collisions (including duplicate legacy IDs) first.
For already imported IDs, record a separate reviewed identity/alias plan;
never delete/recreate or directly rename packets to make URLs look cleaner.

Before the next batch, accept one entire representative sprint, not one easy
task: verify its plan, tasks, historical review/QA, board totals, citations and
cross-task links. Preserve the original tree until the user accepts the whole
migration. No inference from `doctor healthy` to `migration complete`.

## Canonical project topology

For a monorepo, use the opt-in collection registry described in the packaged
README: each stable project ID selects its own ordinary Planner root, config,
sprints, backlog and tracker profile. Register reviewed roots through setup's
`--project-collection` manifest; do not infer isolation from folders or legacy
`workspaceProject` labels. Inventory/map each project before importing; include
its `projectId` in every migration tool call and verify it in readback. Discover
the registry with `planner_workspace_get` before selection. Duplicate task IDs
across projects are not merge candidates. Unknown ownership is a mapping blocker.
Keep project-to-Vault context/owner and remote YouTrack identity mappings explicit;
shared knowledge does not imply a shared task backlog or tracker profile.

Use one shared Planner root for all worktrees of one project. Another project
must use another `projectId` and root. `in-repo` and `submodule` are valid only
for a single writable checkout. For concurrent worktrees, the consumer install
must select `external-repo` and point every MCP process to the same existing
Git checkout. Product-code branches may be recorded in claims, but they do not
own separate writable plan copies. A designated manager checkpoints the shared
plans repository in Git; task tools, not concurrent Git index writes, update
live lifecycle state.

## YouTrack

Check local and remote identities separately before bootstrap: the local
`projectId` may differ from the reviewed YouTrack `project.shortName`. Explicit
first adoption pins the remote immutable ID and short name in the identity map;
it does not rename the local project or bind existing active tasks implicitly.
Never edit config or remove tracker history to force adoption. A mismatched
remote identity map still requires recovery, not a new first binding.

Local migration and tracker reconciliation are separate operations. Compare
local/remote IDs first, then choose native local creation or a reviewed remote
pull; do not create both independently. Project pull can select historical and
future sprint IDs with explicit `includeArchived` and `includeBacklog` flags;
backlog-only pull uses `scope: { mode: "backlog" }`. For bounded imports or
canaries, also pass `selectedRemoteIds` with exact readable IDs to both plan and
apply. Missing, ambiguous or out-of-scope IDs fail closed; dependencies and
parents outside the selection are not imported implicitly. Keep source states and
explicit type aliases, never infer an Epic from a title. Then use a fresh
pull/push plan, inspect exact identities
and phases, and obtain authorization before apply. Existing packets reconcile
only the profile-owned status when its identity-map local fingerprint,
dependencies, and lifecycle allow it; local title/type/priority/dependencies/
acceptance criteria are never overwritten. Both-side edits or legacy fingerprint
baselines stop as conflicts. Never use timestamps as a merge rule or post
migration comments implicitly.

For backlog export, keep `Backlog` locally and configure an explicit approved
remote State mapping; do not promote items merely to satisfy the adapter.
Check the consumer profile's `integrationManifest` before push. It is reviewed
authorization configuration, not a substitute source of canonical tasks. Build
its exact issue metadata from native Planner reads; backlog uses schema 2,
`scope: "backlog"`, null sprint/sprintField and the required parent chain.
Select only the intended local IDs and inspect the resulting phases before
apply; manifest membership alone does not authorize exporting other items.

For a previously local-only, already bootstrapped project with no tracker
identity map, the ordinary pull correctly blocks. After explicit first-adoption
authorization, use `firstBinding: "adopt-local-unbound-project"` in both plan
and apply, with project/backlog scope and exact nonempty `selectedRemoteIds`.
Review the token-bound selected imports and unchanged active sprint. This route
rejects existing identities or prior binding/history evidence. An exact-token
retry can reuse one committed, hash/token-verified crash-only pull plan with no
other tracker history, after fresh state checks and without a duplicate journal.
Fresh replanning also permits one committed, hash-verified pull-plan artifact plus matching
immutable pull failure evidence for the same token, proved to have no
project-import journal, map, receipt, or other tracker history; Planner must
build a fresh snapshot/local-CAS plan before retrying. Never erase a map, receipt
or journal to make it pass. Ambiguous, incomplete, import-started, map, or
receipt cases require exact recovery, not first binding.

## Maintenance versus execution

Inspect the installed tool schema and policy, not only a newer source checkout.
Use ordinary lifecycle tools for current work and the existing import/enrichment
routes for their supported inputs. Never acknowledge `terminalDone` for an
unfinished source simply to satisfy the terminal importer.

When the installed release exposes `planner_maintenance_plan` and
`planner_maintenance_apply`, use only their explicitly supported operation.
Historical repair is not initial import, sprint allocation, physical relocation,
identity rename, or historical-to-live conversion. An unsupported operation
remains a capability gap; do not approximate it by combining raw writes.
For this terminal-record repair route, an unfinished source contradicting a
target marked Done is a classification conflict. Do not repair around it or
treat the target label as proof of completion; use a separately supported
nonterminal reconciliation route when available.
Terminal-source enrichment and repair accept only exact Done, Completed,
Closed, Resolved, Cancelled or Canceled labels (case-insensitive). Unknown or
custom source labels require an explicit supported classification route;
do not relabel source provenance merely to pass this check.

Before repair, identify the exact project/item, historical source and affected
artifacts, preserve source hashes, and confirm scoped migration authorization.
If policy is disabled, do not enable it merely to resolve a workflow rejection;
request the designated owner's scoped configuration change. A config switch
enables capability, while a plan token binds content and preconditions: neither
is proof of independent human approval.

Review the plan's exact targets, current/absent preimages and proposed content.
Original source locator/hash supplied by the caller is declared provenance,
not independent file verification. Compare it with the approved source ledger;
the tool's submitted-body hash proves the supplied text, not an unread original.
Apply only that plan, then read back every changed artifact and the durable
receipt. Preserve prior bytes for recovery. Source review/QA narrative remains
historical evidence, never a new gate verdict or claim. Reject stale state,
active claims, wrong project, collisions and modified plans rather than forcing
them. On interruption, use only the documented exact replay/recovery path;
never delete the journal or repeat with a fresh identity to hide uncertainty.

The designated owner separately authorizes and performs scoped policy/config
changes; no maintenance-policy MCP tool is implied. Verify the effective policy
after closing the window, and report unresolved imports, moves and conversions
separately. Complete migration still requires source-to-target reconciliation;
successful repair alone does not close the project migration.

## Rollback

Keep a source manifest and approved mapping. New Planner files are additive.
Use native recovery operations first and preserve later lifecycle events and
journals. If recovery requires direct canonical-file or Git-history changes,
report the capability gap and request explicit exact-target authorization under
`planner_and_vault_rules.md`; migration approval is not blanket rollback authority.
