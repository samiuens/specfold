# Spec Delta

## ADDED Requirements

### Requirement: Claude no-push guard
`specfold hook claude-no-push` SHALL read a Claude Code PreToolUse event from stdin and, when its Bash command runs `git push` or `gh pr` in any part of the command, print why to stderr and exit with 2; every other event SHALL exit with 0 and print nothing.

#### Scenario: Push refused
- **WHEN** the event's command is `npm test && git push origin add-export`
- **THEN** the hook exits with 2 and says that pushing and pull requests are the orchestrator's job

#### Scenario: Other commands pass
- **WHEN** the event's command is `git commit -m "feat: add export"`
- **THEN** the hook exits with 0 and prints nothing
