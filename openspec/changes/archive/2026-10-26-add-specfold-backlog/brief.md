## Wish

The project's future lives in the bundle next to its present: backlog items, deferred commitments and the vision have checked fields, CLI commands to add, list, promote, fulfill and withdraw them, audit rules that find neglected ones, and agents see the vision and open commitments whenever they look something up.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | How is the human actor enforced? | Agents may draft; a commitment or vision is binding only once a human verified it; `committed_by` is written only by a human at a terminal and checked by G7 (in `add-commitment-gate`) | user |
| Q2 | What does `backlog promote` create? | The change folder via `openspec new change`, `state: promoted` and `change:` on the item, and a printed next step to run sf-interview with the item as seed; no brief | user |
| Q3 | How does lookup surface vision and commitments? | Always: a separate block after the hits with the vision concepts and the open commitments whose words match | user |
| Q4 | Who may fulfill or withdraw a commitment? | Anyone may fulfill (sf-sync after an archive); `withdraw --reason` refuses agents like verify and records the human `verified` entry | user |
| Q5 | When is an open backlog item neglected? | After `audit.backlog_untouched_days` (default 180) without a commit that changed the file | user |

## Out of scope

- Two-way sync with GitHub Issues (`/backlog/github-issues-sync.md`).
- G17 and the G7 extension for `committed_by` (`add-commitment-gate`).

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-26T17:41:27+01:00
