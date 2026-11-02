# Contributing to Specfold

Thanks for helping. Specfold is built with Specfold, so a contribution goes through the same workflow the kit ships: knowledge for the *why and what*, OpenSpec for the *how*, and the `specfold-gate` check before anything merges.

## Before you start

- **Small fixes** (typos, broken links, a clear bug with a small fix): open a pull request directly.
- **Anything that changes behavior** (a CLI command, the gate, a skill, the template): open an issue first, so we agree on the change before you write it.
- **Security issues:** never in a public issue. See [Security](SECURITY.md).

## Set up

You need Node.js 20.19 or later, git and the GitHub CLI `gh`.

```sh
npm install            # also installs the git hooks (pre-push runs the gate)
npm run check -w specfold
npm test -w specfold
```

[`AGENTS.md`](AGENTS.md) maps the repository and holds the rules every agent and human follows here. The kit's own knowledge starts at [`knowledge/index.md`](knowledge/index.md), its specs are in [`openspec/specs/`](openspec/specs/), and [`docs/workflow.md`](docs/workflow.md) walks through a change.

## Making a change

1. **Work on a branch** of your fork, never on `main`.
2. **Behavior changes are OpenSpec changes.** Plan the change (the `sf-plan` skill, or `claude --agent planner --permission-mode plan` in Claude Code), apply it, archive it and sync its knowledge in the same pull request. A change with no behavior change uses `skip_specs: true`. Code changes without any OpenSpec change need the `no-spec` label and a `No-spec reason:` line in the PR description; the PR template shows where.
3. **Never copy the kit's own knowledge, specs or settings into `template/`.** `template/` is what user repositories receive.
4. **Rebuild what is generated:** `npm run build -w specfold` for `scripts/specfold.mjs`, `node scripts/specfold.mjs index` for knowledge indexes, and `node tools/specfold/docs.mjs` for the command reference. CI fails when any of them is stale.
5. **Check locally** before you push: `node scripts/specfold.mjs gate --local --base origin/main`, `node scripts/specfold.mjs validate` and `openspec validate --all --strict`.

## Commit messages and PR titles

Every commit and the PR title follow the convention in [`AGENTS.md`, section 7](AGENTS.md#7-commits-this-repo-only), and CI checks both:

```text
<type>(<scope>): <gitmoji> <subject>
```

For example `fix(gate): 🐛 count renamed concepts once`. Lowercase, imperative, no trailing period, at most 72 characters, one logical change per commit. The scopes are listed in [`scripts/commit-convention.json`](scripts/commit-convention.json). Check a message before you commit:

```sh
node scripts/check-commit.mjs --message-file <file>
node scripts/check-commit.mjs --title "<your PR title>"
```

If an AI agent wrote or substantially changed a commit, add its `Co-Authored-By:` trailer. You stay the author.

## Knowledge

Knowledge files describe; specs prescribe. Agents and contributors write concepts as `status: draft`; only a maintainer marks them verified. Add log entries with `node scripts/specfold.mjs log add`, never by hand. The rules are in [`AGENTS.md`, section 6](AGENTS.md#6-knowledge-rules).

## Review

Decisions and specs are reviewed by the maintainer (see [`CODEOWNERS`](.github/CODEOWNERS)). Pull requests are merged by rebase once `specfold-gate` and the other checks pass.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE), and those under `template/` under MIT-0, as the license file describes.
