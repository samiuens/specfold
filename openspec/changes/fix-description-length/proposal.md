# Proposal

## Why

`specfold validate` rejects a concept whose `description` has more than 160 characters (rule P2), but `specfold new --description` and `specfold backlog add` write such a description without complaint. The file then fails validation, and the gate blocks the PR until someone shortens it by hand.

## What Changes

- `specfold new` refuses a description over 160 characters with exit 2 and writes nothing. The error names the length and the limit, and says longer text belongs in the body.
- `specfold backlog add` applies the same rule to the description it writes: `--description`, or the title when no description is given. For a long title, the error suggests a shorter `--description`.
- Characters are counted the way validate counts them, as code points.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `specfold-new`: description length.
- `specfold-backlog`: a long description or title in `backlog add`.

## Out of scope

- `specfold sync` stubs, whose summaries `change check` already limits.

## Impact

- Code: `tools/specfold/src/new/command.ts`, `src/backlog/command.ts`, the bundle and its template copy.
- Knowledge: the new and backlog capability cards.
