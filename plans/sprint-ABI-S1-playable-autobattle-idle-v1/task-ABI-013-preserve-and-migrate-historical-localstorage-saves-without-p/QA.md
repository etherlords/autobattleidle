---
plannerFormat: 1
id: ABI-013
artifact: qa
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

# ABI-013 qa

## Verdict

PASS — independent local production-equivalent browser acceptance passed. Public GitHub Pages repetition remains a post-push Manager release gate, not a local QA blocker.

## Evidence

- Commands: `pnpm check` passed lint, formatting, 19/19 tests, strict TypeScript and Vite production build; focused persistence tests passed; local production preview ran at `http://127.0.0.1:4173/`. Existing >500 kB chunk advisory only.
- Supplied legacy V2 import: seeded the exact boss JSON at `etherlords.autobattleidle.save` with versioned V2 absent. Reload created valid `etherlords.autobattleidle.save.v2`; UI showed `Coins: 25` and `Boss Ash Wisp · Level 30 · boss`; the source string remained byte-identical.
- Versioned V2 precedence: after a valid V2 with 25 coins existed, changed legacy V2 to a valid 999-coin save. Reload kept the 25-coin versioned state and did not rewrite it.
- Stable V2 reload: second reload retained boss encounter 30 and the supplied upgrade semantics.
- Authentic V1 migration: seeded exact `src/persistence/fixtures/save-v1.json` into `.save.v1`. Reload produced V2 with coins 7, encounter 1, health 84/140, damage level 1, critical level 1, double-reward level 2, and armor penetration 0.
- V1 retention: browser assertion reported `sourceExact: true`; all 351 source bytes remained unchanged through migration and reload.
- Accessible repair: emptied V2 and injected one transient V2 write failure so repair remained available. The native `button.restore-progress` was focused and activated with keyboard Enter; polite status became `Progress restored from the previous version.`
- Repair result: V2 validated, V1 stayed byte-identical, and a second reload retained coins 7 and encounter 1.
- Transient race: browser Storage-prototype failure simulation plus the focused automated regression proved Restore before queued retry does not downgrade the supplied legacy V2.
- Console: 0 errors and 0 warnings. Viewport: desktop production preview.
- Artifacts: `output/playwright/abi013-a-v2-import.png`, `output/playwright/abi013-a-v2-import-precedence.png`, `output/playwright/abi013-b-v1-exact-fixture.png`, `output/playwright/abi013-b-v1-migration.png`, `output/playwright/abi013-b-restore-keyboard.png`.
- Independent QA made no source, test, Planner, Vault, Git, or `.playwright-cli/` mutation. Only the named `output/playwright/` evidence files were created; `.playwright-cli/` remains excluded.
- Elapsed: approximately 8 minutes.

## Release follow-up

After the coherent commit is pushed and Pages is green, Manager must repeat the supplied unversioned-V2 import/retention/reload and V1 migrate/corrupt/keyboard-Restore/reload flows on the public URL before final release proof is complete.
