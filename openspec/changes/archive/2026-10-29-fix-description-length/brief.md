## Wish

`specfold backlog add` and `specfold new` must not write a concept whose one-line `description` breaks the 160-character limit that `specfold validate` enforces (rule P2). Found when `backlog add --description` wrote two backlog items with 181 and 208 characters, which validate then rejected. Longer text belongs in the concept's body.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | Which commands get the check? | `backlog add` and `new`; both write the description through the same code | user |
| Q2 | What happens to a description over 160 characters? | Refused with exit 2 and nothing written; the error names the length and the limit and says longer text belongs in the body. Characters are counted as validate counts them | user |
| Q3 | `backlog add` without `--description` uses the title; what if the title is over 160 characters? | The same rule, since the title becomes the description, with a hint to pass a shorter `--description`; titles themselves stay unlimited | user |

## Out of scope

- `specfold sync` stubs: their descriptions come from `knowledge.md` summaries, which `change check` already limits to 160 characters.

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-29T10:23:18+01:00
