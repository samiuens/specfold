# Tasks

## 1. omp facts

```yaml
files: [knowledge/references/omp.md]
depends: []
scenarios: []
agent: implementer
```

- [x] 1.1 Check every omp fact design.md relies on against the installed omp and record them, with sources, in `knowledge/references/omp.md`: the hook-context field that marks a task subagent, the branch name omp reports for an isolated task with `merge: branch` and `apply: false`, whether `bash.patterns` `git push *` matches a bare `git push`, `PI_SESSION_ID` and `OMPCODE` in bash calls, and the role frontmatter keys
  - Done when: `node scripts/specfold.mjs validate` exits 0 and the reference names the subagent marker and the branch name

## 2. Tools setting and signature

```yaml
files: [tools/specfold/src/repo.ts, tools/specfold/src/actor.ts, tools/specfold/src/omp/config.ts, tools/specfold/src/new/command.ts, tools/specfold/src/backlog/command.ts, tools/specfold/src/sync/plan.ts, tools/specfold/src/verify/login.ts, tools/specfold/test/repo.test.ts, tools/specfold/test/actor.test.ts, tools/specfold/test/omp-config.test.ts, tools/specfold/test/verify-login.test.ts, tools/specfold/test/change-knowledge.test.ts, tools/specfold/vitest.config.ts]
depends: [1]
scenarios: [specfold-tools#omp-listed, specfold-tools#unknown-tool, specfold-tools#repository-from-an-earlier-release, specfold-tools#new-concept-from-omp, specfold-tools#new-concept-from-claude-code, specfold-verify#run-by-omp, specfold-verify#run-by-claude-code]
agent: implementer
```

- [x] 2.1 Read and validate `tools` in `src/repo.ts`, defaulting from `agents.targets`
  - Done when: `repo.test.ts` passes the scenarios `specfold-tools#omp-listed`, `#unknown-tool` and `#repository-from-an-earlier-release`
- [x] 2.2 Add `agentBy` in `src/actor.ts` and use it in `new`, `backlog` and `sync`
  - Done when: `actor.test.ts` passes `specfold-tools#new-concept-from-omp` and `#new-concept-from-claude-code`
- [x] 2.3 Refuse `verify` when `OMPCODE` or `PI_SESSION_ID` is set
  - Done when: `verify-login.test.ts` passes `specfold-verify#run-by-omp` and `#run-by-claude-code`
- [x] 2.4 Add `src/omp/config.ts`: read `.omp/config.yml` as a YAML Document, refuse a non-mapping, write it back keeping comments and long lines
  - Done when: `omp-config.test.ts` covers a missing file, a kept comment, a 120-character line and a top-level list

## 3. omp roles and task settings

```yaml
files: [tools/specfold/src/agents/**, tools/specfold/test/agents-sync.test.ts, tools/specfold/test/agents-command.test.ts, tools/specfold/test/agents-omp.test.ts]
depends: [2]
scenarios: [specfold-agents-sync#roles-written, specfold-agents-sync#not-listed, specfold-agents-sync#implementer-mapped, specfold-agents-sync#read-only-tools-mapped, specfold-agents-sync#source-removed, specfold-agents-sync#hand-written-role-kept, specfold-agents-sync#team-settings-kept, specfold-agents-sync#role-out-of-date]
agent: implementer
```

- [x] 3.1 Render one omp role from a Claude agent file in `src/agents/omp.ts` with the mapping table of design.md
  - Done when: `agents-omp.test.ts` passes `#implementer-mapped` and `#read-only-tools-mapped`
- [x] 3.2 Plan write, rewrite, remove and kept actions for `.omp/agents/`, skipping `planner`
  - Done when: `agents-omp.test.ts` passes `#roles-written`, `#not-listed`, `#source-removed` and `#hand-written-role-kept`
- [x] 3.3 Set the four omp task settings through `src/omp/config.ts`
  - Done when: `agents-omp.test.ts` passes `#team-settings-kept`
- [x] 3.4 Report the new actions in text, `--json` and `--check`
  - Done when: `agents-command.test.ts` passes `#role-out-of-date` and the existing agents sync tests still pass

## 4. omp permission rules

```yaml
files: [tools/specfold/src/permissions/**, tools/specfold/test/permissions-render.test.ts, tools/specfold/test/permissions-command.test.ts, tools/specfold/test/permissions-omp.test.ts]
depends: [2]
scenarios: [specfold-permissions#agents-only, specfold-permissions#omp-only, specfold-permissions#omp-rules-written, specfold-permissions#omp-not-listed, specfold-permissions#stricter-force-push-wins, specfold-permissions#team-rule-kept, specfold-permissions#broken-omp-settings, specfold-permissions#omp-out-of-date]
agent: implementer
```

- [x] 4.1 Derive the omp match strings, bare forms included, from the action table
  - Done when: `permissions-omp.test.ts` checks one matching and one non-matching command per action with a matcher following omp's documented `*` semantics
- [x] 4.2 Render the owned block first (deny, prompt, allow) and keep every other entry and key
  - Done when: `permissions-omp.test.ts` passes `#omp-rules-written`, `#stricter-force-push-wins` and `#team-rule-kept`
- [x] 4.3 Wire the omp target into the sync, its errors, `--check` and `--json`
  - Done when: `permissions-command.test.ts` passes `#agents-only`, `#omp-only`, `#omp-not-listed`, `#broken-omp-settings` and `#omp-out-of-date`

## 5. omp hook adapter

```yaml
files: [template/.specfold/tools/omp/**, tools/specfold/test/hooks-omp.test.ts]
depends: [1]
scenarios: [specfold-hooks#cli-missing, specfold-hooks#context-at-start, specfold-hooks#agent-writes-a-broken-concept-in-omp, specfold-hooks#unfinished-work-in-omp, specfold-hooks#clean-stop, specfold-hooks#subagent-push-refused, specfold-hooks#main-session-push-left-to-permissions]
agent: implementer
```

- [x] 5.1 Write the adapter with session start and the post-edit check, importing only types from omp
  - Done when: `hooks-omp.test.ts`, with a fake `pi` and a temporary repository, passes `#cli-missing`, `#context-at-start` and `#agent-writes-a-broken-concept-in-omp`
- [x] 5.2 Add the `session_stop` block and the subagent push guard, using the subagent marker from task 1.1
  - Done when: `hooks-omp.test.ts` passes `#unfinished-work-in-omp`, `#clean-stop`, `#subagent-push-refused` and `#main-session-push-left-to-permissions`

## 6. Init, migrate and upgrade

```yaml
files: [tools/specfold/src/init/**, tools/specfold/src/migrate/install.ts, tools/specfold/src/upgrade/**, tools/specfold/test/init.test.ts, tools/specfold/test/migrate-install.test.ts, tools/specfold/test/migrate-profile.test.ts, tools/specfold/test/upgrade-plan.test.ts, tools/specfold/test/upgrade-apply.test.ts, tools/specfold/test/template-manifest.test.ts, tools/specfold/test/fixtures/**, template/specfold.yaml, template/.specfold/manifest.json]
depends: [3, 4, 5]
scenarios: [specfold-init#omp-not-passed-to-openspec, specfold-init#omp-chosen, specfold-init#rerun-keeps-tools, specfold-init#unknown-tool-at-init, specfold-init#omp-set-up, specfold-init#omp-left-out, specfold-migrate#omp-at-install, specfold-migrate#agents-only, specfold-upgrade#old-repository-without-the-key, specfold-upgrade#adapter-replaced, specfold-upgrade#omp-added-before-an-upgrade]
agent: implementer
```

- [x] 6.1 Accept `omp` in `parseTools`, keep it out of `openspec init`, and list `.claude/agents` and `.specfold/tools` in `kitOwned` for `omp`
  - Done when: `init.test.ts` passes `#omp-not-passed-to-openspec` and `#unknown-tool-at-init`
- [x] 6.2 Write `tools` at init and keep it on a rerun; set `tools: [agents, claude]` in `template/specfold.yaml`
  - Done when: `init.test.ts` passes `#omp-chosen` and `#rerun-keeps-tools`
- [x] 6.3 Install the active adapter copy at init and record it in the manifest
  - Done when: `init.test.ts` passes `#omp-set-up` and `#omp-left-out`
- [x] 6.4 Do the same in `migrate install`
  - Done when: `migrate-install.test.ts` passes `specfold-migrate#omp-at-install` and `#agents-only`
- [x] 6.5 Read `tools` in the upgrader with the manifest fallback, and treat the active adapter as kit-owned
  - Done when: `upgrade-plan.test.ts` and `upgrade-apply.test.ts` pass the three `specfold-upgrade` scenarios
- [x] 6.6 Regenerate `template/.specfold/manifest.json`
  - Done when: `template-manifest.test.ts` passes

## 7. Skills, instructions and kit dogfooding

```yaml
files: [template/AGENTS.md, template/.agents/skills/sf-apply/**, .agents/skills/sf-apply/**, AGENTS.md, specfold.yaml, .omp/**, scripts/specfold.mjs, template/scripts/specfold.mjs]
depends: [6]
scenarios: []
agent: implementer
```

- [x] 7.1 Add the omp dispatch section to `sf-apply` in the template and the kit copy, naming the branch from task 1.1
  - Done when: `node scripts/check-skills.mjs` exits 0 and the kit copy equals the template's
- [x] 7.2 Name the omp entry points in `template/AGENTS.md`, and write `<tool>/<model>` in the kit's `AGENTS.md`
  - Done when: `node scripts/specfold.mjs stats` reports both files under their budgets
- [x] 7.3 Build the bundle and copy it to the template
  - Done when: `npm test --workspace tools/specfold` and `npm run check --workspace tools/specfold` exit 0, and both `specfold.mjs` copies are equal
- [x] 7.4 List `omp` in the kit's `specfold.yaml`, then run `agents sync`, `permissions sync` and copy the adapter to `.omp/hooks/pre/`
  - Done when: `agents sync --check` and `permissions sync --check` exit 0 in the kit

## 8. omp proof run

```yaml
files: [examples/runs/omp/**, examples/sample-app/README.md]
depends: [7]
scenarios: []
agent: implementer
```

- [x] 8.1 Add the omp steps to the sample app's agent check
  - Done when: the README's "Agent check" section lists the omp steps
- [ ] 8.2 Run the check under omp on a copy outside the kit: init with `--tools agents,omp`, plan a small change with `sf-plan`, apply it with one isolated implementer, and record the run in `examples/runs/omp/README.md`
  - Done when: the record shows the session-start context, a blocked or a clean stop, a refused subagent push, the merged implementer branch, and `generated.by: omp/<model>` on a concept

## 9. Knowledge

```yaml
files: [knowledge/**]
depends: [8]
scenarios: []
agent: knowledge-curator
```

- [ ] 9.1 Write the concepts listed in knowledge.md except `references/omp.md`, and add the omp steps to the sample-app runbook
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `specfold sync add-omp-support` and commit the result in the same PR.
