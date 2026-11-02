# specfold-migrate Specification

## Purpose
Defines `specfold migrate`, the deterministic steps of bringing an existing repository into Specfold: the own-branch rule, resumable state, the inventory of existing knowledge sources and the installation of kit files.

## Requirements

### Requirement: Migrate command
The CLI SHALL provide `specfold migrate start [--default-branch <name>]`, `migrate inventory`, `migrate install --from <dir> [--tools <list>] [--stack <text>] [--source-glob <glob>]... [--ref <ref>]`, `migrate mark <step>` and `migrate status`, each with `--json`, runnable from the git root without `specfold.yaml`. Each SHALL exit with 0 on success, 1 when refused, and 2 on usage or environment errors.

#### Scenario: No git repository
- **WHEN** `specfold migrate start` runs in a folder that is not a git working tree
- **THEN** the command exits with 2 and says a git repository is required

### Requirement: Own branch
`migrate start` SHALL refuse when the working tree has changes other than an untracked `.specfold/migration/state.json`. On the default branch it SHALL create and switch to `specfold/migration`, or switch to it when it exists; on `specfold/migration` it SHALL resume; on any other branch it SHALL refuse.

#### Scenario: Started on the default branch
- **WHEN** `specfold migrate start` runs on a clean `main` that is the default branch
- **THEN** the current branch is `specfold/migration`, created from `main`, and `main` is unchanged

#### Scenario: Feature branch
- **WHEN** it runs on the branch `feature/login`
- **THEN** the command exits with 1, names the branch and creates nothing

#### Scenario: Dirty tree
- **WHEN** it runs on `main` with a modified tracked file
- **THEN** the command exits with 1 and no branch is created

### Requirement: Writes on the migration branch only
`migrate inventory`, `migrate install` and `migrate mark` SHALL refuse, writing nothing, unless the current branch is `specfold/migration`.

#### Scenario: Install on the default branch
- **WHEN** `specfold migrate install --from kit/template` runs on `main`
- **THEN** the command exits with 1, says to run `specfold migrate start` first, and no file changes

### Requirement: Default branch
The default branch SHALL be `--default-branch` when given, else the target of `origin/HEAD`, else `main` or `master` when exactly one of them exists; otherwise `migrate start` SHALL exit with 2 asking for `--default-branch`.

#### Scenario: Both main and master
- **WHEN** a repository without a remote has both `main` and `master` and no flag is given
- **THEN** `specfold migrate start` exits with 2 and names `--default-branch`

### Requirement: Migration state
The migrate commands SHALL record finished steps in `.specfold/migration/state.json` with the default branch and the base commit: `start`, `inventory` and `install` by themselves, and `plan`, `convert`, `seed` and `report` through `migrate mark <step>`. `migrate start` SHALL also write `.specfold/migration/.gitignore` ignoring `state.json`, so the state is never committed. `migrate status` SHALL print each step as done or open and the next open step.

#### Scenario: Resumed migration
- **WHEN** `start`, `inventory` and `mark plan` ran and `specfold migrate status` runs
- **THEN** it lists `start`, `inventory` and `plan` as done and names `install` as the next step

#### Scenario: State not committed
- **WHEN** `migrate start` ran and the user runs `git add .specfold/migration`
- **THEN** `.specfold/migration/.gitignore` is staged and `state.json` is not

### Requirement: Inventory
`migrate inventory` SHALL list every tracked file that is a knowledge source, with its kind (`readme`, `docs`, `adr`, `contributing`, `wiki`, `agent-rules`, `spec-tool`) and a token estimate (characters / 4, rounded up), plus the detected stack, package layout and CI system, and store the result in the state.

#### Scenario: ADRs and Cursor rules
- **WHEN** the repository tracks `docs/adr/0001-use-postgres.md` and `.cursor/rules/style.mdc`
- **THEN** the inventory lists the first as `adr` and the second as `agent-rules`, each with a token estimate

#### Scenario: Ignored files
- **WHEN** `docs/build/out.md` exists but is ignored by git
- **THEN** the inventory does not list it

### Requirement: Install source
`migrate install` SHALL exit with 2, writing nothing, when `--from` is not a folder holding `specfold.yaml`, `scripts/specfold.mjs` and `openspec/schemas/specfold/`.

#### Scenario: Wrong folder
- **WHEN** `--from` points at the kit repository root instead of its `template/`
- **THEN** the command exits with 2 and names the missing files

### Requirement: Kit-owned files
`migrate install` SHALL write each kit-owned file (`scripts/specfold.mjs`, the schema, the skills, the gate workflows and, with the `claude` tool, `.claude/agents/`) that is missing, skip one that is identical, and report one that differs as a conflict, never overwriting it, and exit with 1 after installing the rest.

#### Scenario: Differing CLI copy
- **WHEN** the repository already has a different `scripts/specfold.mjs`
- **THEN** the file is unchanged, the output names it as a conflict, and the command exits with 1

### Requirement: Managed blocks
`migrate install` SHALL put Specfold's content for `AGENTS.md`, `CLAUDE.md`, `.github/pull_request_template.md`, `.gitignore`, `.github/CODEOWNERS`, `.gitattributes` and `.worktreeinclude` between `specfold:start` and `specfold:end` markers, creating a missing file, keeping all text outside the markers, and replacing only the block on a rerun. When the text of `CLAUDE.md` outside the markers already has a line `@AGENTS.md`, the block SHALL leave out its own `@AGENTS.md` line.

#### Scenario: Existing AGENTS.md
- **WHEN** `AGENTS.md` holds the team's own rules and install runs twice
- **THEN** `AGENTS.md` starts with one Specfold block and still holds the team's rules unchanged after it

#### Scenario: CLAUDE.md already imports AGENTS.md
- **WHEN** `CLAUDE.md` holds the line `@AGENTS.md` and the team's notes, and install runs
- **THEN** `CLAUDE.md` contains `@AGENTS.md` exactly once, outside the block, and the team's text is unchanged

### Requirement: Claude settings merge
With the `claude` tool, `migrate install` SHALL add each Specfold hook from the template's `.claude/settings.json` whose command is not yet present, each `permissions.deny` rule of the template that is not yet present, each `env` entry whose name is not yet set and each other top-level key the repository's settings lack, keeping every other key, rule and value, and SHALL report a file that is not valid JSON without changing it.

#### Scenario: Existing permissions
- **WHEN** `.claude/settings.json` holds only a `permissions` block
- **THEN** after install it holds the same `permissions` block and Specfold's `SessionStart`, `PostToolUse` and `Stop` hooks

#### Scenario: Deny rules merged
- **WHEN** `.claude/settings.json` holds `permissions.deny: ["Read(./.env)"]`
- **THEN** after install `permissions.deny` starts with `Read(./.env)` followed by each of the template's deny rules once

#### Scenario: Worktree base kept
- **WHEN** `.claude/settings.json` sets `worktree.baseRef` to `"fresh"`
- **THEN** after install it still says `"fresh"`, and a repository without a `worktree` key gets the template's `"head"`

### Requirement: Existing OpenSpec setup
When `openspec/config.yaml` exists, `migrate install` SHALL add the `specfold` schema, set `schema: specfold`, keep `context`, every existing rules key, specs and changes, and add a Specfold rules key only where it is missing. Without `openspec/`, it SHALL run `openspec init --tools <tools>` and then write the template's `config.yaml`.

#### Scenario: Active change on another schema
- **WHEN** the repository has `openspec/changes/add-login/` on the `spec-driven` schema
- **THEN** after install `config.yaml` names `schema: specfold`, its old `context` is kept, and `add-login/.openspec.yaml` is unchanged

### Requirement: Project files
`migrate install` SHALL create `specfold.yaml` from the template with `--source-glob` values (or the globs detected as `specfold init` detects them) and the knowledge skeleton only where they are missing, put `--stack` (or the detected stack) into the config context, and then run `specfold agents sync` and `specfold hooks install`.

#### Scenario: Source globs
- **WHEN** install runs with `--source-glob 'lib/**'` in a repository without `specfold.yaml`
- **THEN** `specfold.yaml` has `source_globs: ["lib/**"]` and `knowledge/index.md` exists

#### Scenario: Workspace globs
- **WHEN** install runs without `--source-glob` in a repository whose `package.json` has `workspaces: ["apps/*", "packages/*"]`
- **THEN** `specfold.yaml` has `source_globs: ["apps/*/src/**", "packages/*/src/**"]`

### Requirement: Agent tools
`migrate install` SHALL set up the tools named by `--tools` (default `agents,claude`); with `--tools agents` it SHALL write nothing under `.claude/` and leave `CLAUDE.md` alone.

#### Scenario: Agents only
- **WHEN** install runs with `--tools agents`
- **THEN** `.agents/skills/sf-lookup/SKILL.md` exists and no `.claude/` folder is created

### Requirement: Install manifest
`migrate install` SHALL write `.specfold/manifest.json` with `manifest_version: 1`, the template's `kit_version`, the `--ref` value when given, and a SHA-256 hash for every kit-owned file and managed block it installed.

#### Scenario: Manifest entry
- **WHEN** install writes `scripts/specfold.mjs`
- **THEN** the manifest lists `scripts/specfold.mjs` with the SHA-256 of its content

### Requirement: Idempotent install
A second `migrate install` with the same template folder and flags SHALL change no file and SHALL report that everything is up to date.

#### Scenario: Rerun
- **WHEN** install has run once and runs again
- **THEN** `git status` shows no new changes and the output says everything is up to date

### Requirement: OpenSpec config keeps long lines
When `specfold migrate install` merges an existing `openspec/config.yaml`, it SHALL keep every value on the lines it had, without folding long lines.

#### Scenario: Long context line kept
- **WHEN** install adds the specfold rules to a config whose context has a 120-character line
- **THEN** that line is unchanged after the merge

### Requirement: Upgrade workflow at install
`specfold migrate install` SHALL accept `--upgrade-workflow`. With it, install SHALL copy `.specfold/workflows/specfold-upgrade.yml` to `.github/workflows/specfold-upgrade.yml`, record it in the manifest as a kit-owned file, and print how to add the `SPECFOLD_TOKEN` secret. Without the flag it SHALL not create that workflow.

#### Scenario: Install with the workflow
- **WHEN** `specfold migrate install --from <template> --upgrade-workflow` runs on a repository without that workflow
- **THEN** `.github/workflows/specfold-upgrade.yml` exists, the manifest lists it, and the output names `SPECFOLD_TOKEN`
