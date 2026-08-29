---
plannerFormat: 1
id: ABI-007
artifact: review
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

# ABI-007 review

## Verdict

CHANGES_REQUIRED — no product defect found; the release-evidence plan is not yet traceable enough for independent QA and exact-SHA closure.

## Findings

1. P1: add a case-to-criterion deployed QA table covering the 35-45% automatic bar, every enemy body/modifier/seeded decoration across reload, each named effect, and oldest-supported V1 migration/reload. Every row needs a production-valid fixture, action/time, expected value or visual oracle, viewport, and retained artifact.
2. P1: define the exact-SHA Pages binding procedure: resolve closure SHA, match both CI and Pages `headSha`, retain run IDs/URLs, wait for that Pages run, then execute deployed proof and record asset names after the matching deployment.
3. P2: define the canonical timeline location and row schema: task, status, gate verdict, actor, timestamp, evidence, and unresolved debt.

Verified pass areas: ABI-007 lifecycle/dependencies are correct; source/Vault/ABI-011 packets are unchanged; ABI-019/ABI-020 edits and ABI-011 QA artifacts remain isolated; published Git and GitHub receipts are consistent. One documentation/evidence-plan repair is required before QA.

## Fresh re-review

CHANGES_REQUIRED — the case matrix resolves the original traceability, SHA-binding, and timeline-shape findings, but its cooldown oracle misreads the 35-45% requirement. The automatic bar container must remain within roughly 35-45vw at each supported viewport; only its fill decreases to zero and resets after one automatic attack. The bounded repair/re-review cycle is exhausted, so this remains the exact blocker for user direction.

## User-authorized re-review

CHANGES_REQUIRED — the automatic-bar oracle is corrected. Two new P1 evidence-plan gaps remain: distinguish independent pre-closure QA from the Manager-owned post-deploy exact-SHA recheck, and explicitly prove active V3 Golden Bug reload preserves identity/resume state while reconstructing a fresh deadline without persisting the old deadline. No product defect was found; QA cannot start until these oracles are frozen.

## Fresh independent re-review after second P1 repair

PASS — no P0/P1/P2 findings.

- Independent pre-closure QA is explicitly distinct from the Manager-only exact-closure-SHA recheck (IMPLEMENTATION-GUIDE.md:55, 74).
- Active V3 Golden Bug reload preserves identity/resume state, omits the old deadline, and reconstructs a fresh deadline (IMPLEMENTATION-GUIDE.md:63; UI, Persistence, and QA.md:84).
- The corrected container/fill oracle, case matrix, SHA binding, and timeline schema are concrete and consistent (IMPLEMENTATION-GUIDE.md:61, 85).
