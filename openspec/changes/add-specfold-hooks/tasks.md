# Tasks

## 1. Plumbing

```yaml
files: [tools/specfold/src/cli.ts, tools/specfold/src/bin.ts, tools/specfold/test/helpers.ts, tools/specfold/src/repo.ts, tools/specfold/test/repo.test.ts, tools/specfold/test/change-knowledge.test.ts, tools/specfold/src/change/command.ts, tools/specfold/test/change-check.test.ts, tools/specfold/src/gate/command.ts]
depends: []
scenarios: []
agent: implementer
```

- [x] 1.1 Give commands an optional stdin reader
  - Done when: `npm test -w specfold` passes with `run()` accepting stdin
- [x] 1.2 Read `hooks.extra` from the settings
  - Done when: `repo.test.ts` covers an empty and a configured `hooks.extra`
- [x] 1.3 Check a change as planned: brief rules only until `tasks.md` exists
  - Done when: `change-check.test.ts` covers a change with and without `tasks.md`
- [x] 1.4 Export the local gate evaluation from the gate command
  - Done when: `npm test -w specfold` passes with the gate tests unchanged

## 2. Install

```yaml
files: [tools/specfold/src/hooks/install.ts, tools/specfold/src/hooks/command.ts, tools/specfold/src/commands.ts, tools/specfold/test/hooks-install.test.ts]
depends: [1]
scenarios: [specfold-hooks#fresh-repository, specfold-hooks#lefthook-in-use, specfold-hooks#husky-in-use, specfold-hooks#custom-hooks-folder, specfold-hooks#nested-repository]
agent: implementer
```

- [x] 2.1 Install built-in hooks and refuse foreign hooks paths and nested repositories
  - Done when: scenarios fresh-repository, custom-hooks-folder and nested-repository pass in `hooks-install.test.ts`
- [x] 2.2 Add entries to lefthook, husky and pre-commit configurations
  - Done when: scenarios lefthook-in-use and husky-in-use pass in `hooks-install.test.ts`, plus a pre-commit case

## 3. Git hooks

```yaml
files: [tools/specfold/src/hooks/run.ts, tools/specfold/src/hooks/command.ts, tools/specfold/test/hooks-run.test.ts]
depends: [2]
scenarios: [specfold-hooks#broken-concept-staged, specfold-hooks#change-being-planned-staged, specfold-hooks#blocking-finding, specfold-hooks#graphify-missing, specfold-hooks#commit-message-check]
agent: implementer
```

- [ ] 3.1 Add `specfold hook` with the pre-commit checks and extra commands
  - Done when: scenarios broken-concept-staged, change-being-planned-staged and commit-message-check pass in `hooks-run.test.ts`
- [ ] 3.2 Add the pre-push gate and the graph refresh hooks
  - Done when: scenarios blocking-finding and graphify-missing pass in `hooks-run.test.ts`

## 4. Claude hooks

```yaml
files: [tools/specfold/src/hooks/claude.ts, tools/specfold/src/hooks/run.ts, tools/specfold/test/hooks-claude.test.ts]
depends: [3]
scenarios: [specfold-hooks#context-at-start, specfold-hooks#agent-writes-a-broken-concept, specfold-hooks#unfinished-work]
agent: implementer
```

- [ ] 4.1 Add the Claude Code session start, post-tool-use and stop hooks
  - Done when: scenarios context-at-start, agent-writes-a-broken-concept and unfinished-work pass in `hooks-claude.test.ts`

## 5. Kit switch

```yaml
files: [.githooks/commit-msg, .specfold/hooks/**, package.json, specfold.yaml]
depends: [6]
scenarios: []
agent: implementer
```

- [ ] 5.1 Replace `.githooks/` with `specfold hooks install` in the kit
  - Done when: a commit in the kit runs the commit check through `.specfold/hooks/commit-msg`

## 6. Bundle

```yaml
files: [scripts/specfold.mjs, template/scripts/specfold.mjs, examples/sample-app/scripts/specfold.mjs]
depends: [4]
scenarios: []
agent: implementer
```

- [ ] 6.1 Rebuild the bundled CLI and its template and sample copies
  - Done when: `npm run build -w specfold` leaves no diff and the copies equal it

## 7. Knowledge

```yaml
files: [knowledge/**]
depends: [5]
scenarios: []
agent: knowledge-curator
```

- [ ] 7.1 Write the concepts listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-specfold-hooks` and commit its result in the same PR.
