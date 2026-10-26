## Wish

Repositories made from the template, and the kit itself, block merges on the gate: a CI workflow with one required check, a summary of what failed and how to fix it, Claude Code hooks wired in, CODEOWNERS for decisions and specs, and a PR template.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | How is the gate proven? | Integration tests per rule, plus real draft PRs on the kit for G4's label escape, G7 and one clean PR | user |
| Q2 | How does the summary reach fork PRs? | In the check run; a separate `workflow_run` workflow posts the comment; no `pull_request_target` | knowledge:/references/github-actions.md |

## Out of scope

- G11 and G15-G17 (M5, M7).

## Open questions

none

## Confirmation

confirmed_by:
confirmed_at:
