## Wish

A human who reviewed concepts marks them verified with one command, under their own GitHub login, and agents cannot do it for them.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | Where does the login come from? | `gh api user`, else `actors.github_login` in the gitignored `.specfold/local.yaml`; refuse when neither exists | user |
| Q2 | Who may run it? | Humans only; agents are refused | knowledge:/decisions/humans-verify-only.md |

## Out of scope

- The `/specfold verify` PR comment workflow (later, with the gate workflow if wanted).

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-26T16:35:13+01:00
