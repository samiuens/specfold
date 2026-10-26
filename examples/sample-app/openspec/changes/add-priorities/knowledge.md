## Delta

```yaml
ops:
  - op: create
    path: capabilities/priorities.md
    type: Capability
    summary: Why to-do items have priority levels that can be changed and filtered, and where the contract lives.
  - op: create
    path: decisions/priorities-as-named-levels.md
    type: Decision
    summary: Priorities are the named levels low, normal and high, not numbers, so callers never guess which end is important.
empty_reason: ""
```

## Notes

The decision records the alternatives rejected in the interview: integer levels 1-5 and a plain high/low flag. No design.md, because there was no further design choice to record.
