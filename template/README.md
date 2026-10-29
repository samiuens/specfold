# Specfold template payload

Everything in this folder is what a repository receives from Specfold: the `specfold` CLI in `scripts/`, the `specfold` OpenSpec schema, the agent skills, the gate workflows and an empty OKF bundle in `knowledge/`. Each release packs it into `specfold-template-v<version>.tar.gz`, with a `.sha256` next to it.

## Two ways in

- **New or empty repository:** paste the kit's `BOOTSTRAP.md` into your coding agent at the repository root. It downloads the newest stable release through your `gh` login, checks its SHA-256, copies the payload in and runs `node scripts/specfold.mjs init`. To do it by hand, unpack the tarball into the repository and run init yourself. Init detects the stack and source globs, takes `--stack`, `--source-glob` and `--tools` to override them, and sets up the OpenSpec skills, skill links and git hooks. `--dry-run` shows what it would do. It also sets your personal limit on subagents running at the same time to 3 (`--max-subagents <n>` to choose another); an agent asks you first. Change it any time with `node scripts/specfold.mjs parallel set <n>`.
- **Existing repository:** paste `BOOTSTRAP.md` as well. It finds tracked files and runs the `sf-migrate` skill, which brings the repository in through one reviewable PR on the branch `specfold/migration`.

Both install the same files; `.specfold/manifest.json` records what came from the kit, so later upgrades with `node scripts/specfold.mjs upgrade` know what they may rewrite. The kit's README and its guides in `docs/` explain the rest.
