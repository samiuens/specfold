## ADDED Requirements

### Requirement: Design template
The `design` template SHALL end with a level-2 section `Commitments`, which lists every open deferred commitment the change touches as a bundle-absolute link followed by `: kept` or `: blocked: <reason>`, or the single line `none` when no open commitment is touched.

#### Scenario: Design rendered for a change
- **WHEN** `openspec instructions design --change <name>` runs
- **THEN** the template ends with `## Commitments` and explains the `kept` and `blocked` entries

## MODIFIED Requirements

### Requirement: Shipped OpenSpec config
The template SHALL ship `template/openspec/config.yaml` with `schema: specfold`, a `context` that points to `knowledge/index.md` and `openspec/specs/` and holds a `Stack:` placeholder line, `rules` entries for `proposal`, `specs`, `design`, `knowledge` and `tasks`, and `operations` guidance for `apply` and `archive`. The `design` rule SHALL tell the agent to look up the open commitments touching the change and record each in the `Commitments` section. OpenSpec 1.15.0 SHALL accept the file without warnings about unknown keys or artifact ids.

#### Scenario: Config loads cleanly
- **WHEN** `openspec instructions proposal --change <name>` runs in the template
- **THEN** no warning about unknown rule artifact ids or config keys is printed, and the `context` appears as project context

#### Scenario: Design rule shown
- **WHEN** `openspec instructions design --change <name>` runs in the template
- **THEN** the rules in the output include the instruction to record open commitments in `Commitments`
