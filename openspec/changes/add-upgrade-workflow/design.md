# Design

## Context

`specfold upgrade` exists since rc.2 and was fixed for rc.3 (`fix-upgrade-follow-ups`); the rc.3 release PR is open and waits for this change. The kit repository is private, so every download of a release needs a token that can read `samiuens/specfold`. Release PRs get their checks because release-please uses a PAT, so a job in `cli.yml` runs on them like on any PR. The template's `.gitignore` is a managed block, and upgrades replace it.

## Goals / Non-Goals

**Goals:**
- A team that opts in gets one upgrade PR per new release, without anyone running a command.
- People in Claude Code learn about a waiting release at session start, at no noticeable cost.
- The kit's CI catches a change that breaks upgrading from the last two releases.

**Non-Goals:**
- Auto-merging upgrade PRs.
- Changing the upgrade logic.

## Decisions

Decisions 2, 5 and 6 were asked while designing (user, 2026-10-28); the rest follow from the brief.

1. **The workflow ships inactive** as `template/.specfold/workflows/specfold-upgrade.yml`. `.specfold/workflows/` joins the kit-owned paths, so every installed repository has the current copy and can turn it on later.
2. **Turning it on:** `specfold init --upgrade-workflow` and `specfold migrate install --upgrade-workflow` (user) both:
   - copy the file to `.github/workflows/specfold-upgrade.yml`;
   - record that path in the manifest with the copy's hash;
   - print how to add the `SPECFOLD_TOKEN` secret.

   `BOOTSTRAP.md` (empty repository path) and `sf-migrate` (plan step) ask the user whether to turn it on.
3. **Upgrading the opt-in file:** when the manifest lists `.github/workflows/specfold-upgrade.yml`, the upgrade plan treats it as kit-owned, with the release's `.specfold/workflows/specfold-upgrade.yml` (and the base's) as its copies. Without the entry, the plan never creates it.
4. **The workflow** runs weekly (Monday, 06:17 UTC) and on `workflow_dispatch`:
   - **no `SPECFOLD_TOKEN`:** it ends green with a `::notice::` naming the secret and what it needs;
   - otherwise it checks out with the token, installs Node 22 and the OpenSpec version the gate workflow pins, then runs `node scripts/specfold.mjs upgrade --check --json` with `GH_TOKEN` set to the secret. The JSON goes to `$RUNNER_TEMP`, so the tree stays clean;
   - **exit 0** ends the run;
   - **exit 1:** the first version on the path names the branch `specfold/upgrade-<version>`. If that branch exists on the remote, the run ends with a notice. Otherwise it runs `upgrade --yes --pr`, where exit 1 (conflicts) still counts as success;
   - **any other exit code** fails the run.
5. **Author:** the workflow sets git's identity to `github-actions[bot]` (`41898282+github-actions[bot]@users.noreply.github.com`) before `upgrade --yes` (user). The PR is opened with the token, so it shows the token's owner.
6. **Superseded PRs:** after opening the new PR, the workflow closes every other open PR whose head starts with `specfold/upgrade-`, commenting with the new PR's URL (user).
7. **The token** must read the kit's releases and, in the repository, write contents, pull requests and workflows. An upgrade can change `.github/workflows/specfold-gate.yml`, and pushing that needs the workflows permission. A fine-grained token covers both only when the repository and the kit have the same owner. Otherwise a classic token with `repo` and `workflow` is needed. init's note and the workflow's notice say this.
8. **Reminder** (`src/upgrade/reminder.ts`), called from `sessionStart`, which becomes async:
   - it does nothing when `upgrade.reminder` is `false`, or when `source` or `kit_version` is missing;
   - the cache `.specfold/local-state.json` holds `{"upgrade_check": {"date": "YYYY-MM-DD", "versions": [...] | null}}`, with the local date. A cache from today is used as it is; `null` (a failed check) means no reminder until tomorrow;
   - otherwise it queries the source with a 2-second limit. `SourceOptions` gains `timeoutMs`, which `fetch` gets as `AbortSignal.timeout` and `gh` as an `execFileSync` timeout, including `gh auth status`. Then it writes the cache;
   - when `upgradePath` is non-empty, it prints `Specfold <newest> is available (installed <kit_version>): run node scripts/specfold.mjs upgrade (skill sf-upgrade)`;
   - errors never reach the hook's exit code.
9. **Settings:** `upgrade.reminder` (default `true`) is read by `loadConfig`. The template documents it next to `commit_message`. The kit's own `specfold.yaml` sets it to `false`, because the kit is the source and is never upgraded.
10. **Ignore:** `.specfold/local-state.json` joins the template's `.gitignore` block and the kit's `.gitignore`.
11. **Fixture job** `upgrade-fixtures` in `cli.yml`:
    - it always reports. Its first step checks whether the PR changes `template/`, `upgrade/`, `tools/specfold/` or `scripts/`, which includes release PRs; when it doesn't, the job skips its other steps and ends green. That way it can become a required check at v0.1.0 without hanging on unrelated PRs;
    - the script `tools/specfold/upgrade-fixtures.mjs` (plain Node, kit only, like `release.mjs`) packs the PR's build with `release.mjs pack`, then downloads the previous two releases with `gh`;
    - for each release, after checking the checksum, it unpacks the release and copies the template into a new git repository. It runs that release's own `specfold init`, with OpenSpec from the kit's `node_modules/.bin`;
    - it appends a team line to `.claude/agents/verifier.md`, commits, and upgrades with the PR build's CLI (`--from`, `--base-dir`, `--to <package version>`, `--yes`);
    - **it fails when** the upgrade exits with anything but 0, a changed file falls outside the kit's paths, or `verifier.md` lost the team line or holds conflict markers. The kit's paths are the manifest's files, the blocks, the two config files, `specfold.yaml`, `.specfold/`, skill links, and OpenSpec's generated skills and commands.
12. **Release:** `release-as` stays `0.1.0-rc.3`; merging this change completes rc.3. After the release, the sample app is upgraded to rc.3, the first run of a released `specfold upgrade` through its outer stage.

## Risks / Trade-offs

- **The private kit repository:** every user repository needs a token for upgrades, and the reminder only works where `gh` is logged in or a token is in the environment. Offline, or without access, it stays silent.
- **Fixture job time:** two `openspec init` runs and two upgrades add about a minute. That's paid only on PRs touching the kit's payload.
- **Session start waits for the network** for at most 2 seconds, once a day per clone.

## Commitments

none
