# Tasks

## 1. Release script

```yaml
files: [tools/specfold/release.mjs, tools/specfold/test/release.test.ts, upgrade/**]
depends: []
scenarios: [specfold-release#unknown-subcommand, specfold-release#template-behind-the-package, specfold-release#pack-a-release, specfold-release#version-mismatch, specfold-release#notes-present, specfold-release#no-notes]
agent: implementer
```

- [x] 1.1 Add `release.mjs` with its version check
  - Done when: scenarios unknown-subcommand and template-behind-the-package pass in `release.test.ts`
- [x] 1.2 Pack the template and `upgrade/` into the release tarball with its checksum
  - Done when: scenarios pack-a-release and version-mismatch pass in `release.test.ts`
- [x] 1.3 Print the upgrade notes of a version
  - Done when: scenarios notes-present and no-notes pass in `release.test.ts`, and `upgrade/README.md` explains `notes/` and `migrations/`

## 2. release-please setup

```yaml
files: [release-please-config.json, .release-please-manifest.json, package.json, package-lock.json, template/specfold.yaml, template/.specfold/manifest.json]
depends: []
scenarios: []
agent: implementer
```

- [x] 2.1 Configure release-please for `v0.1.0-rc.1`
  - Done when: the config sets the title pattern, changelog sections, `bump-minor-pre-major`, `release-as: 0.1.0-rc.1` and the extra-files, the root package has a version, `template/specfold.yaml` carries the version marker, and `release.mjs check` passes

## 3. Release workflow

```yaml
files: [.github/workflows/release.yml, .github/workflows/cli.yml]
depends: [1, 2]
scenarios: []
agent: implementer
```

- [x] 3.1 Run release-please and publish the tarball, checksum and notes
  - Done when: `release.yml` runs release-please with `RELEASE_PLEASE_TOKEN` on pushes to main, fails clearly without it, and on `release_created` packs, uploads and appends the notes
- [x] 3.2 Rebuild the bundle, lockfile and manifest on the release PR
  - Done when: job `rebuild` commits `build(release): 📦️ rebuild the bundle for v<version>` on release-please's branch only when something changed, and `cli.yml` runs `release.mjs check`

## 4. Bootstrap from releases

```yaml
files: [BOOTSTRAP.md, .github/workflows/cli.yml]
depends: [3]
scenarios: []
agent: implementer
```

- [ ] 4.1 Install the newest release in `BOOTSTRAP.md` and drop the pin check
  - Done when: `BOOTSTRAP.md` finds, downloads and checks the newest release with `gh`, `$KIT` is the template folder, and `cli.yml` has no pin check

## 5. Knowledge

```yaml
files: [knowledge/**]
depends: [3, 4]
scenarios: []
agent: knowledge-curator
```

- [ ] 5.1 Write the concept changes listed in `knowledge.md`
  - Done when: `node scripts/specfold.mjs validate` exits 0

## Workflow follow-up

- Archive the change, then run `node scripts/specfold.mjs sync add-release-automation` and commit its result in the same PR.
- After merging, set the `RELEASE_PLEASE_TOKEN` secret, merge the first release PR and check that `v0.1.0-rc.1` has its tarball, checksum and notes.
