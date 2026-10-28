# Knowledge

## Delta

```yaml
ops:
  - op: create
    path: capabilities/specfold-upgrade.md
    type: Capability
    summary: Card for specfold upgrade - two stages, release sources, file classes, migrations, report and version skew.
  - op: create
    path: architecture/upgrade-flow.md
    type: Data Flow
    summary: How an upgrade runs - outer stage downloads and checks, the target release's CLI plans, applies, migrates and commits.
  - op: create
    path: decisions/upgrade-file-classes.md
    type: Decision
    summary: Which files an upgrade replaces, merges three ways or never touches, and why the base is the installed release.
  - op: create
    path: runbooks/upgrade-the-sample-app.md
    type: Runbook
    summary: How the sample app is upgraded from each release candidate with the released upgrader, and how the run is recorded.
  - op: update
    path: architecture/specfold-cli.md
    type: Component
    summary: Module src/upgrade/ and the version-skew check in cli.ts.
  - op: update
    path: capabilities/specfold-release.md
    type: Capability
    summary: release.mjs index writes releases.json for a mirror.
  - op: update
    path: decisions/managed-blocks.md
    type: Decision
    summary: An upgrade replaces unchanged blocks and merges edited ones against the installed release's block.
  - op: update
    path: runbooks/cut-a-release.md
    type: Runbook
    summary: Mirrors get releases.json; the sample app is upgraded after each candidate instead of receiving copies.
empty_reason: ""
```

## Notes

None.
