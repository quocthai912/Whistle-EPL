# PHASE 2 T001–T015 verification

The worktree is based on `58fe5cc01eff2abad5c07c561486976bdccd6794` on
`feat/phase-2-foundation-and-season-regulations`. Verification used the pinned Node
24.14.0, pnpm 10.33.2 and PostgreSQL 17.11. Migration, integration, browser, and restore
targets were distinct isolated fixtures.

## Final results

| Check | Result |
| --- | --- |
| `pnpm test` | 55/55 backend and 82/82 frontend unit tests on Windows and Linux. |
| `pnpm test:integration` | 144/144 PostgreSQL tests in 21 suites on the final Linux image. |
| `pnpm test:e2e` | 44/44 using Chrome 157.0.8103.51 and Edge 157.0.4341.60, including inherited authentication, administration and audit coverage. HTTPS validation stayed enabled and the fixture CA was verified absent after cleanup. |
| `pnpm verify:commands` | 10/10 failure propagation checks in a separate Linux container. The probe files stayed outside the worktree. |
| Backup and restore | 10/10 Python tests, Bash syntax checks and both isolated restore drills. |
| Toolchain | Lint, typecheck, format check, Windows and Docker builds, native and generated-client verification, schema validation, migration status and drift check passed. |

The final browser run includes the dropdown test-helper fix for an already selected option.
The helper verifies both collapsed ARIA state and the absence of the visible menu.

## Task coverage

| Scope | Verified behavior |
| --- | --- |
| T001–T003 | All 10 migrations on an empty PostgreSQL database and on a synthetic populated database. Independent reads confirmed the same identities across eight table groups, explicit backfill of two season names, consumption of the staging table, and no seeded regulation on the empty target. Prisma reported no drift. Linux backup and same-set restore verified the legacy format v1 and expanded no-assets format v2, inventory equality, no remaining active sessions, and corrupt-set refusal. |
| T004–T007 | Integration and unit regressions exercised ordered transaction locks, exact idempotency intent/replay, session and permission changes, isolated fixture resets, typed dependency availability, and scope-limited append-only history. |
| T008–T012 | Chrome and Edge exercised creating or editing season metadata, saving a regulation draft, submitting and creating a successor, and independent approval of the exact reviewed version. PostgreSQL verified independence, reviewed-basis conflicts, the waiting slot, immediate interval history, and rollback on dependency/audit failure. |
| T013 | A GET at the due boundary returned 503 with unchanged version, season pointer, audit, and receipt records. Maintenance and a simulated provider failure retained the approved instant. Startup catch-up and a concurrent approval preserved one activation, the approved instant, and the distinct processing time. A simulated frozen schedule produced terminal blocking with one audit record and no later revival. Fixture logs recorded startup and minute ticks. |
| T014 | Independent cancellation without a replacement and atomic replacement were verified on PostgreSQL. Replacement-only editor exclusion, cutoff, audit failure rollback, replay, and the one-waiting-slot invariant were checked against committed state. Chrome and Edge exercised dismissing and confirming a cancellation. |
| T015 | The built Linux CLI ran with the fixture operator identity, and rejected an unsupported timestamp override. The operator integration exercised rerun after startup catch-up without duplicate activation. UI tests covered an unresolved basis at the known cutoff and exact receipt retry after a simulated lost response. |

The consolidated Standards and Spec review used two GPT-6.1-Sol Medium reviewers.
The fixes bind the reviewed current version in approval commands, distinguish insufficient
facts from known incompatibility, eliminate stale current labels at the known cutoff,
show immutable replacement content, preserve retry intent, add safe per-version diagnostics,
register explicit action paths and reuse the persisted content projection.

This evidence covers T001–T015 and inherited regression suites. Later registration,
schedule and match data used in guard scenarios were simulations. The restore drill
covered the no-assets profile. Operational data, real media restore and whole-PHASE 2
acceptance retain their existing gates.
