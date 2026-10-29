# Authentication and session verification — T023–T026

**Date:** 2026-10-29 (Asia/Bangkok). **Execution/review:** Codex, with independent
Standards and Spec reviewer agents. **Scope:** T023–T026 / Issues #28–#31 only.
**Published source:** [`5cfa666`](https://github.com/quocthai912/Whistle-EPL/commit/5cfa666a7550c9b1d06cc21926dba7e2f27c1a26) (full SHA `5cfa666a7550c9b1d06cc21926dba7e2f27c1a26`) on `feat/phase-1-authentication-backend`;
**review base:** `7e28810f69ef06a7eddf4c9dc62b4432e63b962d`.
The live remote ref was verified at that SHA on 2026-10-29 (Asia/Bangkok).
[The immutable LF-normalized source manifest](authentication-source-sha256.txt) contains
28 entries, all verified against files in that published commit. Verification originally
ran against the precommit working tree; publication preserves that tested snapshot.
The manifest remains bound to `5cfa666`, including the then-current document bytes,
rather than this later documentation-only status update. Issues #28–#31 were independently
read back as Closed with label `completed` and updated with publication evidence.
This records feature-branch publication, not an integration merge, new test run, deployment,
CI/protection result or Team Leader/PHASE 1 acceptance.

## Implemented behavior and acceptance

| Task | Acceptance criteria | Evidence / result |
|---|---|---|
| T023 | Test-first US2 authentication/session regressions at the agreed HTTP and PostgreSQL-backed module interfaces; exact time limits, C01–C05 input/security constraints, concurrency, restart and reset/issuance | 24 HTTP integration tests plus 4 throttle integration tests PASS; existing schema/security regressions also PASS |
| T024 | Serialize missing username/IP keys; username5/IP20 failures in rolling15m; block15m without retry extension; success resets username only; persisted state; trusted source; preserve eligible24h evidence | Real multi-connection contenders, fresh database adapter after disconnect, exact rolling/block boundaries, same-instant success/failure reset and trusted/untrusted forwarding tests PASS. Existing technical-cleanup regression PASS |
| T025 | Digest-only session storage, authRevision/state checks, idle30m/absolute8h expiry before activity, restricted access, protected cookies, stable session CSRF/prelogin15m, exact Origin/Referer and maintenance admission | HTTP tests PASS, including post-lock time, blocked counter storage crossing prelogin expiry, guard activity, matching-scope invalid-cookie clearing and maintenance blocking all auth security writers |
| T026 | Five exact auth endpoints; generic invalid credentials; post-verification credential/authRevision recheck; temporary24h/change-only state; personal change invalidates every session; logout only current; atomic safe audit/no credential receipts | Login/session/CSRF/change/logout PASS; account-lock wait with controlled fixture reset prevents issuance; independent SQL observations confirm digest/no receipt/audit rollback; personal password change failure rolls back credentials/revocations |

Routes use base `/api/v1/auth` with `/csrf`, `/login`, `/session`, `/password/change`
and `/logout`, with the methods defined in the approved REST contract.
Only cookie Set-Cookie transports the raw session token; JSON contains safe own-account
metadata and currently assigned role/grant scopes. Restricted sessions receive no business
authority metadata. Internal routes must use AuthGuard and their owning final scoped-authority
checks; PHASE 1's later account/delegation/audit handlers are not implemented by these Tasks.

The additional migration `202610290002_login_failure_sequence` marks pre-success username
failure evidence inactive for the next username sequence while retaining its original
username/IP/timestamp. This makes success reset correct even for equal clock instants and
keeps the source address history intact. It adds no business rule or operational seed.

The reference Caddy route now preserves `/api/v1`; health/readiness have both prefixed and
container aliases. Compose requires an exact HTTPS `AUTH_ORIGIN`, a chosen private subnet
and reserved Caddy IPv4; backend trusts only that proxy's `/32`. See the updated
[installation configuration](../../operations/installation.md#protected-configuration).

## Environment and executed checks

- Windows x64 host; Node 24.14.0, pnpm 10.33.2, locked TypeScript 5.9.3 and workspace dependencies.
- Actual Linux PostgreSQL 17.11 in dedicated container `whistle-auth-test`, loopback-only
  port 55439, database `whistle_test_auth`, generated synthetic credentials and no operational data.
- Six committed migrations deployed; fresh migration replay and intended-schema diff are
  included in the passing integration suite. Prisma client 7.10.1 generated explicitly.
- Supertest drives actual Nest/Express handlers. The controlled test clock supplies exact
  instants; independent PostgreSQL connections and observed lock waits replace guessed sleeps.

| Command/check | Final result |
|---|---|
| `pnpm lint` | PASS, both workspaces and root lint scope |
| `pnpm typecheck` | PASS, both strict workspaces |
| `pnpm format:check` | PASS |
| `pnpm test` | PASS: backend 5 suites/15 tests; frontend 3 files/8 tests |
| `pnpm test:integration` | PASS: 9 suites/53 tests, including 28 new auth/throttle tests |
| `pnpm test:ops` | PASS: 5 Python operational regressions |
| `pnpm build` | PASS: backend CJS, frontend production build and generated-client import check |
| `pnpm verify:native` | PASS: Windows/x64 Node24.14.0 argon2/sharp |
| `docker compose ... config --quiet` | PASS with isolated synthetic validation configuration; no stack deployment |
| Pinned Caddy 2.11.7 `caddy validate` | PASS; existing style/redundant-header warnings are advisory |

Initial ordinary-sandbox HTTP/DB checks were blocked by EACCES/network permissions; the
final runs above used permitted host loopback access. The initial root format check found
CRLF checkout bytes in 19 existing files; `pnpm format` restored configured LF without
content changes to those unrelated files. Expected audit/backup failure injections emit safe
diagnostic events; the final suites pass and no secret content is logged.

## Test-first and review evidence

User explicitly confirmed both test seams and the working-tree review base in this chat.
Recorded red stages preceded their implementation: csrf bootstrap404; absent throttle module;
login404; password-change404; absent AuthGuard. Follow-up regressions exposed same-instant
username reset (`THROTTLED` instead of `FAILED`), bodyless logout400 and current-password
feedback400 before CSRF403. Each was corrected and rerun green. A final controlled wait also exposed a temporary credential expiring during counter storage resetting its username sequence despite login failure (expected 5 active failures, observed 0). Moving the credential/session decision before success reset corrected it; the added regression passes.

The two independent reviewers initially identified 4 Standards and 3 Spec findings (some
overlap): credential feedback before session/protection, prefixed probes, invalid-cookie
clearing/configuration, guard activity and final prelogin expiry. After corrections both
reported **0 remaining findings**. The final 28 auth/throttle tests include those regressions.

Scoped convergence checks 21 FR references, 5 SC references, 8 US2 acceptance scenarios,
4 selected Tasks, 12 applicable plan decisions and all 5 constitution principles. No remaining
T023–T026 gap was found. That original convergence run left tasks.md unchanged and appended no tasks.
The plan checks cover the locked stack/DB, module ownership, caller transaction, ordered account/security locks, fresh clock, known-rollback retries, maintenance admission, credential-basis recheck, atomic audit, digest-only protected sessions, CSRF/origin/no-store transport and isolated fixtures. At the original precommit convergence run, the tasks.md SHA-256 remained `6f6028b26dd5cd5f958f25979af1bfd8d282494ae479d5056ec64aabaac7d0b9` across scoped convergence. No extension-hook configuration exists, so implementation/convergence pre/post hooks are not applicable.

Unimplemented T027–T048 are already tracked and are outside this authorization.

## Limits and reproduction

These results do not claim UI/browser, real Chrome/Edge, BM-01 load, new Ubuntu application
runs, full clean-host deployment/HTTPS replacement, CI/protection or PHASE 1 acceptance.
Those retain their existing Tasks/statuses. The actual PostgreSQL server is Linux; the
application tests reported here execute on Windows. Caddy validation is not browser TLS proof.
The reset-versus-issuance race uses a controlled fixture reset under an actual account lock;
operator recovery remains covered by its separate real workflow tests.

Use the pinned toolchain, an explicit isolated loopback `whistle_test_*` target and the
fixture isolation guard. Deploy all migrations with `DATABASE_URL` pointed only to that
isolated database; then unset it before integration tests and set `TEST_DATABASE_URL`
separately. `pnpm test:integration` supplies NODE_ENV=test through Jest and refuses a target
that aliases operational DATABASE_URL. Never run concurrent suites against this same DB:
they reset fixtures, close maintenance and install temporary failure/wait triggers.
Run the commands above; no test credentials or database connection strings belong in Git.
The disposable test container was stopped after local verification; restarting it and
supplying its protected test URL permits reproduction without affecting operational data.

## PR review follow-up — 2026-10-29

The two supplied CodeRabbit findings were confirmed against base
`31ea2d98bf664a5c1e0aea451194f0284503ceca` and corrected in the uncommitted working tree:
login now reads prelogin validity/CSRF and live username/IP blocks before Argon2 verification,
while retaining the locked transaction as the authoritative decision; Compose now requires
`PRIVATE_DYNAMIC_RANGE` inside `PRIVATE_SUBNET`, excluding `CADDY_PRIVATE_IP`. The environment
inventory and installation instructions document this allocation constraint and existing-profile
migration without deleting named volumes. The published snapshot/manifest above is unchanged.

Two new PostgreSQL-backed regressions first failed because rejected prelogin/blocked attempts
entered the password verifier, then passed after the fix. They cover absent/consumed/expired
prelogin, forged CSRF, both throttle-key kinds, exact block expiry and unchanged security state.
Final Windows checks pass: 55 PG17 integration tests, 15 backend unit tests, 8 frontend tests,
root lint/typecheck/format/build and generated-client compatibility. Compose configuration passes;
a disposable Docker network with dynamic `172.31.245.128/25` allocates `172.31.245.129` while
the reserved static `172.31.245.10` remains available. These are isolated test values.

CodeRabbit CLI 0.8.0 was invoked with `coderabbit review --agent --uncommitted` after explicit
user authorization to send the diff and related source context to CodeRabbit. It completed
successfully with **0 findings** across the seven changed source/test/configuration/operator-doc
files; this verification-note addition followed that review. The local structured output is
retained in ignored `.verification/coderabbit-auth-preflight-review.jsonl`.
This follow-up does not claim commit/push, new deployment or PHASE 1 acceptance.
