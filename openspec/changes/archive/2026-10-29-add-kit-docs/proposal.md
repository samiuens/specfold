# Proposal

## Why

Everything a new user needs to know is spread across `docs/plan.md`, the template's `AGENTS.md`, skills and `--help` output. v0.1.0 needs one place that explains Specfold from install to upgrade, and a command reference that can't drift from the CLI.

## What Changes

- **`README.md`** at the kit root: what Specfold is, install paths (bootstrap, template, sf-migrate), a five-minute quick start and links to the guides.
- **`docs/`:**
  - `getting-started.md`;
  - `workflow.md`: plan, apply, check, archive and sync, including parallel work;
  - `commands.md`: generated from the CLI's usage lines and summaries by `node tools/specfold/docs.mjs`, and checked in CI (`docs.mjs --check`);
  - `upgrading.md`: channels, sources, private repositories, tokens, the weekly workflow and conflicts;
  - `releasing.md`: release-please, upgrade notes, migrations and release candidates.
- **`docs/plan.md`** gets a first line saying it is the historical build brief and pointing to the guides.
- **Release:** `release-please-config.json` sets `release-as` to `0.1.0` and drops `prerelease`, which would mark every `0.x` release as a GitHub pre-release. After merging, release-please's PR for `0.1.0` is merged, which publishes v0.1.0 on the `stable` channel.
- **After the release,** in one follow-up PR: `release-as` is removed, `BOOTSTRAP.md` looks up releases with `--exclude-pre-releases`, and `upgrade-fixtures` becomes a required check. Changing `BOOTSTRAP.md` only after the release keeps it from looking for a stable release that doesn't exist yet.

## Capabilities

### New Capabilities
- none (`skip_specs: true`; the docs generator is kit tooling)

### Modified Capabilities
- none

## Out of scope

- A docs website, translations.

## Open points

1. **Where docs knowledge lives:** the guides are for users of the kit; the kit's own knowledge bundle links to them instead of repeating them.

## Impact

- New: `README.md`, `docs/*.md`, `tools/specfold/docs.mjs` and its CI step.
- Changed: `docs/plan.md` (first line), `.github/workflows/cli.yml`, `release-please-config.json`; after the release, `BOOTSTRAP.md`.
- Knowledge: the docs convention, the release runbook.
