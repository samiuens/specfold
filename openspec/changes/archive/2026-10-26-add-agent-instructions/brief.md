## Wish

A repo created from the template tells every agent how to work: `AGENTS.md` with the map, the core rule, the lookup order, the workflow and the knowledge rules, linking the code-comment convention; `CLAUDE.md` imports it and adds the Claude Code notes. M3 ends with the sample change working in Claude Code and in opencode.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | Which second tool proves the workflow? | opencode | user |
| Q2 | Does CLAUDE.md import AGENTS.md? | Yes; Claude Code reads AGENTS.md natively only without a CLAUDE.md | knowledge:/references/claude-code.md |
| Q3 | Who runs the interactive Claude Code test? | The maintainer, from a runbook; the agent prepares it | user |
| Q4 | How do template repos get the bundled CLI? | `template/scripts/specfold.mjs`, a CI-checked copy of the kit's bundle | user |
| Q5 | Where does the Claude Code test run? | In a fresh copy of the sample outside the kit, so the kit's own instructions don't load; the new change is copied back | user |
| Q6 | How do agents get `openspec`? | AGENTS.md says it must be installed, `specfold doctor` checks it; the runbook puts the kit's pinned copy on PATH | user |
| Q7 | Who runs the opencode check? | The maintainer, from the runbook, with their own provider setup | user |

## Out of scope

- Claude Code hooks (M4) and permission deny lists (M7).

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-26T16:05:19+01:00
