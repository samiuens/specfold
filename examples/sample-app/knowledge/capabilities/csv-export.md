---
type: Capability
title: CSV export
description: Why to-do items can be exported as CSV text, and where the contract lives.
status: draft
spec: openspec/specs/csv-export/spec.md
resource: ../../openspec/specs/csv-export/spec.md
change: 2026-10-28-add-exports
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-28T10:24:25+01:00 }
sources:
  - id: proposal-2026-10-28-add-exports
    resource: ../../openspec/changes/archive/2026-10-28-add-exports/proposal.md
---

# Why

Items could not leave the app as data. `toCsv(items)` turns a list into CSV text with the header `id,title,done,due`, one row per item, so a spreadsheet or another tool can read it.

Fields with a comma, quote or newline are quoted with doubled quotes, `done` is written as `true` or `false`, and an item without a due date gets an empty field. Only export exists; reading CSV back is out of scope.

# Related

- [JSON import](/capabilities/json-import.md)
- [Due dates](/capabilities/due-dates.md)
