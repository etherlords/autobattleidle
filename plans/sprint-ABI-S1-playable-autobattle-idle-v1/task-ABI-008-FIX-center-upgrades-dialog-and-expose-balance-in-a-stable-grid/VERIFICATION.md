---
plannerFormat: 1
id: ABI-008-FIX
artifact: verification
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

# ABI-008-FIX verification

## Acceptance evidence

- Source: `src/ui/hud.ts`, `src/style.css`, `src/ui/hud.test.ts`. Centered bounded card, duplicated snapshot-driven modal Coins, fixed two-row title/price actions, accessible hidden reasons, U toggle and target-guarded backdrop dismissal use the existing HUD owner with no persistence schema change.
- Implementation self-check: focused HUD 4/4; full `pnpm check` 20/20 plus build; `git diff --check` passed after final user-feedback revision.
- Independent review run 3: APPROVED, no P0-P3; two-line/accessibility, fixed geometry, U/backdrop event routing and cleanup verified.
- Independent local QA v2: PASS at 1280x800 and 390x844; receipt `output/playwright/abi008-fix-v2-local-qa-receipt.md`; screenshots `abi008-fix-v2-local-desktop-initial.png`, `abi008-fix-v2-local-desktop-modal.png`, `abi008-fix-v2-local-narrow-modal.png`.
- Candidate SHA: `baf9ab17b36c0d3d870ef8429e1f73c05e5bec46`; pushed to `origin/main`.
- GitHub Actions: CI `33199133975` / job `98943847015` success; Pages `33199133922` / job `98943847291` success.
- Public URL: `https://etherlords.github.io/autobattleidle/?sha=baf9ab17b36c0d3d870ef8429e1f73c05e5bec46`.
- Deployed browser: centered desktop card x336 y207.61 w608 h384.78, two equal 76px columns; narrow card x12 y130.02 w366 h583.95, one 332px column with equal 68px controls; two visible rows/no Need, accessible reasons, matching Coins, U/backdrop/card behavior, pointer/Enter/Space exactly once, V2 reload 137/140, no overflow, console 0 errors/warnings and static assets HTTP 200.
- Deployed receipt/screenshots: `output/playwright/abi008-fix-v2-deployed-qa-receipt.md`, `abi008-fix-v2-deployed-desktop-initial.png`, `abi008-fix-v2-deployed-desktop-modal.png`, `abi008-fix-v2-deployed-narrow-modal.png`.
- Candidate `d113abc52eec3551c59db90ee787ec5d000efc0d` is not release evidence: CI `33197933439` failed only Prettier on the local QA receipt, then user feedback changed the bytes. Corrected candidate above is green.
- Planner/Vault defect evidence: Planner mutations intermittently returned `EBUSY` unlinking `.planner-cache/index.sqlite`; exact canonical readbacks proved committed mutations and `planner_doctor` remained healthy with `recovery.required=false`; no mutation was blindly retried.

## Sign-off

- Reviewer: APPROVED — run 3, no P0-P3.
- QA: PASS — fresh local v2 and exact-SHA deployed browser proof.
- Manager close: ready after Planner verification and Manager closure gates.
