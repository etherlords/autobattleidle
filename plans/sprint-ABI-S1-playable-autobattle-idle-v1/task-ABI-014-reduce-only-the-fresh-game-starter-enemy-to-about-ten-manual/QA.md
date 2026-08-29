---
plannerFormat: 1
id: ABI-014
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-013
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-014 qa

## Verdict

PASS — independent local production Chromium acceptance. CI/Pages and public deployed proof remain Manager-owned.

## Evidence

- URL `http://127.0.0.1:4173/`, real Chromium via Playwright CLI.
- Fresh storage loaded the starter at 10/10. Nine real canvas clicks left 1/10 without transition; the tenth advanced to encounter 2, `Veteran Ash Wisp`, at 210/210.
- Four real clicks produced a versioned V2 save at 6/10; reload retained 6/10.
- The canonical historical/current V2 encounter-1 fixture loaded at 84/140 and remained 84/140 across a second reload with persisted enemy values intact.
- Desktop 1280x720 and narrow 390x844 passed. Console: 0 errors and 0 warnings. Requests: no failures.
- `pnpm check` passed lint, format, 13 test files / 68 tests, strict TypeScript, and Vite build.
- Receipt: `output/playwright/abi014-qa-receipt.md`. Screenshots: `abi014-fresh-10of10.png`, `abi014-partial-before-reload.png`, `abi014-historical-84of140.png`, `abi014-historical-stable.png`, `abi014-mobile-390.png`, and `abi014-desktop-1280.png`.
- QA made no source, dependency, Planner, Vault, Git, or `.playwright-cli` mutation. The detailed artifact write used the documented narrow Markdown fallback after Planner doctor confirmed `recovery.required=false`; the typed independent-QA PASS gate is canonical lifecycle evidence.
