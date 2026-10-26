## Wish

Change the title of an existing to-do item after it was added.

Seeded by the backlog item [Rename an item](/backlog/rename-an-item.md).

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | What does the API look like? | `rename(id, title)` returns the updated item, like `complete(id)` | user |
| Q2 | Which title rules apply? | The same as `add`: trimmed; an empty or non-string title throws `TypeError` and the old title stays | user |
| Q3 | Can a done item be renamed? | Yes; `done` and `due` stay unchanged | user |
| Q4 | What happens for an unknown id? | `RangeError`, nothing changes | user |
| Q5 | Where does the contract live? | A new spec `rename` with its own capability card | delegated |

## Out of scope

- Changing an item's due date after adding it (recorded as a backlog item).
- A history of earlier titles.

## Open questions

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-26T18:57:26+01:00
