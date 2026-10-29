## Delta

```yaml
ops:
  - op: create
    path: conventions/kit-docs.md
    type: Convention
    summary: The guides in docs/ are for people using the kit; the knowledge bundle links to them, and docs/commands.md is generated from the CLI's help.
  - op: update
    path: runbooks/cut-a-release.md
    type: Runbook
    summary: For 0.1.0, prerelease goes with release-as; after it, one follow-up PR removes release-as, excludes pre-releases in BOOTSTRAP.md and requires upgrade-fixtures.
empty_reason: ""
```

## Notes

The guides describe; the specs stay the contract. Where a guide needs a rule, it links to the spec or the knowledge concept instead of restating it.
