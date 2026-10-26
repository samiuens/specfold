## Wish

The interview gets better with every change: after each archive the user is asked which question came too late and where the agent guessed, the answers grow a checklist the next interview uses, out-of-scope ideas become backlog items or commitments, and a backlog item can be promoted to a change end to end.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | Where is a skipped retro recorded? | A `log.md` entry of kind `Retro`; answered retros get one too; the checklist holds only real answers | user |
| Q2 | When does `interview-checklist.md` exist? | sf-sync creates it with `specfold new` on the first answered retro question; the template ships nothing and sf-interview skips it when absent | user |
| Q3 | Which skills change? | sf-sync (retro, fulfill commitments), sf-interview (checklist groups, backlog and commitment offers), sf-lookup (drift flag, vision and commitments block) | knowledge:/architecture/agent-layer.md |
| Q4 | Which backlog item proves promotion on the sample app? | A new item "Rename an item", carried from add to sync; the planned `add-priorities` change stays untouched | user |
| Q5 | When does sf-sync fulfill a commitment? | Only one the brief or proposal names as delivered by the change, after the user confirms; `kept` in a design means not broken | user |
| Q6 | What about checking merged requirement length before archive? | Recorded as a backlog item, decided in a later change | user |
| Q7 | How is the interview checklist laid out? | `## <Topic>` sections under `# Convention`, each line `- <question> (from <change>)` | user |

## Out of scope

- A separate retro skill; the retro stays in sf-sync as the plan describes.

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-26T17:41:27+01:00
