## Delta

```yaml
ops:
  - op: create
    path: capabilities/specfold-migrate.md
    type: Capability
    summary: Why the mechanical migration steps are CLI code and how install avoids overwriting a repo's files.
  - op: create
    path: decisions/managed-blocks.md
    type: Decision
    summary: Kit content inside files a repo owns lives between specfold markers, the only part upgrades rewrite.
  - op: update
    path: capabilities/specfold-gate.md
    type: Capability
    summary: Add the adoption PR exemption from G4.
  - op: update
    path: architecture/specfold-cli.md
    type: Component
    summary: Add the migrate module.
empty_reason: ""
```

## Notes

None.
