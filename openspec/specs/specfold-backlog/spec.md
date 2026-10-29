# specfold-backlog Specification

## Purpose
Defines `specfold backlog`, which adds, lists, promotes and drops backlog items in `knowledge/backlog/`.

## Requirements

### Requirement: Backlog command
The CLI SHALL provide `specfold backlog add <title> [--priority <p>] [--origin <text>] [--description <text>]`, `specfold backlog list [--state <state>]`, `specfold backlog promote <item> [--name <change>]` and `specfold backlog drop <item> --reason <text>`, each with `--json`. `<item>` SHALL be a path or file name of a concept in `knowledge/backlog/`. Every subcommand SHALL exit with 0 on success, 1 when the item is refused, and 2 on usage or environment errors.

#### Scenario: Unknown item
- **WHEN** `specfold backlog drop nope --reason x` runs and no backlog item `nope` exists
- **THEN** the command exits with 2 and names the item

### Requirement: Add
`backlog add` SHALL create `knowledge/backlog/<kebab-case title>.md` as `specfold new "Backlog Item"` would, with `--priority` (default `medium`), `--origin` (default the actor of `generated.by`) and `--description`, then regenerate the indexes.

#### Scenario: Idea from an interview
- **WHEN** `specfold backlog add "Dark mode" --origin interview` runs
- **THEN** `knowledge/backlog/dark-mode.md` exists with `state: open`, `priority: medium`, `origin: interview`, and `knowledge/backlog/index.md` lists it

### Requirement: List
`backlog list` SHALL print one line per item with its state, priority, path and title, sorted by priority (high first) and then path, showing only `open` items unless `--state` names another state or `all`.

#### Scenario: Open items only
- **WHEN** the backlog holds one open and one dropped item
- **THEN** `specfold backlog list` prints only the open item

### Requirement: Promote
`backlog promote` SHALL refuse an item whose `state` is not `open`. Otherwise it SHALL run `openspec new change <name>`, where `<name>` is `--name` or the item's file name without `.md`, set `state: promoted` and `change: <name>` on the item, and print the change folder and the next step: run the planning interview with the item as its seed. It SHALL NOT write `brief.md`. When the `openspec` CLI is missing or fails, it SHALL change nothing and exit with 2.

#### Scenario: Item promoted
- **WHEN** `specfold backlog promote dark-mode --name add-dark-mode` runs on an open item
- **THEN** `openspec/changes/add-dark-mode/` exists without `brief.md`, the item has `state: promoted` and `change: add-dark-mode`, and the output names the planning interview as the next step

#### Scenario: Already promoted
- **WHEN** the item already has `state: promoted`
- **THEN** the command exits with 1 and creates no change

### Requirement: Drop
`backlog drop` SHALL set `state: dropped` and `reason: <text>` on an `open` item and refuse items in any other state.

#### Scenario: Idea dropped
- **WHEN** `specfold backlog drop dark-mode --reason "no demand"` runs on an open item
- **THEN** the item has `state: dropped` and `reason: no demand`

### Requirement: Add description length
`backlog add` SHALL apply the description limit of `specfold new` to the description it writes: `--description` when given, otherwise the title. When the title is too long, the error SHALL suggest a shorter `--description`. Titles themselves SHALL have no length limit.

#### Scenario: Long description
- **WHEN** `specfold backlog add "Dark mode" --description` runs with a 200-character text
- **THEN** the command exits with 2 and no backlog item is created

#### Scenario: Long title without a description
- **WHEN** `specfold backlog add` runs with a 170-character title and no `--description`
- **THEN** the command exits with 2 and suggests `--description`

#### Scenario: Long title with a short description
- **WHEN** `specfold backlog add` runs with a 170-character title and a short `--description`
- **THEN** the backlog item is created with that description
