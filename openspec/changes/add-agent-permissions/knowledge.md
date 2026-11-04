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
    path: architecture/upgrade-flow.md
    type: Data Flow
    summary: The upgrade's follow-up commands include permissions sync.
  - op: update
    path: decisions/upgrade-file-classes.md
    type: Decision
    summary: The settings merge leaves the patterns permissions sync owns to it.
  - op: update
    path: backlog/agent-permissions-in-specfold-yaml.md
    type: Backlog Item
    summary: Promoted to add-agent-permissions.
empty_reason: ""
```

## Notes

The reference update is task group 1, because the pattern table in design.md depends on it. The other concepts are written in the Knowledge group.

Found while implementing:

- `:*` is only an end-of-rule wildcard in Claude Code, so the delete form `git push origin :branch` can't be written as a rule; it stays uncovered (design Risks).
- `--follow-tags` has one dash before `tags`, so `*--tags*` misses it; push-tags has two patterns.
- The file I/O of the sync lives in `src/permissions/sync.ts`, apart from `command.ts`: migrate install is imported by the CLI's skew check, so importing the command module there would close an import cycle.
- The sync rewrites `.claude/settings.json` as two-space JSON on a change, which expands the template's hand-formatted one-line entries.
