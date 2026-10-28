# Design

## Context

- **Claude Code subagents** (checked 2026-10-28 with 2.1.310):
  - frontmatter: `name`, `description`, `tools`, `disallowedTools`, `model`, `effort`, `maxTurns`, `skills`, `hooks`, `isolation: worktree`, `background`;
  - `Agent(a, b)` in `tools` restricts spawning only for a main-session agent;
  - a Bash pattern in `disallowedTools` removes all of Bash;
  - subagent-scoped hooks are allowed;
  - hook commands keep `$CLAUDE_PROJECT_DIR` at the main checkout even in a worktree;
  - `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` defaults to 3 layers, and 1 disables nesting;
  - a worktree subagent's result reaches the parent only through its final message, so the implementer reports its branch there.
- **Existing code:**
  - `parseTasks` (`src/tasks/parse.ts`);
  - `parseSpecs` (`src/trace/specs.ts`) locates scenarios with spec file and line;
  - `splitSections` (`src/change/brief.ts`) splits a brief;
  - `OWN_CHECKS` (`src/hooks/run.ts`) registers hook names;
  - T7 warns about task groups whose `agent` has no file in `.claude/agents/`.
- **Copies:** the kit and the sample app copy the template's skills, agents and settings, and CI compares them; for the kit's agents, today it compares only `planner.md`.

## Goals / Non-Goals

**Goals:** every hand-off is deterministic text; an implementer can neither push, spawn nor quietly widen its scope; the same flow works sequentially at a limit of 1.

**Non-Goals:** `integrator` and `plan-critic` (backlog); agent teams; the proof run.

## Decisions

- **`specfold tasks packet <change> <group> [--json]`** in `src/tasks/packet.ts`, as a second `tasks` subcommand. The text packet:
  - `# Task packet: <change>, group <n>. <name>`;
  - `## Tasks`, each with its `Done when:` line;
  - `## Files you own` and `## Depends on`;
  - `## Scenarios`: each id with the lines from its `#### Scenario:` heading up to the next heading, from the change's delta specs, else the main specs, else "unknown";
  - `## Wish` and `## Decisions` from `brief.md`;
  - `## Knowledge`: the bundle-absolute links in `proposal.md` (`](/<folder>/<name>.md)`), as `knowledge/...` paths;
  - `## Rules`: one commit per task with `Task: <change>#<n>.<m>`, only the owned files, a split proposal instead of widening.

  An unknown change, or a group number not in `tasks.md`, is a `UsageError`, with the existing groups named for the latter.
- **`claude-no-push`** in `src/hooks/claude.ts`, registered in `OWN_CHECKS`:
  - reads the event JSON from stdin and splits `tool_input.command` on `&&`, `||`, `;`, `|` and newlines;
  - a segment whose words start with `git push` (also after `git -C <dir>` or `env ...`) or `gh pr` exits 2 with "pushing and pull requests are the orchestrator's job; return your branch name instead";
  - any other event exits 0 silently.
- **Roles** in `template/.claude/agents/`, each with `maxTurns`:

  | File | Model, effort | Tools | Isolation | Skills | maxTurns |
  | --- | --- | --- | --- | --- | --- |
  | `scout.md` | haiku, low | Read, Grep, Glob, Bash | none | sf-lookup | 20 |
  | `spec-writer.md` | opus, high | Read, Grep, Glob, Bash, Write, Edit | none | sf-lookup | 60 |
  | `implementer.md` | sonnet, medium | `disallowedTools: Agent` | worktree | sf-lookup | 80 |
  | `verifier.md` | opus, high | Read, Grep, Glob, Bash | none | none | 40 |
  | `knowledge-curator.md` | sonnet, medium | Read, Grep, Glob, Bash, Write, Edit | none | sf-sync, sf-capture, sf-audit | 40 |

  - The implementer's frontmatter hook is PreToolUse with matcher `Bash`, running `cd "$CLAUDE_PROJECT_DIR" && node scripts/specfold.mjs hook claude-no-push`.
  - Each prompt names its inputs, its limits (read-only roles change no file) and the shape of its final message: the scout answers in at most 30 lines; the implementer reports branch, commits and test result, or `SPLIT PROPOSAL:` with the task, the files it needs and a proposed new group; the verifier reports `PASS` or numbered findings.
- **Skill `sf-apply`** in `template/.agents/skills/sf-apply/`:
  1. check `specfold tasks check`, `specfold status` and `specfold parallel show`;
  2. work from the change branch;
  3. dispatch every open group whose `depends` are merged, as background `implementer` subagents up to the limit, each with its `specfold tasks packet` output verbatim;
  4. merge each returned branch with `git merge --no-ff`, run `specfold index`, and ask the user on a conflict outside generated files;
  5. on a split proposal, have `spec-writer` update `tasks.md`, ask the user when scope changes, rerun `tasks check`, then dispatch again;
  6. run `verifier`, sending its findings back only to the affected group;
  7. archive, then `knowledge-curator` for `sf-sync`.

  At a limit of 1 the same steps run one group at a time. The skill also names pattern 1 (`specfold wt plan`, one session per change), pattern 3 (`/batch` in a `skip_specs` change) and agent teams staying off. A reference file `references/packet-and-split.md` holds the split-proposal format.
- **Settings:** `"env": { "CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH": "1" }` in the template's `.claude/settings.json`, merged into existing settings by `migrate install` since `add-specfold-wt`.
- **Copies and CI:**
  - the kit gets all agents, the skill and the settings;
  - the sample app gets the agents, skill and settings it already mirrors;
  - `agents sync` links `sf-apply` in all three;
  - CI compares the kit's whole `.claude/agents/` with the template's;
  - the template manifest is regenerated.

## Risks / Trade-offs

- [A model alias changes meaning over time] → aliases (`haiku`, `sonnet`, `opus`) follow Claude Code's current models; a team pins full ids in its own copy.
- [The no-push hook misses a disguised push, such as one built from variables] → it is a guard against slips, not a sandbox; the orchestrator still reviews every branch before merging.

## Commitments

none
