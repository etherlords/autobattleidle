# Vault migration reference

## Classification and authority

- Durable knowledge becomes a Vault article.
- Active execution work belongs in Planner.
- Completed implementation, incident, review, QA, or handoff material may be a
  read-only work record, not current architecture.
- Generated exports, caches, and raw logs are evidence inputs, not canonical
  articles unless the user explicitly promotes a curated synthesis.
- Conflicts remain unresolved until a human selects authority.

## Inventory, ownership, and execution

Before writes, inventory every source in the requested scope, including active,
future/backlog, historical, and tracker scope when requested. Inspect complete
content and structure (including fenced code and portable assets), missing
metadata, links/backlinks and unresolved references, classification, ownership,
and evidence for every split or merge. Assign project and shared-content
ownership explicitly before choosing a destination.

The approved map must name the destination structure and ordered queue, not
just imported totals. Keep a source-to-target ledger with source path, portable
provenance/revision, SHA-256, classification, owner, target IDs/paths, status,
and disposition reason. Reconcile all sources by disposition: imported,
split/merged, routed to Planner/backlog, excluded, duplicate, conflict,
pending, or unchanged. Covered counts must equal the full inventory.

Use one batch ledger across Planner and Vault: a split source counts once in
source coverage and lists all resulting targets. Search/read existing canonical
candidates before marking duplicates or conflicts. Immediately before writing,
recheck the source revision/hash; changed input must return to preflight.
Record an authority decision and its evidence for every resolved conflict,
including where the rejected or superseded definition is preserved; do not
invent a redirect or discard it silently.

Use real source-supported summaries, tags, kind, and authority; never use a
filename placeholder or fabricate metadata. Preserve code and portable assets.
Transform one approved source at a time with native Vault tools and read back
the full target before continuing. Then resolve links in a second pass so
forward references are validated against real target IDs. Doctor/index green
only proves tool health; it does not establish semantic completeness.

Before writes, verify native Vault tools from every consumer's actual working
directory and selected canonical root. SDK success or a preflight from another
process/cwd is not proof that the real MCP session can migrate. Preserve a
runtime failure and stop rather than falling back to direct writes. Retain all
existing approval, security, and KB gates.

Compare installed migration/setup skills with the selected package version.
Merge missing instructions without overwriting project additions; record each
file as merged, preserved, or conflicted. A runtime upgrade alone does not prove
that the migration instructions were upgraded.
Use a trusted previous package version as the three-way merge base when
available; without that base, retain both versions for explicit review instead
of guessing ownership.

Migration is complete only when every inventoried source has a reconciled
ledger disposition, requested active/future/history/backlog/tracker scope is
accounted for, and all conflicts or pending items are explicit blockers. Keep
legacy sources until user acceptance and a recoverable checkpoint.

## Semantic article conversion

Before choosing target folders, inspect the source taxonomy and actual content:
which documents are authoritative concepts, decisions, guides, historical
evidence, task plans or duplicated summaries? Propose the simplest destination
structure by subject and project/shared ownership. Migration origin is
provenance, not a reason to add a permanent `migrated/` parent directory. Keep a
useful existing structure when supported; reorganize only with an explicit map.

For every document, curate the title, concise source-supported summary, kind,
owner/project, status/authority, tags and relationships. Preserve substantive
content, code, tables, decisions and uncertainty. Route actionable task content
to Planner and link it; do not leave executable plans disguised as knowledge.
Consolidation/splitting must map all source sections to target sections or an
explicit omission reason. A filename, generic tag set or one-line synopsis plus
an external path does not replace source analysis.

Resolve each source reference: (1) existing authoritative article -> stable
Vault ID/section, (2) available portable source/example -> native asset storage
and an analysis article citing it, (3) missing/unavailable source -> explicit
unresolved provenance with the supported claim bounded accordingly. Never
fabricate a missing source or graph edge. Keep referenced files when permitted;
do not copy secrets or redistribute material without authority.

Before the next batch, review one representative linked cluster through native
full reads and preview: article substance/metadata, folder placement, links and
backlinks, portable assets, and exact/semantic retrieval where applicable. Test
combined filters (for example folder + tag), not only global tag counts. Graph
density or a clean index is not evidence of correct relationships. Track UI
projection defects separately from missing article content.

For a previously shallow import, reconcile into the same identity with native
CAS/update/move/link tools. Check existing changes before enrichment; do not
delete and recreate accepted IDs, duplicate articles or erase source history.

## Content-preservation checkpoint

For every selected source, retain its repository-relative path, repository
revision (when available), source SHA-256, target Vault ID/path/content hash,
and any intentional transformations in a reviewed migration manifest outside
the managed roots. Record source provenance in the article body as well; do not
invent unsupported frontmatter fields. An absolute machine path alone is not
portable provenance. Preserve redistributable source snapshots/examples through
`vault_store_asset` for reviewed UTF-8 content or `vault_import_asset` for an
existing file when another machine cannot access the original source. Follow
the installed `vault-use` file-import route: approve the narrow source root,
verify the byte SHA-256 and size, import through the native tool and retain its
receipt. Images, videos and other binary sources need semantic descriptions in
their metadata and a linked analysis article; storing bytes does not perform
OCR, transcription, extraction or analysis. Verify the preview/download and
stored-byte hash, not just the article's Markdown hash. Unsupported capability
or unapproved sources remain pending in the ledger, never a direct-copy fallback.

Do not remove all lines starting with `#`: inside fenced code these are literal
comments, not article headings. Remove or replace only an identified document
heading outside fences; preserve remaining code, tables, citations and links.
For a source mirror, compare the complete post-write body from
`vault_get_article` with the source after only the explicitly approved metadata,
title and summary transformations. For a synthesis, record the source-to-finding
mapping and omissions instead of claiming byte-equivalent preservation.

Reconcile source counts by disposition (imported, excluded with reason,
conflicted, still pending). Zero format errors does not prove full migration.
Resolve meaningful internal relationships with stable article IDs/wiki links;
do not invent links merely to populate a graph. Verify exact/lexical retrieval
and, if semantic retrieval is part of acceptance, index completion and a real
semantic query. Pending embeddings are not a semantic-search pass. Check the
preview uses the same config/root as native tools; an empty view is not evidence
that the canonical corpus is empty. Keep legacy sources until user acceptance.

## Shared-work topology

For monorepo adoption, map source folders to registered workspace project IDs
and article owners before import. A context may include its own articles plus
shared/engine owners; it is not itself the article owner. Read `vault_status.workspace`
to discover the configured contexts, use explicit `project` for scoped discovery,
`articleProject` for an exact owner facet, and `allProjects: true` only for a
deliberate cross-project reconciliation. Verify every created article's owner
and links through native readback; never infer ownership from a similar title.
Preserve global stable Vault IDs rather than duplicating shared articles for
each consumer. Follow `vault-use` for the supported monorepo configuration.

For one writable checkout, `embedded` is supported. For parallel code worktrees
on one host, use one dedicated Vault Git repository/root shared by those
worktrees. Another project uses another config and root.
Each MCP process may keep its own derived cache, but all writers use
the same canonical Markdown, optimistic hashes, and article locks. A designated
manager checkpoints Git; agents should not race on the repository index.

Follow `vault-use` setup before importing. Keep the config in each consumer's
root so caches/skills are consumer-local; do not install the consumer config in
the shared data repository. Every worktree needs a discoverable MCP block even
when package files are shared. Verify exact root identity from each session and
use a disposable hash-conflict/visibility test before real parallel writes.

Do not use a submodule as a distributed writable lock. Use a branch-coupled
Vault worktree only when documentation must be reviewed and merged atomically
with one code branch; this is an explicit project policy, not the default.

## YouTrack KB

`kbId` is an external identity, not proof that the remote article exists or is
current. Local search may resolve it without network access. KB synchronization
must use a fresh read-only diff, explicit field authority, token-bound apply,
post-write readback, and durable recovery evidence. Never overwrite by latest
timestamp or create a remote article implicitly during local migration.

## Rollback

Record source and target manifests. Migration is additive until acceptance.
Rollback restores the pre-migration Git revision and rebuilds disposable indexes;
do not delete source files or remote KB articles as part of automatic rollback.
