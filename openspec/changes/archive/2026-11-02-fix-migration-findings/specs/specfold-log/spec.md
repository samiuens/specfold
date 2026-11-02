## MODIFIED Requirements

### Requirement: Missing log
When the bundle has no `log.md`, the command SHALL create it with the title `# Log` followed by the date heading and the entry, and then rewrite the root `index.md` so it lists the log.

#### Scenario: First entry
- **WHEN** `knowledge/log.md` does not exist and a user adds an entry
- **THEN** `knowledge/log.md` contains `# Log`, the date heading and the entry

#### Scenario: Root index lists the new log
- **WHEN** `knowledge/log.md` does not exist, `knowledge/index.md` is current, and a user adds an entry
- **THEN** `knowledge/index.md` ends with the `# Log` section and `specfold index --check` reports nothing
