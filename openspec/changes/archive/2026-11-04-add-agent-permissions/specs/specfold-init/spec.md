## MODIFIED Requirements

### Requirement: Setup steps
After filling the settings, init SHALL run `openspec init --tools <tools>` (default `agents,claude`) keeping the template's `openspec/config.yaml`, then `specfold agents sync`, `specfold permissions sync` and `specfold hooks install`, and write `.specfold/manifest.json` as `migrate install` does.

#### Scenario: Fresh template repository
- **WHEN** init runs in a new repository created from the template
- **THEN** `.agents/skills/openspec-propose/SKILL.md` exists, `config.yaml` still names `schema: specfold`, the git hooks are installed and the manifest exists

#### Scenario: Permissions rendered
- **WHEN** init runs in a new repository created from the template
- **THEN** `specfold permissions sync --check` exits with 0 afterwards and `.claude/settings.json` holds the `push` rules in `permissions.ask`
