# Design

## Context

- **Roles and skill** from `add-subagent-roles`:
  - `sf-apply` dispatches `implementer` subagents with `isolation: worktree`, each with its `specfold tasks packet`;
  - the kit's `.claude/settings.json` sets `worktree.baseRef: "head"` and a spawn depth of 1.
- **The sample app** lives in `examples/sample-app/` of the kit repository: its own `specfold.yaml`, specs and knowledge, but the kit's git repository. A subagent worktree is therefore a worktree of the kit, and its paths into the sample app start with `examples/sample-app/`.
- **`src/todo.js`** keeps `isCalendarDate` private, so a group that must validate due dates with `add`'s check needs a file it does not own.
- **Commits** in the kit follow the kit's convention (`feat(template): ...` for the sample app, as earlier sample changes did), checked by the commit-msg hook in every worktree.

## Goals / Non-Goals

**Goals:** a real parallel run with three groups and real merges; a split proposal that comes from the work, not from an instruction to fail; a record good enough to repeat the run.

**Non-Goals:** patterns 1 and 3; kit behavior changes during the run (findings become tasks the user approves, or follow-ups).

## Decisions

- **The change `add-exports`:**
  - planned in the sample app, with the user as product owner (brief Q1-Q5 confirmed 2026-10-28) and its artifacts written by the `spec-writer` role;
  - three module groups plus "Knowledge", without the wiring group the proposal mentioned: the modules take an items array, so nothing needs wiring, and a fourth group owning `src/todo.js` would collide with the split's new group.
- **The split** comes from task 2.2: "check due dates with the same function `add` uses (`isCalendarDate` in `src/todo.js`, imported, not copied)". The implementer must either touch `src/todo.js` (outside its files) or stop; its instructions say stop. The record states that the task was worded on purpose.
- **Dispatch prompt** = the packet from `cd examples/sample-app && node scripts/specfold.mjs tasks packet add-exports <n>`, verbatim, after three lines that are part of the record:
  - the sample app is `examples/sample-app/` in this repository, and the packet's paths are relative to it;
  - run its tests with `npm test` from there;
  - before anything else, confirm the worktree holds `examples/sample-app/openspec/changes/add-exports/tasks.md`; if it does not, stop with `BASE MISSING`, so a base other than HEAD shows up at once.
- **Merging:** the orchestrator (this session) merges each `DONE` branch into `add-pattern-2-run` with `git merge --no-ff`, runs the sample app's `specfold index` and the kit's checks, and handles the split per `sf-apply`.
- **The record** `examples/runs/pattern-2/README.md`:
  - the timeline (dispatch and finish order, wall-clock times from `date`);
  - each group's final message, verbatim;
  - the merge commits and any conflicts;
  - the split proposal and how it was resolved;
  - the verifier's verdict;
  - findings about the kit.

  `examples/README.md` links it.

## Risks / Trade-offs

- [The implementer copies the date check instead of splitting] → the task's wording forbids a copy; if it copies anyway, the verifier and the orchestrator treat it as a finding, and the record says the split did not happen.
- [Kit worktrees install the kit's dependencies through `wt setup`] → slower, but it is the real path.

## Commitments

none
