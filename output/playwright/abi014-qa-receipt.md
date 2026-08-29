# ABI-014 independent QA receipt

Verdict: PASS (local production preview; deployed CI/Pages proof not run by delegated QA)

Date: 2026-08-29; URL: `http://127.0.0.1:4173/`; browser: real Chromium via `@playwright/cli`; source root: `C:\\wrk\\etherlords\\autobattleidle`.

## Acceptance matrix

| Criterion                        | Scenario/evidence                                                                                                                                                                                                                                       | Result |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Fresh baseline starter           | Cleared localStorage, reloaded: `10/10`. Clicked canvas ref `e3` exactly 9 times: `1/10`, encounter remained 1. Tenth canvas click: `Veteran Ash Wisp`, encounter 2, `210/210`; events show five visible manual hits plus kill in bounded event list.   | PASS   |
| Scope/later enemy                | Encounter 2 visibly loaded at unchanged `210/210`; deterministic suite included in `pnpm check` (68 tests).                                                                                                                                             | PASS   |
| Partial current reload           | Four real canvas clicks: `6/10`; `localstorage-get` showed V2 payload with enemy health 6/maxHealth 10; reload retained `6/10`.                                                                                                                         | PASS   |
| Historical/current compatibility | Seeded V2 key `etherlords.autobattleidle.save.v2` with canonical fixture enemy `84/140`, version 2 (automation disabled for deterministic observation); reload showed `84/140`; second reload remained `84/140`. Persisted bytes retained enemy values. | PASS   |
| Responsive/error sanity          | 390x844 and 1280x720 screenshots; console reported `Total messages: 0 (Errors: 0, Warnings: 0)`; requests showed no failed requests.                                                                                                                    | PASS   |
| Static/project check             | `pnpm check`: lint, format, 13 test files / 68 tests, TypeScript build and Vite production build all passed.                                                                                                                                            | PASS   |

## Artifacts

- `abi014-fresh-10of10.png`
- `abi014-partial-before-reload.png`
- `abi014-historical-84of140.png`
- `abi014-mobile-390.png`
- `abi014-desktop-1280.png`

## Exact commands/scenarios

- `pnpm preview --host 127.0.0.1 --port 4173`
- `npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:4173 --headed`
- `playwright-cli localstorage-clear`, reload, snapshot; nine `click e3`; snapshot; tenth `click e3`; snapshot.
- Four further `click` actions, snapshot, `localstorage-get etherlords.autobattleidle.save.v2`, screenshot, reload, snapshot.
- Fixture setup used only browser `localStorage` for the requested compatibility fixture; reload, snapshot, byte inspection, second reload, screenshot.
- `resize 390 844` and `resize 1280 720`; screenshots; `console`; `requests`.
- `pnpm check`

## Scope and unused tools

No Planner/Vault mutations, source/dependency edits, Git operations, staging, or `.playwright-cli` file edits were performed. CI/Pages and deployed-public proof were not run because this delegated QA lane is local acceptance only and has no publication authorization. No Playwright test file was added; CLI-first browser proof was explicitly required.
