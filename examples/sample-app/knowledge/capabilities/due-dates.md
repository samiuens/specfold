---
type: Capability
title: Due dates
description: Why to-do items have due dates and an overdue query, and where the contract lives.
status: draft
spec: openspec/specs/due-dates/spec.md
resource: ../../openspec/specs/due-dates/spec.md
change: 2026-10-26-add-due-dates
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T14:41:31+01:00 }
sources:
  - id: proposal-2026-10-26-add-due-dates
    resource: ../../openspec/changes/archive/2026-10-26-add-due-dates/proposal.md
  - id: design-2026-10-26-add-due-dates
    resource: ../../openspec/changes/archive/2026-10-26-add-due-dates/design.md
---

# Why

A list without dates cannot answer "what did I miss?". Items can carry an optional due date, and `overdue(today)` lists the open items whose date has passed. The caller passes `today`, so results never depend on the machine's clock or time zone, and tests need no fake clock.

An item due today is not overdue yet, done items never are, and an item without a due date (`due: null`) never shows up.

# Related

- [Due dates are calendar strings](/decisions/dates-as-calendar-strings.md)
