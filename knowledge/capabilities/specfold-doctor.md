---
type: Capability
title: specfold doctor
description: Why setup problems are checked in one command, and where the contract for specfold doctor lives.
status: draft
change: 2026-11-09-add-knowledge-profile
resource: ../../openspec/specs/specfold-doctor/spec.md
spec: openspec/specs/specfold-doctor/spec.md
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-09T09:00:29+01:00 }
sources:
  - id: proposal
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-doctor/proposal.md
  - id: design
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-doctor/design.md
  - id: proposal-2026-10-29-add-gate-require
    resource: ../../openspec/changes/archive/2026-10-29-add-gate-require/proposal.md
  - id: design-2026-10-29-add-gate-require
    resource: ../../openspec/changes/archive/2026-10-29-add-gate-require/design.md
  - id: proposal-2026-11-02-fix-migration-findings
    resource: ../../openspec/changes/archive/2026-11-02-fix-migration-findings/proposal.md
  - id: design-2026-11-02-fix-migration-findings
    resource: ../../openspec/changes/archive/2026-11-02-fix-migration-findings/design.md
  - id: proposal-2026-11-04-add-agent-permissions
    resource: ../../openspec/changes/archive/2026-11-04-add-agent-permissions/proposal.md
  - id: design-2026-11-04-add-agent-permissions
    resource: ../../openspec/changes/archive/2026-11-04-add-agent-permissions/design.md
  - id: proposal-2026-11-09-add-knowledge-profile
    resource: ../../openspec/changes/archive/2026-11-09-add-knowledge-profile/proposal.md
  - id: design-2026-11-09-add-knowledge-profile
    resource: ../../openspec/changes/archive/2026-11-09-add-knowledge-profile/design.md
---

# Why

An old Node, a missing or incompatible OpenSpec, git hooks that were never installed, or a broken `specfold.yaml` otherwise surface later as confusing hook or CI failures. `specfold doctor` checks all of them in one place, with a fix per problem, for humans after cloning and for `BOOTSTRAP.md` before a migration.

# Choices made while specifying

- Only real blockers fail (old Node, broken config, missing or out-of-range OpenSpec, missing bundle); missing hooks warn, because the CI gate is the enforcement ([blocking merge gate](/decisions/blocking-merge-gate.md)); graphify is informational only.
- D3 prefers a repository-local `node_modules/.bin/openspec` over the PATH (change `update-doctor-local-openspec`), so Node repos that pin OpenSpec as a dev dependency, like the kit itself, are checked against the version they really use.
- D7 reads the rules GitHub applies to the default branch (`gh api repos/<repo>/rules/branches/<branch>`), which covers every ruleset, Specfold's or the team's. It warns while none requires `specfold-gate`, and names `gate require` as the fix. Without gh, a login or a GitHub remote it is `ok` with "not checked", so doctor stays usable offline. Classic branch protection isn't read, so a repository that requires the check only that way sees a warning (change `add-gate-require`).
- D8 compares the `permissions` setting with `.claude/settings.json` through the same pure planner as `permissions sync --check`, without a child process, the way D7 reuses the gate's logic. It fails on an invalid setting, warns when a rule would move or a broken settings file can't be read, and is `ok` with a note when Claude Code is not a target (change `add-agent-permissions`).
- Checks run against an injected environment, so every case is testable without installing tools in particular versions.
- D3 also finds `node_modules/.bin/openspec` in the current directory when there is no `specfold.yaml` yet, and D4 counts `specfold.mjs hook` entries in a hook manager's config as installed hooks (change `fix-migration-findings`).
- D2 checks the `profile` value and reports an unknown one as a failure. D3 returns `ok` for the knowledge profile without looking for an openspec binary ([specfold profile](/capabilities/specfold-profile.md)).

# Related

- [specfold CLI](/architecture/specfold-cli.md)
- [Built-in git hooks](/decisions/built-in-git-hooks.md)
- [specfold profile](/capabilities/specfold-profile.md)
