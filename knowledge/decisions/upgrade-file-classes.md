---
type: Decision
title: Upgrade file classes
description: Which files an upgrade replaces, merges three ways or never touches, and why the installed release is the merge base.
status: draft
decision: accepted
change: 2026-10-28-add-specfold-upgrade
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-09T09:00:29+01:00 }
sources:
  - id: design
    resource: ../../openspec/changes/archive/2026-10-28-add-specfold-upgrade/design.md
    title: "Design of add-specfold-upgrade, decisions 1, 5 and 12"
  - id: proposal-2026-11-09-add-knowledge-profile
    resource: ../../openspec/changes/archive/2026-11-09-add-knowledge-profile/proposal.md
  - id: design-2026-11-09-add-knowledge-profile
    resource: ../../openspec/changes/archive/2026-11-09-add-knowledge-profile/design.md
---

# Decision

`specfold upgrade` sorts every path of a repository into one class and treats each class the same way every time.

- **Kit-owned files:**
  - which files: the CLI bundle, the OpenSpec schema, the skills, the gate workflows, the Claude Code agents and the inactive upgrade workflow in `.specfold/workflows/`. A turned-on copy in `.github/workflows/` counts too, with the release copy as its source;
  - one still equal to its manifest hash is replaced, or removed when the new release dropped it;
  - one changed here is merged three ways with `git merge-file`. A conflict leaves the markers in the file, and the upgrade exits with 1.
- **Managed blocks:** an unchanged block is replaced inside its markers; an edited one is merged three ways like a file. Text outside the markers is never read.
- **`.claude/settings.json` and `openspec/config.yaml`:** key by key. A value still equal to the installed release's copy takes the new one, new keys are added, and Specfold's hook groups are swapped. The team's keys, rules and context edits stay. The permission patterns `permissions sync` owns are left to the sync in every list ([specfold permissions sync](/capabilities/specfold-permissions.md)).
- **Project content is never touched:**
  - `knowledge/`, `openspec/specs/`, `openspec/changes/`;
  - `.specfold/local.yaml`;
  - every value in `specfold.yaml` except `kit_version`.

The merge base is the installed release's own copy, fetched from the same source and used only when its hash equals the manifest's. When it can't be fetched, a changed file is left alone and reported as a conflict instead of being guessed at.

# Why

A team changes kit files on purpose: a stricter verifier, an extra rule in a skill. A plain overwrite would lose that work on every upgrade, and never upgrading leaves the kit's fixes behind. The manifest hash tells the two cases apart: equal means nobody touched it, so replacing is safe. For a changed file, only a three-way merge against the exact copy that was installed can tell the team's edit from the release's change. Keeping project content out of reach makes an upgrade PR something a reviewer can approve without reading the knowledge bundle.

# Rejected alternatives

- **Overwrite every kit file and list what changed:** loses team edits silently, and the diff in review is the only safety net.
- **Two-way merge against the new copy:** without the installed copy as a base, every local edit and every release change looks like a conflict.
- **Base from the git history of the repository:** a repository made from the template or by migrate has no commit that holds the pristine kit copy, and squashed histories lose it anyway.
- **Upgrading knowledge content with migrations:** releases may report what a team should change in its concepts, but rewriting them would turn an upgrade into a content change.

# Knowledge profile

The set of kit-owned files depends on the profile: the knowledge profile leaves out the OpenSpec schema, `sf-plan`, `sf-apply`, `sf-sync` and every subagent except `scout`. `.specfold/profiles/` is kit-owned in both profiles. The manifest records which profile was installed, so an upgrade compares it with `specfold.yaml` before planning ([a knowledge-only profile](/decisions/knowledge-profile.md)).

# Related

- [Managed blocks](/decisions/managed-blocks.md)
- [Upgrade flow](/architecture/upgrade-flow.md)
- [specfold upgrade](/capabilities/specfold-upgrade.md)
- [specfold profile](/capabilities/specfold-profile.md)
