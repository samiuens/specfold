## Context

The gate is enforced only once `specfold-gate` is a required check ([blocking merge gate](/decisions/blocking-merge-gate.md)). The kit's own `main` gets that from the ruleset `main: commit convention`; installed repositories get nothing. The brief settles the shape: a `gate require` subcommand that writes one ruleset through `gh`, an opt-in init flag, a doctor warning and agent prompts.

## Goals / Non-Goals

**Goals:** one idempotent command that makes the check required, usable at install and any time later; a read-only doctor check; clear manual steps whenever GitHub refuses.

**Non-Goals:** GitHub Enterprise Server hosts, classic branch protection, other required checks.

## Decisions

1. **`gh` as the only client.** Every call goes through a small runner, `(args, input?) => { ok, stdout, stderr }`, wrapping `execFileSync("gh", …)`. The command and init pass the real one; tests pass a fake that emulates the rulesets API. `gh` brings the user's login and host handling, and no token is read from the environment ([private kit repo](/decisions/private-kit-repo.md) uses the same split for downloads).
2. **Which repository.** `gh repo view --json nameWithOwner` in the current checkout, the same repository gh would push to. The ruleset targets `~DEFAULT_BRANCH`, so no branch name is read or stored, and renaming the default branch keeps it working.
3. **Find, compare, write.** `GET repos/<repo>/rulesets` lists rulesets; the one named `specfold-gate` with `source_type: Repository` is ours. Its full form (`GET …/rulesets/<id>`) is reduced to the fields Specfold sets (name, target, enforcement, bypass actors, conditions, rules with their type and the status-check parameters) and compared with the desired ruleset. Equal: nothing is written. Different: `PUT …/rulesets/<id>`. Missing: `POST …/rulesets`. Bodies go in on stdin (`--input -`).
4. **The check is pinned to GitHub Actions** (`integration_id` 15368), as in the kit's own ruleset, so a status from another app with the same name can't satisfy it.
5. **Errors keep GitHub's words.** A refused call (403 without admin rights, the plan message for private repositories on GitHub Free, 404) becomes the reason line, followed by fixed manual steps. `gate require` turns that into exit 2; init into a skipped step with exit 0.
6. **Routing inside `gate`.** `gate` takes no positionals today, so `gate require` is the first positional. `--base` stays required for the plain gate only, and `--dry-run` joins the shared option list; using `--dry-run` without `require`, or gate-only options with it, is a usage error.
7. **Doctor reads, never writes.** D7 asks `gh api repos/<repo>/rules/branches/<default>` for the active rules on the default branch (this covers every ruleset, ours or the team's) and looks for a required status check named `specfold-gate`. Any gh failure, a missing gh or a timeout makes D7 `ok` with "skipped", so doctor still works offline. It uses doctor's existing `exec` hook, with its 10-second timeout.

## Risks / Trade-offs

- **Classic branch protection is invisible to D7.** A repository that requires the check through classic protection gets a warning. The fix it names (`gate require`) is harmless there, and the rules API is the one GitHub develops further.
- **A team that edits the ruleset `specfold-gate`** gets it reset on the next `gate require`. The name says whose it is, and the team's own rules belong in their own rulesets.

## Commitments

None open.
