---
type: Backlog Item
title: Rewrite old decision references in code
description: A specfold refs rewrite --map command that rewrites references like ADR NNNN in code, dry run first, comments only by default.
status: draft
state: open
priority: medium
origin: interview
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-02T13:41:33+01:00 }
---

# Idea

A `specfold refs rewrite --map <old→new>` command for repositories whose code cites numbered decisions ("ADR 0042 §3"). The first real migration rewrote over a thousand such references across hundreds of files with a one-off script. A built-in version runs a dry run first, classifies each hit (comment, string, test name) and touches only comments by default.

Pitfalls from that run, worth keeping as test fixtures: section lists (`§8, §9`, `§2/§4`), references split across two comment lines, `--` comments in SQL, decisions used as nouns in prose ("per ADR 0051"), strings that end up in a generated `openapi.json`, and never running a clean-up regex over code lines (one turned `() =>` into `=>`).

# Why it waits

Only repositories with numbered decision references need it, and the existing-bundle migration path it belongs to is a [deferred commitment](/commitments/migrate-an-existing-okf-bundle.md). Moved here in the `fix-migration-findings` interview (2026-11-02).

# Related

- [specfold migrate](/capabilities/specfold-migrate.md)
