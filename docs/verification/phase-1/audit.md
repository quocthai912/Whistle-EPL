# PHASE 1 audit lookup verification

- **Date** 2026-11-06 (Asia/Bangkok)
- **Scope** UC04 and T038–T041
- **Review base** `b6e6d031a985a454e77ca7771c6205e7100c6bc3`
- **Full browser suite revision** `0bfc19af907c992d4e184b8a7a00e8238dec7ccc`
- **Tested implementation** Feature branch `feat/phase-1-audit-and-verification` in
  [draft PR #63](https://github.com/quocthai912/Whistle-EPL/pull/63) and
  [draft PR #64](https://github.com/quocthai912/Whistle-EPL/pull/64).

Hosted workflow and branch-protection evidence are tracked under T042–T043.

## Environment and fixture controls

Windows x64, Node 24.14.0, pnpm 10.33.2, PostgreSQL 17.11, Caddy 2.11.7,
Google Chrome 156.0.8078.81 and Microsoft Edge 156.0.4314.58. The PostgreSQL
integration and browser suites used separate disposable loopback targets,
`whistle_test_audit` and `whistle_test_browser_audit`. All seven committed
migrations were deployed on both databases. Browser tests used built
frontend/backend code and trusted Caddy TLS at `https://localhost:8447`.
Playwright reset the browser database only after explicit
`RESET_ISOLATED_TEST_DATABASE` acknowledgement. The fixtures used synthetic
accounts, two isolated season references and credentials supplied by the test
process. Browser traces and videos were disabled. MH10 screenshots contain
synthetic data and remain local verification artifacts.

## Observations

| Task | Evidence |
| --- | --- |
| T038 | `pnpm test:integration audit-access` passed two HTTP cases on PostgreSQL. Anonymous, ordinary, manager and password-change-required sessions are covered across HTTP and browser tests. The query probes exercise exact actor/action/object matches, half-open UTC times, unsupported methods and export, safe errors, default 20/max 100 and pagination with same-time ties. |
| T039 | A mismatched protected object returns metadata with redacted reason and changes. An existing account read under current administrator authority exposes the permitted per-action summary. A successful lookup refreshes only documented D080 session activity. Audit rows are compared before and after lookups. |
| T040 | The Vietnamese MH10 page uses the shared purple administration styling, local artwork, an action/date/identifier filter toolbar, responsive sidebar and a read-only details dialog. Frontend tests exercise direct denial, empty/filter/page/retry behavior and literal rendering of executable-looking text. |
| T041 | `pnpm test:e2e` passed 30 scenarios over HTTPS, 15 per browser. The audit journey creates real login, logout, account, season-role grant, edit, lock and operator recovery events. It verifies history across locking, actual technical cleanup, page navigation, unauthorized direct access and secret exclusion. The audit table scrolls within its region at 768 and 390 pixels. |

`pnpm test:unit` passed 15 backend and 24 frontend tests. PostgreSQL
integration passed 82 tests across 15 suites. Lint, typecheck, non-mutating
format check, build and the compiled Prisma client construction check passed
in the recorded local or hosted runs.

Both HTTP cases failed with the expected missing-route 404 when rerun with
the pre-audit AppModule from the review base. The frontend route and
rendering probes also failed before the audit route and page were added.
The two targeted browser audit cases passed again after the column-heading
layout adjustment.

Independent Standards and Spec reviews surfaced the D080 activity rule,
UTC-only timestamp validation, sensitive Playwright diagnostics, missing
negative filter cases and insufficient lock/cleanup assertions. The
implementation and tests were updated before the recorded passing runs.
Follow-up review identified a possible stale maintenance decision when using
repeatable-read admission. The query now gets page keys and total from one
parameterized PostgreSQL statement and retains the usual read-committed
admission for the session update.
Phase acceptance and the later verification tasks use their own evidence.
