# Proposal

## Why

M8 is done when pattern 2 is shown to work, not just described: three task groups from a `tasks.md` that passes `specfold tasks check` run in parallel worktrees on the sample app and merge cleanly, and one implementer returns a split proposal instead of widening its scope. The M6 migrations were proven the same way, by recorded runs in `examples/`.

## What Changes

- **A new sample-app change `add-exports`**, planned in the sample app with the `specfold` schema:
  - three groups own disjoint new modules with their tests: CSV export (`src/export-csv.js`), JSON import (`src/import-json.js`) and summary counts (`src/summary.js`);
  - a fourth, dependent group wires them into `src/todo.js`;
  - one task of the import group also needs a one-line export from `src/todo.js`, outside its files, which is set up on purpose to provoke the split proposal.
- **The run:**
  - this session orchestrates with `sf-apply`;
  - three `implementer` subagents run at once in `isolation: worktree`;
  - their branches merge into the change branch, the split proposal goes through `spec-writer` and the user, then the verifier, archive and sync.
- **The record** `examples/runs/pattern-2/README.md`: the packets sent, the timeline of the groups, the merge, the split proposal word for word, the verifier result, and what the run changed in the kit.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- none

## Out of scope

- Patterns 1 and 3 beyond their description in `sf-apply`.
- Kit behavior changes; findings from the run become their own follow-up or are fixed here only as tasks the user approves.

## Impact

- `examples/sample-app/` (the new change, code, tests, specs and knowledge after archive) and `examples/runs/pattern-2/`.
- `examples/README.md`.
