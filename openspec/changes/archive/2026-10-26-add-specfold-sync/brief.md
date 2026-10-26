## Wish

After a change is archived, one command applies the mechanical part of its knowledge delta: stubs for missing concepts, deprecation flags, capability and decision links to the archived change, indexes and the log entry. Agents only write prose, and running it twice changes nothing.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | When does sync run? | After archive, as a Workflow follow-up step in the same PR | knowledge:/decisions/write-knowledge-before-sync-after.md |
| Q2 | How is `<change>` resolved? | Name or archived id; a name picks the newest `<date>-<name>`; an active-only change exits 2 | user |
| Q3 | Who is the stub actor? | `<agent_prefix><SPECFOLD_MODEL>`, else `process:specfold-sync` | user |
| Q4 | Where does a stub's title come from? | The file name; the description is the op summary | user |
| Q5 | Are differing `spec`, `resource`, `change` keys overwritten? | Yes; other keys, order, comments and body are kept | user |
| Q6 | What is the log entry? | `* **Change**: <id>: created n, updated n, deprecated n`, once per id | user |
| Q7 | What do `update` ops change? | No frontmatter; they only count in the log | user |
| Q8 | Which exit codes? | 0 synced or nothing to do, 1 knowledge-rule errors, 2 usage or environment | user |
| Q9 | Which sources does a capability card get? | `proposal-<id>` and `design-<id>` per synced change, unless the resource is linked | user |

## Out of scope

- Writing concept bodies (Knowledge task group, `sf-sync` skill in M3).
- Gate rule G6 (M4).

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-26T14:23:54+01:00
