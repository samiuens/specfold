# Spec Delta

## ADDED Requirements

### Requirement: Task commit files
Rules T10 and T11 SHALL read the files of task commits relative to the directory holding `specfold.yaml`, so `files` globs match them when that directory is a subfolder of the git repository. Files outside that directory SHALL count toward neither a task's size nor its group's scope.

#### Scenario: Specfold root in a subfolder
- **WHEN** `specfold.yaml` sits in `app/`, group 2 owns `src/checkout/**`, and the commit for task 2.1 changes `app/src/checkout/a.ts` and `README.md` at the repository root
- **THEN** no `T11` warning is reported for that commit

### Requirement: Finished tasks in a packet
`specfold tasks packet` SHALL mark ticked tasks `[done]` (`done: true` in JSON) and SHALL say to start at the first open task.

#### Scenario: Finished tasks marked
- **WHEN** `specfold tasks packet add-guest-checkout 2` runs after task 2.1 was ticked and task 2.2 is open
- **THEN** task 2.1 is marked `[done]`, task 2.2 is not, and the packet says to start at the first open task
