# PHASE 2 session and transport verification

**Recorded:** 2026-11-15 (Asia/Bangkok). **Scope:** T006 session hints, HTTP transport,
response-envelope handling, and test discovery. This is focused evidence only; it does not
establish PHASE 2 acceptance or live browser/media workflow acceptance.

## Implementation ownership

The T006 task lists `backend/src/identity-access/auth.service.ts`, but the existing session
projection is owned by `SessionService` in
`backend/src/identity-access/session.service.ts`. `AuthService` constructs and calls that
session module for login and authenticated session responses, so the projection was extended
at its existing owner; no `AuthService` change was needed.

The server emits menu hints only. Direct `PREPARE_REGULATION_CHANGE` is projected for an
assigned Season Manager. Delegated preparation is queried only for a current, unrevoked and
unterminated grant whose interval contains trusted current time and whose recipient retains a
D019-eligible role in that same season. `createSeason` remains alongside `canCreateSeason`;
temporary-password sessions retain only the account identity and `changeRequired` fields.

The shared response interceptor exempts only the exact helper-created `StreamableFile`, backed
by a nonempty Buffer no larger than 2 MiB, with a normalized image MIME type and successful
status. It sets the image MIME type only after accepting that response. Actual Supertest
requests confirm those bytes reach the caller, marked ordinary JSON keeps the JSON media type,
a lazy `Readable` is rejected before streaming, a bare Buffer remains JSON, and failures remain
filtered JSON errors. FormData leaves `Content-Type` unset for the browser boundary, while the
existing same-origin cookie and CSRF handling remains active. Backend validation and
`ApplicationError` details emit safe, bounded Vietnamese `{field,code,message}` entries; the
frontend validates and retains them while accepting legacy `{field,code}` entries. The client
rejects late responses after a session epoch change, preserves unknown outcomes without retry,
and converts circular/non-serializable JSON bodies to the existing typed `HttpFailure`.

## Environment and results

Node `24.14.0`, pnpm `10.33.2`, Windows PowerShell, and the already-running isolated fixture
container were used. The PostgreSQL target was `127.0.0.1:52502/whistle_test_phase2_t006`;
credentials are omitted. `TEST_DATABASE_URL` was scoped to the integration command,
`DATABASE_URL` was unset, and process `TEMP`/`TMP` pointed to the ignored workspace directory
`.verification/tmp-t006`.

| Check | Result |
|---|---|
| Backend `http-foundation.spec.ts` | PASS, 12/12. Supertest exercised bounded Buffer-backed image bytes, JSON fallback MIME, lazy-stream rejection before streaming, bare-Buffer JSON serialization, localized/sanitized validation and application field errors, no-store, and protected JSON errors. |
| Backend `auth-session.spec.ts` on the isolated target | PASS, 28/28. The T006 capability assertion verifies projected fields and the exact Prisma filters for eligible same-season roles, grant status, and current interval. That assertion uses a mocked transaction context; it does not claim a database-inserted delegation scenario. |
| Frontend HTTP/auth regression (`http-client.spec.ts`, `phase-2-http.spec.tsx`, `auth-flows.spec.tsx`) | PASS, 24/24; the PHASE 2 transport suite contributed 10 tests. Regressions cover safe/legacy field details, malformed messages, `INVALID_INPUT`, circular/non-serializable bodies, session epochs, FormData, file responses, and unknown outcomes. |
| Full frontend unit regression | PASS, 9/9 files and 49/49 tests on the combined T005/T006 worktree. jsdom emitted pseudo-element `getComputedStyle()` notices. |
| Frontend typecheck | PASS. |
| Backend project typecheck | PASS on the combined T005/T006 worktree. The first run reported TS2456 in the T005 JSON type. The rerun passed after that type was corrected. |
| Combined backend integration regression | PASS, 19/19 suites and 108/108 tests, with the same isolated PostgreSQL target and a workspace-local `TEMP`/`TMP`. |
| Targeted ESLint, Prettier check, and `git diff --check` | PASS. |
| Playwright `test --list` | Listed 32 Chrome/Edge cases across the existing `auth.spec.ts`, `administration.spec.ts`, and `audit.spec.ts`. The Phase 2 `**/phase-2-*.spec.ts` pattern is registered and those existing patterns remain. This was static discovery only: no browser was launched and Playwright did not reset a database. |

No commit, push, live browser run, or PHASE 2 completion claim is included in this record.
