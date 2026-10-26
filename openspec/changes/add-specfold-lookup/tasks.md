# Tasks

## 1. Search

```yaml
files: [tools/specfold/src/lookup/search.ts, tools/specfold/test/lookup-search.test.ts]
depends: []
scenarios: [specfold-lookup#all-words-must-match, specfold-lookup#prefix-match, specfold-lookup#body-ignored, specfold-lookup#title-beats-description, specfold-lookup#ties-by-path, specfold-lookup#only-decisions, specfold-lookup#stale-and-unverified]
agent: implementer
```

- [x] 1.1 Add matching, weighted ranking, the type filter and trust flags over a bundle's concepts
  - Done when: the seven scenarios of this group pass in `lookup-search.test.ts`

## 2. Lookup command

```yaml
files: [tools/specfold/src/lookup/command.ts, tools/specfold/src/commands.ts, tools/specfold/test/lookup.test.ts]
depends: [1]
scenarios: [specfold-lookup#missing-query, specfold-lookup#invalid-limit, specfold-lookup#limit-applied, specfold-lookup#one-line-per-hit, specfold-lookup#no-hits, specfold-lookup#machine-readable-hits]
agent: implementer
```

- [x] 2.1 Add the `lookup` command with argument checks, limit, human and JSON output
  - Done when: the six scenarios of this group pass in `lookup.test.ts`

## 3. Knowledge

```yaml
files: [knowledge/**, AGENTS.md]
depends: [2]
scenarios: []
agent: knowledge-curator
```

- [x] 3.1 Create the capability card with `specfold new`, update the CLI architecture concept and `AGENTS.md` lookup order, and add the log entry
  - Done when: `node scripts/specfold.mjs validate` and `node scripts/specfold.mjs index --check` exit 0

## Workflow follow-up

- Rebuild `scripts/specfold.mjs` before group 3, archive the change in this PR, then point the capability card at the archived spec.
