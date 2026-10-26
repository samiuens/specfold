# Specfold

Specs and knowledge folded into one agent workflow: an [OKF](https://github.com/GoogleCloudPlatform/open-knowledge-format) knowledge bundle for context, [OpenSpec](https://github.com/Fission-AI/OpenSpec) for behavior contracts, and a deterministic CLI plus a required CI gate that keep both honest.

Status: pre-release, milestone M0 (repo skeleton, first specs). The build brief is [docs/plan.md](docs/plan.md).

## Layout

| Path | Content |
| --- | --- |
| `template/` | the payload a user repo receives (template repo, bootstrap, migration) |
| `knowledge/`, `openspec/`, `specfold.yaml`, `AGENTS.md`, `CLAUDE.md` | the kit's own knowledge, specs and settings; Specfold is built with Specfold, and none of this is shipped |
| `tools/specfold/` | CLI source (from M1) |
| `examples/` | worked example app (from M2) |
| `docs/` | plan and kit documentation |
