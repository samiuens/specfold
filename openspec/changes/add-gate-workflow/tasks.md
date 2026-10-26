# Tasks

## 1. Gate summary

```yaml
files: [tools/specfold/src/gate/summary.ts, tools/specfold/src/gate/command.ts, tools/specfold/test/gate-summary.test.ts]
depends: []
scenarios: [specfold-gate#summary-of-a-blocked-branch]
agent: implementer
```

- [x] 1.1 Add `--summary <file>` with the Markdown summary
  - Done when: scenario summary-of-a-blocked-branch passes in `gate-summary.test.ts`

## 2. Bundle

```yaml
files: [scripts/specfold.mjs, template/scripts/specfold.mjs, examples/sample-app/scripts/specfold.mjs]
depends: [1]
scenarios: []
agent: implementer
```

- [x] 2.1 Rebuild the bundled CLI and its template and sample copies
  - Done when: `npm run build -w specfold` leaves no diff and the copies equal it

## 3. Template

```yaml
files: [template/.github/**, template/.claude/settings.json, template/.gitignore]
depends: [2]
scenarios: []
agent: implementer
```

- [ ] 3.1 Add the gate and comment workflows to the template
  - Done when: both workflow files parse as YAML and name the job `specfold-gate`
- [ ] 3.2 Add the Claude Code hook settings to the template
  - Done when: `template/.claude/settings.json` parses and runs the three hooks
- [ ] 3.3 Add CODEOWNERS, the PR template and the worktree ignore
  - Done when: the PR template has `Change:`, `Knowledge:` and `No-spec reason:` lines

## 4. Kit

```yaml
files: [.github/**, .claude/settings.json, examples/sample-app/.claude/settings.json]
depends: [3]
scenarios: []
agent: implementer
```

- [ ] 4.1 Add the kit's gate workflow, the comment workflow and the PR template
  - Done when: this change's PR shows a `specfold-gate` check
- [ ] 4.2 Dogfood the Claude Code settings and add CODEOWNERS
  - Done when: `.claude/settings.json` in the kit and the sample app equal the template's
- [ ] 4.3 Check the new copies in CI
  - Done when: the `cli` workflow fails when a copy differs from the template

## 5. Knowledge

```yaml
files: [knowledge/**]
depends: [4]
scenarios: []
agent: knowledge-curator
```

- [ ] 5.1 Update the concepts listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Run the test PRs against this branch and record their results in the PR.
- Archive the change, then run `node scripts/specfold.mjs sync add-gate-workflow` and commit its result in the same PR.
- After the test PRs pass, ask before adding `specfold-gate` to ruleset 25866688.
