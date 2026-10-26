# Tasks

## 1. Design template and rule

```yaml
files: [template/openspec/schemas/specfold/**, template/openspec/config.yaml, openspec/schemas/specfold/**, openspec/config.yaml, examples/sample-app/openspec/schemas/specfold/**, tools/specfold/test/schema.test.ts, tools/specfold/test/schema-config.test.ts]
depends: []
scenarios: [specfold-schema#design-rendered-for-a-change, specfold-schema#design-rule-shown, specfold-schema#config-loads-cleanly]
agent: implementer
```

- [x] 1.1 End the design template with a Commitments section and explain it in the instruction
  - Done when: scenario design-rendered-for-a-change passes in `schema.test.ts` and the kit and sample copies equal the template
- [x] 1.2 Add the design rule to the shipped and the kit's config
  - Done when: scenarios design-rule-shown and config-loads-cleanly pass in `schema-config.test.ts`

## 2. G7 for committed_by

```yaml
files: [tools/specfold/src/gate/claims.ts, tools/specfold/test/gate-claims.test.ts]
depends: []
scenarios: [specfold-gate#commitment-claimed-for-someone-else]
agent: implementer
```

- [x] 2.1 Count an added `committed_by: human:<login>` as a claim
  - Done when: scenario commitment-claimed-for-someone-else passes in `gate-claims.test.ts`

## 3. Gate rule G17

```yaml
files: [tools/specfold/src/gate/rules.ts, tools/specfold/test/gate-rules.test.ts]
depends: [2]
scenarios: [specfold-gate#blocked-commitment, specfold-gate#section-missing, specfold-gate#all-kept, specfold-gate#withdrawn-by-hand, specfold-gate#withdrawn-with-the-command]
agent: implementer
```

- [x] 3.1 Warn about designs that block, misname or skip open commitments
  - Done when: scenarios blocked-commitment, section-missing and all-kept pass in `gate-rules.test.ts`
- [x] 3.2 Block a withdrawal without a human verification
  - Done when: scenarios withdrawn-by-hand and withdrawn-with-the-command pass in `gate-rules.test.ts`

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
depends: [1, 4]
scenarios: []
agent: knowledge-curator
```

- [ ] 5.1 Write the concepts listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-commitment-gate` and commit its result in the same PR.
