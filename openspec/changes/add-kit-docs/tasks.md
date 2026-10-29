# Tasks

## 1. Command reference

```yaml
files: [tools/specfold/docs.mjs, tools/specfold/test/docs.test.ts, docs/commands.md, .github/workflows/cli.yml]
depends: []
scenarios: []
agent: implementer
```

- [ ] 1.1 Generate `docs/commands.md` from the bundled CLI's `--help` output with `node tools/specfold/docs.mjs`
  - Done when: `docs.mjs` writes one section per command with its summary and usage line, `docs.mjs --check` exits 1 on a stale file and names the fix, and `npx vitest run test/docs.test.ts` passes
- [ ] 1.2 Check the command reference in CI
  - Done when: `cli.yml` runs `node tools/specfold/docs.mjs --check` after the bundle check

## 2. Guides

```yaml
files: [README.md, docs/plan.md, docs/getting-started.md, docs/workflow.md, docs/upgrading.md, docs/releasing.md, tools/specfold/README.md]
depends: [1]
scenarios: []
agent: implementer
```

- [ ] 2.1 Rewrite the kit README: what Specfold is, the three install paths, a five-minute quick start and links to the guides
  - Done when: `README.md` no longer says M0, links every guide in `docs/`, and `tools/specfold/README.md` describes the CLI source, not M1
- [ ] 2.2 Mark `docs/plan.md` as the historical build brief
  - Done when: its first line says so and points to `README.md` and `docs/`
- [ ] 2.3 Write the getting-started and workflow guides
  - Done when: `docs/getting-started.md` takes a new user from install to a first archived change, and `docs/workflow.md` covers plan, apply, check, archive, sync and parallel work, linking `docs/commands.md` instead of repeating usage lines
- [ ] 2.4 Write the upgrading and releasing guides
  - Done when: `docs/upgrading.md` covers channels, sources, private repositories, tokens, the weekly workflow, the reminder and conflicts, and `docs/releasing.md` covers release-please, upgrade notes, migrations and release candidates

## 3. Release config

```yaml
files: [release-please-config.json]
depends: []
scenarios: []
agent: implementer
```

- [ ] 3.1 Set `release-as` to `0.1.0` and drop `prerelease`
  - Done when: `node tools/specfold/release.mjs check` passes and the config has no `prerelease` key

## 4. Knowledge

```yaml
files: [knowledge/**]
depends: [1, 2, 3]
scenarios: []
agent: knowledge-curator
```

- [ ] 4.1 Write the concept changes listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` and `index --check` exit 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-kit-docs` and commit its result in the same PR.
- After merging, merge release-please's `v0.1.0` PR once its checks pass.
- After v0.1.0 is published, one follow-up PR: remove `release-as`, add `--exclude-pre-releases` to `BOOTSTRAP.md`, make `upgrade-fixtures` a required check. Then upgrade the sample app to 0.1.0 in its own PR.
