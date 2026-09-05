# Workflow files

Copy both into `.github/workflows/`.

They live here because publishing workflow files needs a token with the
`workflow` scope, which this repository was created without.

## validate.yml

Runs on every pull request touching `data/services/`. Checks required fields,
marketing language in limits, slug matching the filename, pricing URLs that
point at a homepage, and dates in the future. Then confirms the README and
site still generate.

## stale-check.yml

**This is the contribution engine.** On the first of each month it runs
`npm run stale` and, if anything has gone past 90 days, opens an issue listing
every entry that needs re-checking — labelled `good first issue` and
`help wanted`.

The list decaying is not a problem to be solved. It is a renewable supply of
small, obvious tasks, and this workflow is what surfaces them.