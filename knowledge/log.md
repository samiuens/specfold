# Log

## 2026-10-26

* **Update**: `specfold index` implemented (change `add-specfold-index`); indexes are now generated, and folder descriptions moved to `specfold.yaml`.
* **Update**: `specfold validate` implemented (change `add-specfold-validate`); capability card, CLI architecture and conventions for TypeScript style and test fixtures added.
* **Update**: Decision on the kit repo's commit convention added.
* **Update**: Decision on task breakdown added; contract proposed as OpenSpec change `add-specfold-tasks`.
* **Creation**: Bundle created for M0 by hand (no CLI yet): decisions from the build plan and the M0 question round, references from the pre-build verification, a draft vision, and backlog items seeded from the plan's "Later" section.
* **Update**: `specfold log add` implemented (change `add-specfold-log`); log entries are now written with the command.
* **Update**: `specfold new` implemented (change `add-specfold-new`); invented `generated.at` times in earlier concepts replaced with real ones.
* **Update**: `specfold lookup` implemented (change `add-specfold-lookup`); `AGENTS.md` now starts the lookup order with it.
* **Update**: `specfold doctor` implemented (change `add-specfold-doctor`); all M1 commands specified in #7 are built.
* **Update**: `specfold doctor` D3 now prefers a repository-local OpenSpec (change `update-doctor-local-openspec`); the kit pins OpenSpec 1.15.0 as a dev dependency.
* **Decision**: Knowledge is written before archive and synced after (/decisions/write-knowledge-before-sync-after.md)
