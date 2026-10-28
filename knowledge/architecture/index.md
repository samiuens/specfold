# Component

* [Agent layer](agent-layer.md) - The sf skills, the planner agent, and how skills reach each tool through .agents/skills and specfold agents sync.
* [specfold CLI](specfold-cli.md) - How the specfold CLI is structured, built and shipped as one bundled file.

# Data Flow

* [Upgrade flow](upgrade-flow.md) - How an upgrade runs: outer stage downloads and checks, the target release's CLI plans, applies, migrates, reports and commits.
  * Referenced from code: tools/specfold/src/upgrade/command.ts:1
  * Referenced from code: tools/specfold/src/upgrade/migrations.ts:1
  * Referenced from code: tools/specfold/src/upgrade/reminder.ts:1
  * Referenced from code: tools/specfold/src/upgrade/skew.ts:1
  * Referenced from code: tools/specfold/src/upgrade/source.ts:1
  * Referenced from code: tools/specfold/src/upgrade/version.ts:1
