# Implementation Plan: PHASE 3 - Profiles and Player Registration

**Branch**: `docs/phase-3-architecture-and-specification` | **Date**: 2026-11-12 (Asia/Bangkok) | **Spec**: [approved Specification](spec.md)  
**Status**: Approved by the Team Leader on 2026-11-12 (Asia/Bangkok)  
**Approval evidence**: The Team Leader answered "Tôi phê duyệt." after reviewing the Implementation Plan, supporting design and verification coverage, authorizing Task generation.

## Summary

Extend Registry & Registration for UC08–UC11 within the existing monolith and SPA. Store exact BM1 and registration versions, keep shared Player identity separate from seasonal facts, and reuse Media for portraits. Evaluate eligibility and its historical correction basis inside the same execution boundary as decisions that consume them. Use the accepted PHASE 1 platform and the future accepted PHASE 2 owners for season state, rules, Club and Stadium.

## Technical Context

| Area | Existing baseline and application |
| --- | --- |
| Language and dependencies | Node 24.14.0, pnpm 10.33.2, TypeScript 5.9.3, NestJS 11.2.8, Prisma 7.10.1 with pg, React 19.2.9, React Router 8.5.1, Ant Design 6.6.8, Day.js 1.11.23 and sharp 0.35.5. Retain repository pins and D097/D098. |
| Runtime and storage | Existing same-origin HTTPS Compose/Caddy reference deployment, PostgreSQL 17.11 and durable managed media under D087/D088/D094. The approved Internet storage alternative applies only if selected for the environment. |
| Verification | Jest/Supertest with real PostgreSQL, Vitest/Testing Library, Chrome and Edge via Playwright, k6 for the scoped HQ-01 measurement and existing backup/restore tooling. |
| Scope and scale | 26 requirements, seven measurable outcomes, 20 clubs and at least 600 Player Profiles in the full-season fixture. Verify PHASE 3 internal lookup performance and two-season history. Later public and full-system thresholds remain with their owners. |

## Constitution Check

The pre-research review applies to this documentation stage. Spec Kit internal Phases 0 and 1 are research and design.

| Principle | Before research | After design |
| --- | --- | --- |
| I — Traceability | Approved Spec, D100 and the FR-020 clarification govern. Source references follow approved Context transcription. | [Research](research.md), [model](data-model.md) and contracts link the rule owners. [Verification](verification.md) traces each FR and SC. |
| II — Scope and workflow | Specification approval authorizes Plan and design. PHASE 2 acceptance is outstanding. | Plan approval gates Task generation. Final Task approval gates issue publication. A separate execution gate requires accepted PHASE 2 dependencies. |
| III — Ownership | Use the approved stack and module boundaries. | Registry & Registration owns UC08–UC11. Season & Regulations retains rule/lifecycle decisions, Stadium remains with its owner, Media owns bytes, and Audit owns protected logs. Use the existing caller-owned transaction. |
| IV — Security and atomicity | Apply existing session/CSRF, approval independence and final write safeguards. | [Execution](contracts/execution.md) binds exact versions, ordered locks, safe retries and audit. [Media](contracts/media.md) coordinates file durability, access and recovery. Test adapters remain isolated. |
| V — Verification | Require authorization, rollback, race, history, integration and regression evidence. | The [verification matrix](verification.md) and [validation guide](quickstart.md) define observable checks and release evidence. Test-first cases are the transaction and eligibility boundaries named in the matrix. |

## Project Structure

| Artifact or source area | Responsibility |
| --- | --- |
| [research.md](research.md), [data-model.md](data-model.md) | Repository-derived choices, typed cases, version lineage, rule segments and integrity. |
| [REST](contracts/rest.md), [execution](contracts/execution.md), [UI](contracts/ui.md), [media](contracts/media.md) | Contracts for browser, dependencies, command processing and portraits. |
| [verification.md](verification.md), [quickstart.md](quickstart.md) | Requirement coverage, evidence, prerequisites and future validation commands. |
| `backend/src/registry-registration`, existing platform, audit and media seams, `backend/prisma` | Planned PHASE 3 business services and persistence. Reconcile paths with accepted PHASE 2 implementation. |
| `frontend/src/features`, `backend/tests`, `frontend/tests`, `tests/e2e`, `tests/performance`, `ops/backup` | Planned feature screens and suites within existing workspace conventions. |

## Dependency and Delivery Strategy

| Prerequisite | Required release evidence and affected work |
| --- | --- |
| PHASE 1 accepted foundation | Use accepted identity/role and shared-grant workflows, session and final authorization, audit and rollback infrastructure. Regress those seams after integration. |
| PHASE 2 UC05/D074/D076 | Verify accepted same-season identity and Open/Closed checks, no-effective-regulation gates and the closing-readiness contract. FR-001–005, FR-010–020, FR-025–026. |
| PHASE 2 UC06/D051–D054/D089 | Verify accepted exact receipt/decision version access, active history, due activation and registration compatibility. FR-003, FR-010–020, FR-025–026. |
| PHASE 2 UC07/UC12/D099 | Verify accepted shared Club/Stadium identity, availability and locking contract. FR-001–005, FR-012, FR-017, FR-025–026. |
| PHASE 2 supporting contracts | Confirm compatible migration baseline, caller-owned execution, typed dependency ports and the extension seam for Player references and portrait bytes in the accepted media/backup tooling. Verify what the accepted tooling covers and assign any Player-specific adaptation to the existing media Tasks. Use [PHASE 2 Plan](../002-phase-2-season-regulations/plan.md) and [execution contract](../002-phase-2-season-regulations/contracts/execution.md) for planning. |

**Execution gate:** Before starting any PHASE 3 implementation, verify the recorded PHASE 2 acceptance and accepted source revision against these contracts and record the result. If any dependency is unimplemented, unaccepted, absent or changed, keep implementation blocked, identify affected FRs/artifacts and bring material deviations back for approval. Operational rules/assets remain explicit inputs at their owning gates. Fixtures can exercise isolated checks and provide no production fallback or dependency sign-off.

For T001, use the [cross-phase audit reconciliation](../002-phase-2-season-regulations/documentation-audit.md#phase-3-impact) to locate the upstream evidence for immediate effectivity, read-only basis resolution and the exact closing boundary. The accepted PHASE 2 revision remains the execution baseline.

After the gate is satisfied, establish schema, guards and live fact providers (T002–T004) before exposing owning writers. Then deliver Player/profile and club intake, registration and eligibility, temporal operations, and both correction paths. Verify the providers against real records in T024 and complete the remaining integrated verification. See [Tasks](tasks.md#dependencies-and-implementation-strategy) for the exact order.
