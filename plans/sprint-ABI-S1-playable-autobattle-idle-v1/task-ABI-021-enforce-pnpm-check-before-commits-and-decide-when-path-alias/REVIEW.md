---
plannerFormat: 1
id: ABI-021
artifact: review
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-015
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-021 review

## Verdict

PASS — one bounded checkout-portability repair resolved the initial finding; fresh re-review found no new issues.

## Findings

- P1: `.githooks/pre-commit` is new mode `100644`; this clone has `core.autocrlf=true` and no `.gitattributes`. A checkout can therefore lose executable mode and/or change the shebang to CRLF. The smoke masks both conditions by copying the current file and forcing mode `0755`.
- Required repair: add an EOL attribute that forces the tracked hook to LF, stage it with executable mode, and prove staged mode/EOL through a fresh checkout or equivalent checkout-aware smoke.
- Accepted: the hook invokes only `pnpm check`; repair guidance is explicit; the installer is local/idempotent; smoke is isolated/non-publishing; CI independently runs `pnpm check`; no dependency, scanner, alias, or lint-config change was added.
- Alias decision: keep relative paths. Measured production imports use at most two parent segments, and existing layer rules keep ownership direction visible.

## Re-review

- `.githooks/pre-commit` is staged as mode `100755`; staged and working hook hashes match.
- `.gitattributes` forces `.githooks/*` to `text eol=lf`; cached attributes and byte inspection prove LF with no CR.
- The isolated smoke sets `core.autocrlf=true`, stages mode `100755`, checks out the hook without chmod masking, verifies LF, and retains red/green/no-index-mutation/no-commit proof.
- Full diff has no scope regression: CI remains independent and unchanged; no scanner, dependency, alias, or lint-config change was added.
