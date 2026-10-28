# Upgrade notes and migrations

Kit repo folder, shipped inside every release tarball as `upgrade/` and read by `specfold upgrade`.

- `notes/<version>.md`: manual steps for that release, written for agents. `node tools/specfold/release.mjs notes <version>` adds it to the release body under "Upgrade notes"; a release without a file says "No manual steps."
- `migrations/<version>.mjs`: a migration the upgrader runs when it passes that version. Migrations run in version order and must be safe to run twice.

Write both in the change that needs them, not in the release PR.
