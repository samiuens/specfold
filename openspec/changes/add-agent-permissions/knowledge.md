## Delta

```yaml
ops:
  - op: create
    path: decisions/agent-permissions.md
    type: Decision
    summary: Outward-facing agent actions are declared once in specfold.yaml and rendered into Claude Code rules; prefix rules are best effort, AGENTS.md is the contract.
  - op: create
    path: decisions/permission-rules-tracked-in-manifest.md
    type: Decision
    summary: "Rejected: tracking the rendered permission rules in the install manifest; the sync owns its fixed patterns instead."
  - op: create
    path: capabilities/specfold-permissions.md
    type: Capability
    summary: Why permissions sync exists, its owned patterns per action, the push sub-action rule and where its contract lives.
  - op: update
    path: capabilities/specfold-init.md
    type: Capability
    summary: init's setup steps now include the permissions sync.
  - op: update
    path: capabilities/specfold-migrate.md
    type: Capability
    summary: install runs the permissions sync after the settings merge and reports an invalid setting as a conflict.
  - op: update
    path: capabilities/specfold-upgrade.md
    type: Capability
    summary: The settings merge leaves owned permission patterns to the sync, which runs as a follow-up command.
  - op: update
    path: capabilities/specfold-doctor.md
    type: Capability
    summary: D8 compares the permissions setting with the rendered Claude Code rules without running a child process.
  - op: update
    path: references/claude-code.md
    type: Reference
    summary: Permission rule syntax, prefix and wildcard matching, and the deny-ask-allow order, checked against the current docs.
  - op: update
    path: backlog/agent-permissions-in-specfold-yaml.md
    type: Backlog Item
    summary: Promoted to add-agent-permissions.
empty_reason: ""
```

## Notes

The reference update is task group 1, because the pattern table in design.md depends on it. The other concepts are written in the Knowledge group.
