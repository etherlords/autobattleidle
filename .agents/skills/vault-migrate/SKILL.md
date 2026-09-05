---
name: vault-migrate
description: Plan and perform a reversible semantic migration from an existing documentation tree into canonical Vault articles. Use for project adoption or legacy knowledge cleanup, not for routine article edits.
---

# Vault Migration

Treat the source as read-only until an approved migration map is verified.
Unknown input formats require semantic classification by the agent; deterministic
Vault tools handle validation, IDs, formatting, links, and writes.

Read [semantic article conversion](references/migration.md#semantic-article-conversion)
before an import. An agent must interpret each document; a script that copies
files with generic metadata is not a semantic migration. Inventory/hash tools
and native writes may automate mechanics after the transformation is reviewed.

Before migration, use the installed `vault-use` installation/worktree route to
select the target topology and register every consumer. Single-checkout
`embedded` and shared `external-repo` adoption use the same semantic map; in
shared mode import once into the common root, not once per worktree. Each
worktree keeps its own runtime config/cache and MCP registration while sharing
one pinned package install. Verify actual tools/doctor in those sessions before
migration; retain customized skills and other MCP server blocks.

## Required route

1. Confirm exact source and target roots, authority, Git boundary, and whether
   YouTrack KB mirroring is enabled. Never contact or mutate YouTrack merely
   because a source page contains a `kbId` or URL.
2. Before any write, complete a per-source inventory of full content and
   structure, missing metadata, link graph, classification, ownership, and
   split/merge evidence. Classify each candidate as durable knowledge, active
   Planner work, historical work record, duplicate/conflict, generated data,
   or out of scope. Documents hiding executable active/future work route to
   Planner or backlog; completed work remains a historical record. Produce a
   dry-run mapping before writes.
   Preserve Obsidian `aliases` as a YAML list through create/update tools;
   do not confuse it with per-link display labels. Resolve aliases to actual
   target paths/IDs before creating links and report ambiguous names. Keep
   unsupported Properties and embeds in the lossless source
   map; do not silently discard them or claim they are executable support.
   Preserve existing `^block-id` markers and resolve block references in the
   second link pass. Use block authoring/rename tools for reviewed changes,
   then read back each referenced block; report duplicate or missing IDs.
3. Run `vault_migration_plan` and `vault_doctor`. Apply only unambiguous
   structural fixes; do not invent summaries, kinds, authority, or links.
   These tools inspect configured Vault roots; they do not import an arbitrary
   external legacy tree. Inventory external sources read-only, then create the
   approved articles/assets through native tools in the target.
4. After approval, execute the destination's ordered queue one source at a
   time through Vault tools and read back each article. Keep stable source
   references, assign one authoritative page, and add explicit links only when
   the relationship is supported by evidence. Resolve forward links in a
   second pass after the targets exist.
   Follow the [content-preservation checkpoint](references/migration.md#content-preservation-checkpoint):
   retain literal code, source provenance and the reviewed transformation map.
   Accept a representative linked document cluster end-to-end before repeating
   the transformation across the corpus. Choose the destination taxonomy from
   content and project ownership, not a blanket `migrated/` staging folder.
5. Re-run doctor, index, link/backlink checks, representative searches, and a
   source/target manifest comparison. Keep source files until the user accepts
   the result and Git provides a rollback checkpoint.

For storage, `embedded` keeps knowledge in the product repository and merges it
with code; an `external-repo` gives all worktrees one canonical live knowledge
checkout. Do not use a submodule as a shared writable root: each worktree gets
its own checkout. `vault_doctor` reports the actual mode and Git readiness, but
never fetches, pulls, stages, commits, or pushes. Before shared migration writes,
a designated manager fetches and pulls or reconciles the canonical repository.
After each coherent migrated batch, run doctor and index, review and commit the
diff, then push before handoff or cross-machine consumption. Doctor upstream
counts are cached and `syncFreshness: unknown`. Multiple product worktrees use
one external root, not separate writable submodule checkouts.

Read [references/migration.md](references/migration.md) for inventory,
execution ledger, topology, YouTrack KB identity, conflict, and rollback rules.
Read [references/prompts.md](references/prompts.md) when preparing a migration
request or resuming an approved batch.
