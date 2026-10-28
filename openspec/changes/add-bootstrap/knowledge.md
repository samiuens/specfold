## Delta

```yaml
ops:
  - op: create
    path: capabilities/specfold-init.md
    type: Capability
    summary: Why a template repository needs init, and how it gets detected values, OpenSpec skills, markers and the manifest without prompts.
  - op: create
    path: runbooks/move-bootstrap-pin.md
    type: Runbook
    summary: How to move the commit BOOTSTRAP.md pins after a template change merges.
  - op: update
    path: decisions/delivery-template-bootstrap-migrate.md
    type: Decision
    summary: Before v0.1.0 BOOTSTRAP.md pins a commit sha fetched through gh, and the template ships its install manifest.
  - op: update
    path: capabilities/specfold-migrate.md
    type: Capability
    summary: Point to init for template repositories and to BOOTSTRAP.md as the way in.
  - op: update
    path: architecture/specfold-cli.md
    type: Component
    summary: Add the init module.
empty_reason: ""
```

## Notes

None.
