---
type: Decision
title: One product version, small integer versions for formats
description: Specfold has one semver product version; the profile, schema and manifest carry their own integer versions.
status: draft
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-28T11:38:47+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Versioning'"
---

# Decision

Releases are tagged `vX.Y.Z`. `specfold.yaml` records `kit_version` and `profile_version`, the schema carries OpenSpec's `version`, the manifest carries `manifest_version`. New gate rules ship as warnings first and become blocking only in the next major.

# Why

The upgrader has to know exactly which migration to run, and an update must never turn a green repo red without warning.

# How releases are made

- **release-please** in the kit repository turns conventional commits into a release PR titled `chore(release): 🔖 vX.Y.Z`. It runs with a fine-grained token (`RELEASE_PLEASE_TOKEN`), because PRs opened with the workflow's own token start no workflows, so the required checks would never run. Its commits are authored by the token's owner, which keeps the rule that a human is the author.
- **A rebuild commit.** The CLI's version is baked into the committed bundle, and the template manifest hashes that bundle. release-please can bump version fields but can't build, so job `rebuild` adds `build(release): 📦️ rebuild the bundle for vX.Y.Z` to the release PR. The version and manifest checks block the merge until it's there.
- **One version per candidate.** During M9 each change sets `release-as` to its candidate (`0.1.0-rc.1` to `rc.3`, then `0.1.0`), because release-please's prerelease versioning would have to guess the `rc.N` numbering. After `0.1.0`, versions come from the commits, with breaking changes bumping the minor while at `0.x`.
- **The release** ships `specfold-template-vX.Y.Z.tar.gz` with its SHA-256 and the upgrade notes ([specfold release](/capabilities/specfold-release.md), [cut a release](/runbooks/cut-a-release.md)).

# Related

- [Private kit repo](/decisions/private-kit-repo.md)
