## Delta

```yaml
ops:
  - op: create
    path: capabilities/specfold-gate.md
    type: Capability
    summary: Why specfold gate gives one merge verdict, and where the contract for its rules lives.
  - op: update
    path: architecture/specfold-cli.md
    type: Component
    summary: Add the gate module and the shared git and OpenSpec helpers to the module table.
empty_reason: ""
```

## Notes

The kit's own CI starts running the gate in `add-gate-workflow`; until then the PR lists a manual run on the kit.
