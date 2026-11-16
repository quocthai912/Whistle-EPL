# PHASE 2 Season creation verification

**Recorded:** 2026-11-15 (Asia/Bangkok). **Scope:** T008, including the create-only UI and API.

`POST /api/v1/seasons` authorizes the current explicit creation grant and returns the
new Season ID and revision. The normalized command, OPEN Season, receipt, and audit
record are verified in the same transaction. The UI uses the MH11 create dialog in the
existing administration layout. The required competition name is an additional field
from the approved contract. The create-only journey makes no Season GET request.

| Check | Observed result |
|---|---|
| Focused creation HTTP contract and complete Season integration suite | PASS, 5/5 and 13/13. Covers explicit creation authority, normalized inputs, receipt replay, duplicate/concurrent creation, and audit rollback. |
| Full backend regression on disposable PostgreSQL 17.11 | PASS, 19/19 suites and 118/118 tests on `whistle_test_phase2_t003_final`; `TEMP`/`TMP` were workspace-local. |
| Focused frontend Vitest | PASS, 10/10. Includes cancel, field feedback, raw ASCII validation, and keeping the same request body and idempotency key after an uncertain outcome and pre-receipt retry rejection. |
| Source and browser project checks | Backend/frontend typecheck, scoped ESLint, Prettier, Playwright TypeScript check, and `git diff --check` passed. Separate pinned Docker frontend/backend builds passed. |
| Live browser journey | PASS, 2/2, Chrome 157.0.8103.51 and Edge 157.0.4341.60. An administrator grants creation to a fresh account with no seeded role. The account creates a Season through the MH11 form, sees the ID/revision acknowledgement, and sends exactly one Season POST with no Season GET. |

The live test ran with `pnpm test:e2e phase-2-seasons.spec.ts` on
`https://localhost:58298` against the separately migrated `whistle_test_browser_phase2`
fixture database. The user authorized temporary trust for the pinned Caddy CA.
TLS verification stayed enabled. The final run verified that the test CA was absent
from the Windows `CurrentUser` trusted root store after cleanup. Two earlier attempts
identified test-harness interaction issues in the account drawer, now corrected.
