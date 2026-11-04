# Tasks

## 1. Reference check

```yaml
files: [knowledge/references/claude-code.md, openspec/changes/add-agent-permissions/design.md]
depends: []
scenarios: []
agent: knowledge-curator
```

- [x] 1.1 Check Claude Code's permission rule docs: rule syntax, prefix and wildcard matching, and the order of deny, ask and allow. Update the reference.
  - Done when: `knowledge/references/claude-code.md` has a dated `# Permissions` section with sources, and `node scripts/specfold.mjs validate` exits 0
- [x] 1.2 Fix the pattern table in design.md to match what the docs allow
  - Done when: every pattern in design.md decision 4 uses a documented form, and any form that stays uncovered is listed under Risks

## 2. Permissions core

```yaml
files: [tools/specfold/src/permissions/**, tools/specfold/src/commands.ts, tools/specfold/test/permissions*.test.ts]
depends: [1]
scenarios: [specfold-permissions#rules-written, specfold-permissions#no-permissions-key, specfold-permissions#unknown-action, specfold-permissions#unknown-level, specfold-permissions#looser-force-push, specfold-permissions#stricter-force-push, specfold-permissions#agents-only, specfold-permissions#level-changed, specfold-permissions#merge-through-the-api, specfold-permissions#team-rule-kept, specfold-permissions#broken-settings-file, specfold-permissions#out-of-date, specfold-permissions#in-sync, specfold-permissions#json-changes]
agent: implementer
```

- [x] 2.1 Write the action table: actions, the push parent, the patterns and a `retired` list
  - Done when: a test checks that each sub-action pattern matches one sample command and misses one, using the documented matching rules, and that `retired` and the current patterns don't overlap
- [x] 2.2 Validate the setting and render it into the desired allow, ask and deny lists
  - Done when: `npx vitest run test/permissions-render.test.ts` covers no-permissions-key, unknown-action, unknown-level, looser-force-push and stricter-force-push
- [x] 2.3 Apply the desired lists to a settings object while keeping foreign rules in their order
  - Done when: the render tests cover level-changed, merge-through-the-api and team-rule-kept, and a second apply reports no changes
- [x] 2.4 Route `specfold permissions sync [--check] [--json]` with exit codes 0, 1 and 2
  - Done when: `npx vitest run test/permissions-command.test.ts` covers rules-written, agents-only, broken-settings-file, out-of-date, in-sync and json-changes

## 3. Doctor check

```yaml
files: [tools/specfold/src/doctor/checks.ts, tools/specfold/src/doctor/command.ts, tools/specfold/test/doctor-checks.test.ts, tools/specfold/test/doctor.test.ts]
depends: [2]
scenarios: [specfold-doctor#rules-out-of-date, specfold-doctor#invalid-setting, specfold-doctor#not-a-claude-code-repository, specfold-doctor#json-result, specfold-doctor#only-warnings, specfold-doctor#a-failure]
agent: implementer
```

- [x] 3.1 Add D8 for agent permissions, reusing the render functions
  - Done when: D8 is `warn`, `fail` and `ok` (with a note) as the scenarios say, and the doctor tests pass with eight checks

## 4. Init and migrate

```yaml
files: [tools/specfold/src/init/**, tools/specfold/src/migrate/install.ts, tools/specfold/test/init.test.ts, tools/specfold/test/migrate-install.test.ts, tools/specfold/test/migrate-merge.test.ts]
depends: [2]
scenarios: [specfold-init#permissions-rendered, specfold-init#fresh-template-repository, specfold-migrate#default-permissions-installed, specfold-migrate#agents-only-skips-the-rules]
agent: implementer
```

- [x] 4.1 Run the permissions sync in init's setup steps and list it in `--dry-run`
  - Done when: `npx vitest run test/init.test.ts` covers permissions-rendered, and a rerun of init still changes no file
- [x] 4.2 Run the permissions sync after migrate install's settings merge, and report problems as conflicts
  - Done when: `npx vitest run test/migrate-install.test.ts test/migrate-merge.test.ts` covers default-permissions-installed and agents-only-skips-the-rules

## 5. Upgrade

```yaml
files: [tools/specfold/src/upgrade/config.ts, tools/specfold/src/upgrade/command.ts, tools/specfold/test/upgrade-config.test.ts, tools/specfold/test/upgrade-apply.test.ts]
depends: [2]
scenarios: [specfold-upgrade#team-level-kept]
agent: implementer
```

- [x] 5.1 Keep owned patterns out of `upgradeSettings`
  - Done when: an upgrade-config test shows that owned patterns in any list are neither added nor removed by the merge
- [x] 5.2 Add `permissions sync` to the upgrade's follow-up commands, after `agents sync`
  - Done when: `npx vitest run test/upgrade-apply.test.ts` covers team-level-kept

## 6. Template and kit settings

```yaml
files: [template/specfold.yaml, template/AGENTS.md, template/.claude/settings.json, template/.specfold/manifest.json, specfold.yaml, AGENTS.md, tools/specfold/test/permissions-template.test.ts]
depends: [2]
scenarios: []
agent: implementer
```

- [x] 6.1 Add a `permissions` block with `ask` for all seven actions to the template's and the kit's `specfold.yaml`
  - Done when: both files parse, and `permissions sync --check`, run with the source CLI on a copy of the template, reports only the additions
- [x] 6.2 Render the default rules into `template/.claude/settings.json` and add a test that keeps it in step with `template/specfold.yaml`
  - Done when: `npx vitest run test/permissions-template.test.ts` passes
- [x] 6.3 Add the fixed permissions sentence and the reworded PR sentence to the template's `AGENTS.md` block and the kit's `AGENTS.md`
  - Done when: `npx vitest run test/template-manifest.test.ts` passes after updating the manifest hash, and `node scripts/specfold.mjs stats` keeps `AGENTS.md` under its budget

## 7. Bundle, docs and kit sync

```yaml
files: [scripts/specfold.mjs, template/scripts/specfold.mjs, docs/commands.md, docs/getting-started.md, upgrade/notes/0.4.0.md, .claude/settings.json]
depends: [3, 4, 5, 6]
scenarios: []
agent: implementer
```

- [x] 7.1 Rebuild the bundle and copy it to the template
  - Done when: `npm run build -w specfold` leaves no diff and `template/scripts/specfold.mjs` matches
- [x] 7.2 Run `node scripts/specfold.mjs permissions sync` on the kit repo
  - Done when: `permissions sync --check` and `doctor` (D8) are clean in the kit repo, and Claude Code asks before `git push`
- [x] 7.3 Regenerate the command reference, describe permissions in getting started, and write the upgrade notes for the next release
  - Done when: `node tools/specfold/docs.mjs --check` passes, and `upgrade/notes/0.4.0.md` tells the agent to explain the default `ask` rules and the `permissions` key to the user

## 8. Knowledge

```yaml
files: [knowledge/decisions/agent-permissions.md, knowledge/decisions/permission-rules-tracked-in-manifest.md, knowledge/capabilities/**, knowledge/backlog/agent-permissions-in-specfold-yaml.md]
depends: [1, 2, 3, 4, 5, 6, 7]
scenarios: []
agent: knowledge-curator
```

- [x] 8.1 Write the concept updates listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` and `index --check` exit 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-agent-permissions` and commit its result in the same PR.
- Check that `upgrade/notes/0.4.0.md` matches the version release-please proposes before merging the release PR.
