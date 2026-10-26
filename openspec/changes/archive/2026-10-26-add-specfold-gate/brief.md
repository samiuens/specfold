## Wish

One command decides whether a branch may merge: `specfold gate` runs every merge-gate rule that exists so far on the diff against a base, blocks on the rules that block and reports the rest as warnings. CI, the pre-push hook and Claude Code's Stop hook all run the same command.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | Which rules does M4 ship? | G1-G10, G12-G14 and G18; G11 comes with M7, G15-G17 with M5 | user |
| Q2 | How is M4 split? | gate, G7 via GitHub, verify, hooks, workflow and repo setup | user |
| Q3 | How does G4 get the PR's labels and body? | Flags passed by CI (`--label`, `--pr-body`); the reason is a `No-spec reason:` line; locally G4 only warns | user |
| Q4 | Which `see knowledge:` references block (G14)? | Those in files the PR changes; elsewhere they warn | user |
| Q5 | How are the blocking rules proven? | An integration test per rule on a temporary git repo; real PRs only for what needs GitHub | user |

## Out of scope

- G7 (`add-gate-github`), G11 (M7), G15-G17 (M5).
- The CI workflow and summary comment (`add-gate-workflow`).

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-26T16:35:13+01:00
