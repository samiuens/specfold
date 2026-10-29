# Specfold brand kit

Direction **Ink & Vermilion**: warm paper, near-black ink and one signal colour. Kit repo only; never copy it into `template/`. Open `preview.html` in a browser to see everything together.

## Logo

The mark is a sheet with its corner folded over: the spec (sheet) and the knowledge (fold) as one object.

| File | Use |
| --- | --- |
| `logo/mark.svg` | mark on light backgrounds |
| `logo/mark-inverse.svg` | mark on dark backgrounds |
| `logo/lockup.svg` | mark + wordmark on light backgrounds |
| `logo/lockup-inverse.svg` | mark + wordmark on dark backgrounds |
| `logo/app-icon.svg` | square icon, avatars, favicons |

- The wordmark is always lowercase `specfold`, IBM Plex Sans Bold, tracking -2%.
- Keep clear space of at least the fold's width (a quarter of the mark) around the mark.
- Smallest size: 16 px for the mark, 96 px wide for the lockup.
- Don't recolour, rotate, outline or add shadows or gradients. The fold is the only vermilion element.
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

## CLI

In the terminal, use the terminal's own green, yellow and red for ok/warn/error, so themes keep working. Use vermilion (`#F08A5D` on dark) only for highlights such as matched lookup terms.
