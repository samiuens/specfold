---
type: Decision
title: Due dates are calendar strings
description: Due dates are YYYY-MM-DD strings, not Date objects, so no time zones are involved.
status: draft
decision: accepted
change: 2026-10-26-add-due-dates
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T14:41:31+01:00 }
sources:
  - id: code
    resource: ../../src/todo.js
    title: isCalendarDate and overdue in the to-do library
---

# Decision

Due dates are `YYYY-MM-DD` strings. They are validated as real calendar days (`2026-02-30` is rejected) and compared as strings, which orders them correctly.

# Why

A due date is a day, not a moment. Strings keep time zones out of a tiny library and read well in tests and specs.

# Rejected alternatives

- JavaScript `Date` objects: they carry a time and a time zone, so "due today" would depend on where the code runs.

# Related

- [Due dates](/capabilities/due-dates.md)
