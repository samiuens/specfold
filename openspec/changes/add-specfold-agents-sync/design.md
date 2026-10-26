# Design

## Context

Claude Code reads skills only from `.claude/skills/`; other tools read `.agents/skills/`. The skills CLI behind skills.sh uses the same layout (one copy in `.agents/skills/`, symlinks per agent folder).

## Goals / Non-Goals

**Goals:** one planning step that compares the skills with each target folder and yields actions, shared by `--check` and the real run.

**Non-Goals:** copying skills, linking agent definitions, Windows-specific fallbacks.

## Decisions

- **Module `src/agents/`:** `sync.ts` (plan and apply links), `command.ts` (`agents sync`).
- **Own links** are detected lexically: the link target, resolved against the link's folder, lies inside `<root>/.agents/skills/`. No `realpath`, so a repository reached through a symlinked path still compares consistently.
- **Targets** must be relative paths inside the repository (no `..` segment, not absolute). Anything else is a configuration error (exit 2).
- **Order:** skills and targets are processed in sorted order, so output and links are deterministic.
- **Failures:** `symlinkSync` errors stop the run with an environment error naming the path; links made before the failure stay, and a rerun completes the rest.

## Risks / Trade-offs

- [Git on Windows without symlink support checks links out as text files] → those become "kept" files, never overwritten; a doctor check can come later.
