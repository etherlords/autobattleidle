---
plannerFormat: 1
id: ABI-008-FIX
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-008
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-008-FIX qa

## Verdict

PASS — fresh isolated local browser QA; no P0-P3 findings.

## Evidence

- Receipt: `output/playwright/abi008-fix-local-qa-receipt.md`.
- Desktop 1280x800: native hidden modal; full backdrop; centered 608x384.78 card at viewport midpoint; two equal columns and six 76px controls; modal Coins matched HUD.
- Narrow 390x844: bounded 366x583.95 card; one 332px column and six 68px controls; document scroll exactly matched viewport.
- Close and Escape restored launcher focus; modal intercepted canvas clicks; after close one pointer action produced exactly one hit.
- Supplementary fresh browser session `abi008kbd2`: Enter `140/140 -> 139/140` with one log item; Space `139/140 -> 138/140` with exactly one additional item; focus remained battlefield; no duplicates.
- V2 reload preserved `138/140`; focused tests 12/12; `pnpm check` 20/20 plus build; console 0 errors/warnings.
- Screenshots: `abi008-fix-local-desktop-initial.png`, `abi008-fix-local-desktop-modal.png`, `abi008-fix-local-desktop-reopen.png`, `abi008-fix-local-narrow-modal.png`.
- QA made no source, Planner/Vault, dependency, Git, or `.playwright-cli` mutations. Public/deployed proof remains Manager-owned.

### Run 2 — user-feedback revision

- PASS: `output/playwright/abi008-fix-v2-local-qa-receipt.md`; no P0-P3 findings.
- All six buttons had exactly two visible rows (`TITLE - LEVEL`, `PRICE coins`), no visible Need/reason, retained accessible disabled reasons, equal 76px desktop and 68px narrow heights.
- Desktop card remained centered and two-column; 390x844 remained bounded, one-column and overflow-free; modal Coins matched HUD.
- Real U opened/focused Close; repeated U closed/restored launcher with no attack. Card click stayed open; backdrop click closed/restored focus without HP/log change.
- After close canvas `140 -> 139`, Enter `139 -> 138`, Space `138 -> 137`, exactly one event each. Reload retained `137/140` and hidden modal.
- Console 0 errors/warnings; focused tests 12/12; `pnpm check` 20/20 plus build.
- Screenshots: `abi008-fix-v2-local-desktop-initial.png`, `abi008-fix-v2-local-desktop-modal.png`, `abi008-fix-v2-local-narrow-modal.png`.
