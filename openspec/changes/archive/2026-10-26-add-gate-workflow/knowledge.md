## Delta

```yaml
ops:
  - op: update
    path: capabilities/specfold-gate.md
    type: Capability
    summary: Add the Markdown summary, the workflow and its comment, and the merge queue behavior.
  - op: update
    path: decisions/blocking-merge-gate.md
    type: Decision
    summary: Name the workflow files, the required job and how fork PRs get their summary.
empty_reason: ""
```

## Notes

The test PR results go into this change's PR description.
