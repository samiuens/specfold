## Wish

Every feature and plan is broken down into small tasks, and subagents work on task groups, never on whole changes. Each group owns its files and each task has a done check, so groups can run in parallel safely, progress survives session boundaries, and a fresh session can pick up the next task with one command.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | Where does task-group metadata live? | A fenced `yaml` block right after the group heading | knowledge:/decisions/task-breakdown.md |
| Q2 | How is a task linked to its commit? | The trailer `Task: <change>#<n>.<m>`, one commit per task | knowledge:/decisions/task-breakdown.md |
| Q3 | Is the tasks check its own command or part of change check? | Its own command `specfold tasks check`; change check includes it | knowledge:/decisions/task-breakdown.md |
| Q4 | Are `status` and `resume` new commands in M2? | Yes | knowledge:/decisions/task-breakdown.md |
| Q5 | What do the size limits do? | `max_files_per_task` 5 and `max_tasks_per_group` 8 only warn | knowledge:/decisions/task-breakdown.md |
| Q6 | Is `tasks.md` itself exempt from the scope and size checks? | Yes, every task commit ticks it | user |
| Q7 | May a `## Workflow follow-up` section end `tasks.md`? | Yes; any other stray level-2 heading is a T3 error | user |
| Q8 | Where do "change check runs tasks check" and G18 go? | Into `add-specfold-change-check` and the M4 gate change, so this change archives only what it builds | user |

## Out of scope

- The schema's `tasks` template and instruction (done in `add-specfold-schema`).
- Task packets and split instead of grow (M8).
- `change check` including the tasks findings (`add-specfold-change-check`) and gate rule G18 (M4).

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-26T14:06:22+01:00
