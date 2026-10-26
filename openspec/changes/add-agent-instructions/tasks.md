# Tasks

## 1. CLI bundle in the template

```yaml
files: [template/scripts/**]
depends: []
scenarios: []
agent: implementer
```

- [x] 1.1 Ship the bundled CLI as `template/scripts/specfold.mjs`
  - Done when: `diff scripts/specfold.mjs template/scripts/specfold.mjs` finds no difference

## 2. Agent instructions

```yaml
files: [template/AGENTS.md, template/CLAUDE.md]
depends: []
scenarios: []
agent: implementer
```

- [x] 2.1 Write `template/AGENTS.md`, linking the code-comment convention
  - Done when: it has under 120 lines and `node scripts/specfold.mjs audit` in `template/` reports 0 findings
- [x] 2.2 Write `template/CLAUDE.md`
  - Done when: it starts with `@AGENTS.md` and names the planner start command

## 3. Sample app wiring

```yaml
files: [examples/**, .github/workflows/cli.yml]
depends: [1, 2]
scenarios: []
agent: implementer
```

- [x] 3.1 Copy the instruction files, bundle, skills and planner into the sample and link the skills
  - Done when: `node scripts/specfold.mjs agents sync --check` and `audit` exit 0 in `examples/sample-app`
- [x] 3.2 Extend the CI copy checks to every kit-owned file in the template and the sample
  - Done when: the `cli` workflow passes on the PR
- [x] 3.3 Write the runbook for the Claude Code and opencode checks in the sample's README
  - Done when: every command in it runs as written up to the interactive step

## 4. End-to-end check

```yaml
files: [examples/sample-app/openspec/changes/**]
depends: [3]
scenarios: []
agent: planner
```

- [ ] 4.1 Plan a second sample change with the planner in Claude Code, run by the maintainer from the runbook
  - Done when: the change's `brief.md` is confirmed and `change check` and `openspec validate --strict` pass in the sample
- [ ] 4.2 Run the opencode check from the runbook
  - Done when: the maintainer reports that opencode lists the sf skills and answers a lookup through `sf-lookup`

## 5. Knowledge

```yaml
files: [knowledge/**]
depends: [4]
scenarios: []
agent: knowledge-curator
```

- [ ] 5.1 Write the concepts listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` and `audit` exit 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-agent-instructions` and commit its result in the same PR.
