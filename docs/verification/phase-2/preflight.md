# PHASE 2 implementation preflight

**Recorded:** 2026-11-15 (Asia/Bangkok). **Scope:** T001 setup evidence before PHASE 2 source changes. This record classifies implementation and deployment inputs; it does not accept PHASE 2 or change its ledger status.

## Baseline and accepted foundation

The checkout started at `58fe5cc01eff2abad5c07c561486976bdccd6794` on `feat/phase-2-foundation-and-season-regulations` with a clean tracked/untracked worktree. The selected feature is `specs/002-phase-2-season-regulations`; the 16-item requirements checklist is 16/16 checked, and `.specify/extensions.yml` is absent. The runtime is Windows 11 Home, build `10.0.26300`, x64, Node `24.14.0`, pnpm `10.33.2`; dependencies are already installed. The checked-in package pins match the observed Node/pnpm versions.

PHASE 1 remains the accepted foundation. Its 2026-11-06 acceptance records 15 backend and 24 frontend unit tests, 85 PostgreSQL integration tests, 30 Chrome/Edge cases, five operations tests, and the accepted T048 review at `e35ccef`. The 2026-11-08 post-acceptance regression is recorded in [UI refinement evidence](../phase-1/ui-refinement.md#audit-completeness-and-full-regression--2026-11-08). These are historical PHASE 1 results, not PHASE 2 results. See the [acceptance assessment](../phase-1/acceptance.md) and [recovery evidence](../phase-1/recovery.md) for their scope and limits.

## Current pre-edit regression

All database commands below used the uniquely disposable PostgreSQL 17.11 container `whistle-phase2-01a1de46` at loopback `127.0.0.1:50743`; the credential is intentionally omitted. The integration database was `whistle_test_phase2_integration`. No operational URL or shared database was configured.

| Command or check | Observed result |
|---|---|
| `node --version`; `pnpm --version` | `v24.14.0`; `10.33.2`. |
| `pnpm db:validate` | PASS; Prisma 7.10.1 validated the existing schema. |
| `pnpm db:migrate`; `pnpm db:status` | PASS on the fresh isolated integration database; all seven checked-in migrations applied and status was up to date. `DATABASE_URL` was removed before tests. |
| `pnpm test:integration` with `NODE_ENV=test` and only `TEST_DATABASE_URL` set to the isolated integration database | First run: 16/17 suites and 90/91 tests; the only failure was an `EPERM` rename under the default Windows sandbox temporary directory in `maintenance.spec.ts`. Rerun with `TEMP` and `TMP` set to `.verification/phase-2/preflight-temp`: PASS, 17/17 suites and 91/91 tests. No source changed between runs. The failure was specific to the default temporary path; no database isolation guard was bypassed. |
| `pnpm test:unit` | PASS: backend 5 suites/15 tests and frontend 8 files/39 tests. Existing jsdom `getComputedStyle()` pseudo-element warnings were emitted. |
| `pnpm verify:native` | PASS: `win32/x64`, Node `v24.14.0`. |
| `pnpm test:ops` | Not runnable in this Windows shell: its Python app-execution alias reported “The system cannot execute the specified program.” On the exact baseline source, the coordinating Linux verification image independently ran `python3 -m unittest discover -s ops/backup/tests`: PASS, 5/5. |

The coordinating preflight ran on Docker Engine 29.9.2 using a Git archive of the baseline revision. `docker build -f backend/Dockerfile .` and `docker build -f frontend/Dockerfile .` succeeded with the checked-in Node 24.14.0 and Caddy 2.11.7 pins. Caddy and the backend ran on a disposable bridge, with only Caddy published on loopback and its address trusted as the immediate proxy. The backend used the separately migrated browser database. A Node fetch with `NODE_EXTRA_CA_CERTS` pointing to the public test CA returned HTTP 200 for `/` and `/api/v1/ready` at `https://localhost:61759`.

For the Linux recovery drill, the pinned PostgreSQL 17.11 Bookworm image supplied the Debian 12 host and matching PostgreSQL client tools. The verification image added Python 3.11.2 and copied Node 24.14.0 and the compiled baseline backend from the application image. The restore database had all seven foundation migrations and zero accounts, seasons or sessions. The Linux test operator ran as UID/GID `999:999`, with a root-owned configuration readable by that operator, distinct `/phase2-state` and `/phase2-backups` directories, and matching libpq and application database targets on loopback. Using the protected `OPS_CONFIG_FILE`, the executed command sequence was:

```bash
set -o pipefail
fixture_set=$(bash /app/ops/backup/backup.sh 'Phase 2 preflight foundation baseline' | tail -n 1)
bash /app/ops/backup/verify-foundation.sh "$fixture_set"
```

The same-set restore, inventory comparison, zero-active-sessions assertion and corrupt-set refusal passed. No existing session was present to exercise revocation in this run. The manifest was v1 `available-foundation` with an empty media inventory. This UID and fixture do not describe the PHASE 2 media host or supply PHASE 2 media-recovery evidence.

The PHASE 1 Playwright suites registered at the baseline revision were not rerun. Automatic approval review rejected adding the local Caddy CA to Windows browser trust. The local HTTPS smoke used normal certificate validation, and the previously accepted PHASE 1 Chrome/Edge results are historical evidence. PHASE 2 browser verification remains pending.

## Target isolation and protected configuration

| Purpose | Isolated target and observed scope |
|---|---|
| Integration and migration | `whistle_test_phase2_integration` on the disposable loopback PostgreSQL instance. `backend/tests/fixtures/isolated-target.guard.ts` requires `NODE_ENV=test`, PostgreSQL on loopback, a `/whistle_test_*` database name, no URL query/hash, and a target distinct from `DATABASE_URL`. Integration reset helpers require the literal `RESET_ISOLATED_TEST_DATABASE` acknowledgement. |
| Browser | `whistle_test_browser_phase2`, separate from integration and restore. The configured local origin is `https://localhost:61759`. Playwright restricts origins to local HTTPS and `tests/e2e/global-setup.ts` requires a `whistle_test_browser` database name with an optional suffix before its guarded reset. The database was migrated for the baseline smoke. No Playwright reset or test run occurred. |
| Restore | `whistle_test_phase2_restore`, separate from integration and browser. The isolated Linux drill used distinct `/phase2-state` and `/phase2-backups` roots and a root-owned operator configuration. It exercised the foundation-only v1 format with no media. |

The database credentials were supplied ephemerally for the disposable container and are excluded from this report. At the end of the local preflight, `DATABASE_URL`, `TEST_DATABASE_URL`, `E2E_TEST_DATABASE_URL`, `E2E_BASE_URL`, `E2E_RESET_ACK`, `OPS_*`, `MEDIA_ROOT`, and `MEDIA_UID` were unset. No `.env` or `.env.test` file is present in the checkout. The existing Playwright guard does not permit the integration database to stand in for the browser database.

## Operational inputs and remaining gates

| Input | Evidence-based classification |
|---|---|
| Existing Season `competitionName` mapping | No operational database/configuration or reviewed row mapping is available in this checkout. PHASE 1’s model has no `competitionName` column, and the approved data model requires an explicit reviewed mapping before the migration makes it `NOT NULL`; it forbids inference from a season code. T002 may use explicitly labeled isolated fixture values to verify the mapping mechanism. A production/populated migration remains gated until the accountable operator supplies and reviews actual per-Season values. |
| Authorized 20-club logo files and provenance | Not supplied in the repository or isolated target. The approved media/recovery contract and `context/open-decisions.md` keep asset rights and actual fixture contents open. No asset was fetched or treated as approved. Logo upload, nonempty-media recovery, and related acceptance remain gated on authorized real assets. |
| Persistent media root, storage UID, capacity/free space | No protected media runtime configuration, persistent media root, storage UID, or capacity/free-space measurement was supplied. The PostgreSQL test container UID/GID 999 and the isolated restore paths above are database/recovery test inputs, not evidence for a media mount. Media deployment and nonempty-media recovery remain gated on the selected protected root, ownership and measured capacity. |
| Operational season/rule values | No operational cutoff, intake calendar, planning duration/buffers, or qualification/relegation counts were supplied. `context/open-decisions.md` retains the related O01/O02/O03/O05 inputs. D097 test values remain test-only and will not be used as operational defaults. |
| Full deployment and restore profile | No production database URL, selected external storage provider, production certificate/domain/proxy configuration, or off-host destination is present. The isolated available-foundation drill is evidence only for its declared baseline profile; PHASE 2 media and full PHASE 10 recovery criteria remain with their owners. |

These missing values block only the migrations/deployment/acceptance that depend on them. They do not authorize fake Season values, unapproved image downloads, media paths inferred from test roots, or changes to the approved scope. This record captures the current state; later supplied inputs require a dated evidence update rather than retroactive claims.
