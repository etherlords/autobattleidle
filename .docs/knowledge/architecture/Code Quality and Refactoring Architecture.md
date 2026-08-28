---
vaultFormat: 1
project: autobattleidle
vaultId: AUTOBATTLEIDLE-DOC-20260828-ECBD82
kind: architecture
status: active
summary: >-
  Ownership-first TypeScript refactoring rules, pattern-selection boundaries,
  blocking gates, and behavior-preserving proof.
tags:
  - architecture
  - code-quality
  - refactoring
  - typescript
---
# Code Quality and Refactoring Architecture

## Summary

Ownership-first TypeScript refactoring rules, pattern-selection boundaries, blocking gates, and behavior-preserving proof.

## Purpose

Keep Autobattle Idle readable and extensible without replacing small deterministic code with pattern ceremony. Refactors preserve gameplay, save compatibility, presentation semantics, and the module ownership in [[architecture/Technical Architecture|Technical Architecture]].

## Ownership and module shape

- Organize by responsibility and mutable-truth owner, not by file length alone.
- `src/domain` keeps immutable serializable contracts and pure deterministic policies. Split combat contracts, balance, enemy progression, attacks, and upgrades into owner modules with one public barrel.
- `src/game` owns Three.js view objects, animation, scene attachment, and idempotent disposal. The battlefield orchestrates identity replacement; each enemy view owns its subtree.
- `src/ui` owns DOM components and listener lifecycle. Battle status, upgrade dialog, and event log own their subtrees; the HUD composes them.
- `src/persistence` separates versioned DTO/validation, migrations, and browser storage lifecycle. Supported historical saves remain valid.
- `src/app` remains a thin composition root and does not absorb domain, view, or persistence details.
- Shared `types.ts`, `helpers.ts`, or `shared` files are not default dumping grounds. Put a named contract or helper beside its owner; extract only when more than one local module consumes it.

## Classes, composition, and pure functions

Use a class when an object owns mutable state, subscriptions, Three.js/DOM resources, animation state, or ordered disposal. Use composition for optional visual layers such as grade, modifier, and seeded decoration cues. A small typed factory or registry selects among several real view products.

Keep deterministic formulas, validation, selection, formatting, and immutable state transitions as pure functions. Plain save DTOs and snapshots remain plain data. Do not introduce a base combat-unit class or inheritance hierarchy until at least two runtime unit types share a proven lifecycle/behavior contract. A class-based God object is not an improvement over a functional God file.

Builders are justified only for multi-step construction with required invariants or resource ownership. Do not replace a readable object literal with a builder. Typed lookup tables are preferred for finite exhaustive data mappings; strategies/factories are preferred when products or behavior genuinely differ.

## Readability rules

- Public and cross-module contracts have explicit names. Do not expose indexed-access aliases such as `BattleSnapshot["enemy"]`.
- Nested ternaries are prohibited. Resolve decisions with named policies, lookup tables, or readable branches.
- Switches are acceptable only for small exhaustive state transitions. Repeated product construction or behavior selection uses an exhaustive typed registry/strategy.
- Production files at 300 lines and functions at 80 lines are mandatory review triggers, not automatic proof of bad design. New complexity requires a recorded split or conscious keep decision.
- Authored colors, dimensions, offsets, scales, timing, and animation rates live in named owner-local configuration. Do not create a global bag of constants or meaningless aliases for ordinary arithmetic.
- One significant lifecycle/view class per file. Small owner-local types and pure helpers stay colocated when splitting would only add navigation.
- Domain imports no DOM or Three.js. UI/game/persistence do not mutate combat truth. App may import all layers only for composition.

## Automated gates

The blocking quality command remains `pnpm check` and must include strict TypeScript, ESLint, Prettier check, Vitest, and production build.

ESLint must block nested ternaries, TypeScript indexed-access types in production contracts, ignored compiler diagnostics, unsafe assertions, explicit `any`, excessive complexity/depth, and upward/cross-layer imports that violate the ownership graph. Prefer built-in ESLint and the installed TypeScript tooling; add a dependency or custom script only when an invariant cannot be expressed correctly by existing tools.

Numeric file/function thresholds remain review triggers because a blanket rule creates artificial fragmentation. Architecture that is not syntactically unambiguous—component ownership, correct factory use, resource disposal, and pattern justification—requires focused tests plus independent review instead of a brittle text scan.

## Refactor proof

The refactor is behavior-preserving:

1. Record the green baseline and characterization tests before moving ownership.
2. Move one responsibility at a time while preserving public behavior.
3. Keep deterministic combat snapshots and fixed-roll progression outputs identical.
4. Keep save v1/v2/current load, migrate, save, and reload behavior identical.
5. Keep enemy visual specs, stable seeds, scene-child bounds, animation cues, and disposal behavior identical.
6. Keep HUD pointer/keyboard/modal/accessibility/listener behavior identical on desktop and 390px layouts.
7. Require focused tests, `pnpm check`, independent review, independent browser QA, and deployed Pages proof.

## Non-goals

- No gameplay rebalance, Golden Bug implementation, new unit type, new animation feature, save schema change, UI redesign, engine migration, or package split.
- No mandatory class, factory, decorator, builder, or inheritance quota.
- No copy of Dungeon Crawler engine-specific Stage2D/Stage3D APIs.

## Related

- [[architecture/Technical Architecture|Technical Architecture]]
- [[quality/Testing Strategy|Testing Strategy]]
- [[design/Enemy Tiers and Boss Cadence|Enemy Tiers and Boss Cadence]]
