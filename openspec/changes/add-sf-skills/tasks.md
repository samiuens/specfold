# Tasks

## 1. Lookup and capture skills

```yaml
files: [template/.agents/skills/sf-lookup/**, template/.agents/skills/sf-capture/**]
depends: [5]
scenarios: []
agent: implementer
```

- [x] 1.1 Write `sf-lookup`
  - Done when: `node scripts/check-skills.mjs template/.agents/skills` reports no problem for `sf-lookup`
- [x] 1.2 Write `sf-capture`, including rejected proposals and moving long rationale comments
  - Done when: `node scripts/check-skills.mjs template/.agents/skills` reports no problem for `sf-capture`

## 2. Sync and audit skills

```yaml
files: [template/.agents/skills/sf-sync/**, template/.agents/skills/sf-audit/**]
depends: [5]
scenarios: []
agent: implementer
```

- [x] 2.1 Write `sf-sync`
  - Done when: `node scripts/check-skills.mjs template/.agents/skills` reports no problem for `sf-sync`
- [ ] 2.2 Write `sf-audit`
  - Done when: `node scripts/check-skills.mjs template/.agents/skills` reports no problem for `sf-audit`

## 3. Interview, plan and planner

```yaml
files: [template/.agents/skills/sf-interview/**, template/.agents/skills/sf-plan/**, template/.claude/agents/**]
depends: [5]
scenarios: []
agent: implementer
```

- [ ] 3.1 Write `sf-interview` with the question rounds, the timeout rule and the brief
  - Done when: `node scripts/check-skills.mjs template/.agents/skills` reports no problem for `sf-interview`
- [ ] 3.2 Write `sf-plan` and `.claude/agents/planner.md`
  - Done when: `node scripts/check-skills.mjs template/.agents/skills` reports no problem for `sf-plan` and the planner's frontmatter names only documented keys

## 4. Wire up

```yaml
files: [template/.claude/skills/**, .agents/skills/sf-*/**, .claude/skills/**, .claude/agents/**, .github/workflows/cli.yml]
depends: [1, 2, 3]
scenarios: []
agent: implementer
```

- [ ] 4.1 Link the template's skills with `specfold agents sync`
  - Done when: `node ../scripts/specfold.mjs agents sync --check` exits 0 in `template/`
- [ ] 4.2 Copy the skills and the planner into the kit and link them
  - Done when: `node scripts/specfold.mjs agents sync --check` exits 0 and `diff -r` finds no difference to the template
- [ ] 4.3 Add the skills checks to CI
  - Done when: the `cli` workflow passes on the PR

## 5. Skills check

```yaml
files: [scripts/check-skills.mjs]
depends: []
scenarios: []
agent: implementer
```

- [x] 5.1 Add `scripts/check-skills.mjs` for the shared SKILL.md frontmatter rules and relative links
  - Done when: it exits 0 on `.agents/skills` in the kit and 1 on a skill whose name differs from its folder

## 6. Knowledge

```yaml
files: [knowledge/**]
depends: [4]
scenarios: []
agent: knowledge-curator
```

- [ ] 6.1 Write the concepts listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` and `node scripts/specfold.mjs audit` exit 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-sf-skills` and commit its result in the same PR.
