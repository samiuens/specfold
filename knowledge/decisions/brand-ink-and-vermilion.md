---
type: Decision
title: "The brand is Ink & Vermilion"
description: "Specfold's visual identity: warm paper, near-black ink, one vermilion accent, a folded-sheet mark, IBM Plex Sans and JetBrains Mono; kit only."
status: draft
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-29T17:41:23+01:00 }
sources:
  - id: brand-kit
    resource: ../../brand/README.md
    title: Specfold brand kit
---

# Decision

Specfold's visual identity is the direction "Ink & Vermilion": warm paper (`#F6F3EC`), near-black ink (`#1C1B19`) and a single vermilion accent (`#C2410C`, `#F08A5D` on dark), with a muted teal as a rare second hue. The mark is a sheet with its corner folded over. Type is IBM Plex Sans with JetBrains Mono for code. Status colours follow the OKF trust flags stable, draft, stale and deprecated.

The kit lives in `brand/` at the repo root (logos, `tokens.json`, `tokens.css`, `preview.html`) and is kit only, like `examples/`; `template/` never receives it.

The user chose this direction on 2026-10-29 from a preview of three, built with the `ui-ux-pro-max` skill.

# Why

The user asked for no AI-typical colours such as purple. A paper-and-ink look matches a tool about written specs and knowledge, and one accent keeps attention on a single action. The folded corner shows the spec and the knowledge as one object, which is what the name says (see [naming](/decisions/naming-specfold.md)).

# Rejected alternatives

- **Gate Green**: dark slate with a run-green accent, the skill's database pick for developer tools; rejected as too close to many existing dev-tool brands.
- **Forest & Ochre**: forest green and ochre on cream with a Newsreader serif; rejected in favour of the sharper ink look.

# Related

- [The framework is called Specfold](/decisions/naming-specfold.md)
