<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:45e0088c0cc7f53a1c5de279c0f7b46ed90a3ad48613c82ab79e2326c8ab1f73 -->

# Implementation Plan: PHASE 2 - Seasons, Catalogs, and Regulations

**Branch**: `docs/phase-2-architecture-and-specification` | **Date**: 2026-11-10 (Asia/Bangkok) | **Spec**: [spec.md](spec.md)

**Status**: Approved by the Team Leader on 2026-11-10 (Asia/Bangkok).

**Approval evidence**: After the Plan and its eight supporting research/design/verification
artifacts were presented, the Team Leader explicitly answered "Tôi đồng ý phê duyệt." to
approval before speckit-tasks. This approves the reviewed technical design and Task preparation,
not final Tasks, Issues, implementation, commit/push or PR.

**Input**: Approved PHASE 2 Specification, Constitution v1.0.0, current Context and D099.

## Summary

Extend the accepted backend/frontend foundation with UC05/UC06/UC07/UC12 and their seven
approved user stories, preserving shared authorization, transaction, receipt and audit
controls. Implement only owning PHASE 2 workflows; later business facts enter through explicit
read-only module interfaces and isolated fixture implementations, never permissive defaults.

## Technical Context

**Language/Version**: Existing TypeScript 5.9.3, Node 24.14.0, pnpm 10.33.2 workspace.
**Primary Dependencies**: Locked NestJS 11.2.8, Prisma 7.10.1/pg adapter, Nest Schedule 6.1.3,
React 19.2.9, React Router 8.5.1, Ant Design 6.6.8, Day.js 1.11.23, sharp 0.35.5.
**Storage**: Existing PostgreSQL and durable local media outside executable/repository paths;
retain approved optional Internet-storage configuration without assuming it is selected.
**Testing**: Existing Jest/Supertest/PostgreSQL, Vitest/Testing Library, actual Chrome/Edge
Playwright, k6 and Python operations tests under D097/D098.
**Target Platform**: Existing same-origin HTTPS Compose reference deployment and browser UI.
**Project Type**: Modular layered monolithic backend plus SPA in existing pnpm workspace.
**Performance Goals**: SC-010 partial internal club master-list benchmark using the existing
HQ-01/D097 timing threshold, with one-minute warm-up, ten-minute measurement and results
per lookup group. Record environment/workload and keep API measurements separate from
browser/UI evidence. Full public lookup acceptance remains in PHASE 6. No new write/generation SLA.
**Constraints**: No new architecture/library choice, operational seeds, later-Phase workflows,
implementation code or Tasks/Issues in this stage.
**Scale/Scope**: Seven stories, 48 FRs, 12 SCs; 20-club reference dataset, two-season isolation;
later 10-season/3,800-match integrated evidence remains with its owners.
**Database Baseline**: Existing pinned PostgreSQL 17.11 reference image in ops/compose.yaml;
no database/ORM major upgrade. Source package pins are those in the checked-in lockfile.
**Research Resolution**: [research.md](research.md) resolves foundation extension seams,
typed locks/receipts/audit, actual media/recovery gaps and fail-closed later-fact interfaces.
No unresolved technical clarification or new architecture approval is required for this Plan.

## Constitution Check

*Pre-research gate evaluated 2026-11-10, before internal Phase 0. Internal phases are not
project PHASE 1/PHASE 2. PASS permits research/design, not implementation.*

| Principle | Pre-research assessment |
|---|---|
| I - Sources/traceability | PASS: approved Spec retains UC/source/decision references; FR-005 approval is recorded in D074/ADR 0010. Current Context and glossary govern; no new PDF comparison is claimed. |
| II - SDD/scope | PASS: explicit Spec approval received; only Plan/design are now authorized. No Tasks, Issues, application code or project-status changes. Later facts are dependencies, not additional workflows. |
| III - Owned modules/architecture | PASS: existing approved stack, module ownership and synchronous caller-owned coordination retained. Research must map actual foundation gaps, not replace selected technology. |
| IV - Security/atomicity | PASS: design must reuse/extend admitted ordered transactions, final authority/time, exact versions, receipts and audit; no browser controls forced onto operator/jobs and no test bypass in production. |
| V - Verification/evidence | PASS: approved Spec requires real authorization, rollback, concurrency, media/recovery and regression checks. Plan will allocate execution and evidence under unchanged thresholds; no universal TDD/coverage gate added. |

### Post-design re-evaluation

Internal Phase 0 research and Phase 1 design are complete as documentation. PASS below
establishes design alignment only, not execution results or Team Leader Plan approval.

| Principle | Post-design assessment and evidence |
|---|---|
| I - Sources/traceability | PASS: Spec retains all 48 FRs/12 SCs and approval provenance; research cites actual repository seams and primary technical docs; data model/contracts reference current owners instead of reopening approved policy. |
| II - SDD/scope | PASS: only nine Plan/design artifacts are generated; no tasks.md, Issues, implementation or publication. Summary dependency targets are schema-only D095 support for UC05, not PHASE 7 authoring; no PHASE 3 Player/registration workflow is introduced. |
| III - Owned modules/architecture | PASS: locked stack and existing monolith/SPA retained. Season/Regulations owns effectivity/lifecycle; Registry & Registration owns Club; Scheduling owns Stadium (UC12 only here); Media owns content and Audit history. Shared caller-owned transactions and explicit future-fact ports prevent duplicated sporting sources. |
| IV - Security/atomicity | PASS: execution contract requires final current authority/time, typed ordered locks, exact versions, bounded retries, per-action creation/decision receipts and safe object histories. Media/recovery covers admission, immutable staging/orphans, current delivery and same-set restoration. Operational jobs/fixtures retain their distinct approved controls. |
| V - Verification/evidence | PASS: verification.md maps every FR/SC to required suites, independent committed-state/race/failure checks, real browser/load/media/recovery and retained PHASE 1 regression. Actual assets/operational values remain explicit inputs; no passing runtime results or later-Phase completion is inferred. |

No Constitution waiver is requested. A newly discovered conflict during implementation must
return to the owning approval process rather than be concealed as a technical default.

## Project Structure

### Documentation (this feature)

```text
specs/002-phase-2-season-regulations/
  spec.md                         approved; no business scope changes in this Plan
  checklists/requirements.md      existing 16/16 requirements-quality review
  plan.md                        approved Plan with recorded review evidence
  research.md                    R1-R8 repository investigation and design resolutions
  data-model.md                  typed fields, states, constraints and staged schema
  verification.md                V01-V10 required future evidence/coverage
  quickstart.md                  validation guide and current/planned command distinction
  contracts/
    rest.md                      actions, authority, DTO groups, replay and media bytes
    execution.md                 ownership, dependency ports, locks and transaction boundary
    media-recovery.md            actual content, cleanup and versioned available-data sets
    ui.md                        seven-story Vietnamese journeys within existing UI
```

tasks.md is the subsequent speckit-tasks output, permitted by the recorded Plan review;
it still requires analysis and explicit final Task approval before publication/execution.

### Source Code (repository root)

Existing paths are reused; new paths below are implementation targets, not files created now.

```text
backend/prisma/schema.prisma and migrations/          additive D095 support, no reset
backend/src/platform/                                typed locks/receipts and business-execution
backend/src/identity-access/                          current capability/authority integration
backend/src/season-regulations/                       UC05/UC06 services, policy, DTO/controller
  season-dependencies.port.ts                        synchronous explicit later-fact contracts
  regulation-activation.service.ts                    job/startup/request shared resolver
backend/src/registry-registration/                    Club master and its D099 transitions only
backend/src/scheduling/                               Stadium master/its D099 transitions, UC12 only
backend/src/media/                                    bounded local logo/storage/delivery/cleanup
backend/src/audit/                                    action schemas and object history projection
backend/src/operations/ and cli/                      inherited maintenance/verified recovery hooks
frontend/src/features/{seasons,regulations,clubs,stadiums}/
frontend/src/shared/http/ and app/router.tsx           preserve session/CSRF and add workspace routes
backend/tests/{unit,integration,fixtures}/            planned suites and isolated evidence
frontend/tests/; tests/e2e/; tests/performance/        real user journeys/lookup and regressions
ops/backup/; ops/compose.yaml; .env.example            media-aware set format and protected volume
```

**Structure Decision**: Add feature-owned modules/forms to the existing backend/frontend;
no apps/packages reorganization, separate worker, new service, broker or alternate data store.
Domain collaborators receive the caller TransactionContext. AppModule wires typed providers;
registration, fixture-scheduling, results and reporting workflows remain in their owning Phases.
Current-basis GETs use bounded read-only resolution or 503. Job/operator and dependent-write
execution retain their existing mutation paths. The lifecycle owner evaluates interval ends
against the trusted final close instant using current facts from the registration owner.

## Design and delivery sequence

### Internal Phase 0 - Research (complete as documentation)

R1-R8 record local evidence, selected mappings, rationale and rejected alternatives. Existing
library selections are inherited rather than researched as open choices. Current external
Prisma examples cannot silently upgrade the locked v7 API. Runtime compatibility remains
verified by the existing client/native/build checks when implementation occurs.

### Internal Phase 1 - Design (complete as documentation)

- [Data model](data-model.md) defines exact-version relationships, scalar/child milestones,
  single waiting/current guards, D099 marker plus retained history, additive Season backfill,
  Club-only MediaAsset and actual summary-reference targets without summary workflows.
- [REST](contracts/rest.md) derives explicit owning actions/allowlists from UC05/06/07/12;
  create receipts have no fake prior revision and no automatic seasonal access.
- [Execution](contracts/execution.md) extends the PHASE 1-narrow lock/receipt/audit platform
  with required business authority and verified-absence versus unavailable dependency ports.
- [Media/recovery](contracts/media-recovery.md) binds storage/reference/audit safely and upgrades
  current foundation-only recovery before Club/schema deployment, preserving legacy validation.
- [UI](contracts/ui.md) extends current session/capability/HTTP handling and workspace features
  rather than creating a parallel SPA/client or public dashboard.
- [Verification](verification.md) and [quickstart](quickstart.md) define expected checks,
  discovery registration, failure/race proof, test isolation, thresholds and evidence ownership.

### Implementation increments for later Task generation

This is sequencing guidance, not approved Tasks or permission to start implementation.

| Increment | Prerequisites | Complete behavior and required proof |
|---|---|---|
| Shared preparation | Approved Plan/Tasks/linked Issues before execution | Additive schema and tested foundation adapters, summary reference targets, media-aware recovery format prepared before expanded-schema deployment; existing PHASE 1 regression remains green. |
| US1 season shell | Shared preparation | Creation-only acknowledgement, separate staffing, scoped CRUD/history, Closed-metadata final gate; real security/rollback proof. |
| US4 club + logo | Shared preparation | End-to-end shared master and durable current-image journey with safe recovery, field feedback, duplicate review and actual assets. |
| US5 stadium | Shared preparation | End-to-end shared master/correction/history without schedule changes. May proceed alongside club work when files/constraints are independent. |
| US2 full regulations | US1 and shared typed policy/ports | Full form/version/independent decision with exact content and protected-data validation. |
| US3 timed rules | US2 | Shared admitted activation, cancel/replace/catch-up and request-time basis correctness; race/failure proof. |
| US6 D099 | US4/US5 owning masters and lock guards | Discontinue/resume with UI/history, new-use guard tests and no approved-commitment changes. |
| US7 lifecycle | US1 plus regulation waiting/readiness guards | Actual proposal/independent close/reopen against typed summary evidence, blocked production without real readiness, unchanged freezes/roles. |
| Final PHASE 2 assessment | All seven stories and required suites | Real Chrome/Edge, lookup/load, media/restore and existing regressions; reviewer report distinguishes fixture-proved guards from later operational integration. |

Foundation changes can be factored first where required to keep increments safe, but final
Tasks should remain reviewable/verifiable slices with genuine dependency edges. Priorities
do not omit a story. The future to-tickets step must preserve one Issue per approved Task;
it cannot independently split/merge the approved Task source.

## Verification strategy and release gates

Use V01-V10 in verification.md for full FR/SC coverage, required unit/integration/browser/load/
operations targets and the fast/deep split. Independent pg observers establish committed state;
typed isolated fixtures and deterministic clocks/barriers exercise boundary conditions.
Do not use mocked network journeys as evidence of actual backend/media operations.

Required extension checks include foundation populated-data migration and preserved FK/audit,
new action receipts/replay, per-object history scopes, current-file delivery and replacement,
v2 nonempty backup inventory and interrupted same-set restore before maintenance release.
Register new test files in the existing explicit browser configuration and extend fixture
resets/required Season fields so old tests are not silently skipped or broken by the schema.

Operational eligibility/calendar/planning/Q/R inputs are needed before real regulation approval,
and authorized logos plus protected local storage/UID/disk/backup settings before affected
acceptance. They are not unresolved architecture or a reason to substitute test defaults.
Existing-season competitionName backfill mapping must be reviewed before operational migration.
Optional Internet/Supabase verification applies only if that profile is separately selected.

All seven stories, current mandatory PHASE 2 criteria, applicable inherited regressions and
actual reviewer evidence must pass before implementation completion. Full later consumption,
10-season/3,800-match reporting/history and complete BM-07 remain with the owning Phases.
This Plan creates no acceptance report or software success claim.

## Plan review gate

The approved Spec and 16/16 quality checklist enabled this Plan. Team Leader Plan approval
is recorded above. Cross-artifact analysis, explicit final Tasks approval and publication
as Issues [#72](https://github.com/quocthai912/Whistle-EPL/issues/72)–[#101](https://github.com/quocthai912/Whistle-EPL/issues/101)
are complete, as recorded in [tasks.md](tasks.md), including unique Task-to-Issue traceability.
Implementation still requires separate explicit authorization before work begins.
No application code, next project Phase, commit/push or PR is authorized by Plan completion.

## Complexity Tracking

No Constitution exception or new infrastructure is proposed. Missing operational inputs
remain stage-specific prerequisites rather than a justification to weaken guards.

<!-- /coderabbit-ai-generated:v1 -->
