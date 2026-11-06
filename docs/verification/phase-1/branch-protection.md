# PHASE 1 branch protection verification

- **Date** 2026-11-06 (Asia/Bangkok)
- **Policy** [D098](../../../context/design/architecture.md#d098---required-ci-and-protected-integration-branches)
- **Required check** `Required CI gate`

## Hosted automatic pull request evidence

| Target | Draft PR | Failure | Success |
| --- | --- | --- | --- |
| development | [#63](https://github.com/quocthai912/Whistle-EPL/pull/63) | [42164956390](https://github.com/quocthai912/Whistle-EPL/actions/runs/42164956390/attempts/1) | [42165164506](https://github.com/quocthai912/Whistle-EPL/actions/runs/42165164506) |
| main | [#64](https://github.com/quocthai912/Whistle-EPL/pull/64) | [42164960119](https://github.com/quocthai912/Whistle-EPL/actions/runs/42164960119/attempts/1) | [42165166226](https://github.com/quocthai912/Whistle-EPL/actions/runs/42165166226) |

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

## Cancellation, merge and trigger evidence

Rerunning the previous failure attempts to exercise cancellation superseded
the first runs on `ee5da91` through the PR concurrency group. On those first
runs, all three mandatory jobs were cancelled and the gate reported failure
for [development](https://github.com/quocthai912/Whistle-EPL/actions/runs/42165926710/attempts/1)
and [main](https://github.com/quocthai912/Whistle-EPL/actions/runs/42165925427/attempts/1).
The cancelled reruns of the older revision left no green gate. The second runs
of `ee5da91` passed every job on both targets before the authorized merges.

| Case | Result |
| --- | --- |
| Protected merge to development | PR #63 merged at `c91acc86f6cad5f1f9fae844726100b911356074` after [automatic CI](https://github.com/quocthai912/Whistle-EPL/actions/runs/42165926710/attempts/2). |
| Protected merge to main | PR #64 merged at `9d2bd98c3e098aa86241fd7f787cef244ce85f9b` after [automatic CI](https://github.com/quocthai912/Whistle-EPL/actions/runs/42165925427/attempts/2). |
| Push to main | All mandatory jobs and the gate passed in [42166453061](https://github.com/quocthai912/Whistle-EPL/actions/runs/42166453061). |
| Manual dispatch on main | All mandatory jobs and the gate passed in [42166455772](https://github.com/quocthai912/Whistle-EPL/actions/runs/42166455772). |
| Doc-only PR to development | [#65](https://github.com/quocthai912/Whistle-EPL/pull/65) changed a single Markdown file. Full automatic CI passed in [42166505306](https://github.com/quocthai912/Whistle-EPL/actions/runs/42166505306). |
| Doc-only PR to main | [#66](https://github.com/quocthai912/Whistle-EPL/pull/66) changed a single Markdown file. Full automatic CI passed in [42166515317](https://github.com/quocthai912/Whistle-EPL/actions/runs/42166515317). |
| Skipped mandatory job on development | In draft probe [#67](https://github.com/quocthai912/Whistle-EPL/pull/67), both source jobs passed, PostgreSQL was skipped, and the required gate failed in [42192684960](https://github.com/quocthai912/Whistle-EPL/actions/runs/42192684960). |
| Skipped mandatory job on main | In draft probe [#68](https://github.com/quocthai912/Whistle-EPL/pull/68), both source jobs passed, PostgreSQL was skipped, and the required gate failed in [42192688292](https://github.com/quocthai912/Whistle-EPL/actions/runs/42192688292). |

Branch restrictions were verified through the effective GitHub rule readback
and compliant PR merges. The verification used no destructive operations
against either protected branch. The skip conditions existed only in the
temporary probe PRs, which were closed after verification.
