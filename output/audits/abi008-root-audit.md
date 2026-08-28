# ABI-008 and ABI-008-FIX root acceptance audit

Date: 2026-08-28. Baseline: Planner v1.1.1 consumer checkpoint
`6566aa33fcf67cc81c720630e32673d3db6d132d`. Audited closure:
`4d25f2a8442a9938e63f0690e57ecf69382517dd`.

## Verdict

- Specification: PASS. Canvas pointer, Enter and Space each issue exactly one attack; the passive HUD
  does not intercept input; the upgrades UI is a centered bounded modal with visible coins, stable
  two-row actions, responsive desktop/narrow grids, focus restoration, `U` toggle, and target-guarded
  backdrop dismissal.
- Engineering quality: PASS. No unresolved P0-P3 finding. The implementation stays in the existing
  HUD/CSS owners and adds no persistence schema or duplicate UI state owner.
- Release: PASS. `HEAD == origin/main == 4d25f2a8442a9938e63f0690e57ecf69382517dd` before this
  evidence-only audit checkpoint; only the excluded `.playwright-cli/` remained untracked.

## Fresh root evidence

| Requirement or risk               | Evidence                                                                                                              | Result |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------ |
| Build and repository checks       | `pnpm check`: lint, Prettier, 5 Vitest files / 20 tests, TypeScript and Vite build                                    | PASS   |
| Patch hygiene                     | `git diff --check 6566aa33..4d25f2a`                                                                                  | PASS   |
| Exact closure publication         | CI `33199664382`; Pages `33199664385`                                                                                 | PASS   |
| Exact candidate browser behavior  | `output/playwright/abi008-fix-v2-deployed-qa-receipt.md`; public candidate `baf9ab17b36c0d3d870ef8429e1f73c05e5bec46` | PASS   |
| Independent review                | ABI-008-FIX review run 3, no P0-P3                                                                                    | PASS   |
| Independent local and deployed QA | Desktop 1280x800, narrow 390x844, exact-once input, modal lifecycle, reload, console/network                          | PASS   |
| Canonical lifecycle               | ABI-008 revision 51 Done; ABI-008-FIX revision 59 Done; claims released                                               | PASS   |
| Documentation parity              | `.docs/knowledge/design/UI, Persistence, and QA.md` synchronized in this audit checkpoint                             | PASS   |

The original `delivery` step in ABI-008-FIX is intentionally cancelled and superseded by completed
`delivery-2`; it is not an incomplete gate. The earlier `d113abc` CI failure was formatting-only and is
not release evidence.

## Action items

1. Planner: repeated `EBUSY` while unlinking `.planner-cache/index.sqlite` after otherwise committed
   mutations needs a separate derived-index invalidation/retry regression. Canonical readback and
   `planner doctor` remained healthy, so this does not block the Autobattle release.
2. Existing Vite chunk-size warning (`index` about 551 kB) is non-blocking and should be addressed only
   if measured load performance becomes a problem; no speculative code splitting is required now.

## Next task

ABI-009 is the next dependency-ready implementation task. ABI-014 remains canonically Blocked and must
not be started merely because its listed dependency is complete; Planner state remains authoritative.
