# Autobattle Idle

A small Three.js dogfood project for the Etherlords Planner and Vault workflows.

## Development

```powershell
pnpm install
pnpm dev
```

Run all quality gates with `pnpm check`.

## Planner and Vault

Code, `plans/`, and `.docs/knowledge/` are one in-repository Git checkpoint. Runtime packages and
credentials are never committed. On a fresh internal clone, authenticate `gh` to the Etherlords
organization and run:

```powershell
.\scripts\setup-agent-tooling.ps1
```

The script downloads pinned private release archives, verifies their SHA-256 files, installs isolated
derived runtimes under `.tools`, and generates the machine-local `.codex/config.toml`. Restart Codex
from this project after setup.

Start the read-only Planner UI on loopback and the private LAN with:

```powershell
.\scripts\start-planner-ui.ps1
```

The current sprint is `ABI-S1`. `ABI-000` deliberately asks an agent to audit and restructure the seed
Vault through Vault tools before implementation begins. Every task then follows implementation,
independent review, independent QA, and manager closure. Planner `PROGRESS.md`, `REVIEW.md`, `QA.md`,
and `VERIFICATION.md` provide the source data for a final project timeline.

YouTrack is disabled for this pilot. Planner and Vault remain fully local-first.

The game is intentionally small. Product decisions live in `.docs/knowledge`, while sprint
state lives in `plans`; agents must use the installed Vault and Planner workflows instead of
inventing parallel documentation or task state.
