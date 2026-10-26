## Delta

```yaml
ops:
  - op: create
    path: capabilities/specfold-sync.md
    type: Capability
    summary: Why sync applies the mechanical part of a knowledge delta after archive, and where its contract lives.
  - op: update
    path: architecture/specfold-cli.md
    type: Component
    summary: Add the sync module to the module table.
empty_reason: ""
```

## Notes

From this change on, the kit's own Workflow follow-up runs `specfold sync` instead of setting card links by hand.
