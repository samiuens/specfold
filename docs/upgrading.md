# Upgrading

`specfold upgrade` brings a newer kit release into the repository as one commit on its own branch. Files the team changed on purpose are merged, not overwritten, and project content is never touched. In an agent, the `sf-upgrade` skill walks through the same steps.

## The short version

```sh
node scripts/specfold.mjs upgrade --check   # is there a newer release? exit 1 means yes
node scripts/specfold.mjs upgrade           # print the plan; writes nothing
node scripts/specfold.mjs upgrade --yes     # apply it on specfold/upgrade-<version> and commit
```

Then read `.specfold/upgrade-report.md`, resolve any conflicts, follow the release's upgrade notes, and open a PR. `--pr` pushes and opens it for you, with the report as its body.

## What an upgrade changes

| Files | What happens |
| --- | --- |
| **Kit files:** the CLI, the OpenSpec schema, the skills, the gate workflows, the Claude Code agents | unchanged since install: replaced, or removed when the release dropped them. Changed here: merged three ways, and a conflict leaves markers in the file |
| **Managed blocks** in `AGENTS.md`, `CLAUDE.md`, `.gitignore` and the other shared files | the text between `specfold:start` and `specfold:end` is replaced, or merged when you edited it. Your text outside the markers is never read |
| `.claude/settings.json`, `openspec/config.yaml` | merged key by key: your keys, rules and context stay, and new ones are added |
| `specfold.yaml` | only `kit_version` changes |
| `knowledge/`, `openspec/specs/`, `openspec/changes/`, `.specfold/local.yaml` | never touched |

`.specfold/manifest.json` records the hash of everything the kit installed, which is how the upgrader tells "nobody touched this" from "the team changed this". For a three-way merge, it downloads the installed release too and uses its copy as the base.

After applying, the upgraded CLI runs follow-ups: `openspec update`, `agents sync`, `hooks install`, `index`, `validate`, and the local gate on the upgrade alone. A follow-up that fails is reported, not fatal.

## Conflicts

When a file or block was changed here and in the release, and the changes overlap, the upgrade still commits. It leaves the conflict markers in the file, lists the file in the report, and exits with 1. Resolve the markers on the upgrade branch, run the checks, and commit the fix there. When the installed release can't be downloaded as a base, a changed file is left as it is and reported as a conflict, instead of guessed at.

## Channels and versions

`channel` in `specfold.yaml` decides what counts as newer:

- `stable` (the default): final releases only;
- `next`: release candidates too.

Each run takes one step: the newest release in your current major version, or else the newest release of the next major. With several majors to go, run it again after each merge, so every major's notes and migrations land in their own commit. `--to <version>` picks the step yourself.

A teammate whose CLI is older than the repository's manifest gets refused on every command that writes, with a pointer to `specfold upgrade`. Commands that only read keep working.

## Sources

`source` in `specfold.yaml` says where releases come from:

```yaml
source:
  github: samiuens/specfold        # GitHub releases (the default)
  # url: https://mirror.example.com/specfold   # a mirror with a releases.json
  # path: ../specfold-releases                 # a local folder, for offline use
```

- **`github`:** read through your `gh` login when gh is installed and logged in, otherwise through the GitHub API with `SPECFOLD_TOKEN` or `GITHUB_TOKEN` from the environment. Tokens are never written anywhere.
- **`url`:** a folder served over HTTPS that holds the release tarballs, their `.sha256` files and a `releases.json`. The kit's `node tools/specfold/release.mjs index <folder>` writes that index.
- **`path`:** a local folder with the same files. Without a `releases.json`, the versions come from the tarballs' names. A relative path is read from the repository root.

Every tarball is checked against its `.sha256` before it is unpacked.

## Private kit repositories and tokens

The kit repository is private, so whoever upgrades needs read access to its releases:

- **On your machine,** your `gh` login is enough.
- **In CI or without gh,** set `SPECFOLD_TOKEN` to a token that can read the kit repository's releases.

## Weekly upgrade PRs

Like Dependabot, a workflow can open the upgrade PR for you. Every repository ships it switched off, at `.specfold/workflows/specfold-upgrade.yml`.

1. **Turn it on:** `node scripts/specfold.mjs init --upgrade-workflow` (or `migrate install --upgrade-workflow` during a migration). This copies it to `.github/workflows/` and records it in the manifest, so upgrades keep it current. Commit both files.
2. **Create a token.** It must read the kit's releases and, in your repository, write contents, pull requests and workflows. An upgrade may change the gate workflow, and pushing that needs the workflows permission. A fine-grained token covers both repositories only when they have the same owner; otherwise use a classic token with the `repo` and `workflow` scopes.
3. **Store it** as the repository secret `SPECFOLD_TOKEN` (Settings > Secrets and variables > Actions).
4. **Try it** with Actions > specfold-upgrade > Run workflow.

It runs every Monday and on demand:

- without the secret, it ends green with a notice naming it;
- when a newer release exists and its branch doesn't yet, it opens the upgrade PR, conflicts included, with `github-actions[bot]` as the commit author;
- it closes older open upgrade PRs, with a link to the new one.

## The session-start reminder

In Claude Code, the session start checks for a newer release on your channel at most once a day, and gives up after 2 seconds. When one exists, it prints one line naming the version and `specfold upgrade`. The check is cached in `.specfold/local-state.json`, which is gitignored, and an offline machine simply waits until the next day. To turn it off, set it in `specfold.yaml`:

```yaml
upgrade:
  reminder: false
```

## Your commit message

`upgrade.commit_message` sets the upgrade commit's message, with `{version}` for the new version. The default is `chore: upgrade Specfold to v{version}`.

```yaml
upgrade:
  commit_message: "build(deps): upgrade Specfold to v{version}"
```
