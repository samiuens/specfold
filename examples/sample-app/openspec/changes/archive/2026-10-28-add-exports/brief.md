## Wish

Get to-do items out of and into the app as plain data: export the items as CSV, import entries from JSON with the same rules as adding, and count what is in a list.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | What does the CSV export look like? | `toCsv(items)` in `src/export-csv.js`: header `id,title,done,due`, one row per item; a field with a comma, quote or newline is quoted and its quotes doubled; `done` as `true`/`false`; no due date as an empty field; lines joined with `\n` | user |
| Q2 | What does the JSON import do? | `fromJson(text)` in `src/import-json.js` parses an array of `{ title, done?, due? }` and returns checked entries `{ title, done, due }` with the rules of `add`: a trimmed non-empty title and a real `YYYY-MM-DD` date, checked with the same function `add` uses; the caller adds them | user |
| Q3 | What does the summary count? | `summarize(items)` in `src/summary.js` returns `{ total, open, done, withDue }` | user |
| Q4 | What happens to an invalid import entry? | Text that is not a JSON array, or an entry breaking a rule, throws `TypeError` naming the entry's index (`entry 2: ...`); nothing is returned | user |
| Q5 | How is the work split? | One task group per module, each owning its module and test file, so the three can be built in parallel | delegated |

## Out of scope

- CSV import and JSON export.
- Adding imported entries to a list (the caller does that).

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-28T10:13:58+01:00
