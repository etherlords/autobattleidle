---
plannerFormat: 1
id: ABI-000
artifact: implementation_guide
project: ABI
profile: high-assurance
revision: 1
status: Ready
sprintId: ABI-S1
dependencies: []
requiredGates:
  - implementation-self-check
  - independent-review
  - independent-qa
  - verification
  - manager-closure
---

# ABI-000 implementation-guide

## Frozen scope

Create and link only the knowledge gaps needed to make ABI-001..ABI-007 implementable: module ownership, save schema, decisions, test/release proof, vocabulary, and entry navigation. Preserve the seed design articles and do not change game code, dependencies, Planner lifecycle, or remote trackers.

## Implementation sequence

1. Keep `design/` as the product/design leaf taxonomy.
2. Create `architecture/`, `decisions/`, `quality/`, `operations/`, and `reference/` articles through Vault MCP.
3. Add durable links from the project map and overview to the authoritative articles, then add focused links from design articles to their dependent contracts.
4. Run Vault graph export and doctor; record exact tools, skipped tools, evidence, review, and QA in Planner artifacts.

## Verification matrix

| Acceptance | Proof |
| --- | --- |
| Non-flat taxonomy and documented gaps | Vault article metadata and graph export |
| Technical, persistence, decisions, quality, operations, glossary coverage | Canonical Vault article reads |
| Only Vault mutations and optimistic hashes | Vault tool receipts plus Planner event |
| No unresolved links or format errors | `vault_graph_export` and `vault_doctor` |
| Independent gates and closure | Planner REVIEW, QA, VERIFICATION, gate records, and lifecycle readback |
