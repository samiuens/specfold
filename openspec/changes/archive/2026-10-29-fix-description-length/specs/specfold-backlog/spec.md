## ADDED Requirements

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
