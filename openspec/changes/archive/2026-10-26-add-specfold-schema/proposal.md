# Proposal

## Why

OpenSpec's default `spec-driven` schema has no place for the confirmed user wish or for the knowledge a change creates, so both get lost (`/decisions/custom-openspec-schema.md`, `/decisions/rather-ask-than-assume.md`). The `specfold` schema adds a `brief` artifact before the proposal and a `knowledge` artifact before the tasks. It ships with templates in a shape `specfold change check` can parse, and with an `openspec/config.yaml` that tells every artifact where knowledge lives. The kit repo switches to it as soon as it lands (`/decisions/self-hosting.md`).

## What Changes

- New schema `template/openspec/schemas/specfold/`, forked from `spec-driven` (OpenSpec 1.15.0). Artifacts in order: `brief`, `proposal`, `specs`, `design`, `knowledge`, `tasks`.
- Templates:
  - `brief.md` (Wish, Decisions, Out of scope, Open questions, Confirmation)
  - `knowledge.md` (a `## Delta` YAML block plus Notes)
  - `tasks.md` (task groups as defined by `specfold-tasks`, with a Knowledge group and a `## Workflow follow-up` section that runs `specfold sync` after archive)
- New `template/openspec/config.yaml` with `schema: specfold`, a short `context`, `rules` for proposal, specs, knowledge and tasks, and `operations` guidance for apply and archive.
- The kit repo: `openspec/schemas/specfold/` becomes a copy of the template schema that CI keeps identical, and `openspec/config.yaml` switches to `schema: specfold`.

## Capabilities

### New Capabilities
- `specfold-schema`: the `specfold` OpenSpec schema, its artifact order and dependencies, its templates, and the shipped `openspec/config.yaml`.

### Modified Capabilities
- none

## Out of scope

- Checking `brief.md`, `knowledge.md` and `tasks.md` (`add-specfold-change-check`, `add-specfold-tasks`) and applying a knowledge delta (`add-specfold-sync`).
- The `sf-interview` skill that fills `brief.md` (M3). Until then the `brief` instruction tells the agent to ask the user directly.
- `specfold init` filling the `Stack:` line of the shipped `context` (M3 or later); the template keeps a placeholder.

## Decisions

Confirmed by the maintainer on 2026-10-26:

1. **One change per M2 capability**, one PR each: schema, tasks, change check, sync, then template settings (no specs).
2. **The template schema is canonical.** The kit's own `openspec/schemas/specfold/` is a copy, and CI fails when the two differ.
3. **The kit switches right after this change.** Later M2 changes carry `brief.md` and `knowledge.md`; `add-specfold-tasks` gets them added when it is implemented.
4. **Write before, sync after.** The Knowledge task group writes concept bodies before archive, so `openspec archive` sees every task ticked. `specfold sync` runs after archive as a Workflow follow-up step in the same PR.

## Confirmed in review

Confirmed by the maintainer on 2026-10-26, point by point:

1. **Artifact dependencies:** `brief` requires nothing, `proposal` requires `brief`, `specs` and `design` require `proposal`, `knowledge` requires `proposal` and `specs`, and `tasks` requires `specs`, `design` and `knowledge`. `design` stays optional, as in `spec-driven`.
2. **`apply` tracks `tasks.md`**, as in `spec-driven`, so `/opsx:apply` keeps working unchanged.
3. **Schema copy check:** a CI step compares the two schema folders byte for byte. A separate CLI command is not planned, because only the kit repo has two copies.
4. **Instruction text** reuses the upstream `spec-driven` instructions for `proposal`, `specs` and `design` unchanged, so upstream fixes can be merged by diff.

## Impact

- New files under `template/openspec/`, and a copy under `openspec/schemas/specfold/`.
- `openspec/config.yaml` in the kit repo moves to `schema: specfold`, with the knowledge and tasks rules.
- `.github/workflows/cli.yml` gets the schema copy check.
- Consumers: `specfold change check` and `specfold sync` (this milestone), the skills and `planner` (M3), and gate rules G5, G6 and G13 (M4).
