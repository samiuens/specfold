# Spec Delta

## MODIFIED Requirements

### Requirement: Agent tools
`migrate install` SHALL set up the tools named by `--tools` (default `agents,claude`), which takes the same lists as `specfold init --tools`, and write them as `tools` in `specfold.yaml`; with `--tools agents` it SHALL write nothing under `.claude/` and leave `CLAUDE.md` alone. With `omp` it SHALL set up the omp files as init does, and it SHALL never pass `omp` to `openspec init`.

#### Scenario: Agents only
- **WHEN** install runs with `--tools agents`
- **THEN** `.agents/skills/sf-lookup/SKILL.md` exists and no `.claude/` folder is created

#### Scenario: omp at install
- **WHEN** install runs with `--tools agents,claude,omp` in a repository without `openspec/`
- **THEN** `specfold.yaml` sets `tools: [agents, claude, omp]`, `.omp/hooks/pre/specfold.ts` exists, and `openspec init` ran with `--tools agents,claude`
