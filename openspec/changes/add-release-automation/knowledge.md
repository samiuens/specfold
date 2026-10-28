## Delta

```yaml
ops:
  - op: create
    path: capabilities/specfold-release.md
    type: Capability
    summary: Card for the kit's release script - version check, template tarball with checksum, upgrade notes.
  - op: create
    path: runbooks/cut-a-release.md
    type: Runbook
    summary: How a release candidate or release is cut - release-as, the release PR, the rebuild commit, publishing, checks.
  - op: update
    path: decisions/versioning.md
    type: Decision
    summary: Releases come from release-please with a fine-grained PAT, a rebuild job on the release PR and release-as per candidate.
  - op: update
    path: decisions/delivery-template-bootstrap-migrate.md
    type: Decision
    summary: BOOTSTRAP.md installs the newest release tarball, checked against its SHA-256, instead of a pinned commit.
  - op: deprecate
    path: runbooks/move-bootstrap-pin.md
    type: Runbook
    summary: Replaced by releases; BOOTSTRAP.md no longer pins a commit.
empty_reason: ""
```

## Notes

None.
