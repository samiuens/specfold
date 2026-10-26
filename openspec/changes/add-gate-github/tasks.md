# Tasks

## 1. Claims

```yaml
files: [tools/specfold/src/gate/claims.ts, tools/specfold/src/bundle.ts, tools/specfold/test/gate-claims.test.ts]
depends: []
scenarios: []
agent: implementer
```

- [x] 1.1 Find the human claims a branch adds to concepts and briefs
  - Done when: `gate-claims.test.ts` covers added, unchanged and list-form `verified` claims and `confirmed_by`

## 2. GitHub

```yaml
files: [tools/specfold/src/gate/github.ts, tools/specfold/test/gate-github.test.ts, tools/specfold/test/github-server.ts]
depends: []
scenarios: [specfold-gate#approval-withdrawn, specfold-gate#comment-after-approval, specfold-gate#missing-token]
agent: implementer
```

- [x] 2.1 Read the PR author and approvers from the GitHub REST API with pagination
  - Done when: scenarios approval-withdrawn, comment-after-approval and missing-token pass in `gate-github.test.ts` against a local server

## 3. Rule and option

```yaml
files: [tools/specfold/src/gate/rules.ts, tools/specfold/src/gate/command.ts, tools/specfold/test/gate-rules.test.ts, tools/specfold/test/gate-command.test.ts]
depends: [1, 2]
scenarios: [specfold-gate#approver-verified, specfold-gate#claimed-stranger, specfold-gate#local-verification]
agent: implementer
```

- [ ] 3.1 Add rule G7 over the added claims and the PR
  - Done when: scenarios approver-verified, claimed-stranger and local-verification pass in `gate-rules.test.ts`
- [ ] 3.2 Add `--pr` to `specfold gate` and fetch the PR before the rules run
  - Done when: `gate-command.test.ts` covers `--pr` against a local server and a malformed number

## 4. Bundle

```yaml
files: [scripts/specfold.mjs, template/scripts/specfold.mjs, examples/sample-app/scripts/specfold.mjs]
depends: [3]
scenarios: []
agent: implementer
```

- [ ] 4.1 Rebuild the bundled CLI and its template and sample copies
  - Done when: `npm run build -w specfold` leaves no diff and the copies equal it

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

- Archive the change, then run `node scripts/specfold.mjs sync add-gate-github` and commit its result in the same PR.
