# Tool flow reference

## Source routing

| Question | First source |
|---|---|
| Where is a class defined/used? | RepoMapper/source search |
| Why does the class exist and what rules apply? | Vault knowledge |
| Was there a related bug/review/incident? | Vault work-record collection |
| What is the active task and next gate? | Planner |
| Exact known canonical Vault relative path | Resolve configured Vault root, then direct file read (no search) |
| Exact source-code path/class usage | RepoMapper/source search or direct source read |
| Known metadata/path/link constraints | `vault_query` first (no preliminary semantic search) |
| Unknown article name / descriptive architecture question | `vault_search(auto)` |

## Vault tools

- `vault_search`: ranked discovery, multiple hits, confidence, next action.
- `vault_get_article`: bounded canonical Markdown by stable ID; default and
  evaluation slice are at most 200 lines, then request one further slice only
  when necessary. Its optional `locator` accepts heading anchors, `L21`,
  `L21-L25`, and `L21C5-L23C12`; positions are 1-based Unicode code points.
- `vault_get_summary`: compact deterministic summary with source hash.
- `vault_get_related`: one-hop links and backlinks.
- `vault_status`: catalog, graph, and index health.
- `vault_doctor`: read-only structural validation.
- `vault_migration_plan`: dry-run adoption classification.
- `vault_create_article`, `vault_update_article`, `vault_add_link`: canonical
  writes with index refresh.
- `vault_store_asset`: portable UTF-8 artifact/example plus a metadata article;
  keep findings in a separate analysis article that links the asset.
- `vault_delete_article`: guarded recoverable trash operation.
- `vault_index`: derived-index reconciliation; use embeddings after external
  content changes.

## Artifact authority

- `knowledge`: intended current architecture/decision/guide authority.
- `work-record`: task, incident, implementation, review, QA, handoff, or debt;
  use as historical/current execution evidence according to status.
- `source`: migrated mirror; verify whether a curated synthesis supersedes it.
- `artifact` / `example`: preserved raw evidence excluded from content ranking;
  metadata is discoverable, while a linked analysis article carries conclusions.
- generated summary/index: navigation only; read canonical evidence for
  consequential claims.

## Failure handling

- Missing article ID: search again or report stale/broken reference.
- Low confidence: broaden terminology, inspect multiple hits, then report the
  uncertainty.
- Dirty external files: index/flush or use direct reads.
- Write hash conflict: reread, reconcile intentionally, never overwrite.
- Index failure after a Markdown write: Markdown remains authoritative; report
  stale derived state and rerun indexing.
