---
type: Capability
title: specfold release
description: Why the kit packs its own template tarball with a checksum, checks its version fields and ships agent-readable upgrade notes.
status: draft
spec: openspec/specs/specfold-release/spec.md
resource: ../../openspec/specs/specfold-release/spec.md
change: 2026-10-28-add-release-automation
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-28T11:38:47+01:00 }
sources:
  - id: proposal-2026-10-28-add-release-automation
    resource: ../../openspec/changes/archive/2026-10-28-add-release-automation/proposal.md
  - id: design-2026-10-28-add-release-automation
    resource: ../../openspec/changes/archive/2026-10-28-add-release-automation/design.md
---

# Why

Every install and upgrade path starts from a release: `BOOTSTRAP.md`, the template and `specfold upgrade` all need one file to download and one hash to trust. GitHub's automatic source archive has neither a stable checksum nor the right shape, since it carries the whole kit repository. So the kit packs exactly what a user repository receives: the tracked files of `template/`, plus `upgrade/` with the notes and migrations the upgrader reads ([versioning](/decisions/versioning.md)).

# Choices made while specifying and building

- **Kit-only plain Node.** `tools/specfold/release.mjs` isn't bundled into the CLI, because user repositories never cut kit releases. It runs from the kit root in CI and locally.
- **Three version fields, one check.** The package version, `kit_version` in `template/specfold.yaml` and the template manifest's `kit_version` must agree. `release.mjs check` runs in CI on every PR, so a release PR without its rebuild commit can't merge ([cut a release](/runbooks/cut-a-release.md)).
- **Tracked files only.** `pack` copies `git ls-files template upgrade`, so local build output or `node_modules` never ships. It uses `tar -C` with a staged top folder, which works with GNU and BSD tar alike.
- **`sha256sum` format.** The `.sha256` file is `<hex>  <file>`, so `sha256sum -c` works on Linux, and `BOOTSTRAP.md` checks it with a `node -e` one-liner that works anywhere.
- **Notes live with the change.** Upgrade notes are written as `upgrade/notes/<version>.md` in the change that needs them, because release-please regenerates its changelog and PR; `notes` adds them to the release body, or says "No manual steps."

# Related

- [specfold CLI](/architecture/specfold-cli.md)
