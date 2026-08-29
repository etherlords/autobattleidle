# ABI-014 deployed verification receipt

- Checkpoint SHA: `195e965704aac142194fb3e877c4a911bb4af410` (`HEAD == origin/main`).
- CI: run `33224695027`, job `99025886653`, completed successfully.
- GitHub Pages: run `33224695066`, job `99025886908`, completed successfully.
- URL: `https://etherlords.github.io/autobattleidle/`; real Chromium; 1280x720.

## Public acceptance

- Fresh storage loaded `Normal Ash Wisp · Level 1` at 10/10. Nine one-at-a-time keyboard attacks left 1/10 without transition. Space as the tenth accepted action advanced to `Veteran Ash Wisp · Level 2` at exactly 210/210.
- Four fresh-state attacks persisted V2 at 6/10; reload retained 6/10.
- The canonical V2 encounter-1 enemy was seeded at 84/140 with automation disabled for deterministic observation. The outgoing page's V2 `setItem` was blocked only during fixture-seed reload so its `pagehide` flush could not overwrite the fixture; the new page used normal storage APIs. It loaded 84/140, preserved the exact enemy values, and remained 84/140 after a second reload.
- Console: 0 errors and 0 warnings. Requests: no failed non-static requests.

## Harness notes

- A pointer-command loop that over-counted activations was discarded and is not acceptance evidence.
- A first historical-fixture attempt left automatic combat enabled and was discarded because observed damage was expected runtime progression, not save instability.
- Accepted fresh proof uses one-at-a-time keyboard actions through the focused battlefield. Accepted historical proof disables automatic combat without changing the 84/140 enemy semantics.

## Artifacts

- `abi014-deployed-1of10.png`
- `abi014-deployed-encounter2.png`
- `abi014-deployed-historical-84of140.png`
