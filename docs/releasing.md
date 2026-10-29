# Releasing

How the kit itself is released. This is for maintainers of `samiuens/specfold`; repositories that use Specfold only read [Upgrading](upgrading.md).

A release is the tarball `specfold-template-v<version>.tar.gz` of `template/` plus `upgrade/`, with its `.sha256`, attached to a GitHub release. Bootstrap, migrations and upgrades all install from it.

## How a release happens

Releases are cut by [release-please](https://github.com/googleapis/release-please) from the commit history. Nobody tags by hand.

1. **The release PR.** On every push to `main`, the `release` workflow runs release-please, which opens or updates the PR `chore(release): 🔖 v<version>`. It bumps `tools/specfold/package.json` and `kit_version` in `template/specfold.yaml`, and writes `CHANGELOG.md`. Only `feat`, `fix`, `perf` and `revert` commits are listed, so a docs-only merge opens no release PR.
2. **The rebuild.** The `rebuild` job runs on that PR and pushes `build(release): 📦️ rebuild the bundle for v<version>` with the rebuilt CLI bundles, the lockfile and the template manifest, so the bundled CLI reports the new version. It runs again whenever release-please rewrites the branch.
3. **The checks.** Besides the usual checks, `release.mjs check` makes sure the version fields agree, and `upgrade-fixtures` upgrades repositories built from the previous two releases to the PR's build. The PR carries the `no-spec` label and a `No-spec reason:` footer, so the gate lets the rebuilt bundle through without an OpenSpec change.
4. **Merge** the release PR by rebase once its checks pass.
5. **Publishing** is automatic. The `publish` job packs the tarball and its checksum, attaches both to the release, and adds the upgrade notes to its body.

The workflow needs the `RELEASE_PLEASE_TOKEN` secret: a fine-grained token for the kit repository with Contents and Pull requests read and write. Without it, the PR that release-please opens wouldn't trigger the checks.

## Versions

- Versions follow semver. While the major version is 0, a breaking change (`feat!:`) bumps the minor version.
- **A chosen version** goes into `release-as` in `release-please-config.json`, in the change that needs it. Remove it once that release is out, or every later release PR proposes the same version again.
- **Release candidates** (`0.1.0-rc.1`) are marked as pre-releases on GitHub. Repositories see them only on the `next` channel, and `BOOTSTRAP.md` skips them once a stable release exists.

## Upgrade notes and migrations

Write both in the change that needs them, never in the release PR:

- **`upgrade/notes/<version>.md`:** manual steps for that release, written for an agent to follow. They go into the release body under "Upgrade notes", and the upgrader shows them in the plan and the report. A release without notes says "No manual steps."
- **`upgrade/migrations/<version>.mjs`:** a script the upgrader runs when it passes that version, for changes a file merge can't express, such as moving a file. Migrations run in version order and must be safe to run twice. They never rewrite project knowledge.

## After a release

- **Upgrade the sample app** in `examples/sample-app/` with its own `node scripts/specfold.mjs upgrade`, in a follow-up PR that adds a record to its README. It is the end-to-end check that a real repository can move to the release.
- **Mirrors:** to fill a `source.url` mirror, copy the tarballs and checksums into one folder, run `node tools/specfold/release.mjs index <folder>`, and serve the folder with the `releases.json` it writes.

## Tools

| Command | What it does |
| --- | --- |
| `node tools/specfold/release.mjs check` | checks that the version fields agree |
| `node tools/specfold/release.mjs pack <version> [--out <dir>]` | packs the tarball and its `.sha256` |
| `node tools/specfold/release.mjs notes <version>` | prints the "Upgrade notes" section |
| `node tools/specfold/release.mjs index <dir>` | writes `releases.json` for a mirror |
| `node tools/specfold/upgrade-fixtures.mjs [<n>]` | upgrades repositories from the previous `n` releases (default 2) to this checkout |
| `node tools/specfold/docs.mjs [--check]` | writes or checks `docs/commands.md` |
