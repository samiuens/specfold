## Wish

A planned change is implemented by task groups: the main session orchestrates with the `sf-apply` skill, hands each group to an implementer subagent as a compact task packet, runs groups with disjoint files in parallel worktrees, merges their branches, and gets a split proposal back instead of an implementer quietly widening its scope.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | Which roles ship besides the planner? | `scout`, `spec-writer`, `implementer`, `verifier`, `knowledge-curator`; the orchestrator merges branches itself | user |
| Q2 | What happens to `integrator` and `plan-critic`? | Two backlog items in the kit's knowledge, each with the role's job and why it waits | user |
| Q3 | How does an implementer get its task packet? | `specfold tasks packet <change> <group>` prints the group's tasks, owned files, linked scenarios with their text, the brief's decisions and the concepts the proposal links; the orchestrator passes it verbatim | user |
| Q4 | How are implementers kept from pushing? | A PreToolUse hook in the implementer's frontmatter runs `specfold hook claude-no-push`, which refuses `git push` and `gh pr`; a `disallowedTools` Bash pattern would remove all of Bash (checked 2026-10-28) | user |
| Q5 | Who may spawn subagents? | Only the main session: `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1` in the template's settings env (Claude Code's default is now 3) | user |
| Q6 | Which models? | scout haiku/low, spec-writer opus/high, implementer sonnet/medium, verifier opus/high, knowledge-curator sonnet/medium | user |
| Q7 | What is the orchestrator skill called? | `sf-apply` | user |

## Out of scope

- `integrator` and `plan-critic` (backlog).
- Agent teams, which stay off.
- The worktree commands and the subagent limit (`add-specfold-wt`).

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-28T09:19:45+01:00
