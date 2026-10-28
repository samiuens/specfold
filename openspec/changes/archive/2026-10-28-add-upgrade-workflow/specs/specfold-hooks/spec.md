# Spec Delta

## ADDED Requirements

### Requirement: Upgrade reminder
`specfold hook claude-session-start` SHALL print one line naming the newer version and `specfold upgrade` when a newer release is on the repository's channel. It SHALL query the source at most once a day with a 2-second limit, cache the result in `.specfold/local-state.json`, print nothing when the check fails, and skip the check when `upgrade.reminder` is `false`.

#### Scenario: Release waiting
- **WHEN** `kit_version` is `0.1.0-rc.2` and the cached check from today found `0.1.0-rc.3`
- **THEN** stdout has one line naming `0.1.0-rc.3` and `specfold upgrade`, and the source is not queried again

#### Scenario: Offline
- **WHEN** the source can't be reached within 2 seconds
- **THEN** no reminder line is printed and the hook exits with 0

#### Scenario: Turned off
- **WHEN** `upgrade.reminder` is `false`
- **THEN** the hook prints no reminder and queries nothing
