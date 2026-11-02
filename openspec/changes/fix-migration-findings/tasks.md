# Tasks

## 1. Doctor

```yaml
files: [tools/specfold/src/doctor/checks.ts, tools/specfold/src/openspec.ts, tools/specfold/test/doctor-checks.test.ts, tools/specfold/test/doctor.test.ts]
depends: []
scenarios: [specfold-doctor#lefthook-entries-from-install, specfold-doctor#hooks-not-installed, specfold-doctor#local-openspec-before-install, specfold-doctor#repository-local-openspec]
agent: implementer
```

- [ ] 1.1 D4 accepts `specfold.mjs hook` as well as `specfold hook` in a hook manager's config (B1)
  - Done when: `npx vitest run tools/specfold/test/doctor-checks.test.ts` passes with tests tagged `spec: specfold-doctor#lefthook-entries-from-install` and `#hooks-not-installed`
- [ ] 1.2 Without a `specfold.yaml`, D3 looks for `node_modules/.bin/openspec` in the current directory (B5)
  - Done when: the doctor tests pass with a test tagged `spec: specfold-doctor#local-openspec-before-install`, and `#repository-local-openspec` still passes

## 2. Hooks

```yaml
files: [tools/specfold/src/hooks/install.ts, tools/specfold/src/hooks/claude.ts, tools/specfold/src/yaml.ts, tools/specfold/test/hooks-install.test.ts, tools/specfold/test/hooks-claude.test.ts, tools/specfold/test/fixtures/hooks/**]
depends: []
scenarios: [specfold-hooks#lefthook-formatting-kept, specfold-hooks#long-lefthook-command-kept, specfold-hooks#many-blocking-findings, specfold-hooks#unfinished-work]
agent: implementer
```

- [ ] 2.1 `hooks install` inserts lefthook entries as text at parsed node offsets, re-parses the result and writes nothing if the entries aren't found (B9, design.md)
  - Done when: `npx vitest run tools/specfold/test/hooks-install.test.ts` passes with tests tagged `spec: specfold-hooks#lefthook-formatting-kept` (flow list, folded scalar, comments, `jobs`) and `#long-lefthook-command-kept`
- [ ] 2.2 The same splice for `.pre-commit-config.yaml`; only `default_install_hook_types` may be rewritten
  - Done when: the hooks-install tests pass with a pre-commit fixture whose other lines are unchanged byte for byte
- [ ] 2.3 `claude-stop` prints counts per rule, the first 10 findings and a "not shown" line when there are more than 20 blocking findings, and still exits 2 (B10)
  - Done when: `npx vitest run tools/specfold/test/hooks-claude.test.ts` passes with a test tagged `spec: specfold-hooks#many-blocking-findings`, and `#unfinished-work` still passes

## 3. Index and log

```yaml
files: [tools/specfold/src/indexes/refs.ts, tools/specfold/src/log/**, tools/specfold/test/index-refs.test.ts, tools/specfold/test/log.test.ts, template/knowledge/conventions/code-comments.md]
depends: []
scenarios: [specfold-index#several-paths-in-one-pointer, specfold-index#reference-listed, specfold-log#root-index-lists-the-new-log, specfold-log#first-entry]
agent: implementer
```

- [ ] 3.1 `scanReferences` returns one reference per comma-separated path after `see knowledge:`; a ` - ` label still ends the list (B3)
  - Done when: `npx vitest run tools/specfold/test/index-refs.test.ts` passes with a test tagged `spec: specfold-index#several-paths-in-one-pointer`, and `#reference-listed` still passes
- [ ] 3.2 The shipped code-comment convention allows a comma-separated list of paths in one pointer
  - Done when: `template/knowledge/conventions/code-comments.md` shows the list form and `node scripts/specfold.mjs validate --bundle template/knowledge` reports no errors
- [ ] 3.3 When `log add` creates `log.md`, it rewrites the root `index.md` and names both files in its output (B2, CLI part)
  - Done when: `npx vitest run tools/specfold/test/log.test.ts` passes with a test tagged `spec: specfold-log#root-index-lists-the-new-log`, and `#first-entry` still passes

## 4. New

```yaml
files: [tools/specfold/src/new/**, tools/specfold/test/new.test.ts, tools/specfold/test/new-templates.test.ts, template/.agents/skills/sf-capture/references/types.md, .agents/skills/sf-capture/references/types.md]
depends: []
scenarios: [specfold-new#sources-stub-for-every-type, specfold-new#runbook-review-date]
agent: implementer
```

- [ ] 4.1 `specfold new` writes `sources: []` for every type (B8)
  - Done when: `npx vitest run tools/specfold/test/new.test.ts` passes with a test tagged `spec: specfold-new#sources-stub-for-every-type`, and `#runbook-review-date` still passes
- [ ] 4.2 sf-capture's `types.md` lists the keys `specfold new` writes for each type (in both the template and the kit copy)
  - Done when: both copies of `types.md` are identical and name `sources`, `decision` and `stale_after` with the types they apply to

## 5. Migrate and init

```yaml
files: [tools/specfold/src/migrate/**, tools/specfold/src/init/**, tools/specfold/test/migrate*.test.ts, tools/specfold/test/init.test.ts, tools/specfold/test/fixtures/migrate/**, template/.agents/skills/sf-migrate/**, .agents/skills/sf-migrate/**]
depends: []
scenarios: [specfold-init#pnpm-workspaces, specfold-init#typescript-project, specfold-migrate#workspace-globs, specfold-migrate#source-globs, specfold-migrate#state-not-committed, specfold-migrate#resumed-migration, specfold-migrate#claude-md-already-imports-agents-md, specfold-migrate#existing-agents-md]
agent: implementer
```

- [x] 5.1 Detection reads globs from package.json `workspaces` and `pnpm-workspace.yaml` (`<pattern>/src/**`, negations skipped), else the folder list with `apps` added (B4)
  - Done when: `npx vitest run tools/specfold/test/init.test.ts tools/specfold/test/migrate-install.test.ts` passes with tests tagged `spec: specfold-init#pnpm-workspaces` and `spec: specfold-migrate#workspace-globs`, and `#typescript-project` and `#source-globs` still pass
- [x] 5.2 `migrate start` writes `.specfold/migration/.gitignore` with `state.json` (B6)
  - Done when: the migrate tests pass with a test tagged `spec: specfold-migrate#state-not-committed`, and `#resumed-migration` still passes
- [x] 5.3 The CLAUDE.md managed block omits `@AGENTS.md` when the text outside the markers already has that line (B7)
  - Done when: the migrate tests pass with a test tagged `spec: specfold-migrate#claude-md-already-imports-agents-md`, and `#existing-agents-md` still passes
- [ ] 5.4 sf-migrate step 8 runs `log add` before `index`, `validate` and the report (B2, skill part), in the template and the kit copy
  - Done when: both copies of `sf-migrate/SKILL.md` are identical and step 8 names `log add` before `index`

## 6. Bundle

```yaml
files: [scripts/specfold.mjs, template/scripts/specfold.mjs, template/.specfold/manifest.json]
depends: [1, 2, 3, 4, 5]
scenarios: []
agent: implementer
```

- [ ] 6.1 Rebuild the bundle, copy it to `template/scripts/specfold.mjs` and regenerate `template/.specfold/manifest.json`
  - Done when: the build script runs clean, `npm run check` and the full test suite pass in `tools/specfold`

## 7. Knowledge

```yaml
files: [knowledge/**]
depends: [6]
scenarios: []
agent: knowledge-curator
```

- [ ] 7.1 Write the concepts listed in knowledge.md
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `specfold sync fix-migration-findings` and commit the result in the same PR.
