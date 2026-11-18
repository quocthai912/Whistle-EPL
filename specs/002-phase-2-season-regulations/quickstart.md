<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:519bea94c4487b9fb74f19466675294349b84c7fb9b62dc42b576ac3d9e73678 -->

# PHASE 2 Validation Guide

**Status**: Implemented PHASE 2 verification guide. The
[acceptance assessment](../../docs/verification/phase-2/acceptance.md) records executed
checks; operational and later-Phase gates retain their owning scope.
See [verification strategy](verification.md) for coverage, [REST](contracts/rest.md),
[execution](contracts/execution.md), [UI](contracts/ui.md) and [media/recovery](contracts/media-recovery.md).

## Prerequisites

Retain exact package/image pins from the checkout, accepted PHASE 1 setup and D097/D098.
Use Node 24.14.0, pnpm 10.33.2, the locked PostgreSQL 17.11 reference image, existing HTTPS
Compose/Caddy setup, actual Chrome/Edge and k6. Operations commands run on the Linux reference
host with its existing Bash/Python/libpq/systemd prerequisites; do not assume a Windows shell
alone supplies that host. Protect environment/credential files outside Git and output.

Create explicitly separate isolated integration/browser/restore databases and media/backup
roots. Set NODE_ENV=test, TEST_DATABASE_URL and the existing browser configuration keys
through protected host configuration. E2E_BASE_URL must be an explicitly trusted local HTTPS
origin; E2E_TEST_DATABASE_URL must be the dedicated browser target and E2E_RESET_ACK the
existing exact reset acknowledgement. Never aim migration, fixture, cleanup or restore at
an operational/shared target. Guarded fixtures are not deployment startup seeds.

Use two separate terminals with protected configuration supplied first. In the
isolated application terminal, configure its isolated HOST/PORT, AUTH_ORIGIN,
media root and HTTPS frontend/proxy, then launch the built backend:

```powershell
$env:DATABASE_URL = $env:E2E_TEST_DATABASE_URL
pnpm --filter @whistle-epl/backend start
```

In the Playwright terminal retain the operational URL for the guard and use
<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:d91667cad33fe51bd53b558685a5424ad8e8410b0167db7a7ae3fada32e9d1b6 -->

the separate browser database, named `whistle_test_browser` or
`whistle_test_browser_` followed by a nonempty suffix containing only lowercase
letters, digits or underscores (variables below come from protected configuration):

<!-- /coderabbit-ai-generated:v1 -->

```powershell
$env:DATABASE_URL = $operationalDatabaseUrl
$env:E2E_TEST_DATABASE_URL = $isolatedBrowserDatabaseUrl
$env:E2E_BASE_URL = $isolatedHttpsOrigin
$env:E2E_RESET_ACK = 'RESET_ISOLATED_TEST_DATABASE'
$env:NODE_ENV = 'test'
pnpm test:e2e
```

`pnpm test:e2e` typechecks and runs Playwright against the already-running
`E2E_BASE_URL`; it does not launch another application. Global setup resets the
browser database through `E2E_TEST_DATABASE_URL` without rewriting the runner's
operational `DATABASE_URL`. The isolated application serves that same browser
database while the guard compares it against the operational target. The guard
refuses ambiguous operational connection query/fragment overrides.

Before affected acceptance: supply authorized actual 20-club logo files/source rights and
protected media root/UID/space. Missing actual assets remain an acceptance input, not permission
to fetch unapproved images. Existing Season competitionName mapping must be explicitly reviewed
before a populated-database migration; fresh fixture values do not supply operational values.

## Existing command entry points

Run from repository root only against the selected isolated environment. These commands
already exist, but their new PHASE 2 suite/schema behavior is an implementation target.

```powershell
pnpm install --frozen-lockfile
pnpm db:validate
pnpm db:generate
# Supply $isolatedRestoreDatabaseUrl from protected configuration for the separate
# isolated restore target; TEST_DATABASE_URL and E2E_TEST_DATABASE_URL are distinct.
$originalDatabaseUrl = $env:DATABASE_URL
try {
  $env:DATABASE_URL = $env:TEST_DATABASE_URL
  pnpm db:migrate
  pnpm db:status
  $env:DATABASE_URL = $env:E2E_TEST_DATABASE_URL
  pnpm db:migrate
  pnpm db:status
  $env:DATABASE_URL = $isolatedRestoreDatabaseUrl
  pnpm db:migrate
  pnpm db:status
} finally {
  if ($null -eq $originalDatabaseUrl) {
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  } else {
    $env:DATABASE_URL = $originalDatabaseUrl
  }
}
# DATABASE_URL is now restored/unset before any tests. The isolation guard must
# validate TEST_DATABASE_URL/E2E_TEST_DATABASE_URL against the operational target.
pnpm verify:native
pnpm verify:client
pnpm lint
pnpm typecheck
pnpm format:check
pnpm build
pnpm test:unit
pnpm test:integration
pnpm verify:commands
pnpm test:e2e
```

Expected: schema deploy/typed generation and source checks pass, PHASE 1 suites still execute,
and new suites are discovered. In particular, registering new browser files and extending
guarded fixture reset/global-setup is required before test:e2e can prove PHASE 2. Existing
foundation fixture Season inserts must provide the new required competitionName field.

After implementation, focused integration diagnosis can use the existing Jest command:

```powershell
pnpm --filter @whistle-epl/backend run test:integration --testPathPatterns=phase-2
```

It does not replace the complete integration/regression run. Fixture preparation is performed
by the guarded suite/global-setup helper; no new production HTTP reset endpoint is proposed.

## Business validation walkthrough

1. Create an unstaffed season with only creation permission; inspect acknowledgement and
   lack of automatic role/read access. Assign two managers separately through UC03. Check
   permitted editing, duplicate/invalid/stale saves and another season's access rejection.
2. Draft the full D097 test configuration in the actual regulation form, save incomplete
   content, then complete and submit. Exercise return/withdraw/successor revision and deny
   every preparer/editor's self-approval. Approve only with an independent current manager.
3. Use a controlled test clock for immediate/future rules. Inspect current/waiting/history,
   cancel/replace before the deadline and test the exact cutoff. Restart/catch up and run
   concurrent dependent-write/job processing. Before a separate job resolves due work, verify
   GET returns 503 if the correct basis is unresolved and does not change version state, current
   pointer, activation audit/history or receipts. Compare business-blocked and technical-failed outcomes.
4. Create/search/correct clubs/stadiums. Review same-name warnings with explicit reason,
   reject duplicate normalized codes, retain references and inspect permitted before/after.
5. Upload/replace/remove each actual club logo. Check real bytes, old-reference denial,
   normalized MIME/no-store, fallback, invalid/animated/oversized input and failed storage/audit.
6. Discontinue/resume a referenced Club/Stadium. New-use attempts must fail while discontinued;
   approved commitments/history survive. Repeated cycles preserve identity/code/reasons;
   previously rejected/cancelled work and permissions never revive automatically.
7. Against declared typed summary/readiness fixtures, propose/approve closure independently.
   Test finite ends before, equal to and after the trusted closing instant, an unspecified end,
   unresolved future plans, pending requests and readiness changing during approval. Verify
   Closed metadata cannot be edited through UI/direct
   requests or pending reopen, then approve reopen and check retained freeze/history rules.

These steps exercise PHASE 2 workflows. Simulated later-fact adapters and summary fixtures
do not establish actual operational registration, schedule, result or report acceptance.

## Browser, performance and recovery checks

Run actual Chrome and Edge through registered E2E suites; record versions. At 360x800,
768x1024 and 1366x768 inspect required controls, table scrolling and media fallback. Test
Loading/Empty/Error, valid-entry preservation, session loss and explicit conflict review.

The implemented load fixture requires an empty migrated loopback database named
`whistle_test_phase2_lookup`. Set `TEST_DATABASE_URL` privately and keep it
different from `DATABASE_URL`. The output path must be absolute, protected and
outside tracked files. Prepare once, then run the application against that same
database with the declared HTTPS origin:

Target distinctness compares normalized host, port and decoded database name,
including localhost/127.0.0.1/IPv6-loopback aliases. Both configured URLs must have
explicit ports and no query/fragment overrides; ambiguous endpoints are refused
so a `PGPORT` default cannot silently change the compared endpoint.
The fixture output is reserved exclusively before any seed transaction; an
existing output stops preparation without seeding. Failed preparation removes
only the reservation created by that invocation.

After a failure that may have committed seed data:

1. Stop the isolated lookup application and independently verify its PostgreSQL
   host, port and database name against the dedicated test configuration.
2. On that verified disposable server only, drop and recreate exactly
   `whistle_test_phase2_lookup`. Do not reset an application, shared or operational target.
3. Apply the release's migrations with `pnpm db:migrate` using that isolated
   target, then restore the original operational `DATABASE_URL` in the fixture
   shell whenever it was configured; unset it only if it was originally absent.
   Keep `TEST_DATABASE_URL` distinct from that URL. The lookup URL belongs only
   to the migration step and isolated application, not the comparison reference.
4. Select a new protected output path and rerun preparation. Preserve any
   pre-existing output; neither the script nor this guide deletes arbitrary paths.

After a partial recovery-fixture run, replace its disposable database and
dedicated media/state/backup roots before retrying. The generator does not clean
up arbitrary configured targets or treat partially written media as a fresh run.
This also applies when fixture creation succeeded but a later backup, restore,
verification or daily scheduler step failed. Preserve diagnostic evidence first,
then provision fresh disposable targets and a new protected
`PHASE2_RECOVERY_FIXTURE` output path; the shell drill allocates a new path itself.
A direct rerun against populated roots or scheduler state is not a reset.
Keep raw logs, credentials and unredacted diagnostics in ignored `.verification/`.
Only durable, redacted verification reports belong in tracked `docs/verification/`.

```powershell
$env:NODE_ENV = 'test'
# Set PHASE2_LOOKUP_FIXTURE privately to an absolute ignored JSON output path.
node backend/scripts/prepare-phase2-lookup.cjs
# PHASE2_FIXTURE points to that output as seen by k6.
$env:PHASE2_ISOLATED = 'ISOLATED_CLUB_LOOKUP'
# Set PHASE2_ORIGIN to the isolated HTTPS origin, with a trusted certificate.
k6 run tests/performance/phase-2-club-lookup.js
```

Supply the declared isolated target/session configuration expected by the script without
logging credentials. Expected: 20 concurrent users, 1-minute warm-up/10-minute measurement,
at least 95% club lookups <=2 seconds per measured group under recorded D097 machine/profile.
This is SC-010's partial internal master-list benchmark. HQ-01 public club lookup acceptance
remains in PHASE 6 with D097's 20 clubs, 380 matches and at least 600 player profiles.
Record the actual machine/profile, workload and per-group API timings. Keep the applicable
browser/UI evidence separate and retain authentication load regression. No new write-latency threshold is implied.

The workload retains cookies between iterations, checks readiness/authenticated
fixture access before measuring, and requires nonzero measured samples. It uses
25 declared Club rows: twenty for the baseline and five additional pagination
records. See the executed [lookup evidence](../../docs/verification/phase-2/lookup.md).

On the isolated Linux reference host, existing command names remain:

```sh
pnpm test:ops
pnpm ops:backup
pnpm ops:verify '<selected-isolated-set-id>'
pnpm ops:restore '<selected-isolated-set-id>' 'RESTORE:<isolated-database-name>:<selected-isolated-set-id>'
```

Operator commands require their existing explicit configuration, target/operation controls
and confirmations; these examples do not bypass CLI guards or supply secrets/default targets.
Replace the placeholders with the selected complete set ID and the configured isolated
OPS_DB_NAME; use the same set ID in both restore arguments. Select the set ID printed by the
immediately preceding successful `ops:backup`, not an arbitrary older retained set. Exclude
unrelated backup/retention runs in this isolated drill until restore completes. `ops:verify`
itself creates and restores a separate verification set after validating the selected set;
its backup runs retention, which keeps the seven newest verified sets, so the just-created
selected set remains available for the explicit restore. The PHASE 2 extension preserves
the existing retention safeguards as required by the [media recovery contract](contracts/media-recovery.md#backup-set-extension).
Run only against the explicit isolated loopback test target required by the script.
After extension, the completed set must be version 2 with nonempty verified media inventory.
Verify corrupt/incomplete/wrong-schema sets are rejected before restore; restore database and
content from the same valid set into the separate target. Interrupt midway and prove continued
maintenance closure/resume, then release only after reference/checksum verification and
fresh login. Exercise replacement/cleanup/backup races and retained-set-safe cleanup.

For the implemented twenty-logo/two-season drill, use a new migrated
`whistle_test_phase2_recovery_<suffix>` database and empty protected media/backup
roots, with `NODE_ENV=test` and the existing isolated test operator configuration.
Run `bash ops/backup/tests/phase-2-recovery.sh` as the configured media owner.
It generates authorized synthetic fixtures, performs retention/interruption/
restore checks and executes the scheduler's daily path. The script refuses a
populated target. See [recovery evidence](../../docs/verification/phase-2/recovery.md).

## Review and evidence

Record actual commands/environment, revision, test inputs/clock/assets, independent committed
state, per-case results/measurements, defects and reviewer under docs/verification/phase-2/.
Keep unavailable assets/production values/profile checks explicitly open. Do not create a
passing report from this guide or mark later integrated/BM-07 criteria complete.

The PHASE 2 implementation and acceptance are complete. Readers may run the
implemented verification drills against explicitly isolated targets using the
guards above; consult the [completed evidence](../../docs/verification/phase-2/acceptance.md).
Task-to-Issue mapping and original approval provenance remain in tasks.md.
PHASE 3 implementation still requires separate authorization; this guide does
not authorize commit/push, PR creation or merge.

<!-- /coderabbit-ai-generated:v1 -->
