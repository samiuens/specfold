---
name: sf-sync
description: After an OpenSpec change is archived, apply its knowledge delta with specfold sync, fill in any stub concepts, and check the bundle. Run it in the same PR as the archive.
---

# sf-sync

Use this right after `/opsx:archive` (or `openspec archive <change>`), as the change's `## Workflow follow-up` step. The change's Knowledge task group has already written the concept bodies; sync adds what only exists after archive.

## Steps

1. Preview: `node scripts/specfold.mjs sync <change> --dry-run`. If it reports knowledge-rule errors (K0-K6), fix the archived `knowledge.md` first.
2. Apply: `SPECFOLD_MODEL=<your model id> node scripts/specfold.mjs sync <change>`. It:
   - creates stubs for concepts still missing;
   - sets `status: deprecated`;
   - links capability cards to the archived spec and change, and new decisions to the change;
   - regenerates the indexes and adds the log entry.
3. For every `create stub` it reported, write the body under the template's headings, as `sf-capture` describes. A Decision stub also needs its `sources`.
4. Run `node scripts/specfold.mjs validate` and fix every error, then `node scripts/specfold.mjs sync <change> --dry-run` again; it should report nothing to change.
5. Commit the result with the archive, in the same PR.

## Rules

- Sync never invents content: summaries become descriptions, and everything else is yours to write.
- Never edit `index.md` or `log.md` by hand; sync and `specfold index` write them.
- If a concept that sync should touch was renamed by hand, fix the path in the archived `knowledge.md` rather than working around it.
