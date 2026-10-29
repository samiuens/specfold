---
type: Decision
title: Every change is broken down into task groups, and subagents work on groups
description: tasks.md splits each change into task groups with owned files and small tasks with a done check; one implementer takes one group, never a whole change.
status: stable
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T14:04:05+01:00 }
verified: { by: human:samiuens, at: 2026-10-29T08:53:06+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'Task breakdown'"
  - id: spec
    resource: ../../openspec/specs/specfold-tasks/spec.md
    title: specfold-tasks spec
---

# Decision

Every change's `tasks.md` consists of **task groups** and **tasks**:

- A task group is one unit a single subagent can take on: `## <n>. <name>` plus a YAML block with `files` (owned globs, always required), `depends`, `scenarios` and `agent` (default `implementer`).
- A task is one small, checkable step `<n>.<m>` with a `Done when:` line. One task is one commit, carrying the trailer `Task: <change>#<n>.<m>`.
- Size limits (`tasks.max_files_per_task`: 5, `tasks.max_tasks_per_group`: 8 in `specfold.yaml`) only warn.
- Order: dependencies first, tests or scenarios before or alongside the code they cover, the "Knowledge" group last.

Who does what:

- `spec-writer` writes `tasks.md` in this shape.
- `planner` turns it into the execution plan (dependency graph, parallel groups) that the user approves at the end of `sf-interview`.
- `plan-critic` flags groups too big for one subagent, tasks without a done check and hidden dependencies.
- The orchestrator dispatches one group per implementer with a compact **task packet**: the group's tasks, owned files, linked scenarios, the relevant part of `brief.md` and the knowledge concepts linked from the proposal. `specfold tasks packet <change> <group>` builds it, so every tool hands over the same text (since `add-subagent-roles`).
- **Split instead of grow:** an implementer that needs files outside its group or clearly exceeds the limits stops and returns a split proposal. The orchestrator has `spec-writer` update `tasks.md` (asking the user if scope changes) before re-dispatching. Implementers never widen their own scope.
- Without parallelism (`specfold parallel set 1`, or tools without subagents) the same groups run one after another.

Checks: `specfold tasks check` and gate rule G18, which blocks on missing metadata, numbering errors, unknown scenarios, dependency cycles and file overlap between parallel groups, and warns on size. `specfold status` and `specfold resume` show progress per group and the next open task from checkboxes and trailers. `specfold change check` includes the tasks findings (built with `add-specfold-change-check`), and G18 is specified with the gate in M4, so the archived `specfold-tasks` spec only describes what exists.

# Why

Subagents do their best work on small, bounded units with a clear outcome. Owned files make parallel groups safe to merge, a done check per task makes progress verifiable, and a packet instead of the whole change keeps each subagent's context small. Progress that lives in `tasks.md` and commit trailers survives session boundaries and works with every tool.

Decided by the maintainer on 2026-10-26, including the trailer as a new convention, `status`/`resume` as new M2 commands, a separate `tasks check` called by `change check`, fenced YAML metadata, and a spec written in M0.

# Rejected alternatives

- Subagents per whole change: large contexts, unclear file ownership, no safe parallelism inside a change.
- Plain key lines instead of a YAML block: lighter to read but looser to parse.
- Checks only inside `change check`: spec-writer and planner need the tasks check on its own while drafting.
- Progress from checkboxes only, without trailers: no link from a task to the commit that did it.

# Related

- [Custom OpenSpec schema](/decisions/custom-openspec-schema.md)
- [Rather ask than assume](/decisions/rather-ask-than-assume.md)
- [Specs start as changes](/decisions/specs-start-as-changes.md)
