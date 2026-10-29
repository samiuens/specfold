## ADDED Requirements

### Requirement: Description length
`specfold new` SHALL refuse a description longer than 160 characters, counted as code points like validate's rule P2: it SHALL exit with 2, write nothing, and name the length, the limit and that longer text belongs in the concept's body.

#### Scenario: Description too long
- **WHEN** a user runs `specfold new Decision decisions/x.md --description` with a 161-character text
- **THEN** the command exits with 2, names 161 characters and the limit of 160, and `knowledge/decisions/x.md` does not exist

#### Scenario: Description at the limit
- **WHEN** a user runs `specfold new Decision decisions/x.md --description` with a 160-character text
- **THEN** the file is created and `specfold validate` reports no P2 finding for it
