# Tasks

## 1. Mirror index

```yaml
files: [tools/specfold/release.mjs, tools/specfold/test/release.test.ts]
depends: []
scenarios: [specfold-release#unknown-subcommand, specfold-release#index-two-releases]
agent: implementer
```

- [x] 1.1 Write `releases.json` with `release.mjs index <dir>`
  - Done when: scenarios unknown-subcommand and index-two-releases pass in `release.test.ts`

## 2. Versions and sources

```yaml
files: [tools/specfold/src/upgrade/version.ts, tools/specfold/src/upgrade/source.ts, tools/specfold/test/upgrade-version.test.ts, tools/specfold/test/upgrade-source.test.ts]
depends: []
scenarios: [specfold-upgrade#tampered-tarball]
agent: implementer
```

- [x] 2.1 Compare versions, filter by channel and compute the upgrade path
  - Done when: `upgrade-version.test.ts` covers prerelease ordering, both channels and a step across a major
- [x] 2.2 List, download, check and unpack releases from `github`, `url` and `path` sources
  - Done when: scenario tampered-tarball passes in `upgrade-source.test.ts`, and the three sources are covered with a local folder and a local HTTP server

## 3. Plan and apply

```yaml
files: [tools/specfold/src/migrate/install.ts, tools/specfold/src/upgrade/plan.ts, tools/specfold/src/upgrade/merge.ts, tools/specfold/src/upgrade/config.ts, tools/specfold/src/upgrade/apply.ts, tools/specfold/src/upgrade/migrations.ts, tools/specfold/src/upgrade/report.ts, tools/specfold/test/upgrade-plan.test.ts, tools/specfold/test/upgrade-config.test.ts, tools/specfold/test/upgrade-apply.test.ts, tools/specfold/test/upgrade-helpers.ts]
depends: []
scenarios: [specfold-upgrade#unchanged-file-replaced, specfold-upgrade#local-edit-kept, specfold-upgrade#conflicting-edit, specfold-upgrade#text-outside-the-block-kept, specfold-upgrade#knowledge-unchanged, specfold-upgrade#two-migrations-in-order]
agent: implementer
```

- [x] 3.1 Plan kit-owned files and blocks against the manifest, merging changed ones three ways
  - Done when: scenarios unchanged-file-replaced, local-edit-kept, conflicting-edit and text-outside-the-block-kept pass in `upgrade-plan.test.ts`
- [x] 3.2 Merge the kit keys of `.claude/settings.json` and `openspec/config.yaml` three ways
  - Done when: `upgrade-config.test.ts` covers deny rules, hook groups, env values, rules keys and the context with its `Stack:` line
- [x] 3.3 Apply a plan, run migrations and write the report
  - Done when: scenarios knowledge-unchanged and two-migrations-in-order pass in `upgrade-apply.test.ts`

## 4. Upgrade command

```yaml
files: [tools/specfold/src/upgrade/command.ts, tools/specfold/src/upgrade/skew.ts, tools/specfold/src/cli.ts, tools/specfold/src/commands.ts, tools/specfold/src/repo.ts, tools/specfold/test/repo.test.ts, tools/specfold/test/change-knowledge.test.ts, tools/specfold/test/upgrade-command.test.ts, tools/specfold/test/upgrade-skew.test.ts]
depends: [2, 3]
scenarios: [specfold-upgrade#pr-without-yes, specfold-upgrade#newer-release-on-next, specfold-upgrade#stable-ignores-candidates, specfold-upgrade#local-folder, specfold-upgrade#url-mirror, specfold-upgrade#handed-to-the-new-version, specfold-upgrade#dry-run, specfold-upgrade#applied-upgrade, specfold-upgrade#message-from-the-settings, specfold-upgrade#old-cli-refuses-to-write]
agent: implementer
```

- [x] 4.1 Read `channel`, `source` and `upgrade.commit_message` from specfold.yaml
  - Done when: `repo.test.ts` covers the defaults and each source key
- [x] 4.2 Add `specfold upgrade --check` and the hand-off to the target release's CLI
  - Done when: scenarios pr-without-yes, newer-release-on-next, stable-ignores-candidates, url-mirror, local-folder and handed-to-the-new-version pass in `upgrade-command.test.ts`
- [x] 4.3 Print the plan, or apply it on its own branch with the follow-ups, the report and the commit
  - Done when: scenarios dry-run, applied-upgrade and message-from-the-settings pass in `upgrade-command.test.ts`
- [x] 4.4 Refuse write commands when the manifest is newer than the CLI
  - Done when: scenario old-cli-refuses-to-write passes in `upgrade-skew.test.ts`

## 5. Template and release

```yaml
files: [template/.agents/skills/sf-upgrade/**, template/.claude/skills/sf-upgrade, .agents/skills/sf-upgrade/**, .claude/skills/sf-upgrade, template/specfold.yaml, template/scripts/specfold.mjs, scripts/specfold.mjs, template/.specfold/manifest.json, upgrade/notes/0.1.0-rc.2.md, release-please-config.json]
depends: [4]
scenarios: []
agent: implementer
```

- [x] 5.1 Add skill `sf-upgrade` to the template and the kit, with its links
  - Done when: `check-skills.mjs` passes on both skill folders and `agents sync --check` passes in the kit and the template
- [x] 5.2 Document `upgrade.commit_message` and ship the rebuilt bundle and manifest
  - Done when: the template's specfold.yaml documents the key, both bundle copies match the build, and the template manifest test passes
- [x] 5.3 Write the upgrade notes of `0.1.0-rc.2` and set `release-as`
  - Done when: `upgrade/notes/0.1.0-rc.2.md` explains the one-time upgrade from rc.1 with the rc.2 CLI, and `release-as` is `0.1.0-rc.2`

## 6. Sample app and CI

```yaml
files: [examples/sample-app/**, .github/workflows/cli.yml, .github/workflows/release.yml]
depends: []
scenarios: []
agent: implementer
```

- [x] 6.1 Stop copying kit files into the sample app
  - Done when: `release.yml` no longer copies the bundle into the sample app and `cli.yml` no longer compares the sample app with the template
- [x] 6.2 Give the sample app a manifest at `0.1.0-rc.1`
  - Done when: the sample app has `kit_version: 0.1.0-rc.1`, `channel: next`, an `upgrade.commit_message` that passes the kit's commit check, and a manifest from `specfold init`

## 7. Knowledge

```yaml
files: [knowledge/**]
depends: [5, 6]
scenarios: []
agent: knowledge-curator
```

- [ ] 7.1 Write the concept changes listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-specfold-upgrade` and commit its result in the same PR.
- After rc.2 is published, upgrade the sample app with the released rc.2 CLI in a follow-up PR, following the runbook.
