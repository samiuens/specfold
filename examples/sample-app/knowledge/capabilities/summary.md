---
type: Capability
title: Summary
description: Why a to-do list can be counted (total, open, done, with due date), and where the contract lives.
status: draft
spec: openspec/specs/summary/spec.md
resource: ../../openspec/specs/summary/spec.md
change: 2026-10-28-add-exports
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-28T10:24:25+01:00 }
sources:
  - id: proposal-2026-10-28-add-exports
    resource: ../../openspec/changes/archive/2026-10-28-add-exports/proposal.md
---

# Why

A caller who wants to show progress had to count items itself. `summarize(items)` returns `{ total, open, done, withDue }` in one call, so every screen or report counts the same way.

# Related

- [Due dates](/capabilities/due-dates.md)
- [CSV export](/capabilities/csv-export.md)
