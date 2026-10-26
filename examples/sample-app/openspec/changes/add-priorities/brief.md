## Wish

Items should have a priority.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | What values can a priority take? | One of the strings `"low"`, `"normal"`, `"high"` | user |
| Q2 | What priority does `add` give without one? | `"normal"`; every item always has a priority | user |
| Q3 | What does priority do beyond being stored? | `list({ priority })` filters by it; insertion order is kept; no sorting | user |
| Q4 | Can priority change after adding? | Yes, `setPriority(id, priority)` returns the updated item; an unknown id throws `RangeError` | user |
| Q5 | What happens with an unknown priority value? | `TypeError` in `add`, `setPriority` and the `list` filter; nothing changes | user |
| Q6 | Can a done item's priority change? | Yes | user |
| Q7 | Where does the contract live? | A new spec `priorities` with its own capability card | user |
| Q8 | How do `done` and `priority` filters combine in `list`? | Both apply (AND) | delegated |

## Out of scope

- Sorting by priority.
- Numeric priorities or custom levels.
- Priority affecting `overdue()`.
- Persistence and UI.

## Open questions

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-26T15:56:30+01:00
