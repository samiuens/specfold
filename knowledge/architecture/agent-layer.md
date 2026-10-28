---
type: Component
title: Agent layer
description: The sf skills, the planner agent, and how skills reach each tool through .agents/skills and specfold agents sync.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T16:02:15+01:00 }
sources:
  - id: skills
    resource: ../../template/.agents/skills/sf-interview/SKILL.md
  - id: planner
    resource: ../../template/.claude/agents/planner.md
---

# Responsibility

The agent layer tells agents when to call the CLI and what to write around it. It never re-implements a check: every deterministic step is a `specfold` or `openspec` command ([deterministic CLI](/decisions/deterministic-cli.md)).

| Piece | Where | Job |
| --- | --- | --- |
| `sf-lookup` | skill | `specfold lookup`, read the 1-3 best concepts, report trust flags including `drift`, keep the vision and open commitments in view |
| `sf-capture` | skill | `specfold new`, write the body and sources, index, log, validate; rejected proposals become Decisions |
| `sf-sync` | skill | after archive: `specfold sync`, fill stubs, validate, fulfill a delivered commitment after asking, then the retro |
| `sf-audit` | skill | `specfold audit --json`, propose fixes; humans verify |
| `sf-interview` | skill | the planning interview: ground, design tree plus the interview checklist, native questions, never a timeout as consent, out-of-scope items offered as backlog items or commitments, brief only after approval ([rather ask than assume](/decisions/rather-ask-than-assume.md)) |
| `sf-plan` | skill | the planner's steps for tools without agent definitions |
| `sf-migrate` | skill | brings an existing repository in on `specfold/migration`: resume with `migrate status`, inventory, a mapping plan the user approves (stating their login), `migrate install`, conversion into draft concepts with sources, a capped seed from code, validation and a report; asks before pushing |
| `sf-apply` | skill | the orchestrator in the main session: one `implementer` per task group with its `specfold tasks packet`, parallel up to the personal limit, merges into the change branch, split proposals through `spec-writer` and the user, then `verifier`, archive and `knowledge-curator` |
| `planner` | `.claude/agents/planner.md` | Claude Code main session in plan mode: interview, plan approval via `ExitPlanMode`, then the change artifacts |
| `scout` | `.claude/agents/scout.md` (haiku, low) | read-only: answers one question from knowledge, graph and specs in at most 30 lines |
| `spec-writer` | `.claude/agents/spec-writer.md` (opus, high) | writes and revises one change's artifacts, including `tasks.md` for a split proposal; returns open questions instead of deciding |
| `implementer` | `.claude/agents/implementer.md` (sonnet, medium, `isolation: worktree`) | one task group from its packet: `wt setup`, one commit per task, ends with `DONE` and its branch or `SPLIT PROPOSAL`; cannot spawn agents, and a scoped hook refuses `git push` and `gh pr` |
| `verifier` | `.claude/agents/verifier.md` (opus, high) | read-only: tests, `openspec validate`, `change check`, the local gate; `PASS` or findings tied to task groups |
| `knowledge-curator` | `.claude/agents/knowledge-curator.md` (sonnet, medium) | edits only `knowledge/`: the concepts of `knowledge.md`, sf-sync after archive, sf-audit on request |

# Interfaces

- **One source for skills.** Skills are written once in `.agents/skills/`, which opencode, Codex, Cursor and generic agents read. `specfold agents sync` links them into `.claude/skills/` for Claude Code ([specfold agents sync](/capabilities/specfold-agents-sync.md)). The shared frontmatter core is `name` equal to the folder name plus a `description` of at most 1024 characters ([opencode skills](/references/opencode.md)).
- **The planner runs as the main session,** because subagents never get `AskUserQuestion` ([Claude Code](/references/claude-code.md)). It is started with `claude --agent planner --permission-mode plan`, and writes the specs itself or through `spec-writer`.
- **Only the main session spawns.** The template's settings set `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` to `1`, so subagents can't start further agents, and the implementer also lists `Agent` in `disallowedTools`. Claude Code's default is three layers (checked 2026-10-28).
- **Hand-offs are deterministic text.** The orchestrator passes the output of `specfold tasks packet` verbatim, and every role ends with a fixed final-message shape (`DONE`, `SPLIT PROPOSAL`, `PASS`, `FINDINGS`), so the main session reads summaries, never files. A worktree subagent's result reaches the parent only through that message, so the implementer names its branch there.
- **Guarding pushes needs a hook.** A `Bash(git push *)` entry in `disallowedTools` would remove the whole Bash tool, so the implementer's frontmatter runs `specfold hook claude-no-push` as a PreToolUse hook; it is a guard against slips, not a sandbox ([specfold hooks](/capabilities/specfold-hooks.md)).
- **Two roles wait:** `integrator` (the orchestrator merges itself) and `plan-critic` (the tasks check covers the mechanical review) are backlog items ([integrator](/backlog/integrator-subagent-role.md), [plan-critic](/backlog/plan-critic-subagent-role.md)).
- **Shipping.** `template/` holds the canonical skills, planner and roles. The kit runs byte-identical copies, which CI compares with the template ([self-hosting](/decisions/self-hosting.md)).

# Instructions and shipping

- **`AGENTS.md`** (template) holds what every agent needs in every session, in under 60 lines and with no volatile text:
  - rather ask than assume;
  - a map of the repo;
  - the core rule;
  - the lookup order;
  - the workflow with the commands per tool;
  - when OpenSpec is not needed;
  - the knowledge rules, which name the code-comment convention.

  `CLAUDE.md` imports it with `@AGENTS.md` and adds the planner start command, the slash commands and the skills folder ([Claude Code](/references/claude-code.md)).
- **The CLI travels with the template** as `scripts/specfold.mjs`, a copy of the kit's bundle, so every command in the instructions runs without an install. OpenSpec is the one external tool; `specfold doctor` checks its version.
- **Proven on 2026-10-26:**
  - **Claude Code:** on a fresh copy of the sample app, outside the kit so the kit's own instructions don't load, the planner interviewed with native questions, took a correction through plan approval, and wrote `add-priorities`, which passes `change check` ([agent check runbook](/runbooks/sample-app-agent-check.md)).
  - **opencode:** it loaded the sf skills from `.agents/skills/` and answered a lookup through `sf-lookup`.
- **The retro improves the interview.** After every archive, `sf-sync` asks which question came too late and where the agent guessed. Answers go verbatim into `conventions/interview-checklist.md` under topic headings, created on the first real answer, and `sf-interview` adds the matching topics to its design tree. New ideas become backlog items, and every retro (answered or skipped) gets a `Retro` log entry, so a missing one shows in review. Only the user fills the checklist; a timed-out round counts as skipped.
- **Fulfilling is confirmed, not inferred.** A design's `kept` only means a promise was not broken, so `sf-sync` fulfills a commitment only when the brief or proposal names it as delivered and the user confirms ([specfold commitments](/capabilities/specfold-commitments.md)).
- **Proven on 2026-10-26 (M5):** in the sample app, the backlog item "Rename an item" was promoted to `add-rename` and carried through the interview (with one out-of-scope idea kept as a backlog item), propose, apply, archive, sync and the retro. Trace covers every main-spec scenario, and drift flagged the one decision whose referencing code the change touched ([agent check runbook](/runbooks/sample-app-agent-check.md)).
- **Found in that run:** the planner first took the user's login for `confirmed_by` from an earlier brief, and Claude Code's safety check refused to write an approval the user had not stated. The planner, `sf-interview` and `sf-plan` now ask the user to state their login when approving ([rather ask than assume](/decisions/rather-ask-than-assume.md)).
- **Migration needs judgment at one checkpoint.** `sf-migrate` leaves every mechanical step to `specfold migrate` and makes its own calls only in the plan: what each existing source becomes. The user approves that mapping before anything is installed, and a source that turns out to need another target goes back to the user as a plan edit. Two recorded runs in `examples/migrations/` (ADRs and docs; Cursor rules, lefthook and an existing OpenSpec) showed the M6 rules on real fixtures and found three gaps that are now fixed: ADR statuses must map to the decision values validate allows, a pre-existing spec that already fails strict validation is the user's call, and install must keep a conflicting file's manifest hash and pass on the hook manager's next step.

# Related

- [specfold CLI](/architecture/specfold-cli.md)
- [specfold schema](/capabilities/specfold-schema.md)
