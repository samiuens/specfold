## Wish

Skills are written once, in `.agents/skills/`, and every agent tool finds them. Claude Code does not read `.agents/skills/`, so one command links each skill into `.claude/skills/` (and any other tool folder a repo lists), without fighting skills other tools generated there.

## Decisions

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| Q1 | Symlinks or copies? | Relative symlinks, committed to git | user |
| Q2 | What happens to a real folder of the same name in a target? | It is left alone and reported as kept | user |
| Q3 | How does the kit get the shipped sf-* skills? | A byte-identical copy of `template/.agents/skills/sf-*`, checked in CI, then linked by agents sync | user |

## Out of scope

- A doctor check for symlink support on Windows.
- Linking agent definitions (`.claude/agents/`), which are Claude Code only.

## Open questions

none

## Confirmation

confirmed_by: human:samiuens
confirmed_at: 2026-10-26T15:12:27+01:00
