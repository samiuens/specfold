## Delta

```yaml
ops:
  - op: create
    path: capabilities/specfold-graphify.md
    type: Capability
    summary: Why graphify setup is one CLI step, code-only, with a guard that never fails for teammates without graphify.
  - op: update
    path: decisions/graphify-code-only.md
    type: Decision
    summary: Record the commands checked with 0.9.97, the wrapped guard, cluster-only for the report and graphify-out/ ignored.
  - op: update
    path: capabilities/specfold-stats.md
    type: Capability
    summary: The per-skill budget also skips graphify's skill.
  - op: update
    path: capabilities/specfold-migrate.md
    type: Capability
    summary: The settings merge adds missing deny rules.
  - op: update
    path: architecture/specfold-cli.md
    type: Component
    summary: Add the graphify module.
empty_reason: ""
```

## Notes

None.
