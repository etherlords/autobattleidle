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

Knowledge links support `document.md#section-anchor`, `#L21`, `#L21-L25`, and
`#L21C5-L23C12`. Line citations open a bounded source excerpt; positions are
1-based Unicode code points. Use these forms instead of `::line:` references.
