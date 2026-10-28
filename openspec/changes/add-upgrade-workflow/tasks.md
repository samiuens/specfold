# Tasks

## 1. Session-start reminder

```yaml
files: [tools/specfold/src/upgrade/reminder.ts, tools/specfold/src/upgrade/source.ts, tools/specfold/src/hooks/claude.ts, tools/specfold/src/hooks/run.ts, tools/specfold/src/repo.ts, tools/specfold/test/upgrade-reminder.test.ts, tools/specfold/test/repo.test.ts, tools/specfold/test/change-knowledge.test.ts]
depends: []
scenarios: [specfold-hooks#release-waiting, specfold-hooks#offline, specfold-hooks#turned-off]
agent: implementer
```

- [x] 1.1 Read `upgrade.reminder` and give release sources a time limit
  - Done when: `repo.test.ts` covers the default and `false`, and a source query past its limit fails with an environment error
- [x] 1.2 Remind of a waiting release at session start, at most once a day
  - Done when: scenarios release-waiting, offline and turned-off pass in `upgrade-reminder.test.ts`

## 2. Opt-in upgrade workflow

```yaml
files: [template/.specfold/workflows/specfold-upgrade.yml, tools/specfold/src/migrate/install.ts, tools/specfold/src/migrate/command.ts, tools/specfold/src/init/init.ts, tools/specfold/src/init/command.ts, tools/specfold/src/upgrade/plan.ts, tools/specfold/test/init.test.ts, tools/specfold/test/migrate-install.test.ts, tools/specfold/test/upgrade-plan.test.ts]
depends: []
scenarios: [specfold-init#not-a-template-repository, specfold-init#workflow-turned-on, specfold-init#workflow-off-by-default, specfold-migrate#install-with-the-workflow, specfold-upgrade#turned-on-workflow-replaced, specfold-upgrade#not-turned-on]
agent: implementer
```

- [ ] 2.1 Ship the weekly upgrade workflow in `.specfold/workflows/`
  - Done when: the workflow ends green with a notice without `SPECFOLD_TOKEN`, opens the upgrade PR as `github-actions[bot]`, skips an existing branch, closes older upgrade PRs, and `.specfold/workflows/` is kit-owned
- [ ] 2.2 Turn the workflow on with `init --upgrade-workflow` and `migrate install --upgrade-workflow`
  - Done when: scenarios not-a-template-repository, workflow-turned-on, workflow-off-by-default and install-with-the-workflow pass in `init.test.ts` and `migrate-install.test.ts`
- [ ] 2.3 Upgrade the turned-on workflow from the release's copy
  - Done when: scenarios turned-on-workflow-replaced and not-turned-on pass in `upgrade-plan.test.ts`

## 3. Fixture upgrades in CI

```yaml
files: [tools/specfold/upgrade-fixtures.mjs, .github/workflows/cli.yml]
depends: []
scenarios: []
agent: implementer
```

- [ ] 3.1 Upgrade fixtures from the previous two releases to the PR's build
  - Done when: `upgrade-fixtures.mjs` builds, edits and upgrades one fixture per release and fails on an unexpected file or a lost team edit, and job `upgrade-fixtures` runs it on PRs touching the kit's payload and reports green otherwise

## 4. Template, settings and docs

```yaml
files: [template/specfold.yaml, template/.gitignore, .gitignore, specfold.yaml, BOOTSTRAP.md, template/.agents/skills/sf-migrate/**, .agents/skills/sf-migrate/**, scripts/specfold.mjs, template/scripts/specfold.mjs, template/.specfold/manifest.json]
depends: [1, 2]
scenarios: []
agent: implementer
```

- [ ] 4.1 Document `upgrade.reminder` and ignore the reminder's cache
  - Done when: the template's specfold.yaml documents the key, the kit's sets it to `false`, and both `.gitignore` files list `.specfold/local-state.json`
- [ ] 4.2 Ask about the upgrade workflow in `BOOTSTRAP.md` and `sf-migrate`
  - Done when: both ask the user and pass `--upgrade-workflow` on a yes, and `check-skills.mjs` passes
- [ ] 4.3 Ship the rebuilt bundle and manifest
  - Done when: both bundle copies match the build and the template manifest test passes

## 5. Knowledge

```yaml
files: [knowledge/**]
depends: [3, 4]
scenarios: []
agent: knowledge-curator
```

- [ ] 5.1 Write the concept changes listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-upgrade-workflow` and commit its result in the same PR.
- After merging, merge the `v0.1.0-rc.3` release PR, then upgrade the sample app with `node scripts/specfold.mjs upgrade`.
