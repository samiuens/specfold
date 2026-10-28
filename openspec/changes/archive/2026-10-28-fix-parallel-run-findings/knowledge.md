## Delta

```yaml
ops:
  - op: update
    path: architecture/agent-layer.md
    type: Component
    summary: Implementers keep their worktree branch, sf-apply cleans merged worktrees per round, background subagents own the branch, the main session runs the retro.
  - op: update
    path: capabilities/specfold-tasks.md
    type: Capability
    summary: Packets mark finished tasks; T10 and T11 read files relative to the Specfold root.
  - op: update
    path: capabilities/specfold-wt.md
    type: Capability
    summary: Add wt clean --base for cleaning during a run.
  - op: update
    path: backlog/fix-the-parallel-run-findings.md
    type: Backlog Item
    summary: Close the item; this change fixes all eight findings.
empty_reason: ""
```

## Notes

None.
