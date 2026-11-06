# PHASE 1 branch protection verification

- **Date** 2026-11-06 (Asia/Bangkok)
- **Policy** [D098](../../../context/design/architecture.md#d098---required-ci-and-protected-integration-branches)
- **Required check** `Required CI gate`

## Hosted automatic pull request evidence

| Target | Draft PR | Failure | Success |
| --- | --- | --- | --- |
| development | [#63](https://github.com/quocthai912/Whistle-EPL/pull/63) | [42164956390](https://github.com/quocthai912/Whistle-EPL/actions/runs/42164956390) | [42165164506](https://github.com/quocthai912/Whistle-EPL/actions/runs/42165164506) |
| main | [#64](https://github.com/quocthai912/Whistle-EPL/pull/64) | [42164960119](https://github.com/quocthai912/Whistle-EPL/actions/runs/42164960119) | [42165166226](https://github.com/quocthai912/Whistle-EPL/actions/runs/42165166226) |

The failure runs tested `5e171055aaa33cad8babe23dae26968ceaad05fc`. The source
jobs invoked compiled Prisma-client verification before the build, and both
required gates reported failure even though the PostgreSQL jobs passed.
The corrected revision `0bfc19af907c992d4e184b8a7a00e8238dec7ccc` passed the
two source/OS jobs, PostgreSQL 17 integration and the required gate on both
targets. The compiled CommonJS client check runs as part of `pnpm build`.

## Verified settings

[Ruleset 26672922](https://github.com/quocthai912/Whistle-EPL/rules/26672922)
is active for exactly `refs/heads/development` and `refs/heads/main`.
GitHub's effective branch-rule endpoint returned the PR requirement, deletion
and non-fast-forward restrictions, and `Required CI gate` from the GitHub
Actions integration (ID 15368) for both branches. The ruleset has an empty
bypass list, zero required approvals and no designated reviewer or code-owner
approval. Repository metadata reports both branches as protected.

The final gate command was also executed with all 25 combinations of success,
failure, cancellation, skipped work and missing results for the two dependencies.
Only the success/success combination passed.

Both PRs are on the existing feature branch. Hosted cancellation, automatic
doc-only runs, and main push and manual triggers require separate evidence.
