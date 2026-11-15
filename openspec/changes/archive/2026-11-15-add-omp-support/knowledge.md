## Delta

```yaml
ops:
  - op: create
    path: references/omp.md
    type: Reference
    summary: omp features Specfold relies on - skill and role discovery, hook events, bash.patterns, task isolation and its environment markers - as of 2026-11.
  - op: create
    path: capabilities/specfold-tools.md
    type: Capability
    summary: Why repositories declare their agent tools in specfold.yaml and how the CLI signs agent writes under omp; links the new spec.
  - op: create
    path: decisions/omp-roles-generated-from-claude-agents.md
    type: Decision
    summary: omp roles are generated from .claude/agents by agents sync, not hand-written, so each role keeps one source; planner is left out.
  - op: create
    path: decisions/omp-tools-from-manifest.md
    type: Decision
    summary: "Rejected: deriving omp support from the install manifest; an explicit tools setting is what init and migrate write."
  - op: create
    path: decisions/omp-role-marker-in-frontmatter.md
    type: Decision
    summary: "Rejected: marking generated omp roles with a frontmatter key; omp's handling of unknown keys is undocumented, so a body comment marks them."
  - op: create
    path: decisions/omp-rules-appended.md
    type: Decision
    summary: "Rejected: appending Specfold's omp bash rules; omp applies the first match, so the owned block goes first, strictest level first."
  - op: update
    path: decisions/tool-neutral-first.md
    type: Decision
    summary: omp gets the same extras as Claude Code, generated from or forwarding to the Claude Code sources.
  - op: update
    path: architecture/agent-layer.md
    type: Component
    summary: How the roles, hooks and permissions reach omp, and how sf-apply dispatches isolated implementers there.
  - op: update
    path: architecture/upgrade-flow.md
    type: Data Flow
    summary: The upgrader reads the tools setting, falls back to the manifest, and keeps the omp adapter current.
  - op: update
    path: capabilities/specfold-agents-sync.md
    type: Capability
    summary: agents sync also generates omp roles and owns four omp task settings.
  - op: update
    path: capabilities/specfold-permissions.md
    type: Capability
    summary: The sync also renders omp bash.patterns as one leading block, ask as prompt, and owns the bare command forms.
  - op: update
    path: capabilities/specfold-hooks.md
    type: Capability
    summary: The omp hook adapter forwards to the claude-* subcommands; the subagent push guard and the follow-up stop loop.
  - op: update
    path: capabilities/specfold-init.md
    type: Capability
    summary: init writes the tools setting, keeps omp away from openspec init and installs the omp adapter.
  - op: update
    path: capabilities/specfold-migrate.md
    type: Capability
    summary: migrate install accepts omp in --tools and writes the tools setting.
  - op: update
    path: capabilities/specfold-upgrade.md
    type: Capability
    summary: Upgrade plans the files of the tools setting and keeps the omp adapter current.
  - op: update
    path: capabilities/specfold-verify.md
    type: Capability
    summary: verify also refuses to run under omp.
empty_reason: ""
```

## Notes

`references/omp.md` is written in task group 1, because the spike there checks the facts it records. The other concepts are written in the Knowledge group.
