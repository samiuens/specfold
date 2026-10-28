# Design

## Context

`specfold init` and `specfold migrate install` write `.specfold/manifest.json`, which holds the hash of every kit-owned file and of every managed block's content, plus `kit_version`. Releases are `specfold-template-v<version>.tar.gz` files with a `.sha256` next to them, built by `release.mjs pack` from `template/` and `upgrade/`, and published as GitHub releases on `samiuens/specfold`. rc.1 has no upgrade command, so the first upgrade (rc.1 to rc.2) runs with the rc.2 CLI. The sample app lives inside the kit repository at `examples/sample-app`, its own Specfold root below the kit's git root, and gets copies of the kit's files on every build.

## Goals / Non-Goals

**Goals:**
- One command takes a repository from its installed release to a newer one, keeps every local edit it can merge, and leaves a reviewable commit with a report.
- The new release's code decides how to upgrade, so an old CLI never has to know the new layout.
- Nothing the team owns changes.

**Non-Goals:**
- The weekly workflow, the init opt-in and the SessionStart reminder (`add-upgrade-workflow`).
- Rewriting knowledge or specs.

## Decisions

Decisions 11 to 14 were asked while designing (user, 2026-10-28); the rest follow from the brief.

1. **Two stages, one command.** `specfold upgrade` without `--from` is the outer stage:
   - it resolves the target version, downloads the target's tarball and the installed version's tarball, and checks both against their `.sha256`;
   - it unpacks them into a temporary folder;
   - it runs `node <target>/scripts/specfold.mjs upgrade --from <target> [--base-dir <installed>] --to <version>`, passing `--yes`, `--pr` and `--json` through, and returns that exit code.

   With `--from <dir>`, the inner stage plans and applies against that unpacked release. `--from` also works by hand, for an offline release. A failed checksum on the target stops with exit 2. If the installed version's tarball is missing or fails its checksum, the upgrade goes ahead without a base, and every locally changed file becomes a conflict.
2. **Versions:** semver with prerelease ordering (`0.1.0-rc.2` < `0.1.0`). Channel `stable` keeps final releases only; `next` also keeps prereleases. With no `--to`, the target is the newest release in the installed major; when there is none, it is the newest release in the next major. Each run takes one step, and `--check` prints the whole path. `--to` takes any version the source has, on any channel.
3. **Sources** (`source:` in specfold.yaml; the first key present wins, in the order `path`, `url`, `github`):
   - `github: owner/repo`:
     - with a gh login (`gh auth status`): `gh release list` and `gh release download`;
     - otherwise the REST API, with `SPECFOLD_TOKEN` or `GITHUB_TOKEN` as a bearer token when set;
     - the token is passed in a header and never written anywhere. Release notes come from the release body;
   - `url: https://...`: reads `releases.json`, then the tarballs and checksums, below that URL;
   - `path: <folder>` (relative to the Specfold root): reads `releases.json` when present, otherwise lists the `specfold-template-v*.tar.gz` files.
4. **`releases.json`** is `{"releases":[{"version":"0.1.0-rc.2","notes":"..."}]}`, newest first. `release.mjs index <dir>` writes it from the tarballs in a folder. Each entry's notes are the upgrade notes `release.mjs notes` prints for that version, so filling a mirror means copying the release files and running `index`. Unpacking uses the system `tar` with `--strip-components=1`; it ships with Linux, macOS and Windows 10 and later.
5. **File classes** (inner stage):
   - **Kit-owned files:**
     - which files: `scripts/specfold.mjs`, `openspec/schemas/specfold/**`, `.agents/skills/**`, the two gate workflows and, when the manifest lists `.claude/` files, `.claude/agents/**`. That's the list install uses, read from the target release, plus every file the manifest lists;
     - **missing locally:** written;
     - **equal to the new copy:** only the manifest is updated;
     - **unchanged since install** (local hash equals the manifest hash): replaced, or removed when the target no longer ships it;
     - **changed locally:** merged three ways with `git merge-file -p <local> <base> <new>`, where the base is the installed release's copy, used only when its hash equals the manifest hash;
     - a merge conflict writes the conflict markers. A missing base leaves the file unchanged as a conflict. A changed file the target dropped is kept and reported;
     - new files take the target's file mode.
   - **Managed blocks** (`BLOCK_FILES`):
     - unchanged block content (by the manifest's block hash) is replaced with `applyBlock`;
     - edited block content is merged three ways against the base template's file, inside the markers;
     - a block file in the manifest that has lost its markers is a conflict. One that isn't in the manifest (init found it edited) is left alone and reported.
   - **`.claude/settings.json`**, three-way per key against the base template's copy (no base means adding only):
     - deny rules the target adds are added; rules the base had and the target drops are removed;
     - Specfold's hook groups (commands that run `scripts/specfold.mjs`) are replaced with the target's;
     - `env` values still equal to the base are updated; new keys are added.
   - **`openspec/config.yaml`:**
     - `schema` is `specfold`;
     - each `rules`/`operations` key still equal to the base is updated, new keys are added, and keys the target drops are removed when still equal to the base;
     - `context` is replaced when it equals the base apart from its `Stack:` line, which is kept. Otherwise it's kept and reported.
   - **`specfold.yaml`:** only the `kit_version` value changes, by a line edit that keeps the comment.
   - **Never touched:** `knowledge/**`, `openspec/specs/**`, `openspec/changes/**`, `.specfold/local.yaml`, and every other path.
6. **Migrations** are `upgrade/migrations/<version>.mjs` in the target tarball. Each one whose version is above the installed one and at most the target runs, in version order, after the files are written. It's imported with `import()` and its default export is called with `{ root, from, version, report }`; `report(line)` adds a line to the upgrade report. Migrations must be idempotent. A throwing migration stops the upgrade with exit 2 before the commit, and its message is shown.
7. **Plan without `--yes`:** the plan lists:
   - each file action (`add`, `replace`, `merge`, `remove`, `keep`, `conflict`);
   - each block, the settings and the OpenSpec config;
   - the migrations;
   - the upgrade notes of every version passed.

   Nothing is written; `--json` prints the same plan as JSON.
8. **`--yes`:**
   - **refused before anything is written:**
     - on a dirty working tree (`git status --porcelain`, whole repository);
     - when branch `specfold/upgrade-<version>` already exists;
   - then it switches to a new branch `specfold/upgrade-<version>` and applies the plan and the migrations;
   - the manifest is rewritten with `manifestText` (the target's `kit_version`, the source's tag as `ref` when it has one). A file left in conflict for lack of a base keeps its old hash;
   - the follow-ups run, the report is written, and `git add -A -- .` from the Specfold root plus one commit record everything. In the sample app, the commit holds only `examples/sample-app/`;
   - **exit code:** 1 when conflicts remain, else 0.
9. **Follow-ups**, run with the upgraded `scripts/specfold.mjs`, plus the repository's OpenSpec binary for `openspec update`:
   - `openspec update`, `agents sync`, `hooks install`, `index`, `validate`, then `gate --local`;
   - each one's exit code and last output line go into the report;
   - a failing follow-up doesn't stop the commit, because the report and the PR checks show it.
10. **Report** `.specfold/upgrade-report.md`, overwritten by each upgrade. In order:
    - the versions (from and to);
    - the conflicts first, then a table of the file and block actions;
    - kept files, the migrations' lines, the follow-up results;
    - the upgrade notes of every version passed.

    `--pr` uses it as the PR body.
11. **Mirror index for `source.url`:** `releases.json`, written by `release.mjs index` (decision 4). This adds requirements to `specfold-upgrade` and `specfold-release`.
12. **The sample app gets kit files only through upgrades.**
    - The rebuild job and the build steps stop copying into it, and the CI check that compares its copies with the template goes away. The skill link check stays.
    - In this change it gets `kit_version: 0.1.0-rc.1`, `channel: next`, a commit message that passes the kit's convention, and a manifest from `specfold init`. Its files are already rc.1's.
13. **The sample app's first upgrade** (rc.1 to rc.2) is a follow-up PR after rc.2 is published. It runs the released rc.2 CLI from the tarball, because rc.1's CLI has no upgrade command. The run is recorded in a runbook, and `upgrade/notes/0.1.0-rc.2.md` tells every rc.1 repository to do the same once.
14. **Commit message:**
    - `upgrade.commit_message` in specfold.yaml, with `{version}` replaced;
    - the default is `chore: upgrade Specfold to v{version}`;
    - the template documents the key in a comment, so existing repositories keep the default until they set it.
15. **Version skew:**
    - before a command runs, the CLI compares the nearest Specfold root's manifest `kit_version` with its own version. When the manifest is newer, write commands stop with exit 2 and name `specfold upgrade`;
    - **write commands:** `agents sync` without `--check`, `backlog` (except `list`), `graphify setup`, `hooks install`, `index` without `--check`, `init`, `log add`, `migrate`, `new`, `parallel set`, `sync` without `--dry-run`, `verify`, `wt`;
    - the list is one table in `src/upgrade/skew.ts`, so each command module stays unchanged;
    - `upgrade` itself is never refused;
    - a CLI version or manifest version that isn't semver skips the check.
16. **Skill `sf-upgrade`** (template and kit copies, with links):
    - it runs `--check`, shows the plan, runs `--yes` after the user agrees, and resolves each conflict in the report with the user;
    - it applies the upgrade notes' manual steps and runs `validate` and `gate --local`;
    - pushing (`--pr`) and merging stay the user's call.
17. **Release:** `release-as` becomes `0.1.0-rc.2`.

## Risks / Trade-offs

- **Major steps are tested only with fixtures:** with only 0.x releases, the step path can't be exercised against real releases.
- **No base for repositories installed at `0.0.0`** (before releases): their changed kit files become conflicts on the first upgrade, which the report lists.
- **Re-serializing YAML and JSON:** the settings and OpenSpec config are written only after a real edit, as in install, but an edit reformats the whole file.
- **A follow-up that fails** (for example `gate --local` on stale knowledge) still lands in the commit. The report and the PR checks show it.

## Commitments

none
