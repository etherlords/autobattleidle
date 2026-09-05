---
name: vault-use
description: Set up Vault for one checkout or shared parallel code worktrees, then search, read, cite and maintain documentation through MCP. Use for project adoption, architecture, decisions, stable article IDs, backlinks and durable project knowledge.
---

# Vault Use

Use Vault for durable project knowledge. Use RepoMapper or source search for
code definitions/usages, and Planner for active task lifecycle.

For a new project, run the built `vault setup` command to generate its project
config and Codex MCP snippet, then restart Codex or create a new saved-project
task. Spawned subcontexts are not assumed to inherit project MCP. If the native
namespace is absent, report `BLOCKED_TOOL_UNAVAILABLE` and follow the consumer
root's `planner_and_vault_rules.md`.

For installation or a storage-topology change, read
[references/tool-flow.md](references/tool-flow.md#installation-and-worktree-registration).
Use `embedded` for one writable checkout, or one `external-repo` data root for
parallel code worktrees on one host. A shared pinned package installation is
enough; every checkout still needs its own config/cache and discoverable MCP
registration. No broker or shared stdin service is needed. Confirm actual
tools/root identity before writing. Legacy adoption follows `vault-migrate`,
not repeated setup or a raw Markdown copy into each worktree.

## Retrieval flow

In a monorepo, inspect `vault_status.workspace` once to discover valid project
contexts. Keep its stable project key aligned with the task's Planner project;
the context's `knowledgeProjects` may deliberately include engine/shared
articles. Pass `project` to search, query and graph export. To investigate across
the entire corpus explicitly, use `allProjects=true` instead of omitting scope;
do not combine it with `project`. `scope=all` means knowledge plus work records,
not all projects. Always check the returned article's actual project/authority.
Use `vault_query.articleProject` for an exact article-owner filter inside a
context (for example CHD context, GE-only articles); it cannot broaden scope.

An exact globally unique `vaultId` is sufficient for direct reads and updates:
read its ownership and current hash before writing. Do not silently reassign
its project. Creates and assets need the intended registered article owner;
shared ownership is deliberate, not a default for uncertain material. If the
task's project or the article owner remains unclear, ask the user rather than
guessing a folder or choosing the first project. Browser navigation does not
change the project context of an agent's tool calls.

1. If an exact stable ID is known, call `vault_get_article` directly. Exact
   source-code paths still use source search/direct reads.
2. For known metadata, path-prefix, tag, status, or link constraints, call
   `vault_query` first with `limit<=10`. Do not run preliminary semantic search
   or retry a deterministic query without correcting its filters.
3. If the article name is unknown, describe the architectural question in
   `vault_search` with `mode=auto` and the default `scope=knowledge`. Use
   `scope=work-records` only for explicitly historical implementation/review/QA
   evidence, or `scope=all` when both authority classes are required.
4. Inspect result type, authority, status, summary, snippet, and confidence.
5. Call `vault_get_article` by `vaultId` for at most 200 lines by default and
   for the hard evaluation slice. Request one further bounded slice only when
   the first canonical evidence is insufficient.
6. Call `vault_get_related` when explicit links/backlinks can resolve missing
   context.
7. Cite stable ID, title, path, line range, and content hash when evidence
   matters.

## Precise citations

- Prefer `Article.md#stable-heading` or `[[Article#stable-heading|label]]` for
  durable conceptual references.
- Use `#L21`, `#L21-L25`, or `#L21C5-L23C12` for exact source evidence. Lines
  and columns are 1-based; columns count Unicode code points, not UTF-16 units.
- Pass the fragment without `#` as `locator` to `vault_get_article`. The tool
  returns the resolved range and canonical target.
- For a named Obsidian block, use `locator: "^block-id"`; references use
  `[[Article#^block-id]]`. Read the exact target; do not guess through duplicate
  or missing IDs. Blocks inside code examples are not targets.
- Wiki-link graph edges resolve at document level and retain `locator` for the
  precise destination. Standard Markdown links render in the UI but are not
  graph edges.
- Line citations move when a document is edited. Include `contentHash` for
  revision-bound evidence. Do not invent `::line:` forms.

For a deterministic routing evaluation, follow the prompt's route and call
budget literally: do not add retries, exploratory searches, or fallbacks. A
correct article reached through a forbidden route or over the stated limit is a
failed routing result, not a pass.

Report `confidence=none` as a documentation gap. Do not invent an answer from
the nearest weak result. Ambiguous titles/aliases and descriptive queries fall
through to hybrid retrieval; a generic BM25/lexical score is not authoritative.

## Write flow

- Manage Obsidian YAML `aliases` through `vault_create_article` or
  `vault_update_article`: omit to preserve, send a list to replace, `[]` to
  clear. Resolve discovery results to an exact `vaultId` before writing;
  aliases may collide across projects. For portable links use
  `[[Actual article path|Alias]]`, not an alias as the target. Alias changes
  do not rename files or rewrite backlinks.
- Read the current article and retain its `contentHash` before update/link/delete.
- Prefer MCP create/update/link tools so format, graph, index, and embeddings
  update together.
- Add an Obsidian block ID using `vault_set_block_id` with a reviewed exact
  line/range `locator`, `blockId` and the current hash. Rename an existing ID
  with `vault_rename_block` (`blockId`, `newBlockId`), not a raw text replacement,
  so resolved incoming references are repaired together.
- Use `vault_rename_heading` for one reviewed H2-H6 section rename; keep
  `updateIncomingLinks=true` so resolved heading locators and exact title-column
  citations move atomically. Use `vault_replace_text` only for one exact unique string or an
  exact `L...` range whose content was just read. Both require the current
  `contentHash`; neither is a broad find/replace.
- Do not leave an absolute local path, temporary checkout, or external file as
  the only authority for durable knowledge. When redistribution is permitted,
  use `vault_store_asset` for reviewed UTF-8 content or `vault_import_asset` for
  an existing file to preserve source material as an `artifact` or code
  `example`, then create a normal analysis article with conclusions and a link
  to that asset. Raw asset content is intentionally excluded from ranked search;
  its title, summary, project, kind, and tags remain discoverable.
- For images, video and other existing files, follow
  [file import](references/tool-flow.md#file-import) before calling
  `vault_import_asset`; never send binary content as base64 or copy it directly
  into managed roots. Never ingest secrets, credentials, private user data or
  unreviewed bulk output. `sourceLabel` records provenance but is not a portable
  authority.
- Treat delete as a guarded move to recoverable trash.
- Run `vault_migration_plan` or `vault_doctor` before repairs.
- Do not use broad `vault_doctor_fix` without an inspected plan and authorized
  write scope.

## Freshness and fallback

If an external change is reported, call `vault_index` with `embed=true` in the
current V1. If MCP is unavailable, preserve the failure report and follow the
consumer root's `planner_and_vault_rules.md`; do not read/search Markdown as an
autonomous fallback. After Planner exports a changed work-record snapshot, call
`vault_index` or restart Vault; V1 does not poll Planner files. Vault write
tools never advance or edit Planner tasks.

Read [references/tool-flow.md](references/tool-flow.md) for tool routing,
artifact classes, and recovery behavior when a task mixes code, knowledge, and
work records.

## Optional YouTrack KB boundary

For an unmapped article, call `vault_youtrack_kb_discover`, explicitly review
one candidate, then call `vault_youtrack_kb_adoption_plan`. Only
`vault_youtrack_kb_adoption_apply` may add the mapping: pass the exact plan and
token; it rechecks remote identity/freshness and changes only local `kbId`.

For a mapped article, first call `vault_youtrack_kb_read`, then create either a
push or pull plan. Apply only the exact reviewed plan token. Do not treat this
as background sync, discovery, remote creation, link sync, or permission to
retry an ambiguous push. Inspect `vault_youtrack_kb_recovery` after a failed
push and reconcile manually before making a new plan.

## Git topology and checkpoint

Run `vault_doctor` before a multi-agent write session and inspect its Git
readiness. Use `embedded` when knowledge must merge with code; use one shared
`external-repo` root for live documentation across several product worktrees.
A `submodule` is a separate checkout per worktree, not a shared writable root.
Vault never stages, commits, or pushes: a designated manager reviews and makes
the Git checkpoint after writes and doctor/index evidence are complete. Before
shared writes, that manager fetches and pulls or reconciles the one canonical
Vault repository outside Vault tools. After each coherent documentation batch,
run doctor and index, review and commit the diff, then push before handoff or
cross-machine consumption. Treat doctor ahead/behind as cached evidence and
`syncFreshness: unknown`, never as proof that a fetch occurred. Multiple product
worktrees share one `external-repo` root; do not give each worktree a writable
submodule Vault.
