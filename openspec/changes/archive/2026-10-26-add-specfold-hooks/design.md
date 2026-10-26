# Design

## Context

The checks exist: `validate()`, `checkChange()`, `openspecValidate()` and the gate rules (`src/gate/`). `src/git.ts` runs git. Commands receive an `Io` with stdout and stderr only; Claude Code hooks need stdin.

## Goals / Non-Goals

**Goals:** one entry point per hook, so hook configs never hold globs or logic; installation that never breaks another hook setup; fast hooks that check only what is staged or edited.

**Non-Goals:** registering the Claude Code hooks in `.claude/settings.json` and the CI workflow (`add-gate-workflow`); graphify installation.

## Decisions

- **Plumbing:** `Io` gets an optional `readStdin()`; the entry point reads `process.stdin`, tests pass a string. The config gains `hooks.extra` (hook name to command list). `checkPlannedChange()` in `src/change/command.ts` returns all `change check` findings once `tasks.md` exists and only the brief findings before. The gate command exports `localGate(config, cwd, base)`, the findings of `gate --base <base> --local`.
- **Install (`src/hooks/install.ts`):** refuse when `git rev-parse --show-toplevel` differs from the repository root. Detect a manager in the order lefthook (`lefthook.yml`, `lefthook.yaml`, `.lefthook.yml`), husky (`.husky/`), pre-commit/prek (`.pre-commit-config.yaml`). Without one, refuse a foreign `core.hooksPath`, write `.specfold/hooks/<hook>` (`#!/bin/sh` plus `exec node scripts/specfold.mjs hook <hook> "$@"`, mode 755) and set `core.hooksPath`. The hooks are `pre-commit`, `pre-push`, `post-checkout`, `post-merge` and the names in `hooks.extra`.
- **Adapters:** lefthook gets `commands.specfold.run: node scripts/specfold.mjs hook <hook> {0}` per hook (`{0}` passes git's arguments), or a `jobs` entry named `specfold` when the hook already uses `jobs`. husky gets the line `node scripts/specfold.mjs hook <hook> "$@"` appended to `.husky/<hook>` (created when missing, mode 755). pre-commit gets one `repo: local` with a hook `specfold-<hook>` per hook (`language: system`, `always_run: true`, `stages: [<hook>]`, `pass_filenames` only for `commit-msg`), and missing hook types are added to `default_install_hook_types`. YAML files are edited with the `yaml` document API, which keeps comments; the command reminds the user to run the manager's install.
- **Hook runner (`src/hooks/run.ts`):** `specfold hook <name> [args...]` runs the hook's own checks, then, only if they pass, every `hooks.extra.<name>` command via `sh -c <command> specfold-hook <args...>` with inherited stdio. Staged files come from `git diff --cached --name-only --diff-filter=ACMR --relative`; checks read the working tree. pre-push and claude-stop take the base from `git symbolic-ref refs/remotes/origin/HEAD`, else `origin/main`.
- **Claude hooks (`src/hooks/claude.ts`):** session start prints the section lines of the root `index.md` and the active change names, cut to 40 lines. post-tool-use reads `tool_name` and `tool_input.file_path` from the event JSON; an unreadable event is ignored (exit 0), so a broken hook never stops the agent. stop prints blocking findings to stderr and exits 2.
- **Kit switch:** `.githooks/` is removed, `npm run setup` runs `specfold hooks install`, and `.specfold/hooks/` is committed like in any user repo.

## Risks / Trade-offs

- [Checks read the working tree, not the index, so partially staged files are checked in their unstaged form] → accepted for M4; the gate in CI judges commits.
- [pre-commit/prek and lefthook need their own install step after the config changes] → the command says so.
