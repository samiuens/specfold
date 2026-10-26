# Tasks

## 1. Frontmatter blocks

```yaml
files: [tools/specfold/src/sync/frontmatter.ts, tools/specfold/test/sync-frontmatter.test.ts]
depends: []
scenarios: []
agent: implementer
```

- [x] 1.1 Let `editFrontmatter` replace or insert a key's whole block
  - Done when: `sync-frontmatter.test.ts` covers replacing a key and inserting one after `generated`

## 2. Login and entries

```yaml
files: [tools/specfold/src/verify/login.ts, tools/specfold/src/verify/apply.ts, tools/specfold/test/verify-login.test.ts, tools/specfold/test/verify-apply.test.ts]
depends: [1]
scenarios: [specfold-verify#no-login-available, specfold-verify#second-reviewer]
agent: implementer
```

- [x] 2.1 Resolve the login from the GitHub CLI or `.specfold/local.yaml`
  - Done when: scenario no-login-available passes in `verify-login.test.ts`
- [x] 2.2 Write `status: stable` and the `verified` entry into a concept's text
  - Done when: scenario second-reviewer passes in `verify-apply.test.ts`

## 3. Verify command

```yaml
files: [tools/specfold/src/verify/command.ts, tools/specfold/src/commands.ts, tools/specfold/test/verify-command.test.ts]
depends: [2]
scenarios: [specfold-verify#concept-verified, specfold-verify#run-by-claude-code, specfold-verify#one-bad-path]
agent: implementer
```

- [x] 3.1 Add `specfold verify` with the agent guard, path checks and output
  - Done when: scenarios concept-verified, run-by-claude-code and one-bad-path pass in `verify-command.test.ts`

## 4. Template

```yaml
files: [template/.gitignore]
depends: []
scenarios: []
agent: implementer
```

- [x] 4.1 Ignore `.specfold/local.yaml` in the template
  - Done when: `template/.gitignore` lists `.specfold/local.yaml`

## 5. Bundle

```yaml
files: [scripts/specfold.mjs, template/scripts/specfold.mjs, examples/sample-app/scripts/specfold.mjs]
depends: [3]
scenarios: []
agent: implementer
```

- [ ] 5.1 Rebuild the bundled CLI and its template and sample copies
  - Done when: `npm run build -w specfold` leaves no diff and the copies equal it

## 6. Knowledge

```yaml
files: [knowledge/**]
depends: [4, 5]
scenarios: []
agent: knowledge-curator
```

- [ ] 6.1 Write the concepts listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-specfold-verify` and commit its result in the same PR.
