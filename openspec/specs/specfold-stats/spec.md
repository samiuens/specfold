# specfold-stats Specification

## Purpose
Defines `specfold stats`, which estimates the tokens an agent loads before it reads anything (the always-loaded set) against budgets in `specfold.yaml`, and estimates any files on request.

## Requirements

### Requirement: Stats command
The CLI SHALL provide `specfold stats [<path>...] [--json]`. Without paths it SHALL report the always-loaded set and the knowledge bundle and exit with 1 when a budget is exceeded, else 0. With paths it SHALL report each named file, a folder standing for every file below it, and exit with 0. Usage or environment errors SHALL exit with 2.

#### Scenario: Within budget
- **WHEN** `specfold stats` runs in a repository whose always-loaded set is within every budget
- **THEN** it exits with 0 and its last line gives the set's total in tokens

#### Scenario: Named files
- **WHEN** `specfold stats docs/` runs on a folder with two files of 400 and 800 characters
- **THEN** it lists both files with 100 and 200 tokens and exits with 0

### Requirement: Token estimate
Every token count SHALL be the number of characters divided by 4, rounded up, and the text output SHALL say the counts are estimates.

#### Scenario: Rounding
- **WHEN** a file has 401 characters
- **THEN** stats reports it with 101 tokens

### Requirement: Always-loaded set
The set SHALL consist of `AGENTS.md`, `CLAUDE.md` and every file they import with `@<path>`, followed transitively and each counted once; the `context` value of `openspec/config.yaml`; the `name` and `description` frontmatter of each skill in `.agents/skills/`; and the output of `specfold hook claude-session-start`. A missing file SHALL count 0 and be marked missing.

#### Scenario: Import counted once
- **WHEN** `CLAUDE.md` contains `@AGENTS.md`
- **THEN** `AGENTS.md` appears once in the set

#### Scenario: Skills and hook
- **WHEN** `.agents/skills/` holds `sf-lookup` and `openspec-propose`
- **THEN** the set lists one item per skill with the tokens of its name and description, and one item for the SessionStart hook output

### Requirement: Budgets
Budgets SHALL come from `stats.budget` in `specfold.yaml`: `agents_md` (default 2000) for `AGENTS.md`, `total` (default 4000) for the whole set, and `skill_description` (default 60) for each skill whose folder name does not start with `openspec-`. Each exceeded budget SHALL be reported with its value and the estimate.

#### Scenario: AGENTS.md too long
- **WHEN** `AGENTS.md` has 9000 characters and `stats.budget` is not set
- **THEN** stats reports `AGENTS.md` at 2250 tokens over the budget of 2000 and exits with 1

#### Scenario: OpenSpec skill exempt
- **WHEN** the description of `openspec-propose` is 110 tokens long
- **THEN** no per-skill budget is reported for it, and its tokens count toward the total

### Requirement: Knowledge per folder
Without paths, stats SHALL also report the knowledge bundle's tokens per top-level folder and in total; these numbers SHALL have no budget.

#### Scenario: Bundle folders
- **WHEN** the bundle holds `decisions/` and `domain/`
- **THEN** the output lists both folders with their token totals

### Requirement: Stats JSON
With `--json`, stats SHALL print `{"ok", "set", "total", "budgets", "over", "knowledge"}` without paths, and `{"ok", "files", "total"}` with paths, where each set item and file carries `path` (or `name`) and `tokens`.

#### Scenario: JSON over budget
- **WHEN** `specfold stats --json` runs with `AGENTS.md` over its budget
- **THEN** `ok` is `false` and `over` holds one entry naming `agents_md`
