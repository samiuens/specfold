# Tasks

## 1. Subagent limit

```yaml
files: [tools/specfold/src/parallel/**, tools/specfold/test/parallel.test.ts]
depends: []
scenarios: [specfold-parallel#not-a-number, specfold-parallel#existing-local-settings, specfold-parallel#from-local-settings]
agent: implementer
```

- [x] 1.1 Read and write the personal limit and add `specfold parallel`
  - Done when: scenarios not-a-number, existing-local-settings and from-local-settings pass in `parallel.test.ts`

## 2. Worktree commands

```yaml
files: [tools/specfold/src/wt/**, tools/specfold/test/wt.test.ts, tools/specfold/test/wt-plan.test.ts]
depends: [1]
scenarios: [specfold-wt#unknown-subcommand, specfold-wt#two-independent-changes, specfold-wt#shared-capability, specfold-wt#worktree-for-a-change, specfold-wt#npm-worktree, specfold-wt#merged-and-unmerged]
agent: implementer
```

- [x] 2.1 Batch active changes in `wt plan`
  - Done when: scenarios two-independent-changes and shared-capability pass in `wt-plan.test.ts`
- [x] 2.2 Create, set up and clean worktrees
  - Done when: scenarios unknown-subcommand, worktree-for-a-change, npm-worktree and merged-and-unmerged pass in `wt.test.ts`

## 3. Commands registry

```yaml
files: [tools/specfold/src/commands.ts]
depends: [1, 2]
scenarios: []
agent: implementer
```

- [x] 3.1 Register `parallel` and `wt`
  - Done when: `specfold --help` lists both *(each was registered in the commit that added it, so the tests could run the command)*

## 4. Init limit

```yaml
files: [tools/specfold/src/init/**, tools/specfold/test/init.test.ts]
depends: [1]
scenarios: [specfold-init#not-a-template-repository, specfold-init#default-limit, specfold-init#existing-limit-kept]
agent: implementer
```

- [x] 4.1 Add `--max-subagents` and the default limit to init
  - Done when: scenarios default-limit and existing-limit-kept pass in `init.test.ts`

## 5. Migrate merge

```yaml
files: [tools/specfold/src/migrate/merge.ts, tools/specfold/src/migrate/install.ts, tools/specfold/test/migrate-merge.test.ts, tools/specfold/test/migrate-install.test.ts]
depends: []
scenarios: [specfold-migrate#worktree-base-kept, specfold-migrate#existing-agents-md, specfold-migrate#existing-permissions, specfold-migrate#deny-rules-merged]
agent: implementer
```

- [x] 5.1 Merge missing top-level keys and env entries into Claude Code settings
  - Done when: scenario worktree-base-kept passes in `migrate-merge.test.ts`
- [x] 5.2 Manage `.gitattributes` and `.worktreeinclude` as blocks
  - Done when: `migrate-install.test.ts` shows both files with one Specfold block after two installs

## 6. Template, agents and bundle

```yaml
files: [template/.claude/settings.json, .claude/settings.json, examples/sample-app/.claude/settings.json, template/.gitattributes, template/.worktreeinclude, template/.gitignore, template/README.md, template/.agents/skills/sf-migrate/**, .agents/skills/sf-migrate/**, examples/sample-app/.agents/skills/sf-migrate/**, template/.specfold/manifest.json, scripts/specfold.mjs, template/scripts/specfold.mjs, examples/sample-app/scripts/specfold.mjs]
depends: [3, 4, 5]
scenarios: []
agent: implementer
```

- [ ] 6.1 Add the worktree settings and files to the template and its copies
  - Done when: the copies equal the template and `npx vitest run` passes
- [ ] 6.2 Ask for the limit in `sf-migrate` and name it in the template README
  - Done when: the skill copies match and `check-skills.mjs` passes
- [ ] 6.3 Rebuild the bundle, its copies and the template manifest
  - Done when: the copies equal `scripts/specfold.mjs` and `template-manifest.test.ts` passes

## 7. Knowledge

```yaml
files: [knowledge/**]
depends: [6]
scenarios: []
agent: knowledge-curator
```

- [ ] 7.1 Write the concept updates listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-specfold-wt` and commit its result in the same PR.
