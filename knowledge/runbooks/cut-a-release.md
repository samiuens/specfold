---
type: Runbook
title: Cut a release
description: How a release candidate or release of the kit is cut - release-as, the release PR, its rebuild commit, publishing and the checks.
status: draft
stale_after: 2027-01-26T11:38:47+01:00
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-29T08:20:21+01:00 }
---

# When to use

When a change that should ship has been merged to `main`, and for each M9 release. How release-please, the rebuild commit, publishing, upgrade notes and migrations work is in the guide `docs/releasing.md`; this runbook keeps the kit-internal steps. During M9 each change cut one candidate: `0.1.0-rc.1` after `add-release-automation`, rc.2 and rc.3 after the next two, and `0.1.0` after `add-kit-docs`.

# Steps

1. **Pick the version.** For a planned release, the change sets `release-as` in `release-please-config.json`. After `0.1.0`, release-please derives the version from the commits; while at `0.x`, breaking changes bump the minor ([versioning](/decisions/versioning.md)).
2. **Pre-releases:** `"prerelease": true` stays out of the config. release-please would mark every `0.x` release as a GitHub pre-release with it, and `BOOTSTRAP.md` would then skip `0.1.0`. A version with `-rc` is still published as a pre-release, so the release candidates up to rc.3 kept the key, and `add-kit-docs` removed it for `0.1.0`.
3. **Merge the release PR** by rebase once all checks pass, including `upgrade-fixtures`.
4. **Check the release:** `gh release view vX.Y.Z --repo samiuens/specfold` lists the tarball and its `.sha256`, and the body ends with "Upgrade notes".
5. **Upgrade the sample app** with the released upgrader, in a follow-up PR ([upgrade the sample app](/runbooks/upgrade-the-sample-app.md)).
6. **After `0.1.0`, one follow-up PR:**
   - remove `release-as`;
   - add `--exclude-pre-releases` to the release lookup in `BOOTSTRAP.md`, so it installs only stable releases. This waits until `0.1.0` exists, because before that the lookup would find nothing;
   - make `upgrade-fixtures` a required check in the `main` branch protection, next to `commit-convention`, `cli (20)`, `cli (24)` and `specfold-gate`.

# Verify

- Following `BOOTSTRAP.md` in an empty folder fetches the new release and passes the checksum check.
- In `examples/sample-app`, `node scripts/specfold.mjs upgrade --check` reports the release as the newest.

# Related

- [specfold release](/capabilities/specfold-release.md)
- [Guides in docs, knowledge links to them](/conventions/kit-docs.md)
- [Delivery: template, bootstrap and migrate](/decisions/delivery-template-bootstrap-migrate.md)
