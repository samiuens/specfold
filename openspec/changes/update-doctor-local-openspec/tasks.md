# Tasks

## 1. Local OpenSpec binary

```yaml
files: [tools/specfold/src/doctor/checks.ts, tools/specfold/test/doctor-checks.test.ts, package.json, package-lock.json, scripts/specfold.mjs]
depends: []
scenarios: [specfold-doctor#openspec-missing, specfold-doctor#version-out-of-range, specfold-doctor#repository-local-openspec]
agent: implementer
```

- [x] 1.1 Prefer `node_modules/.bin/openspec` in D3 and name the binary in the message
  - Done when: the three D3 scenarios pass in `doctor-checks.test.ts`
- [x] 1.2 Pin `@fission-ai/openspec` 1.15.0 as a kit dev dependency
  - Done when: `node scripts/specfold.mjs doctor` reports D3 `ok` in the kit repo

## 2. Knowledge

```yaml
files: [knowledge/**]
depends: [1]
scenarios: []
agent: knowledge-curator
```

- [ ] 2.1 Update the doctor capability card and add the log entry
  - Done when: `node scripts/specfold.mjs validate` and `node scripts/specfold.mjs index --check` exit 0

## Workflow follow-up

- Archive the change in this PR.
