## Delta

```yaml
ops:
  - op: update
    path: capabilities/specfold-migrate.md
    type: Capability
    summary: The inventory lists an existing bundle's concepts and indexes, and install takes its types and folders into specfold.yaml.
  - op: update
    path: capabilities/specfold-hooks.md
    type: Capability
    summary: Hooks relieve expected findings while a migration's conversion is under way; pre-push and the gate stay strict.
  - op: create
    path: decisions/existing-bundle-migration.md
    type: Decision
    summary: A migration rewrites an existing OKF bundle into Specfold types and folders, removes the originals and rewrites references to them.
  - op: create
    path: decisions/plan-aware-link-relief.md
    type: Decision
    summary: Rejected - validate reading the migration plan to excuse only links to planned targets; hooks relieve by conversion state instead.
  - op: update
    path: commitments/migrate-an-existing-okf-bundle.md
    type: Deferred Commitment
    summary: Fulfilled by add-okf-bundle-migration; replacing originals became the default rather than an opt-in.
  - op: update
    path: backlog/rewrite-old-decision-references-in-code.md
    type: Backlog Item
    summary: Migrations now rewrite references to moved concepts; renames outside a migration still need this item.
  - op: update
    path: architecture/agent-layer.md
    type: Component
    summary: sf-migrate has an existing-bundle path in its plan, conversion and report references.
empty_reason: ""
```

## Notes

- Alternatives the user turned down in the brief (keeping types by default, keeping concepts in place, keeping originals until an opt-in) go into the body of `decisions/existing-bundle-migration.md` as considered options.
- The commitment moves to `state: fulfilled`; `committed_by` is left to a human, as before.
