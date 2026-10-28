# Tasks

## 1. Task packet

```yaml
files: [tools/specfold/src/tasks/packet.ts, tools/specfold/src/tasks/command.ts, tools/specfold/test/tasks-packet.test.ts]
depends: []
scenarios: [specfold-tasks#packet-for-a-group, specfold-tasks#unknown-group]
agent: implementer
```

- [x] 1.1 Build a group's packet and add `specfold tasks packet`
  - Done when: scenarios packet-for-a-group and unknown-group pass in `tasks-packet.test.ts`

## 2. No-push hook

```yaml
files: [tools/specfold/src/hooks/claude.ts, tools/specfold/src/hooks/run.ts, tools/specfold/test/hooks-no-push.test.ts]
depends: []
scenarios: [specfold-hooks#push-refused, specfold-hooks#other-commands-pass]
agent: implementer
```

- [x] 2.1 Refuse `git push` and `gh pr` in a PreToolUse event
  - Done when: scenarios push-refused and other-commands-pass pass in `hooks-no-push.test.ts`

## 3. Roles

```yaml
files: [template/.claude/agents/**, .claude/agents/**, examples/sample-app/.claude/agents/**, .github/workflows/cli.yml]
depends: [1, 2]
scenarios: []
agent: implementer
```

- [x] 3.1 Write the five role definitions and copy them to the kit and the sample app
  - Done when: `specfold tasks check` reports no T7 for `knowledge-curator` in this change and CI's agents comparison covers the whole folder

## 4. Orchestrator skill

```yaml
files: [template/.agents/skills/sf-apply/**, .agents/skills/sf-apply/**, examples/sample-app/.agents/skills/sf-apply/**, template/.claude/skills/sf-apply, .claude/skills/sf-apply, examples/sample-app/.claude/skills/sf-apply]
depends: [1]
scenarios: []
agent: implementer
```

- [ ] 4.1 Write `sf-apply` with its split-proposal reference, copy and link it
  - Done when: `check-skills.mjs` passes and `agents sync --check` passes in the kit, the template and the sample app

## 5. Settings and bundle

```yaml
files: [template/.claude/settings.json, .claude/settings.json, examples/sample-app/.claude/settings.json, template/.specfold/manifest.json, scripts/specfold.mjs, template/scripts/specfold.mjs, examples/sample-app/scripts/specfold.mjs]
depends: [3, 4]
scenarios: []
agent: implementer
```

- [ ] 5.1 Let only the main session spawn subagents
  - Done when: the template's settings set `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` to `"1"` and the copies match
- [ ] 5.2 Rebuild the bundle, its copies and the template manifest
  - Done when: the copies equal `scripts/specfold.mjs` and `template-manifest.test.ts` passes

## 6. Knowledge

```yaml
files: [knowledge/**]
depends: [5]
scenarios: []
agent: knowledge-curator
```

- [ ] 6.1 Write the concept updates listed in `knowledge.md`, and check the role prompts against them
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-subagent-roles` and commit its result in the same PR.
