---
type: Capability
title: specfold doctor
description: Why setup problems are checked in one command, and where the contract for specfold doctor lives.
status: draft
change: add-specfold-doctor
resource: ../../openspec/changes/add-specfold-doctor/specs/specfold-doctor/spec.md
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T11:46:37+01:00 }
sources:
  - id: proposal
    resource: ../../openspec/changes/add-specfold-doctor/proposal.md
  - id: design
    resource: ../../openspec/changes/add-specfold-doctor/design.md
---

# Why

An old Node, a missing or incompatible OpenSpec, git hooks that were never installed, or a broken `specfold.yaml` otherwise surface later as confusing hook or CI failures. `specfold doctor` checks all of them in one place, with a fix per problem, for humans after cloning and for `BOOTSTRAP.md` before a migration.

# Choices made while specifying

- Only real blockers fail (old Node, broken config, missing or out-of-range OpenSpec, missing bundle); missing hooks warn, because the CI gate is the enforcement ([blocking merge gate](/decisions/blocking-merge-gate.md)); graphify is informational only.
- Checks run against an injected environment, so every case is testable without installing tools in particular versions.

# Related

- [specfold CLI](/architecture/specfold-cli.md)
- [Built-in git hooks](/decisions/built-in-git-hooks.md)
