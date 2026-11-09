## Delta

```yaml
ops:
  - op: create
    path: capabilities/specfold-profile.md
    type: Capability
    summary: Why repositories can choose a full or a knowledge-only Specfold setup, and where the profile contract lives.
  - op: update
    path: capabilities/specfold-init.md
    type: Capability
    summary: Init takes --profile; the knowledge profile skips openspec init and removes unchanged template OpenSpec files.
  - op: update
    path: capabilities/specfold-migrate.md
    type: Capability
    summary: migrate install takes --profile and installs the knowledge profile without touching openspec/.
  - op: update
    path: capabilities/specfold-upgrade.md
    type: Capability
    summary: Upgrade keeps the profile's file set, reinstalls on a switch to full and refuses a switch to knowledge.
  - op: update
    path: capabilities/specfold-doctor.md
    type: Capability
    summary: D2 checks the profile value and D3 passes without OpenSpec in the knowledge profile.
  - op: update
    path: capabilities/specfold-gate.md
    type: Capability
    summary: The knowledge profile skips the OpenSpec rules and adds G19, which asks for a knowledge change with every source change.
  - op: create
    path: decisions/knowledge-profile.md
    type: Decision
    summary: Specfold supports a knowledge-only profile, chosen by a named profile key, so repositories without behavior to spec can adopt it.
  - op: create
    path: decisions/template-payload-per-profile.md
    type: Decision
    summary: Rejected - shipping one template payload per profile; it doubles release assets and upgrade fixtures for a small file split.
  - op: update
    path: decisions/upgrade-file-classes.md
    type: Decision
    summary: Kit-owned files now depend on the profile; the manifest records which profile was installed.
  - op: update
    path: decisions/managed-blocks.md
    type: Decision
    summary: Managed blocks have a knowledge-profile variant kept in .specfold/profiles/knowledge/.
  - op: update
    path: architecture/upgrade-flow.md
    type: Data Flow
    summary: The upgrade flow compares the manifest profile with specfold.yaml before planning.
  - op: update
    path: architecture/agent-layer.md
    type: Component
    summary: The knowledge profile ships six skills and only the scout subagent; sf-interview records decisions as concepts.
  - op: update
    path: vision/specfold.md
    type: Vision
    summary: The knowledge profile is a supported entry point; specs carry the contract once a repository moves to full.
  - op: update
    path: commitments/migrate-an-existing-okf-bundle.md
    type: Deferred Commitment
    summary: The follow-up migration path can install the knowledge profile, as iac will need.
empty_reason: ""
```

## Notes

- Rejected alternatives from design.md D1 other than the per-profile payload (a `specs` boolean, folding the name into `profile_version`) and D3/D6 (profile markers in one file, reusing G4) go into the body of `decisions/knowledge-profile.md` as considered options rather than separate concepts; they were never proposed on their own.
- Implementation finding: the kit's own `.agents/skills/sf-*` are byte-identical copies of `template/.agents/skills/sf-*`, with no test enforcing it; task 2.3 updated both. Worth a convention or a test.
