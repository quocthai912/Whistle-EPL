# ADR 0002 - Approved technology stack and REST API style

This ADR records decisions and rationale; authoritative current rules are owned by [D002](../../context/english/design/architecture.md#d002---approved-technology-stack-and-api-style). Historical open-point notes do not reopen subsequently confirmed policy.

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok).

Under O12 and CN-01-CN-04 (PDF p.26), Whistle-EPL needs a consistent web technology stack, centralized relational storage and layered responsibilities. In response to interview Q2, the Team Leader confirmed the principle of prioritizing practiced technologies and explicitly approved React + TypeScript for the frontend, NestJS + TypeScript for the backend, PostgreSQL for the database, Prisma ORM and REST API. Modular Monolith combined with Layered Architecture is reaffirmed, consistent with [ADR 0001](0001-modular-layered-backend.md). Q2 contrasted that selection principle with adopting a new stack as a learning objective; no named competing stack was evaluated in this interview. Individual team experience was not established.

This is an accepted stack decision, not a candidate proposal. It establishes the framework, language, database, ORM and API-style basis for Chapter 3 and subsequent implementation planning. Product/runtime versions, frontend rendering/routing, supporting libraries/tools, hosting, deployment topology, detailed API contracts, authentication/sessions, password hashing, schema/ERD and transaction/operational design remain subject to explicit confirmation. O12 is partially settled; package-wide approval and Phase implementation/acceptance are not implied. See [Context v2 D002](../../context/english/design/architecture.md#d002---approved-technology-stack-and-api-style).

### D002 english evidence

Current policy owner: [D002](../../context/english/design/architecture.md#d002---approved-technology-stack-and-api-style). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** APPROVED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q2, the Team Leader confirmed option A and explicitly approved the technology stack as final for Context Package v2.

- **Source:** O12; CN-01-CN-04, PDF p.26; Q2 confirmation. The selection principle prioritizes technologies the team has practiced, subject to course constraints. The confirmation does not establish individual members' experience or additional course constraints.

- **Alternatives/basis:** Q2 contrasted prioritizing practiced technologies with adopting a new stack as a learning objective. The Team Leader selected A and supplied the final stack; no named alternative stack was compared or approved in this interview.

- **Record:** [ADR 0002](0002-approved-technology-stack.md).

- **Affected Phases:** PHASE 1-PHASE 10. No Phase status changes.

- **Still open:** Product/library/runtime versions, frontend rendering and routing, build/UI/testing tools, hosting and deployment topology, API paths/payloads/errors, authentication/sessions, hashing, schema/ERD, transaction/conflict handling, encoding, transport protection and operational tooling. None is implicitly selected by this stack approval.
