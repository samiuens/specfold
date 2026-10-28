# Proposal

## Why

To-do items can only be entered one by one and never leave the app as data. Exporting items as CSV, importing entries from JSON and counting a list make the items usable as plain data; the decisions are in `brief.md`.

## What Changes

- New `toCsv(items)` turns items into CSV text with the header `id,title,done,due`; fields with a comma, quote or newline are quoted, and an item without a due date gets an empty field.
- New `fromJson(text)` parses a JSON array of `{ title, done?, due? }` and returns checked entries `{ title, done, due }` with the rules of `add`: a trimmed non-empty title and a real `YYYY-MM-DD` date, checked the same way `add` checks it (see [Dates as calendar strings](/decisions/dates-as-calendar-strings.md)). The caller adds the entries.
- Text that is not a JSON array, or an entry breaking a rule, throws a `TypeError` naming the entry's index; nothing is returned.
- New `summarize(items)` returns the counts `{ total, open, done, withDue }`.

No knowledge concept covers exporting, importing or counting yet, and no rejected decision in `knowledge/decisions/` covers the idea. CSV import, JSON export and adding imported entries to a list are out of scope.

## Capabilities

### New Capabilities
- `csv-export`: turning to-do items into CSV text.
- `json-import`: reading and checking to-do entries from JSON text.
- `summary`: counting the items of a list.

### Modified Capabilities
- none

## Impact

- New modules `src/export-csv.js`, `src/import-json.js` and `src/summary.js`, each with its own test file. `src/todo.js` keeps its behavior; the import reuses its date check.
