---
type: Decision
title: One product version, small integer versions for formats
description: Specfold has one semver product version; the profile, schema and manifest carry their own integer versions.
status: draft
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Versioning'"
---

# Decision

Releases are tagged `vX.Y.Z`. `specfold.yaml` records `kit_version` and `profile_version`, the schema carries OpenSpec's `version`, the manifest carries `manifest_version`. New gate rules ship as warnings first and become blocking only in the next major.

# Why

The upgrader has to know exactly which migration to run, and an update must never turn a green repo red without warning.

# Related

- [Private kit repo](/decisions/private-kit-repo.md)
