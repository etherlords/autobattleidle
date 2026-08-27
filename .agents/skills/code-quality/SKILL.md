---
name: autobattle-code-quality
description: Apply when implementing or reviewing Autobattle Idle TypeScript, architecture, persistence, or tests.
---

# Autobattle Code Quality

Read `AGENTS.md` and the active task packet first.

- Locate the current state owner and analogous code before adding anything.
- Domain simulation stays pure and deterministic; presentation receives snapshots/events.
- Parse and validate unknown data once at the boundary, then use stable named TypeScript types.
- Prefer one responsibility per module and readable helpers over nested inline conditions or giant
  returned object literals.
- Use a builder only when it centralizes actual validation or multi-step construction used more than
  once; do not add pattern ceremony to plain data.
- Keep balance constants centralized and test formulas with deterministic inputs.
- Persistence must be versioned, validated, recover safely from malformed data, and never lose a good
  save because a write partially failed.
- Add the smallest focused regression test that proves the behavior, then run `pnpm check`.
