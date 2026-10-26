## Delta

```yaml
ops:
  - op: update
    path: capabilities/specfold-gate.md
    type: Capability
    summary: Add why G7 checks human claims against the PR author and approvers, and how reviews count.
  - op: update
    path: architecture/specfold-cli.md
    type: Component
    summary: Add the claims and GitHub parts of the gate module.
empty_reason: ""
```

## Notes

The real check on GitHub (a draft PR with a stranger's `verified`) happens in `add-gate-workflow`, once the workflow passes `--pr`.
