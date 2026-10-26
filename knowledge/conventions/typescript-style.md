---
type: Convention
title: TypeScript style
description: "How the kit writes TypeScript for the CLI: strict compiler flags, Biome, small pure modules and errors as values."
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T11:30:00+01:00 }
sources:
  - id: tsconfig
    resource: ../../tools/specfold/tsconfig.json
  - id: biome
    resource: ../../tools/specfold/biome.json
---

# Tooling

- TypeScript with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and `verbatimModuleSyntax`; `tsc --noEmit` type-checks, esbuild only strips types.
- Biome with its recommended rules does lint and format; `npm run check -w specfold` runs both, and `biome check --write` fixes formatting.
- Imports use explicit `.ts` extensions; Node built-ins use the `node:` prefix.

# Code

- One runtime dependency (`yaml`). Anything else is written in the CLI or comes from Node itself (for example `node:util` `parseArgs`).
- Commands register themselves and are listed in `src/commands.ts`.
- Rules are pure functions that return findings and never throw; only usage and environment problems throw, as `UsageError` or `EnvError`.
- Output is deterministic: sorted by code unit, no timestamps, no locale-dependent formatting.
- Comments follow [code comments point to knowledge](/decisions/code-comments-point-to-knowledge.md): one line on a non-obvious mechanism, rationale behind `see knowledge:`.

# Related

- [specfold CLI](/architecture/specfold-cli.md)
- [Test fixtures](/conventions/test-fixtures.md)
