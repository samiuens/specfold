# Tasks

## 1. Profile core

```yaml
files: [tools/specfold/src/repo.ts, tools/specfold/src/profile.ts, tools/specfold/test/profile-setting.test.ts]
depends: []
scenarios: [specfold-profile#missing-key, specfold-profile#unknown-value]
agent: implementer
```

- [x] 1.1 Read `profile` in `loadConfig` into `Config.profile` (`full` by default) and throw a usage error naming the key, the value and the allowed values for anything else
  - Done when: `npx vitest run test/profile-setting.test.ts` covers specfold-profile#missing-key and specfold-profile#unknown-value
- [x] 1.2 Add `profile.ts` with the knowledge profile's excluded kit-owned paths (`openspec/schemas/specfold`, `sf-plan`, `sf-apply`, `sf-sync`, every `.claude/agents/*` but `scout.md`) and a filter over a path list
  - Done when: a test in `profile-setting.test.ts` filters a full path list for `knowledge` and keeps it unchanged for `full`

## 2. Template profile variants

```yaml
files: [template/.specfold/profiles/**, template/specfold.yaml, template/.agents/skills/sf-interview/**, tools/specfold/test/template-profiles.test.ts]
depends: []
scenarios: []
agent: implementer
```

- [x] 2.1 Write the knowledge variants of the managed-block content of `AGENTS.md`, `CLAUDE.md` and `.github/pull_request_template.md` in `template/.specfold/profiles/knowledge/`, with no OpenSpec lines and a `No-knowledge reason:` line in the PR template
  - Done when: `npx vitest run test/template-profiles.test.ts` checks that no variant names `openspec`, and that the AGENTS.md variant keeps the map rows and the knowledge rules section of the full one apart from OpenSpec rows (its core rule differs on purpose)
- [x] 2.2 Document `profile` in `template/specfold.yaml`
  - Done when: `template/specfold.yaml` has a commented `profile: full` line explaining `knowledge`, and `node scripts/specfold.mjs validate` exits 0
- [x] 2.3 Give sf-interview its knowledge-profile path: ask the open decisions the same way, then record them through sf-capture instead of writing `brief.md`
  - Done when: `node scripts/specfold.mjs stats` reports the sf-interview description within its 60-token budget and the skill names the knowledge-profile path

## 3. Migrate install

```yaml
files: [tools/specfold/src/migrate/**, tools/specfold/test/migrate-install.test.ts, tools/specfold/test/migrate-profile.test.ts, tools/specfold/test/template-manifest.test.ts, template/.specfold/manifest.json]
depends: [1, 2]
scenarios: [specfold-profile#knowledge-install, specfold-profile#full-install-unchanged, specfold-profile#knowledge-agents-md, specfold-profile#knowledge-pull-request-template, specfold-profile#fresh-knowledge-settings, specfold-migrate#unknown-profile, specfold-migrate#knowledge-profile-without-openspec, specfold-migrate#profile-recorded, specfold-migrate#knowledge-install, specfold-migrate#conflicting-profile]
agent: implementer
```

- [x] 3.1 Pass the profile to `kitOwned` and filter it with `profile.ts`; make `.specfold/profiles` kit-owned in both profiles
  - Done when: `npx vitest run test/migrate-profile.test.ts` covers specfold-profile#knowledge-install and specfold-profile#full-install-unchanged
- [x] 3.2 Write the knowledge block variants for the knowledge profile, falling back to the full content when a variant is missing
  - Done when: the migrate-profile tests cover specfold-profile#knowledge-agents-md and specfold-profile#knowledge-pull-request-template
- [x] 3.3 Add `--profile` to `migrate install`: default from an existing `specfold.yaml`, refuse a conflicting value, set `profile` and `gate.escape_label: no-knowledge` in a created `specfold.yaml`
  - Done when: the migrate-profile tests cover specfold-migrate#unknown-profile, specfold-migrate#knowledge-install, specfold-migrate#conflicting-profile and specfold-profile#fresh-knowledge-settings
- [x] 3.4 Skip the OpenSpec preflight, `openspec init` and the `config.yaml` merge for the knowledge profile
  - Done when: the migrate-profile tests cover specfold-migrate#knowledge-profile-without-openspec with OpenSpec removed from the PATH
- [x] 3.5 Record `profile` in the manifest and refresh the template's manifest
  - Done when: the migrate-profile tests cover specfold-migrate#profile-recorded, and `npx vitest run test/template-manifest.test.ts` passes after `npx vitest -u` on it

## 4. Init

```yaml
files: [tools/specfold/src/init/**, tools/specfold/test/init.test.ts, tools/specfold/test/init-profile.test.ts]
depends: [3]
scenarios: [specfold-init#knowledge-repository-without-openspec, specfold-init#knowledge-profile-stack, specfold-init#knowledge-profile-skips-openspec, specfold-init#fresh-template-as-knowledge-repository, specfold-init#changed-template-file-kept, specfold-init#full-repository-refused]
agent: implementer
```

- [x] 4.1 Add `--profile` to init, defaulting to `specfold.yaml`, and require `openspec/config.yaml` only for the full profile
  - Done when: `npx vitest run test/init-profile.test.ts` covers specfold-init#knowledge-repository-without-openspec
- [x] 4.2 Skip `openspec init` and the `Stack:` write for the knowledge profile while still printing the detected stack
  - Done when: the init-profile tests cover specfold-init#knowledge-profile-stack and specfold-init#knowledge-profile-skips-openspec
- [x] 4.3 Remove template files outside the knowledge set whose hash matches the template manifest, report differing ones as kept, swap in the knowledge blocks and set a `no-spec` escape label to `no-knowledge`
  - Done when: the init-profile tests cover specfold-init#fresh-template-as-knowledge-repository and specfold-init#changed-template-file-kept
- [x] 4.4 Refuse `--profile knowledge` on a repository whose manifest records a full install
  - Done when: the init-profile tests cover specfold-init#full-repository-refused, and `npx vitest run test/init.test.ts` still passes

## 5. Upgrade

```yaml
files: [tools/specfold/src/upgrade/**, tools/specfold/test/upgrade-plan.test.ts, tools/specfold/test/upgrade-profile.test.ts]
depends: [3]
scenarios: [specfold-upgrade#knowledge-upgrade, specfold-upgrade#old-manifest, specfold-upgrade#switch-at-the-installed-version, specfold-upgrade#full-repository-refused]
agent: implementer
```

- [x] 5.1 Plan with the profile from `specfold.yaml`, treat a manifest without `profile` as full, and record the profile with `--yes`
  - Done when: `npx vitest run test/upgrade-profile.test.ts` covers specfold-upgrade#knowledge-upgrade and specfold-upgrade#old-manifest
- [x] 5.2 Plan the full set at the installed version when the manifest says `knowledge` and `specfold.yaml` says `full`; add `openspec init` and the template `config.yaml` to the follow-ups, and name `gate.escape_label` in the report
  - Done when: the upgrade-profile tests cover specfold-upgrade#switch-at-the-installed-version
- [x] 5.3 Refuse a switch from a full install to `knowledge` with exit 2
  - Done when: the upgrade-profile tests cover specfold-upgrade#full-repository-refused, and `npx vitest run test/upgrade-plan.test.ts` still passes

## 6. Doctor

```yaml
files: [tools/specfold/src/doctor/**, tools/specfold/test/doctor-checks.test.ts]
depends: [1]
scenarios: [specfold-doctor#unknown-profile, specfold-doctor#knowledge-repository-without-openspec]
agent: implementer
```

- [x] 6.1 Fail D2 on an unknown `profile`, naming the value and the allowed values
  - Done when: `npx vitest run test/doctor-checks.test.ts` covers specfold-doctor#unknown-profile
- [x] 6.2 Return `ok` from D3 without spawning OpenSpec for the knowledge profile
  - Done when: the doctor-checks tests cover specfold-doctor#knowledge-repository-without-openspec

## 7. Gate

```yaml
files: [tools/specfold/src/gate/**, tools/specfold/test/gate-rules.test.ts, tools/specfold/test/gate-profile.test.ts, tools/specfold/test/gate-adoption.test.ts]
depends: [1]
scenarios: [specfold-gate#knowledge-repository-without-openspec, specfold-gate#knowledge-rules-still-run, specfold-gate#code-without-knowledge, specfold-gate#code-with-a-log-entry, specfold-gate#knowledge-escape-with-reason, specfold-gate#full-profile, specfold-gate#knowledge-migration-pr]
agent: implementer
```

- [x] 7.1 Skip G3, G4, G5, G6, G13, G15, G18 and the design part of G17 for the knowledge profile, without spawning OpenSpec
  - Done when: `npx vitest run test/gate-profile.test.ts` covers specfold-gate#knowledge-repository-without-openspec and specfold-gate#knowledge-rules-still-run
- [x] 7.2 Add G19, sharing G4's source-glob match and label check with the `No-knowledge reason:` line and the bundle root as satisfying paths
  - Done when: the gate-profile tests cover specfold-gate#code-without-knowledge, specfold-gate#code-with-a-log-entry, specfold-gate#knowledge-escape-with-reason and specfold-gate#full-profile
- [x] 7.3 Exempt adoption PRs from G19 as from G4
  - Done when: `npx vitest run test/gate-adoption.test.ts` covers specfold-gate#knowledge-migration-pr

## 8. Knowledge-profile smoke test and bundle

```yaml
files: [tools/specfold/test/knowledge-profile.test.ts, tools/specfold/test/fixtures/knowledge-profile/**, scripts/specfold.mjs, template/scripts/specfold.mjs]
depends: [4, 5, 6, 7]
scenarios: []
agent: implementer
```

- [x] 8.1 Add a fixture repository with `profile: knowledge` and no `openspec/`, and run validate, index, lookup, stats, hooks (pre-commit, claude-session-start) and the local gate on it with OpenSpec off the PATH
  - Done when: `npx vitest run test/knowledge-profile.test.ts` passes; any command that fails comes back as a split proposal for its own files
- [x] 8.2 Rebuild the bundle into `scripts/specfold.mjs` and `template/scripts/specfold.mjs`
  - Done when: `npm run build` leaves both files identical, and `npm test`, `npm run lint` and `npm run typecheck` pass

## 9. Knowledge

```yaml
files: [knowledge/**]
depends: [8]
scenarios: []
agent: knowledge-curator
```

- [x] 9.1 Write the concepts listed in knowledge.md
  - Done when: `node scripts/specfold.mjs validate` exits 0 and `node scripts/specfold.mjs change check add-knowledge-profile` reports no K-rule errors
- [x] 9.2 Regenerate the indexes and add the log entry
  - Done when: `node scripts/specfold.mjs index --check` exits 0

## Workflow follow-up

- Archive the change, then run `specfold sync add-knowledge-profile` and commit the result in the same PR.
- Start the follow-up change for migrating a repository with an existing OKF bundle (`/commitments/migrate-an-existing-okf-bundle.md`), with iac as its first run.
