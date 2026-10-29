# T015–T022 operator foundation verification

**Current authentication follow-up (2026-10-29):** T023–T026 are now verified and published at [`5cfa666`](https://github.com/quocthai912/Whistle-EPL/commit/5cfa666a7550c9b1d06cc21926dba7e2f27c1a26) on `feat/phase-1-authentication-backend`; see [authentication evidence](authentication.md). References below to deferred authentication work describe this report's original snapshot. Current progress and remaining T027–T048 work are owned by the [Phase ledger](../../../context/progress-checker.md#phase-1-execution-evidence---2026-10-29).


Date: 2026-10-29 (Asia/Bangkok). Branch: `feat/phase-1-operations-recovery`. Reviewed base: `30506e304857636d016aa245aad53b4192a1e069`. Scope: eight approved Tasks, implemented, verified and published at [`7ac09e6`](https://github.com/quocthai912/Whistle-EPL/commit/7ac09e6cec9fb434248c82db142ab04695961823). Issues #20–#27 are Closed with label `completed`; their approved definitions and Task evidence are preserved. Project PHASE 1 acceptance remains pending. Existing v1/v2 approvals are unchanged.

**Publication verification (2026-10-29):** The user committed and pushed `7ac09e6cec9fb434248c82db142ab04695961823`; the live remote branch ref was verified at that SHA. Tests originally ran against the pre-commit working tree. All **68/68** [source manifest](operator-source-sha256.txt) entries were compared with the published commit and match after LF normalization. The manifest remains unchanged and identifies the published snapshot, including its documentation as it existed at publication; subsequent publication-metadata edits do not rewrite that evidence. No new application test execution, integration-branch merge or Phase acceptance is claimed by this update.

## Task acceptance

| Task | Implemented and verified result |
|---|---|
| T015 | CLI input/hidden-prompt contracts, bootstrap race/locked-admin rejection, non-admin/missing-target/reason rejection and audit rollback regressions. Tests were authored before corresponding CLI modules; missing-module failures were observed for operator contract, recovery and secure prompt before implementation. |
| T016 | Root `admin:bootstrap`; OS operator identity, normalized personal identity, hidden temporary credential, serialized no-admin guard, atomic administrator/24-hour credential/audit and no business grants. Two concurrent attempts yield one administrator; required-audit rejection leaves no account/role. |
| T017 | Root `admin:recover`; existing administrator only, required reason, explicit reset/unlock/both modes, all-session invalidation and atomic operator audit with mode flags. Unlock preserves credential; reset alone preserves a locked state and requires personal change. Missing/non-admin targets never create/promote. |
| T018 | Pinned backend/frontend Dockerfiles, PG17/private Compose network, migration success/readiness dependencies, same-origin Caddy HTTPS and persistent DB/CA/config/state. Fresh migration and trusted-CA HTTP checks pass; no account seed. Container replacement preserves five migrations and zero default accounts. |
| T019 | Host marker outside restorable DB, exclusive creation/fsync, shared writers/exclusive drain, fail-closed restart/old-snapshot behavior, matching-operation verification/release. Restore closure binds selected complete set; release reruns its content/relationship/compatibility verification. |
| T020 | Real PG17 custom archive, v1 checksummed set manifest, migration checksum compatibility, safe count/content inventory, no-overlap control, seven-complete-set retention, same-set transactional restore, relationship scan and restored-session invalidation. `ops:verify` executes real isolated backup/restore/corrupt-copy checks and refuses unsafe targets. No full-season/media claim. |
| T021 | Daily 03:00 Vietnam persistent timer, separate 15-minute retry chain (maximum three retries), boot-resume reconciliation, durable due-run/missed-date state and visible failures. Hourly Nest cleanup retains active blocks/windows, pending receipts and the full completed-receipt guarantee; protected 30-day diagnostic rotation is supplied. |
| T022 | Installation, operator access, credential handoff, maintenance, set format and scheduling runbooks with prerequisites/key inventory, private DB connectivity, script permissions, clean install/replacement/recovery/reset guidance and explicit remaining inputs. |

## Environments and commands

- Windows x64: Node 24.14.0, pnpm 10.33.2, Python 3.13.14; isolated pinned-image PG17.11 on loopback 55437, database `whistle_test_operator`.
- Ubuntu 24.04.5 x64 disposable verification container: native Linux dependencies, Node 24.14.0/pnpm 10.33.2, Python 3/systemd tools, actual PostgreSQL 17.11 and client tools; separate `whistle_test_operator_linux` on container loopback. No operational data/credentials.
- Deployment smoke: separate Compose project `whistle-operator-verify`, synthetic secret files outside tracked source, PG17.11 pinned image, Node 24.14.0 pinned image and Caddy **2.11.7**. Only HTTPS was published, at `127.0.0.1:55443`; DB/backend had no published ports. Named volumes were retained during replacement.

```text
pnpm lint
pnpm typecheck
pnpm format:check
pnpm test
pnpm build
pnpm test:integration
pnpm test:ops
pnpm verify:commands
```

| Check | Windows | Ubuntu |
|---|---:|---:|
| Backend Jest unit | 5 suites / 12 PASS | 5 suites / 12 PASS |
| Frontend Vitest | 3 files / 8 PASS | 3 files / 8 PASS |
| Real PG17 integration | 7 suites / 24 PASS | 7 suites / 24 PASS |
| Python set/schedule regressions | 5 PASS | 5 PASS |
| Lint / typecheck / format / build / CJS import | PASS | PASS |
| Root failure-propagation probes | 10 PASS | Not repeated; prior foundation evidence retained |

Run root failure probes separately: they deliberately create/remove synthetic source files. An overlapping build initially encountered such a transient file; the probes finished successfully, and the isolated final build passed. No remaining build defect is claimed. One repeated cleanup test initially collided with a prior fixed CSRF fixture value; independent random tokens now isolate it and the full suite passes.

Linux execution also exercised actual `backup.sh`, `verify-set.sh`, `restore.sh`, and the root `pnpm ops:verify <set-id>` alias with an explicit protected test profile. The final message was `Available-foundation persistence, same-set restore, session invalidation and corrupt-set refusal PASS.` `bash -n` passed for all scripts; `systemd-analyze verify` passed for root-owned installed units. Calendar validation resolved daily `03:00 Asia/Ho_Chi_Minh` to `20:00 UTC` on the preceding UTC date.

Additional actual Linux probes passed: overlapping controller lock refusal without a new complete set; backup path equal to app root refusal; mismatched Node/libpq DB refusal; non-isolated verifier refusal; selected-set content mismatch keeps the restore marker; completing the original restore under retained closure then verifying/releasing succeeds. Python tests verify corrupt archive/wrong set/app drift rejection, nine-to-seven complete-set retention, maximum initial+three attempts across state reloads, early retry refusal, missed-date recording after prior success and boot-resume delay. Clock/subprocess/sleep adapters are test-only.

Both Dockerfiles built. Fresh Compose applied all five committed migrations and reached healthy DB/backend. Node HTTPS requests loaded **only the exported public test CA**, with normal hostname/certificate validation: `/`, `/api/v1/health`, `/api/v1/ready` each returned 200. No `-k`/insecure TLS bypass was used. Forced container replacement preserved migration/account counts; the same CA remained usable. Initial image verification found missing OpenSSL and non-root Corepack cache/network dependence; the Dockerfile now installs OpenSSL and prepopulates shared `COREPACK_HOME` before the private-network migration step.

## Test-first, review and convergence

The user explicitly confirmed CLI/operator, admission/host marker, backup/restore/cleanup seams, independent-connection committed-state assertions and review base `30506e3`. Observed red-before-green cycles include missing operator-contract/recovery/secure-prompt/maintenance/cleanup modules, missing Python set formatter/schedule interface, restore without selected set resolving incorrectly and missing explicit set-ID validation. Corrective tests pass after implementation. Credential tests use synthetic values; no operational password is recorded in evidence.

Independent Standards and Spec agents reviewed base-to-working-tree changes, including untracked files and the governing Context/Constitution. Findings were repaired: selected-set restore proof, target binding, explicit recovery audit mode, approved backup path, narrowed cleanup locks, manifest identity, off-host-before-local publication, missed-date/boot retry handling, migration content checksums and executable pnpm examples. Final re-review: **Standards 0 remaining; Spec 0 remaining**. Reviewer agents supplement the required checks and do not grant Phase acceptance.

Scoped convergence assesses **8 Tasks**, **29 referenced FRs** and **8 referenced SCs** only to the extent allocated to these Tasks, six US1 acceptance scenarios with later-story portions deferred, seven plan obligations (CLI/security, deployment, durability, maintenance, set recovery, scheduling/cleanup, runbooks) and all **5 Constitution principles**. Existing T023–T048 already represent pending work; they are not duplicated into convergence tasks. Task completion does not mean all referenced cross-cutting FR/SCs or the whole story/feature are accepted.

Outcome: **converged within T015–T022**, zero missing/partial/contradicting/unrequested findings and zero findings at every severity. No Convergence section/task was appended. Implementation/convergence extension hooks were skipped because `.specify/extensions.yml` is absent. The requirements-quality checklist remains read-only, 16/16 checked; project acceptance markers are unchanged.

## Remaining acceptance and reproduction

Use the pinned toolchain, explicit isolated DB, protected Linux profile and runbooks in `docs/operations/`. `TEST_DATABASE_URL` must be loopback `whistle_test_*`, separate from any operational `DATABASE_URL`. Do not run concurrent suites against the same DB: tests deliberately close admission and reset synthetic fixtures. Install shell scripts with execute permission and LF line endings before root operator aliases/systemd use; never grant runtime write access to the marker/profile/backup store.

No actual deployment operator/recipient, confidential handoff, Internet domain/certificate/proxy/off-host provider or operational credentials were supplied. No installed-host 15-minute elapsed retry sequence, real reboot/catch-up service manager, logrotate elapsed-retention drill, Chrome/Edge login/password-change workflow, load/security acceptance or full clean-host acceptance is claimed. These remain T023–T048/T044/T046/T048 and O08/O12/O13/O14 as applicable. Full-season/media/BM-07 stays PHASE 10. PHASE 1 remains `IN_PROGRESS` and all existing project functional acceptance checkboxes are preserved.
