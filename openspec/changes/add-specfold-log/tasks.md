# Tasks

## 1. Log command

```yaml
files: [tools/specfold/src/log/insert.ts, tools/specfold/src/log/command.ts, tools/specfold/src/commands.ts, tools/specfold/test/log.test.ts]
depends: []
scenarios: [specfold-log#missing-message, specfold-log#invalid-date, specfold-log#default-kind, specfold-log#existing-heading, specfold-log#new-newest-date, specfold-log#back-dated-entry, specfold-log#first-entry, specfold-log#still-conformant]
agent: implementer
```

- [x] 1.1 Add the insertion of an entry into log text: existing date section, new section in date order, new file
  - Done when: `log.test.ts` unit tests cover all three cases and leave other lines unchanged
- [x] 1.2 Add the `log add` command with argument checks and the entry format
  - Done when: scenarios missing-message, invalid-date, default-kind, existing-heading, new-newest-date, back-dated-entry, first-entry and still-conformant pass

## 2. Dogfooding

```yaml
files: [scripts/specfold.mjs, AGENTS.md, knowledge/log.md]
depends: [1]
scenarios: []
agent: implementer
```

- [ ] 2.1 Rebuild the bundle and tell agents in `AGENTS.md` to use `specfold log add`
  - Done when: `node scripts/specfold.mjs log add --help` prints the usage and the `cli` workflow passes

## 3. Knowledge

```yaml
files: [knowledge/**]
depends: [2]
scenarios: []
agent: knowledge-curator
```

- [ ] 3.1 Add the capability card for `specfold-log`, update the CLI architecture concept, and write the log entry with `specfold log add`
  - Done when: `node scripts/specfold.mjs validate` and `node scripts/specfold.mjs index --check` exit 0

## Workflow follow-up

- Archive the change in this PR, then point the capability card at the archived spec.
