# due-dates Specification

## Purpose
Lets to-do items carry an optional calendar due date and answers which open items are overdue on a given day.

## Requirements

### Requirement: Optional due date on add
`add(title, options)` SHALL accept an optional `due` given as a `YYYY-MM-DD` calendar date and return the item with that `due`. Without `due`, the item SHALL have `due: null`.

#### Scenario: Item with due date
- **WHEN** `add("Pay rent", { due: "2026-11-01" })` is called
- **THEN** the returned item has `due: "2026-11-01"`

#### Scenario: Item without due date
- **WHEN** `add("Buy milk")` is called
- **THEN** the returned item has `due: null`

### Requirement: Invalid due date rejected
`add` SHALL throw a `TypeError` when `due` is given but is not a valid `YYYY-MM-DD` calendar date, and SHALL not add the item.

#### Scenario: Impossible date
- **WHEN** `add("Pay rent", { due: "2026-02-30" })` is called
- **THEN** a `TypeError` is thrown and `list()` stays unchanged

### Requirement: Overdue query
`overdue(today)` SHALL return, in insertion order, the open items whose `due` is strictly before `today`, where `today` is a required `YYYY-MM-DD` date. Items due on `today`, done items and items without a due date SHALL not be returned. An invalid or missing `today` SHALL throw a `TypeError`.

#### Scenario: Overdue items
- **WHEN** open items are due on 2026-10-25, 2026-10-26 and 2026-10-27 and `overdue("2026-10-26")` is called
- **THEN** only the item due on 2026-10-25 is returned

#### Scenario: Done items are not overdue
- **WHEN** an item due on 2026-10-01 is completed and `overdue("2026-10-26")` is called
- **THEN** the item is not returned

#### Scenario: Missing today
- **WHEN** `overdue()` is called without a date
- **THEN** a `TypeError` is thrown
