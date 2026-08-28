---
plannerFormat: 1
id: ABI-005
artifact: qa
project: ABI
profile: high-assurance
revision: 2
status: Done
sprintId: ABI-S1
dependencies:
  - ABI-002
  - ABI-004
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-005 qa

## Verdict

PASS — local real-browser persistence acceptance completed independently.

## Evidence

- Fresh `pnpm check` passed: lint, format, 5 test files / 17 tests, TypeScript and Vite build
  (5.46 s wall). The existing 543.69 KB chunk advisory is unchanged. Focused persistence tests passed
  2/2 (0.257 s wall).
- Chromium at `http://127.0.0.1:5173/`, 1440x900 and 390x844: one attack changed HP 10/10 to
  9/10; after debounce schema-v1 localStorage contained canonical enemy/player/coins only, and reload
  restored 9/10.
- Instrumented `Storage.prototype.setItem`: one manual attack produced one debounced write. About
  1.8 seconds of automatic progression produced five writes matching five meaningful attacks; render
  frames produced no extra writes.
- Malformed `{bad` and unsupported `{"version":99}` payloads each loaded a safe 10/10 new game with
  no crash and left the invalid stored payload unchanged.
- Cancelled reset preserved live state and storage. Confirmed reset removed the save key and restored
  live state to 10/10 HP and zero coins.
- A valid automatic-unlocked save restored a visible cooldown and continued automatic attacks.
- Both viewports remained usable; browser console contained zero errors and zero warnings.
- Focused tests prove page-hide flush, failed-write preservation, reset removal, listener cleanup and
  idempotent disposal. QA was read-only; Playwright snapshots remained only in the pre-existing
  `.playwright-cli/`, which must not be staged.
