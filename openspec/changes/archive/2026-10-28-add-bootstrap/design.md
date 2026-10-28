# Design

## Context

- **`migrate install`** (`src/migrate/install.ts`) already does the hard parts: kit-owned files, managed blocks, the OpenSpec config, links, hooks and the manifest. It takes a template folder (`--from`); init has none, because the repository itself holds the template's files.
- **`detect`** (`src/migrate/detect.ts`) gives stack and source globs, with `globsFallback` when no code folder exists; `fillStack` (`src/migrate/merge.ts`) fills the `Stack:` placeholder.
- **`openspec init --tools agents,claude`** keeps an existing `openspec/config.yaml` ("Config: openspec/config.yaml (exists)"), writes the six OpenSpec skills into `.agents/skills/` and `.claude/skills/` and the `/opsx` commands into `.claude/commands/` (checked 2026-10-28 with 1.15.0 on a copy of `template/`).
- **`installHooks`** is idempotent and throws `EnvError` for a foreign `core.hooksPath`; `planLinks` keeps the real folders OpenSpec writes into `.claude/skills/`.
- **The template's block files** (`AGENTS.md`, `CLAUDE.md`, `.gitignore`, `.github/pull_request_template.md`, `.github/CODEOWNERS`) carry no markers, so a repository made with "Use this template" has nothing an upgrade could rewrite.
- **`migrate start`** refuses a dirty tree, so nothing may be written into the repository before it.

## Goals / Non-Goals

**Goals:**
- init writes nothing the template did not already decide, except detected values;
- a rerun writes nothing, and `--dry-run` never writes;
- one paste-able prompt starts either path, with the kit fetched through the user's `gh` login.

**Non-Goals:** release assets, `specfold upgrade` and the template repo sync (M9); owner/repo detection (brief Q6).

## Decisions

- **Template manifest:** `template/.specfold/manifest.json` is what `migrate install` records for an empty repository with `--tools agents,claude`. A vitest test installs the template into an empty repository and compares with `toMatchFileSnapshot`, so `vitest -u` regenerates it after a template change. Init keeps its `files` hashes as the upgrade base.
- **Module `src/init/`:**
  - `init.ts`: `planInit` (values and steps, no writes) and `runInit` (applies the plan);
  - `command.ts`: the command and its output.
- **Preflight** (exit 2 before any write): the git root holds `specfold.yaml`, `openspec/config.yaml` and `.specfold/manifest.json`, else "not a Specfold template repository (missing …): copy the template files, or use sf-migrate for a repository with its own files"; OpenSpec is found when its skills are missing; `--tools` is parsed as in migrate.
- **Stack:** `--stack` replaces the `Stack:` line of the config context; else the placeholder gets the detected stack; else a filled line stays (`kept`); no ecosystem found leaves the placeholder (`not detected`).
- **Source globs:** `--source-glob` sets them; else the template value `["src/**"]` becomes the detected globs unless detection fell back; any other value stays (`kept`). The line edit is install's `projectSettings`, exported as `setSourceGlobs`.
- **`--tools agents`:** `agents.targets: []` in `specfold.yaml`, `openspec init --tools agents`, and `CLAUDE.md` gets no block and leaves the manifest; Claude Code files from the template stay untouched.
- **OpenSpec:** `openspec init --tools <tools>` runs only when `.agents/skills/openspec-propose/SKILL.md` (or, with `claude`, `.claude/skills/openspec-propose/SKILL.md`) is missing. `config.yaml` is read before and written back if the run changed it.
- **Blocks:** a block file without markers whose `sha256` equals the manifest's block hash gets the markers around its whole text (`applyBlock(undefined, text)`). A file with markers is left as is. An edited or missing file is reported as `skipped` and its block leaves the manifest.
- **Links and hooks:** `planLinks`/`applyLinks` and `installHooks` after the settings are written; an `EnvError` from hooks becomes `skipped`, and the hook manager's next step is printed as `then:`.
- **Manifest:** written with `writeIfChanged`, with the same key order as install.
- **Output:** `stack: <value> (<source>)` and `source globs: <list> (<source>)`, then one `path: action` line per change, `path: skipped: <reason>` lines, and `init: N changes` or `init: everything is up to date`. `--dry-run` prints the same lines prefixed with `would` and ends with `init: dry run, nothing written`. `--json` gives `{ ok, dry_run, values, actions, skipped, notes }`. Skipped items do not change the exit code (0).
- **`BOOTSTRAP.md`** at the kit root, plain prose plus POSIX shell:
  - the pin is one line `KIT_REF=<40 hex>`;
  - preconditions: a git repository root, `gh auth status`, Node 20 or later;
  - fetch: `gh api repos/samiuens/specfold/tarball/$KIT_REF` into a new `mktemp -d` folder, unpacked with `--strip-components=1`;
  - existing repository (any tracked file besides `README*`, `LICENSE*` and `.gitignore`): read `template/.agents/skills/sf-migrate/SKILL.md` from the snapshot and follow it from step 0 with `<kit>` = the snapshot's `template/` and `--ref $KIT_REF`; the skill is not copied first, because `migrate start` refuses a dirty tree, and install copies it;
  - empty repository: ask for stack and source globs, copy the snapshot's `template/` without overwriting (ask on each existing file), run `node scripts/specfold.mjs init` with those flags, show `git status` and ask before committing;
  - stop at the plan checkpoint and every question the skill asks; delete the temporary folder at the end.
- **Pin check** in `.github/workflows/cli.yml` (`fetch-depth: 0`): the `KIT_REF` line exists, `git merge-base --is-ancestor $KIT_REF origin/main` holds and `git cat-file -e $KIT_REF:template/.agents/skills/sf-migrate/SKILL.md` succeeds.
- **The pin in this PR** is today's `main` (it has `sf-migrate`); a follow-up PR after the merge moves it to the merged commit, which has `init`. The runbook `runbooks/move-bootstrap-pin.md` describes that step.

## Risks / Trade-offs

- [Rebase merges rewrite shas, so the pin always trails `main` by one PR] → the runbook and the CI check make the follow-up routine; M9 replaces the sha with a release tag.
- [A template edit without `vitest -u` leaves a stale template manifest] → the snapshot test fails in CI.
- [The pinned snapshot's CLI lacks `init` until the follow-up PR] → the empty-repository path of `BOOTSTRAP.md` works only after that PR; the migration path works now.

## Commitments

none
