# Spec Delta

## MODIFIED Requirements

### Requirement: Claude Code target
The sync SHALL write Claude Code's rules only when `agents.targets` in `specfold.yaml` (default `[".claude/skills"]`) includes `.claude/skills`. When no tool needs rendered rules (no Claude Code target and no `omp` in `tools`), it SHALL validate the setting, report that no tool needs rendered rules, write nothing and exit with 0 when the setting is valid.

#### Scenario: Agents only
- **WHEN** `agents.targets` is `[".opencode/skills"]`, `tools` does not list `omp`, and the setting is valid
- **THEN** the sync creates no `.claude/` folder and exits with 0

#### Scenario: omp only
- **WHEN** `agents.targets` is `[]`, `tools` is `[agents, omp]`, and the setting is valid
- **THEN** the sync creates no `.claude/` folder, writes `.omp/config.yml` and exits with 0

## ADDED Requirements

### Requirement: omp target
When `tools` in `specfold.yaml` lists `omp`, the sync SHALL also render each action's patterns as entries `{match, approval}` of `bash.patterns` in `.omp/config.yml`, with `ask` written as `prompt`. It SHALL create a missing file. Without `omp`, it SHALL write nothing under `.omp/`.

#### Scenario: omp rules written
- **WHEN** `tools` lists `omp`, `permissions` sets `push: ask`, and `.omp/config.yml` does not exist
- **THEN** after the sync `.omp/config.yml` holds a `bash.patterns` entry matching `git push origin main` with `approval: prompt`

#### Scenario: omp not listed
- **WHEN** `tools` is `[agents, claude]` and the sync runs
- **THEN** no `.omp/` folder is created

### Requirement: omp rule order
omp applies the first matching rule, so the sync SHALL keep its own entries as one block at the start of `bash.patterns`: first every `deny` entry, then every `prompt` entry, then every `allow` entry, each in the order of the action table. Every other entry SHALL follow in its existing order.

#### Scenario: Stricter force-push wins
- **WHEN** `permissions` sets `push: allow` and `force-push: deny`
- **THEN** the `force-push` entries come before the `push` entries, so `git push --force` matches `deny` first

#### Scenario: Team rule kept
- **WHEN** `bash.patterns` holds a team entry `{match: "rm -rf *", approval: deny}` and the sync runs
- **THEN** the team entry follows the sync's block, unchanged, and every other key in `.omp/config.yml` is unchanged

### Requirement: omp settings file errors
A `.omp/config.yml` that is not a YAML mapping, or whose `bash.patterns` is not a list, SHALL stop the sync with an environment error (exit 2) that names the file, and leave it unchanged.

#### Scenario: Broken omp settings
- **WHEN** `.omp/config.yml` holds a YAML list at its top level
- **THEN** the sync exits with 2, names `.omp/config.yml`, and the file is unchanged

### Requirement: omp check and output
`--check` SHALL cover the omp rules. With `--json`, the output SHALL add `"omp_target"` (`.omp/config.yml` or `null`) and report each omp change in `changes` with the omp levels `allow`, `prompt`, `deny` or `none` and `"target": ".omp/config.yml"`.

#### Scenario: omp out of date
- **WHEN** `specfold.yaml` sets `open-pr: allow` and `.omp/config.yml` holds the `open-pr` entry with `approval: prompt`
- **THEN** `specfold permissions sync --check` reports the move, leaves the file unchanged and exits with 1
