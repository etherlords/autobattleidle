---
name: planner-upgrade
description: Upgrade a consumer project to a verified Planner release without overwriting project-customized skills. Use when asked to update, upgrade, pin, reinstall, or verify the project's Planner runtime.
---

# Planner Upgrade

For shared-worktree installations, locate the common pinned package and all
consumer registrations through the recorded setup. Coordinate a pause of
active operations before replacing that package; do not upgrade one consumer
silently while others use it. Keep canonical roots unchanged, merge customized
skills/config separately in each consumer, restart affected MCP clients, and
verify discovery/root identity from each actual worktree before resuming.

1. Read the project's tooling setup script and current Planner version/checksum. Do not guess its layout.
2. Inspect the latest stable `etherlords/planner` GitHub release, exact target SHA, completed CI, tarball, and SHA-256 sidecar. Do not select a prerelease unless explicitly requested.
3. Update only the pinned Planner version and checksum, then run the project's existing tooling setup script.
4. Never replace `.agents` or `.codex` directories. The current setup helper preserves matching managed files and rejects divergent files; use the recorded previous package only as a baseline for a reviewed diff. Leave every divergent skill, Markdown instruction, and MCP config untouched, report its exact conflict, and merge upstream rules manually. If no trusted baseline exists, stop with that missing contract rather than declaring an automatic upgrade.
5. Verify installed package version, archive checksum, MCP/doctor smoke, project Git diff, and any preview requested by the user. Preserve unrelated dirty files.
6. Commit or push only when the user or current delivery workflow authorizes publication.

If the project has no upgrade script or no trusted baseline, stop with the exact missing contract instead of inventing an installer.
