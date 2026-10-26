# Design

## Context

The CLI core, `validate` and `index` exist; `log add` is in review. `new` is the first command that writes a concept. Its output has to pass the profile, apart from the fields the author deliberately has to fill.

## Goals / Non-Goals

**Goals:**
- `specfold new` as specified, writing frontmatter in one fixed, readable shape.
- Built-in templates for the 13 default types, overridable by files the `sf-capture` skill will ship in M3.

**Non-Goals:**
- Filling the body (`sf-capture`).
- Running `specfold index` afterwards.

## Decisions

**Confirmed open points:**
- The default actor is `<agent_prefix><SPECFOLD_MODEL>`, else `process:specfold-new`.
- `description` starts empty.
- `Decision` gets `decision: accepted` and `sources: []`.
- `Runbook` and `Interface` get `stale_after` 90 days out.
- An existing file is never overwritten (exit 1).
- Override placeholders: `{{type}}`, `{{title}}`, `{{description}}`, `{{by}}`, `{{now}}`.

**Frontmatter rendering:**
- Frontmatter is written as text in a fixed key order: `type`, `title`, `description`, `status`, type-specific keys, `generated`, `sources`.
- Scalars stay plain when that is safe in YAML, and are written double-quoted otherwise: empty values, a leading special character, `: ` or ` #`, words like `true` or `null`.
- `generated` is written in flow style (`{ by: …, at: … }`), as in the kit's own concepts.

**Timestamps:** the local time with its UTC offset (`2026-10-26T14:00:00+01:00`), without milliseconds.

**Type to template file:** the type in lowercase, with spaces as hyphens. `Business Rule` becomes `business-rule.md`.

**Built-in bodies:** headings only; the author or `sf-capture` fills them.

| Type | Headings |
| --- | --- |
| Term | Meaning, Not to be confused with, Related |
| Business Rule | Rule, Why, Related |
| Component | Responsibility, Interfaces, Related |
| Data Flow | Flow, Related |
| Interface | Contract summary, Consumers, Related |
| Decision | Decision, Why, Rejected alternatives, Related |
| Capability | Why, Related |
| Convention | Convention, Why, Related |
| Runbook | When to use, Steps, Verify, Related |
| Reference | Summary, Related |
| Vision | Goals, Non-goals, Principles |
| Deferred Commitment | Commitment, Trigger, Related |
| Backlog Item | Idea, Related |
| any other configured type | Summary, Related |

**Configuration:** `Config` gains `agentPrefix` (`actors.agent_prefix`, default `""`).

**Modules:**
- `src/new/templates.ts`: bodies, override lookup, placeholders.
- `src/new/command.ts`: arguments, frontmatter, write.

## Risks / Trade-offs

- Built-in bodies are opinions. Repos change them by adding override files, so the CLI defaults never need to change.
