---
type: Data Flow
title: Upgrade flow
description: "How an upgrade runs: outer stage downloads and checks, the target release's CLI plans, applies, migrates, reports and commits."
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-04T08:46:34+01:00 }
---

# Flow

1. **Outer stage** (the CLI the repository has):
   - reads `kit_version`, `channel` and `source` from `specfold.yaml`;
   - lists the source's versions and picks the next step: the newest release in the installed major, else the newest of the next major (`--to` overrides);
   - `--check` stops here: it prints the step path and the release notes, and exits with 1 when something is newer.
2. **Download and check:**
   - the target's tarball and the installed version's tarball are downloaded into a temporary folder, from `source.github` (gh, or the REST API with `SPECFOLD_TOKEN` or `GITHUB_TOKEN`), `source.url` (with its `releases.json`) or `source.path`;
   - each tarball is checked against its `.sha256` and unpacked with `tar --strip-components=1`;
   - a bad target stops everything with exit 2. A missing installed release only means there's no merge base.
3. **Hand-off:** the outer stage runs `node <target>/scripts/specfold.mjs upgrade --from <target> --base-dir <installed> --to <version>`, so the release being installed decides how it is installed. An old CLI never needs to understand a new layout.
4. **Plan** (inner stage):
   - kit files, blocks and the two config files are compared with the manifest and merged in memory ([upgrade file classes](/decisions/upgrade-file-classes.md));
   - the plan also lists migrations (`upgrade/migrations/<version>.mjs`) and the upgrade notes of every version passed;
   - without `--yes`, it is printed and nothing is written.
5. **Apply** with `--yes`:
   - refused on a dirty working tree or when `specfold/upgrade-<version>` exists;
   - otherwise the plan is written on that new branch, the migrations run in version order, and `kit_version` and the manifest move to the new version.
6. **Follow-ups:**
   - `openspec update` (where OpenSpec is set up), `agents sync`, `permissions sync`, `hooks install`, `index`, `validate` and `gate --base <start> --local` run with the upgraded CLI, where `<start>` is the commit the upgrade branch was created from, so the gate checks exactly the upgrade;
   - each one's exit code and last line go into `.specfold/upgrade-report.md`;
   - a failure is reported, not fatal.
7. **Commit and PR:**
   - everything below the Specfold root is committed with `upgrade.commit_message`;
   - `--pr` pushes and opens a PR with the report as its body;
   - the exit code is 1 when conflicts remain.

**Reminder:**
- the Claude Code session-start hook asks the source at most once a day, within 2 seconds, and caches the answer in the gitignored `.specfold/local-state.json`. A failed check counts too, so an offline machine waits until the next day;
- when the channel has something newer, it prints one line naming the version and `specfold upgrade`;
- `upgrade.reminder: false` turns it off; the kit itself sets that, because it is the source.

**Weekly workflow:** when a team turns it on ([turn on upgrade PRs](/runbooks/turn-on-upgrade-prs.md)), `.github/workflows/specfold-upgrade.yml` runs the check every Monday and opens the PR. The turned-on copy is a kit-owned file whose release copy is `.specfold/workflows/specfold-upgrade.yml`.

**Kit CI:**
- job `upgrade-fixtures` builds a repository from each of the previous two releases with that release's own `init`, and adds a team edit to `.claude/agents/verifier.md`;
- it upgrades each one to the PR's packed build, and fails when the upgrade fails, touches a path that isn't the kit's, or loses the edit;
- on PRs that leave the kit's payload alone, it ends green without work.

**Version skew:** every other command checks the manifest first. When it was written by a newer kit than the running CLI, write commands stop and point to `specfold upgrade`, and read commands keep working.

# Related

- [specfold upgrade](/capabilities/specfold-upgrade.md)
- [specfold release](/capabilities/specfold-release.md)
- [specfold CLI](/architecture/specfold-cli.md)
