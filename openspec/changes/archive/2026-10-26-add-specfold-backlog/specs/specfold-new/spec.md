## ADDED Requirements

### Requirement: Future-facing keys
A `Backlog Item` SHALL also get `state: open`, `priority: medium` and `origin` set to the actor of `generated.by`. A `Deferred Commitment` SHALL also get `state: open` and an empty `trigger`, and `committed_by: human:<login>` only when the command runs for a human by the rules of `specfold verify` (login source and agent detection); otherwise `committed_by` SHALL be left out.

#### Scenario: Commitment drafted by an agent
- **WHEN** `specfold new "Deferred Commitment" commitments/eu-data.md` runs with `SPECFOLD_MODEL` set
- **THEN** the concept has `state: open` and no `committed_by`

#### Scenario: Commitment written by a human
- **WHEN** a human whose login is `ana` runs the same command at a terminal
- **THEN** the concept has `committed_by: human:ana`
