# Specfold template payload

Everything in this folder is what a repository receives from Specfold: the `specfold` CLI in `scripts/`, the `specfold` OpenSpec schema, the agent skills, the gate workflows and an empty OKF bundle in `knowledge/`.

## Two ways in

- **New repository:** create it with "Use this template" (or copy this folder into an empty repository), then run `node scripts/specfold.mjs init`. Init detects the stack and source globs, takes `--stack`, `--source-glob` and `--tools` to override them, and sets up the OpenSpec skills, skill links and git hooks. `--dry-run` shows what it would do.
- **Existing repository:** paste the kit's `BOOTSTRAP.md` into your coding agent at the repository root. It fetches a pinned kit snapshot through your `gh` login and runs the `sf-migrate` skill, which brings the repository in through one reviewable PR on the branch `specfold/migration`.

Both install the same files; `.specfold/manifest.json` records what came from the kit, so later upgrades know what they may rewrite.
