# Proposal

## Why

Items without dates cannot answer "what did I miss?". Due dates plus an overdue query cover that with the smallest possible API change. The decisions are in `brief.md`.

## What Changes

- `add(title, { due })` accepts an optional due date as a `YYYY-MM-DD` string; items carry `due` (`null` when not given).
- An invalid due date is rejected with a `TypeError`.
- New query `overdue(today)` returns open items whose due date is before `today`.

## Capabilities

### New Capabilities
- `due-dates`: optional due dates on to-do items and the overdue query.

### Modified Capabilities
- none

## Impact

- `src/todo.js` and its tests. The existing `add`, `complete` and `list` keep their behavior; items gain the `due` field.
