---
type: Capability
title: JSON import
description: Why to-do entries can be imported from JSON with the rules of add, and where the contract lives.
status: draft
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-28T10:24:25+01:00 }
---

# Why

Entries had to be typed in one by one. `fromJson(text)` reads a JSON array of `{ title, done?, due? }` and returns checked entries `{ title, done, due }`. The caller adds them, so the import never changes a list itself.

The rules are those of `add`: a trimmed non-empty title and a real calendar date, checked with the same function `add` uses (see [Due dates are calendar strings](/decisions/dates-as-calendar-strings.md)). Text that is not an array, or an entry breaking a rule, throws a `TypeError` naming the entry's index, and nothing is returned, so a bad file never half-imports.

# Related

- [Due dates are calendar strings](/decisions/dates-as-calendar-strings.md)
- [CSV export](/capabilities/csv-export.md)
