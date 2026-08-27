# Vault migration reference

## Classification and authority

- Durable knowledge becomes a Vault article.
- Active execution work belongs in Planner.
- Completed implementation, incident, review, QA, or handoff material may be a
  read-only work record, not current architecture.
- Generated exports, caches, and raw logs are evidence inputs, not canonical
  articles unless the user explicitly promotes a curated synthesis.
- Conflicts remain unresolved until a human selects authority.

## Shared-work topology

Default to one dedicated Vault Git repository/root per project, shared by that
project's product-code worktrees. Another project uses another config and root.
Each MCP process may keep its own derived cache, but all writers use
the same canonical Markdown, optimistic hashes, and article locks. A designated
manager checkpoints Git; agents should not race on the repository index.

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
