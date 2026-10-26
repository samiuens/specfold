# Design

## Context

Every rule the gate needs exists as a function already: `validate()` (`src/validate/index.ts`), index generation and `syncIndexes` in check mode (`src/indexes/`), `checkChange` and `checkChangeTasks` (`src/change/`, `src/tasks/`), `checkKnowledge` with `archived: true` and the sync planner (`src/sync/`), `auditBundle` (`src/audit/`) and the code reference scan (`src/indexes/refs.ts`). Git access lives privately in `src/tasks/git.ts`; the OpenSpec binary lookup lives in `src/doctor/checks.ts`.

## Goals / Non-Goals

**Goals:** one pass that computes the diff once and feeds every rule; each rule a plain function over a shared context, testable on its own; the current time is injected.

**Non-Goals:** G7 (`add-gate-github`), hooks (`add-specfold-hooks`), the workflow and its summary (`add-gate-workflow`).

## Decisions

- **Shared helpers:** the git runner moves from `src/tasks/git.ts` to `src/git.ts`; the OpenSpec binary lookup (`node_modules/.bin/openspec`, then the PATH) moves from the doctor to `src/openspec.ts`; the sync command's planning step becomes `planSync(config, bundleRoot, id)`, returning the knowledge findings and the planned actions, including the log entry and excluding index writes (G2 covers those).
- **Settings:** `gate.require_change_for_source_changes` (default true, false turns G4 off), `gate.escape_label` (default `no-spec`) and `gate.block_on_stale_touched` (default true) join the existing `gate.block_on_broken_links`.
- **Diff (`src/gate/diff.ts`):** merge base via `git merge-base <ref> HEAD` (failure is an environment error naming the ref), changed files via `git diff --name-only --no-renames <base> HEAD`; with `--local` also `git diff --name-only --no-renames HEAD` and `git ls-files --others --exclude-standard`. Deleted files count as changed. Active changes are `openspec/changes/<name>/` folders with a changed file that still exist; archived changes are `openspec/changes/archive/<id>/` folders with a changed file that exist now and not at the merge base (`git cat-file -e <base>:<path>`).
- **Rules (`src/gate/rules.ts`):** one function per rule over a `GateContext` (config, bundle root, diff, flags, base, now). Validate, change, tasks and audit findings map to gate findings by rule family; their errors block and their warnings warn. Bundle-relative paths become repository-relative.
- **G3 (`src/gate/openspec.ts`):** runs `openspec validate --all --strict --json --report findings --no-interactive` and turns each `ERROR` issue into a blocking finding on `openspec/changes/<id>` or `openspec/specs/<id>`. Unparsable output with a non-zero exit becomes one finding with the first stderr line.
- **Finding shape:** `{rule, effect, path, line, message, fix}`, with `path` null when nothing applies. Order: blocking first, then warnings; within each by rule number, path and line. JSON `counts` is `{block, warn, rules}`.
- **Command (`src/gate/command.ts`):** `--label` is a repeatable string option; `--pr-body` names a file that must exist.

## Risks / Trade-offs

- [Running OpenSpec is the slowest step] → it runs once per gate; tests replace the binary with a stub script on the PATH.
- [G13 blocks a change's own PR until its brief is confirmed] → intended: the confirmation is part of the PR.
