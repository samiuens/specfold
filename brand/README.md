# Specfold brand kit

Direction **Ink & Vermilion**: warm paper, near-black ink and one signal colour. Kit repo only; never copy it into `template/`. Open `preview.html` in a browser to see everything together.

## Logo

The mark is two sheets, a vermilion one behind an ink one, offset like a stack of documents: specs and knowledge, two sources in one bundle.

| File | Use |
| --- | --- |
| `logo/mark.svg` | mark on light backgrounds |
| `logo/mark-inverse.svg` | mark on dark backgrounds |
| `logo/lockup.svg` | mark + wordmark on light backgrounds |
| `logo/lockup-inverse.svg` | mark + wordmark on dark backgrounds |
| `logo/app-icon.svg` | square icon, avatars, favicons |

- The wordmark is always lowercase `specfold`, IBM Plex Sans Bold, tracking -2%.
- Keep clear space of at least the sheets' offset (a sixth of the mark) around the mark.
- Smallest size: 16 px for the mark, 96 px wide for the lockup.
- Don't recolour, rotate, outline or add shadows or gradients. The back sheet is the only vermilion element; the front sheet is always ink on light and paper on dark.
- The lockup SVGs use live text. Outline the text before using them where IBM Plex Sans may be missing.

## Colour

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| background | `#F6F3EC` paper | `#151412` | page |
| foreground | `#1C1B19` ink | `#EDE8DC` | body text |
| card | `#FFFFFF` | `#201F1C` | raised surfaces |
| muted-foreground | `#5E5A52` stone | `#A39D90` | secondary text |
| border | `#DDD7CA` rule | `#3A3833` | dividers |
| primary / on-primary | `#1C1B19` / `#F6F3EC` | `#EDE8DC` / `#151412` | main buttons |
| accent / on-accent | `#C2410C` vermilion / `#FFFFFF` | `#F08A5D` / `#1C1B19` | one call to action per view, focus ring |
| secondary / on-secondary | `#2F6F6A` teal / `#FFFFFF` | `#6FB3AC` / `#151412` | rare second hue, for example charts |
| link | `#A3360A` | `#F08A5D` | inline links, underlined |

Status colours match the OKF trust flags:

| Status | Light | Dark |
| --- | --- | --- |
| stable | `#2F7A4F` | `#6BBF8A` |
| draft | `#5E5A52` | `#A39D90` |
| stale | `#8A5E00` | `#E0B04A` |
| deprecated | `#B42318` | `#F07A6A` |

Every text pair above meets WCAG AA (4.5:1) on its background and on `card`. Status must never be shown by colour alone: always print the word or use an icon.

No purple, violet or blue-to-purple gradients anywhere.

## Type

- **IBM Plex Sans** 400/500/600/700 for headings, body and UI. Base size 16 px, line height 1.5.
- **JetBrains Mono** 400/500/700 for code, CLI output, file paths and small uppercase labels.

## Tokens

`tokens.json` is the source of truth; `tokens.css` mirrors it as `--sf-*` custom properties with light, dark (`prefers-color-scheme`) and `data-theme` overrides. Change both together.

## Diagrams

House style **Blocks**: solid blocks, heavy arrows, one vermilion block. Reference: `diagrams/example-change-loop-light.svg` and `-dark.svg`.

- **Blocks:** square corners, no outlines. Fill ink with paper text on light, paper with ink text on dark.
- **One emphasis:** exactly one block in vermilion, the outcome the diagram leads to (for example the gate). Text on it is `on-accent` at full opacity.
- **Labels:** a small JetBrains Mono line on top (step number or kind, 12 px, 75% opacity), the name in IBM Plex Sans Bold 19 px, and an optional JetBrains Mono detail line (11 px, 75% opacity). At most three words per detail line.
- **Arrows:** 3 px ink (paper on dark) with a solid triangular head. Straight lines only, left to right or top to bottom; no curves, no diagonals.
- **Grid:** 8 px. Blocks 164 × 96, gaps 32, outer padding 24 horizontally and 32 vertically. Wider blocks are fine when a name needs it; keep one width per row.
- **Background:** the page colour, `#F6F3EC` light and `#151412` dark. No shadows, gradients, icons or emoji.
- **Files:** every diagram ships as `<name>-light.svg` and `<name>-dark.svg` with a `<title>`, and keeps its text as live text. Where IBM Plex is missing, the viewer's system sans and mono take over.

Embed both in Markdown so GitHub follows the reader's theme:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="brand/diagrams/change-loop-dark.svg">
  <img alt="The change loop: plan, apply, check, archive, sync, then the gate" src="brand/diagrams/change-loop-light.svg">
</picture>
```

## CLI

In the terminal, use the terminal's own green, yellow and red for ok/warn/error, so themes keep working. Use vermilion (`#F08A5D` on dark) only for highlights such as matched lookup terms.
