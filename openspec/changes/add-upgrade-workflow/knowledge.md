# Knowledge

## Delta

```yaml
ops:
  - op: create
    path: runbooks/turn-on-upgrade-prs.md
    type: Runbook
    summary: How a team turns on the weekly upgrade workflow, which token it needs, and what the workflow does with older PRs.
  - op: update
    path: architecture/upgrade-flow.md
    type: Data Flow
    summary: The weekly workflow, the session-start reminder with its daily cache, and the fixture job in the kit's CI.
  - op: update
    path: capabilities/specfold-init.md
    type: Capability
    summary: init --upgrade-workflow turns on the weekly upgrade workflow.
  - op: update
    path: capabilities/specfold-migrate.md
    type: Capability
    summary: migrate install --upgrade-workflow turns on the weekly upgrade workflow.
  - op: update
    path: capabilities/specfold-hooks.md
    type: Capability
    summary: The session-start hook reminds of a waiting release once a day.
  - op: update
    path: capabilities/specfold-upgrade.md
    type: Capability
    summary: The turned-on workflow file is upgraded from .specfold/workflows/.
  - op: update
    path: runbooks/cut-a-release.md
    type: Runbook
    summary: The upgrade-fixtures job runs on release PRs and becomes required at v0.1.0.
empty_reason: ""
```

## Notes

None.
