# Changesets

Every pull request records whether it affects a tiny-struct release. Run `bun changeset` for a release-worthy change or `bun changeset --empty` for tests, documentation, refactors, and other changes that should not appear in the changelog.

Use `patch` for compatible fixes, `minor` for compatible features, and `major` for incompatible changes. Write summaries for people using tiny-struct rather than as implementation notes.
