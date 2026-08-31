# ABI-020 reviewed measurement receipt

Reviewed: 2026-09-01
Task: ABI-020
Brief revision: 19
Persistence impact: no schema change
Source receipt: generated MEASURED-REPORT.json (not copied into Vault)

## Accepted production calibration

- Visual automatic cadence: 3 Hz.
- Automatic throughput curve: 0.1 APS base, asymptotic 12 APS ceiling.
- Target hits: normal 1, veteran 5, elite 10, boss 30.
- Golden Bug remains the calibration anchor and is measured separately from ordinary cohorts.
- Upgrade purchases skip non-visible intermediate levels and charge their combined cost, so each paid purchase advances at least one displayed gameplay quantum.
- Production critical and armor-penetration policies remain asymptotic. Linear-capped alternatives were each measured over 3,000 ordinary encounters and rejected.

## Real-time checkpoints

| Hours | Encounter | APS | Coins | Saturated |
| ---: | ---: | ---: | ---: | :---: |
| 1 | 21 | 0.1 | 0 | no |
| 4 | 39 | 0.1107003697 | 45 | no |
| 8 | 70 | 0.1756756757 | 949 | no |
| 24 | 1,200 | 9.8835037795 | 4,598,449 | no |
| 48 | 24,920 | 11.9950010258 | 6,977,238,310,062 | no |
| 49 | 30,234 | 11.9950010258 | 15,058,740,324,353 | no |

The 48-hour checkpoint is the configured start of endgame by elapsed real time, not a target encounter number.

## Golden Bug high-APS receipt

- Health: 2,993,419.
- Automatic-only: 120 packets, 2,055,960 damage, escape, zero reward.
- Manual plus automatic: 174 packets, 2,994,402 damage, defeat, one 60,050 reward.

## Gates

- Exact production oracle and event-jump final state match at 1, 4, 8, 24, 48, and 49 hours.
- Warmed 48-hour event-jump: 1.524 seconds, below the 2.5-second budget.
- Focused ABI-020 suite: 64/64.
- Full repository gate: 20 files, 178/178 tests; lint, formatting, Worker TypeScript, application TypeScript, and production build passed.
- Independent review v11: APPROVE, no P0-P3 findings.
- Independent QA v11: PASS.
