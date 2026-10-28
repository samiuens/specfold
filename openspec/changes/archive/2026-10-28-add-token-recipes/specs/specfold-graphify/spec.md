# Spec Delta

## Purpose

Defines `specfold graphify setup`, which sets up graphify for code navigation in one idempotent step: code-only, with its skill in `.agents/skills/`, a `.graphifyignore` and, for Claude Code, graphify's PreToolUse guard.

## ADDED Requirements

### Requirement: Graphify setup command
The CLI SHALL provide `specfold graphify setup [--json]`, run in a repository with `specfold.yaml`. It SHALL exit with 0 on success, and with 2 before any write when the `graphify` command is not installed or the subcommand is unknown.

#### Scenario: graphify missing
- **WHEN** `specfold graphify setup` runs and `graphify` is not on the PATH
- **THEN** it exits with 2, says how to install graphify, and changes no file

### Requirement: Graphify skill and ignore file
Setup SHALL install graphify's skill into `.agents/skills/graphify/` when it is missing and then link skills as `specfold agents sync` does, and SHALL write `.graphifyignore` listing `knowledge/`, `openspec/`, `node_modules/`, build output and `graphify-out/` when the file is missing. An existing `.graphifyignore` SHALL be kept. Setup SHALL never write a graphify section into `AGENTS.md` or `CLAUDE.md`.

#### Scenario: Fresh repository
- **WHEN** setup runs in a repository without graphify files
- **THEN** `.agents/skills/graphify/SKILL.md` and `.graphifyignore` exist, and `AGENTS.md` and `CLAUDE.md` are unchanged

### Requirement: Claude Code guard
When `agents.targets` in `specfold.yaml` includes `.claude/skills`, setup SHALL add graphify's PreToolUse guard to `.claude/settings.json` unless its command is already present, keeping every other key.

#### Scenario: Guard added once
- **WHEN** setup runs twice in a repository that uses Claude Code
- **THEN** `.claude/settings.json` holds exactly one PreToolUse entry with graphify's guard command and keeps Specfold's own hooks

### Requirement: Code-only build
When `graphify-out/graph.json` does not exist, setup SHALL build the graph code-only with `GRAPHIFY_BACKEND=none`, so no file content leaves the machine. An existing graph SHALL be left to the hooks' refresh.

#### Scenario: First build
- **WHEN** setup runs in a repository without `graphify-out/`
- **THEN** `graphify-out/graph.json` exists afterwards and graphify ran with `GRAPHIFY_BACKEND=none`

### Requirement: Idempotent setup
A second setup run SHALL change no file and say that everything is up to date.

#### Scenario: Rerun
- **WHEN** setup has run once and runs again
- **THEN** no file changes and the output says everything is up to date
