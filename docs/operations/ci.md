# Continuous integration

GitHub Actions runs [CI](../../.github/workflows/ci.yml) on pull requests into
`development` or `main`, pushes to `main`, and manual dispatches. Documentation-only
changes run the full pipeline. The required check name is **Required CI gate**.

| Job | Runner | Checks |
| --- | --- | --- |
| Source and unit checks | Ubuntu 24.04 and Windows Server 2025 | Locked install, native modules, Prisma validation and generation, lint, types, formatting, unit tests and builds |
| PostgreSQL 17 integration | Ubuntu 24.04 | Fresh disposable service, migration deployment/status, schema replay and drift checks, and integration tests with synthetic fixtures |
| Required CI gate | Ubuntu 24.04 | Evaluates the source matrix and PostgreSQL job after they settle. Both must succeed. |

The workflow uses Node 24.14.0 and the pnpm version in `packageManager`. It pins
Actions by commit and PostgreSQL by image digest. PR execution has read-only
repository contents access. Jobs install from the lockfile on each runner.
Superseded runs for the same event and ref are canceled. The workflow does not
upload artifacts or run deployments.

## Reproduce a failed job

From a clean checkout with the pinned Node and pnpm versions, run
`pnpm install --frozen-lockfile`, `pnpm verify:native`, `pnpm db:validate`,
`pnpm db:generate`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`,
`pnpm test:unit` and `pnpm build`. For the database job, follow the fresh
PostgreSQL 17 and fixture-target instructions in the
[quickstart](../../specs/001-phase-1-operational-foundation/quickstart.md).
Keep the fixture target separate from any operational connection.

## Activate the required check

Follow the [D098 merge-authority rule](../../context/design/architecture.md#triggers-and-branch-protection)
for every pull request. The authorized human initiates the merge after the applicable checks pass.

Identify the check emitted by a successful automatic pull request run first.
Verify the automatic PR triggers and gate outcomes on both targets. Apply the
[D098 ruleset](../../context/design/architecture.md#d098---required-ci-and-protected-integration-branches)
with the check sourced from GitHub Actions. Once each base branch contains
the workflow through a protected merge, verify the doc-only PRs, the automatic
main push run and manual dispatch. Record hosted evidence and effective
settings in the [branch protection record](../verification/phase-1/branch-protection.md).

The [Phase 1 quickstart](../../specs/001-phase-1-operational-foundation/quickstart.md)
defines the separate trusted HTTPS, Chrome/Edge, performance and recovery checks.
