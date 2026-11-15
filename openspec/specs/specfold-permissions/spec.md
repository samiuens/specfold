# specfold-permissions Specification

## Purpose
Defines the `permissions` setting in `specfold.yaml`, which says for each outward-facing action whether an agent may take it on its own, and `specfold permissions sync`, which renders it into Claude Code's permission rules.

## Requirements

### Requirement: Permissions sync command
The CLI SHALL provide `specfold permissions sync [--check] [--json]`, run inside a repository with `specfold.yaml`. It SHALL exit with 0 when the rules are in place or were made so, 1 when `--check` finds anything to change or the `permissions` setting is invalid, and 2 on usage or environment errors.

#### Scenario: Rules written
- **WHEN** `permissions` sets `push: ask`, `.claude/skills` is a target, and `.claude/settings.json` has no `permissions.ask` list
- **THEN** after `specfold permissions sync` the file's `permissions.ask` holds the rules for `push`, and the command exits with 0

### Requirement: Actions and levels
The `permissions` key in `specfold.yaml` SHALL map action names to a level of `allow`, `ask` or `deny`. The actions SHALL be `push`, `force-push`, `delete-remote-branch`, `push-tags`, `open-pr`, `merge-pr` and `close-pr`. An action that is not set SHALL count as `ask`, and a missing `permissions` key SHALL mean `ask` for every action.

#### Scenario: No permissions key
- **WHEN** `specfold.yaml` has no `permissions` key and the sync runs
- **THEN** the rules of all seven actions are in `permissions.ask`

#### Scenario: Unknown action
- **WHEN** `permissions` sets `publish-release: ask`
- **THEN** the sync names the unknown action, writes nothing and exits with 1

#### Scenario: Unknown level
- **WHEN** `permissions` sets `push: sometimes`
- **THEN** the sync names the action and the allowed levels, writes nothing and exits with 1

### Requirement: Push sub-actions
`force-push`, `delete-remote-branch` and `push-tags` SHALL be at least as strict as `push`, where `deny` is stricter than `ask` and `ask` is stricter than `allow`. When one is looser, the setting SHALL be invalid: the sync SHALL name the action and `push`, write nothing and exit with 1.

#### Scenario: Looser force-push
- **WHEN** `permissions` sets `push: ask` and `force-push: allow`
- **THEN** the sync names `force-push` and `push`, `.claude/settings.json` is unchanged, and the command exits with 1

#### Scenario: Stricter force-push
- **WHEN** `permissions` sets `push: allow` and `force-push: deny`
- **THEN** the sync succeeds, with the `push` rules in `permissions.allow` and the `force-push` rules in `permissions.deny`

### Requirement: Claude Code target
The sync SHALL write Claude Code's rules only when `agents.targets` in `specfold.yaml` (default `[".claude/skills"]`) includes `.claude/skills`. When no tool needs rendered rules (no Claude Code target and no `omp` in `tools`), it SHALL validate the setting, report that no tool needs rendered rules, write nothing and exit with 0 when the setting is valid.

#### Scenario: Agents only
- **WHEN** `agents.targets` is `[".opencode/skills"]`, `tools` does not list `omp`, and the setting is valid
- **THEN** the sync creates no `.claude/` folder and exits with 0

#### Scenario: omp only
- **WHEN** `agents.targets` is `[]`, `tools` is `[agents, omp]`, and the setting is valid
- **THEN** the sync creates no `.claude/` folder, writes `.omp/config.yml` and exits with 0

### Requirement: Rendered rules
Each action SHALL map to fixed Claude Code Bash rule patterns covering its usual `git` or `gh` forms, for example `Bash(git push:*)` for `push` and `Bash(gh pr create:*)` for `open-pr`. `merge-pr` and `close-pr` SHALL also cover the `gh api` calls that merge or close a pull request. The sync SHALL put each pattern in the `permissions` list named by its action's level and remove it from the other two.

#### Scenario: Level changed
- **WHEN** the `open-pr` rules are in `permissions.ask` and `specfold.yaml` now sets `open-pr: allow`
- **THEN** after the sync the `open-pr` rules are in `permissions.allow` and in neither `ask` nor `deny`

#### Scenario: Merge through the API
- **WHEN** `merge-pr` is `ask` and the sync runs
- **THEN** `permissions.ask` holds a rule matching `gh pr merge` and a rule matching a `gh api` call to a pull request's merge endpoint

### Requirement: Foreign rules kept
The patterns the sync generates SHALL count as its own. The sync SHALL never change, reorder or remove any other rule, hook or key in `.claude/settings.json`. A missing file SHALL be created. A file that is not a valid JSON object SHALL stop the sync with an environment error (exit 2) and stay unchanged.

#### Scenario: Team rule kept
- **WHEN** `permissions.ask` holds `Bash(rm -rf:*)` and the sync runs
- **THEN** `Bash(rm -rf:*)` is still first in `permissions.ask`, and the deny list and hooks are unchanged

#### Scenario: Broken settings file
- **WHEN** `.claude/settings.json` is not valid JSON
- **THEN** the sync exits with 2, names the file, and the file is unchanged

### Requirement: Permissions check mode
With `--check`, the sync SHALL write nothing, report what it would change, and exit with 1 if anything would change.

#### Scenario: Out of date
- **WHEN** `specfold.yaml` sets `push: allow` and the `push` rules are in `permissions.ask`
- **THEN** `specfold permissions sync --check` reports the move, leaves the file unchanged and exits with 1

#### Scenario: In sync
- **WHEN** the sync has just run and nothing changed since
- **THEN** `specfold permissions sync --check` exits with 0

### Requirement: Permissions output
Each change SHALL be reported as the pattern with the list it leaves and the list it enters (`allow`, `ask`, `deny` or `none`), and each problem with the action it concerns. With `--json`, the command SHALL print `{"ok", "check", "target", "changes": [{"pattern", "from", "to"}], "problems": [{"action", "message"}]}`, with `target` as `null` when no tool needs rendered rules.

#### Scenario: JSON changes
- **WHEN** `specfold permissions sync --json` adds the `push` rules to an empty settings file
- **THEN** stdout parses as JSON with `"ok": true`, `"target": ".claude/settings.json"` and one change per `push` pattern with `"from": "none"` and `"to": "ask"`

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
