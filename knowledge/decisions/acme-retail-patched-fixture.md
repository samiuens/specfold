---
type: Decision
title: OKF sample acme_retail is tested as a patched fixture
description: The upstream acme_retail sample violates OKF, so the tests use a documented patched copy plus the unpatched copy as a negative fixture.
status: stable
decision: accepted
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T02:10:00+01:00 }
verified: { by: human:samiuens, at: 2026-10-29T08:53:06+01:00 }
sources:
  - id: plan
    resource: ../../docs/plan.md
    title: "Specfold build plan, section 'specfold CLI'"
---

# Decision

A pinned copy of `bundles/acme_retail/` is vendored twice: patched (no frontmatter in `log.md`, leading `/` on bundle paths) and expected to pass `specfold validate --okf-only`; and unpatched, expected to fail with exactly those findings. The patch is documented next to the fixture.

# Why

OKF ships no validator, and its own sample breaks two spec rules (open upstream PR #31 addresses the paths). A strict validator must report that, and a lenient mode would hide real errors in user bundles.

# Rejected alternatives

- Lenient `--okf-only` that tolerates the violations.
- No OKF sample in the tests.

# Related

- [Okf](/references/okf.md)
