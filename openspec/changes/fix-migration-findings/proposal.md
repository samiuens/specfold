# Proposal

## Why

The first real migration (Atrium, a pnpm monorepo, on v0.2.1) found ten bugs in doctor, hooks, index, log, new and migrate. None of them is fixed in v0.3.0. Each one cost the migration a workaround: a doctor warning that can't be satisfied, a gate that blocks after the skill's own last step, dropped code references, missed apps, a committed state file, a duplicate import, uneven `specfold new` output, a reformatted `lefthook.yml`, and a Stop hook that repeated 30 KB of findings every turn.

## What Changes

- **doctor:** D4 also recognises `specfold.mjs hook` in a hook manager's config. Before a `specfold.yaml` exists, D3 also checks `node_modules/.bin/openspec` in the current directory.
- **hooks:** `hooks install` keeps the text of every other value in `lefthook.yml` and `.pre-commit-config.yaml` (flow lists, block scalars, long lines). The Claude Stop hook still blocks, but above 20 blocking findings it prints counts per rule and the first 10 findings instead of all of them.
- **index:** a `see knowledge:` pointer may list several comma-separated paths, and every path is indexed.
- **log:** when `log add` creates `log.md`, it also rewrites the root index so the Log entry is listed.
- **new:** every type gets `sources: []`.
- **migrate / init:** source globs are detected from package.json `workspaces` and `pnpm-workspace.yaml`, and the fixed folder list gains `apps`. `migrate start` writes `.specfold/migration/.gitignore` so `state.json` is never committed. The CLAUDE.md managed block omits its `@AGENTS.md` import when the file already imports AGENTS.md outside the block.
- **Payload docs (no spec):** sf-migrate step 8 runs `log add` before `index`. sf-capture's `types.md` lists each type's default keys. The shipped code-comment convention allows a list of paths.

## Capabilities

### New Capabilities

### Modified Capabilities
- `specfold-doctor`: D3 finds a local OpenSpec without a repository root; D4 accepts `specfold.mjs hook`.
- `specfold-hooks`: hook manager files keep all other text; the Claude stop hook summarises long output.
- `specfold-index`: code references with several paths.
- `specfold-log`: creating the log refreshes the root index.
- `specfold-new`: `sources: []` for every type.
- `specfold-migrate`: state ignored from `start` on; the managed CLAUDE.md block without a duplicate import; workspace source globs at install.
- `specfold-init`: workspace source globs in detection.

## Impact

- Code: `tools/specfold/src/doctor/checks.ts`, `openspec.ts`, `hooks/install.ts`, `hooks/claude.ts`, `indexes/refs.ts`, `log/`, `new/command.ts`, `migrate/detect.ts`, `migrate/state.ts` or `repo.ts`, `migrate/blocks.ts` / `install.ts`, plus tests and fixtures. The bundle `scripts/specfold.mjs` is rebuilt.
- Payload: `template/.agents/skills/sf-migrate/SKILL.md`, `template/.agents/skills/sf-capture/references/types.md`, `template/knowledge/conventions/code-comments.md`.
- No breaking change: the new output and files are additive, and existing single-path pointers index as before.
