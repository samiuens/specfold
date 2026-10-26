# Proposal

## Why

Subagents work best on small, bounded units with clear owned files and a checkable outcome. Today `tasks.md` is free-form, so the orchestrator cannot tell which groups may run in parallel, implementers drift beyond their scope, and progress is invisible between sessions. A fixed, machine-checkable breakdown of every change into task groups and tasks makes parallel work safe and cheap (`/decisions/task-breakdown.md`).

## What Changes

- A fixed `tasks.md` shape: numbered task groups (`## 2. <name>`), each with a fenced YAML metadata block (`files`, `depends`, `scenarios`, `agent`), and numbered tasks (`- [ ] 2.1 ...`), each with a `Done when:` line.
- A commit trailer `Task: <change>#<group>.<task>`: one task, one commit.
- New command `specfold tasks check <change> [--base <ref>] [--json]`. `specfold change check` will include its findings (specified in `add-specfold-change-check`).
- New commands `specfold status [<change>] [--json]` and `specfold resume <change> [--json]`, which report progress per group and the next open task.
- New `specfold.yaml` keys `tasks.max_files_per_task` (default 5) and `tasks.max_tasks_per_group` (default 8); both limits only warn.

## Capabilities

### New Capabilities
- `specfold-tasks`: the `tasks.md` breakdown format, its check, the task commit trailer and progress reporting (`status`, `resume`).

### Modified Capabilities
- none

## Out of scope

- The `specfold` schema's `tasks` template and instruction and the `rules.tasks` lines in `openspec/config.yaml`: built with the schema in M2, described in `docs/plan.md`.
- Task packets and split-instead-of-grow for implementers: built with the subagent roles in M8, described in `docs/plan.md` and the decision.
- Gate rule G18 (blocking on `tasks check` errors) and its wiring: specified with `specfold gate` in M4, decided 2026-10-26 so the archived spec only describes behavior that exists.
- `change check` including the tasks findings: moved to `add-specfold-change-check`.

## Open points for review

Choices the request and the plan do not settle; each is written into the spec as proposed below and can be changed in review.

1. **Numbering errors** (gaps, duplicates, a task numbered for the wrong group) block, like missing metadata, because task ids must be unambiguous for trailers and `resume`.
2. **Unknown scenario ids** in `scenarios:` block. Empty `scenarios:` is allowed (for example tooling or the Knowledge group).
3. **Last group not named "Knowledge"** is a warning, not a block.
4. **Unknown `agent:` role** is a warning until M8 defines the roles.
5. **Missing `tasks.md`** is an error for `tasks check` and G18.
6. **Trailer checks** (ticked task without a commit, commit with an unknown task id, commit touching files outside its group) only warn, and run only with `--base`. The change's own `tasks.md` is exempt from the scope and size checks, because every task commit ticks it (found while dogfooding `add-specfold-validate`).
7. **`max_files_per_task`** is measured from the files changed by the commits that carry a task's trailer, so it is only checked with `--base`.
8. **Glob overlap** is decided from existing files plus nested `/**` directories (see the requirement), so it never needs to enumerate all possible paths.

## Impact

- New CLI source under `tools/specfold/`; fixtures with valid and broken `tasks.md` files.
- `specfold.yaml` gains the `tasks:` section.
- Later consumers: the `specfold` schema (M2), `specfold gate` (M4), the planner, spec-writer, plan-critic and implementer roles (M3, M8).
