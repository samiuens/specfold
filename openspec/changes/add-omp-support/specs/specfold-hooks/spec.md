# Spec Delta

## ADDED Requirements

### Requirement: omp hook adapter
The template SHALL ship an inactive omp hook factory at `.specfold/tools/omp/hooks/pre/specfold.ts`, installed as `.omp/hooks/pre/specfold.ts` only when `tools` lists `omp`. It SHALL run `node scripts/specfold.mjs hook <name>` from the repository root for the events below and hold no check of its own. It SHALL never block or fail an omp event because the command could not run.

#### Scenario: CLI missing
- **WHEN** `scripts/specfold.mjs` is missing and an omp session starts
- **THEN** the session starts without Specfold context and no tool call is blocked

### Requirement: omp session start
At the start of each omp agent run in a main session, the adapter SHALL run `claude-session-start` once per session and pass its stdout to the agent as an injected message.

#### Scenario: Context at start
- **WHEN** an omp session starts its first run in a repository with two active changes
- **THEN** the agent receives the knowledge section list and both change names

### Requirement: omp post-edit check
After a successful omp `edit` or `write` call, the adapter SHALL run `claude-post-tool-use` once per written file with the event `{"tool_name": "Edit" or "Write", "tool_input": {"file_path": <path>}, "cwd": <session cwd>}` on stdin. On exit 2 it SHALL add the command's stderr to the agent's context for its next step.

#### Scenario: Agent writes a broken concept in omp
- **WHEN** an omp `write` creates `knowledge/decisions/x.md` without `type`
- **THEN** the agent's next step carries the validate error for that file

### Requirement: omp stop check
On omp's `session_stop` event of a main session, the adapter SHALL run `claude-stop`. On exit 2 it SHALL block the stop with the command's stderr as the reason, so the agent works on the blocking findings; on exit 0 it SHALL let the session stop.

#### Scenario: Unfinished work in omp
- **WHEN** an omp main session tries to stop while a touched change has an unconfirmed brief
- **THEN** the stop is blocked with the G13 finding as the reason

#### Scenario: Clean stop
- **WHEN** an omp main session tries to stop and the local gate has no blocking finding
- **THEN** the session stops

### Requirement: omp subagent push guard
In an omp task subagent session, before a `bash` call the adapter SHALL run `claude-no-push` with `{"tool_input": {"command": <command>}}` on stdin and block the call with the command's stderr as the reason when it exits with 2. Main sessions SHALL not run this guard.

#### Scenario: Subagent push refused
- **WHEN** an omp implementer subagent calls `bash` with `npm test && git push origin add-export`
- **THEN** the call is blocked with the reason that pushing and pull requests are the orchestrator's job

#### Scenario: Main session push left to permissions
- **WHEN** the main omp session calls `bash` with `git push origin add-export`
- **THEN** the adapter does not block it; `bash.patterns` decides
