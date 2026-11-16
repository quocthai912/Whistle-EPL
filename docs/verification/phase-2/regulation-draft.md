# PHASE 2 Regulation draft verification

**Recorded:** 2026-11-16 (Asia/Bangkok). **Scope:** T010 draft entry, persistence, and validation.

## Initial candidate

| Check | Observed result |
|---|---|
| Focused backend validation and PostgreSQL draft routes | PASS, 11 validator tests and 8 integration tests. |
| Full backend regression | PASS, 54 unit tests and 130 integration tests across 20 integration suites. |
| Full frontend unit regression | PASS, 73/73 tests in 12 files, with existing jsdom pseudo-element notices. |
| Linux image builds and HTTPS smoke | Backend and frontend builds passed. Readiness returned 200, and both unauthenticated Regulation GET routes returned 401. |
| Browser draft journey | PASS, 2/2 in Chrome and Edge. An assigned manager created an incomplete draft, saved one field, and verified it after reload. |

Browser tests used the separate `whistle_test_browser_phase2` fixture at `https://localhost:53405`. TLS verification remained enabled. The authorized Caddy CA was verified absent after the run.

## Review corrections

The combined draft is validated on PATCH under the same locks that protect persistence.
Nested field errors retain the submitted indexes and inaccessible version reads return 404.
The MH12 workspace shows the approved editable 20-club proposal and uses persisted current
and waiting summaries independently of the version history page. Window editing preserves
seconds and milliseconds. The final mixed-precision regression confirms that two adjacent
boundaries represent the same instant even when one input omits trailing zeroes.

| Check | Observed result |
|---|---|
| Backend validation and scoped draft routes | PASS, 12/12 and 10/10. |
| Full backend regression after review | PASS, 55/55 unit tests and 132/132 integration tests in 20 suites on the disposable `whistle_test_phase2_t003_final` database. |
| Full frontend regression after the main review corrections | PASS, 74/74 tests in 12 files. |
| Final focused React suite | PASS, 4/4, including mixed-precision adjacency, exact UTC preservation during array replacement, the confirmed source proposal, and persisted overview on an older page. |
| Source checks | Backend/frontend typecheck, scoped ESLint, Prettier, E2E TypeScript, and `git diff --check` passed. |
| Browser draft journey after the main review corrections | PASS, 2/2 in Chrome 157.0.8103.51 and Edge 157.0.4341.60. The subsequent mixed-precision comparison adjustment was exercised in the final React suite. The CA was again verified absent after cleanup. |
