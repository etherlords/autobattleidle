# ABI-008-FIX v2 deployed verification

Date: 2026-08-28. Exact URL: `https://etherlords.github.io/autobattleidle/?sha=baf9ab17b36c0d3d870ef8429e1f73c05e5bec46`. Browser session: `abi008deploy`.

| Scenario                 | Result / evidence                                                                                                                                                                                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Desktop initial 1280x800 | PASS: HTTP shell rendered; modal hidden/display:none/0x0; no Attack button; no overflow (1280x800).                                                                                                                                                                                                                                        |
| Desktop modal            | PASS: backdrop 1280x800; card x336 y207.61 w608 h384.78, midpoint exactly 640,400; 2-column grid `283.797px 283.812px`; all six buttons height 76px. In-modal Coins `0` matched HUD. Each button had exactly `.upgrade-title` and `.upgrade-price`; visible text omitted Need/reason while accessible name/title retained disabled reason. |
| Modal pointer/lifecycle  | PASS: click inside `.upgrades-dialog` stayed open with HP 140/140 and empty log. Backdrop mouse down/up at (50,50) closed and restored launcher focus with HP/log unchanged.                                                                                                                                                               |
| U keyboard               | PASS: closed HP 140/140 empty log; U opened/focused Close with no state change; second U closed/restored launcher with no attack.                                                                                                                                                                                                          |
| Deployed attacks         | PASS: canvas click HP 140->139, one log; focused Enter 139->138, one additional log; Space 138->137, one additional log.                                                                                                                                                                                                                   |
| Narrow 390x844           | PASS: card x12 y130.02 w366 h583.95; one-column grid `332px`; all six buttons 68px; page scroll exactly 390x844. Screenshot captured.                                                                                                                                                                                                      |
| Reload persistence       | PASS: after attacks, reload retained HP 137/140, V2 save present, modal hidden, no overflow.                                                                                                                                                                                                                                               |
| Console/network          | PASS: console 0 errors/0 warnings. Static requests all HTTP 200: page, `assets/index-Cu2e7Rms.js`, `assets/index-Cx9rXFzS.css`, favicon (each observed twice across reload).                                                                                                                                                               |

## Artifacts

- `abi008-fix-v2-deployed-desktop-initial.png`
- `abi008-fix-v2-deployed-desktop-modal.png`
- `abi008-fix-v2-deployed-narrow-modal.png`
- `abi008-fix-v2-deployed-qa-receipt.md`

No source, Planner/Vault, dependency, Git, or `.playwright-cli` mutations. Prior artifacts preserved. CI/Pages receipts supplied by manager: CI `33199133975`, Pages `33199133922`, candidate SHA `baf9ab17b36c0d3d870ef8429e1f73c05e5bec46`.

Verdict: PASS — deployed behavior verified for the exact SHA; no P0-P3 findings. This is verification evidence, not Planner closure.
