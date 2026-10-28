# Proposal

## Why

Every upgrade path in `docs/plan.md` ("Updating the framework from user repos") starts from a release: a version to compare against, a tarball to download and a checksum to trust. The kit has none yet. It sits at `0.0.0`, and `BOOTSTRAP.md` installs a pinned commit that needs a follow-up PR whenever it moves. Releases have to exist before the upgrader can be tested from a real earlier build.

## What Changes

- **release-please** in the kit repository (`release-please-config.json`, `.release-please-manifest.json`, workflow `release.yml`):
  - release PR title `chore(release): 🔖 v${version}`;
  - changelog sections by commit type;
  - pre-1.0 policy: breaking changes bump the minor version;
  - prereleases as `-rc.N` until v0.1.0;
  - extra-files bump `tools/specfold/package.json`, `kit_version` in `template/specfold.yaml` and the template manifest.
- **`node tools/specfold/release.mjs`** (kit only):
  - `check` verifies that the three version fields agree;
  - `pack <version>` writes `specfold-template-v<version>.tar.gz` (the template, plus `upgrade/`) and its `.sha256`;
  - `notes <version>` prints the "Upgrade notes" section from `upgrade/notes/<version>.md`.
- **Release job:** when release-please creates a release, CI packs it, uploads both files and appends the upgrade notes to the release body.
- **`upgrade/`** at the kit root with `notes/` and `migrations/`, empty but for a README.
- **`BOOTSTRAP.md`** fetches the latest release on the `next` channel (`stable` from v0.1.0 on) with `gh release download` and checks the SHA-256. `KIT_REF` and the pin check in CI go away.
- **Commit convention:** release-please's commits pass `check-commit.mjs`.
- **First release:** `v0.1.0-rc.1`, cut by merging the first release PR after this change.

## Capabilities

### New Capabilities
- `specfold-release`: the pack, notes and version check of a kit release.

### Modified Capabilities
- none

## Out of scope

- The upgrader, migrations, the weekly workflow; npm publishing.

## Open points

1. **The commit release-please writes:** its title pattern sets the release PR title; the design checks that the merge commit it produces passes the commit-convention check, and adds an exception there if needed.
2. **The token:** release-please runs with the workflow's `GITHUB_TOKEN`. Workflows don't run on PRs that `GITHUB_TOKEN` opens, so the required checks on the release PR need a second trigger or a PAT; the design picks one.

## Impact

- New: `release-please-config.json`, `.release-please-manifest.json`, `.github/workflows/release.yml`, `tools/specfold/release.mjs` and its tests, `upgrade/`.
- Changed: `BOOTSTRAP.md`, `.github/workflows/cli.yml` (the pin check is removed), `scripts/check-commit.mjs` if needed.
- Knowledge: the release flow in the CLI architecture, the bootstrap runbook, a versioning decision.
