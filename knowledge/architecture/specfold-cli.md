---
type: Component
title: specfold CLI
description: How the specfold CLI is structured, built and shipped as one bundled file.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T11:35:58+01:00 }
sources:
  - id: source
    resource: ../../tools/specfold/src/cli.ts
  - id: build
    resource: ../../tools/specfold/build.mjs
---

# Shape

The CLI lives in the npm workspace `tools/specfold` (package `specfold`, bins `specfold` and `sf`). esbuild bundles it, with its single runtime dependency `yaml`, into the committed file `scripts/specfold.mjs`; repos run it with `node scripts/specfold.mjs` and need no install. CI rebuilds the bundle and fails when the committed file is stale.

| Module | Role |
| --- | --- |
| `src/bin.ts` | entry point of the bundle: wires `process` to `main` |
| `src/cli.ts` | argument parsing with `node:util` `parseArgs`, command registry, exit codes 0/1/2 |
| `src/commands.ts` | imports every command module; the entry point and the tests load the same list |
| `src/errors.ts` | `UsageError` and `EnvError`, both mapped to exit code 2 |
| `src/repo.ts` | finds the repository root (nearest `specfold.yaml`) and loads the config |
| `src/findings.ts` | the `Finding` shape, ordering, human and JSON rendering |
| `src/bundle.ts` | walks a bundle and splits frontmatter from the body with line numbers |
| `src/glob.ts` | dependency-free glob matching (`**` also matches zero folders) and the repository file walk |
| `src/validate/` | the `validate` command and its rule sets (OKF, profile, links) |
| `src/indexes/` | the `index` command: index generation, `see knowledge:` scan, write and check modes |
| `src/log/` | the `log add` command and the insertion of entries into date sections |

# How commands work

A command module calls `register()` with its name, options and a `run` function, and `src/commands.ts` imports it. Rules are plain functions over one parsed file (or over the whole bundle tree) that return findings and never throw. Usage and environment problems are thrown as errors and turned into exit code 2 in one place.

# Build notes

Under Node, `yaml` resolves to its CommonJS build, so the bundle banner provides `require` through `createRequire`. Timestamps are parsed with the YAML core schema, so they stay strings and the offset check sees the original text.

# Related

- [specfold validate](/capabilities/specfold-validate.md)
- [specfold index](/capabilities/specfold-index.md)
- [specfold log](/capabilities/specfold-log.md)
- [Deterministic CLI](/decisions/deterministic-cli.md)
- [TypeScript style](/conventions/typescript-style.md)
