---
plannerFormat: 1
id: ABI-013
artifact: implementation_guide
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

# ABI-013 implementation-guide

## Frozen scope

- ABI-013 only: version-addressed localStorage, compatibility import of valid V2 from `etherlords.autobattleidle.save`, deterministic V1 -> V2 migration before runtime/autosave, byte-preserved source values, safe V2 publication, accessible explicit Restore, golden fixtures, persistence/workflow docs, and deployed functional proof.
- No gameplay rebalance, HUD redesign, ABI-007+, backend, dependency, worktree, or unrelated cleanup. Preserve `.playwright-cli/` as excluded state.

## Implementation sequence

1. Add authentic V1 and current V2 fixtures plus slot-name constants in `src/persistence`; retain the existing app namespace.
2. Split source parsing from target reconstruction just enough to validate V1 once, derive V2 levels (`damage - 1`, `chance * 10`, armor penetration `0`), map the saved enemy explicitly, validate V2, and return a typed load/repair result.
3. Make startup resolve persistence before creating battlefield, HUD, animation frames, or autosave listeners. A valid versioned V2 wins; otherwise import a valid unversioned V2 before attempting V1 migration. A failed V2 publish leaves imported/migrated in-memory state usable and source bytes unchanged.
4. Save only to the V2 slot. Keep bounded retry behavior. Reset only the current slot. Never write/remove the V1 slot.
5. Add one native Restore button when V1 exists, with an accessible live result. Route it through application orchestration so successful repair replaces live state only after validation/write; failure reports and preserves current live state plus V1.
6. Add focused unit/integration tests and run `pnpm check`. Update the two linked Vault articles through Vault MCP with exact slot/bootstrap/repair semantics.
7. Hand off to fresh independent Reviewer, repair once if required, then fresh independent QA. Manager verifies, closes, commits/pushes, waits for CI/Pages, and repeats the seeded V1 -> V2 -> reload -> corrupt V2 -> Restore proof on the public URL.

## Verification matrix

- **Unit:** authentic V1 validation; supplied unversioned-V2 boss fixture import with exact semantic fields and raw-byte preservation; valid versioned V2 precedence; exact V1 field/level/default mapping; malformed/future rejection; deterministic one-step migration; V2 round trip; byte-identical sources after successful/failed publication and repair; throwing storage does not lose imported/migrated memory.
- **Integration:** persistence resolves before game/HUD/timers; valid versioned V2 wins normal startup; absent/invalid versioned V2 imports valid unversioned V2 before V1 fallback; second load uses stable versioned V2; Restore repairs missing/empty/invalid V2 and updates live state; accessible control/status; autosave/reset target V2 only.
- **Deployed:** on GitHub Pages first seed the supplied schema-V2 boss save under `etherlords.autobattleidle.save`, prove pre-runtime import, exact source-byte retention, semantic progress and second reload from versioned V2; then seed authentic V1, migrate, reload, corrupt V2, invoke Restore, verify progress/source retention, reload again, and capture zero relevant console errors plus CI/Pages receipts.
- **Release guard:** Planner preflight and Vault workflow explicitly classify future work as no schema change, compatible extension, or schema migration and require the matching historical fixture evidence.
