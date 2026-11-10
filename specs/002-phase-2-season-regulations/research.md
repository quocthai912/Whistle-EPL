# PHASE 2 Technical Research

**Date**: 2026-11-10 (Asia/Bangkok). **Status**: Technical questions resolved for Plan review;
not runtime verification. Inputs: approved [Specification](spec.md), Constitution and owning
Context. Repository inspection used the existing checkout; no application code was changed.
The pre-research Constitution gate is recorded in [plan.md](plan.md#constitution-check).

## R1 - Extend the actual foundation rather than create a second execution stack

**Decision**: Retain locked TypeScript/Node/pnpm, NestJS, Prisma 7/pg, React/Router/Ant Design,
Day.js, sharp and the existing test tools. Add required-callback business execution beside
administration execution using the same admitted DatabaseService/TransactionContext/session
primitives. No default administrator fallback is permitted for PHASE 2 operations.

**Evidence**: backend/package.json, frontend/package.json, package.json;
backend/src/identity-access/administration-execution.ts defaults to administrator checks;
backend/src/platform/database.service.ts already provides Read Committed, maintenance,
fresh trusted time and at most three known-rollback attempts.

**Rationale**: Domain authorization differs while security/transaction semantics must remain
consistent. **Alternatives**: reusing the administrator default would deny business users or
encourage privilege broadening; a separate transaction framework would duplicate safeguards.

## R2 - Add explicit lock, receipt and audit ownership

**Decision**: Extend static typed resource mappings for Club/Stadium and each new case/version
family. Preserve D096 ordering and complete-set discovery/restart. Extend receipt intents per
action, including create-without-prior-revision, and safe outcomes. Extend action/object audit
schemas and object-authorized history rather than exposing business payloads through UC04.

**Evidence**: platform/transaction-context.ts currently maps case/version only to delegation;
platform/command-receipt.service.ts only allows administrative actions and requires a prior
revision/UUID target; audit/audit-payload.policy.ts and audit-view.policy.ts only recognize
foundation fields/objects; audit-query.service.ts is administrator-only.

**Rationale**: Existing controls are intentionally narrow, not general PHASE 2 support.
**Alternatives**: dynamic table names, unrestricted JSON receipt/audit bodies and fake revision
values are rejected. [PostgreSQL 17 locking](https://www.postgresql.org/docs/17/explicit-locking.html)
documents row/advisory locks and the need for consistent lock acquisition; local D084/D096
remain the policy owners. [Partial indexes](https://www.postgresql.org/docs/17/indexes-partial.html)
provide an additional per-state uniqueness guard, not a replacement for business locking.

## R3 - Later facts are synchronous, typed and fail closed

**Decision**: Use transaction-bound ports for registration compatibility/plans, schedule and
result freeze facts, catalog usage, master impacts, public media scope and closing readiness.
Results distinguish KNOWN, VERIFIED_NOT_INTRODUCED and UNAVAILABLE. Verified absence requires
both absent owning relations and absent runtime writer registration, checked at startup;
partial schema, unknown capability or provider failure is UNAVAILABLE, never empty/false facts.

**Rationale**: Initial regulations can validly be approved before later domain sources exist,
but installed historical data cannot be ignored. Positive readiness needs real source facts.
**Alternatives**: catch-and-return-empty, permissive fixtures in production and building later
workflows here violate approved scope/security. See [execution contract](contracts/execution.md).

## R4 - Real lifecycle summary FK without a summary workflow

**Decision**: Include D095 SeasonSummaryCase/SeasonSummaryVersion/Editor as schema-only typed
dependency targets. They reference only Season, Account, their case/predecessor and defined
snapshot data; no Match/Player table is required. LifecycleVersion uses a real scoped summary
FK, not an arbitrary UUID. No report, summary preparation/confirmation or publication API/UI
is added. Later PHASE 7 extends/adopts these exact tables.

**Rationale**: Actual successful closure tests need referentially sound evidence. Production
has no summary authoring here, so empty summary tables correctly block closure; isolated
fixtures may supply typed evidence and a fixture-only readiness adapter. **Alternatives**:
FK-free shadow summaries, disabling integrity in tests or implementing PHASE 7 are rejected.
The [D095 dictionary](../../context/design/architecture.md#season-and-regulations-dictionary)
and [constraints](https://www.postgresql.org/docs/17/ddl-constraints.html) support explicit
typed/scoped relationships; business readiness remains a separate current-data check.

## R5 - Additive schema and staged ownership

**Decision**: Expand existing Season rather than replace it. Preserve every existing role,
delegation, audit and account FK. competitionName needs an explicit reviewed backfill mapping
for existing rows before NOT NULL enforcement; no operational regulation is seeded. Implement
MediaAsset with Club ownership now; add Player FK/one-of-two-owner constraint only when
PHASE 3 introduces its actual target. Do not add a dangling playerId or fake Player records.

**Evidence**: backend/prisma/schema.prisma has only foundation tables and a minimal Season;
202610280002_authority/migration.sql already protects season code/name/date/state/revision.
**Alternatives**: destructive reset and broad future-domain implementation are out of scope.

## R6 - Real bounded media, controlled delivery and crash-safe references

**Decision**: Use the approved local persistent storage profile and locked sharp. Bounded
Nest upload handling validates actual static content before normalized immutable storage;
Registry owns Club reference changes and Media owns content/delivery/cleanup. Staging and
switching participate in maintenance admission; failed SQL leaves a detectable orphan, never
deletes the old current image. Daily cleanup observes the 24-hour grace and retained sets.

**Evidence**: media implementation is absent; verify-native.cjs only checks native compatibility.
frontend/src/shared/http/client.ts currently only sends JSON and drops error details;
response-envelope.interceptor.ts needs an explicit successful file-response exemption.
ops/compose.yaml has no media mount. [sharp metadata](https://sharp.pixelplumbing.com/api-input/)
documents format/dimensions/frame metadata; decoding/normalization remains a separate required
validation step. [Nest scheduling](https://docs.nestjs.com/techniques/task-scheduling) supplies
callbacks, not durable state or cross-process exclusion; PostgreSQL owns coordination.

**Alternatives**: public object URLs, frontend image maps, browser downloads of arbitrary URLs,
dual-write storage or introducing another image library conflict with settled policy.

## R7 - Upgrade recovery together with media schema

**Decision**: Extend the existing operator tools with versioned PHASE 2 available-data backup
sets, explicit media inventory/checksums, same-set database/content restore and release checks.
Retain version-1 verification for matching legacy foundation schema; do not mislabel v1 as a
media-complete set or silently restore mismatched application/schema. See [media/recovery](contracts/media-recovery.md).

**Evidence**: ops/backup/set-format.py rejects club/media_asset/player/match tables, requires
media=[] and scope=available-foundation, and recognizes exactly four regular set files.
backup.sh/restore.sh and backend/src/operations/maintenance.service.ts depend on that format.
Adding Club alone without these changes breaks the accepted backup path.

**Alternatives**: database-only backup or deferring all media recovery to PHASE 10 fails the
approved available-data recovery allocation. Full-season BM-07 evidence still belongs there.

## R8 - Extend existing user journeys and test entry points

**Decision**: Add only /workspace/seasons, its regulations/lifecycle detail, /workspace/clubs
and /workspace/stadiums. Extend current session capability projection and shared HTTP handling
without moving authoritative permissions to the client. Retain /admin routes. Keep regulation
forms feature-owned; reuse existing list/error/dialog patterns where their types fit.

**Evidence**: frontend/src/app/router.tsx, features/auth/auth-routes.tsx, shared/http/client.ts,
session-view.ts and session-store.ts cover foundation routes/capabilities. playwright.config.ts
explicitly selects only three foundation test files, so new browser suites must be registered;
tests/e2e/global-setup.ts resets PHASE 1 only. Backend fixture isolation guards already exist.

**Alternatives**: a second SPA/session client, broad design-system refactor or mock-only browser
proof is unnecessary. Tests are required by Spec/Constitution; universal TDD is not added.

## Inputs and limits

No unresolved technical question blocks completing this design. Actual authorized 20-club
assets/source rights, protected media/backup paths/UID/disk and real operational seasonal
values remain stage-specific inputs. Optional Supabase deployment is not selected here.
No package versions were upgraded. Current Prisma documentation redirects to newer major
examples; this Plan follows the installed Prisma 7 transaction API evidenced in local code,
not those incompatible examples. Research selections are not executed verification.
