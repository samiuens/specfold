## Delta

```yaml
ops:
  - op: update
    path: capabilities/specfold-hooks.md
    type: Capability
    summary: The stop hook warns instead of blocking on missing test references of active changes, because blocking looped sessions across turns.
empty_reason: ""
```

## Notes

The capability card's line "Claude Code's limit of 8 consecutive blocks ends any loop" is corrected: the limit resets with every new turn, so it did not end the G15 loop.
