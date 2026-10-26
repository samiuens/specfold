---
type: Capability
title: specfold log
description: Why log entries are written by a command, and where the contract for specfold log add lives.
status: draft
change: 2026-10-26-add-specfold-log
resource: ../../openspec/specs/specfold-log/spec.md
spec: openspec/specs/specfold-log/spec.md
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T14:00:00+01:00 }
sources:
  - id: proposal
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-log/proposal.md
  - id: design
    resource: ../../openspec/changes/archive/2026-10-26-add-specfold-log/design.md
---

# Why

`log.md` is the bundle's history: one entry per archived change, migration or notable update. OKF fixes its shape (an H1, then `## YYYY-MM-DD` headings newest first, see [OKF](/references/okf.md)), and hand edits break it easily. `specfold log add` writes an entry in the right section and keeps every other line as it was, so `sf-sync` and `sf-migrate` never edit the file directly.

# Choices made while specifying

- The kind is free (any capitalized word, `Update` by default), so new kinds such as `Migration` need no config change.
- `log` is a command group with `add` as its first subcommand, which leaves room for `log list` later.

# Related

- [specfold CLI](/architecture/specfold-cli.md)
- [specfold validate](/capabilities/specfold-validate.md)
