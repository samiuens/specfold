# specfold-schema Specification

## Purpose
Defines the `specfold` OpenSpec schema that every Specfold change uses: its artifacts and their order, the templates that give `brief.md`, `knowledge.md` and `tasks.md` a checkable shape, and the shipped `openspec/config.yaml`.

## Requirements

### Requirement: Schema location and validity
The template SHALL ship the schema `specfold` in `template/openspec/schemas/specfold/` with a `schema.yaml` and one file per template in `templates/`. `openspec schema validate specfold`, run with OpenSpec 1.15.0 in a repository holding this folder under `openspec/schemas/`, SHALL report the schema as valid.

#### Scenario: Schema validates
- **WHEN** `openspec schema validate specfold` runs in the template
- **THEN** it reports the schema `specfold` as valid and exits with 0

### Requirement: Artifact order and dependencies
The schema SHALL define the artifacts `brief` (`brief.md`), `proposal` (`proposal.md`), `specs` (`specs/**/*.md`), `design` (`design.md`), `knowledge` (`knowledge.md`) and `tasks` (`tasks.md`), in that order. `brief` SHALL require nothing, `proposal` SHALL require `brief`, `specs` and `design` SHALL require `proposal`, `knowledge` SHALL require `proposal` and `specs`, and `tasks` SHALL require `specs`, `design` and `knowledge`.

#### Scenario: Brief comes first
- **WHEN** `openspec status --change <name> --json` runs for a new, empty change using the schema
- **THEN** `brief` is the only artifact that is ready, and `proposal` is blocked by `brief`

#### Scenario: Tasks wait for knowledge
- **WHEN** a change has `brief.md`, `proposal.md`, `design.md` and a delta spec but no `knowledge.md`
- **THEN** `openspec status` reports `tasks` as blocked by `knowledge`

### Requirement: Apply tracks tasks
The schema SHALL make `apply` require `tasks` and track `tasks.md`.

#### Scenario: Apply reads the task list
- **WHEN** `openspec instructions apply --change <name> --json` runs for a change with `tasks.md`
- **THEN** the output names `tasks.md` as the tracked file

### Requirement: Brief template
The `brief` template SHALL contain, in order, the level-2 sections `Wish`, `Decisions` (a table with the columns `#`, `Question`, `Answer` and `Source`), `Out of scope`, `Open questions` and `Confirmation` (the lines `confirmed_by:` and `confirmed_at:`). The `brief` instruction SHALL tell the agent to ask the user every open decision, one per question with a recommended answer, before writing, and never to fill `Confirmation` without the user's explicit approval.

#### Scenario: Brief rendered for a new change
- **WHEN** `openspec instructions brief --change <name>` runs
- **THEN** the template in the output contains the five sections in order, and the instruction says that only the user's approval fills `Confirmation`

### Requirement: Knowledge template
The `knowledge` template SHALL contain a level-2 section `Delta` holding one fenced `yaml` block with an `ops` list (entries with `op`, `path`, `type` and `summary`) and an `empty_reason` key, followed by a level-2 section `Notes`. The `knowledge` instruction SHALL require a Capability entry for every capability in the change's delta specs.

#### Scenario: Knowledge rendered for a change
- **WHEN** `openspec instructions knowledge --change <name>` runs
- **THEN** the template contains `## Delta` with a `yaml` block listing `ops` and `empty_reason`, then `## Notes`

### Requirement: Tasks template
The `tasks` template and instruction SHALL describe the task breakdown defined by the `specfold-tasks` capability: numbered groups with a `yaml` metadata block, numbered tasks with a `Done when:` line, a last group named `Knowledge` that writes the concepts listed in `knowledge.md`, and a `## Workflow follow-up` section that runs `specfold sync <change>` after archive.

#### Scenario: Tasks rendered for a change
- **WHEN** `openspec instructions tasks --change <name>` runs
- **THEN** the template shows a group with `files`, `depends`, `scenarios` and `agent`, a task with `Done when:`, a final `Knowledge` group and a `Workflow follow-up` step naming `specfold sync`

### Requirement: Shipped OpenSpec config
The template SHALL ship `template/openspec/config.yaml` with `schema: specfold`, a `context` that points to `knowledge/index.md` and `openspec/specs/` and holds a `Stack:` placeholder line, `rules` entries for `proposal`, `specs`, `knowledge` and `tasks`, and `operations` guidance for `apply` and `archive`. OpenSpec 1.15.0 SHALL accept the file without warnings about unknown keys or artifact ids.

#### Scenario: Config loads cleanly
- **WHEN** `openspec instructions proposal --change <name>` runs in the template
- **THEN** no warning about unknown rule artifact ids or config keys is printed, and the `context` appears as project context

### Requirement: Kit schema copy
In the kit repository, `openspec/schemas/specfold/` SHALL be byte-identical to `template/openspec/schemas/specfold/`, and the kit's CI SHALL fail when the two differ.

#### Scenario: Drifted copy
- **WHEN** a commit changes `template/openspec/schemas/specfold/templates/brief.md` but not the kit copy
- **THEN** the CI schema copy check fails and names the differing file
