# specfold-tools Specification

## Purpose
Defines the `tools` setting, which names the agent tools a repository is set up for, and how the CLI recognizes the agent tool it runs under so agent-written knowledge names the right tool.

## Requirements

### Requirement: Tools setting
`specfold.yaml` SHALL accept a `tools` list whose entries are `agents`, `claude` and `omp`, and which SHALL contain `agents`. An unknown entry or a list without `agents` SHALL make every command that loads the settings fail with an environment error (exit 2) that names the key and the allowed entries.

#### Scenario: omp listed
- **WHEN** `specfold.yaml` sets `tools: [agents, claude, omp]`
- **THEN** commands that read the setting treat the repository as set up for Claude Code and omp

#### Scenario: Unknown tool
- **WHEN** `specfold.yaml` sets `tools: [agents, cursor]`
- **THEN** `specfold validate` exits with 2 and names `tools`, `cursor` and the allowed entries

### Requirement: Tools default
Without a `tools` key, the setting SHALL read as `[agents, claude]` when `agents.targets` includes `.claude/skills`, and as `[agents]` otherwise.

#### Scenario: Repository from an earlier release
- **WHEN** `specfold.yaml` has no `tools` key and the default `agents.targets`
- **THEN** the repository counts as set up for `agents` and `claude`, and not for `omp`

### Requirement: Agent signature under omp
When a command writes an agent's `generated.by` from `SPECFOLD_MODEL` and the environment shows it runs under omp (`OMPCODE` or `PI_SESSION_ID` set and not empty), it SHALL write `omp/<model>`. Otherwise it SHALL write `actors.agent_prefix` followed by the model, as before.

#### Scenario: New concept from omp
- **WHEN** `OMPCODE=1`, `SPECFOLD_MODEL=claude-opus-5-5` and `actors.agent_prefix: "claude-code/"` are set and `specfold new Decision decisions/x.md` runs
- **THEN** the new concept's `generated.by` is `omp/claude-opus-5-5`

#### Scenario: New concept from Claude Code
- **WHEN** `CLAUDECODE=1` and `SPECFOLD_MODEL=claude-opus-5-5` are set, neither `OMPCODE` nor `PI_SESSION_ID` is, and `actors.agent_prefix` is `claude-code/`
- **THEN** the new concept's `generated.by` is `claude-code/claude-opus-5-5`
