---
plannerFormat: 1
id: ABI-045
artifact: analysis
project: ABI
profile: high-assurance
revision: 1
status: Blocked
sprintId: ABI-S1
dependencies:
  - ABI-038
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-045 analysis

## Verified current state

- ABI-038 already supplies six lab-only authored forms and a bounded `LabPlayerEvolution` owner with named attack/aura sockets, deterministic construction, animation, and exact subtree disposal.
- The lab URL currently selects only authored form starts. Production `PlayerUnit`, combat state, and save DTO do not contain visual evolution identity.
- Adding literal authored forms every 1000 levels would create at least 37 forms by the measured 36,365-level reference and would keep growing. That is not a bounded design.
- A minor-detail step can instead be derived from the current level and applied only inside the lab prototype. No schema change is required.

## Approach

- Compare 100, 200, and 250-level detail cadence inside one 1000-level interval.
- Prototype one representative interval using a finite reusable detail palette and replacement at the next major form.
- Prefer the coarsest cadence that still reads from normal framing. Initial hypothesis: 200 levels gives four intermediate states plus the endpoint; 100 creates nine intermediate states and excess QA/visual noise, while 250 gives only three and may feel too sparse.
- Keep major authored forms finite. Treat a 1000-level interval as transition timing, not as permission to author an unbounded new major mesh every 1000 levels.

## Risks

- Too many small attachments can obscure the silhouette and make upgrades visually meaningless.
- Accumulating meshes forever would leak the design budget even if disposal is technically correct.
- A literal major form per 1000 levels shifts the cost from runtime to unbounded art and QA authoring.
- Detail identity derived from level must clamp at the interval endpoint and remain stable across reload without a save field.

## Decision

**GO, bounded.** Use a 200-level cadence inside a representative 1000-level transition: four intermediate detail states, then replace the whole authored form at the endpoint. Keep at most four transition details alive and reuse one finite palette. Derive the state from level; do not persist it.

The 100-level option creates nine intermediate states and excessive visual/QA noise. The 250-level option creates only three and is less perceptible. Literal new authored forms every 1000 levels are rejected because the catalogue would grow without bound; production work must keep an explicitly finite set of major forms.
