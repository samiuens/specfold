---
type: Decision
title: "The brand is Ink & Vermilion"
description: "Specfold's visual identity: warm paper, near-black ink, one vermilion accent, a two-sheet mark, IBM Plex Sans and JetBrains Mono; kit only."
status: draft
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-29T17:41:23+01:00 }
sources:
  - id: brand-kit
    resource: ../../brand/README.md
    title: Specfold brand kit
---

# Decision

Specfold's visual identity is the direction "Ink & Vermilion": warm paper (`#F6F3EC`), near-black ink (`#1C1B19`) and a single vermilion accent (`#C2410C`, `#F08A5D` on dark), with a muted teal as a rare second hue. The mark is two offset sheets, a vermilion one behind an ink one. Type is IBM Plex Sans with JetBrains Mono for code. Status colours follow the OKF trust flags stable, draft, stale and deprecated.

Diagrams use the house style "Blocks": solid ink blocks, heavy straight arrows and one vermilion block for the outcome, shipped as light and dark SVGs. The GitHub social preview is the dark "Ink" banner with the headline "Specs and knowledge, folded into one." and the subtitle "One agent workflow for any repo."

The kit lives in `brand/` at the repo root (logos, `tokens.json`, `tokens.css`, diagram reference, social preview, `preview.html`) and is kit only, like `examples/`; `template/` never receives it.

The user chose this direction on 2026-10-29 from a preview of three, built with the `ui-ux-pro-max` skill.

# Why

The user asked for no AI-typical colours such as purple. A paper-and-ink look matches a tool about written specs and knowledge, and one accent keeps attention on a single action. The two sheets show specs and knowledge as two sources kept in one bundle, which is what the name says (see [naming](/decisions/naming-specfold.md)). The user picked the mark on 2026-10-29 from five options; it is the simplest shape and the strongest as an app icon.

# Rejected alternatives

- **Gate Green**: dark slate with a run-green accent, the skill's database pick for developer tools; rejected as too close to many existing dev-tool brands.
- **Forest & Ochre**: forest green and ochre on cream with a Newsreader serif; rejected in favour of the sharper ink look.
- **Other diagram styles**: thin outlined cards ("Line") and outlined cards with a sheet behind each ("Sheets").
- **Other social previews**: a light editorial banner and a light banner carrying the full change loop; and the subtitle "OKF knowledge + OpenSpec · one agent workflow · a CI gate", which the user turned down.
- **Other marks**: a sheet with a folded corner (the first draft), an accordion strip, a booklet opened at the crease, a ribbon folded into an S, and an `sf` monogram.

# Related

- [The framework is called Specfold](/decisions/naming-specfold.md)
