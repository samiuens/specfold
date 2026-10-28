## Wish

The kit repository releases itself: release-please turns the conventional commits into a release PR with the changelog and version bumps, and merging it tags the release, builds the template tarball with its SHA-256 and publishes both with agent-readable upgrade notes. `BOOTSTRAP.md` installs the latest release instead of a pinned commit, and `v0.1.0-rc.1` is the first release.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | How is M9 split? | Four changes: `add-release-automation`, `add-specfold-upgrade`, `add-upgrade-workflow`, `add-kit-docs`; v0.1.0 follows the docs | user |
| Q2 | Which release tool? | release-please, with the title pattern `chore(release): 🔖 v${version}` and extra-files bumping `kit_version` in the template | user |
| Q3 | What does a release ship? | `specfold-template-vX.Y.Z.tar.gz` packed from `template/` (CLI bundle included) plus a `.sha256` file, attached to the GitHub release | user |
| Q4 | When are release candidates cut? | After each M9 change: rc.1 after this one, rc.2 after the upgrader, rc.3 after the workflow, then v0.1.0 after the docs | user |
| Q5 | Where are upgrade notes written? | `upgrade/notes/<version>.md`, written in the change that needs it and shipped in the tarball; the release workflow copies it into the release body under "Upgrade notes" | user |
| Q6 | What does `BOOTSTRAP.md` fetch? | The latest release tarball on the `next` channel until v0.1.0, then `stable`, checked against its SHA-256; `KIT_REF` and its pin PRs go away | user |

## Out of scope

- The upgrader, migrations and the weekly workflow (`add-specfold-upgrade`, `add-upgrade-workflow`).
- Publishing to npm.

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-28T10:53:11+01:00
