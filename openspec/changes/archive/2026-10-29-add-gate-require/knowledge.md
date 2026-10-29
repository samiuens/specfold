## Delta

```yaml
ops:
  - op: update
    path: decisions/blocking-merge-gate.md
    type: Decision
    summary: specfold gate require makes the check required through its own ruleset; init offers it, doctor warns without it.
  - op: update
    path: capabilities/specfold-gate.md
    type: Capability
    summary: The gate require subcommand, its ruleset and why it goes through gh.
  - op: update
    path: capabilities/specfold-init.md
    type: Capability
    summary: init --require-gate, and why a refusal is a skipped step instead of an error.
  - op: update
    path: capabilities/specfold-doctor.md
    type: Capability
    summary: D7 reads the default branch's rules and skips quietly offline.
empty_reason: ""
```

## Notes

None.
