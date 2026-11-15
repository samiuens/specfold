---
type: Decision
title: omp support derived from the manifest
description: "Rejected: deriving omp support from the install manifest; an explicit tools setting is what init and migrate write."
status: draft
decision: rejected
generated: { by: omp/claude-opus-5-5, at: 2026-11-15T22:04:00+01:00 }
sources:
  - id: brief-add-omp-support
    resource: ../../openspec/changes/add-omp-support/brief.md
  - id: design-add-omp-support
    resource: ../../openspec/changes/add-omp-support/design.md
---

# Decision

Rejected: telling whether a repository uses omp from the manifest (a recorded `.omp/` file), the way the upgrader tells Claude Code from recorded `.claude/` files.

# Why

The user chose an explicit opt-in in the planning interview of `add-omp-support`. A setting is what `init --tools` and `migrate install --tools` write, what a person edits to add omp later, and what agents sync and permissions sync read without the manifest. The upgrader keeps its manifest rule only for repositories without the key ([specfold tools setting](/capabilities/specfold-tools.md)).

# Related

- [specfold upgrade](/capabilities/specfold-upgrade.md)
