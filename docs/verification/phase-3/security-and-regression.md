# PHASE 3 T026 — Security, races and regression

**Publication verified:** Published at [`c340398c581e2df29c9cd729a8da619facfca438`](https://github.com/quocthai912/Whistle-EPL/commit/c340398c581e2df29c9cd729a8da619facfca438) on `refs/heads/test/phase-3-integration-recovery-and-security`, verified from the live remote on 2026-11-25 (Asia/Bangkok); all 28 tested source/configuration/task identities match that resolved remote tree. Publication establishes feature-branch availability, not merge, deployment, hosted CI or human PHASE 3 acceptance. [Criterion and tracker receipt](t024-t026-publication.md). Issues [#126](https://github.com/quocthai912/Whistle-EPL/issues/126), [#127](https://github.com/quocthai912/Whistle-EPL/issues/127), and [#128](https://github.com/quocthai912/Whistle-EPL/issues/128) were read back Closed with reason Completed, 3/3 Acceptance Criteria checked, label `completed`, `ready-for-agent` removed, and one verified evidence comment per Issue.

Execution date: 2026-11-25 (Asia/Bangkok). Review base: `ff25957ecad03fbbd064f30ea5edee0585569fa2`; the tested working snapshot is published at `c340398c581e2df29c9cd729a8da619facfca438`, with original source identities retained in the accompanying manifest. Hosted CI and human PHASE 3 acceptance are separate claims.

## Scope and environment

Windows x64 and isolated Ubuntu 24.04 container; Node 24.14.0, pnpm 10.33.2, PostgreSQL 17.11. Windows integration uses `whistle_test_integration`; browser uses `whistle_test_browser`; Ubuntu migrations/integration use fresh `whistle_test_linux_20261125`; recovery uses `whistle_test_portrait_20261125`. Targets are independently guarded and distinct from operational/demo data. Clean locked dependency installations were executed separately on Windows and Ubuntu; native modules were not copied across operating systems.

Browser transport is Caddy 2.11.7, trusted same-origin `https://localhost:8449`, exact proxy IP `172.17.0.3/32`, real Chrome `158.0.8127.38` and Edge `158.0.4370.33`. The existing trusted **test** CA was verified and copied into a separate test volume. No persistent trust-store change or TLS verification bypass was made. Automatic approval review rejected importing a new CA; the existing certificate path resolved this without further permission.

## Executed cross-story checks

`phase-3-cross-workflow.spec.ts`: **9/9 passed**. Together with T024 and the in-flight portrait case, the post-review targeted run passed **22/22**.

- Twelve distinct direct-access denials cover missing authentication, global administrator without business scope, officer without master grant, unprivileged list/catalog/history, wrong season, audit access/export, forged origin and forged CSRF. An independent reader verifies unchanged Player data.
- UC09 profile/portrait writes succeed after all seasons are Closed with the same real login session, unchanged assignments/grant and no session revocation. This is an explicitly isolated closed-state fixture; no later sporting summary is fabricated to claim successful whole-season closure.
- Actual administration commands retain PLAYER_MASTER with another corresponding seasonal role, end it on last-role removal, invalidate the former session, and never revive the grant on reassignment. Fresh login uses the actual authentication endpoint.
- Lock/unlock retains still-valid grants, invalidates old sessions, requires fresh login, and permits authorized portrait management. Explicit grant revocation invalidates the next session and denies management after another fresh login.
- UC04 exposes permitted audit metadata while concealing Player changes from an administrator without object-read authority; object access and export remain denied.
- Deterministic PostgreSQL barriers exercise final role revocation, last quota slot, concurrent due activation and actual closure submission versus confirmation. Independent connections verify committed pointers/counts and one activation. The closure request remains blocked by its real readiness prerequisites and the season remains Open.
- Same-key replay returns the recorded winner without another audit/business effect. Changed intent and stale profile writes are rejected. T024 additionally proves ordered D099 discontinuation, preserved commitments and rejected/cancelled work after resumption.

## Regression evidence

| Command / environment | Executed outcome |
| --- | --- |
| Windows `pnpm db:validate`, `pnpm verify:native`, `pnpm build`, `pnpm verify:client` | PASS |
| Windows `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | PASS, including final changed test files; standalone recovery CJS receives an additional direct ESLint check. |
| Windows `pnpm test:unit` | 80 backend + 111 frontend tests passed. |
| Windows `pnpm test:integration` | 37 suites / 241 tests passed before the added in-flight case; final affected suites rerun 22/22 including that new case. |
| Linux clean install / native / schema / lint / typecheck / format / unit / build / client | PASS. Final E2E/verifier deltas also passed focused lint/typecheck/format checks on the clean snapshot. |
| Linux fresh migration replay | All 16 migrations applied; schema up to date. |
| Linux final `pnpm test:integration` | **38/38 suites, 242/242 tests passed**, including the maintenance fixture fix and real in-flight portrait race. |
| Windows and Linux `pnpm verify:commands` | **10/10 on each OS**. Real injected failures for lint/typecheck/format/build/test in each workspace are propagated by the root commands; probes are removed afterward. |
| Operator unit and real portrait drill | **16/16** Python tests; real matched/interrupted restore, alternate valid set rejection and fresh-login delivery passed. See [portrait recovery](portrait-recovery.md). |
| Browser full regression, first pass | 71/78 passed. Seven failures were retained as defects to investigate, not counted as successful evidence. |
| Final browser regression after fixes | PHASE 1/2: **64/64** passed in the full run. Affected BM1/registration/correction rerun: **8/8**. Subsequent complete PHASE 3 run: **13/14**, exposing the same Edge pointer-click issue in the Player nationality picker; after applying the keyboard selection fix, both Player journeys passed **4/4** across Chrome/Edge. All 14 PHASE 3 cases have passing final evidence across these runs; this is not represented as a single green 14-test invocation. |

The browser failures identified two ambiguous official-label locators, one outdated assumption about centralized state-conflict wording, and Edge option-click synchronization failures in correction/Player test helpers. The late BM1 test was reproduced independently before correction. Its revised check still requires HTTP 409 and `RECEIPT_WINDOW / EXCEPTION_REQUIRED`, the visible error and version-specific exception guidance. Exact official-label matches preserve the same assertions. The correction and Player helpers use the active option and keyboard Enter. Product UI/dropdown code is unchanged.

Linux regression also exposed a foundation maintenance test inheriting media rows from a prior story whose temporary files had been removed. The test now prepares its own guarded PHASE 1 fixture before the maintenance/restart scenario, eliminating suite-order dependence without changing production maintenance checks.

## Independent review and convergence

Separate Standards and Spec reviewers initially found one standalone fixture-safety gap and three missing verification cases. The isolation guard, in-flight race, rejected-version preservation and valid-alternate-set test were added and verified. Re-review reports **0 outstanding findings on either axis**. Final scoped convergence covers T024–T026; T027 scale/usability and T028 acceptance remain their existing separately tracked tasks. Whole-feature or whole-PHASE completion is not asserted here.

## Final verification

**COMPLETE for published T024–T026 implementation and verification.** The [source manifest](t024-t026-source.json) binds changed code/tests and configuration to the fixed review base and the verified published tree. Windows and Ubuntu dependency installation/native/source/unit/build checks, real PostgreSQL regression, actual Chrome/Edge journeys, operator tooling and independent review have completed. Existing JSDOM pseudo-element warnings, Ant Design deprecations, Vite chunk-size advice and pg query deprecation notices did not fail their checks; intentional rollback/fault tests emit sanitized negative-path logs.

Scoped convergence checked T024–T026 against their nine FR references, five SC applicability points (excluding T027 measurement obligations), six relevant Plan decisions and all five constitution principles. No additional in-scope task remains. T027/T028 retain their existing unchecked tasks; no empty or duplicate Convergence phase is appended. Implementation publication is verified above. Issues [#126](https://github.com/quocthai912/Whistle-EPL/issues/126), [#127](https://github.com/quocthai912/Whistle-EPL/issues/127), and [#128](https://github.com/quocthai912/Whistle-EPL/issues/128) were read back Closed with reason Completed, 3/3 Acceptance Criteria checked, label `completed`, `ready-for-agent` removed, and one verified evidence comment per Issue. No hosted required-CI result, merge, deployment or Phase acceptance is claimed.
