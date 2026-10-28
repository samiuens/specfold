# Tasks

## 1. Template manifest

```yaml
files: [template/.specfold/manifest.json, tools/specfold/test/template-manifest.test.ts]
depends: []
scenarios: []
agent: implementer
```

- [x] 1.1 Ship the manifest an empty-repository install records in `template/.specfold/manifest.json`
  - Done when: `template-manifest.test.ts` compares it with `toMatchFileSnapshot` and passes

## 2. Init command

```yaml
files: [tools/specfold/src/init/**, tools/specfold/src/commands.ts, tools/specfold/src/migrate/install.ts, tools/specfold/test/init.test.ts, scripts/specfold.mjs]
depends: [1]
scenarios: [specfold-init#not-a-template-repository, specfold-init#typescript-project, specfold-init#flag-wins, specfold-init#fresh-template-repository, specfold-init#preview, specfold-init#rerun]
agent: implementer
```

- [x] 2.1 Plan the settings and block steps without writing, and refuse a repository without the template files
  - Done when: scenarios not-a-template-repository, typescript-project, flag-wins and preview pass in `init.test.ts`
- [x] 2.2 Apply the plan: settings, OpenSpec skills, markers, links, hooks and the manifest
  - Done when: scenarios fresh-template-repository and rerun pass in `init.test.ts`, and an edited `AGENTS.md` is reported as skipped
- [x] 2.3 Register `specfold init` and rebuild the bundle and its copies
  - Done when: `node scripts/specfold.mjs init --help` prints the usage and the template and sample app copies equal `scripts/specfold.mjs`

## 3. Bootstrap prompt

```yaml
files: [BOOTSTRAP.md, .github/workflows/cli.yml, template/README.md]
depends: [2]
scenarios: []
agent: implementer
```

- [x] 3.1 Write `BOOTSTRAP.md` with the pinned kit commit and both paths
  - Done when: the commands in it fetch and unpack the pinned snapshot in a scratch folder
- [x] 3.2 Check the pin in CI
  - Done when: the cli workflow fails for a sha that is not on `main` and passes for the pinned one
- [x] 3.3 Name both entry points in the template README
  - Done when: `template/README.md` points to "Use this template" plus `specfold init`, and to `BOOTSTRAP.md`

## 4. Knowledge

```yaml
files: [knowledge/**]
depends: [2, 3]
scenarios: []
agent: knowledge-curator
```

- [ ] 4.1 Write the concept updates listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-bootstrap` and commit its result in the same PR.
- After the merge, move the pin in `BOOTSTRAP.md` to the merged commit in its own PR (`runbooks/move-bootstrap-pin.md`).
