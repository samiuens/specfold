---
type: Decision
title: Plan-aware link relief
description: "Rejected: validate reading the migration plan to excuse only links to planned targets; hooks relieve by conversion state instead."
status: draft
decision: rejected
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-09T09:58:22+01:00 }
sources:
  - id: brief-add-okf-bundle-migration
    resource: ../../openspec/changes/add-okf-bundle-migration/brief.md
---

# Decision

Rejected: `specfold validate` reading the migration plan (`.specfold/migration/plan.md`) to excuse only links whose target the plan names, so that every other broken link still blocks during a migration. Decided by the maintainer on 2026-11-09 (brief question Q10 of change `add-okf-bundle-migration`).

# Why

It is more precise, but it makes a deterministic command parse a Markdown table that an agent writes and a human edits, and couples validate to the migration skill's template. The chosen relief needs only the migration state: until `convert` is marked, the hooks warn about every broken link and about files still equal to the base commit, while pre-push and the CI gate stay strict, so nothing broken can merge ([a migration rewrites an existing OKF bundle](/decisions/existing-bundle-migration.md)).

# Related

- [specfold hooks](/capabilities/specfold-hooks.md)
- [Everything that must be correct is deterministic code](/decisions/deterministic-cli.md)
