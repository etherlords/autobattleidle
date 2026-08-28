---
plannerFormat: 1
id: ABI-015
artifact: qa
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-008
  - ABI-009
  - ABI-013
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-015 qa

## Verdict

CHANGES_REQUIRED — expanded visual QA found one P2 narrow-layout clipping defect.

## Evidence

- QA owner: `abi015_independent_qa`; source, Planner, Vault, and Git remained read-only.
- Fresh `pnpm check`: ESLint, Prettier, 23/23 tests, TypeScript, and production build passed.
- Desktop `1280x720` and narrow `390x844` at `http://127.0.0.1:5187`: manual pointer and Enter attacks, automatic attacks, normal/veteran/elite grades and modifiers, upgrade purchase, accessible dialog open/Escape/focus restoration, and responsive layout passed.
- Save compatibility: malformed `{not-json` recovered safely; a valid V2 encounter-34 fixture transitioned `Normal Ash Wisp · Level 34` to `Boss Ash Wisp · Level 35 · boss` after one pointer attack, preserving the `Manual kill: +41 coins` event and boss body/armor cue on both viewports.
- Resource/lifecycle proof: 100 dialog open/close cycles kept canvas `1 -> 1` and DOM nodes `58 -> 58`; post-boss-transition state remained canvas `1`, DOM nodes `53`; console errors were `0` on the valid app port.
- Initial bounded run was BLOCKED only because it did not reach a boss. The same independent QA owner resumed with the compatible deterministic fixture and completed the missing transition/cue proof without code changes.
- Expanded user-requested visual audit found the player and ordinary enemy clipped at `390x844`; the boss body and crown are also partially outside the viewport. Fixed actor positions at `x = +/-1.7` combined with the narrow camera aspect are the likely cause. Repair and a fresh independent visual QA matrix are required.
- Artifacts remain excluded under `.playwright-cli/`, including `page-2026-08-28T20-25-47-383Z.png`, `page-2026-08-28T20-26-38-118Z.png`, `page-2026-08-28T20-32-56-508Z.png`, and `page-2026-08-28T20-32-38-607Z.yml`.
- Failure artifact: `.playwright-cli/page-2026-08-28T20-35-42-460Z.png`.
