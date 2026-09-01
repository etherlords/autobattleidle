---
plannerFormat: 1
id: ABI-043
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-020
  - ABI-028
  - ABI-040
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-043 analysis

## Verified current state

- `spawnEnemy` routes a production boss through `productionBaseHealth`, which ignores encounter and returns current player damage multiplied by the fixed `bossTargetHits = 30`.
- The authentic encounter-2170 V3 fixture stores the accepted pre-player-relative boss at `19,373,445` max HP and `1,805,505` current HP. The current V3-to-V4 path preserves its health fraction but normalizes it to the roughly-30-hit boss, explaining the observed collapse to only hundreds of thousands of HP.
- The previous boss curve still exists in `legacyMultiplier`: encounter-linear base health multiplied by `10 + 120*i + 5*i^2` for zero-based boss index `i`. It is already safe-saturated, deterministic, stage-aware, and produces the exact authentic encounter-2170 value.
- Ordinary health, Golden Bug health, rewards, armor, upgrade formulas, and the ABI-028 exact/event-jump telemetry are separate existing owners and must not be retuned here.
- Persistence impact is a compatible semantic normalization with no save-shape/version change. Existing V4 player-relative bosses and historical V3 bosses both need explicit recognition and health-fraction normalization; valid source bytes must remain untouched.

## Approach

- Use the existing legacy boss curve as the stage-growth ceiling, the current 30-base-hit formula as the non-regression floor, and a calibrated expected automatic-DPS envelope between them. The envelope composes existing damage, effective boss armor, penetration, critical chance, and APS owners rather than duplicating attack rules.
- The envelope target is 180 seconds of expected automatic damage. This is calibrated from the authentic encounter-2170 legacy boss (`19,373,445` HP divided by its real expected automatic DPS), not selected as an unrelated multiplier. It must reproduce that legacy anchor while preventing the 77.5-minute first-boss wall measured for the uncapped legacy curve.
- Measure automatic-only, manual-only, and combined boss TTK at representative stage bosses, including the authentic encounter-2170 snapshot, before accepting the formula. The boss must be materially tougher than adjacent ordinary enemies but remain finite and beatable.
- Extend the existing simulator/report surface only as much as needed to emit boss TTK receipts and prove exact/event-jump agreement, continued 48/49-hour progression, and unchanged ordinary/Golden cohorts.
- Add one compatibility path for the immediately previous player-relative boss representation and normalize both prior representations by remaining-health fraction into the accepted boss. Do not bump V4 or add stored fields.

## Risks

- Restoring the old curve can materially slow every 35th encounter; exact and fast-forward receipts must prove no unwinnable wall and continued progress after 48 hours.
- The literal uncapped legacy curve is rejected evidence: it produced a 4,650,000 ms first-boss automatic TTK, only 0.361858 APS at 48 hours, and captured only two of six stages by 49 hours. It must not be reintroduced.
- If save validation recognizes the new formula only, currently deployed V4 boss saves would reset. Compatibility recognition is therefore acceptance-critical, not optional cleanup.
- Boss measurement must not accidentally include Golden Bug or ordinary cohorts, and fractional high-APS packets must keep their current exact accounting.
