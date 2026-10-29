# PHASE 1 Validation Guide

**Status (2026-10-29)**: T001–T014 are published at `892f172f9ec539d5789a31a2f8046480afe15772`; T015–T022 operator/deployment/recovery commands are implemented, verified and published at [`7ac09e6`](https://github.com/quocthai912/Whistle-EPL/commit/7ac09e6cec9fb434248c82db142ab04695961823) on `feat/phase-1-operations-recovery` (review base `30506e3`). See [operator evidence](../../docs/verification/phase-1/operator-foundation.md).
The command table distinguishes installed commands from remaining planned interfaces.
Full clean-host/browser credential-change acceptance, administration workflows, browser/load and
recovery acceptance remain pending. See [setup evidence](../../docs/verification/phase-1/workspace-setup.md),
[foundation evidence](../../docs/verification/phase-1/foundation.md) and [Task status](tasks.md);
this guide does not replace their actual execution results.

**Authentication publication update (2026-10-29):** T023–T026 are implemented, verified and published at [`5cfa666`](https://github.com/quocthai912/Whistle-EPL/commit/5cfa666a7550c9b1d06cc21926dba7e2f27c1a26) on `feat/phase-1-authentication-backend` (review base `7e28810`); see [authentication evidence](../../docs/verification/phase-1/authentication.md) for current commands/results and required Origin/proxy configuration. The command table now describes this published authentication snapshot. Earlier Ubuntu application and operator-deployment results retain their original evidence scope. T027–T048 and Phase acceptance remain pending.

## Prerequisites and Isolation

Use the exact Node.js 24/pnpm/package/image pins and native-install policy recorded during
setup, PostgreSQL 17, and D097's reference Compose/Caddy host prerequisites. CI also needs
mandatory Ubuntu and Windows runner environments. Actual Chrome and Edge channels are
required for browser acceptance; bundled Chromium alone is insufficient. Install local k6
for the measured run. Keep operational secrets and test credentials outside Git/logs.

Use separate operational/development/test configuration. Test/fixture/reset commands MUST
reject a target not explicitly identified as isolated. Use synthetic account/authority data,
two test Season identities, controlled clocks and deterministic race barriers. No official
season/regulation or default administrator is seeded. A test clock is never a client override
of operational time. See [data model](data-model.md) and [operator contract](contracts/operator-cli.md).

## Root Command Contract and Current Availability

The approved command contract remains the target. Current availability below is checked
against published commit [`5cfa666`](https://github.com/quocthai912/Whistle-EPL/commit/5cfa666a7550c9b1d06cc21926dba7e2f27c1a26) (review base `7e28810`); [authentication evidence](../../docs/verification/phase-1/authentication.md) records the current Windows application/PG17 results. [Operator evidence](../../docs/verification/phase-1/operator-foundation.md) retains earlier deployment/two-OS results. T001–T014 were previously published at `892f172`; T015–T022 were published on `feat/phase-1-operations-recovery`; T023–T026 are published on `feat/phase-1-authentication-backend`. Planned commands must not be treated as executable yet.
Root quality commands propagate workspace failures. For isolated database requirements,
see the reproduction section in the foundation verification report.

| Command | Required expected outcome | Availability at published `5cfa666` snapshot |
|---|---|---|
| pnpm install --frozen-lockfile | Clean locked install on each OS, with explicit allowed native build verification | Executed for T001 setup on both OSes |
| pnpm db:validate | Pinned Prisma 7 schema/configuration validation | Implemented and verified |
| pnpm db:generate | Explicit backend CJS client generation before generated imports/typecheck/build/tests | Implemented and verified |
| pnpm db:migrate | Deploy committed migrations to the selected fresh target, no interactive dev migration/schema push | Implemented; six-migration fresh PG17 replay/intended-schema check PASS; previous five-migration Compose evidence retained |
| pnpm db:status | Inspect deployment status | Implemented and verified; current status entry point |
| pnpm db:check | Migration status and intended-schema checks, accounting for SQL-managed constraints | Planned root alias; current checks use db:status plus schema.spec.ts/Prisma diff |
| pnpm lint | Root ESLint checks for both workspaces, no silent skip | Implemented and verified |
| pnpm typecheck | Both workspaces strict checks without output mutation | Implemented and verified |
| pnpm format:check | Nonmutating Prettier on D097 source/config scopes, excluding Context/ADRs/generated output | Implemented and verified |
| pnpm format | Explicit source-format mutation only; never used as CI format verification | Implemented and exercised |
| pnpm test / pnpm test:unit | Frontend Vitest/RTL and backend Jest nonwatch suites, no empty-pass acceptance | Implemented; 15 backend and 8 frontend tests PASS on Windows; earlier Ubuntu results remain historical |
| pnpm test:integration | Real isolated PostgreSQL 17; deliberate independent-connection races, initially serial suites | Implemented; 53 tests PASS against Linux PG17 from Windows, including 28 auth/throttle tests; no new Ubuntu application run |
| pnpm verify:native / pnpm verify:client | Approved native-module and CommonJS client compatibility checks | Implemented and verified |
| pnpm verify:commands | Injected workspace failures propagate to root command failure | Implemented; 10 probes passed in the earlier Windows operator verification; previous Ubuntu evidence retained |
| pnpm build | Frontend/backend build and import compatibility | Implemented and verified |
| pnpm admin:bootstrap / pnpm admin:recover | Protected host TTY, audited temporary credential bootstrap/existing-admin recovery | Implemented and verified T015–T017; see [operator access](../../docs/operations/operator-access.md) |
| pnpm ops:maintenance / pnpm ops:backup / pnpm ops:restore | Protected profile, durable drain, selected complete-set recovery | Implemented and verified T019–T020; Linux host tools/runbooks required |
| pnpm test:ops | Python set integrity/retention/schedule/boot-resume regressions | Implemented; 5 tests pass on both OSes |
| pnpm dev | Explicit development profile and labelled HTTP-cookie limitations | Planned root command; frontend workspace has its own dev script |
| pnpm test:e2e | Real Chrome/Edge in the acceptance HTTPS profile, record actual versions | Planned; not browser acceptance evidence |
| pnpm test:load | Local k6 BM-01 profile; export safe per-attempt latency/success evidence | Planned; BM-01 measurements pending |
| pnpm ops:verify | Available-foundation persistence/backup/restore/failure drills in an isolated target | Implemented; real isolated backup/restore/corrupt-set checks pass; T046 operational drills pending |

Run installed tools through pnpm exec and versioned one-off tools through pnpm dlx only
when necessary. Do not substitute npm/yarn commands or create competing lockfiles.

## Fresh Installation Walkthrough — US1

1. Start from an empty supported environment; record revision, OS/hardware, exact runtimes,
   dependency/container versions and required configuration keys without secret values.
2. Follow the documented locked install, database readiness, validation/generation/migration
   and build sequence. Bring up ops/compose.yaml and same-origin HTTPS via ops/Caddyfile using
   the approved local trusted certificate for local acceptance. Check DB is not public.
3. Run pnpm admin:bootstrap with secure input; prove duplicate and concurrent bootstrap
   refusal/single-success behavior including an existing locked administrator.
4. Log in, complete required password change, log in again and verify permitted navigation.
   Replace/restart containers and compare persisted foundation state.
5. Run operator recovery only for an existing administrator; prove no account creation or
   promotion, reason/operator audit, session invalidation and first-login change on reset.

## Authentication and Authority — US2/US3

Exercise the [REST contract](contracts/rest.md) using UI and direct requests: missing/invalid
credentials, non-enumeration, local blocklist, Unicode password boundaries, 24-hour temporary
expiry, restricted-change flow, current-password check, multi-session logout, 30-minute idle
and 8-hour absolute expiry. Use exact boundary tests and restart before cleanup.

Cover prelogin 15-minute context, stable per-session CSRF across tabs, exact Origin/Referer,
forged headers/tokens, source-IP trust and 5/20 rolling failures with 15-minute blocking.
Test password reset while login verification waits; old credential verification must not
create a new valid session. Never remove these controls merely to make a performance run pass.

Use distinct administrator/proposer/recipient identities and two isolated Season fixtures.
Test self-grant/self-lock/last-admin, separate shared/Create Season rights, prerequisites,
safe self-reduction, lock/unlock retention, all delegation combinations/transitions/overlaps
and once-only start/end processing across restart. Block a write, expire/revoke its authority,
then release it and verify no unauthorized commit. Do not implement later business UCs for tests.

## Audit, Input and Atomicity — US4/shared

Produce actual in-scope login/logout/permission/recovery events and compare safe audit results
to their operations. Check actor/time/action/object filters, empty lists, deterministic pages,
default 20/maximum 100, correct totals and no content mutation. Deny non-admin audit and
restricted payload, export/edit/delete attempts; scan responses/logs/artifacts for secrets.

Inject save/audit/transaction failures, and inspect committed state from independent connections.
Test duplicate critical intent after lost response, changed-intent key reuse, stale revision,
unknown commit resolution and bounded retry. Run at least 10 distinct unauthorized UI/direct
request cases, dangerous-input/injection and unsafe displayed-content cases with no unauthorized
change, unintended execution or disclosure. Test UI errors and safe input preservation; never
retain passwords in conflict drafts or expose internal state to another account.

## BM-01 Measurement and Browser Evidence

Record the actual reference-profile machine (D097: 4 vCPU, 8 GiB RAM, SSD), software/browser
versions, fixture/reset manifest and source revision. Prepare synthetic unlocked accounts with
completed first-login changes for the successful-authentication workload; run separate invalid/
throttling scenarios without weakening controls. Perform at least 100 authentication attempts
with 20 concurrent users; at least 95% must respond within 3 seconds. Include errors/success
classification so fast failures cannot falsely demonstrate successful login performance.
The lookup warm-up/duration profile is not automatically a login benchmark requirement.

Execute required journeys on actual Chrome and Edge under HTTPS. Record results separately
from direct-server tests and hosted CI timing. No additional whole-league UI/performance target
is implied by this PHASE 1 guide.

## Operations and CI Evidence

Exercise seven complete backup sets, checksum/incomplete-set rejection, non-overlap,
daily/missed/failed/retried runs, restoration of the available-data backup point, preserved
maintenance after operator/connection/DB restart and revoked restored sessions. Keep the durable
host marker outside the restored snapshot. Off-host provider credentials/location are supplied
only for a selected Internet deployment. Full season/media and complete BM-07 remain PHASE 10.

Verify genuine mandatory Ubuntu/Windows jobs and Ubuntu PostgreSQL integration, plus final-gate
failure/cancellation/skipped-work behavior, documentation-only PRs, PR targets development/main,
push-main and manual execution. After real successful check discovery, verify PR-only/no-bypass
rules and no direct/force push or deletion using safe disposable checks that do not damage the
protected branches. No human-approval gate or automatic deployment is added.

## Evidence to Retain

Store actual commands/scenarios/results, safe logs, revision, environment, fixtures/reset basis,
passed/unmet SC-001-SC-013, defects and reviewer in docs/verification/phase-1/ during execution.
Update the owning Phase ledger only with valid evidence and authorized review; no checkbox or
implementation status is changed merely by creating this guide.
