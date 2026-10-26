## Delta

```yaml
ops:
  - op: create
    path: capabilities/specfold-tasks.md
    type: Capability
    summary: Why tasks.md is a checked breakdown of task groups, and where the contract for tasks check, status and resume lives.
  - op: update
    path: decisions/task-breakdown.md
    type: Decision
    summary: Point at the archived spec; note that change check and G18 come with their own changes.
  - op: update
    path: architecture/specfold-cli.md
    type: Component
    summary: Add the tasks module to the module table.
empty_reason: ""
```

## Notes

The kit's own `specfold.yaml` gains the `tasks:` limits with their defaults, so the keys are visible.
