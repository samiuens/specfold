---
type: Decision
title: Splice entries into hook manager YAML
description: hooks install inserts its entries as text at parsed offsets, so unrelated lines of lefthook.yml and pre-commit config stay as they were.
status: draft
decision: accepted
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-11-02T10:21:00+01:00 }
sources:
  - id: design
    resource: ../../openspec/changes/fix-migration-findings/design.md
    title: "Design, B9: splice text instead of re-serialising the document"
---

# Decision

`hooks install` still parses `lefthook.yml` and `.pre-commit-config.yaml` to find where its entries go and whether they exist, but writes by inserting the text of its own entries at the parsed source offsets. The result is parsed again; if that fails or the entries are missing, nothing is written. A flow-style target collection is the one case where only that node is replaced.

# Why

Writing the re-serialised document rewrote lines that had nothing to do with Specfold (flow lists, folded scalars, long lines), which showed up as noise in the Atrium migration diff. Inserting text leaves every other line byte for byte as it was.

# Rejected alternatives

- Re-serialise the whole document with the `yaml` library: reformats unrelated values, the bug being fixed.
- Tune the serialiser options (line width, scalar styles): reduces the damage but cannot restore the author's original style.

# Related

- [specfold hooks](/capabilities/specfold-hooks.md)
- [Managed blocks](/decisions/managed-blocks.md)
