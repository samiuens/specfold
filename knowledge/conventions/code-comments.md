---
type: Convention
title: The kit follows the shipped code-comment convention
description: The kit's own code follows the code-comment convention it ships in template/; points to the shipped concept.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T14:42:41+01:00 }
sources:
  - id: shipped
    resource: ../../template/knowledge/conventions/code-comments.md
    title: "Code comments point to knowledge (template)"
---

# Convention

The kit's TypeScript and scripts follow the same rule the template ships to user repos: comments stay short, and rationale, history and rejected alternatives live in `knowledge/`, referenced with `// see knowledge: /<path>.md`. The convention's full text lives once, in `template/knowledge/conventions/code-comments.md` (linked as the source), so it is not repeated here.

The kit's `source_globs` cover the CLI source, the build script, `scripts/` and the template's top-level and `openspec/` files. Template knowledge is left out, so the convention's example reference is not read as kit code.

# Why

Keeping one text means the kit cannot drift away from what it asks of its users ([self-hosting](/decisions/self-hosting.md)).

# Related

- [TypeScript style](/conventions/typescript-style.md)
