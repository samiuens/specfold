---
type: Runbook
title: Cut a release
description: How a release candidate or release of the kit is cut - release-as, the release PR, its rebuild commit, publishing and the checks.
status: draft
stale_after: 2027-01-26T11:38:47+01:00
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-28T11:38:47+01:00 }
---

# When to use

When a change that should ship has been merged to `main`, and for each M9 release candidate. During M9 each change cuts one candidate: `0.1.0-rc.1` after `add-release-automation`, rc.2 and rc.3 after the next two, and `0.1.0` after `add-kit-docs`.

# Steps

1. **Pick the version.** For a planned candidate, the change sets `release-as` in `release-please-config.json` to the version. After `0.1.0`, `release-as` is removed and release-please derives the version from the commits; while at `0.x`, breaking changes bump the minor ([versioning](/decisions/versioning.md)).
2. **Upgrade notes and migrations** go into `upgrade/notes/<version>.md` and `upgrade/migrations/<version>.mjs` in the change that needs them, never into the release PR.
3. **The release PR.** On every push to `main`, workflow `release` runs release-please with the `RELEASE_PLEASE_TOKEN` secret, a fine-grained token for this repository with Contents and Pull requests read/write. It opens or updates the PR `chore(release): 🔖 vX.Y.Z` with the changelog and the version bumps. Only `feat`, `fix`, `perf` and `revert` commits are shown, so a docs-only merge opens no release PR.
4. **The rebuild commit.** Job `rebuild` runs on that PR and pushes `build(release): 📦️ rebuild the bundle for vX.Y.Z`, with the rebuilt bundle copies, the lockfile and the template manifest. If release-please rewrites the branch, the job runs again.
5. **Merge** the release PR by rebase once all checks pass, including `release.mjs check` and the bundle and manifest checks.
6. **Publishing** is automatic. Job `publish` packs `specfold-template-vX.Y.Z.tar.gz` with its `.sha256`, uploads both to the GitHub release, and appends the upgrade notes. Versions with `-rc` are marked as prereleases.
7. **From `0.1.0` on**, add `--exclude-pre-releases` to the release lookup in `BOOTSTRAP.md`, so it installs only stable releases.

# Verify

- `gh release view vX.Y.Z --repo samiuens/specfold` lists both files, and the body ends with "Upgrade notes".
- Following `BOOTSTRAP.md` in an empty folder fetches that release and passes the checksum check.

# Related

- [specfold release](/capabilities/specfold-release.md)
- [Delivery: template, bootstrap and migrate](/decisions/delivery-template-bootstrap-migrate.md)
