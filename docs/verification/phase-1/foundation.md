# T005–T014 foundation verification

Date: 2026-10-29 (Asia/Bangkok). Branch: `feat/phase-1-core-foundation`.
Reviewed base: `75bd41675ca777cdd811e04fae5c30630b837284`.
**Publication update (2026-10-29):** The user committed and pushed the verified implementation
as [892f172f9ec539d5789a31a2f8046480afe15772](https://github.com/quocthai912/Whistle-EPL/commit/892f172f9ec539d5789a31a2f8046480afe15772)
on `feat/phase-1-core-foundation`; the live remote branch ref was verified at that SHA.
Verification originally ran against the uncommitted snapshot; all 67 manifest entries
were subsequently checked against the published commit and match. No new application
test execution is claimed by this publication metadata update.
The [source manifest](foundation-source-sha256.txt) identifies the delivered snapshot.
Source/configuration text hashes normalize line endings to LF for cross-OS comparison;
the vendored corpus and license hashes retain their exact upstream bytes.
This verifies these ten approved Tasks, not project PHASE 1 acceptance.

## Scope and acceptance results

| Task | Implemented result and verified acceptance |
|---|---|
| T005 | Typed Account/Session/prelogin/throttle/failure schema; normalized identity, stable/non-reusable personnel identity, hash/token/CSRF shapes, UUID/revision/temporal fields, exact absolute/prelogin expiry and preserved history. Idle/temporary expiry calculations are exercised through T009; owning authentication/throttle workflows remain T024–T026. |
| T006 | Real Account/Season FKs, finite system/season role codes, separate shared/Create Season grants, live partial uniqueness and retained revoked assignments. No operational Season/account seeds or business routes. |
| T007 | Exact case/version FKs, positive version numbers, one pending version, preparer/editor history, immutable submitted content and grant basis, three-person/eligible-role checks, half-open non-overlap exclusion and durable boundary uniqueness. |
| T008 | Typed audit/receipt/guard/maintenance rows, append-only audit, complete-outcome/expiry constraints, query indexes and only pre-created technical guards/state. Fresh PG17 replay, status and intended Prisma schema comparison pass. |
| T009 | Exact UTF-8 Argon2id 19456/2/1 hashing with independent salts, 15–128 code points, no normalization/truncation, pinned local SecLists corpus/checksum/MIT notice, independent secure tokens and exact expiry calculations. Vendored byte attributes protect Windows checkout integrity. |
| T010 | PrismaPg/pg transaction context, ordered compatible authority/resource locks, fresh trusted post-wait clock, explicit final-decision recheck, maximum three known-rollback executions and no unknown-outcome retry; persisted maintenance closes before draining admitted writers. Safe strict validation and success/error envelopes. |
| T011 | Per-action scalar audit allowlists and explicit account/operator/system actors. Caller-owned transaction only; secret/nested/whole-body payloads rejected. Required audit failure rolls back the business effect. No export/delete interface. |
| T012 | Actor/action/UUID-key receipts, deterministic normalized intent digest including target/revision, current authority/projection checks, replay lookup before new stale-edit checks, independent contender serialization and lost-response recovery. Credentials and secret-bearing outcomes are rejected atomically. |
| T013 | Synthetic identities, two real-FK Season references, controlled clock and deterministic race gates. Actual fixture creation/reset succeeds on a disposable isolated database; operational/remote/production/ambiguous URLs and missing reset acknowledgement are refused. No startup seed or fixture endpoint. |
| T014 | One Fetch transport, in-memory CSRF bootstrap, safe feedback/envelopes, no automatic write replay, account/session memory invalidation and keyed subtree remount. Late responses during body parsing cannot cross accounts; malformed 401 clears memory. Vietnamese Loading/Empty/Error shell and restricted-session route handling; login/admin forms remain later Tasks. |

## Executed environments and commands

- Windows x64: Node **24.14.0**, pnpm **10.33.2**, locked workspace packages.
- Ubuntu **24.04.5** x64 container: the existing clean Linux dependency installation
  from T001–T004, updated with source/manifests only; no Windows node_modules copied.
- Real PostgreSQL **17.11**, package `17.11-1.pgdg24.04+2`, installed from the official
  signed PostgreSQL apt repository in the isolated Ubuntu container, UTF-8/C.UTF-8.
  The `btree_gist` extension is present. This is a test environment, not T018 deployment.
- The pinned Docker Hub image initially stalled, so the two-OS checks first used the
  official PG17 apt packages. After its download completed, the exact reference image
  `postgres@sha256:839fbb5a4942a7758dd93e18b42ea5649807491a0545b5eeeb8f0b8bb11857a5`
  also passed a fresh four-migration deployment/status check and all **18 integration
  tests**, including intended-schema comparison. Its server reports PostgreSQL
  **17.11 (Debian 17.11-1.pgdg12+2)**. T018 Compose/HTTPS deployment remains pending.
- Host DB endpoint was loopback-only port **55438**, database
  `whistle_test_foundation_final`. Tests used synthetic data; no operational target.
  The additional pinned-image run used loopback port **55437** and a separate database.

The final four migration files were deployed to a newly created empty database after
review fixes, without `db push` or modification of an already accepted migration history:

```text
pnpm db:migrate
pnpm db:status
pnpm --filter @whistle-epl/backend exec prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script --exit-code
```

Results: all four migrations applied; schema up to date; empty migration diff (exit 0).
The integration suite also replays the migration SQL into a unique empty schema and
checks the intended schema through the Prisma command interface.

The following final commands passed on both Windows and Ubuntu:

```text
pnpm lint
pnpm typecheck
pnpm format:check
pnpm test
pnpm build
pnpm verify:commands
pnpm test:integration
```

| Verification | Windows | Ubuntu |
|---|---:|---:|
| Backend Jest unit suites | 4 suites / 6 tests PASS | 4 suites / 6 tests PASS |
| Frontend Vitest suites | 3 files / 8 tests PASS | 3 files / 8 tests PASS |
| PostgreSQL integration suites | 4 suites / 18 tests PASS | 4 suites / 18 tests PASS |
| Root failure-propagation probes | 10 tests PASS | 10 tests PASS |
| Lint / typecheck / format / build / CJS client | PASS | PASS |

## Test-first and review evidence

The user confirmed five seams: real migrations, credential/audit interfaces,
transaction/admission/receipt interfaces, isolated fixture tooling, and browser
Fetch/session/router interfaces. Initial suites failed before their modules/migrations
existed; subsequent behavior tests exposed concrete failures before their fixes:

- Account change while JSON was being read returned old-account data; post-parse
  epoch checking now rejects it.
- HTML/null/array-shaped 401 responses retained session memory; all now clear it.
- Shared admission lockers could enter while an exclusive maintenance locker waited;
  the persisted close boundary now precedes drain, and the independent-connection
  race test passes.
- Actual Argon2 PHC parameter order differed from the initial assertion; tests and
  SQL validate the selected costs while accepting the library's representation.

Two independent code-review agents checked Standards and Spec against the approved
base plus uncommitted files. Initial findings were corrected and re-reviewed:
**Standards: 0 remaining; Spec: 0 remaining.** No unresolved scope finding remains.
Implementation/convergence extension hooks: `.specify/extensions.yml` absent.

Scoped convergence checked all ten Tasks, C01–C14, the applicable plan obligations
(stack, typed persistence/history, transaction/admission, security, audit, receipts,
isolated fixtures and shared frontend), and all five Constitution principles.
No remaining actionable gap within T005–T014; no Convergence section or duplicate
tasks were appended. T015–T048 remain intentionally pending under the user's scope.

## Reproduction and remaining acceptance

Use an explicitly isolated PostgreSQL 17 database and the pinned Node/pnpm toolchain.
For migration/status commands set `DATABASE_URL` to that isolated target in their
process. For integration tests set `TEST_DATABASE_URL` to that target and leave
`DATABASE_URL` unset (or pointing to a distinct operational target). Jest supplies
`NODE_ENV=test`. The target must be loopback and named `whistle_test_*`; the suite
requires creation of disposable test databases for fixture-isolation checks.
Do not run two integration suites concurrently against the same database, because
maintenance tests deliberately close its shared admission gate.

Ordinary modules must acquire the complete resource set once and use the caller's
transaction context for all effects and audit. Recheck authority with a fresh clock
at the final write decision after preparatory waits; receipt handling does this
after receipt-lock waits. Automatic retries apply only to known rolled-back database
conflicts, never credential/authorization/business errors or uncertain commits.

Real authentication/admin/delegation handlers, operator CLI, host durable maintenance
protocol/backup/restore, HTTPS/Compose, Chrome/Edge end-to-end acceptance, load tests,
CI/branch protection and full PHASE 1 acceptance belong to T015–T048. Their absence
is not a completion claim or a duplicated convergence task. Context Phase statuses
and checklists remain unchanged. Team Leader Phase acceptance has not been requested.
