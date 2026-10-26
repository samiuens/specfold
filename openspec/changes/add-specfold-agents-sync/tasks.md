# Tasks

## 1. Config

```yaml
files: [tools/specfold/src/repo.ts, tools/specfold/test/repo.test.ts, tools/specfold/test/change-knowledge.test.ts, specfold.yaml, template/specfold.yaml]
depends: []
scenarios: []
agent: implementer
```

- [x] 1.1 Read `agents.targets` from `specfold.yaml` with the default `[".claude/skills"]` and set it in the kit and template settings
  - Done when: `repo.test.ts` covers the default, a configured list and a target outside the repository

## 2. Link planning

```yaml
files: [tools/specfold/src/agents/sync.ts, tools/specfold/test/agents-sync.test.ts]
depends: [1]
scenarios: [specfold-agents-sync#two-targets, specfold-agents-sync#nested-target, specfold-agents-sync#skill-removed, specfold-agents-sync#generated-folder-kept]
agent: implementer
```

- [ ] 2.1 Plan and apply link, relink, unlink and kept actions per target
  - Done when: the four scenarios of this group pass in `agents-sync.test.ts`

## 3. Agents sync command

```yaml
files: [tools/specfold/src/agents/command.ts, tools/specfold/src/commands.ts, tools/specfold/test/agents-command.test.ts]
depends: [2]
scenarios: [specfold-agents-sync#links-created, specfold-agents-sync#missing-link-detected, specfold-agents-sync#json-report, specfold-agents-sync#no-skills-folder, specfold-agents-sync#permission-denied]
agent: implementer
```

- [ ] 3.1 Add `specfold agents sync [--check] [--json]` with output and exit codes
  - Done when: the five scenarios of this group pass in `agents-command.test.ts`

## 4. Bundle

```yaml
files: [scripts/specfold.mjs]
depends: [3]
scenarios: []
agent: implementer
```

- [ ] 4.1 Rebuild the bundled CLI
  - Done when: `npm run build -w specfold` leaves no diff and `node scripts/specfold.mjs agents sync --check` exits 0 in the kit

## 5. Knowledge

```yaml
files: [knowledge/**]
depends: [4]
scenarios: []
agent: knowledge-curator
```

- [ ] 5.1 Write the concepts listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-specfold-agents-sync` and commit its result in the same PR.
