---
name: planner-upgrade
description: Upgrade a consumer project to a verified Planner release without overwriting project-customized skills. Use when asked to update, upgrade, pin, reinstall, or verify the project's Planner runtime.
---

# Planner Upgrade

1. Read the project's tooling setup script and current Planner version/checksum. Do not guess its layout.
2. Inspect the latest stable `etherlords/planner` GitHub release, exact target SHA, completed CI, tarball, and SHA-256 sidecar. Do not select a prerelease unless explicitly requested.
3. Update only the pinned Planner version and checksum, then run the project's existing tooling setup script.
4. Managed skills use a previous-package baseline: unchanged files may update automatically. A locally changed file must remain untouched and emit an incoming conflict copy. Review that diff and merge the new upstream rules into the project customization manually; never replace the whole skill directory.
5. Verify installed package version, archive checksum, MCP/doctor smoke, project Git diff, and any preview requested by the user. Preserve unrelated dirty files.
6. Commit or push only when the user or current delivery workflow authorizes publication.

If the project has no upgrade script or no trusted baseline, stop with the exact missing contract instead of inventing an installer.
