# Proposal

## Why

Subagents do their best work on small, bounded units with a clear outcome, and a change's `tasks.md` already splits the work that way ([task breakdown](/decisions/task-breakdown.md)). What is missing is the layer that uses it: roles with the right tools and models, one way to hand a task group to an implementer, and a rule that an implementer stops instead of quietly reaching outside its files. Only the planner ships today. The main session would have to improvise every hand-off, and nothing stops a subagent from pushing or spawning further agents.

## What Changes

- **Five subagent roles** in `template/.claude/agents/` (with the kit's and sample app's copies):

  | Role | Model, effort | Tools | Isolation |
  | --- | --- | --- | --- |
  | `scout` | haiku, low | read-only | none |
  | `spec-writer` | opus, high | edits OpenSpec changes | none |
  | `implementer` | sonnet, medium | full minus `Agent` | worktree |
  | `verifier` | opus, high | read-only | none |
  | `knowledge-curator` | sonnet, medium | edits knowledge | none |

  - The implementer starts with `specfold wt setup` and works its packet task by task, one commit per task with the `Task:` trailer.
  - It returns its branch, or a split proposal when a task needs files outside its group or clearly exceeds the size limits.
  - A PreToolUse hook in its frontmatter refuses `git push` and `gh pr`.
- **Skill `sf-apply`** for the main session as orchestrator:
  - it checks the breakdown and the limit, runs groups whose dependencies are merged (in parallel up to `specfold parallel show`, one at a time at 1) and merges each branch into the change branch;
  - it regenerates indexes, re-dispatches on verifier findings, and handles split proposals through `spec-writer` and the user;
  - patterns 1 and 3 are described there, and agent teams stay off.
- **`specfold tasks packet <change> <group>`** prints a group's task packet:
  - the group's tasks, owned files, `depends`, linked scenarios with their text;
  - the brief's wish and decisions, and the concepts the proposal links;
  - the trailer format.
- **`specfold hook claude-no-push`** reads a PreToolUse event and blocks `git push` and `gh pr` commands with exit 2.
- **Template settings:** `env.CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH: "1"`, so only the main session spawns subagents.
- **Knowledge:** backlog items for `integrator` and `plan-critic`.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `specfold-tasks`: the packet command.
- `specfold-hooks`: the no-push hook.

## Out of scope

- `integrator` and `plan-critic` (backlog items).
- Agent teams.
- Worktree commands and the subagent limit (`add-specfold-wt`), the proof run (`add-pattern-2-run`).

## Open points

1. **Linked scenarios in the packet:** each `scenarios:` id is resolved in the change's delta specs first, then the main specs, and printed with its WHEN/THEN lines; an unknown id is printed as unknown (T6 reports it separately).
2. **What no-push matches:** `git push` and `gh pr` anywhere in the command, including after `&&` or `;`; other `gh` and `git` commands pass.
3. **Merging:** `sf-apply` merges an implementer's branch with `git merge --no-ff` into the change branch, regenerates indexes with `specfold index`, and stops on a conflict outside generated files, asking the user.

## Impact

- `src/tasks/` (packet), `src/hooks/claude.ts` and the hook registry.
- `template/.claude/agents/`, `template/.agents/skills/sf-apply/`, `template/.claude/settings.json` and their copies; the template manifest.
- Knowledge: the agent-layer architecture, the tasks and hooks cards, the task-breakdown decision.
