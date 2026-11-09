# Proposal

## Why

Some repositories want Specfold's knowledge side without OpenSpec: an infrastructure monorepo such as iac keeps a rich OKF bundle but has no behavior to pin down in specs, and today Specfold installs `openspec/`, requires the openspec CLI and blocks every source change that lacks an OpenSpec change (G4). A `knowledge` profile lets such a repository adopt Specfold now, and move to the full workflow later. It relies on `/vision/specfold.md`, `/decisions/specs-vs-knowledge.md`, `/decisions/upgrade-file-classes.md`, `/decisions/managed-blocks.md`, `/decisions/blocking-merge-gate.md` and `/decisions/versioning.md`. No rejected decision covers this idea; the only rejected one, `/decisions/permission-rules-tracked-in-manifest.md`, is unrelated.

## What Changes

- New `profile` key in `specfold.yaml` (`full` by default, or `knowledge`), validated by every command that reads the settings and by doctor.
- The knowledge profile's file set: no `openspec/`, no OpenSpec skills, no sf-plan, sf-apply or sf-sync, and of the Claude Code subagents only `scout`. `AGENTS.md`, `CLAUDE.md` and the pull request template get knowledge-profile variants of their managed blocks.
- `specfold init --profile <name>` and `specfold migrate install --profile <name>` install that file set; init in a fresh template repository removes the OpenSpec parts the template brought.
- `specfold upgrade` keeps the profile's file set and reinstalls the release when `profile` changes from `knowledge` to `full`; the manifest records the profile.
- Doctor skips the openspec CLI check (D3) for the knowledge profile.
- The gate skips its OpenSpec rules for the knowledge profile and adds rule `G19`: a diff touching `source_globs` must also change a file under `knowledge/`, or carry the escape label with a `No-knowledge reason:` line.
- sf-interview gets a knowledge-profile path that asks the open decisions without writing `brief.md`.
- Switching a `full` repository to `knowledge` is refused, not supported.

## Capabilities

### New Capabilities
- `specfold-profile`: the `profile` setting, its values and default, and the file set and managed-block variants each profile installs.

### Modified Capabilities
- `specfold-init`: `--profile`, the knowledge file set, and no `openspec init` or `openspec/config.yaml` requirement for the knowledge profile.
- `specfold-migrate`: `migrate install --profile`, installing the profile's file set without setting up `openspec/`.
- `specfold-upgrade`: profile-aware file set, the profile recorded in the manifest, reinstall on `knowledge` to `full`, refusal on `full` to `knowledge`.
- `specfold-doctor`: D2 checks the `profile` value; D3 is `ok` and skipped for the knowledge profile.
- `specfold-gate`: OpenSpec rules skipped for the knowledge profile; new rule `G19`.

## Impact

- Code: `tools/specfold/src/repo.ts` (config), `migrate/install.ts` (`kitOwned`, blocks), `init/`, `upgrade/`, `doctor/checks.ts`, `gate/rules.ts`; the bundle `scripts/specfold.mjs` and `template/scripts/specfold.mjs` are rebuilt.
- Template: `template/specfold.yaml` documents `profile`; knowledge-profile block variants for `AGENTS.md`, `CLAUDE.md` and `.github/pull_request_template.md`; `sf-interview` skill text.
- Tests and fixtures under `tools/specfold/test/` for each modified command.
- No dependency changes; existing repositories without `profile` keep behaving as `full`.
