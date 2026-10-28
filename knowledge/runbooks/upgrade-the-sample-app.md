---
type: Runbook
title: Upgrade the sample app
description: How the sample app is upgraded from each release candidate with the released upgrader, and how the run is recorded.
status: draft
stale_after: 2027-01-26T18:04:37+01:00
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-28T18:04:37+01:00 }
---

# When to use

After each release candidate is published, the sample app (`examples/sample-app`) is upgraded with the released upgrader. That's the end-to-end proof that a real repository goes from one release to the next. The sample app gets kit files only this way; the kit's build no longer copies into it. Its manifest records `0.1.0-rc.1`, its channel is `next`, and its commit message follows the kit's convention.

# Steps

1. Start on a branch from `main` with a clean working tree. The upgrade's own branch `specfold/upgrade-<version>` is created from it.
2. From `examples/sample-app`, run the sample app's own CLI: `node scripts/specfold.mjs upgrade --check`. It should name the new candidate.
3. **First upgrade, rc.1 to rc.2 only:** rc.1's CLI has no `upgrade`, so follow `upgrade/notes/0.1.0-rc.2.md`. Download and check the rc.1 and rc.2 tarballs, then run the rc.2 CLI with `--from`, `--base-dir` and `--ref`. From rc.2 on, run `node scripts/specfold.mjs upgrade` and then `node scripts/specfold.mjs upgrade --yes`.
4. Read `.specfold/upgrade-report.md`:
   - resolve each conflict on the upgrade branch;
   - do the manual steps from the upgrade notes;
   - look at the follow-up results. `hooks install` is expected to exit with 2 there, because hooks are installed from the git root, which is the kit's.
5. Run the sample app's checks from the kit root, as CI does: `npm test`, `validate`, `index --check`, `openspec validate --all --strict`.
6. Record the run in the sample app's README "Upgrade runs" list: versions, conflicts, manual steps and anything that surprised you. Then open the PR.

# Verify

- The upgrade commit changes only files below `examples/sample-app/` and passes the kit's commit check.
- `examples/sample-app/.specfold/manifest.json` and `specfold.yaml` name the new version.
- CI passes on the PR.

# Related

- [Upgrade flow](/architecture/upgrade-flow.md)
- [Cut a release](/runbooks/cut-a-release.md)
- [Sample app agent check](/runbooks/sample-app-agent-check.md)
