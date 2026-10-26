## Wish

Every person and every agent gets the same local safety net without an extra tool: git hooks that run Specfold's checks, installed by one command, or added to the hook manager a repo already uses. Claude Code gets three hooks on top: context at session start, immediate feedback on knowledge and change edits, and the gate before it stops.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | Built-in hooks or a hook manager? | Built-in `core.hooksPath` hooks plus adapters for lefthook, husky and pre-commit/prek | knowledge:/decisions/built-in-git-hooks.md |
| Q2 | Does the kit switch from `.githooks/` to `specfold hooks`? | Yes, in M4; the commit check runs through `hooks.extra.commit-msg` | user |

## Out of scope

- graphify installation; the post-checkout hook only refreshes an installed graph.
- The CI workflow (`add-gate-workflow`).

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-26T16:35:13+01:00
