---
type: Capability
title: specfold upgrade
description: Why upgrades run in two stages with the target release's own CLI, merge local edits three ways and refuse version skew.
status: draft
spec: openspec/specs/specfold-upgrade/spec.md
resource: ../../openspec/specs/specfold-upgrade/spec.md
change: 2026-10-28-add-upgrade-workflow
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-28T18:04:36+01:00 }
sources:
  - id: proposal-2026-10-28-add-specfold-upgrade
    resource: ../../openspec/changes/archive/2026-10-28-add-specfold-upgrade/proposal.md
  - id: design-2026-10-28-add-specfold-upgrade
    resource: ../../openspec/changes/archive/2026-10-28-add-specfold-upgrade/design.md
  - id: proposal-2026-10-28-fix-upgrade-follow-ups
    resource: ../../openspec/changes/archive/2026-10-28-fix-upgrade-follow-ups/proposal.md
  - id: proposal-2026-10-28-add-upgrade-workflow
    resource: ../../openspec/changes/archive/2026-10-28-add-upgrade-workflow/proposal.md
  - id: design-2026-10-28-add-upgrade-workflow
    resource: ../../openspec/changes/archive/2026-10-28-add-upgrade-workflow/design.md
---

# Why

A repository installed with `specfold init` or sf-migrate keeps the kit of that day. Kit fixes, new skills and stricter rules reach it only through an upgrade. Copying files by hand can't tell a kit file the team changed on purpose from one that is just old. The manifest's hashes make that distinction, and `specfold upgrade` acts on it with one reviewable commit on its own branch.

# Choices made while specifying and building

- **The target release upgrades itself.** The installed CLI only finds, downloads and checks the release, then hands over to the CLI inside it ([upgrade flow](/architecture/upgrade-flow.md)). New file layouts and migrations never depend on what an old CLI knew.
- **Three-way merges with the installed release as base,** fetched from the same source and trusted only when its hash matches the manifest ([upgrade file classes](/decisions/upgrade-file-classes.md)).
- **Three sources:**
  - `github` reads through gh or a token in the environment, never stored;
  - `url` serves a mirror with a `releases.json` that `release.mjs index` writes;
  - `path` reads a local folder, for offline and air-gapped repositories.
- **Channels:** `stable` sees final releases only, `next` also sees release candidates. Upgrades take one major step per run, so each step's notes and migrations land in their own commit.
- **Always a commit, never a push:** `--yes` commits on `specfold/upgrade-<version>`, conflicts included with their markers, and `--pr` is explicit. A dirty tree is refused, so the commit holds only the upgrade.
- **Version skew guard:** a CLI older than the manifest refuses write commands, so a teammate on an old bundle can't rewrite files in the old format.
- **Follow-ups check the upgrade itself.** The gate runs against the commit the upgrade branch started from, and config merges keep long lines, so the commit's diff shows only real changes. Both were fixed after the sample app's upgrade to rc.2.
- **Upgrades find the team.** The session-start reminder and the opt-in weekly workflow bring a new release to people who never run `--check` ([turn on upgrade PRs](/runbooks/turn-on-upgrade-prs.md)). A turned-on workflow is a kit file like any other.
- **Skill `sf-upgrade`** walks an agent through the check, the plan, the conflicts and the release's manual steps, and leaves the push to the user.

# Related

- [specfold release](/capabilities/specfold-release.md)
- [Upgrade the sample app](/runbooks/upgrade-the-sample-app.md)
- [Versioning](/decisions/versioning.md)
