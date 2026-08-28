---
plannerFormat: 1
id: ABI-013
artifact: verification
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-005
  - ABI-006
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-013 verification

## Acceptance evidence

- Persistence impact: **schema migration plus compatibility relocation**. Authentic Git V1 (`0c66fce`) migrates one version to V2; an already-V2 payload under historical key `etherlords.autobattleidle.save` is validated/imported directly, not sent through the V1 adapter.
- Slot contract: V1 `etherlords.autobattleidle.save.v1`, current V2 `etherlords.autobattleidle.save.v2`, and historical unversioned compatibility source. Valid V2 wins; otherwise legacy valid V2 precedes V1. Source keys are never removed or rewritten.
- Ordering: `src/app/application.ts` resolves persistence before battlefield, HUD, render loop, autosave subscription, and pagehide handling.
- Safe publication: target V2 is encoded/validated before one storage write; failed writes preserve usable in-memory state, retain source bytes, and schedule bounded retry. Bootstrap and Restore share source precedence.
- Repair UI: native Restore is exposed only while V2 needs repair, activates through pointer or keyboard, and reports through a polite live status. It cannot replace valid V2 or downgrade valid legacy V2 to stale V1.
- Fixtures: `save-v1.json`, `save-v2.json`, and the user-supplied `legacy-save-v2.json` are consumed by tests. The supplied fixture preserves coins 25, boss encounter 30, health 10793/19980, automatic speed 4, armor penetration 7, critical 5, damage 14, and double reward 6.
- Manager command: `pnpm check` passed ESLint, Prettier, 19/19 Vitest tests, strict TypeScript, and Vite production build. Existing >500 kB chunk advisory is unchanged and non-blocking. `git diff --check HEAD` passed.
- Review: Run 4 independently approved the complete diff with no P0-P3 findings after verifying every prior finding and the transient Restore-before-retry race.
- QA: independent production-preview Chromium proof passed supplied legacy-V2 import, byte retention, second reload, valid-V2 precedence, authentic V1 migration, byte retention, empty/invalid V2 repair, keyboard Restore, second reload, transient write failure, and 0 console errors/warnings.
- Visual readback: Manager inspected `output/playwright/abi013-a-v2-import.png` and `output/playwright/abi013-b-restore-keyboard.png`; they show the supplied boss state/25 coins and focused Restore with restored V1 state/status respectively.
- Planner recovery: authorized journal `ae10f264-aa1a-4d6d-9731-87157e6c0853` was promoted only after exact revision/hash checks. Before/prepared survivors remain under `.planner/recovery-survivors/`; Planner doctor is recovery-clean. Windows EPERM/EBUSY receipts and no-data-loss readbacks are in `PROGRESS.md`.
- Vault: `AUTOBATTLEIDLE-DOC-20260827-E27CD3` and `AUTOBATTLEIDLE-DOC-20260827-85CBFC` define the versioned slots, unversioned V2 compatibility import, precedence, retention, retry, migration, repair, and release regression rules.
- Scope: no ABI-014 or other implementation, dependency, worktree, gameplay rebalance, or HUD redesign was added. `.playwright-cli/` remains untracked/excluded from the checkpoint.
- Release follow-up: after commit/push and green Pages, Manager must repeat both source paths on the public URL and append the deployment/run receipt; local verification does not substitute for that public proof.

## Sign-off

- Reviewer: PASS — independent Run 4, no P0-P3 findings.
- QA: PASS — independent local production browser acceptance.
- Manager verification: PASS — full-diff, executable, Planner/Vault, and representative visual evidence mapped to every ABI-013 criterion.
- Manager close: PASS — distinct `abi013-manager-closure` gate recorded; ABI-013 advanced to `Done` at task revision 15 and progress revision 49. Coherent commit/push and public Pages proof remain mandatory release follow-up before the overall checkpoint is declared delivered.
