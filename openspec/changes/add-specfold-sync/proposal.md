# Proposal

## Why

After a change is archived, its knowledge delta has to land in the bundle: capability cards pointing at the archived spec, deprecated concepts flagged, indexes regenerated, a log entry written. These steps are mechanical, and agents doing them by hand forget some or get paths wrong. `specfold sync` applies the deterministic part of `knowledge.md`, so the `sf-sync` skill (M3) only writes prose (`/decisions/deterministic-cli.md`, `/decisions/custom-openspec-schema.md`).

## What Changes

- New command `specfold sync <change> [--dry-run] [--json]` for an archived change.
- It re-runs the knowledge rules K0-K6 of `specfold change check` against the archived change, and writes nothing on errors.
- Per op:
  - `create`: a stub when the file is missing (via the `specfold new` templates, `summary` as description); otherwise the file is kept.
  - `deprecate`: `status: deprecated`.
  - `update`: no frontmatter change.
- Capability ops: `spec`, `resource`, `change` and a `proposal` source (plus `design` when it exists). Decision ops with `op: create`: `change`.
- Then it regenerates the indexes and adds one log entry for the change, unless that entry exists.
- Idempotent: a second run changes nothing.

## Capabilities

### New Capabilities
- `specfold-sync`: applying the deterministic part of an archived change's knowledge delta to the bundle.

### Modified Capabilities
- none

## Out of scope

- Writing or rewriting concept bodies (Knowledge task group, `sf-sync` skill in M3).
- Gate rule G6, which checks that the delta was applied (M4).
- Running on an active change: the archived id is only known after archive.

## Decisions

Confirmed by the maintainer on 2026-10-26: **write before, sync after.** The Knowledge task group writes the concept bodies before archive; `specfold sync` runs after archive as a Workflow follow-up step in the same PR and fills in whatever is missing.

## Open points for review

1. **Resolving the change:** `<change>` is the change name (`add-guest-checkout`) or the archived id (`2026-10-26-add-guest-checkout`). With a name, the newest archived folder ending in `-<name>` is used. An active change with that name and no archived one is an environment error (exit 2) telling you to archive first.
2. **Stub actor:** `<actors.agent_prefix><SPECFOLD_MODEL>` when that variable is set, otherwise `process:specfold-sync`, the same rule as `specfold new`.
3. **Stub title:** derived from the file name (`guest-checkout.md` → `Guest checkout`).
4. **Existing keys** are replaced when they differ, so `spec`, `resource` and `change` always point at the archived change. Other frontmatter, its key order and the body are kept.
5. **Log entry:** `* **Change**: <archived-id>: created <n>, updated <n>, deprecated <n>` under today's date. If any log line already names the archived id, no new entry is added.
6. **`update` ops** only count in the log entry; the body is the Knowledge group's job.
7. **Exit codes:** 0 when synced (also when nothing changed), 1 on knowledge-rule errors, 2 on usage or environment errors.

## Impact

- New CLI module under `tools/specfold/src/sync/`. It reuses the `new` templates, `index` generation and `log` insertion.
- Consumers: the Workflow follow-up step of every change, the `sf-sync` skill (M3), gate rule G6 (M4).
