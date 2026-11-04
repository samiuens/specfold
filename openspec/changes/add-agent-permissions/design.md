## Context

See proposal.md (Why). Today the kit writes three things into `.claude/settings.json`: a `permissions.deny` list of read barriers, the hooks, and env values.
- `migrate install` merges them in.
- `upgradeSettings` in `tools/specfold/src/upgrade/config.ts` updates them three ways. Its permission handling covers only `permissions.deny`.
- graphify setup adds its own hook when `.claude/skills` is a target.

`specfold agents sync` (`src/agents/`) is the model for a sync command with `--check`. Settings are read in `src/repo.ts`. The upgrade follow-up commands live in `src/upgrade/command.ts` (`followUps`).

## Goals / Non-Goals

**Goals:**
- One pure function maps the `permissions` setting to the rule patterns and their lists.
- The sync, D8, init, migrate and upgrade all use that function.
- The rules land in the same place on every run, and the team's own rules are never touched.

**Non-Goals:**
- Parsing shell commands.
- Rules for other tools.
- Any change to the existing read-barrier deny list.

## Decisions

1. **The module has three parts.** It lives in `src/permissions/` (`actions.ts`, `render.ts`, `command.ts`):
   - `actions.ts` holds the action table (name, parent, patterns) and the patterns that earlier releases generated and later dropped (`retired`).
   - `render.ts` validates the setting and turns it into a desired state, `{ allow, ask, deny }`. It then applies that state to a parsed settings object and returns the changes. No I/O happens in either step.
   - `command.ts` reads `specfold.yaml` and `.claude/settings.json`, runs those two steps, writes, and prints.

   D8 calls `render.ts` directly instead of starting a child process. This matches how D7 reuses the gate's logic.

2. **Ownership is the set of patterns.** The sync owns the current patterns of every action plus the `retired` list.
   - A retired pattern is removed from all three lists.
   - Each current pattern is removed from the two lists it does not belong in. It is appended to the end of its own list if it is missing there.
   - A pattern that is already in the right list keeps its place.

   So a rerun changes nothing, and foreign rules keep their order. Tracking rules in the manifest was rejected in the brief (Q8): it adds state and gains nothing, because the patterns are fixed strings.

3. **Precedence explains the sub-action rule.** Claude Code checks `deny` first, then `ask`, then `allow`. Every sub-action pattern also starts with `git push`, so the `push` prefix rule matches every force push, delete and tag push. If a sub-action were looser than `push`, the `push` rule would still win, and the setting would claim something that never takes effect. That is why such a setting is invalid instead of a warning (brief Q11).

4. **Draft pattern table.** Task 1.1 confirms it against Claude Code's permission docs: whether `:*` or a space-separated `*` is the current prefix form, and whether `*` may appear in the middle of a rule. The spec only names one example pattern per action, so changing the table does not change the spec.

   | Action | Patterns (draft) |
   | --- | --- |
   | `push` | `Bash(git push:*)` |
   | `force-push` | `Bash(git push --force:*)`, `Bash(git push -f:*)`, `Bash(git push --force-with-lease:*)`, `Bash(git push * --force*)`, `Bash(git push * -f*)`, `Bash(git push * +*)` |
   | `delete-remote-branch` | `Bash(git push --delete:*)`, `Bash(git push -d:*)`, `Bash(git push * --delete*)`, `Bash(git push * -d *)`, `Bash(git push * :*)` |
   | `push-tags` | `Bash(git push --tags:*)`, `Bash(git push --follow-tags:*)`, `Bash(git push * --tags*)`, `Bash(git push * --follow-tags*)` |
   | `open-pr` | `Bash(gh pr create:*)` |
   | `merge-pr` | `Bash(gh pr merge:*)`, `Bash(gh api * pulls/*/merge*)` |
   | `close-pr` | `Bash(gh pr close:*)`, `Bash(gh api * pulls/* * state=closed*)` |

   If Claude Code cannot match in the middle of a rule, keep only the prefix forms. Then record in the knowledge concept which forms stay uncovered.

5. **Ordering inside a list.** Patterns are appended in the order of the action table, so the rendered output does not depend on the order of keys in `specfold.yaml`.

6. **The template ships the rendered defaults.** `template/.claude/settings.json` holds the default rules in `permissions.ask`, so a repository created from the template is in sync even before init runs.
   - A test renders `template/specfold.yaml` and compares the result with the template's settings file.
   - The kit's own `.claude/settings.json` is synced by running the command, not edited by hand.

7. **The merges stay out of the owned patterns.**
   - `upgradeSettings` already updates only `permissions.deny`, and neither the template nor its base has owned patterns there. The change adds an explicit filter that drops owned patterns from `wanted` and `dropped`, so a later template can't move them by accident.
   - The migrate merge copies the template's `permissions` block only when the repository has none. In both cases the sync runs afterwards and settles the lists.

8. **Where the commands run.**
   - init adds `permissions sync` after `agents sync` (and to the step list of `--dry-run`).
   - migrate install calls the sync function after the settings merge. Problems join the install's conflict list, so install exits 1 after installing the rest.
   - upgrade adds `["permissions", "sync"]` to its follow-ups, after `agents sync`.

9. **Wording in AGENTS.md.** Both the template block and the kit's section 5 get the fixed sentence. The sentence about the PR becomes: "Each milestone or feature ends with a PR for review; pushing and opening it follow `permissions` in `specfold.yaml` (by default: ask the user first)." The kit's line has to stay under the G11 budget for `AGENTS.md`.

## Risks / Trade-offs

- **[Risk] Prefix rules can be bypassed.** Examples are `git -C . push`, aliases, scripts and `gh api` forms the table doesn't list. → The `AGENTS.md` sentence is the contract. The decision concept records that the rules are best effort (brief Q15).
- **[Risk] A pattern written too broadly could match commands the user didn't mean**, such as `git push * :*` matching a refspec with a colon used for a normal push. → Task 1.1 checks the matching rules. Tests cover one command that should match and one that should not for each sub-action pattern, using a small matcher that follows the documented semantics.
- **[Trade-off] A team that writes one of the owned patterns by hand into another list** gets it moved by the next sync. → The capability card names the owned patterns, and the change output shows every move.
- **[Risk] Upgrades.** A future release that changes a pattern must add the old one to `retired`. Otherwise the old rule is left behind. → A comment in `actions.ts` points to the capability card. A test checks that `retired` and the current patterns don't overlap.

## Migration Plan

Repositories that install the next release get the default rules (`ask` for all) through upgrade's follow-up sync. The release's upgrade notes tell the agent to say this to the user, and to point at `permissions` in `specfold.yaml` for anyone who wants `allow`. To roll back, set every action to `allow`, or remove the rules after a downgrade, because the older sync doesn't know them.

## Commitments

none
