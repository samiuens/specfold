# Tasks

## 1. Inventory of an existing bundle

```yaml
files: [tools/specfold/src/migrate/inventory.ts, tools/specfold/src/migrate/types.ts, tools/specfold/test/migrate-inventory.test.ts, tools/specfold/test/fixtures/migrate/okf-bundle/**]
depends: []
scenarios: [specfold-migrate#concepts-by-type, specfold-migrate#decisions-folder-in-a-bundle, specfold-migrate#type-without-an-equivalent, specfold-migrate#hand-written-index]
agent: implementer
```

- [x] 1.1 Add a fixture repository `migrate/okf-bundle` with an OKF bundle in `knowledge/`: ADR, App, Playbook, Domain Concept, Architecture and Reference concepts, a `decisions/` concept, hand-written `index.md` files with intro text, and a `log.md`
  - Done when: `node scripts/specfold.mjs validate --okf-only --bundle tools/specfold/test/fixtures/migrate/okf-bundle/knowledge` exits 0
- [x] 1.2 Add `types.ts` with the built-in Specfold type list and the suggestion map (ADR, Playbook, Domain Concept, App)
  - Done when: a test in `migrate-inventory.test.ts` checks that the built-in list equals the `types` of `template/specfold.yaml`
- [x] 1.3 Classify Markdown under `knowledge/` by frontmatter as `okf-concept` (with `type` and suggested type) or `okf-index`, before the path rules
  - Done when: `npx vitest run test/migrate-inventory.test.ts` covers specfold-migrate#concepts-by-type, specfold-migrate#decisions-folder-in-a-bundle, specfold-migrate#type-without-an-equivalent and specfold-migrate#hand-written-index

## 2. Install with an existing bundle

```yaml
files: [tools/specfold/src/migrate/install.ts, tools/specfold/test/migrate-bundle.test.ts]
depends: [1]
scenarios: [specfold-migrate#bundle-types-and-folders, specfold-migrate#no-bundle]
agent: implementer
```

- [x] 2.1 Append the bundle's extra types and top-level folders (without descriptions) to a `specfold.yaml` that install creates, by line edits that keep the template's comments
  - Done when: `npx vitest run test/migrate-bundle.test.ts` covers specfold-migrate#bundle-types-and-folders and specfold-migrate#no-bundle on the `okf-bundle` fixture

## 3. Hook relief during a migration

```yaml
files: [tools/specfold/src/migrate/relief.ts, tools/specfold/src/hooks/run.ts, tools/specfold/src/hooks/claude.ts, tools/specfold/test/hooks-relief.test.ts]
depends: []
scenarios: [specfold-hooks#convert-marked, specfold-hooks#link-to-a-concept-not-written-yet, specfold-hooks#new-concept-still-strict, specfold-hooks#conversion-done, specfold-hooks#half-converted-bundle, specfold-hooks#gate-unchanged]
agent: implementer
```

- [x] 3.1 Add `relief.ts`: whether a conversion is under way, and whether a bundle file is an unchanged original at the state's base commit
  - Done when: `npx vitest run test/hooks-relief.test.ts` covers specfold-hooks#convert-marked
- [ ] 3.2 Make pre-commit and claude-post-tool-use print link findings and findings in unchanged originals as warnings during a conversion
  - Done when: the hooks-relief tests cover specfold-hooks#link-to-a-concept-not-written-yet, specfold-hooks#new-concept-still-strict and specfold-hooks#conversion-done
- [ ] 3.3 Make claude-stop leave G1 and G10 link and original findings out of its blocking set during a conversion, still printing them
  - Done when: the hooks-relief tests cover specfold-hooks#half-converted-bundle and specfold-hooks#gate-unchanged, and `npx vitest run test/hooks-run.test.ts test/hooks-claude.test.ts` still passes

## 4. sf-migrate existing-bundle path

```yaml
files: [template/.agents/skills/sf-migrate/**, .agents/skills/sf-migrate/**, template/.specfold/manifest.json]
depends: []
scenarios: []
agent: implementer
```

- [ ] 4.1 Add the existing-bundle branch to sf-migrate's SKILL.md: when the inventory lists `okf-concept` sources, follow the plan and conversion rules for an existing bundle, and mark convert only after originals are gone and references rewritten
  - Done when: `node scripts/check-skills.mjs .agents/skills template/.agents/skills` reports 0 problems and `node scripts/specfold.mjs stats` keeps sf-migrate's description within budget
- [ ] 4.2 Extend `references/plan.md`: every `specfold.yaml` type in **Becomes**, a type-map table with the default map, tooling and rule-file rows, team AGENTS.md rule rows, an "After conversion" section and a commitments checkpoint
  - Done when: the plan template shows each of these with one example row, and `diff -r template/.agents/skills/sf-migrate .agents/skills/sf-migrate` is empty
- [ ] 4.3 Extend `references/conversion.md` with the rewrite rules: new concepts in Specfold's folders with full rationale and permalink `sources`, originals removed, links and outside references rewritten, indexes regenerated with intro text moved, AGENTS.md rules sorted, unused types and folders removed
  - Done when: each rule names the command or check that confirms it, and the kit copy is identical
- [ ] 4.4 Extend `references/report.md` with "Deviations" and "References rewritten", and refresh the template manifest
  - Done when: `npx vitest run test/template-manifest.test.ts` passes after `npx vitest -u` on it, and the kit copy is identical

## 5. Bundle and docs

```yaml
files: [scripts/specfold.mjs, template/scripts/specfold.mjs, template/.specfold/manifest.json, docs/commands.md]
depends: [1, 2, 3, 4]
scenarios: []
agent: implementer
```

- [ ] 5.1 Rebuild the bundle into both copies, refresh the template manifest and regenerate the command reference
  - Done when: `npm run build -w specfold` leaves both copies identical, `node tools/specfold/docs.mjs --check` passes, and `npm test` and `npm run check` in `tools/specfold` pass
- [ ] 5.2 Run every step of `.github/workflows/cli.yml` locally, each in its working directory
  - Done when: every step exits 0

## 6. Knowledge

```yaml
files: [knowledge/**]
depends: [5]
scenarios: []
agent: knowledge-curator
```

- [ ] 6.1 Write the concepts listed in knowledge.md, and set the commitment to `state: fulfilled`
  - Done when: `node scripts/specfold.mjs validate` exits 0 and `node scripts/specfold.mjs change check add-okf-bundle-migration` reports no K-rule errors
- [ ] 6.2 Regenerate the indexes and add one log entry
  - Done when: `node scripts/specfold.mjs index --check` exits 0

## Workflow follow-up

- Archive the change, then run `specfold sync add-okf-bundle-migration`, repoint concept sources that cite the active change path to the archive, and commit the result in the same PR.
- Migrate `~/Development/iac` with `--profile knowledge` as the first real run of this path.
