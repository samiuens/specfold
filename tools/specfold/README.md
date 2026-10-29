# specfold CLI source

TypeScript source (`src/`), tests (`test/`) and fixtures for the `specfold` CLI. `npm run build -w specfold` bundles it into `scripts/specfold.mjs`, which is committed and copied to `template/scripts/`. Each command lives in `src/<command>/` and registers itself through `src/commands.ts`.

Kit-only tools next to the source:

- `release.mjs`: checks release versions, packs the template tarball, prints upgrade notes and indexes a mirror;
- `upgrade-fixtures.mjs`: upgrades repositories built from the previous releases to this build (CI job `upgrade-fixtures`);
- `docs.mjs`: writes `docs/commands.md` from the CLI's help, or checks it with `--check`.

Checks: `npm run check -w specfold` (biome and tsc) and `npm test -w specfold` (vitest).
