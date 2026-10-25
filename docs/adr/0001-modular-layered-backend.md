# ADR 0001 - Modular, layered monolithic backend

This ADR records decisions and rationale; authoritative current rules are owned by [D001](../../context/english/design/architecture.md#d001---modular-layered-monolithic-backend). Historical open-point notes do not reopen subsequently confirmed policy.

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok).

Under O12 and CN-01-CN-04 (PDF p.26), Whistle-EPL needs a browser-based Client-Server application, centralized relational storage and clear UI/business/data-access responsibilities. In interview Q1, the Team Leader explicitly selected option A: one backend deployed as a single unit, organized into business modules with layered responsibilities, using one centralized relational database. Compared with organization solely by technical layers, business modules make responsibility boundaries clearer; compared with independently deployed services, this choice keeps deployment and cross-functional transactions manageable for the three-member SE104 project (§1.5 pp.50-52). Module dependencies must remain controlled. At Q1, frontend architecture, stack, database product, concrete modules/dependencies and transaction contracts remained open. ADR 0002 subsequently settles the stack and API style; O12 remains partially settled. See [Context v2 D001](../../context/english/design/architecture.md#d001---modular-layered-monolithic-backend).

### D001 english evidence

Current policy owner: [D001](../../context/english/design/architecture.md#d001---modular-layered-monolithic-backend). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** Interview Q1 proposed option A; the Team Leader replied “Tôi chọn A.” (“I choose A.”).

- **Source:** O12; CN-01-CN-04, PDF p.26; centralized data constraint in §1.2.6.1; three-member team and source project plan in §1.5 pp.50-52.

- **Alternatives discussed:** A modular layered monolith; a monolith organized only by technical layers; independently deployed services.

- **Basis and consequences:** Business module boundaries help organize team responsibilities while a single backend/database keeps deployment and cross-functional transactions manageable. Module dependencies require discipline. Exact modules, dependency rules and transaction boundaries still need confirmation.

- **Record:** [ADR 0001](0001-modular-layered-backend.md).

- **Affected Phases:** PHASE 1 foundation and PHASE 2-PHASE 10 design/integration. No Phase status changes.

- **Follow-up:** [D002](../../context/english/design/architecture.md#d002---approved-technology-stack-and-api-style) below settles the stack and REST API style. Frontend rendering/deployment, schema/ERD, detailed API contracts, authentication/sessions, hashing, encoding, transport protection, audit, conflict handling and transaction design remain open. [D001](../../context/english/design/architecture.md#d001---modular-layered-monolithic-backend) settles the backend architectural shape within O12.
