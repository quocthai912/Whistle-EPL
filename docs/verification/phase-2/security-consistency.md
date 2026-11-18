# PHASE 2 security and consistency — T025

Execution date: 2026-11-18 (Asia/Bangkok). Source baseline:
`99c964f8b09b250af2e85582306fd8e5e4a7e5a5`, plus the T025–T030 working changes.
This is local verification, not a claim that these changes are published.

## Actual seams and results

The user approved real HTTP/PostgreSQL, browser and operator-command seams. The
Windows PostgreSQL 17.11 run passed 25 suites / 167 tests before the additional
20-logo case; its focused media rerun passed all three cases. The final combined
result is recorded in [regression.md](regression.md).

`phase-2-security.spec.ts` adds ten actual HTTP denials: no session, a season role
without a shared grant, the other master grant, missing/foreign Origin,
missing/incorrect CSRF, revoked/expired session and revoked shared grant.
Every denied creation leaves no Club or successful creation audit. Literal SQL
and markup text, percent/underscore characters and Vietnamese diacritics survive
creation/search as data; unsupported search/form fields and identity replacement
are rejected without another record.

Existing integration suites remain active: season/cross-season creation and
metadata permissions, exact regulation and lifecycle versions, union-editor
independence, current authority after lock waits, receipt replay before stale
checks, unknown outcome, expiry, business/technical activation failure and
required-audit rollback. `transaction-foundation.spec.ts` and the inherited
account, authentication, grant, delegation and audit suites were not filtered out.
Deterministic lock barriers and independent PostgreSQL connections inspect
committed state, receipts, history and unchanged pointers after failed work.

## Reproduction

Use a separately migrated, loopback `whistle_test_*` database. Set
`TEST_DATABASE_URL` privately; do not set `DATABASE_URL` to the same target.
Then run `pnpm test:integration`. The guarded fixture reset requires the existing
explicit acknowledgement and refuses an application target. No test endpoint,
security bypass or production policy was introduced.

The first new expiry fixture violated the database's session chronology check;
both creation and activity instants were corrected before the passing run.
The media fixture now clears its private content after each database reset,
preventing earlier test assets from contaminating later assertions.
