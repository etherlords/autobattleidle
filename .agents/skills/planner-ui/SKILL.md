---
name: planner-ui
description: Start or verify the consumer project's read-only Planner board preview. Use when asked to open, run, restart, or diagnose the Planner dashboard, sprint board, backlog, timeline, or task preview.
---

# Planner UI

1. Use the project's existing `planner:ui` package script or its referenced start script. Never invent a second preview command or root.
2. Read the configured host and port, inspect the exact listener, and avoid duplicate processes.
3. For a restart, stop only the verified Planner UI process on that exact port, then start the project script as a hidden background process with project-owned logs.
4. Verify HTTP 200 and one representative sprint/task route. Report the URL and PID.
5. The preview is read-only. Do not mutate Planner lifecycle state to make the UI look correct.

The same preview exposes `/vault`, `/vault/search`, and `/vault/graph` when the
consumer has a configured Vault and installed runtime. With external Planner
storage, keep `PLANNER_PROJECT_ROOT` bound to canonical tasks and
`PLANNER_CONSUMER_PROJECT_ROOT` bound to the consumer checkout. Set `VAULT_CONFIG`
to the same config used by that checkout's native Vault (default:
`vault.config.json`). Relative config/launcher paths resolve from the consumer.
For a shared or custom package install, set `PLANNER_VAULT_PREVIEW_LAUNCHER` to
its exact launcher. Standard `node_modules`, `.tools/node_modules`, and the
legacy `.tools/vault-runtime/node_modules` layouts are discovered locally;
do not infer a runtime by searching sibling projects.
Article and asset views read the configured Vault roots, resolved relative to
the config file, rather than the Planner data root. Catalog patterns/ignores,
root-contained paths and Markdown refresh apply to each collection; multiple
collections namespace file routes to distinguish identical relative paths.
It calls Vault's public MCP read contracts for status, ranked search, related
articles, and graph data; exact article browsing falls back to embedded
`.docs/knowledge` Markdown when the runtime is absent. Treat a missing runtime
as a visible limited-mode state, not permission to start a second dashboard.
Compare the displayed catalog with native Vault before declaring migration
complete; a zero-article fallback can indicate a missing runtime binding.

Knowledge links support `document.md#section-anchor`, `#L21`, `#L21-L25`, and
`#L21C5-L23C12`. Line citations open a bounded source excerpt; positions are
1-based Unicode code points. Use these forms instead of `::line:` references.
Obsidian block references use `Article.md#^block-id` or `[[Article#^block-id]]`;
the preview preserves the named block destination. Duplicate markers and markers
inside code examples are not unique navigable targets. Block navigation is not
transclusion: do not claim embeds are rendered merely because a link works.

Stored Vault files can display native image/audio/video controls when their
format is supported; other binaries are downloads. HTML/SVG must never execute
inside this preview. Codec support depends on the browser: verify a real
load/play/seek or download before claiming media acceptance. Import files with
Vault's native `vault_import_asset` route, not by copying into managed roots.
An imported media file is evidence, not automatic OCR/transcription or analysis.
