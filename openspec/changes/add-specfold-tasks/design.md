# Design

## Context

The CLI already has a command registry, findings, a glob matcher and `walkFiles` (`tools/specfold/src/`). `tasks.md` is Markdown with fenced YAML blocks, so a line-based parser plus `yaml` for the blocks is enough.

## Goals / Non-Goals

**Goals:** one parser shared by `tasks check`, `status` and `resume`; the static rules (T0-T9) run without git; the trailer rules (T10, T11) run only with `--base`.

**Non-Goals:** editing `tasks.md` (agents tick boxes themselves); gate wiring.

## Decisions

- **Module `src/tasks/`:**
  - `parse.ts`: groups, tasks, follow-up, stray headings, with line numbers
  - `rules.ts`: T1-T4, T6-T9
  - `overlap.ts`: T5
  - `scenarios.ts`: known scenario ids
  - `git.ts`: commits, trailers, T10, T11
  - `progress.ts`: group states, next task
  - `command.ts`: `tasks check`
  - `progress-command.ts`: `status`, `resume`
- **Findings** carry `file` (repository-relative `tasks.md`), `group` and `task` in addition to the common fields. The JSON keys follow the spec. `change check` will reuse the same shape.
- **T5 without enumerating paths:** two independent groups overlap when an existing repository file matches globs of both, when a wildcard-free entry of one matches a glob of the other, or when one glob `X/**` covers the static prefix (the segments before the first wildcard) of the other. "Independent" means neither group reaches the other through `depends`, directly or transitively.
- **Git access** goes through `git` subprocesses run in the repository root:
  - `git merge-base <base> HEAD`
  - `git rev-list <mb>..HEAD`
  - the `Task` trailer values via `%(trailers:key=Task,valueonly)`
  - changed files via `git diff-tree -r --name-only --no-commit-id`

  An unknown `--base` is an environment error (exit 2).
- **`status` and trailers:** `status --json` lists the commit of each task found through its trailer on `HEAD`, or `null`. Progress itself comes from the checkboxes.
- **Group states:**
  - `done`: every task ticked, or the group has no tasks
  - `in progress`: some tasks ticked
  - `ready`: none ticked, all dependencies done
  - `blocked`: none ticked, a dependency is not done

## Risks / Trade-offs

- [Walking the whole repository for T5 is slow in very large repos] → only runs when two independent groups exist, and skips `node_modules` and dot folders. Wildcard-free entries still cover dot paths.
- [Trailer parsing depends on git ≥ 2.22] → `specfold doctor` already checks the environment; older git is not a supported target.
