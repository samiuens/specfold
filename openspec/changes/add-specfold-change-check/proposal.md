# Proposal

## Why

OpenSpec treats artifact dependencies as advisory and never validates custom artifacts: a change can be archived without a brief or a knowledge delta (`/references/openspec.md`, `/decisions/custom-openspec-schema.md`). `specfold change check` is the deterministic check of a change's `brief.md` and `knowledge.md`, and it runs the tasks check too, so hooks, the gate (G5, G13) and `specfold sync` share one verdict (`/decisions/deterministic-cli.md`).

## What Changes

- New command `specfold change check <change> [--json]` for an active change under `openspec/changes/<change>/`.
- Brief rules B0-B4: file present, sections present, confirmation filled in, open questions owned, decisions sourced. Changes with `skip_specs: true` need only Wish and Confirmation.
- Knowledge rules K0-K6: file present, delta parseable, ops well-formed, `empty_reason` for an empty delta, targets consistent with the bundle, a Capability op for every capability in the delta specs, no duplicate paths.
- It includes every finding of `specfold tasks check <change>` (rules T0-T11; `add-specfold-tasks`).

## Capabilities

### New Capabilities
- `specfold-change-check`: checking a change's `brief.md` and `knowledge.md` and combining the result with the tasks check.

### Modified Capabilities
- none

## Out of scope

- The identity check behind `confirmed_by` (G7) and the gate wiring for G5 and G13 (M4).
- `--staged` for the pre-commit hook (M4, with `specfold hook`).
- Archived changes: `specfold sync` re-runs the knowledge rules on them.

## Decisions

Confirmed by the maintainer on 2026-10-26: `change check` validates `brief.md` structurally with its own rule ids; G13 reuses that result, and the `confirmed_by` identity check stays in the gate (G7).

## Open points for review

1. **One change per call.** `<change>` is required, like `tasks check`; the gate loops over the changes in a PR.
2. **Open questions format:** each list item ends with `(owner: <actor>)` followed by a reason why it does not block the spec, for example `- Retention period? (owner: human:samiuens) Does not change any requirement.` An empty section, or one holding only `none`, passes.
3. **Decision sources** are `user`, `delegated` or `knowledge:/<path>.md`. A knowledge source must name an existing concept.
4. **Capability coverage by path:** a capability `<cap>` in the delta specs is covered by an op with `type: Capability` and `path: capabilities/<cap>.md`, which matches the kit's existing cards (`capabilities/specfold-new.md`). New capabilities need `op: create`, modified ones `op: update`.
5. **`create` on an existing file** passes when the existing file has the op's `type`, because the Knowledge group writes concepts before archive (write before, sync after). A different `type` is an error.
6. **`confirmed_at`** must be ISO 8601 with an offset, like every timestamp in the profile.
7. **`confirmed_by`** must be a `human:<login>` actor. Whether the login is really the confirming user is G7's job.

## Impact

- New CLI modules and fixtures under `tools/specfold/`; `change` becomes a command group with `check` as its first subcommand.
- Consumers: `specfold sync` (knowledge rules), git hooks and gate (M4), PostToolUse hook (M4).
