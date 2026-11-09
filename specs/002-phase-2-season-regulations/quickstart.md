# PHASE 2 Validation Guide

**Status**: Future validation/run guide after approved Tasks are implemented. No checks below
have been run by Plan preparation; new paths are explicitly identified as planned targets.
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
pnpm db:migrate
pnpm db:status
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
   concurrent request/job processing. Compare business-blocked and technical-failed outcomes.
4. Create/search/correct clubs/stadiums. Review same-name warnings with explicit reason,
   reject duplicate normalized codes, retain references and inspect permitted before/after.
5. Upload/replace/remove each actual club logo. Check real bytes, old-reference denial,
   normalized MIME/no-store, fallback, invalid/animated/oversized input and failed storage/audit.
6. Discontinue/resume a referenced Club/Stadium. New-use attempts must fail while discontinued;
   approved commitments/history survive. Repeated cycles preserve identity/code/reasons;
   previously rejected/cancelled work and permissions never revive automatically.
7. Against declared typed summary/readiness fixtures, propose/approve closure independently.
   Vary every blocker and race. Verify Closed metadata cannot be edited through UI/direct
   requests or pending reopen, then approve reopen and check retained freeze/history rules.

These steps exercise PHASE 2 workflows. Simulated later-fact adapters and summary fixtures
do not establish actual operational registration, schedule, result or report acceptance.

## Browser, performance and recovery checks

Run actual Chrome and Edge through registered E2E suites; record versions. At 360x800,
768x1024 and 1366x768 inspect required controls, table scrolling and media fallback. Test
Loading/Empty/Error, valid-entry preservation, session loss and explicit conflict review.

Planned load entry point (file does not exist until implemented):

```powershell
k6 run tests/performance/phase-2-club-lookup.js
```

Supply the declared isolated target/session configuration expected by the script without
logging credentials. Expected: 20 concurrent users, 1-minute warm-up/10-minute measurement,
at least 95% club lookups <=2 seconds per measured group under recorded D097 machine/profile.
Retain existing authentication load regression; no new write-latency threshold is implied.

On the isolated Linux reference host, existing command names remain:

```sh
pnpm test:ops
pnpm ops:backup
pnpm ops:verify
pnpm ops:restore
```

Operator commands require their existing explicit configuration, target/operation controls
and confirmations; these examples do not bypass CLI guards or supply secrets/default targets.
After extension, the completed set must be version 2 with nonempty verified media inventory.
Verify corrupt/incomplete/wrong-schema sets are rejected before restore; restore database and
content from the same valid set into the separate target. Interrupt midway and prove continued
maintenance closure/resume, then release only after reference/checksum verification and
fresh login. Exercise replacement/cleanup/backup races and retained-set-safe cleanup.

## Review and evidence

Record actual commands/environment, revision, test inputs/clock/assets, independent committed
state, per-case results/measurements, defects and reviewer under docs/verification/phase-2/.
Keep unavailable assets/production values/profile checks explicitly open. Do not create a
passing report from this guide or mark later integrated/BM-07 criteria complete.

Plan review must precede Tasks generation. Final approved Tasks receive exactly one GitHub
Issue each under the issue-tracker conventions, after cross-artifact analysis. Application
implementation, commit/push/PR and PHASE 3 remain unauthorized at this stage.
