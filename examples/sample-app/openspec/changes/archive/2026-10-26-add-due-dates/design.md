# Design

## Context

`src/todo.js` keeps items in memory; see `proposal.md` for the change.

## Decisions

- **Dates stay strings.** `YYYY-MM-DD` strings compare correctly with `<`, so no `Date` objects and no time zones are involved. Validation parses the string as a UTC date and checks it round-trips, which rejects `2026-02-30`.
- **One validator** is shared by `add` and `overdue`.

## Risks / Trade-offs

- [Strings allow no times of day] → out of scope by decision; a later change could add them.
