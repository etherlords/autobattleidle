# ABI-008 fresh local QA receipt

Date: 2026-08-28 (Asia/Tashkent). URL: `http://127.0.0.1:4174/`.
Browser: Playwright CLI via `npx --yes --package @playwright/cli playwright-cli`, isolated session `abi008pass`.

## Commands

`pnpm dev -- --port 4174`; Playwright `open --headed`, `resize`, `snapshot`, `eval`, `click`, `press`, `reload`, `screenshot`, `console`; `pnpm vitest run src/persistence/persistence-boundary.test.ts src/ui/hud.test.ts src/app/application.test.ts`; `pnpm check`.

## Matrix

| Acceptance                  | Result / exact receipt                                                                                                                                                                                                                                               |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial hidden modal        | PASS at 1280x800 and 390x844: `hidden:true`, computed `display:none`; no permanent Attack button.                                                                                                                                                                    |
| Pointer attack exactly once | PASS desktop: before `health 100 of 140`; real `click canvas`; after `health 99 of 140`; one `Manual hit: 1 damage`.                                                                                                                                                 |
| Enter/Space exactly once    | PASS focused `.battlefield` (`tabIndex=0`): Enter 99->98 and one log entry; Space 98->97 and one log entry.                                                                                                                                                          |
| Launcher/modal              | PASS desktop+narrow: real launcher click opened modal, close focused; explicit Close restored `.upgrades-launcher`; Escape restored launcher focus. Costs/disabled reasons visible in snapshots.                                                                     |
| Modal click-through         | PASS: while open, real `click canvas` timed out with modal intercepting pointer events; HP remained 100/140 and log unchanged.                                                                                                                                       |
| Layout/passive layers       | PASS: document scroll dimensions exactly viewport at 1280x800 and 390x844; health/auto bars and status/log `pointer-events:none`; desktop HP width 1154px; auto bar 514px (40.2vw); narrow log/launcher bounds did not overlap.                                      |
| Repeated lifecycle/reload   | PASS: open/close via Close, open/Escape, reload; modal hidden after reload, no Attack button, no scroll.                                                                                                                                                             |
| Console                     | PASS: `console` reported 0 messages, 0 errors, 0 warnings.                                                                                                                                                                                                           |
| Persistence                 | PASS V2 browser reload: health 96/140 and save present before reload, same 96/140 after reload. Malformed recovery and V1 migration covered by persistence boundary suite (12/12). V1 browser reload was not claimed because pagehide can race a test-injected slot. |
| Manual vs auto countdown    | PASS by focused application integration tests: restored automatic cooldown startup and unlock cadence assertions passed; no production timer changes in ABI-008.                                                                                                     |
| Checks                      | PASS: focused 3 files, 12/12; `pnpm check` 20/20, build successful.                                                                                                                                                                                                  |

## Artifacts

- `abi008-local-pass-desktop-initial.png`
- `abi008-local-pass-desktop-modal.png`
- `abi008-local-pass-desktop-attack.png`
- `abi008-local-pass-narrow-initial.png`
- `abi008-local-pass-narrow-modal.png`
- `abi008-local-pass-reload.png`

Failed-run artifacts remain unchanged. `.playwright-cli` remains excluded and untouched. No source, Planner/Vault, dependency, or Git changes were made by QA.

Verdict: PASS for local QA; no P0-P3 findings.
