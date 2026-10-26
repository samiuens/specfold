## Delta

```yaml
ops:
  - op: create
    path: capabilities/specfold-audit.md
    type: Capability
    summary: Why audit reports slow decay in the bundle, and where the contract for specfold audit lives.
  - op: update
    path: architecture/specfold-cli.md
    type: Component
    summary: Add the audit module to the module table.
empty_reason: ""
```

## Notes

Running the new command on the kit itself will report real findings (for example drafts older than 30 days do not exist yet, but orphans may); the PR lists them.
