# PHASE 2 audit, history, and business execution verification

**Recorded:** 2026-11-15 (Asia/Bangkok). **Scope:** T007 audit writer policy, authorized
object history, shared execution and HTTP seams. The evidence verifies infrastructure only; it
does not claim that later business workflows or PHASE 2 acceptance are complete.

## Implemented behavior

`AuditWriterService` accepts only action-specific scalar summaries and validates the owning
object kind, UUID references, season scope, required reason/effectivity, and exact immutable
version references. It rejects nested request snapshots, credential fields and storage paths.
Season dates, text bounds, and Club/Stadium editable fields are checked against the approved
data-model limits. Update/correction before and after summaries must have the same changed
field keys and at least one changed value. Immutable codes are not accepted as update fields.

`REGULATION_APPROVED` requires its approval reason. `CLUB_CORRECTED` and `STADIUM_CORRECTED`
require a reason plus a nonempty `correctionBasis` reference of at most 2,000 characters;
ordinary `CLUB_UPDATED` and `STADIUM_UPDATED` actions do not require correction metadata.
FR-026 requires identification of affected records, but the approved model and current schema
define no persisted impact-review reference. T016/T020 must supply and retain the actual
owner-reviewed impact set; T007 does not generate a synthetic identifier or claim that review.

PHASE 2 business audit appends require a transaction-bound execution principal, and ordinary
events must record that exact actor. `appendSystemTechnical(context, eventWithoutActor)` derives
`SYSTEM` and is limited to regulation activation/blocked transitions and media cleanup. It
requires the same bound transaction, so an authenticated mutation can resolve due work while
recording the technical event as SYSTEM without trusting a caller-supplied actor. No activation
job or media cleanup workflow was installed.

`BusinessHistoryService.list` requires an owner-supplied current-read authorization callback,
typed target locks, and an exact `{objectKind, objectId}` query, with a `seasonId` conjunct for a
season-scoped target. A Season read cannot aggregate Club, Stadium, or Phase 1 rows from the
same season. Default pagination is page 1/page size 20, maximum 100. Projection reveals bounded
business detail only for the exact action/object pair; UC04 administration search remains
metadata-only without object-read authority.

The shared backend interface for later route owners is:

```ts
type HttpBusinessOperation = {
  locks: readonly LockResource[];
  discover?: (db: Prisma.TransactionClient) => Promise<LockResource[]>;
  authorize(context: TransactionContext, accountId: string, now: Date): Promise<void>;
};

HttpBusinessExecutionAdapter.executeCritical(request, operation, intent, work, project)
```

The adapter resolves the principal from a live session cookie, adds session locks, and enforces
current operation authority, Origin and CSRF. Its critical-write intent excludes the key; the
adapter binds that from `Idempotency-Key`. History owners provide
`BusinessHistoryScope { kind, id, seasonId?, locks, discover?, authorize }` to
`BusinessHistoryService.list(request, scope, { page, pageSize }?)`; the result is bounded
`{ page, pageSize, total, items }`. These are backend seams only; no new history or business
routes were installed in T007.

AppModule startup validates the static catalog built from the actually installed dependency
module registry. No later writer module is registered, and deliberate later-owner
`UNAVAILABLE` states do not fail global startup.

## Verification

The application tests used the disposable PostgreSQL 17.11 fixture database
`whistle_test_phase2_t003_final` at `127.0.0.1:52502`. Credentials are omitted.
`DATABASE_URL` was unset for test runs; `TEST_DATABASE_URL` was scoped to the integration
commands. `TEMP` and `TMP` pointed to `.verification/phase-2/t007-temp`.

Environment: Windows PowerShell, Node `24.14.0`, pnpm `10.33.2`, Prisma `7.10.1`, TypeScript
`5.9.3`. Branch `feat/phase-2-foundation-and-season-regulations`, observed `HEAD`
`58fe5cc01eff2abad5c07c561486976bdccd6794`; implementation and evidence are working-tree
changes and were not committed or pushed.

| Check | Result |
|---|---|
| Audit policy unit suite | PASS, 5/5. Covers required approval/correction reasons and basis, exact references, matching/different before-after fields, typed bounds/dates, and excluded paths/snapshots. |
| `phase-2-security.spec.ts` | PASS, 12/12. Covers exact-object history isolation for same-season Club versus Season, current-read authority, UC04 metadata-only projection, live-session Origin/CSRF and current operation authority, exact session actor binding, trusted SYSTEM activation inside an authenticated transaction, system-only media cleanup, and rollback on invalid required audit. |
| Full backend PostgreSQL integration suite | PASS, 19/19 suites and 113/113 tests. `TEMP`/`TMP` were workspace-local. |
| Backend typecheck | PASS, `pnpm --filter @whistle-epl/backend run typecheck`. |
| Focused ESLint | PASS for the changed audit, transaction, and security-test files. |
| Prettier and `git diff --check` | PASS. |
| Linux production-style smoke | PASS, as separately run by the coordinating agent: pinned backend Dockerfile build from this worktree, migrated ten-migration fixture DB in private container networking, no published ports; `/health` and `/ready` both returned 200. Image index digest: `sha256:e89f5ac50b0427b02e8ff617507cc06dab92f8452b882757524b915208302b65`. |

Focused integration command:

```powershell
pnpm --filter @whistle-epl/backend exec jest --config jest.integration.config.cjs --runInBand tests/integration/phase-2-security.spec.ts
```

Full regression command:

```powershell
pnpm --filter @whistle-epl/backend run test:integration
```

No later workflow, live browser test, deployment, commit, push, or PHASE 2 completion is
inferred from these results.
