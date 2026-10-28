## Purpose

Counts what a to-do list holds: all items, open and done ones, and those with a due date.

## ADDED Requirements

### Requirement: List summarized
`summarize(items)` SHALL return `{ total, open, done, withDue }`: the number of items, of items not done, of done items, and of items whose `due` is not `null`.

#### Scenario: Mixed list
- **WHEN** `summarize` is called with an open item due `"2026-11-01"`, an open item without a due date and a done item due `"2026-10-20"`
- **THEN** it returns `{ total: 3, open: 2, done: 1, withDue: 2 }`

#### Scenario: Empty list
- **WHEN** `summarize([])` is called
- **THEN** it returns `{ total: 0, open: 0, done: 0, withDue: 0 }`
