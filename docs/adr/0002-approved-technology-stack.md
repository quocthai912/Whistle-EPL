# ADR 0002 - Approved technology stack and REST API style

Current package approval: [Q98 approved v2](../../context/README.md#q98---whole-package-approval). Earlier pending/open statements below are historical interview evidence; current rules remain in their linked owners.

This ADR records decisions and rationale; authoritative current rules are owned by [D002](../../context/design/architecture.md#d002---approved-technology-stack-and-api-style). Historical open-point notes do not reopen subsequently confirmed policy.

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok).

Under O12 and CN-01-CN-04 (PDF p.26), Whistle-EPL needs a consistent web technology stack, centralized relational storage and layered responsibilities. In response to interview Q2, the Team Leader confirmed the principle of prioritizing practiced technologies and explicitly approved React + TypeScript for the frontend, NestJS + TypeScript for the backend, PostgreSQL for the database, Prisma ORM and REST API. Modular Monolith combined with Layered Architecture is reaffirmed, consistent with [ADR 0001](0001-modular-layered-backend.md). Q2 contrasted that selection principle with adopting a new stack as a learning objective; no named competing stack was evaluated in this interview. Individual team experience was not established.

This is an accepted stack decision, not a candidate proposal. It establishes the framework, language, database, ORM and API-style basis for Chapter 3 and subsequent implementation planning. Subsequent decisions, including D097, approve the technology/library/environment baseline and related design contracts. Exact compatible version pins and PHASE 1 compatibility verification remain implementation work. Q98 separately approves the complete v2 package; software implementation and Phase acceptance remain pending. See [Context v2 D002](../../context/design/architecture.md#d002---approved-technology-stack-and-api-style).

## D002 english evidence

Current policy owner: [D002](../../context/design/architecture.md#d002---approved-technology-stack-and-api-style). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** APPROVED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q2, the Team Leader confirmed option A and explicitly approved the technology stack as final for Context Package v2.

- **Source:** O12; CN-01-CN-04, PDF p.26; Q2 confirmation. The selection principle prioritizes technologies the team has practiced, subject to course constraints. The confirmation does not establish individual members' experience or additional course constraints.

- **Alternatives/basis:** Q2 contrasted prioritizing practiced technologies with adopting a new stack as a learning objective. The Team Leader selected A and supplied the final stack; no named alternative stack was compared or approved in this interview.

- **Record:** [ADR 0002](0002-approved-technology-stack.md).

- **Affected Phases:** PHASE 1-PHASE 10. No Phase status changes.

- **Still open:** Product/library/runtime versions, frontend rendering and routing, build/UI/testing tools, hosting and deployment topology, API paths/payloads/errors, authentication/sessions, hashing, schema/ERD, transaction/conflict handling, encoding, transport protection and operational tooling. None is implicitly selected by this stack approval.

## Q97 - Compatible baseline and pnpm development contract

**Status:** accepted. **Decision:** D097. **Approver:** Team Leader, 2026-10-26 (Asia/Bangkok). The Team Leader approved Q97 option A and all proposed technology/library/environment/test-data/test/operation choices, with only these amendments: replace the proposed npm workflow with pnpm-only Workspaces/version pinning, add root ESLint/typecheck/Prettier contracts scoped to source/configuration, and rename the fixture to EPL-TEST-2026 without changing other sample values. [D097](../../context/design/architecture.md#d097---pnpm-toolchain-development-quality-and-reference-operations) owns runtime/libraries/development/operations; [quality](../../context/quality.md#d097-test-season-and-measurement-baseline) owns sample/measurement settings.

Choose a unified documented baseline rather than selecting support tools independently by Phase. This reduces team configuration drift and late architecture choices, accepting exact-version compatibility/pin verification during PHASE 1. pnpm-workspace.yaml, pnpm-lock.yaml and packageManager are the sole project package-management contract; frozen-lockfile installation and root commands cover both applications without formatting Context/ADRs. NestJS 11/CommonJS uses explicit Prisma 7 prisma-client output/moduleFormat cjs and PostgreSQL adapter, preserving the approved monolith. Test configuration is isolated and never silently official operational regulation. The originally proposed npm variant was superseded by the explicit approval amendments, not recorded as an accepted alternative. No dependencies/configuration/source were installed/generated or tested in this interview; whole-v2 and software/Phase approval remain pending.

## Q98 - Whole-package approval and flattened Context

**Status:** accepted. **Approver:** Team Leader, 2026-10-26 (Asia/Bangkok). The Team Leader formally approved Q98 option A, including the entire Context Package v2, D001-D097, 25 Use Cases and the 253-key nationality catalog, and authorized moving the single English-only package directly into context/. [Current package approval](../../context/README.md#q98---whole-package-approval) owns metadata. This removes a redundant language directory without changing the approved business/design baseline. Git preserves the v1 milestone and earlier interview rationale; earlier pending statements in ADR evidence describe those decision rounds. Approval does not establish a build, installed toolchain, software acceptance, completed Phase status or authorization to implement/commit/push in this interview.
