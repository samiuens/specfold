# Design

## Context

The CLI's version comes from `tools/specfold/package.json` and is baked into the committed bundle at build time. The bundle has three copies (kit, template, sample app), and the template manifest records the bundle's hash. `kit_version` sits in `template/specfold.yaml` and the template manifest. The kit merges by rebase only, and four checks are required on every PR. All of these facts shape how release-please can work here.

## Goals / Non-Goals

**Goals:**
- One merged release PR produces the tag, the GitHub release, the template tarball, its checksum and the upgrade notes.
- The released tarball is self-consistent: bundle version, `kit_version`, manifest and hashes all agree.
- The required checks run on the release PR like on any other.

**Non-Goals:**
- npm publishing; the upgrader.

## Decisions

1. **Token: a fine-grained PAT** (user, 2026-10-28). Resources created with `GITHUB_TOKEN` start no workflows (release-please-action README), so the required checks would never run on the release PR.
   - The secret is `RELEASE_PLEASE_TOKEN`: samiuens/specfold only, Contents and Pull requests read/write.
   - Commits release-please makes through the API are authored by the token's owner, which keeps the rule that the human is the author.
   - The workflow fails with a clear error while the secret is missing.
2. **Strategy `node` at the root.** The root `package.json` gets `"version": "0.0.0"`, which release-please bumps along with the lockfile's root entries. `extra-files` bump:
   - `tools/specfold/package.json` (`$.version`, type json);
   - the lockfile's `packages["tools/specfold"].version`;
   - `template/specfold.yaml` through the generic `x-release-please-version` marker on its `kit_version` line, since the yaml updater would drop comments.

   `simple` was rejected because it adds a `version.txt` nobody reads.
3. **Rebuild job on the release PR** (user, 2026-10-28). release-please can't build.
   - Job `rebuild` in `release.yml` runs on `pull_request` for release-please's branch (`release-please--branches--main`) and checks out the PR head with the PAT.
   - It runs `npm run build -w specfold`, copies the bundle to the template and the sample app, and regenerates the template manifest with `vitest -u`.
   - If anything changed, it commits `build(release): 📦️ rebuild the bundle for v<version>` as the PAT's owner and pushes.
   - When release-please rewrites the branch after new commits on main, the push starts the job again. The existing checks ("bundle is up to date", the manifest test, `release.mjs check`) block a merge while the rebuild is missing.
4. **Version per release candidate with `release-as`.** Each M9 change that cuts a candidate sets `"release-as"` in `release-please-config.json` (`0.1.0-rc.1` here, then rc.2 and rc.3), and `add-kit-docs` sets `0.1.0` and removes it after the release.
   - release-please's prerelease versioning would have to guess the `rc.N` numbering from `0.0.0`; an explicit version is deterministic.
   - `bump-minor-pre-major: true` gives the pre-1.0 policy after that.
5. **Changelog sections:** `feat`, `fix`, `perf` and `revert` are shown; `docs`, `test`, `build`, `ci`, `chore`, `refactor` and `style` are hidden. That way plan PRs (docs) don't open a release PR on their own. The gitmoji stays in each entry, as part of the subject.
6. **Release title and commit:** `pull-request-title-pattern: "chore(release): 🔖 v${version}"`, `include-component-in-tag: false`, tags `vX.Y.Z`. release-please's commit takes the PR title as its message. Whether it passes `check-commit.mjs` unchanged is checked on the first release PR: the commit-convention check runs on it once the PAT is set.
7. **`release.mjs` is plain Node** in `tools/specfold/` (kit only, not bundled):
   - `check` reads the three version fields;
   - `pack` copies `git ls-files template` and `git ls-files upgrade` into a temporary `specfold-template-v<version>/` folder, then runs `tar -czf` with `-C`, which works with GNU and BSD tar. It writes `<hex>  <file>` as the `.sha256`;
   - `notes` reads `upgrade/notes/<version>.md`.
8. **Release job:** `release-please` runs on push to main with the PAT. When `release_created`, the `publish` job:
   - checks out the tag and runs `release.mjs pack`;
   - uploads both files with `gh release upload`;
   - sets the body to release-please's notes followed by `release.mjs notes` (`gh release edit --notes-file`).
9. **Release candidates are prereleases** on GitHub (`prerelease: true` while a version has `-rc`), so `gh release list --exclude-pre-releases` finds only stable versions.
10. **`BOOTSTRAP.md`:**
    - it finds the newest release with `gh release list --repo samiuens/specfold --limit 1 --json tagName`, adding `--exclude-pre-releases` from v0.1.0 on;
    - it downloads both files with `gh release download` and checks the hash with a `node -e` one-liner, since `sha256sum` and `shasum` differ between Linux and macOS;
    - it unpacks with `--strip-components=1`, so `$KIT` is the template folder itself, and passes the tag to `--ref`.

    The CI pin check and the pin runbook go away.

## Risks / Trade-offs

- **The window before rc.1:** between merging this change and merging the first release PR, `BOOTSTRAP.md` finds no release. The release PR follows within minutes, so no fallback is added.
- **release-please rewriting its branch** drops the rebuild commit until the job runs again; the required checks cover the gap.
- **`release-as` left behind:** between two candidates, a releasable commit would propose the same version again. Hidden docs commits and the next change setting the next version keep that from happening in M9.

## Commitments

none
