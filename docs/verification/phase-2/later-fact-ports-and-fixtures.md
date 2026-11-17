# PHASE 2 later-fact ports and fixture verification

**Recorded:** 2026-11-15 (Asia/Bangkok). **Scope:** T005 fail-closed typed dependency
ports and isolated evidence composition. This evidence does not implement later-Phase
workflows, establish PHASE 2 acceptance, or establish closure readiness for a season.

## Implemented seams

`SeasonDependenciesPort` exposes typed requests and results for registration compatibility,
schedule/result freezes, catalog references, master impact, public media scope, season
summaries, and closing readiness. Registration facts retain interval compositions and the
registration/version/player/club references plus U21 and homegrown classifications. Schedule
facts retain the first approval, frozen structure, duration and preparation/release buffers;
result facts retain the first confirmation, regulation basis, points, ranking priority, and
qualification/relegation counts. Relation names and owning writers come from a fixed source
catalog. `SeasonDependenciesService` returns `VERIFIED_NOT_INTRODUCED` only when all owning
relations are absent and no owning writer or provider is registered. Partial schemas,
unavailable catalog inspection, missing adapters for present sources, malformed locks, and
invalid/throwing providers return `UNAVAILABLE` with an explicit cause and basis. Known
providers must discover typed locks before fact reads. `read()` rediscovers the lock set and
checks it against `TransactionContext`; a missing lock or changed summary pointer raises
`LockSetChanged` so the caller can restart before using facts. Request IDs, lock resources,
fact references, and provider bases are validated with the shared platform lock catalog.

The existing season-summary schema target is read as a known source. A confirmed summary
requires its immutable `sourceSnapshot`, containing nonempty content and exact regulation,
official-report, and ranking-resolution basis references. An empty summary case or version
does not satisfy closure readiness. The closure helper derives readiness from the current
summary snapshot and revision, a trusted closing instant supplied by the owning caller,
unresolved requests, waiting effects, playing interval ends, and unresolved future plans;
provider facts contain no closing cutoff and a caller-supplied `ready` boolean is not a valid
fact. The owning command must sample `TransactionContext.now()` after acquiring the full lock set.
Equality at the cutoff is ready; an invalid caller `Date` is not.

`registerDependencyModules` provides static writer/provider composition, rejects duplicate
writers/providers and providers registered under the wrong writer, and
`assertStartupCatalog` checks complete schemas for explicitly installed providers. A missing
adapter for a composite dependency does not block startup while its owner modules are only
partially installed; dependent reads remain `UNAVAILABLE`. Single-owner writer registration
without its adapter remains a startup error. AppModule composition remains a later task; this
seam does not install later writer modules.

The Phase 2 fixtures build on the guarded Phase 1 fixtures and use real UUID-backed season,
case, version, and account foreign keys. Later-owner fact simulations carry the explicit
`GUARD_SIMULATION` label. Evidence composition now takes the same-season season, regulation,
and summary records returned by fixture creation; the integration test joins those exact IDs
back to persisted version/case rows before accepting the evidence. Fixture creation and reset
both require the loopback `whistle_test_*` target guard; reset also requires the literal
`RESET_ISOLATED_TEST_DATABASE` acknowledgement. A source search found no production imports
of the Phase 2 fixture adapters.

## Verification

Verification used Node `v24.14.0`, pnpm `10.33.2`, Prisma `7.10.1`, and the confirmed
disposable PostgreSQL `17.11` container. The isolated target was
`whistle_test_phase2_t003_final` at `127.0.0.1:52502`; a read-only connection confirmed the
database name and server version. The integration test created and dropped a uniquely named
`whistle_test_fixture_*` database within this disposable container. A post-run catalog query
found zero leftover databases with that prefix. Credentials are omitted. The integration
process used `TEST_DATABASE_URL` with `NODE_ENV=test`, removed `DATABASE_URL`, and kept
`TEMP`/`TMP` under `.verification/phase-2/t005-temp`.

| Check | Result |
|---|---|
| `pnpm db:generate` | PASS; generated Prisma Client 7.10.1. |
| Focused `phase-2-ports.spec.ts` | PASS, 14/14 tests. Covers verified absence, partial schema/provider/writer failure, registration classifications, frozen schedule/result facts, lock coverage and pointer changes, malformed locks, immutable summary snapshots, computed closing readiness, static registration/startup assertions, simulation labeling, fixture/reset guards, and invalid requests. |
| Focused `fixture-isolation.spec.ts` | PASS, 2/2 tests. Covers target rejection, real same-season Season/case/version references in composed evidence, startup relation catalog assertion, unacknowledged reset refusal, acknowledged reset, and preservation of technical guards. |
| Backend typecheck | PASS, `pnpm --filter @whistle-epl/backend run typecheck`. |
| Focused ESLint | PASS for the shared transaction context, T005 port/service, fixture helpers, and both focused tests. |
| Prettier | PASS for all seven T005 TypeScript source, fixture, and test files. |
| `git diff --check` | PASS for the tracked lock-context, integration-fixture, and task files. |

The focused commands were:

```powershell
pnpm --filter @whistle-epl/backend exec jest --runInBand tests/unit/phase-2-ports.spec.ts
pnpm --filter @whistle-epl/backend exec jest --config jest.integration.config.cjs --runInBand tests/integration/fixture-isolation.spec.ts
pnpm --filter @whistle-epl/backend run typecheck
```

The tests ran against the working-tree implementation at base revision
`58fe5cc01eff2abad5c07c561486976bdccd6794` on
`feat/phase-2-foundation-and-season-regulations` using isolated fixtures. T005 and this
evidence were later published in
[2406dc8](https://github.com/quocthai912/Whistle-EPL/commit/2406dc8ad5cd2954459b43da163a0e535d65e71e).

## Rereview follow-up

**Recorded:** 2026-11-15. The T005 rereview moved the closure cutoff out of provider facts and
made the helper require the caller's trusted `Date`. Tests cover a finite cutoff, exact-boundary
inclusion, a one-millisecond-later interval, invalid dates, unavailable facts, and a rejected
provider-supplied cutoff. Startup coverage verifies that one registered owner can start while
later composite owners/adapters are absent, dependent reads stay `UNAVAILABLE`, and an explicitly
installed composite provider still fails startup when its source schema is incomplete.

| Check | Result |
|---|---|
| Focused `phase-2-ports.spec.ts` | PASS, 15/15 tests. |
| Backend typecheck | PASS, `pnpm --filter @whistle-epl/backend run typecheck`. |
| Focused ESLint | PASS for the T005 port, service, and unit test. |
| Focused Prettier check | PASS for the T005 port, service, and unit test. |
| Focused `git diff --check` | PASS for the T005 port, service, and unit test. |

This follow-up used no database, integration fixture, or browser run; it changes only the T005
unit seam and leaves Phase 2 acceptance pending.
