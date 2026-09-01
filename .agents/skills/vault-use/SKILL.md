---
name: vault-use
description: Search, read, cite, create, update, link, validate, and migrate local Markdown documentation through Vault MCP. Use for project architecture, decisions, guides, game design, unknown-name documentation discovery, stable article IDs, backlinks, Vault format repair, or when an implementation task should consult existing durable project knowledge before changing code.
---

# Vault Use

Use Vault for durable project knowledge. Use RepoMapper or source search for
code definitions/usages, and Planner for active task lifecycle.

For a new project, run the built `vault setup` command to generate its project
config and Codex MCP snippet, then restart Codex or create a new saved-project
task. Spawned subcontexts are not assumed to inherit project MCP. If the native
namespace is absent, report `BLOCKED_TOOL_UNAVAILABLE`; canonical Markdown is
an ordinary fallback, but that fallback is not a native MCP pass.

## Retrieval flow

1. If an exact canonical relative Markdown path is known, resolve it under the
   configured Vault root and read it directly. Do not search merely to translate
   a known path. Exact source-code paths still use source search/direct reads.
2. If an exact stable ID is known, prefer `vault_get_article` directly.
3. For known metadata, path-prefix, tag, status, or link constraints, call
   `vault_query` first with `limit<=10`. Do not run preliminary semantic search
   or retry a deterministic query without correcting its filters.
4. If the article name is unknown, describe the architectural question in
   `vault_search` with `mode=auto` and the default `scope=knowledge`. Use
   `scope=work-records` only for explicitly historical implementation/review/QA
   evidence, or `scope=all` when both authority classes are required.
5. Inspect result type, authority, status, summary, snippet, and confidence.
6. Call `vault_get_article` by `vaultId` for at most 200 lines by default and
   for the hard evaluation slice. Request one further bounded slice only when
   the first canonical evidence is insufficient.
7. Call `vault_get_related` when explicit links/backlinks can resolve missing
   context.
8. Cite stable ID, title, path, line range, and content hash when evidence
   matters.

## Precise citations

- Prefer `Article.md#stable-heading` or `[[Article#stable-heading|label]]` for
  durable conceptual references.
- Use `#L21`, `#L21-L25`, or `#L21C5-L23C12` for exact source evidence. Lines
  and columns are 1-based; columns count Unicode code points, not UTF-16 units.
- Pass the fragment without `#` as `locator` to `vault_get_article`. The tool
  returns the resolved range and canonical target.
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

- Read the current article and retain its `contentHash` before update/link/delete.
- Prefer MCP create/update/link tools so format, graph, index, and embeddings
  update together.
- Do not leave an absolute local path, temporary checkout, or external file as
  the only authority for durable knowledge. When redistribution is permitted,
  use `vault_store_asset` to preserve source material as an `artifact` or code
  `example`, then create a normal analysis article with conclusions and a link
  to that asset. Raw asset content is intentionally excluded from ranked search;
  its title, summary, project, kind, and tags remain discoverable.
- Store only reviewed UTF-8 source material. Never ingest secrets, credentials,
  private user data, generated bulk output, or binaries. `sourceLabel` records
  provenance but is not a portable authority.
- Treat delete as a guarded move to recoverable trash.
- Run `vault_migration_plan` or `vault_doctor` before repairs.
- Do not use broad `vault_doctor_fix` without an inspected plan and authorized
  write scope.

## Freshness and fallback

When Markdown was edited outside MCP, call `vault_index` with `embed=true` in
the current V1. If MCP is unavailable, read/search Markdown directly and state
that indexed results may be stale. Canonical Markdown always overrides derived
SQLite, snippets, summaries, and embeddings. After Planner exports a changed
work-record snapshot, call `vault_index` or restart Vault; V1 does not poll
Planner files. Vault write tools never advance or edit Planner tasks.

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
