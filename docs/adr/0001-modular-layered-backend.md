# ADR 0001 - Modular, layered monolithic backend

Current package approval: [Q98 approved v2](../../context/README.md#q98---whole-package-approval). Earlier pending/open statements below are historical interview evidence; current rules remain in their linked owners.

This ADR records decisions and rationale; authoritative current rules are owned by [D001](../../context/design/architecture.md#d001---modular-layered-monolithic-backend). Historical open-point notes do not reopen subsequently confirmed policy.

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok).

Under O12 and CN-01-CN-04 (PDF p.26), Whistle-EPL needs a browser-based Client-Server application, centralized relational storage and clear UI/business/data-access responsibilities. In interview Q1, the Team Leader explicitly selected option A: one backend deployed as a single unit, organized into business modules with layered responsibilities, using one centralized relational database. Compared with organization solely by technical layers, business modules make responsibility boundaries clearer; compared with independently deployed services, this choice keeps deployment and cross-functional transactions manageable for the three-member SE104 project (§1.5 pp.50-52). Module dependencies must remain controlled. At Q1, frontend architecture, stack, database product, concrete modules/dependencies and transaction contracts remained open. ADR 0002 subsequently settles the stack and API style; O12 remains partially settled. See [Context v2 D001](../../context/design/architecture.md#d001---modular-layered-monolithic-backend).

### D001 english evidence

Current policy owner: [D001](../../context/design/architecture.md#d001---modular-layered-monolithic-backend). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** Interview Q1 proposed option A; the Team Leader replied “Tôi chọn A.” (“I choose A.”).

- **Source:** O12; CN-01-CN-04, PDF p.26; centralized data constraint in §1.2.6.1; three-member team and source project plan in §1.5 pp.50-52.

- **Alternatives discussed:** A modular layered monolith; a monolith organized only by technical layers; independently deployed services.

- **Basis and consequences:** Business module boundaries help organize team responsibilities while a single backend/database keeps deployment and cross-functional transactions manageable. Module dependencies require discipline. Exact modules, dependency rules and transaction boundaries still need confirmation.

- **Record:** [ADR 0001](0001-modular-layered-backend.md).

- **Affected Phases:** PHASE 1 foundation and PHASE 2-PHASE 10 design/integration. No Phase status changes.

- **Follow-up:** [D002](../../context/design/architecture.md#d002---approved-technology-stack-and-api-style) below settles the stack and REST API style. Frontend rendering/deployment, schema/ERD, detailed API contracts, authentication/sessions, hashing, encoding, transport protection, audit, conflict handling and transaction design remain open. [D001](../../context/design/architecture.md#d001---modular-layered-monolithic-backend) settles the backend architectural shape within O12.

## Q79 - Module ownership and coordination

**Status:** accepted. **Decision:** D079. The Team Leader selected Q79 option A ("Tôi chọn A."), approving the full proposed package. Current policy and the eight-module ownership map are in [D079](../../context/design/architecture.md#d079---backend-module-ownership-and-synchronous-coordination).

Choose explicit business module ownership rather than four broad administration/competition/results/publication groups. This improves UC-to-data responsibility mapping for Chapter 3 and team development, accepting the need for explicit internal interfaces and transaction coordination. Retain the single layered backend/PostgreSQL/Prisma architecture, synchronous internal calls, application-use-case orchestration, single-transaction changes for official results/statistics/history, and shared statistical interpretation for public queries. Media, Audit and Data Exchange remain support components under owning business authority. Exact dependency/interface/schema contracts remain open; no broker, distributed deployment or new library is selected.

## Q87 - Docker Compose reference deployment

**Status:** accepted. **Decision:** D087. **Approver:** Team Leader, 2026-10-26 (Asia/Bangkok). The Team Leader explicitly approved Q87 option A - Docker Compose and the entire proposed common package, then added permission for optional Supabase Storage for Internet media storage. Current deployment rules are owned by [D087](../../context/design/architecture.md#d087---docker-compose-reference-deployment); storage rules are owned by [media policy](../../context/design/media.md#environment-specific-media-storage), with amendment evidence in [ADR 0015](0015-managed-club-logos-in-first-version.md#q87---environment-specific-media-storage-amendment).

Choose Compose rather than native service installation to make the single-host Linux deployment repeatable for the SE104 team, accepting container/volume configuration and maintenance. Caddy provides same-origin React/API HTTPS delivery; durable state, separated environments/secrets, safe migrations, health verification and the existing first-admin CLI remain required. Provider/domain selection, exact tool versions, timed jobs and backup/recovery mechanics are not inferred from this approval. The Supabase exception permits file-storage substitution without mandatory dual storage or adoption of its authentication/database services; no Vercel/Render deployment is approved. Earlier statements that deployment/reverse-proxy/storage choices were open describe their historical decision rounds and are superseded only for this approved scope. Whole-v2 approval and implementation/Phase acceptance remain pending.

## Q88 - Coordinated backup and restore

**Status:** accepted. **Decision:** D088. **Approver:** Team Leader. The Team Leader answered "Tôi chọn A." to Q88, approving option A and the entire proposed common package. [D088](../../context/design/architecture.md#d088---coordinated-backup-sets-and-controlled-restore) is the current policy owner, elaborating BM-07 and D087/LOGO-01/D069 without changing their approved thresholds or media permissions.

Choose a coordinated database/media backup set with a drained write-maintenance interval rather than uninterrupted writes with snapshot/versioned-media coordination. This accepts a short period of write unavailability to simplify consistency and recovery for SE104. The approved package includes pg_dump custom format/pg_restore, a versioned inventory/checksum manifest, at-least-daily automatic and supplementary operator runs, non-overlap/failure handling, at least seven complete retained sets, protected storage and an off-host copy for Internet deployment, same-set restoration through a server operator procedure, invalidation of restored sessions and separate-environment drills within the existing 30-minute threshold. Failed sets do not replace good ones; cleanup preserves retained recovery content. Provider-specific storage is selected per environment; the backup copy does not require dual operational storage. Scheduling machinery, exact destinations/scripts/configuration and job retry contracts remain open. This is backup-point recovery, not per-transaction recovery or a zero-loss guarantee. No new public restore function, code, Phase completion or whole-v2 approval is authorized.

## Q89 - Periodic jobs and overdue activation

**Status:** accepted. **Decision:** D089. **Approver:** Team Leader. The Team Leader answered "Tôi chọn A." to Q89, approving option A and its entire package. [D089](../../context/design/architecture.md#d089---periodic-jobs-and-overdue-regulation-activation) owns current scheduling/recovery rules; [D051](../../context/use-cases/registration.md#d051---controlled-cancellation-replacement-and-activation-of-waiting-regulations) retains business-incompatible activation policy.

Choose @nestjs/schedule for in-backend business jobs and host systemd timers for D088 backups, rather than host timers launching every business job through a CLI. This shares business services/transaction boundaries and separates operational backups from the web process, accepting two scheduler configurations. Minute scans, startup catch-up and request-time resolution prevent delayed scheduling from making stale regulations authoritative; approved effective time remains separate from processing time. PostgreSQL coordination, nonduplicating execution, technical-failure rollback/later recovery, dependent-operation blocking, immediate expiry enforcement and write-maintenance coordination remain required. No new queue/worker, email/SMS service or audit-deletion policy is approved. Detailed timer/schema/lock/error mappings remain elaboration; this does not change D084 synchronous retry limits or establish implementation, Phase completion or whole-v2 approval. Earlier open scheduler/technical-recovery notes are historical for this now-settled scope.
