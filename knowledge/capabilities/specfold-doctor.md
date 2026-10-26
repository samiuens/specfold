---
type: Capability
title: specfold doctor
description: Why setup problems are checked in one command, and where the contract for specfold doctor lives.
status: draft
change: 2026-10-26-add-specfold-doctor
resource: ../../openspec/specs/specfold-doctor/spec.md
spec: openspec/specs/specfold-doctor/spec.md
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T11:46:37+01:00 }
sources:
  - id: proposal
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-doctor/proposal.md
  - id: design
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-doctor/design.md
---

# Why

An old Node, a missing or incompatible OpenSpec, git hooks that were never installed, or a broken `specfold.yaml` otherwise surface later as confusing hook or CI failures. `specfold doctor` checks all of them in one place, with a fix per problem, for humans after cloning and for `BOOTSTRAP.md` before a migration.

# Choices made while specifying

- Only real blockers fail (old Node, broken config, missing or out-of-range OpenSpec, missing bundle); missing hooks warn, because the CI gate is the enforcement ([blocking merge gate](/decisions/blocking-merge-gate.md)); graphify is informational only.
- D3 prefers a repository-local `node_modules/.bin/openspec` over the PATH (change `update-doctor-local-openspec`), so Node repos that pin OpenSpec as a dev dependency, like the kit itself, are checked against the version they really use.
- Checks run against an injected environment, so every case is testable without installing tools in particular versions.

# Related

- [specfold CLI](/architecture/specfold-cli.md)
- [Built-in git hooks](/decisions/built-in-git-hooks.md)
