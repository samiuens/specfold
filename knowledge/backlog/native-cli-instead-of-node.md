---
type: Backlog Item
title: Native CLI instead of Node
description: "Compare a compiled CLI (Go, Rust or a Bun-compiled binary) with the bundled scripts/specfold.mjs: install, size, platforms and the upgrade hand-off."
status: draft
state: open
priority: low
origin: human
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-29T08:50:23+01:00 }
---

# Idea

The CLI is one bundled `.mjs` file that needs Node.js 20 or later ([deterministic CLI](/decisions/deterministic-cli.md)). The user raised moving to a more native CLI in the review of the drifted concepts on 2026-10-29, when approving that decision.

Open questions:

- what a compiled binary would gain: no Node requirement, startup time, one file per platform;
- what it would cost: a build per platform in each release, larger tarballs, and how `specfold upgrade` hands over to the target release's CLI ([upgrade flow](/architecture/upgrade-flow.md));
- candidates: Go, Rust, or a Bun-compiled binary of the current TypeScript.

# Related

- [Deterministic CLI](/decisions/deterministic-cli.md)
- [Upgrade flow](/architecture/upgrade-flow.md)
