# Tasks

## 1. Config and links

```yaml
files: [tools/specfold/src/repo.ts, tools/specfold/test/repo.test.ts, tools/specfold/test/change-knowledge.test.ts, tools/specfold/src/validate/links.ts, specfold.yaml, template/specfold.yaml]
depends: []
scenarios: []
agent: implementer
```

- [ ] 1.1 Read `audit.unverified_after_days` (default 30) and set it in the kit and template settings
  - Done when: `repo.test.ts` covers the default and a configured value
- [ ] 1.2 Export the body link extraction of rule L1 as `bodyLinks`
  - Done when: `npm test -w specfold` passes with the L1 tests unchanged

## 2. Audit rules

```yaml
files: [tools/specfold/src/audit/rules.ts, tools/specfold/test/audit-rules.test.ts]
depends: [1]
scenarios: [specfold-audit#expired-reference, specfold-audit#old-draft, specfold-audit#fresh-draft, specfold-audit#link-to-deprecated-decision, specfold-audit#unlinked-term, specfold-audit#referenced-from-code, specfold-audit#missing-card]
agent: implementer
```

- [ ] 2.1 Add rules A1 to A5 over the parsed bundle with an injected current time
  - Done when: the seven scenarios of this group pass in `audit-rules.test.ts`

## 3. Audit command

```yaml
files: [tools/specfold/src/audit/command.ts, tools/specfold/src/commands.ts, tools/specfold/test/audit-command.test.ts]
depends: [2]
scenarios: [specfold-audit#clean-bundle, specfold-audit#json-report]
agent: implementer
```

- [ ] 3.1 Add `specfold audit [--json]` with output and exit codes
  - Done when: scenarios clean-bundle and json-report pass in `audit-command.test.ts`

## 4. Bundle

```yaml
files: [scripts/specfold.mjs]
depends: [3]
scenarios: []
agent: implementer
```

- [ ] 4.1 Rebuild the bundled CLI
  - Done when: `npm run build -w specfold` leaves no diff

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

- Archive the change, then run `node scripts/specfold.mjs sync add-specfold-audit` and commit its result in the same PR.
