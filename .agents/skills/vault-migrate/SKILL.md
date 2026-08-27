---
name: vault-migrate
description: Plan and perform a reversible semantic migration from an existing documentation tree into canonical Vault articles. Use for project adoption or legacy knowledge cleanup, not for routine article edits.
---

# Vault Migration

Treat the source as read-only until an approved migration map is verified.
Unknown input formats require semantic classification by the agent; deterministic
Vault tools handle validation, IDs, formatting, links, and writes.

## Required route

1. Confirm exact source and target roots, authority, Git boundary, and whether
   YouTrack KB mirroring is enabled. Never contact or mutate YouTrack merely
   because a source page contains a `kbId` or URL.
2. Inventory candidates and classify each as durable knowledge, active Planner
   work, historical work record, duplicate/conflict, generated data, or out of
   scope. Produce a dry-run mapping before writes.
3. Run `vault_migration_plan` and `vault_doctor`. Apply only unambiguous
   structural fixes; do not invent summaries, kinds, authority, or links.
4. After approval, create or update articles through Vault tools. Keep stable
   source references, assign one authoritative page, and add explicit links only
   when the relationship is supported by evidence.
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

Read [references/migration.md](references/migration.md) for topology, YouTrack
KB identity, conflict, and rollback rules.
