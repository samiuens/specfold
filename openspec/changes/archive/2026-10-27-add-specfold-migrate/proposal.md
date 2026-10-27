# Proposal

## Why

A migration touches many files at once, and the parts that must be right every time are mechanical: never writing on the default branch, resuming where the last run stopped, finding the existing docs, and installing kit files without overwriting the repo's own (`/decisions/migration-on-own-branch.md`, `/decisions/deterministic-cli.md`). Doing them in the CLI gives every agent the same result and lets tests prove the M6 rules: own branch, idempotent rerun, refusal on the default branch. M9's upgrader also needs a record of what was installed, so install writes it from the first migration on.

## What Changes

- `specfold migrate start | inventory | install | mark | status`, usable before the repo has `specfold.yaml`.
- **start:** clean working tree; creates `specfold/migration` from the default branch, or resumes on it; refuses on any other branch. Default branch from `origin/HEAD`, else `main` or `master`, else `--default-branch`.
- **Writes only on `specfold/migration`:** `inventory`, `install` and `mark` refuse on every other branch.
- **State:** `.specfold/migration/state.json` records the steps done; `status` prints them and the next step; `mark <step>` records the steps the skill does (plan approval, convert, seed, report).
- **inventory:** existing knowledge sources from tracked files (README, `docs/`, ADR folders, CONTRIBUTING, wiki exports, agent rule files, other spec tools), each with kind and a token estimate; plus detected stack, package layout and CI system.
- **install --from <dir>:** copies kit files from an unpacked template folder:
  - missing kit-owned files are written, identical ones skipped, differing ones reported and never overwritten;
  - `AGENTS.md`, `CLAUDE.md`, the PR template, `.gitignore` and `CODEOWNERS` get a managed block;
  - `.claude/settings.json` gets Specfold's hooks merged into its JSON;
  - an existing `openspec/` keeps its specs, changes, context and rules and gains the `specfold` schema as default;
  - without `openspec/`, `openspec init --tools <tools>` runs and the template's `config.yaml` replaces the generated one;
  - `specfold.yaml` and the knowledge skeleton are created only where missing;
  - then `specfold agents sync` and `specfold hooks install`;
  - `.specfold/manifest.json` records every kit-owned file and managed block with its hash.
- `--tools agents,claude` by default; `--tools agents` leaves out `.claude/`.
- **Gate:** when the base has no `specfold.yaml`, G4 is skipped and the summary names the PR an adoption PR.

## Capabilities

### New Capabilities
- `specfold-migrate`: the migration command.

### Modified Capabilities
- `specfold-gate`: the adoption PR exemption from G4.

## Out of scope

- The `sf-migrate` skill, its templates and the fixture runs (`add-sf-migrate-skill`).
- `specfold init` and `BOOTSTRAP.md` (`add-bootstrap`).
- Downloading a release, upgrading (M9), worktrees (M8), `specfold stats` (M7).

## Open points

1. **Exit codes:** 0 success, 1 refused (dirty tree, wrong branch, a differing kit file), 2 usage or environment errors (no git, unknown default branch, invalid `--from` folder, missing `openspec` CLI when it is needed).
2. **Clean tree** ignores the untracked `.specfold/migration/state.json`, so a resumed `start` works before install has added it to `.gitignore`.
3. **Token estimate:** characters divided by 4, rounded up; M7's `specfold stats` may replace it.
4. **Inventory** reads only files `git ls-files` lists, so ignored and vendored files never show up.
5. **Managed block markers:** `<!-- specfold:start -->` / `<!-- specfold:end -->` in Markdown, `# specfold:start` / `# specfold:end` in `.gitignore` and `CODEOWNERS`; a file without markers gets the block at the top (Markdown) or the end (others); a rerun replaces only the block.
6. **Settings merge** adds each Specfold hook command that is not already present, by command string, and keeps everything else; invalid JSON is reported and left alone.
7. **Existing `openspec/config.yaml`:** `schema` becomes `specfold`; `context` and every rules key stay; a rules key Specfold has (`proposal`, `specs`, `design`, `knowledge`, `tasks`) is added only when missing; comments are kept.
8. **Manifest:** `manifest_version: 1`, `kit_version` from the template's `specfold.yaml`, the optional `--ref` the template came from, and a SHA-256 per kit-owned file and per managed block.
9. **`--stack` and `--source-glob`** fill the config context line and `source_globs`; without them install uses inventory's detection.

## Impact

- New module `src/migrate/` (branch, state, inventory, install, merge helpers); the gate gets the adoption check in `src/gate/`.
- Reuses `agents sync`, `hooks install` and the `openspec` runner of `backlog promote`.
- `add-bootstrap` builds `specfold init` on install's code.
