# PHASE 1 security regression

- **Date** 2026-11-06 (Asia/Bangkok)
- **Task** T047, SC-005, SC-006, SC-008 and SC-009
- **Application under test** [ee5da91](https://github.com/quocthai912/Whistle-EPL/commit/ee5da91b1b8b8fdece641ed6b6790f7df9280093)
- **Environment** Windows x64, Node 24.14.0, pnpm 10.33.2, real PostgreSQL
  17.11 and separate disposable HTTP and browser databases. Chrome
  156.0.8078.81 and Edge 156.0.4314.58 used trusted localhost HTTPS.

## Coverage and results

- The [security regression suite](../../../backend/tests/integration/security-regression.spec.ts)
  denied 12 distinct direct requests by a non-administrator. The cases cover
  account, audit, proposal and grant listings, account create/edit/lock/unlock/reset,
  seasonal/system-role grants and Create Season permission. Each returned a
  safe 403 envelope. Independent database observations matched across all
  denials for account revisions, audit records, receipts and assignments.
- The same suite rejected an injected audit actor filter, returned zero
  matches for an injected account search, and checked that credential values
  and fields were excluded from account, session, audit and receipt
  projections. The stored credential used Argon2id.
- `pnpm --filter @whistle-epl/backend test:integration
  "security-regression|atomic-admin|audit-access"` passed nine tests.
  The suite also injected a required audit failure and independently verified
  rollback of the business change, session effects and receipt. The replay
  probe covered connection loss after commit and a conflicting changed intent.
- The trusted HTTPS audit scenario passed in Chrome and Edge. A value
  resembling executable HTML was visible as literal text with no rendered
  image node. After logout, a second identity using the same browser context
  received access denied and the previous table was absent. Browser storage
  was empty. Existing browser scenarios also exercise anonymous direct
  navigation, restricted password change and invalidated sessions.
- The full trusted HTTPS suite passed 30 scenarios across both browsers
  with the security probe included.
- A fresh Nest application and database adapter used the same PostgreSQL
  state before cleanup. At the exact 30-minute idle and eight-hour absolute
  boundaries, the persisted sessions failed. The logged-out and revoked
  cookies also failed while all four session rows still existed.
- The full PostgreSQL suite passed 85 tests across 16 suites.
- `pnpm --filter @whistle-epl/frontend test:unit audit http-client` passed
  nine tests, including stale-response rejection after account change.
- A targeted scan of backend logs, the HTTP regression output and the
  Playwright report found no synthetic credential, Argon2 digest, reusable
  cookie/CSRF value or credential-bearing database URL. The controlled
  server error logged an event code and request ID. Browser traces and
  videos were disabled.

Cross-season scope, self-escalation, revoked-session and exact boundary
scenarios also use the established [administration](administration.md)
and [authentication](authentication.md) suites. The browser fixture reset
required the separate test database and explicit acknowledgement. No
deployment identity or credential was used.
