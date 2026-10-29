# Implementation Plan: PHASE 1 — Operational Foundation and Access Administration

**Branch**: `spec/phase-1-operational-foundation` | **Date**: 2026-10-28
**Spec**: [Approved Specification](spec.md)
**Status**: Design reviewed against Constitution v1.0.0; Tasks approved on 2026-10-28;
documents published by the Team Leader at b8e6e15b27ed8446cc60dba94bf1a0b0259e51b2;
all 48 Task Issues are published and linked in tasks.md. **Implementation is IN_PROGRESS**:
T001–T014 are verified and published at [892f172](https://github.com/quocthai912/Whistle-EPL/commit/892f172f9ec539d5789a31a2f8046480afe15772)
on `feat/phase-1-core-foundation` (2026-10-29). T015–T022 are implemented, verified and published at [`7ac09e6`](https://github.com/quocthai912/Whistle-EPL/commit/7ac09e6cec9fb434248c82db142ab04695961823) on `feat/phase-1-operations-recovery` (review base `30506e3`); see [operator evidence](../../docs/verification/phase-1/operator-foundation.md). T023–T026 are implemented and locally verified in the uncommitted working tree based on 7e28810 (see [authentication evidence](../../docs/verification/phase-1/authentication.md)); T027–T048 and Phase acceptance remain pending.
See [tasks.md](tasks.md), [foundation verification](../../docs/verification/phase-1/foundation.md)
and the [current Phase ledger](../../context/progress-checker.md#phase-1-execution-evidence---2026-10-29).

**Input**: Approved spec.md; Context/Constitution baseline
`e3c3c81d4782ae57443af3249b6a119a8e34f4f3`.
The Team Leader explicitly authorized Plan/Tasks/Analyze after approving the Specification.
The 2026-10-28 planning activity created no application, database, dependency installation,
workflow or GitHub setting. The subsequent implementation status above is separate from that design approval.

## Summary

Deliver one runnable foundation with Identity & Access, audited use-case orchestration,
operator bootstrap/recovery and foundation operations. Use the approved modular layered
NestJS/PostgreSQL backend and React SPA. Four user stories share security, database and
audit foundations; each later story still has independent acceptance scenarios.
Administration does not implement the later business operations for which rights are granted.

Apply the current [decision index](../../context/design/README.md#confirmed-decisions).
Exact packages/images and native-module compatibility are frozen only after real
implementation-time verification; drafting this Plan is not that evidence.

## Technical Context

**Language/Version**: TypeScript 5.9 strict; Node.js 24; backend CommonJS, frontend ESM.
**Primary Dependencies**: D097's NestJS 11/Express 5; Prisma 7 prisma-client with explicit CJS
output, @prisma/adapter-pg and pg; React 19/Vite 8/React Router 8; Ant Design 6/CSS Modules;
Day.js UTC/timezone; class-validator/class-transformer; argon2; node:crypto;
@nestjs/schedule for in-process cleanup. No alternative auth/state/cache infrastructure.
**Storage**: PostgreSQL 17; typed account/security/authority/audit/receipt rows, protected
reference-host backup volumes. No public DB access or Redis.
**Testing**: Jest/Supertest with real PostgreSQL; Vitest/React Testing Library; actual Chrome
and Edge via Playwright; local k6; deterministic test-only clock and fixtures.
**Target Platform**: Ubuntu Server 24.04 LTS Compose v2/Docker/Caddy 2 reference deployment;
mandatory Ubuntu and Windows source/unit/build CI; database integration on Ubuntu.
**Project Type**: Two pnpm Workspaces, browser frontend plus a single modular backend.
**Performance Goals**: BM-01 at least 100 attempts/20 concurrent users/95% within 3 seconds;
30-minute idle/8-hour absolute expiry. No new latency target or coverage percentage.
**Constraints**: Same-origin HTTPS, server authority, ordered transactional final checks,
no secret-bearing receipts/logs, synthetic isolated tests, approved dependency lock only.
**Scale/Scope**: UC01-UC04, CLI, delegated-authority administration and available-data recovery;
test-only two-season identities, not league datasets or operational season creation.

## Constitution Check

Pre-research review and post-design recheck both assess the proposed work, not software execution.

| Principle | Before research | After design | Concrete evidence |
|---|---|---|---|
| I. Authoritative sources/traceability | PASS | PASS | Approved spec source table; owners linked in research/model/contracts; no new ADR or changed business rule |
| II. SDD/scope | PASS | PASS | Actual Spec approval recorded; design/task generation authorized; the Team Leader subsequently approved Tasks and elected to publish documents personally before Issue creation; implementation remains gated |
| III. Owned modules/architecture | PASS | PASS | D097 stack, two Workspaces and single DB; module boundaries below; no later business workflows or universal workflow engine |
| IV. Security/atomicity | PASS | PASS | REST/CLI execution-specific contracts, ordered guards/final checks, audit/receipt transaction and boundary tests |
| V. Verification/evidence | PASS | PASS | Spec explicitly requires tests; task mapping and quickstart separate fast/deep evidence; no universal TDD/human-review gate or invented results |

No exceptions or constitution amendments are needed. A PASS here means design compliance;
it does not mark PHASE 1/G0 execution complete. Future implementation changes require recheck.

## Project Structure

### Documentation (this feature)

- spec.md — approved user requirements, scenarios and acceptance.
- checklists/requirements.md — requirements-quality review and clarification scan.
- research.md — derived implementation choices, alternatives and primary-source references.
- data-model.md — PHASE 1 data/constraint/state mapping.
- contracts/rest.md — exact planned HTTP allowlists and response/security contract.
- contracts/operator-cli.md — server operator commands and recovery/backup boundaries.
- quickstart.md — command availability and remaining acceptance walkthroughs; links to separately recorded execution results.
- tasks.md — approved dependency-ordered implementation work, published Issue links and evidence-based completion states.

### Source Code (repository root)

The following is the planned full-feature layout. T001–T026 now implement its setup/shared/operator/authentication
foundation paths (T023–T026 locally verified and uncommitted); remaining authentication UI, administration/audit and acceptance paths are delivered by T027–T048. Planning itself
did not generate application files.

```text
package.json
pnpm-workspace.yaml
pnpm-lock.yaml
eslint.config.mjs
.prettierignore
.prettierrc.json
frontend/
  package.json
  src/
    app/                  # routing, Vietnamese shell, permitted navigation
    features/auth/        # login, required password change, session transitions
    features/accounts/    # accounts, roles, separate grants and delegation views
    features/audit/       # metadata lookup
    shared/http/          # one Fetch transport, CSRF, envelopes, conflicts
  tests/
backend/
  package.json
  prisma/schema.prisma
  prisma/migrations/
  prisma.config.ts
  src/
    main.ts
    app.module.ts
    generated/prisma/     # generated, not manually edited/formatted
    platform/             # configuration, database tx context, clock, errors, validation
    identity-access/      # accounts/auth/roles/grants/delegation owning services
    audit/                # append/projection policy, uses caller transaction
    operations/           # admission, cleanup and backup/restore coordination
    cli/                  # bootstrap, recovery, maintenance/operator entry points
  tests/
    unit/
    integration/
    fixtures/
tests/e2e/
tests/performance/
ops/compose.yaml
ops/Caddyfile
ops/systemd/
ops/backup/
docs/operations/
docs/verification/phase-1/
.github/workflows/ci.yml
```

**Structure Decision**: frontend/backend match D097; support components do not acquire business
authority. Other domain modules are not scaffolded as runnable fake functionality.
A minimal Season table/reference supports authentic FK checks; no operational season seed or UC05 route.

## Design and Execution Strategy

### Data and transactions

Use [data-model.md](data-model.md) and D095/D096, with named SQL CHECK/partial-index/FK
constraints where Prisma cannot express the invariant. Migrations are the deployable source;
test fresh replay and intended schema consistency, including deliberate migration-only checks.
Never replace migration history by schema push.

A transaction context is opened by the application use case and passed to account/grant/audit/
receipt services; those services never independently commit. Acquire shared maintenance admission,
needed system guards, all affected accounts/security keys in deterministic order, seasons,
cases/versions, then receipts. Mutation/revocation coordinate the actor and every affected
recipient/proposer, not only the target currently visible in the UI.

Use a persisted maintenance state plus transaction-scoped admission locking: ordinary writers
share admission, operator maintenance sets the drain boundary/exclusive ownership and persists
closed admission across commands. Recheck closed state after lock acquisition. Never hold a DB
transaction open over the entire external dump/restore; retain closed admission across that
procedure and fail closed after interruption. Readers cannot refresh security state by bypassing it.

Pre-create bootstrap/last-admin guards in migrations. Bootstrap and final-admin checks serialize
before account locks. Login/throttling and due delegation changes need deterministic key/account
coordination; no blanket global exclusive lock for ordinary writes.

Process due delegation boundaries exactly once under the affected-account lock using durable
transition evidence. A future boundary affects all sessions issued before that boundary;
new logins afterward must not be repeatedly revoked. Freshly evaluate trusted current time
after waits, not transaction-start timestamps, including the final write decision.

Critical command receipts bind account/action/key to normalized intent and expected revision.
Resolve existing receipt before treating expectedRevision as a fresh edit, but only after current
authority/projection checks. Acquire receipt after resources per D096; unique-conflict contenders
read the committed result. Credential reset/login/password-change do not persist secret-bearing
receipts. Unknown outcome is not proof of rollback; at most three executions only for known rollback.

### Security and interfaces

[REST contract](contracts/rest.md) owns exact planned route/DTO mappings; no generic permission
or status dispatcher. Use ValidationPipe allowlists, UUID/revision strings and safe error envelopes.
Keep server-only fields and secret fields out of account/list/session/audit projections.

Generate 32-byte session/CSRF values, store only the session SHA-256 digest, and transport session
identity only in the approved host-prefixed protected cookie. Implement the 15-minute prelogin
context, session-stable synchronizer value, exact Origin/Referer validation and no-store responses.
Use 19 MiB/2/1 Argon2id, local pinned SecLists corpus and persistent rolling counters. No password
normalization or runtime password API. Resolve source IP only through the configured Caddy chain.

Audit allowlists are per action; record bootstrap/recovery with explicit operator/system actor kind.
General UC04 metadata never confers object-read authority. Business audit is append-only with no
first-version export/delete; diagnostic rotation is separately 30 days.

### Frontend

One Fetch layer manages envelopes, CSRF bootstrap, session feedback and command intent.
Restricted-change sessions cannot enter business routes. Clear internal memory on session/account
change; never automatically replay a failed write or preserve a password in conflict drafts.
Use Vietnamese labels and date handling in Asia/Ho_Chi_Minh, Loading/Empty/Error, safe field errors,
confirm/cancel and deterministic account/audit lists. No fake league dashboard or season CRUD.

### Operations and CI

[Operator contract](contracts/operator-cli.md) separates bootstrap/recovery (no browser session)
from browser authorization. Compose health/migration/HTTPS/persistence and read-only checks must
work from a clean environment. Backup covers the existing data with a verified manifest; an empty
media inventory is explicit, not a claim of delivered media. Restore is same-set, isolated for
drills and closed to writes until validated; restored sessions are revoked.

Implement D097/D098 root commands and two-OS CI only in approved Tasks. Run full small checks on
doc-only PRs; explicit gate evaluates every required job. PostgreSQL 17 service on Ubuntu, no
Windows database gate. Secrets remain nonproduction and token permissions minimal; pin Actions
full SHAs and images/packages after actual validation. No automatic deploy.

Configure branch rules only after real successful check discovery, no bypass and no direct/force
push/deletion on development/main. GitHub administrative authority cannot be made immutable.
No mandatory human review count is added; Reviewer Agent review may supplement CI.

## Validation and Remaining Execution Inputs

[quickstart.md](quickstart.md) defines the intended command contract and acceptance walkthroughs.
Its setup/shared-foundation and T015–T022 operator/local-deployment commands have been exercised as recorded in the linked verification reports. Remaining workflow, browser/load, full clean-host and elapsed operational acceptance scenarios remain pending. Test-first sequencing is mandatory where the Task/Spec requires it and may
also be explicitly selected for an implementation session; it is not a universal constitutional rule.

O08 actual confidential handoff and remaining credential workflows (the runbook is delivered); O12 remaining application/deployment
verification; O13 remaining browser/load/workflow measurements; and O14 target certificates/proxy/
credentials/off-host destination remain owned implementation/operator deliverables. Corpus provenance,
toolchain/native compatibility and shared-foundation verification are recorded T001–T014 evidence; T015–T022 operator/deployment/recovery implementation and local checks are recorded in the operator report.
The [open register](../../context/open-decisions.md) owns the remaining inputs. There are no
unresolved architecture choices or NEEDS CLARIFICATION placeholders. These execution inputs must
not be silently reported as supplied or as acceptance. Exact pins are a verification deliverable,
not a reason to invent a researched passing installation.

Expected initial engineering slice: setup/shared controls plus US1 and US2, including required audit
append/atomicity support. US3 and UC04 query/UI follow; no slice is full PHASE 1 acceptance.

## Complexity Tracking

No Constitution violations or additional infrastructure exceptions. All design elaborations
reuse approved owners; a future incompatibility requires explicit impact review, not a silent stack
change or a complexity-table waiver.
