# omp run: hooks, rules and an isolated implementer

A recorded run of the omp agent check on the sample app, on 2026-11-15, for the kit change `add-omp-support`. It shows that a repository set up with `tools: [agents, omp]` gets the Specfold context at session start, a stop blocked by the local gate, sf-apply dispatching an isolated implementer, a subagent push refused, and agent writes signed `omp/`.

## Setup

- **omp:** 18.20.2, run headless with `omp -p --auto-approve --model=sonnet` (Claude Sonnet 4.5). Each step below is one omp session.
- **Repository:** a copy of `examples/sample-app` at `/tmp/specfold-omp-run`, outside the kit, with a bare local remote. The sample app is on kit 0.2.1, so the new bundle, `.specfold/tools/` and `.claude/agents/` were copied in from the kit before `specfold init --tools agents,omp`. The steps are in the sample app's README, section "omp: hooks, rules and an isolated implementer".
- **Init:** wrote `.omp/hooks/pre/specfold.ts`, five roles in `.omp/agents/` (no planner), the four `task` keys and 21 `bash.patterns` entries in `.omp/config.yml`. It ran `openspec init --tools agents`, without `omp`.

## Steps

| # | Prompt (short) | What happened |
| --- | --- | --- |
| 1 | Quote the "Active changes:" line from the Specfold context | Answered `Active changes: add-priorities`: the session-start context arrived through `before_agent_start`. |
| 2 | Reply READY and finish; if the stop is blocked, quote the reason and delete `openspec/changes/demo` | The demo change had a brief with no confirmation. The agent replied READY, `session_stop` blocked with the gate's G3 and G13 findings, the agent quoted the first one and deleted the folder, and the next stop went through. |
| 3 | Use sf-apply to apply only task group 1 of `add-priorities` | One `implementer` task with `isolated: true` and the packet verbatim. omp reported branch `omp/task/AddPrioritiesGroup1`, which the orchestrator merged with `--no-ff` (merge `3b146c7`). The implementer's commit carried `Task: add-priorities#1.1`, and `npm test` passed 31 tests. |
| 4 | Spawn one task subagent that runs `git push origin HEAD` | The adapter's `tool_call` guard blocked the call with "pushing and pull requests are the orchestrator's job; return your branch name instead". The remote stayed at the initial commit. |
| 5 | Write a draft Decision with sf-capture | `knowledge/decisions/priorities-as-fixed-levels.md` got `generated: { by: omp/anthropic/claude-sonnet-4-5, ... }`, which `specfold validate` accepts. |

## Findings

- **The implementer edited a file outside its packet.** Its commit changed `test/rename.test.js` as well as the group's three files. This is the model breaking the packet's scope rule, which applies in Claude Code too; the verifier and the gate are the backstops. Nothing omp-specific.
- **omp commits leftovers of an isolated task.** Besides the implementer's commit, the task branch had a commit named after the task that added `.specfold/wt-index`, written by `specfold wt setup` inside the workspace. The current template's `.gitignore` ignores that file. The 0.2.1 sample app has no `.gitignore`, which is why the file was picked up.
- **sf-apply left the task branch behind.** The orchestrator merged `omp/task/AddPrioritiesGroup1` but did not delete it, although the "In omp" section says to.
- **Init in a repository without an `agents:` key.** The sample app's `specfold.yaml` predates `agents.targets`, so its default `.claude/skills` stayed. Init therefore still linked the OpenSpec skills there and wrote `.claude/settings.json`, although `tools` has no `claude`. `--tools agents` behaved the same before this change; a repository made from the current template has the key and gets `targets: []`.
- **The model id comes with its provider.** omp agents set `SPECFOLD_MODEL` to `anthropic/claude-sonnet-4-5`, so the actor reads `omp/anthropic/claude-sonnet-4-5`. It is valid; it is just longer than the Claude Code form.
