## Wish

A change must not reach archive without a confirmed brief and a checkable knowledge delta. `specfold change check <change>` gives hooks, the gate and `specfold sync` one deterministic verdict on `brief.md`, `knowledge.md` and `tasks.md`.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | Who checks `brief.md`? | `change check`, with its own rule ids; G13 reuses it, the identity check stays in G7 | user |
| Q2 | One change per call or all changes? | `<change>` is required | user |
| Q3 | How is an open question owned? | `- <question> (owner: <actor>) <why it does not block>`; empty or `none` passes | user |
| Q4 | Which decision sources are valid? | `user`, `delegated`, `knowledge:/<path>.md` naming an existing concept | user |
| Q5 | How is capability coverage decided? | By path: `capabilities/<cap>.md`, `create` for new, `update` for modified | user |
| Q6 | May `create` name an existing file? | Yes, when its `type` matches (write before, sync after) | knowledge:/decisions/write-knowledge-before-sync-after.md |
| Q7 | Which `confirmed_at` format? | ISO 8601 with offset | user |
| Q8 | Which `confirmed_by` format? | A `human:<login>` actor; identity is G7's job | user |
| Q9 | Does change check include the tasks findings? | Yes, moved here from `add-specfold-tasks` | user |

## Out of scope

- The identity check behind `confirmed_by` (G7) and gate wiring for G5 and G13 (M4).
- `--staged` for the pre-commit hook (M4).

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-26T14:14:24+01:00
