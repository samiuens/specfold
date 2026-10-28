# Tasks

## 1. YAML rewrites keep long lines

```yaml
files: [tools/specfold/src/yaml.ts, tools/specfold/src/upgrade/config.ts, tools/specfold/src/migrate/merge.ts, tools/specfold/src/parallel/limit.ts, tools/specfold/src/hooks/install.ts, tools/specfold/test/upgrade-config.test.ts, tools/specfold/test/migrate-merge.test.ts, tools/specfold/test/parallel.test.ts, tools/specfold/test/hooks-install.test.ts]
depends: []
scenarios: [specfold-upgrade#long-rule-kept-on-one-line, specfold-migrate#long-context-line-kept, specfold-parallel#long-value-kept, specfold-hooks#long-lefthook-command-kept]
agent: implementer
```

- [ ] 1.1 Write OpenSpec configs without folding long lines
  - Done when: scenarios long-rule-kept-on-one-line and long-context-line-kept pass in `upgrade-config.test.ts` and `migrate-merge.test.ts`
- [ ] 1.2 Write local settings and hook manager files without folding long lines
  - Done when: scenarios long-value-kept and long-lefthook-command-kept pass in `parallel.test.ts` and `hooks-install.test.ts`

## 2. Gate follow-up base

```yaml
files: [tools/specfold/src/upgrade/command.ts, tools/specfold/test/upgrade-command.test.ts]
depends: []
scenarios: [specfold-upgrade#gate-with-the-branch-s-start]
agent: implementer
```

- [ ] 2.1 Pass the upgrade branch's start commit to the gate follow-up
  - Done when: scenario gate-with-the-branch-s-start passes in `upgrade-command.test.ts`

## 3. Release

```yaml
files: [scripts/specfold.mjs, template/scripts/specfold.mjs, template/.specfold/manifest.json, release-please-config.json]
depends: [1, 2]
scenarios: []
agent: implementer
```

- [ ] 3.1 Ship the rebuilt bundle and set `release-as` to `0.1.0-rc.3`
  - Done when: both bundle copies match the build, the template manifest test passes, and `release-as` is `0.1.0-rc.3`

## 4. Knowledge

```yaml
files: [knowledge/**]
depends: [3]
scenarios: []
agent: knowledge-curator
```

- [ ] 4.1 Write the concept changes listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync fix-upgrade-follow-ups` and commit its result in the same PR.
- Leave the `v0.1.0-rc.3` release PR open until `add-upgrade-workflow` is merged.
