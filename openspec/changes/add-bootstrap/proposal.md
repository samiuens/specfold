# Proposal

## Why

The kit has two entry points (`/decisions/delivery-template-bootstrap-migrate.md`), and neither works yet. A repo created from the template still has placeholders (`Stack: <filled by specfold init or sf-migrate>`, `source_globs: ["src/**"]`), no OpenSpec skills and no hooks. A repo without the kit has no way to get `sf-migrate` in the first place. `specfold init` finishes the template path with detected values. `BOOTSTRAP.md` is the single prompt that fetches a pinned kit snapshot through the user's `gh` login, which works while the kit repo is private, and starts the migration.

## What Changes

- **`specfold init [--stack <text>] [--source-glob <glob>]... [--tools <list>] [--dry-run] [--json]`** for a repository holding the template files:
  - detects the stack from package files and the source globs from the folders present; flags override;
  - fills the `Stack:` line of the config context and `source_globs` in `specfold.yaml`;
  - runs `openspec init --tools <tools>` (default `agents,claude`) and keeps the template's `config.yaml`;
  - runs `specfold agents sync` and `specfold hooks install`;
  - writes `.specfold/manifest.json` like `migrate install`;
  - prints what it filled; `--dry-run` prints it and writes nothing; no prompts.
- **`BOOTSTRAP.md`** at the kit root: one paste-able prompt for any agent.
  1. Fetch the tarball of `samiuens/specfold` at a pinned full commit sha with `gh api`, into a new temporary folder, and run nothing from it yet.
  2. Copy `template/.agents/skills/sf-migrate/` into the repo (and link it for Claude Code).
  3. Follow its `SKILL.md` from step 1, with the snapshot's `template/` as the install source.
  4. Stop at the plan checkpoint.
  - Empty repo: copy the template files instead and run `node scripts/specfold.mjs init`.
- **CI:** checks that the sha `BOOTSTRAP.md` pins is a commit on `main` whose `template/` holds `sf-migrate`.
- **Kit docs:** the template README and the runbook name both entry points.

## Capabilities

### New Capabilities
- `specfold-init`: the init command.

### Modified Capabilities
- none

## Out of scope

- Release assets, the template repo sync, the version stamp in `BOOTSTRAP.md` and the upgrade workflow (M9).
- The parallel subagent limit question (M8).

## Open points

1. **Owner/repo:** the brief listed it among detected values, but no setting uses the repository's own owner/repo yet (`source.github` names the kit). So init detects only the stack and the source globs, unless you want owner/repo used for the `CODEOWNERS` placeholder.
2. **Stack detection:** one name per ecosystem found at the root (`package.json` → Node.js, plus TypeScript with `tsconfig.json`; `pyproject.toml` → Python; `go.mod` → Go; `Cargo.toml` → Rust; and so on), joined with commas; none found leaves the placeholder and says so.
3. **Source glob detection:** `src/**`, `lib/**`, `app/**`, `packages/*/src/**` when those folders exist; none found keeps `src/**` and says so.
4. **Rerun:** a filled `Stack:` line or changed `source_globs` stay unless a flag sets them again, so init is idempotent.
5. **The pin** is updated by hand in a later commit after a change to `template/` merges; CI only rejects a sha that does not exist on `main` or lacks the skill.

## Impact

- New module `src/init/`, built on install's helpers from `add-specfold-migrate` (manifest, openspec runner, detection).
- `BOOTSTRAP.md` and a CI step in `.github/workflows/cli.yml`.
- `template/README.md`, `knowledge/runbooks/` and the capability card for init.
