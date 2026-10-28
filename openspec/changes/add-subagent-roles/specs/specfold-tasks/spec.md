# Spec Delta

## ADDED Requirements

### Requirement: Task packet
The CLI SHALL provide `specfold tasks packet <change> <group> [--json]`, which prints one task group's packet: the group's name, tasks with their `Done when:` lines, `files`, `depends`, each linked scenario with its WHEN and THEN lines (from the change's delta specs, else the main specs), the brief's wish and decision table, the paths of the knowledge concepts the proposal links, and the trailer format `Task: <change>#<n>.<m>`. An unknown change or group SHALL exit with 2.

#### Scenario: Packet for a group
- **WHEN** `specfold tasks packet add-guest-checkout 2` runs and group 2 links `checkout/guest-checkout#guest-pays-without-account`
- **THEN** the output holds group 2's tasks and files, the scenario's WHEN and THEN lines, the brief's decisions and `Task: add-guest-checkout#2.<m>`

#### Scenario: Unknown group
- **WHEN** `specfold tasks packet add-guest-checkout 9` runs on a change with three groups
- **THEN** the command exits with 2 and names the groups that exist
