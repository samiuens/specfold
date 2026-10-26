# Proposal

## Why

A user repo created from `template/` has no `specfold.yaml`, so every command falls back to built-in defaults or fails with "no specfold.yaml". The code-comment convention is part of the template, not just the kit (`docs/plan.md`, section "Convention: code comments point to knowledge"; moved from M1 to M2 on 2026-10-26). M2 also ends with the proof that the whole loop works in a fresh repo: `examples/sample-app`.

## What Changes

- `template/specfold.yaml` with the shipped defaults: types, folders, `source_globs` placeholder, `actors.agent_prefix`, `requires.openspec`, `tasks` limits, empty `hooks.extra`. It describes the payload, not the kit.
- `template/knowledge/conventions/code-comments.md` (`type: Convention`): short comments, rationale in knowledge, `see knowledge: /<path>.md` references.
- `examples/sample-app`: a tiny Node app with no dependencies (tests with `node:test`), set up from `template/`, with one change run end to end: brief, proposal, specs, knowledge, tasks, apply, archive, sync.
- The kit's own CI runs `specfold validate`, `specfold tasks check` and `openspec validate --strict` in `examples/sample-app`.

## Capabilities

### New Capabilities
- none (`skip_specs: true`: shipped files and an example, no new CLI behavior)

### Modified Capabilities
- none

## Out of scope

- `AGENTS.md` and `CLAUDE.md` in the template, and their link to the convention (M3).
- `specfold init` filling `source_globs` and the `Stack:` line (M3 or later).

## Decisions

Confirmed by the maintainer on 2026-10-26: the sample app is plain Node with no dependencies, so CI needs no extra install and the focus stays on the workflow.

## Confirmed in review

Confirmed by the maintainer on 2026-10-26, point by point:

1. **Sample app domain:** a tiny to-do list library with a single change, `add-due-dates`, which brings one capability, one decision and a few tasks. It is small enough to read in a minute.
2. **How the sample app gets the template:** it is a committed copy of `template/` plus its own files. CI fails when the kit-owned files differ from `template/`, the same approach as the schema copy.
3. **The sample app's brief** is confirmed by the maintainer, as a human, in its own commit. The agent never fills it in.

## Impact

- New files under `template/` and `examples/sample-app/`.
- `.github/workflows/cli.yml` gets the sample-app job.
