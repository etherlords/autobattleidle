# ABI-008-FIX v2 local QA

Date: 2026-08-28. URL `http://127.0.0.1:4183/`; isolated Playwright session `abi008v2`; server stopped.

| Scenario                     | Result / exact evidence                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Initial desktop 1280x800     | PASS: modal `hidden=true`, computed `display:none`, rect 0x0; no Attack button; document scroll 1280x800.                                                                                                                                                                                                                                                                      |
| Six upgrade rows/reasons     | PASS: all six buttons had exactly two visible children `.upgrade-title` and `.upgrade-price`; examples `Unlock automatic attack - 0` + `1 coins`, `Damage - 0` + `2 coins`. Visible child rows contain no `Need`/reason. Disabled accessible names/titles retained `Need N coins` / `Requires automatic attack unlock`. Equal button heights 76px; grid `283.797px 283.812px`. |
| Centered card/Coins          | PASS: desktop backdrop 0,0,1280x800; card `.upgrades-dialog` x336 y207.61 w608 h384.78, midpoint 640,400; in-modal `Coins: 0` matched HUD `Coins: 0`.                                                                                                                                                                                                                          |
| Narrow 390x844               | PASS: backdrop full viewport; card x12 y130.02 w366 h583.95; one-column grid `332px`; six button heights all 68px; page scroll exactly 390x844.                                                                                                                                                                                                                                |
| U key lifecycle              | PASS: closed state HP 140/140 empty log; real `U` opened and focused Close with HP/log unchanged; repeated `U` closed and restored launcher focus without attack.                                                                                                                                                                                                              |
| Modal pointer semantics      | PASS: real click inside `.upgrades-dialog` did not close. Real mouse down/up at backdrop (50,50) closed, restored launcher focus, HP/log remained 140/140/empty.                                                                                                                                                                                                               |
| Close/Escape/canvas/keyboard | PASS: Escape and Close restore focus; canvas click after close HP 140->139 with one log event; focused Enter 139->138 with one additional event; Space 138->137 with one additional event.                                                                                                                                                                                     |
| Reload/persistence           | PASS: V2 save present; reload retained HP 137/140, modal hidden, no overflow. V1/malformed migration remains covered by persistence tests.                                                                                                                                                                                                                                     |
| Console/checks               | PASS: console 0 errors/0 warnings (2 non-error CLI messages); focused tests 12/12; `pnpm check` 20/20 and build passed.                                                                                                                                                                                                                                                        |

Artifacts:

- `abi008-fix-v2-local-desktop-initial.png`
- `abi008-fix-v2-local-desktop-modal.png`
- `abi008-fix-v2-local-narrow-modal.png`
- `abi008-fix-v2-local-qa-receipt.md`

Prior artifacts and `.playwright-cli` were preserved. No source, Planner/Vault, dependency, or Git mutations. Public proof not claimed.

Verdict: PASS; no P0-P3 findings.
