# ABI-008 local QA receipt

Date: 2026-08-28 (Asia/Tashkent)
URL: http://127.0.0.1:4173/
Browser: Playwright CLI via `npx --yes --package @playwright/cli playwright-cli`

## Commands

- `pnpm dev -- --port 4173`
- `npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:4173/ --headed`
- `resize 1280 800`, `resize 390 844`, `snapshot`, `screenshot --filename ...`
- `eval`, `click`, `press Enter`, `press Space`, `reload`, `console`

## Acceptance matrix

| Criterion                                                      | Result              | Evidence                                                                                                                                                                                                                |
| -------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canvas pointer exactly-one attack / no permanent Attack button | FAIL                | At 1280x800, `click 'canvas'` timed out because hidden `.upgrades-modal` intercepted pointer events. `Attack` button query returned null.                                                                               |
| Focused Enter and Space attacks                                | PASS                | `.battlefield` focused (`tabIndex=0`); Enter changed HP 140 -> 139 and added one log event; Space changed 139 -> 138 and added one event.                                                                               |
| Passive bars/log and layout                                    | PASS (health check) | At 1280x800 and 390x844, document scroll dimensions equaled viewport; status/log computed `pointer-events:none`; narrow geometry had no overlap.                                                                        |
| Upgrades modal open/close, focus, click-through                | FAIL                | Initial page screenshot visibly showed the `hidden` modal contents. Launcher click timed out due modal interception. Explicit Close was reachable by role and restored focus to launcher after forced/role interaction. |
| Desktop visual                                                 | FAIL                | `abi008-local-desktop-initial.png` shows modal controls rendered on initial load.                                                                                                                                       |
| Narrow visual                                                  | FAIL                | `abi008-local-narrow-initial.png` shows modal controls rendered on initial load.                                                                                                                                        |
| Persistence V2 / malformed recovery                            | PASS (bounded)      | Seeded supported V2, reload displayed saved coins and loaded state; malformed V2 reload replaced invalid payload with a valid V2 fallback.                                                                              |
| Persistence V1 migration                                       | INCONCLUSIVE        | Attempted fixture seed; pagehide persistence from prior running state overwrote the slot during reload, so no acceptance claim.                                                                                         |
| Console                                                        | PASS                | `playwright-cli console`: 0 messages (0 errors, 0 warnings) in observed runs.                                                                                                                                           |

## Findings

- P1: `.upgrades-modal[hidden]` remains displayed and intercepts the battlefield/launcher. Computed style at initial load: `display:flex`, `visibility:visible`, `pointer-events:auto`, `hidden:true`, viewport-sized fixed rect. This blocks the primary pointer attack and makes the initial UI visually invalid.
- P1: Because the hidden modal is viewport-sized, the launcher cannot be opened through a real pointer click; modal click-through prevention cannot be accepted.

## Artifacts

- `abi008-local-desktop-initial.png`
- `abi008-local-desktop-modal-open.png`
- `abi008-local-narrow-initial.png`
- `abi008-local-narrow-v1-migrated.png`
- Playwright CLI snapshots remain under the excluded user-owned `.playwright-cli` tree and were not edited/staged.

Verdict: FAIL (P1 findings; no P0/P2/P3 observed).
