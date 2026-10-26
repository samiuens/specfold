---
type: Reference
title: opencode skills
description: Where opencode reads agent skills, its SKILL.md name and description rules, and how skills load, as documented on 2026-10-26.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T16:32:17+01:00 }
stale_after: 2026-11-25T00:00:00+01:00
sources:
  - id: skills
    resource: https://opencode.ai/docs/skills/
---

# Summary

- **Locations.** Project skills are read from `.opencode/skills/<name>/SKILL.md`, `.claude/skills/<name>/SKILL.md` and `.agents/skills/<name>/SKILL.md`, walking up from the working directory to the git worktree root. Global skills live in `~/.config/opencode/skills/`, `~/.claude/skills/` and `~/.agents/skills/`.[^skills]
- **Frontmatter.** `name` and `description` are required; `license`, `compatibility` and `metadata` are optional, and unknown fields are ignored.
- **Name rules.** `name` has 1-64 characters, matches `^[a-z0-9]+(-[a-z0-9]+)*$` and must equal the folder name.
- **Description length.** `description` has 1-1024 characters, the tightest limit among the tools Specfold supports, so `scripts/check-skills.mjs` enforces it.
- **Loading.** Skills load on demand through the native `skill` tool, which lists each skill's name and description; `opencode.json` permissions can allow, ask for or deny skills per name.
- **Open points.** The docs do not say whether symlinked skill folders work. opencode reads `.agents/skills/` directly, so Specfold's links in `.claude/skills/` are not needed for it. Whether the same skill showing up in both folders causes duplicates is still open: in the M3 sample run the environment set `OPENCODE_DISABLE_CLAUDE_CODE`, which makes opencode skip `.claude/` folders. The skills came through `.agents/skills/`, so no skill appeared twice and the sf skills worked.

[^skills]: https://opencode.ai/docs/skills/

# Related

- [Claude Code features Specfold relies on](/references/claude-code.md)
- [Agent layer](/architecture/agent-layer.md)
