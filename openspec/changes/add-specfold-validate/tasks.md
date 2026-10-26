# Tasks

## 1. Package scaffold

```yaml
files: [package.json, package-lock.json, .gitignore, tools/specfold/package.json, tools/specfold/tsconfig.json, tools/specfold/biome.json, tools/specfold/vitest.config.ts]
depends: []
scenarios: []
agent: implementer
```

- [x] 1.1 Add the `tools/specfold` workspace with pinned dev dependencies and `yaml` as the only runtime dependency
  - Done when: `npm ci` succeeds and `npm ls -w specfold --omit=dev` lists only `yaml`
- [x] 1.2 Add TypeScript, Biome and vitest configuration with `check` and `test` scripts
  - Done when: `npm run check -w specfold` and `npm test -w specfold` run (no tests yet) and exit 0

## 2. CLI core

```yaml
files: [tools/specfold/src/bin.ts, tools/specfold/src/cli.ts, tools/specfold/src/errors.ts, tools/specfold/src/repo.ts, tools/specfold/src/findings.ts, tools/specfold/vitest.config.ts, tools/specfold/build.mjs, scripts/specfold.mjs, tools/specfold/test/cli.test.ts, tools/specfold/test/repo.test.ts, tools/specfold/test/findings.test.ts, tools/specfold/test/helpers.ts]
depends: [1]
scenarios: []
agent: implementer
```

- [x] 2.1 Add argument parsing, command dispatch and exit-code mapping with `--version` and `--help`
  - Done when: `cli.test.ts` covers unknown flags and commands exiting with 2
- [x] 2.2 Add repository root discovery and `specfold.yaml` loading
  - Done when: `repo.test.ts` covers root discovery, a missing `specfold.yaml` and an unparseable one
- [x] 2.3 Add the findings model with ordering, human and JSON rendering
  - Done when: `findings.test.ts` covers ordering, the human summary line and the JSON shape
- [x] 2.4 Add the esbuild bundle script that writes `scripts/specfold.mjs`
  - Done when: `npm run build -w specfold` then `node scripts/specfold.mjs --version` prints the package version

## 3. Bundle reading and OKF rules

```yaml
files: [tools/specfold/src/bundle.ts, tools/specfold/src/validate/index.ts, tools/specfold/src/validate/okf.ts, tools/specfold/test/validate.test.ts, tools/specfold/test/okf.test.ts, tools/specfold/test/fixtures/valid/**]
depends: [2]
scenarios: [specfold-validate#whole-bundle-by-default, specfold-validate#selected-paths, specfold-validate#path-outside-the-bundle, specfold-validate#missing-configuration, specfold-validate#deterministic-order, specfold-validate#machine-readable-result, specfold-validate#other-bundle-root, specfold-validate#errors-present, specfold-validate#files-unchanged, specfold-validate#missing-frontmatter, specfold-validate#invalid-yaml, specfold-validate#empty-type, specfold-validate#frontmatter-in-a-folder-index, specfold-validate#extra-key-in-root-index, specfold-validate#log-out-of-order, specfold-validate#frontmatter-in-log, specfold-validate#plain-okf-bundle-passes]
agent: implementer
```

- [x] 3.1 Add the bundle walk and frontmatter split with body line offsets, plus the valid fixture bundle
  - Done when: scenarios whole-bundle-by-default, selected-paths, path-outside-the-bundle and other-bundle-root pass
- [x] 3.2 Add the `validate` command with OKF-1 and OKF-2 and the read-only guarantee
  - Done when: scenarios missing-configuration, missing-frontmatter, invalid-yaml, empty-type, files-unchanged, deterministic-order and machine-readable-result pass
- [x] 3.3 Add OKF-3 for index and log files
  - Done when: the four OKF-3 scenarios pass
- [ ] 3.4 Add `--okf-only` mode and exit codes for warnings and errors
  - Done when: scenarios plain-okf-bundle-passes and errors-present pass

## 4. Profile rules

```yaml
files: [tools/specfold/src/validate/profile.ts, tools/specfold/src/validate/index.ts, tools/specfold/test/profile.test.ts]
depends: [3]
scenarios: [specfold-validate#error-line-and-summary, specfold-validate#only-warnings, specfold-validate#unknown-type, specfold-validate#description-too-long, specfold-validate#multi-line-description, specfold-validate#missing-status, specfold-validate#neither-field, specfold-validate#bare-verified-mapping-accepted, specfold-validate#malformed-actor, specfold-validate#offset-missing, specfold-validate#z-and-numeric-offsets-accepted, specfold-validate#decision-without-sources, specfold-validate#source-without-resource, specfold-validate#runbook-without-stale-after, specfold-validate#camel-case-file-name, specfold-validate#normative-sentence-in-knowledge, specfold-validate#quoted-in-code, specfold-validate#long-concept, specfold-validate#decision-without-decision-key, specfold-validate#superseded-target-missing, specfold-validate#extra-key]
agent: implementer
```

- [ ] 4.1 Add P1 to P4 (type, title and description, status, trust fields)
  - Done when: their scenarios and error-line-and-summary pass in `profile.test.ts`
- [ ] 4.2 Add P5 to P8 (timestamps, sources, stale_after, file names)
  - Done when: their scenarios in `profile.test.ts` pass
- [ ] 4.3 Add P9 to P11 and the unknown-key guarantee
  - Done when: their scenarios and only-warnings pass in `profile.test.ts`

## 5. Link rules

```yaml
files: [tools/specfold/src/validate/links.ts, tools/specfold/src/validate/index.ts, tools/specfold/test/links.test.ts]
depends: [4]
scenarios: [specfold-validate#broken-bundle-absolute-link, specfold-validate#external-links-ignored, specfold-validate#configured-as-warning, specfold-validate#missing-source-file]
agent: implementer
```

- [ ] 5.1 Add L1 and L2
  - Done when: the four link scenarios pass

## 6. OKF sample fixture

```yaml
files: [tools/specfold/test/fixtures/acme-retail/**, tools/specfold/test/acme-retail.test.ts]
depends: [3]
scenarios: [specfold-validate#patched-sample-passes-upstream-sample-fails]
agent: implementer
```

- [ ] 6.1 Vendor `acme_retail` at commit `ad30107` as upstream and patched copies with `PATCH.md` and the license
  - Done when: scenario patched-sample-passes-upstream-sample-fails passes

## 7. Dogfooding and CI

```yaml
files: [.github/workflows/cli.yml, scripts/specfold.mjs, knowledge/references/**, knowledge/decisions/**]
depends: [5, 6]
scenarios: []
agent: implementer
```

- [ ] 7.1 Rebuild the bundle and fix every finding `specfold validate` reports on the kit's own bundle
  - Done when: `node scripts/specfold.mjs validate` exits 0 in the kit repo
- [ ] 7.2 Add a CI workflow that runs check, tests, the bundle freshness check and validate
  - Done when: the workflow passes on this PR

## 8. Knowledge

```yaml
files: [knowledge/**]
depends: [7]
scenarios: []
agent: knowledge-curator
```

- [ ] 8.1 Add the capability card for `specfold-validate` and an architecture concept for the CLI modules
  - Done when: both concepts exist and `node scripts/specfold.mjs validate` exits 0
- [ ] 8.2 Add conventions for TypeScript style and test fixtures, then update indexes and log
  - Done when: `node scripts/specfold.mjs validate` exits 0 and the indexes list the new concepts

## Workflow follow-up

- Archive the change with `openspec archive add-specfold-validate` in this PR, so `openspec/specs/specfold-validate/spec.md` exists when it merges.
