# PHASE 2 ordered business execution verification

**Recorded:** 2026-11-15 (Asia/Bangkok). **Scope:** T004 shared execution, typed-lock, and
command-receipt seams. This evidence does not establish that later HTTP adapters or business
workflows are wired or accepted.

## Implemented boundary

`BusinessExecutionService` requires a discriminated session, system, or operator principal,
an explicit operation-specific authority callback, and a typed lock plan. Receipt-bearing
critical commands require a session principal; the receipt account ID is derived from that
principal. System and operator work can use the ordinary transaction path and cannot create
an account-scoped receipt through the critical path.

`TransactionContext` normalizes and orders known lock kinds through static table/column
mappings, acquires the complete planned set before receipt processing, verifies discovered
resource coverage, and permits one receipt lock after business locks. Identifiers used as
row locks must be UUID v4 values. The existing database transaction wrapper retains its
bounded retries for known rollback outcomes.

`CommandReceiptService` validates a per-action field allowlist and canonicalizes receipt
content before hashing. Season creation uses the fixed `SeasonCollection` target and does
not invent a previous revision. Regulation, regulation-change, and lifecycle approval
intents bind to submitted version IDs and expected revisions. A lifecycle `CLOSE` requires
its readiness-basis reference; `REOPEN` does not carry one. Replays are serialized by
account/action/key, require current authority, return the stored outcome for matching content
within 24 hours, reject changed content, and report an unresolved pending outcome as
unavailable. Owning business work remains responsible for fresh state checks after a new
receipt has been established.

The T007 HTTP adapter must derive the session principal from a live authenticated cookie
session, lock and recheck the current session/account authority, and validate CSRF/Origin.
Request-body values must not be used to construct a principal. That transport adapter is not
part of this T004 evidence.

## Verification

The test target was the disposable PostgreSQL 17.11 container `whistle-phase2-01a1de46` at
loopback `127.0.0.1:50743`, database `whistle_test_phase2_t003_final`. Credentials are omitted.
Node `v24.14.0` and pnpm `10.33.2` match the pinned repository toolchain. The full integration
run set `TEST_DATABASE_URL` only for the isolated database and set process `TEMP`/`TMP` to
`.verification/phase-2/preflight-temp` to keep Windows temporary-file operations inside the
workspace.

| Check | Result |
|---|---|
| Focused `phase-2-security.spec.ts` integration suite | PASS, 7/7 tests. Covers required authority, principal-to-receipt actor binding, system/operator exclusion from receipts, fixed season creation scope, normalization, exact-version approval intents, replay/current-access/expiry behavior, rollback, and ordered row/advisory locks. |
| Full backend PostgreSQL integration suite | PASS, 19/19 suites and 107/107 tests. Existing administration and inherited integration behavior remained green. |
| Isolated maintenance temporary-file regression | PASS, 1/1 with workspace-local `TEMP`/`TMP`. The first full-suite attempt using the default Windows sandbox temp path hit `EPERM` on an atomic rename; the isolated retry and full rerun passed without source changes. |
| Backend typecheck | PASS, `pnpm --filter @whistle-epl/backend typecheck`. |
| Focused ESLint | PASS for `business-execution.ts`, `transaction-context.ts`, `command-receipt.service.ts`, and `phase-2-security.spec.ts`. |

Focused command:

```powershell
pnpm --filter @whistle-epl/backend exec jest --config jest.integration.config.cjs --runInBand --runTestsByPath tests/integration/phase-2-security.spec.ts
```

Full integration command:

```powershell
pnpm --filter @whistle-epl/backend test:integration
```

No PHASE 2 acceptance or deployment input is inferred from these platform tests.
