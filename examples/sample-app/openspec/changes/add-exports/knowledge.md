## Delta

```yaml
ops:
  - op: create
    path: capabilities/csv-export.md
    type: Capability
    summary: Why to-do items can be exported as CSV text, and where the contract lives.
  - op: create
    path: capabilities/json-import.md
    type: Capability
    summary: Why to-do entries can be imported from JSON with the rules of add, and where the contract lives.
  - op: create
    path: capabilities/summary.md
    type: Capability
    summary: Why a to-do list can be counted (total, open, done, with due date), and where the contract lives.
empty_reason: ""
```

## Notes

No design.md: the brief settles every technical choice, and no open commitment exists. The import checks dates as described in `/decisions/dates-as-calendar-strings.md`, so no new decision is needed. CSV import and JSON export stay out of scope.
