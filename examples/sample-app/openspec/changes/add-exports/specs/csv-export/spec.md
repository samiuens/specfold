## Purpose

Turns to-do items into CSV text, so a list can leave the app as plain data for spreadsheets and other tools.

## ADDED Requirements

### Requirement: Items exported as CSV
`toCsv(items)` SHALL return CSV text whose first line is the header `id,title,done,due`, followed by one line per item in the given order. `done` SHALL be written as `true` or `false`, and an item without a due date SHALL get an empty `due` field. Lines SHALL be joined with `\n`.

#### Scenario: Header and rows
- **WHEN** `toCsv` is called with `{ id: 1, title: "Pay rent", done: false, due: "2026-11-01" }` and `{ id: 2, title: "Call mom", done: true, due: "2026-10-30" }`
- **THEN** it returns `"id,title,done,due\n1,Pay rent,false,2026-11-01\n2,Call mom,true,2026-10-30"`

#### Scenario: Empty due
- **WHEN** `toCsv` is called with `{ id: 3, title: "Read", done: false, due: null }`
- **THEN** the item's line is `3,Read,false,`

### Requirement: Special characters quoted
A field that contains a comma, a double quote or a newline SHALL be written in double quotes, with each double quote inside it doubled. Other fields SHALL be written unquoted.

#### Scenario: Comma quoted
- **WHEN** an item has the title `Milk, eggs`
- **THEN** its title field is `"Milk, eggs"`

#### Scenario: Quote doubled
- **WHEN** an item has the title `Read "Dune"`
- **THEN** its title field is `"Read ""Dune"""`

#### Scenario: Newline quoted
- **WHEN** an item has the title `Line one` followed by a newline and `line two`
- **THEN** its title field is the title wrapped in double quotes, with the newline kept inside the quotes
