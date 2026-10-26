# Proposal

## Why

The interview is only as good as its questions (`/decisions/rather-ask-than-assume.md`). The cheapest source of better questions is the user, right after a change, while they still remember where the agent guessed. The commands from `add-specfold-backlog` and `add-specfold-drift` also need the skills to use them, or agents keep planning without the backlog, the commitments and the drift flag.

## What Changes

- **sf-sync:** after `specfold sync`, it asks two retro questions with the native question UI: which question should the interview have asked earlier, and where did the agent guess instead of asking.
  - Answers go into `knowledge/conventions/interview-checklist.md`, grouped by topic and created with `specfold new` on the first answer.
  - New ideas become backlog items (`specfold backlog add --origin retro`).
  - Every retro, answered or skipped, gets a `log.md` entry of kind `Retro`.
  - It runs `specfold commitments fulfill` for a commitment the brief or proposal names as delivered by the change, after the user confirms (decided when implementation started; `kept` in a design only means not broken).
- **sf-interview:** loads the checklist groups matching the change as extra branches of its question tree (skipped when the file is absent). It offers anything put out of scope as a backlog item or, for "not now, but before X", a deferred commitment, and writes them only after the brief is approved.
- **sf-lookup:** reports the `drift` flag and the vision and open commitments block.
- **Kit and sample app:** the template skills and their copies are updated; the M5 proof runs on `examples/sample-app`:
  - `specfold trace` and `specfold drift` report correctly;
  - the backlog item "Rename an item" is promoted with `specfold backlog promote` and carried through interview, propose, apply, archive and sync; the planned `add-priorities` change stays untouched.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- none (skills and the sample app only; `skip_specs: true`)

## Out of scope

- A separate retro skill.

## Open points

1. **Retro skipping** is the user's choice in the question UI ("skip retro"), never the agent's; a timed-out question counts as skipped and is logged as such.
2. **The checklist is a `Convention`**, written as `status: draft` by the agent from the user's words; it only grows from answers.
3. **The kit** runs the retro for its own changes from this change on.

## Impact

- `template/.agents/skills/sf-sync`, `sf-interview`, `sf-lookup` and their kit and sample-app copies.
- `examples/sample-app`: tests with scenario references, one promoted backlog item and its archived change.
