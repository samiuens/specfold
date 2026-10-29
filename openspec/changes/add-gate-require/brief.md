## Wish

"Implement it": a repository that installs Specfold gets `specfold-gate` as a required check on its default branch, instead of a guide telling people to set it by hand. Until the check is required, the gate only reports.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | Where does the logic live? | A new command `specfold gate require`, usable at any time; init calls it behind a flag | user |
| Q2 | How is the check made required? | Its own ruleset named `specfold-gate` on the default branch, requiring the check from GitHub Actions; created or updated, the team's own rules untouched, a second run changes nothing | user |
| Q3 | When during a migration? | After the migration PR merges: sf-migrate's report tells the user to run `gate require`; nothing outward-facing happens during the migration | user |
| Q4 | What if it can't be set (no gh login, no admin rights, private repository on GitHub Free)? | init reports the reason and the manual steps and exits 0; `gate require` on its own exits 2 with the same text | user |
| Q5 | How does init decide? | Opt-in `init --require-gate`; BOOTSTRAP.md asks the user, recommending yes | user |
| Q6 | Who may bypass the ruleset? | Nobody; the `no-spec` label with a reason stays the escape | user |
| Q7 | Does doctor report it? | Yes, as a warning naming `gate require`; it skips quietly without gh or rights | user |
| Q8 | How do repositories installed earlier hear about it? | The next release's upgrade notes tell the agent to ask the user and run `gate require`; the upgrade itself changes no GitHub setting | user |
| Q9 | Token, flags, strictness | `gh` only, no token from the environment; `--dry-run` and `--json` like the other commands; "branches must be up to date" stays off, as in the kit's own ruleset | delegated |

## Out of scope

- GitHub Enterprise Server hosts: dropped; Specfold targets github.com only.
- Classic branch protection.

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-29T09:00:17+01:00
