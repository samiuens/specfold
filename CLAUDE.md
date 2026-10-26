@AGENTS.md

## Claude Code

- Slash commands: `/opsx:explore`, `/opsx:propose`, `/opsx:apply`, `/opsx:archive`, `/opsx:sync`, `/opsx:update`.
- Skills live in `.claude/skills/`; Claude Code does not read `.agents/skills/` (see `/references/claude-code.md`).
- Ask with `AskUserQuestion`: up to 4 questions per call, one decision each, recommended option first.
- Commit co-author trailer: `Co-Authored-By: Claude <noreply@anthropic.com>` (no model name); format in AGENTS.md section 7.
