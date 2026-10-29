# PHASE 1 Planning Research

**Date**: 2026-10-28. **Scope**: Derived design within approved D001-D098, not a new ADR,
installed dependency set or software acceptance. Two read-only research agents examined
toolchain reproducibility and security/transaction mechanisms; the main agent reconciled
their findings against the approved Specification and Context.

**Execution follow-up (2026-10-29)**: T001–T014 are verified and published at `892f172`;
T015–T022 operator/deployment/recovery work is implemented and verified locally against `30506e3`, with [operator evidence](../../docs/verification/phase-1/operator-foundation.md); its working tree is uncommitted.
[Task status](tasks.md) and the [Phase ledger](../../context/progress-checker.md#phase-1-execution-evidence---2026-10-29)
own current progress. Planning-time execution deliverables below describe what research did
not execute; use the [open register](../../context/open-decisions.md) for what remains unresolved now.

## Runtime, Workspace and Database Client

**Decision**: Retain D097's Node.js 24/TypeScript 5.9, pnpm-only two-Workspace layout,
NestJS 11/CommonJS and Prisma 7 explicit prisma-client output with moduleFormat cjs and
PrismaPg/pg. Generate before checking generated imports. Exact patches, peer dependencies,
native imports and container digests are explicit O12 setup verification deliverables.

**Rationale**: Prisma 7 documents Node 24 and TypeScript >=5.4 support and CJS generation.
This supports the selected baseline without claiming an exact installation passed.
The pnpm version must be exact and compatible; its native dependency build policy must
be checked rather than blanket-authorizing dependency scripts or silently skipping argon2/sharp.

**Alternatives considered**: Converting the backend to ESM, another ORM, independent lockfiles
or silently selecting latest versions contradict the approved baseline. They are not adopted.

Primary sources: [Prisma 7 requirements](https://www.prisma.io/docs/orm/v7/reference/system-requirements),
[client generator](https://www.prisma.io/docs/orm/v7/prisma-schema/overview/generators),
[Nest Prisma recipe](https://docs.nestjs.com/recipes/prisma), [pnpm Workspaces](https://pnpm.io/workspaces),
[frozen installation](https://pnpm.io/cli/install), [pnpm compatibility](https://pnpm.io/installation),
[sharp installation](https://sharp.pixelplumbing.com/install/).

## Migration and Two-OS Verification

**Decision**: Explicitly validate/generate with pinned Prisma 7, replay committed migrations
into a fresh PostgreSQL 17 database, verify migration history and intended schema consistency,
then execute integration tests. Keep frontend Vitest/RTL and backend Jest configurations
separate. Use serial database integration initially, with independent connections inside
race tests; parallel suites require dedicated databases rather than shared mutable fixtures.

**Rationale**: Migration deployment neither generates the client nor detects drift.
Prisma 7 CLI states that development migrations no longer implicitly generate/seed;
do not rely on a stale generic migration-page sentence suggesting automatic generation.
Account for deliberately migration-managed constraints in schema comparison. Windows runs
the approved source/unit/build checks; Linux service-container integration fits Q103.

**Alternatives considered**: In-memory DB tests cannot prove PostgreSQL lock/FK semantics;
Windows PostgreSQL integration is deliberately not mandatory. Schema push is not migration replay.

Primary sources: [Prisma 7 CLI](https://www.prisma.io/docs/orm/v7/reference/prisma-cli-reference),
[migration workflow](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/development-and-production),
[GitHub PostgreSQL service containers](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers),
[Vitest features](https://vitest.dev/guide/features.html),
[Jest workers](https://jestjs.io/docs/environment-variables).

## Ordered Authorization and Transaction Ownership

**Decision**: Use one application-owned transaction context and D096's resource order.
Pre-create bootstrap/last-admin guards; ordinary authority reads use locks incompatible
with permission changes, not a key-only lock that permits non-key authority mutation.
Discover affected proposer/recipient accounts, lock deterministically, recheck and restart
acquisition if discovering an earlier resource would violate the order.

**Rationale**: Read Committed alone does not enforce last-admin, revocation or grant overlap
invariants. Use fresh trusted time after waits; PostgreSQL now()/CURRENT_TIMESTAMP is
transaction-start time and cannot establish final authority after a long wait.
Credential verification outside locks must recheck password/authRevision before issuing a session.

**Alternatives considered**: A blanket global exclusive writer lock or blanket Serializable
changes D084's model. Checking a previously read role/count/time is insufficient.

Primary sources: [PostgreSQL 17 explicit locks](https://www.postgresql.org/docs/17/explicit-locking.html),
[transaction isolation](https://www.postgresql.org/docs/17/transaction-iso.html),
[clock semantics](https://www.postgresql.org/docs/17/functions-datetime.html).
Policy owners: [D030/D084/D096](../../context/design/architecture.md).

## Durable Delegation Boundaries and Command Receipts

**Decision**: Persist once-only delegation-boundary processing under affected-account
coordination; process crossed boundaries in effective-time order before accepting/issuing
a session. Keep proposal outcome separate from grant lifecycle. Recover existing critical
receipts under current authority before treating a matching retry as a new stale edit.

**Rationale**: Repeated lazy expiry handling must not revoke sessions issued after a boundary.
An offline interval can cross both start and end; neither may revive a grant. Receipt uniqueness
and atomic audit/business recording prevent duplicate effects, but an immediately absent
receipt does not prove a competing or unknown transaction rolled back.

**Alternatives considered**: Cleanup-only validity, in-memory processed flags and blind retries
violate approved boundary/replay behavior. Credentials are never stored in receipts.
Owners: [D013-D029](../../context/design/access-control.md), D084/D096 and
[administration execution matrix](../../context/use-cases/administration.md#d096-execution-authority-and-transaction-matrix).

## Crash-Safe Maintenance and Recovery

**Decision**: Combine shared writer/exclusive drain admission with persisted closed state
and an operator-owned durable maintenance marker outside the restored database snapshot.
The host procedure keeps that marker through backup/restore/restart; the application refuses
writers until the operator verifies recovery and releases both states. Do not hold a long
database transaction open across external dump/restore work.

**Rationale**: Advisory locks disappear when the connection dies. A restored older database
can also replace its latch state. Neither event may silently reopen an unsafe partial restore.
All security-state writers and cleanup participate in the same admission protocol.

**Alternatives considered**: Session-only advisory locking or a process-local flag cannot
meet D088's fail-closed requirement. This adds technical coordination, not a new business right.
Owners: [D088/D089/D096](../../context/design/architecture.md); Q102 Phase allocation.

## Resolved Design Versus Planning-Time Unexecuted Inputs

At the 2026-10-28 planning milestone, the mechanisms above resolved planning choices. O08 corpus revision/license/handoff,
O12 exact compatible pins/native/import/build proof, O13 actual environments and measured
results, and O14 target deployment values remained explicit implementation/operator deliverables.
No package installation, schema generation, application build/test, benchmark or restore
has been executed by this research. Internet deployment is not implicitly selected or purchased.
