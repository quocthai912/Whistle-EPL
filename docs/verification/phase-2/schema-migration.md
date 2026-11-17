# PHASE 2 Season and regulation schema migration

**Recorded:** 2026-11-15 (Asia/Bangkok). **Scope:** T002 schema and migration verification.
This evidence does not accept PHASE 2, approve operational Season values, or authorize an
expanded-schema deployment beyond the isolated test environment.

## Environment and migration paths

Validation used Node `24.14.0`, pnpm `10.33.2`, Prisma `7.10.1`, and the disposable
PostgreSQL `17.11` instance `whistle-phase2-01a1de46` at loopback `127.0.0.1:50743`.
Credentials are omitted. Targets were distinct test databases; the application used
`TEST_DATABASE_URL` only during tests and `DATABASE_URL` was removed before fixture/test
commands.

| Target | Starting state | Result |
|---|---|---|
| `whistle_test_phase2_fresh` | Empty database, no migration history or application rows | Standard `pnpm db:migrate` applied all 9 migrations; `pnpm db:status` reported up to date. An independent query confirmed zero Season, regulation-case or regulation-version rows and no mapping stage. No effective rule was seeded. |
| `whistle_test_phase2_populated` | Seven accepted foundation migrations and no application rows | A verification-only Prisma config applied migration 0001; synthetic baseline rows and a two-row explicit mapping were then staged; ordinary `pnpm db:migrate` applied migration 0002 and status was up to date. An independent query compared identities across accounts, Seasons, both role tables, delegation case/version/editor and audit: 5 accounts, 2 Seasons, 1 system role, 2 season roles, 1 delegation case/version/editor and 1 audit row were unchanged. The two test-only names were applied and the stage was consumed. |
| `whistle_test_phase2_integration` | Eight existing synthetic Seasons plus PHASE 1 accounts, grants/roles, receipts, session and audit rows; eight migrations applied | Eight per-Season synthetic mappings were staged. Standard `pnpm db:migrate` applied migration 0002, and `pnpm db:status` reported up to date. A separate PostgreSQL connection compared all IDs in 14 row groups: 20 accounts, 8 Seasons, 8 system roles, 13 season roles, 1 shared grant, 6 audit rows, 4 receipts and 1 session (delegation and create-season grant tables were empty). Every identity matched; all eight Season names and zero statistics revisions were verified, and the stage was consumed. |

The populated database's values were explicitly synthetic and confined to isolated test
rows. They demonstrate the reviewed mapping mechanism only. Follow the
[Season migration operator procedure](../../operations/phase-2-season-migration.md) and
obtain the accountable per-Season source mapping before any populated operational deploy.

## Schema and integration checks

| Check | Result |
|---|---|
| `pnpm db:validate` | PASS; Prisma 7.10.1 validated `backend/prisma/schema.prisma`. |
| `pnpm db:generate` | PASS; generated the Prisma 7.10.1 client. |
| Focused `phase-2-seasons.spec.ts` | PASS, 8/8 tests. Covers additive migration replay with a temporary schema and independent observer, immutable Season fields, exact case/version pointers, partial state uniqueness, ranking completeness/position order, same-group window overlap and adjacency, catalog bounds, exact-season change/lifecycle/summary references, and concurrent editor/child writes waiting for submission locks. |
| Focused `schema.spec.ts` | PASS, 6/6 tests, including migration/schema drift comparison and the explicit Season fixture name required by the new schema. |
| `pnpm test:integration` on `whistle_test_phase2_integration` | PASS, 18/18 suites and 99/99 tests. Existing PHASE 1 fixture resets ran against the expanded schema. |
| Targeted ESLint over changed TypeScript files | PASS. |
| `git diff --check` | PASS. |

The T002 fixture reset includes the new version/editor/child/case tables in the guarded,
acknowledged `TRUNCATE`; the existing fixture-isolation integration test exercises that
reset without `CASCADE` and verifies the Phase 2 rows are empty afterward.

## Remaining operational gate

No operational database or reviewed Season `competitionName` mapping was provided. The
isolated runs do not infer values from Season codes/names and do not supply a deployment
mapping. The migration blocks a populated database without a complete valid staged map;
the fresh path requires no staging relation. PHASE 2 remains in its existing ledger state.
