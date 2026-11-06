# PHASE 1 acceptance assessment

- **Date** 2026-11-06 (Asia/Bangkok)
- **Scope** PHASE 1 Operational Foundation and Access Administration, UC01–UC04,
  the foundation operator workflows and the approved D098 gate
- **Application tested** [ee5da91](https://github.com/quocthai912/Whistle-EPL/commit/ee5da91b1b8b8fdece641ed6b6790f7df9280093).
  The application and CI workflow entered development via
  [PR #63](https://github.com/quocthai912/Whistle-EPL/pull/63) and main via
  [PR #64](https://github.com/quocthai912/Whistle-EPL/pull/64).
- **Test sources** [d9522fa](https://github.com/quocthai912/Whistle-EPL/commit/d9522fa4b7304151db0aecb928ac5a33759ae78b)
  records the BM-01 load script and security regression suite used for the
  final integration run. [e35ccef](https://github.com/quocthai912/Whistle-EPL/commit/e35cceffd060440629af8a59df882d1a4af643a0)
  adds the exact TT-02 viewport checks. Both test snapshots retain the
  application source and migrations from `ee5da91`.
- **Acceptance reviewer** The user approved T048 on 2026-11-06 (Asia/Bangkok)
  with “Duyệt hồ sơ T048” in response to the review request for
  [e35ccef](https://github.com/quocthai912/Whistle-EPL/commit/e35cceffd060440629af8a59df882d1a4af643a0).
  The reviewer subsequently confirmed that the recorded foundation scope is
  sufficient for PHASE 1 completion and that production inputs are tracked
  separately.

Use the [approved Specification](../../../specs/001-phase-1-operational-foundation/spec.md),
[task ledger](../../../specs/001-phase-1-operational-foundation/tasks.md),
[quickstart](../../../specs/001-phase-1-operational-foundation/quickstart.md) and
[English source traceability](../../../context/sources.md). The table records
execution evidence for the declared isolated PHASE 1 scope.

The final local verification passed 85 PostgreSQL integration tests, 30
Chrome/Edge cases, 15 backend and 24 frontend unit tests, and five Python
operations tests. The linked reports distinguish application, fixture,
hosted CI and operator versions.

## Outcome matrix

| Criterion and source | Observed outcome | Evidence |
| --- | --- | --- |
| SC-001, US1, CN-01–CN-04 | Fresh locked installation, empty startup, seven migrations, verified trusted HTTPS and one successful concurrent bootstrap. Replaced containers preserved state. Recovery remained limited to the existing administrator. | [Clean installation](clean-install.md) |
| SC-002, UC01, BM-01 | 100 of 100 accepted within three seconds at 20 VUs. Login p95 582.50 ms. The separate invalid/throttling workload passed with controls enabled. | [BM-01](bm01.md) |
| SC-003, UC01–UC02, D080 | Exact idle/absolute expiry, logout and revoked sessions denied before cleanup, including with a fresh application instance. An actual PostgreSQL and backend restart and restore also preserved rejection of the older session. | [Authentication](authentication.md), [security](security.md), [recovery](recovery.md) |
| SC-004, UC01, D081 | Temporary credential expiry and required change, personal password checks, unknown-user generic failures, and username/source throttling including concurrency passed. | [Authentication](authentication.md), [browser authentication](authentication-ui.md), [BM-01](bm01.md) |
| SC-005, UC01–UC04, BM-03/BM-04 | 12 distinct direct denials plus browser denials, cross-season authority, self-escalation, restricted audit and revoked-session cases passed without unauthorized state changes or disclosure. | [Security](security.md), [administration](administration.md), [audit](audit.md) |
| SC-006, US1/US3, AT-02/AT-04 | Concurrent bootstrap and last-administrator protection, final-authority wait/recheck, stale revisions and response-loss replay preserved committed state. | [Clean installation](clean-install.md), [administration](administration.md) |
| SC-007, UC03, D014/D019 | Delegation combination, transitions, overlap/adjacency, eligibility termination and boundary cases passed on real PostgreSQL. | [Administration](administration.md) |
| SC-008, UC04, BM-06 | Authorized real-event lookup, explicit filters, exact time bounds, deterministic pagination, independent object-read checks and unchanged audit content verified. | [Audit](audit.md), [security](security.md) |
| SC-009, AT-02/AT-04, D084 | Injected audit/transaction failures and response loss preserved the required atomic effects. Retries and receipt conflicts avoided duplicate effects. | [Foundation](foundation.md), [administration](administration.md), [security](security.md) |
| SC-010, UC01–UC04, TT-01/TT-02/TD-02 | Chrome and Edge passed the real trusted-HTTPS browser journeys, including failed/unauthorized paths, credential change, administration, audit and recovery. Audit filtering, pagination and details also worked at 360 × 800, 768 × 1024 and 1366 × 768. | [Browser authentication](authentication-ui.md), [audit](audit.md), [security](security.md), [clean installation](clean-install.md) |
| SC-011, D088/D089 | Seven complete retained sets, overlap/corruption refusal, missed and failed backup evidence, controlled retry, actual restart and same-set restore with matching inventory and fresh login. | [Recovery](recovery.md) |
| SC-012, D098 | Hosted Ubuntu/Windows and PostgreSQL jobs passed. Failure, cancellation and a skipped mandatory job each produced a failing gate on both targets. Protected merges, doc-only PRs, push and manual triggers were verified. | [Branch protection](branch-protection.md) |
| SC-013, CN-03 and Constitution V | Source, test environment, fixtures/reset, commands and results are collected in this assessment and its evidence links. The reviewer approved the T048 evidence package. | [Task ledger](../../../specs/001-phase-1-operational-foundation/tasks.md) |

## Reproduction and remaining operator inputs

Use a clean checkout of `d9522fa` for the final integration and BM-01 tests.
Use `e35ccef` for the exact TT-02 rerun. Before building, compare the
application files, workspace dependency manifests and lockfile with the
tested application revision.

```text
git diff --exit-code ee5da91 HEAD -- backend/src backend/prisma backend/package.json frontend/src frontend/public frontend/index.html frontend/package.json frontend/vite.config.ts pnpm-lock.yaml
pnpm install --frozen-lockfile
pnpm build
```

Deploy migrations to a fresh PostgreSQL 17 test database with `pnpm db:migrate`
and an explicit `DATABASE_URL`. Clear that variable, point
`TEST_DATABASE_URL` to the isolated database and run `pnpm test:integration`
from the test checkout. The HTTP suite starts the application from its
unchanged source. For BM-01, serve the build over trusted local HTTPS with a
separate disposable database, prepare the fixtures in the [BM-01 report](bm01.md),
then run `pnpm test:load` in baseline and negative modes from the test checkout.
Use the separate browser target and reset acknowledgement from the
[quickstart](../../../specs/001-phase-1-operational-foundation/quickstart.md)
for `pnpm test:e2e`. Keep each target separate from operations and concurrent
fixture resets. The clean
install and recovery reports specify the actual Compose, TLS, operator,
backup and restore boundaries. BM-01 records the cgroup, fixture and k6
settings separately from hosted runner timing.

| Open decision | Evidence and remaining input |
| --- | --- |
| O08 | Synthetic bootstrap, credential change and recovery passed. The actual confidential credential handoff, recipient and accountable operator are deployment inputs. |
| O12 | The in-scope API, UI, clean Compose and hosted compatibility checks have execution evidence. The selected deployment configuration and handover still require operator verification. |
| O13 | Chrome/Edge, three audit viewports, BM-01 and Phase 1 security checks have evidence for the recorded profile. Later use-case datasets, workflow trials and operational measurement targets retain their owning Phases. |
| O14 | Isolated trusted local HTTPS and interrupted recovery passed. Real deployment domain/certificates, trusted proxy, operator identities, elapsed host timers/rotation and any selected off-host destination remain inputs. |

No acceptance-blocking defect was observed in the recorded isolated scope.
The recovery drill used a controlled retry deadline. Elapsed host-timer
verification remains a deployment input. The
[Phase ledger](../../../context/progress-checker.md#phase-1-audit-and-verification-evidence---2026-11-06)
records PHASE 1 as `COMPLETED` for the accepted foundation scope.
