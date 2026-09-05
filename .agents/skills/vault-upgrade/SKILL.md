---
name: vault-upgrade
description: Upgrade a consumer project to a verified Vault release without overwriting project-customized skills. Use when asked to update, upgrade, pin, reinstall, or verify the project's Vault runtime.
---

# Vault Upgrade

For shared-worktree installations, locate the common pinned package and all
consumer registrations through the recorded setup. Coordinate a pause of
active operations before replacing that package; do not upgrade one consumer
silently while others use it. Keep the shared data root and consumer-local
caches/config bindings intact, merge customized skills separately, restart
affected MCP clients, and verify tools/root identity from every worktree.

1. Read the project's tooling setup script and current Vault version/checksum. Do not guess its layout.
2. Inspect the latest stable `etherlords/vault` GitHub release, exact target SHA, completed CI, tarball, and SHA-256 sidecar. Do not select a prerelease unless explicitly requested.
3. Update only the pinned Vault version and checksum, then run the project's existing tooling setup script.
4. Never replace `.agents` or `.codex` directories. The current setup helper preserves matching managed files and rejects divergent files; use the recorded previous package only as a baseline for a reviewed diff. Leave every divergent skill, Markdown instruction, and MCP config untouched, report its exact conflict, and merge upstream rules manually. If no trusted baseline exists, stop with that missing contract rather than declaring an automatic upgrade.
5. Verify installed version, archive checksum, native MCP version/tool identity, `vault_status`, doctor/recovery state, and project Git diff. Preserve unrelated dirty files and canonical articles.
6. Commit or push only when the user or current delivery workflow authorizes publication.

If the project has no upgrade script or no trusted baseline, stop with the exact missing contract instead of inventing an installer.
