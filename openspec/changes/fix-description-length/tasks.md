# Tasks

## 1. Length check

```yaml
files: [tools/specfold/src/new/command.ts, tools/specfold/src/backlog/command.ts, tools/specfold/test/new.test.ts, tools/specfold/test/backlog.test.ts]
depends: []
scenarios: [specfold-new#description-too-long, specfold-new#description-at-the-limit, specfold-backlog#long-description, specfold-backlog#long-title-without-a-description, specfold-backlog#long-title-with-a-short-description]
agent: implementer
```

- [x] 1.1 Refuse a description over 160 characters in `specfold new`
  - Done when: a 161-character description exits with 2 and writes nothing, a 160-character one passes validate, and `npx vitest run test/new.test.ts` passes
- [x] 1.2 Apply the limit in `backlog add`, title fallback included
  - Done when: a long `--description` or a long title without one exits with 2, the title case suggests `--description`, a long title with a short description works, and `npx vitest run test/backlog.test.ts` passes

## 2. Bundle

```yaml
files: [scripts/specfold.mjs, template/scripts/specfold.mjs, template/.specfold/manifest.json]
depends: [1]
scenarios: []
agent: implementer
```

- [x] 2.1 Rebuild the bundle, copy it to the template and update the manifest
  - Done when: `npm run build -w specfold` leaves no diff, the template copy matches, and the template manifest test passes

## 3. Knowledge

```yaml
files: [knowledge/**]
depends: [1, 2]
scenarios: []
agent: knowledge-curator
```

- [ ] 3.1 Write the concept updates listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` and `index --check` exit 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync fix-description-length` and commit its result in the same PR.
