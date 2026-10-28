# Spec Delta

## MODIFIED Requirements

### Requirement: Budgets
Budgets SHALL come from `stats.budget` in `specfold.yaml`: `agents_md` (default 2000) for `AGENTS.md`, `total` (default 4000) for the whole set, and `skill_description` (default 60) for each skill whose folder name neither starts with `openspec-` nor is `graphify`, the skills other tools write. Each exceeded budget SHALL be reported with its value and the estimate.

#### Scenario: AGENTS.md too long
- **WHEN** `AGENTS.md` has 9000 characters and `stats.budget` is not set
- **THEN** stats reports `AGENTS.md` at 2250 tokens over the budget of 2000 and exits with 1

#### Scenario: OpenSpec skill exempt
- **WHEN** the description of `openspec-propose` is 110 tokens long
- **THEN** no per-skill budget is reported for it, and its tokens count toward the total

#### Scenario: graphify skill exempt
- **WHEN** the description of the `graphify` skill is 91 tokens long
- **THEN** no per-skill budget is reported for it, and its tokens count toward the total
