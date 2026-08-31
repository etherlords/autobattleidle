---
name: vault-upgrade
description: Upgrade a consumer project to a verified Vault release without overwriting project-customized skills. Use when asked to update, upgrade, pin, reinstall, or verify the project's Vault runtime.
---

# Vault Upgrade

1. Read the project's tooling setup script and current Vault version/checksum. Do not guess its layout.
2. Inspect the latest stable `etherlords/vault` GitHub release, exact target SHA, completed CI, tarball, and SHA-256 sidecar. Do not select a prerelease unless explicitly requested.
3. Update only the pinned Vault version and checksum, then run the project's existing tooling setup script.
4. Managed skills use a previous-package baseline: unchanged files may update automatically. A locally changed file must remain untouched and emit an incoming conflict copy. Review that diff and merge new upstream rules into the project customization manually; never replace the whole skill directory.
5. Verify installed version, archive checksum, native MCP version/tool identity, `vault_status`, doctor/recovery state, and project Git diff. Preserve unrelated dirty files and canonical articles.
6. Commit or push only when the user or current delivery workflow authorizes publication.

If the project has no upgrade script or no trusted baseline, stop with the exact missing contract instead of inventing an installer.
