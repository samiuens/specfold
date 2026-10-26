## Wish

To-do items can have a due date, and I can ask the list which open items are overdue on a given day.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | How is a due date given and stored? | As a `YYYY-MM-DD` string, validated when the item is added | user |
| Q2 | When is an item overdue? | When it is open and its due date is strictly before today; items due today are not overdue | user |
| Q3 | How does the caller pass today? | As a required `YYYY-MM-DD` argument of the overdue query, so results never depend on the clock | user |
| Q4 | Can a due date change after adding? | No, it is set only when the item is added | user |
| Q5 | What does an item without a due date look like? | `due: null`; it is never overdue | delegated |

## Out of scope

- Changing or removing a due date after adding.
- Times of day and time zones.
- Reminders or notifications.

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-26T14:40:44+01:00
