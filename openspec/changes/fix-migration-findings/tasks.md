# Tasks

## 1. Doctor

```yaml
files: [tools/specfold/src/doctor/checks.ts, tools/specfold/src/openspec.ts, tools/specfold/test/doctor-checks.test.ts, tools/specfold/test/doctor.test.ts]
depends: []
scenarios: [specfold-doctor#lefthook-entries-from-install, specfold-doctor#hooks-not-installed, specfold-doctor#local-openspec-before-install, specfold-doctor#repository-local-openspec]
agent: implementer
```

- [x] 1.1 D4 accepts `specfold.mjs hook` as well as `specfold hook` in a hook manager's config (B1)
  - Done when: `npx vitest run tools/specfold/test/doctor-checks.test.ts` passes with tests tagged `spec: specfold-doctor#lefthook-entries-from-install` and `#hooks-not-installed`
- [x] 1.2 Without a `specfold.yaml`, D3 looks for `node_modules/.bin/openspec` in the current directory (B5)
  - Done when: the doctor tests pass with a test tagged `spec: specfold-doctor#local-openspec-before-install`, and `#repository-local-openspec` still passes

## 2. Hooks

```yaml
files: [tools/specfold/src/hooks/install.ts, tools/specfold/src/hooks/claude.ts, tools/specfold/src/yaml.ts, tools/specfold/test/hooks-install.test.ts, tools/specfold/test/hooks-claude.test.ts, tools/specfold/test/fixtures/hooks/**]
depends: []
scenarios: [specfold-hooks#lefthook-formatting-kept, specfold-hooks#lefthook-in-use, specfold-hooks#long-lefthook-command-kept, specfold-hooks#flow-style-hook-section-filled-in-place, specfold-hooks#empty-pre-commit-sections-filled-in-place, specfold-hooks#crlf-line-endings-kept, specfold-hooks#many-blocking-findings, specfold-hooks#unfinished-work]
agent: implementer
```

- [x] 2.1 `hooks install` inserts lefthook entries as text at parsed node offsets, re-parses the result and writes nothing if the entries aren't found (B9, design.md)
  - Done when: `npx vitest run tools/specfold/test/hooks-install.test.ts` passes with tests tagged `spec: specfold-hooks#lefthook-formatting-kept` (flow list, folded scalar, comments, `jobs`) and `#long-lefthook-command-kept`
- [x] 2.2 The same splice for `.pre-commit-config.yaml`; only `default_install_hook_types` may be rewritten
  - Done when: the hooks-install tests pass with a pre-commit fixture whose other lines are unchanged byte for byte
- [x] 2.3 `claude-stop` prints counts per rule, the first 10 findings and a "not shown" line when there are more than 20 blocking findings, and still exits 2 (B10)
  - Done when: `npx vitest run tools/specfold/test/hooks-claude.test.ts` passes with a test tagged `spec: specfold-hooks#many-blocking-findings`, and `#unfinished-work` still passes
- [x] 2.4 For flow-style and empty or null hook sections, `hooks install` replaces only that node's text (re-serialised) instead of refusing, in `lefthook.yml` and `.pre-commit-config.yaml`, and keeps every other line unchanged (verify F1)
  - Done when: from `tools/specfold`, `npx vitest run test/hooks-install.test.ts` passes with tests for `pre-commit: { commands: {...} }`, `commands: {}`, `jobs: []`, a bare `pre-commit:` key and a flow-style pre-commit `repos`, each tagged `spec: specfold-hooks#lefthook-in-use` or `#lefthook-formatting-kept` as fits
- [x] 2.5 Point the code comments in `src/hooks/install.ts` and `src/yaml.ts` to `/decisions/splice-hook-manager-yaml.md` (verify F2)
  - Done when: `node scripts/specfold.mjs gate --base main --local` shows no G16 warning for `tools/specfold/src/hooks/install.ts`
- [x] 2.6 Retag the tests that fill a flow-style or empty node: lefthook ones cite `spec: specfold-hooks#flow-style-hook-section-filled-in-place`, pre-commit ones cite `#empty-pre-commit-sections-filled-in-place` instead of a lefthook scenario (verify V2)
  - Done when: from `tools/specfold`, `npx vitest run test/hooks-install.test.ts` passes, a test is tagged with each of the two new scenarios, and no flow-style or empty-node test and no pre-commit test cites `#lefthook-formatting-kept` or `#lefthook-in-use`
- [x] 2.7 In `src/hooks/install.ts`, `repos: []` leaves no trailing whitespace, a null `default_install_hook_types:` is filled instead of refused, and inserted text uses the file's line ending (verify V3)
  - Done when: from `tools/specfold`, `npx vitest run test/hooks-install.test.ts` passes with a test for each of the three cases, the first two tagged `spec: specfold-hooks#empty-pre-commit-sections-filled-in-place` and the CRLF one tagged `#crlf-line-endings-kept`

## 3. Index and log

```yaml
files: [tools/specfold/src/indexes/refs.ts, tools/specfold/src/log/**, tools/specfold/test/index-refs.test.ts, tools/specfold/test/log.test.ts, template/knowledge/conventions/code-comments.md]
depends: []
scenarios: [specfold-index#several-paths-in-one-pointer, specfold-index#reference-listed, specfold-log#root-index-lists-the-new-log, specfold-log#first-entry]
agent: implementer
```

- [x] 3.1 `scanReferences` returns one reference per comma-separated path after `see knowledge:`; a ` - ` label still ends the list (B3)
  - Done when: `npx vitest run tools/specfold/test/index-refs.test.ts` passes with a test tagged `spec: specfold-index#several-paths-in-one-pointer`, and `#reference-listed` still passes
- [x] 3.2 The shipped code-comment convention allows a comma-separated list of paths in one pointer
  - Done when: `template/knowledge/conventions/code-comments.md` shows the list form and `node scripts/specfold.mjs validate --bundle template/knowledge` reports no errors
- [x] 3.3 When `log add` creates `log.md`, it rewrites the root `index.md` and names both files in its output (B2, CLI part)
  - Done when: `npx vitest run tools/specfold/test/log.test.ts` passes with a test tagged `spec: specfold-log#root-index-lists-the-new-log`, and `#first-entry` still passes
- [x] 3.4 Fix the two biome errors in group 3's files: sort the imports in `src/log/command.ts` (`../indexes/command.ts` before `../indexes/generate.ts`) and use ` {2}` instead of two adjacent spaces in the regex on line 40 of `test/index-refs.test.ts`
  - Done when: from `tools/specfold`, `npx biome check src/log/command.ts test/index-refs.test.ts` reports no errors and `npx vitest run test/index-refs.test.ts test/log.test.ts` passes
- [x] 3.5 Restore the end-of-path boundary in `src/indexes/refs.ts`: each path in a pointer ends at a lookahead such as `(?![\w-])`, so `/docs/x.mdx` is not read as `/docs/x.md` (verify V4)
  - Done when: from `tools/specfold`, `npx vitest run test/index-refs.test.ts` passes with a test that `// see knowledge: /docs/x.mdx` is not a reference

## 4. New

```yaml
files: [tools/specfold/src/new/**, tools/specfold/test/new.test.ts, tools/specfold/test/new-templates.test.ts, template/.agents/skills/sf-capture/references/types.md, .agents/skills/sf-capture/references/types.md]
depends: []
scenarios: [specfold-new#sources-stub-for-every-type, specfold-new#runbook-review-date]
agent: implementer
```

- [x] 4.1 `specfold new` writes `sources: []` for every type (B8)
  - Done when: `npx vitest run tools/specfold/test/new.test.ts` passes with a test tagged `spec: specfold-new#sources-stub-for-every-type`, and `#runbook-review-date` still passes
- [x] 4.2 sf-capture's `types.md` lists the keys `specfold new` writes for each type (in both the template and the kit copy)
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
- [x] 5.4 sf-migrate step 8 runs `log add` before `index`, `validate` and the report (B2, skill part), in the template and the kit copy
  - Done when: both copies of `sf-migrate/SKILL.md` are identical and step 8 names `log add` before `index`

## 6. Bundle

```yaml
files: [scripts/specfold.mjs, template/scripts/specfold.mjs, template/.specfold/manifest.json]
depends: [1, 2, 3, 4, 5]
scenarios: []
agent: implementer
```

- [x] 6.1 Rebuild the bundle, copy it to `template/scripts/specfold.mjs` and regenerate `template/.specfold/manifest.json`
  - Done when: from `tools/specfold`, `npm run build` runs clean, `npx vitest run -u test/template-manifest.test.ts` regenerates `template/.specfold/manifest.json`, and `npm run check` and `npx vitest run` pass
- [x] 6.2 Rebuild the bundle after 2.4, copy it to `template/scripts/specfold.mjs` and regenerate `template/.specfold/manifest.json`
  - Done when: from `tools/specfold`, `npm run build` runs clean, `npx vitest run -u test/template-manifest.test.ts` regenerates `template/.specfold/manifest.json`, and `npm run check` and `npx vitest run` pass
- [ ] 6.3 Rebuild the bundle after 2.6-3.5, copy it to `template/scripts/specfold.mjs` and regenerate `template/.specfold/manifest.json`
  - Done when: from `tools/specfold`, `npm run build` runs clean, `npx vitest run -u test/template-manifest.test.ts` regenerates `template/.specfold/manifest.json`, and `npm run check` and `npx vitest run` pass

## 7. Knowledge

```yaml
files: [knowledge/**]
depends: [6]
scenarios: []
agent: knowledge-curator
```

- [x] 7.1 Write the concepts listed in knowledge.md
  - Done when: `node scripts/specfold.mjs validate` exits 0
- [ ] 7.2 `knowledge/conventions/code-comments.md` mentions the comma-separated list form of a pointer, like the template convention it sources (verify V5)
  - Done when: `node scripts/specfold.mjs gate --base main --local` shows no G16 warning for `template/knowledge/conventions/code-comments.md`, and `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `specfold sync fix-migration-findings` and commit the result in the same PR.
