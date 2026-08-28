---
vaultFormat: 1
project: autobattleidle
vaultId: AUTOBATTLEIDLE-DOC-20260828-C8B5AA
kind: guide
status: active
summary: >-
  Readable exact-to-compact number formatting thresholds, suffixes,
  accessibility values, and verification rules for endless HUD values.
tags:
  - ui
  - hud
  - numbers
  - accessibility
  - balance
---
# HUD Number Display Policy

## Summary

Readable exact-to-compact number formatting thresholds, suffixes, accessibility values, and verification rules for endless HUD values.

## Purpose

Endless combat values must stay readable without hiding early-game differences or changing simulation data. This policy controls presentation only; domain and persistence values remain exact safe numeric state.

## Visible number policy

- Show exact grouped integers through 9,999: `999`, `1,000`, `3,000`, `9,999`.
- Start compact notation at 10,000, not 1,000: `10K`, `12.3K`, `100K`, `900K`.
- Use explicit suffixes by powers of 1,000: `K`, `M`, `B`, `T`, `Qa`, `Qi`, then continue with a documented finite suffix table. After the last supported suffix, use scientific notation such as `1.23e36`.
- Keep at most three significant digits and remove trailing zeroes.
- Promote the suffix after rounding, so `999,950` becomes `1M`, never `1000K`.
- Format both health operands independently with the same formatter: `900K / 1M`.
- Reject non-finite or negative display inputs at the UI boundary and render a safe em dash. Never expose `NaN` or `Infinity` as a game value.

The compact suffix table is a game contract. Do not use locale-dependent `Intl.NumberFormat` compact notation because its threshold and abbreviations vary by locale and commonly compact 1,000 too early. Locale-aware grouping may be used for the exact representation.

## Shared ownership

One shared `src/ui` formatter owns visible HP, damage, armor mitigation, rewards, coins, upgrade costs, and numeric combat-log values. Callers pass numbers; the formatter does not parse already assembled log strings. Timers are outside this policy and keep duration formatting such as `0.5s`, `12.3s`, and `1:05`.

The minimum useful result carries both compact and exact text, for example `{ text: "900K", exact: "900,000" }`. Reuse the existing UI ownership boundary; do not introduce a dependency or a formatting framework.

## Accessibility and exact-value access

- Health progress elements retain exact numeric `aria-valuenow` and `aria-valuemax`.
- Accessible names describe exact current and maximum values.
- Compact visible values expose the grouped exact value through an accessible name or `title` where appropriate.
- Compact formatting must not change purchase logic, persistence, comparisons, rewards, or combat math.

## Required boundary examples

Cover at least `0`, `999`, `1_000`, `9_999`, `10_000`, `10_049`, `99_950`, `100_000`, `999_949`, `999_950`, `1_000_000`, `1_234_567`, and `Number.MAX_SAFE_INTEGER`, plus `NaN` and positive/negative infinity. Include health pairs `1,000 / 3,000`, `900K / 1M`, and a nearly-full compact bar.

Browser acceptance checks HP, coins, costs, rewards, logs, full accessible values, and no horizontal overflow at 390px and desktop widths.

## Sources

- [ECMA-402 NumberFormat](https://tc39.es/ecma402/#numberformat-objects)
- [MDN Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat)
- [WAI-ARIA meter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/meter/)

## Related

- [[design/UI, Persistence, and QA|UI, Persistence, and QA]]
