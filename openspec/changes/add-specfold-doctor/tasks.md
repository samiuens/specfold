# Tasks

## 1. Checks

```yaml
files: [tools/specfold/src/doctor/checks.ts, tools/specfold/src/repo.ts, tools/specfold/test/doctor-checks.test.ts, tools/specfold/test/repo.test.ts]
depends: []
scenarios: [specfold-doctor#supported-node, specfold-doctor#broken-configuration, specfold-doctor#openspec-missing, specfold-doctor#version-out-of-range, specfold-doctor#hooks-not-installed, specfold-doctor#missing-bundle, specfold-doctor#graphify-absent]
agent: implementer
```

- [ ] 1.1 Add checks D1 to D6 over an injected environment, with version ranges
  - Done when: the seven scenarios of this group pass in `doctor-checks.test.ts`

## 2. Doctor command

```yaml
files: [tools/specfold/src/doctor/command.ts, tools/specfold/src/commands.ts, tools/specfold/test/doctor.test.ts]
depends: [1]
scenarios: [specfold-doctor#only-warnings, specfold-doctor#a-failure, specfold-doctor#json-result]
agent: implementer
```

- [ ] 2.1 Add the `doctor` command with the real environment, exit codes, human and JSON output
  - Done when: the three scenarios of this group pass in `doctor.test.ts`

## 3. Knowledge

```yaml
files: [knowledge/**]
depends: [2]
scenarios: []
agent: knowledge-curator
```

- [ ] 3.1 Create the capability card with `specfold new`, update the CLI architecture concept and add the log entry
  - Done when: `node scripts/specfold.mjs validate` and `node scripts/specfold.mjs index --check` exit 0

## Workflow follow-up

- Rebuild `scripts/specfold.mjs` before group 3, archive the change in this PR, then point the capability card at the archived spec.
