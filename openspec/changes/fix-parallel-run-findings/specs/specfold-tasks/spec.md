# Spec Delta

## MODIFIED Requirements

### Requirement: T10 task size
With `--base`, the command SHALL report a warning with rule `T10` when the commits carrying a task's trailer change more files than `tasks.max_files_per_task`, defaulting to 5, not counting the change's own `tasks.md`. Commit files SHALL be read relative to the directory holding `specfold.yaml`; files outside that directory SHALL not count.

#### Scenario: Task touched too many files
- **WHEN** the commit for task 2.1 changes 7 files and no limit is configured
- **THEN** a `T10` warning is reported for task 2.1

### Requirement: T11 trailers match tasks
With `--base`, the command SHALL inspect commits from the merge base to `HEAD` and report a warning with rule `T11` for a ticked task without a trailer commit, a trailer naming an unknown task, more than one commit for one task, or a task commit changing files outside its group's `files`. Changes to the change's own `tasks.md` SHALL never count as outside a group. Commit files SHALL be read relative to the directory holding `specfold.yaml`, so `files` globs match them when that directory is a subfolder of the git repository; files outside that directory SHALL never count as outside a group.

#### Scenario: Ticked without commit
- **WHEN** task 1.2 is ticked but no commit carries `Task: <change>#1.2`
- **THEN** a `T11` warning is reported for task 1.2

#### Scenario: Scope widened
- **WHEN** the commit for task 2.1 changes `src/billing/x.ts` and group 2 owns only `src/checkout/**`
- **THEN** a `T11` warning is reported naming the file

#### Scenario: Ticking tasks.md is not scope widening
- **WHEN** the commit for task 2.1 changes `src/checkout/a.ts` and ticks task 2.1 in `openspec/changes/<change>/tasks.md`
- **THEN** no `T11` warning is reported for that commit

#### Scenario: Specfold root in a subfolder
- **WHEN** `specfold.yaml` sits in `app/`, group 2 owns `src/checkout/**`, and the commit for task 2.1 changes `app/src/checkout/a.ts` and `README.md` at the repository root
- **THEN** no `T11` warning is reported for that commit

### Requirement: Task packet
The CLI SHALL provide `specfold tasks packet <change> <group> [--json]`, which prints one task group's packet: the group's name, tasks with their `Done when:` lines, `files`, `depends`, each linked scenario with its WHEN and THEN lines (from the change's delta specs, else the main specs), the brief's wish and decision table, the paths of the knowledge concepts the proposal links, and the trailer format `Task: <change>#<n>.<m>`. Ticked tasks SHALL be marked `[done]` (`done: true` in JSON), and the packet SHALL say to start at the first open task. An unknown change or group SHALL exit with 2.

#### Scenario: Packet for a group
- **WHEN** `specfold tasks packet add-guest-checkout 2` runs and group 2 links `checkout/guest-checkout#guest-pays-without-account`
- **THEN** the output holds group 2's tasks and files, the scenario's WHEN and THEN lines, the brief's decisions and `Task: add-guest-checkout#2.<m>`

#### Scenario: Finished tasks marked
- **WHEN** `specfold tasks packet add-guest-checkout 2` runs after task 2.1 was ticked and task 2.2 is open
- **THEN** task 2.1 is marked `[done]`, task 2.2 is not, and the packet says to start at the first open task

#### Scenario: Unknown group
- **WHEN** `specfold tasks packet add-guest-checkout 9` runs on a change with three groups
- **THEN** the command exits with 2 and names the groups that exist
