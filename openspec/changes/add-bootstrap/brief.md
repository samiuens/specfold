## Wish

Both entry points work: `BOOTSTRAP.md` is one paste-able prompt that fetches a pinned kit snapshot with `gh` and starts `sf-migrate` in any agent, and `specfold init` sets up a repo that started from the template (or an empty repo) with detected values and no prompts.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | Is `specfold init` built in M6? | Yes, in this change; it shares install's code from `add-specfold-migrate`: fills `specfold.yaml` and the config context, runs `openspec init`, `specfold agents sync` and `specfold hooks install` | user |
| Q2 | How does init get its values? | Detected from package files and the git remote (stack, source globs, owner/repo); flags override (`--stack`, `--source-glob`, `--tools`); no prompts; it prints what it filled, and `--dry-run` shows it first. Agents ask the user, then pass flags | user |
| Q3 | Which ref does `BOOTSTRAP.md` pin before v0.1.0? | A full commit sha of `samiuens/specfold`; the M9 release job replaces it with `vX.Y.Z` | user |
| Q4 | How does `BOOTSTRAP.md` fetch the kit while the repo is private? | The repo tarball at the pinned ref through the user's `gh` login, unpacked into a temporary folder; its `template/` is the folder `install --from` takes | user |
| Q5 | Which agent tools are set up by default? | `agents` and `claude`; `--tools agents` leaves out the Claude Code files | user |

## Out of scope

- Release assets, the template repo sync and the upgrade workflow (M9).
- The question about the parallel subagent limit (M8).

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-27T11:55:33+01:00
