## Delta

```yaml
ops:
  - op: update
    path: capabilities/specfold-doctor.md
    type: Capability
    summary: D3 finds a repository-local OpenSpec before install; D4 accepts the hook-manager entries install writes.
  - op: update
    path: capabilities/specfold-hooks.md
    type: Capability
    summary: Hook manager files keep their formatting; the Claude stop hook summarises long finding lists but still blocks.
  - op: update
    path: capabilities/specfold-index.md
    type: Capability
    summary: A see knowledge pointer may list several paths, and every path is indexed.
  - op: update
    path: capabilities/specfold-log.md
    type: Capability
    summary: Creating the log also refreshes the root index, so G2 does not block after the first entry.
  - op: update
    path: capabilities/specfold-new.md
    type: Capability
    summary: Every type gets a sources stub; the per-type defaults are documented for agents.
  - op: update
    path: capabilities/specfold-migrate.md
    type: Capability
    summary: Migration state is ignored from start on, CLAUDE.md gets no duplicate import, and source globs come from workspaces.
  - op: update
    path: capabilities/specfold-init.md
    type: Capability
    summary: Source globs are detected from package.json and pnpm workspaces before the fixed folder list.
  - op: update
    path: conventions/code-comments.md
    type: Convention
    summary: A see knowledge pointer may list several comma-separated paths, as the shipped convention allows.
  - op: create
    path: decisions/splice-hook-manager-yaml.md
    type: Decision
    summary: hooks install inserts its entries as text at parsed offsets instead of re-serialising the YAML; other serialiser options were rejected.
empty_reason: ""
```

## Notes

All fixes come from the feedback on the first real migration (v0.2.1). The existing-bundle migration path is recorded as the deferred commitment `/commitments/migrate-an-existing-okf-bundle.md`, and the remaining ideas as backlog items.
