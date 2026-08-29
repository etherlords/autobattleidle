---
plannerFormat: 1
id: ABI-007
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-006
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-007 analysis

## Verified current state

- Planner 1.1.2 is healthy for project `ABI`, sprint `ABI-S1`, with no recovery journal and one checkout.
- `planner_next_task` uniquely selected ABI-007 at Ready revision 3/progress revision 3 after claim; all dependencies are Done and no task has a foreign lease.
- ABI-011 is Done revision 15/progress 54 with no lease. Closure commit `d6521e0` is an ancestor of published `origin/main` `5a1b1ea`; CI and Pages succeeded for both SHAs.
- Vault is fresh and healthy: 14 articles, zero unresolved links, zero pending embeddings.
- The worktree intentionally contains only existing ABI-019/ABI-020 Planner edits, ABI-011 QA artifacts, Planner operation receipts, and this ABI-007 packet. Their preflight hashes were recorded before task work.
- ABI-020 remains Blocked on the unresolved 2100-second early-game auto-only TTK product decision and is out of scope.
- Independent deployed QA against `5a1b1ea` proved the codec, persistence, Golden Bug, HUD, and bounded browser paths that are observable, then correctly blocked the release matrix. `createBattleSnapshot` hardcodes every enemy name to `Ash Wisp`; screenshots show family bodies selected by `enemyVisualSpec` but several silhouettes, attachments, and commands remain abstract or non-animated; the canvas exposes no read-only family/effect receipt.
- The user explicitly authorized the product repairs required to finish ABI-007. The task resumed from Blocked with a fresh lease; the prior QA receipts remain failure evidence and will not be rewritten as a pass.

## Approach

- Repair the demonstrated release defects at their existing owners. Add one pure exhaustive family/label policy shared by snapshots and the visual spec; do not duplicate selection rules or change combat/save truth.
- Re-author the existing eight body factories and family-local anchors only enough for beetle, brute, wisp, mantis, sentinel, drake, colossus, and hydra to read as their names. Correct shield/decor transforms and add bounded family/body plus modifier motion through the existing builder command/tick lifecycle; do not add a second renderer or animation framework.
- Expose only read-only canvas metadata derived from already-rendered family/profile/effect state so deployed QA can bind screenshots to production identity. Do not expose mutable debug controls, scene objects, deterministic rolls, or simulation mutation.
- Run the canonical local gate, then independently review the release matrix and independently exercise the deployed Pages build at desktop and 390px widths.
- Bind every claim to exact URL, SHA, workflow run, viewport, action, expected result, actual result, console/network state, and artifact.
- Derive the project timeline from Planner activity only. Record non-blocking debt explicitly; do not invent missing gate outcomes.
- Persistence impact: no schema change. QA must still prove supported historical V1/V2 load/migrate/reload, current V3 reload, malformed/future recovery, and explicit V3-only reset.

## Risks

- Browser fixtures can become invalid if hand-authored outside production codecs; generate or validate fixtures through current code.
- HTTP 200, a screenshot, a green build, or a clean console cannot substitute for behavior proof.
- Dirty ABI-019/ABI-020 and ABI-011 artifacts must not be staged, rewritten, or mixed into ABI-007 publication.
- Published Pages may lag the pushed commit; closure waits for exact-SHA CI/Pages and deployed asset proof.
- Acceptance is broad. One bounded repair/re-review/retest is allowed only for a demonstrated product defect; otherwise report the exact blocker.
- Visual recognizability is screenshot acceptance, not a metadata-only assertion. Metadata may prove identity/variant/effect binding but cannot substitute for the independent visual verdict.
