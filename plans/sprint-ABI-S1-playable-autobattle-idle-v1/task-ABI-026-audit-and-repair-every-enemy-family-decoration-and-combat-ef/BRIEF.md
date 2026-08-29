---
plannerFormat: 1
id: ABI-026
artifact: brief
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies:
  - ABI-007
  - ABI-022
  - ABI-023
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-026: Audit and repair every enemy family, decoration, and combat effect for semantic visual readability

## Goal

Audit and repair every enemy family, decoration, and combat effect for semantic visual readability

## Work item

- Type: bug
- Priority: high
- Status: Ready

## Acceptance criteria

- [ ] A canonical audit matrix inventories every current enemy family, grade, deterministic variant, modifier decoration, and spawn/attack/hit/critical/death effect from domain selection through builder/spec attachment and rendered runtime receipt; every mismatch has a traced code-level root cause.
- [ ] At desktop and narrow viewports, every current family is recognizable from silhouette and authored parts without relying on its HUD label, including boss Hydra and Colossus; variants are materially distinguishable rather than palette-only or imperceptible primitive changes.
- [ ] Decorations use family-local named anchors with correct position, scale, and orientation; shield cues read as shields and provide multiple deterministic arrangements with bounded orbit or levitation motion where the design calls for it.
- [ ] Every family has a visible, bounded, family-appropriate spawn, attack, hit, critical, and death response; motion communicates the event while reduced-motion mode retains a clear non-motion cue.
- [ ] The audit verifies calculations for seed-to-variant selection, attachment transforms, animation timing, effect lifetime, and disposal; deterministic tests fail on missing families, invalid transforms, invisible timing ranges, unbounded objects/listeners, or repeated command replay.
- [ ] The implementation reuses the existing Unit MVC, enemy visual builders/decorators, shared family identity, and presentation event stream; domain remains Three.js/DOM-free and no parallel visual state owner is introduced.
- [ ] Historical supported saves load, render the same deterministic identity, save, and reload without schema loss; no schema change is preferred unless the audit proves it unavoidable and then requires an explicit versioned migration.
- [ ] Independent visual review and browser QA provide before/after receipts for every family and effect class at 1280x800 and 390x844, including console/network health, resource bounds, reduced motion, and exact-SHA Pages proof.

## Dependencies

- ABI-007
- ABI-022
- ABI-023

## Related knowledge

- AUTOBATTLEIDLE-DOC-20260827-A7FD1F
- AUTOBATTLEIDLE-DOC-20260827-85CBFC

## Constraints

- Follow the resolved workflow contract and project instructions.
