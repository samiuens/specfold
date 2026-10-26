---
type: Convention
title: Test fixtures and spec traceability
description: How CLI tests use one valid fixture with a single mutation per test, pinned vendored samples, and spec scenario references.
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-26T10:12:57+01:00 }
sources:
  - id: helpers
    resource: ../../tools/specfold/test/helpers.ts
  - id: patch
    resource: ../../tools/specfold/test/fixtures/acme-retail/PATCH.md
---

# Fixtures

- `test/fixtures/valid/` is a complete, valid repository (with `specfold.yaml` and `knowledge/`). A test copies it into a temporary folder with `tempDir("valid")` and breaks exactly one thing, so every rule is tested in isolation without dozens of near-identical fixture folders.
- External samples are vendored at a pinned upstream commit with their license. Any change to them is documented in a `PATCH.md` next to the copy, and the unpatched copy stays as a negative fixture.
- Tests run the CLI in-process through `run(argv, cwd)` and assert on exit code, stdout and stderr, so they exercise the same command registry as the bundle.

# Spec traceability

Every test that covers a spec scenario carries a comment with the scenario id, `// spec: <capability>#<scenario-slug>`, for example `// spec: specfold-validate#log-out-of-order`. The slug is the scenario title in kebab-case. `specfold trace` (M5) will read these comments to report uncovered scenarios.

# Related

- [TypeScript style](/conventions/typescript-style.md)
- [acme_retail fixture](/decisions/acme-retail-patched-fixture.md)
