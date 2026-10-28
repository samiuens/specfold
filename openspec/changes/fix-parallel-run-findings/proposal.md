# Proposal

## Why

The recorded pattern-2 run ([parallel run findings](/backlog/fix-the-parallel-run-findings.md)) met M8's done-when, but only because the orchestrator worked around eight gaps by hand: it checked git when subagents handed back `placeholder` and `pending`, told re-dispatched implementers which tasks were already done, and accepted that a second round's branch names collided. The gate's task-scope checks were no help in the sample app, because they compared repository paths with root-relative globs. Each workaround lived only in one dispatch prompt; the next run would hit them again.

## What Changes

- **`specfold tasks packet`** marks ticked tasks `[done]` (`done: true` in JSON), and its rules say to start at the first open task.
- **T10 and T11** read commit files relative to the directory holding `specfold.yaml` (`git log --relative`), so a nested Specfold root gets correct scope and size findings; files outside it don't count.
- **`specfold wt clean --base <ref>`** removes worktrees whose branches are merged into `<ref>` instead of the default branch; an unknown ref exits with 2.
- **Roles** (`template/.claude/agents/`, with the kit's and sample app's copies):
  - every role sends its final message only after its last command succeeded, never a status like "pending";
  - the implementer keeps the branch its worktree was created on and reports it, instead of creating `<change>-group-<n>`;
  - the verifier runs `specfold gate --base <default branch> --local`.
- **`sf-apply`:**
  - after each merge round, run `specfold wt clean --base <change branch>`;
  - a subagent working on the change branch itself (the knowledge curator) owns it until it reports, so the orchestrator waits;
  - step 9: the orchestrator runs sf-sync's retro, since subagents can't ask the user;
  - Claude Code lists skill copies inside `.claude/worktrees/` while worktrees exist; harmless, and gone after the clean.
- **Record and backlog:** one line below the findings in `examples/runs/pattern-2/README.md` names this change; the backlog item is closed at sync.

## Capabilities

### New Capabilities
- none

### Modified Capabilities
- `specfold-tasks`: packet marks finished tasks; T10 and T11 in a nested root.
- `specfold-wt`: `clean --base`.

## Out of scope

- A second pattern-2 run to prove the fixes.
- Other backlog items (`integrator`, `plan-critic`, cost per change).

## Open points

1. **Where the skill-noise note lives:** the template has no worktree runbook, so the note goes into `sf-apply` and the kit's [agent layer](/architecture/agent-layer.md) concept instead of a new runbook.
2. **Gate rule G18** runs `tasks check --base`, so it gets the nested-root fix without its own change.

## Impact

- `src/tasks/git.ts`, `src/tasks/packet.ts`, `src/wt/{worktrees,command}.ts`, their tests and the bundled CLI.
- `template/.claude/agents/{implementer,verifier,scout,spec-writer,knowledge-curator}.md`, `template/.agents/skills/sf-apply/` and their copies; the template manifest.
- `examples/runs/pattern-2/README.md`; knowledge: the agent-layer architecture, the tasks and wt cards, the backlog item.
