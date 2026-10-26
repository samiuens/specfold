## Delta

```yaml
ops:
  - op: create
    path: capabilities/due-dates.md
    type: Capability
    summary: Why to-do items have due dates and an overdue query, and where the contract lives.
  - op: create
    path: decisions/dates-as-calendar-strings.md
    type: Decision
    summary: Due dates are YYYY-MM-DD strings, not Date objects, so no time zones are involved.
empty_reason: ""
```

## Notes

The decision records the rejected alternative from `design.md` (Date objects).
