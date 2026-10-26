# Spec Delta

## Purpose

Defines how every change's `tasks.md` is broken down into task groups and tasks, checks that breakdown, links tasks to commits, and reports progress so subagents can work group by group.

## ADDED Requirements

### Requirement: Task group format
A task group SHALL be a level-2 heading `## <n>. <name>` with `<n>` counting up from 1, followed directly by a fenced `yaml` block holding `files` (non-empty list of repository globs), `depends` (list of group numbers, default empty), `scenarios` (list of scenario ids, default empty) and `agent` (role name, default `implementer`).

#### Scenario: Valid group
- **WHEN** `tasks.md` contains `## 2. Guest token` followed by a `yaml` block with `files: [src/checkout/token/**]`, `depends: [1]`, `scenarios: []` and no `agent`
- **THEN** `specfold tasks check` reports no finding for the group and treats its agent as `implementer`

### Requirement: Task format
A task SHALL be a checkbox list item `- [ ] <n>.<m> <text>` or `- [x] <n>.<m> <text>` inside group `<n>`, with `<m>` counting up from 1, followed by an indented line `- Done when: <check>` naming a test, a command or a scenario id.

#### Scenario: Valid task
- **WHEN** group 2 contains `- [ ] 2.1 Add token issuer` with the indented line `- Done when: npm test -- token passes`
- **THEN** `specfold tasks check` reports no finding for the task

### Requirement: Scenario ids
A scenario id SHALL have the form `<capability-path>#<slug>`, where `<slug>` is the scenario title in kebab-case. An id in `scenarios:` SHALL name a scenario in the change's delta specs or in `openspec/specs/`.

#### Scenario: Id from a delta spec
- **WHEN** the change's delta spec `specs/checkout/guest-checkout/spec.md` has `#### Scenario: Guest pays without account`
- **THEN** `checkout/guest-checkout#guest-pays-without-account` is a known id

### Requirement: Task commit trailer
A commit that completes a task SHALL carry the git trailer `Task: <change>#<n>.<m>`. Each task SHALL be completed by exactly one commit.

#### Scenario: Trailer recognized
- **WHEN** a commit message ends with `Task: add-guest-checkout#2.1`
- **THEN** `specfold tasks check --base <ref>` and `specfold status` attribute that commit to task 2.1 of `add-guest-checkout`

### Requirement: Tasks check command
The CLI SHALL provide `specfold tasks check <change> [--base <ref>] [--json]`, which checks `openspec/changes/<change>/tasks.md` against the rules T0 to T11, and SHALL exit with 0 when no finding is an error, 1 when one is, and 2 on usage or environment errors such as an unknown change.

#### Scenario: Clean breakdown
- **WHEN** a change's `tasks.md` follows every rule
- **THEN** `specfold tasks check <change>` exits with 0

#### Scenario: Unknown change
- **WHEN** `specfold tasks check missing-change` runs and no such change exists
- **THEN** the command prints an environment error and exits with 2

### Requirement: Tasks check output
Every finding SHALL carry a rule id, a severity, the group and task id when one applies, a line number, a message and a fix hint. With `--json`, the command SHALL print one object `{"ok", "change", "errors", "warnings", "findings": [{"rule", "severity", "group", "task", "line", "message", "fix"}]}`; without it, error lines and a summary line.

#### Scenario: JSON finding
- **WHEN** task 2.3 has no `Done when:` line and `--json` is set
- **THEN** stdout parses as JSON with a finding `"rule": "T2"`, `"group": 2`, `"task": "2.3"`, `"severity": "error"`

### Requirement: T0 tasks file present
The command SHALL report an error with rule `T0` when the change has no `tasks.md`.

#### Scenario: Missing tasks file
- **WHEN** the change folder has a proposal and specs but no `tasks.md`
- **THEN** a `T0` error is reported

### Requirement: T1 group metadata
The command SHALL report an error with rule `T1` when a group has no metadata block directly after its heading, the block is not valid YAML, `files` is missing or empty, or a key has the wrong type.

#### Scenario: Group without files
- **WHEN** group 3's metadata block has `depends: [1]` but no `files`
- **THEN** a `T1` error is reported for group 3

### Requirement: T2 done criterion
The command SHALL report an error with rule `T2` for every task without a non-empty `Done when:` line.

#### Scenario: Task without done criterion
- **WHEN** task 1.2 is followed directly by task 1.3
- **THEN** a `T2` error is reported for task 1.2

### Requirement: T3 numbering
The command SHALL report an error with rule `T3` when group numbers or task numbers skip, repeat or start at a number other than 1, or when a task's group number differs from its group.

#### Scenario: Gap in task numbers
- **WHEN** group 2 contains tasks 2.1 and 2.3 only
- **THEN** a `T3` error is reported for task 2.3

#### Scenario: Task in the wrong group
- **WHEN** group 2 contains a task numbered 3.1
- **THEN** a `T3` error is reported

### Requirement: T4 dependencies
The command SHALL report an error with rule `T4` when `depends` names a group that does not exist, names its own group, or when the dependencies form a cycle; a cycle finding SHALL list the groups in the cycle.

#### Scenario: Cycle
- **WHEN** group 2 depends on 3 and group 3 depends on 2
- **THEN** a `T4` error is reported naming groups 2 and 3

#### Scenario: Unknown group
- **WHEN** group 2 has `depends: [7]` and there is no group 7
- **THEN** a `T4` error is reported

### Requirement: T5 file overlap between parallel groups
Two groups MAY run in parallel when neither depends on the other, directly or transitively. The command SHALL report an error with rule `T5` when two such groups have overlapping `files`: an existing repository file or a wildcard-free entry matches globs of both, or one glob ending in `/**` covers the other's directory.

#### Scenario: Nested directories
- **WHEN** independent groups 2 and 3 own `src/**` and `src/checkout/**`
- **THEN** a `T5` error is reported naming both groups

#### Scenario: Ordered groups may share files
- **WHEN** group 3 depends on group 2 and both own `src/checkout/**`
- **THEN** no `T5` finding is reported

### Requirement: T6 scenario ids exist
The command SHALL report an error with rule `T6` for every entry in `scenarios:` that is not a known scenario id.

#### Scenario: Renamed scenario
- **WHEN** a group lists `checkout/guest-checkout#old-title` and no scenario has that title
- **THEN** a `T6` error is reported

### Requirement: T7 known agent role
The command SHALL report a warning with rule `T7` when `agent` names a role that has no definition in `.claude/agents/` and is not `implementer`.

#### Scenario: Unknown role
- **WHEN** a group sets `agent: designer` and no such role is defined
- **THEN** a `T7` warning is reported

### Requirement: T8 knowledge group last
The command SHALL report a warning with rule `T8` when the last group is not named `Knowledge`.

#### Scenario: Knowledge group missing
- **WHEN** the last group is `## 4. Tests`
- **THEN** a `T8` warning is reported

### Requirement: T9 group size
The command SHALL report a warning with rule `T9` when a group has more tasks than `tasks.max_tasks_per_group` in `specfold.yaml`, defaulting to 8.

#### Scenario: Too many tasks
- **WHEN** a group has 9 tasks and no limit is configured
- **THEN** a `T9` warning is reported suggesting a split

### Requirement: T10 task size
With `--base`, the command SHALL report a warning with rule `T10` when the commits carrying a task's trailer change more files than `tasks.max_files_per_task`, defaulting to 5.

#### Scenario: Task touched too many files
- **WHEN** the commit for task 2.1 changes 7 files and no limit is configured
- **THEN** a `T10` warning is reported for task 2.1

### Requirement: T11 trailers match tasks
With `--base`, the command SHALL inspect commits from the merge base to `HEAD` and report a warning with rule `T11` for a ticked task without a trailer commit, a trailer naming an unknown task, more than one commit for one task, or a task commit changing files outside its group's `files`.

#### Scenario: Ticked without commit
- **WHEN** task 1.2 is ticked but no commit carries `Task: <change>#1.2`
- **THEN** a `T11` warning is reported for task 1.2

#### Scenario: Scope widened
- **WHEN** the commit for task 2.1 changes `src/billing/x.ts` and group 2 owns only `src/checkout/**`
- **THEN** a `T11` warning is reported naming the file

### Requirement: Change check runs tasks check
`specfold change check <change>` SHALL run the tasks check for the same change and include its findings, rule ids and exit-code effect in its own result.

#### Scenario: Tasks error fails change check
- **WHEN** a change's `knowledge.md` is valid but its `tasks.md` has a `T4` cycle
- **THEN** `specfold change check <change>` reports the `T4` error and exits with 1

### Requirement: Status command
The CLI SHALL provide `specfold status [<change>] [--json]`. For one change it SHALL list each group with done and total tasks and a state (`done`, `in progress`, `ready`, or `blocked` with the open dependencies), then the next open task. Without a change, it SHALL print one line per active change with done/total and its next open task.

#### Scenario: Progress per group
- **WHEN** group 1 is fully ticked, group 2 has 1 of 3 tasks ticked, and group 3 depends on group 2
- **THEN** status shows group 1 `done`, group 2 `in progress` 1/3, group 3 `blocked` by 2, and the next open task is 2.2

### Requirement: Next open task
The next open task SHALL be the first unticked task, in task order, of the lowest-numbered group that is `in progress` or `ready`.

#### Scenario: Ready group after finished group
- **WHEN** group 1 is done, groups 2 and 3 depend only on group 1, and neither has a ticked task
- **THEN** the next open task is 2.1

### Requirement: Resume command
The CLI SHALL provide `specfold resume <change> [--json]`, which prints the next open task with its `Done when:` line, its group's metadata, the group's remaining tasks and the trailer line to use. It SHALL exit with 0, also when every task is done (saying so), and with 1 when open tasks exist but every open group is blocked.

#### Scenario: Resume a fresh session
- **WHEN** a new session runs `specfold resume add-guest-checkout` and the next open task is 2.2
- **THEN** the output names task 2.2, its done criterion, group 2's files and scenarios, task 2.3 as remaining, and `Task: add-guest-checkout#2.2`

#### Scenario: All done
- **WHEN** every task of the change is ticked
- **THEN** resume reports that all tasks are done and exits with 0

### Requirement: Gate rule G18
`specfold gate` SHALL run the tasks check, with the PR's merge base as `--base`, for every change added or modified in the PR. Error findings SHALL block the merge as rule G18; warnings SHALL be reported without blocking.

#### Scenario: Overlap blocks the merge
- **WHEN** a PR modifies a change whose parallel groups 2 and 3 own overlapping files
- **THEN** the gate fails with rule G18 and the `T5` finding

#### Scenario: Size only warns
- **WHEN** a PR's change has a group with 10 tasks and no other findings
- **THEN** the gate passes and reports the `T9` warning
