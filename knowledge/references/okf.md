---
type: Reference
title: Open Knowledge Format (OKF) v0.2
description: What the OKF v0.2 spec requires of a bundle, as checked on 2026-10-26, and where the sample bundle deviates from it.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
stale_after: 2026-11-25T00:00:00+01:00
sources:
  - id: spec
    resource: https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md
    title: OKF SPEC.md, Version 0.2 (commit ad30107)
    last_modified: 2026-08-21T00:00:00Z
  - id: sample
    resource: https://github.com/GoogleCloudPlatform/open-knowledge-format/tree/main/bundles/acme_retail
    title: acme_retail sample bundle
---

# Summary

SPEC.md is "Version 0.2", pre-1.0, with no releases or tags. The last merged change made every timestamp an ISO 8601 datetime with an explicit offset.[^spec]

# Conformance (§11)

Three rules: every non-reserved `.md` file has parseable YAML frontmatter; every frontmatter block has a non-empty `type`; `index.md` and `log.md` follow §8 and §9 when present. A concept with only `type` is conformant. Producers may add any keys; consumers should preserve unknown keys and may not reject them, nor reject bundles for missing optional fields, unknown types, broken links or missing indexes.

# Trust fields (§5)

- `generated: { by, at }`; `by` is an actor: `<producer>/<version>`, `human:<id>` or `process:<id>`.
- `verified`: a list of `{ by, at }`; a single bare mapping counts as a one-element list.
- `sources[]`: `resource` required; `id`, `title`, `author`, `usage_count`, `last_modified` optional; a sibling `usage_window: { from, to }`.
- `status`: `draft`, `stable` or `deprecated`; absent means `stable`.
- `stale_after`: an absolute instant. `last_modified` exists only inside `sources[]` entries.
- Timestamps: ISO 8601 with an explicit offset; `Z` and `+00:00` are both valid.
- Per-claim citations are footnotes labelled with a `sources[].id`.

# Index and log (§8, §9, §12)

- `index.md` files carry no frontmatter, except the bundle-root `index.md`, which may carry only `okf_version: "0.2"`.
- Index body: `# Section` headings, entries `* [Title](relative-url) - description`, subfolders as `* [Name](subdir/) - description`.
- `log.md`: an H1, then `## YYYY-MM-DD` headings newest first, entries like `* **Update**: ...`.
- Links: bundle-absolute (`/architecture/x.md`) is the recommended form; relative links are allowed.

# Deviations and gaps

- `acme_retail` has no Term concepts; `not:` appears only on a Metric (`metrics/gross-margin.md`) as a producer extension.[^sample]
- The sample's `log.md` has frontmatter and its path fields lack the leading `/` (open PR #31). See [acme_retail fixture](/decisions/acme-retail-patched-fixture.md).
- OKF ships no validator; the reference agent only offers `enrich` and `visualize`.
- okf.md is an unofficial third-party site whose content contradicts the spec; it is not a source.
- Open PR #25 would keep the root `okf_version` when indexes are regenerated.
