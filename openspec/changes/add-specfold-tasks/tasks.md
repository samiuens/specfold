# Tasks

## 1. Config

```yaml
files: [tools/specfold/src/repo.ts, tools/specfold/test/repo.test.ts, specfold.yaml]
depends: []
scenarios: []
agent: implementer
```

- [x] 1.1 Read `tasks.max_files_per_task` and `tasks.max_tasks_per_group` from `specfold.yaml` with defaults 5 and 8
  - Done when: `repo.test.ts` covers defaults and configured values

## 2. Parser

```yaml
files: [tools/specfold/src/tasks/parse.ts, tools/specfold/test/tasks-parse.test.ts]
depends: []
scenarios: [specfold-tasks#valid-group, specfold-tasks#valid-task, specfold-tasks#follow-up-section-ignored]
agent: implementer
```

- [x] 2.1 Parse groups, metadata blocks, tasks, done lines, the follow-up section and stray headings with line numbers
  - Done when: the three scenarios of this group pass in `tasks-parse.test.ts`

## 3. Static rules

```yaml
files: [tools/specfold/src/tasks/rules.ts, tools/specfold/src/tasks/overlap.ts, tools/specfold/src/tasks/scenarios.ts, tools/specfold/test/tasks-rules.test.ts]
depends: [1, 2]
scenarios: [specfold-tasks#id-from-a-delta-spec, specfold-tasks#group-without-files, specfold-tasks#task-without-done-criterion, specfold-tasks#gap-in-task-numbers, specfold-tasks#task-in-the-wrong-group, specfold-tasks#stray-heading, specfold-tasks#cycle, specfold-tasks#unknown-group, specfold-tasks#nested-directories, specfold-tasks#ordered-groups-may-share-files, specfold-tasks#renamed-scenario, specfold-tasks#unknown-role, specfold-tasks#knowledge-group-missing, specfold-tasks#too-many-tasks]
agent: implementer
```

- [x] 3.1 Add known scenario ids from delta specs and main specs
  - Done when: scenario id-from-a-delta-spec passes in `tasks-rules.test.ts`
- [x] 3.2 Add rules T1 to T4 and T6 to T9
  - Done when: the T1-T4 and T6-T9 scenarios pass in `tasks-rules.test.ts`
- [ ] 3.3 Add the T5 overlap check between independent groups
  - Done when: scenarios nested-directories and ordered-groups-may-share-files pass in `tasks-rules.test.ts`

## 4. Git checks

```yaml
files: [tools/specfold/src/tasks/git.ts, tools/specfold/test/tasks-git.test.ts]
depends: [1, 2]
scenarios: [specfold-tasks#trailer-recognized, specfold-tasks#task-touched-too-many-files, specfold-tasks#ticked-without-commit, specfold-tasks#scope-widened, specfold-tasks#ticking-tasks-md-is-not-scope-widening]
agent: implementer
```

- [ ] 4.1 Read task commits since the merge base with their trailers and changed files
  - Done when: scenario trailer-recognized passes in `tasks-git.test.ts`
- [ ] 4.2 Add rules T10 and T11
  - Done when: the T10 and T11 scenarios pass in `tasks-git.test.ts`

## 5. Tasks check command

```yaml
files: [tools/specfold/src/tasks/command.ts, tools/specfold/src/commands.ts, tools/specfold/test/tasks-check.test.ts, tools/specfold/test/fixtures/tasks/**]
depends: [3, 4]
scenarios: [specfold-tasks#clean-breakdown, specfold-tasks#unknown-change, specfold-tasks#json-finding, specfold-tasks#missing-tasks-file]
agent: implementer
```

- [ ] 5.1 Add `specfold tasks check <change> [--base <ref>] [--json]` with T0, output and exit codes
  - Done when: the four scenarios of this group pass in `tasks-check.test.ts`

## 6. Status and resume

```yaml
files: [tools/specfold/src/tasks/progress.ts, tools/specfold/src/tasks/progress-command.ts, tools/specfold/src/commands.ts, tools/specfold/test/tasks-progress.test.ts]
depends: [5]
scenarios: [specfold-tasks#progress-per-group, specfold-tasks#ready-group-after-finished-group, specfold-tasks#resume-a-fresh-session, specfold-tasks#all-done]
agent: implementer
```

- [ ] 6.1 Compute group states and the next open task
  - Done when: scenarios progress-per-group and ready-group-after-finished-group pass in `tasks-progress.test.ts`
- [ ] 6.2 Add `specfold status [<change>] [--json]` and `specfold resume <change> [--json]`
  - Done when: scenarios resume-a-fresh-session and all-done pass in `tasks-progress.test.ts`

## 7. Bundle

```yaml
files: [scripts/specfold.mjs]
depends: [6]
scenarios: []
agent: implementer
```

- [ ] 7.1 Rebuild the bundled CLI
  - Done when: `npm run build -w specfold` leaves no diff and `node scripts/specfold.mjs tasks check add-specfold-tasks --base origin/main` reports no errors

## 8. Knowledge

```yaml
files: [knowledge/**]
depends: [7]
scenarios: []
agent: knowledge-curator
```

- [ ] 8.1 Write the concepts listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` and `node scripts/specfold.mjs index --check` exit 0

## Workflow follow-up

- Archive the change in this PR, then point the capability card at the archived spec by hand (`specfold sync` does not exist yet).
