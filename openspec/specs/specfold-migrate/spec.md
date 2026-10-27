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
The migrate commands SHALL record finished steps in `.specfold/migration/state.json` with the default branch and the base commit: `start`, `inventory` and `install` by themselves, and `plan`, `convert`, `seed` and `report` through `migrate mark <step>`. `migrate status` SHALL print each step as done or open and the next open step.

#### Scenario: Resumed migration
- **WHEN** `start`, `inventory` and `mark plan` ran and `specfold migrate status` runs
- **THEN** it lists `start`, `inventory` and `plan` as done and names `install` as the next step

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
`migrate install` SHALL put Specfold's content for `AGENTS.md`, `CLAUDE.md`, `.github/pull_request_template.md`, `.gitignore` and `.github/CODEOWNERS` between `specfold:start` and `specfold:end` markers, creating a missing file, keeping all text outside the markers, and replacing only the block on a rerun.

#### Scenario: Existing AGENTS.md
- **WHEN** `AGENTS.md` holds the team's own rules and install runs twice
- **THEN** `AGENTS.md` starts with one Specfold block and still holds the team's rules unchanged after it

### Requirement: Claude settings merge
With the `claude` tool, `migrate install` SHALL add each Specfold hook from the template's `.claude/settings.json` whose command is not yet present to the repository's settings, keeping every other key, and SHALL report a file that is not valid JSON without changing it.

#### Scenario: Existing permissions
- **WHEN** `.claude/settings.json` holds only a `permissions` block
- **THEN** after install it holds the same `permissions` block and Specfold's `SessionStart`, `PostToolUse` and `Stop` hooks

### Requirement: Existing OpenSpec setup
When `openspec/config.yaml` exists, `migrate install` SHALL add the `specfold` schema, set `schema: specfold`, keep `context`, every existing rules key, specs and changes, and add a Specfold rules key only where it is missing. Without `openspec/`, it SHALL run `openspec init --tools <tools>` and then write the template's `config.yaml`.

#### Scenario: Active change on another schema
- **WHEN** the repository has `openspec/changes/add-login/` on the `spec-driven` schema
- **THEN** after install `config.yaml` names `schema: specfold`, its old `context` is kept, and `add-login/.openspec.yaml` is unchanged

### Requirement: Project files
`migrate install` SHALL create `specfold.yaml` from the template with `--source-glob` values (or the detected globs) and the knowledge skeleton only where they are missing, put `--stack` (or the detected stack) into the config context, and then run `specfold agents sync` and `specfold hooks install`.

#### Scenario: Source globs
- **WHEN** install runs with `--source-glob 'lib/**'` in a repository without `specfold.yaml`
- **THEN** `specfold.yaml` has `source_globs: ["lib/**"]` and `knowledge/index.md` exists

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
