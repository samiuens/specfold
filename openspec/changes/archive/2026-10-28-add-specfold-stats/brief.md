## Wish

Everyone can see what an agent loads before it reads anything: `specfold stats` estimates the always-loaded set against budgets in `specfold.yaml`, and gate rule G11 warns when a PR grows that set past a budget.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | How is M7 split? | Two changes: `add-specfold-stats` (stats and G11) and `add-token-recipes` (graphify setup, deny list, before/after numbers) | user |
| Q2 | How are tokens counted? | Characters / 4, as in `migrate inventory`; no new dependency; output says "about" | user |
| Q3 | What is the always-loaded set? | `AGENTS.md`, `CLAUDE.md` with its `@` imports, the OpenSpec config `context`, each skill's name and description, and the actual output of the SessionStart hook | user |
| Q4 | How are budgets set? | A `stats.budget` block in `specfold.yaml` with defaults: `AGENTS.md` 2000 tokens, the whole set 4000, each skill description 60; G11 warns and never blocks | user |
| Q5 | Do OpenSpec's skills get the per-skill limit? | No: every skill counts toward the whole set, and the per-skill limit applies only to skills not named `openspec-*` | user |
| Q6 | When does G11 fire? | Only when the branch changes a file in the set (or the hook setting) and the head exceeds a budget | user |
| Q7 | What else does stats report? | By default the set (per item, total, budgets) plus the knowledge bundle per folder; `specfold stats <path>...` estimates any files; exit 1 over a budget; `--json` | user |
| Q8 | Does the migration report use it? | Yes: `sf-migrate` step 8 runs `specfold stats`, and the report template gets the set's total and any overrun | user |
| Q9 | What happens to cost per change? | It stays in the plan's M8 | user |
| Q10 | An exact tokenizer? | Not recorded | user |

## Out of scope

- Cost per change for the subagent limit (M8).
- graphify, the deny list and the sample-app numbers (`add-token-recipes`).

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-28T08:38:56+01:00
