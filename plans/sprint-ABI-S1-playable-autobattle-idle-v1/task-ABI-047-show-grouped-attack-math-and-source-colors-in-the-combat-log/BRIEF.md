---
plannerFormat: 1
id: ABI-047
artifact: brief
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-020
  - ABI-035
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
workspaceProject: autobattleidle
---

# ABI-047: Show grouped attack math and source colors in the combat log

## Goal

Show grouped attack math and source colors in the combat log

## Work item

- Type: task
- Priority: normal
- Status: Ready

## Acceptance criteria

- [ ] Visible hit rows no longer contain the source prefixes `Manual hit` or `Automatic hit`; both use one concise `Hit` label.
- [ ] Manual and automatic hit rows are visually distinguishable by stable source-specific colors without parsing message text, and the source remains available to assistive technology so color is not the only accessible signal.
- [ ] A grouped automatic tick visibly explains its composition as `Hit: <base damage> × <attack units> = <final damage>`; a single attack avoids redundant `×1` noise.
- [ ] Integral multipliers render without trailing decimals and fractional attack-unit multipliers render with at most two decimal places, without floating-point tails or misleading rounded totals.
- [ ] The displayed final damage equals the actual aggregate damage applied by that controller event, including fractional packets, independent critical rolls, armor, Golden Bug combat, and kill transitions; presentation never recalculates combat truth from DOM text.
- [ ] Kill and reward rows retain their existing reward meaning while removing redundant manual/automatic wording and preserving source styling.
- [ ] Focused presenter/controller/HUD tests cover manual, single automatic, grouped integral, grouped fractional, mixed critical/armor, kill, Golden Bug, compact-number, and accessible source cases.
- [ ] Independent browser QA verifies readable source colors and grouped math on desktop and narrow layouts at representative 3.3, 6, and 10+ APS cases with no combat, save, or event-order regression.

## Dependencies

- ABI-020
- ABI-035

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260831-48D708
- AUTOBATTLEIDLE-DOC-20260827-584401
- AUTOBATTLEIDLE-DOC-20260828-C8B5AA

## Constraints

- Follow the resolved workflow contract and project instructions.
