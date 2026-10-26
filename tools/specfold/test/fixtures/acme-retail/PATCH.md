# acme_retail fixture

Source: `bundles/acme_retail/` of [GoogleCloudPlatform/open-knowledge-format](https://github.com/GoogleCloudPlatform/open-knowledge-format) at commit `ad30107` (2026-08-21), licensed under Apache 2.0 (`LICENSE.md`).

- `upstream/` is an unmodified copy. It violates OKF v0.2 §9 (`log.md` carries frontmatter), so `specfold validate --okf-only` reports exactly one `OKF-3` error.
- `patched/` applies two fixes, documented here:
  1. Removed the frontmatter block (`type: Log`, `title: Acme Retail bundle history`) from `log.md`.
  2. Added the leading `/` to the 12 bundle-relative `resource` paths (for example `policies/margin-standard.md` → `/policies/margin-standard.md`), as proposed upstream in PR #31.

See `/decisions/acme-retail-patched-fixture.md` in the kit's knowledge bundle.
