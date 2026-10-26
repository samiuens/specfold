## Delta

```yaml
ops:
  - op: create
    path: capabilities/specfold-hooks.md
    type: Capability
    summary: Why Specfold ships its own git and Claude Code hook entry points, and where their contract lives.
  - op: update
    path: architecture/specfold-cli.md
    type: Component
    summary: Add the hooks module to the module table.
  - op: update
    path: decisions/commit-convention.md
    type: Decision
    summary: The commit check now runs through hooks.extra.commit-msg instead of .githooks.
empty_reason: ""
```

## Notes

None.
