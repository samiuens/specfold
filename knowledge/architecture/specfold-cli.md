---
type: Component
title: specfold CLI
description: How the specfold CLI is structured, built and shipped as one bundled file.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T17:11:42+01:00 }
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
| `src/change/` | the `change check` command: brief rules B0 to B4, knowledge rules K0 to K6 (reused by `sync` on archived changes), combined with the tasks findings |
| `src/agents/` | the `agents sync` command: relative symlinks from `.agents/skills/` into each `agents.targets` folder, keeping real folders and foreign links |
| `src/audit/` | the `audit` command: rules A1 to A8 over the parsed bundle, the main specs, code references and the root agent instruction files |
| `src/backlog/` | the `backlog` command: add (with index regeneration), list, promote through `openspec new change`, drop |
| `src/commitments/` | the `commitments` command: list by due date, fulfill, and withdraw behind the `verify` agent guard |
| `src/future/` | backlog items and commitments: their folders and types, lookup by name or path, due dates from triggers, key edits; shared by the commands, audit, lookup and the session-start hook |
| `src/bundle.ts` | walks a bundle and splits frontmatter from the body with line numbers |
| `src/gate/` | the `gate` command: the diff against a merge base (touched and archived changes), rules G1-G10, G12-G16 and G18 over existing rule functions, `openspec validate`, the human claims a branch adds and the PR author and approvers from the GitHub REST API (G7), ordering and counts |
| `src/git.ts` | runs git; failures become environment errors |
| `src/openspec.ts` | finds the OpenSpec binary: `node_modules/.bin/openspec`, then the PATH |
| `src/doctor/` | the `doctor` command: checks D1 to D6 over an injected environment, version ranges |
| `src/drift/` | the `drift` command: dependent paths per concept (resources, sources, `see knowledge:` code), baselines and triggering commits from `git log`; shared by lookup's `drift` flag and gate rule G16 |
| `src/glob.ts` | dependency-free glob matching (`**` also matches zero folders) and the repository file walk |
| `src/trace/` | the `trace` command: scenario ids from main and delta specs (sections, removed requirements), the `spec:` reference scan over `trace.test_globs`, and the report gate rule G15 shares |
| `src/verify/` | the `verify` command: agent guard, login from `gh` or `.specfold/local.yaml`, path checks, line-level `verified` entries |
| `src/validate/` | the `validate` command and its rule sets (OKF, profile including P12-P14 for backlog items, commitments and visions, links) |
| `src/hooks/` | the `hooks install` and `hook` commands: built-in hooks or hook-manager entries (lefthook, husky, pre-commit), the pre-commit, pre-push and graph checks, `hooks.extra`, and the Claude Code session, edit and stop hooks |
| `src/indexes/` | the `index` command: index generation, `see knowledge:` scan, write and check modes |
| `src/log/` | the `log add` command and the insertion of entries into date sections |
| `src/lookup/` | the `lookup` command: frontmatter search, weighted ranking, trust flags including `drift` |
| `src/new/` | the `new` command: per-type templates, override files, frontmatter rendering |
| `src/sync/` | the `sync` command: resolves archived changes, plans (`planSync`, also used by the gate) and applies delta ops, edits frontmatter line by line, then indexes and log |
| `src/tasks/` | the `tasks check`, `status` and `resume` commands: the `tasks.md` parser, rules T0 to T11, file overlap between parallel groups, task commits from git trailers, group progress |

# How commands work

A command module calls `register()` with its name, options and a `run` function, and `src/commands.ts` imports it. Rules are plain functions over one parsed file (or over the whole bundle tree) that return findings and never throw. Usage and environment problems are thrown as errors and turned into exit code 2 in one place.

# Build notes

Under Node, `yaml` resolves to its CommonJS build, so the bundle banner provides `require` through `createRequire`. Timestamps are parsed with the YAML core schema, so they stay strings and the offset check sees the original text.

# Related

- [specfold validate](/capabilities/specfold-validate.md)
- [specfold verify](/capabilities/specfold-verify.md)
- [specfold trace](/capabilities/specfold-trace.md)
- [specfold drift](/capabilities/specfold-drift.md)
- [specfold backlog](/capabilities/specfold-backlog.md)
- [specfold commitments](/capabilities/specfold-commitments.md)
- [specfold agents sync](/capabilities/specfold-agents-sync.md)
- [specfold audit](/capabilities/specfold-audit.md)
- [specfold change check](/capabilities/specfold-change-check.md)
- [specfold doctor](/capabilities/specfold-doctor.md)
- [specfold gate](/capabilities/specfold-gate.md)
- [specfold hooks](/capabilities/specfold-hooks.md)
- [specfold index](/capabilities/specfold-index.md)
- [specfold log](/capabilities/specfold-log.md)
- [specfold lookup](/capabilities/specfold-lookup.md)
- [specfold new](/capabilities/specfold-new.md)
- [specfold tasks](/capabilities/specfold-tasks.md)
- [specfold sync](/capabilities/specfold-sync.md)
- [Deterministic CLI](/decisions/deterministic-cli.md)
- [TypeScript style](/conventions/typescript-style.md)
