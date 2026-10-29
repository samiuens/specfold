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
- The lockup SVGs carry the wordmark as outlines, so they look right without IBM Plex Sans installed (for example in the GitHub README).

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

House style **Blocks with flow**: solid blocks laid out as a flow chart, with thin labelled edges and one vermilion block. The README diagrams in `diagrams/` are the reference; `diagrams/build.mjs` builds them (`node brand/diagrams/build.mjs`), so add new diagrams there.

- **Title:** one sentence at the top left that says what the diagram shows, IBM Plex Sans SemiBold 15 px.
- **Steps:** solid blocks with square corners. Ink with paper text on light, paper with ink text on dark.
- **Stores** (folders, files, branches): the same box as a 2 px ink outline with ink text.
- **Decisions:** a solid diamond with a short question ending in `?`. Label its outgoing edges (`yes`, `no`, `PASS`).
- **One emphasis:** exactly one vermilion block per diagram, the thing the diagram is about. Text on it is `on-accent` at full opacity.
- **Labels:** centred. The name in IBM Plex Sans SemiBold 14 px, then up to two JetBrains Mono detail lines (11 px, 75% opacity) of a few words each. Number the steps of a sequence (`1 Interview`).
- **Edges:** 1.5 px in the muted colour (`#5E5A52` light, `#A39D90` dark) with a small solid arrowhead. Straight, right-angled lines only; fan-outs and joins meet on a shared spine. Edge labels in JetBrains Mono 11 px, muted.
- **Size:** 880 px wide, the width of a GitHub README column, on an 8 px grid. Blocks are 56 px high; keep one width per row.
- **Background:** the page colour, `#F6F3EC` light and `#151412` dark. No shadows, gradients, icons or emoji.
- **Files:** every diagram ships as `<name>-light.svg` and `<name>-dark.svg` with a `<title>` and `<desc>`, and keeps its text as live text. Where IBM Plex is missing, the viewer's system sans and mono take over.

Embed both in Markdown so GitHub follows the reader's theme:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="brand/diagrams/workflow-dark.svg">
  <img alt="Knowledge flows into every change and comes back after archive" src="brand/diagrams/workflow-light.svg" width="880">
</picture>
```

## Social preview

`social/github-social-preview-1280x640.png` is the repository's GitHub social preview (Settings → General → Social preview). Its source is the SVG next to it. To rebuild the PNG with IBM Plex Sans and JetBrains Mono installed: `rsvg-convert social/github-social-preview-1280x640.svg -o social/github-social-preview-1280x640.png`. GitHub accepts files under 1 MB.

## CLI

In the terminal, use the terminal's own green, yellow and red for ok/warn/error, so themes keep working. Use vermilion (`#F08A5D` on dark) only for highlights such as matched lookup terms.
