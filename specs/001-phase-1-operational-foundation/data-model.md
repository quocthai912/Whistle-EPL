# PHASE 1 Data Model

**Status (2026-10-29)**: T005–T008 physical schema and four committed migrations are implemented
and verified on PostgreSQL 17.11 at published commit `892f172f9ec539d5789a31a2f8046480afe15772`.
The current review base `30506e3` also includes the fifth delegation-history migration; T015–T022 verified all five in fresh Compose/PG17 replay and checksummed foundation recovery. See [operator evidence](../../docs/verification/phase-1/operator-foundation.md). This session changes no schema/migration rules.
See [schema.prisma](../../backend/prisma/schema.prisma), [migrations](../../backend/prisma/migrations/)
and [verification](../../docs/verification/phase-1/foundation.md). This mapping remains the design
reference; complete account/session/delegation use-case behavior and Phase acceptance remain pending.
Read with [spec.md](spec.md), [REST contract](contracts/rest.md) and the authoritative
[D095 dictionary](../../context/design/architecture.md#detailed-relational-dictionary)/
[D096 security additions](../../context/design/architecture.md#security-support-dictionary-completion).
Physical names use snake_case; logical names retain the approved vocabulary.

## Common Representation and Constraints

Independently identified rows use backend UUID v4 IDs and server createdAt timestamps.
Mutable aggregates use a positive bigint revision starting at 1 and updatedAt. API bigint
revisions are decimal strings, not lossy JavaScript numbers. Instants use timestamptz/UTC;
calendar values use date with Asia/Ho_Chi_Minh input/display. Referenced history uses
Restrict/NoAction; no blanket account/season cascade. Declare actual FKs and partial unique
indexes in committed migrations, including named SQL constraints Prisma cannot express.

The following quotations are canonical constraint summaries for schema/validation Tasks.
They elaborate existing owners and are not new independently maintained business policy.

| ID | Exact constraint summary |
|---|---|
| C01 | personnelCode 1-32 code points; uppercase ASCII letters/digits/underscore/hyphen, starting alphanumeric; unique, stable and non-reusable; fullName 1-200 code points after D092 normalization; username 3-50 lowercase ASCII letters/digits/dot/underscore/hyphen, starting alphanumeric, unique case-insensitively |
| C02 | password 15-128 Unicode code points; hash UTF-8 without trim/case/NFC/truncation; Argon2id m=19456 KiB,t=2,p=1; no raw credential column; temporaryPasswordExpiresAt nullable until issuance, then 24-hour expiry; mustChangePassword required |
| C03 | session tokenHash exactly 64 lowercase hexadecimal characters and unique; csrfToken exactly 43 base64url characters; accountAuthRevision bigint; idle expiry 30 minutes and absolute expiry 8 hours; no raw session token column |
| C04 | prelogin id UUID v4; csrfToken exactly 43 base64url characters; expiresAt 15 minutes after creation; consumedAt nullable until success; no business authority |
| C05 | throttle key composite(kind,key), kind username or IP; blockedUntil and lastSuccessAt nullable; rolling failures timestamped by trusted time; username threshold 5, IP threshold 20, rolling window/block 15 minutes; evidence retained 24 hours subject to active dependencies |
| C06 | system role live uniqueness(accountId,roleCode); seasonal role live uniqueness(accountId,seasonId,roleCode); real Account/Season FKs; roleCode from the approved finite actor-role set, not arbitrary input |
| C07 | shared grant live uniqueness(accountId,masterKind), masterKind club/player/stadium; create-season grant live uniqueness(accountId); grantor Account FK; endedAt/revokedAt nullable until ended; no implicit grant from a role |
| C08 | Season reference code 1-32 and name 1-200 code points, unique normalized code; startDate/endDate date; state Open or Closed; no PHASE 1 creation route or operational seed |
| C09 | delegation case has required season/proposer/recipient FKs; versionNumber positive and unique(caseId,versionNumber); reason at most 2000 code points and non-whitespace when required; startsAt/endsAt nullable in draft, complete at submission except server-resolved immediate start |
| C10 | submitted delegation version immutable in content; explicit immediate/future start choice; exact case/version FK; grant approvedVersionId unique; grant startsAt strictly before endsAt; no overlapping live intervals for the same recipient/operation/season; interval start inclusive and end exclusive |
| C11 | delegation editors unique(versionId,accountId), includes preparer; proposer/recipient/grant recorder are distinct people; recipient has an eligible seasonal role; only the three D019 operation/recipient combinations |
| C12 | audit actorId/objectId/seasonId/requestId nullable where their context requires; actorKind distinguishes account/operator/system; reason at most 2000 code points; before/after JSON follows action allowlists; no password/hash/session/CSRF/storage credential or whole request body |
| C13 | receipt unique(accountId,actionCode,requestKey); requestKey UUID v4; contentDigest SHA-256; expiresAt 24 hours after outcome; responseStatus/responseData nullable until outcome; never credential-bearing inputs or secret responses |
| C14 | SystemGuard key is a pre-created unique technical key; maintenance state is singleton and persisted; delegation boundary uniqueness(grantId,boundaryKind,effectiveAt); processedAt uses actual processing time, not claimed effective time |

## Entity Mapping

| Model / owner | Fields and relationships | Constraints / use |
|---|---|---|
| Account / Identity & Access | personnelCode,fullName,username,passwordHash,state,mustChangePassword,temporaryPasswordExpiresAt?,passwordChangedAt?,authRevision; common ID/revision/timestamps | C01/C02; Active/Locked business state, temporary expiry/restricted-change derived separately; one account/person verified by administrator |
| Session / Identity & Access | accountId FK,tokenHash,csrfToken,accountAuthRevision,createdAt,lastActivityAt,absoluteExpiresAt,revokedAt?,revocationReason? | C03; protected cookie contains raw opaque token only; no auth claims from client |
| PreloginCsrfContext / Identity & Access | id,csrfToken,createdAt,expiresAt,consumedAt? | C04; consume atomically with login success |
| LoginThrottleKey / Identity & Access | kind,key,blockedUntil?,lastSuccessAt? | C05; lock keys deterministically, including missing-key creation races |
| LoginFailure / Identity & Access | id,usernameKey,ipKey,occurredAt | C05; indexes by username/time and IP/time; restricted counter evidence, not business audit |
| SystemRoleAssignment / Identity & Access | accountId,roleCode,grantedBy?,grantedAt,revokedAt? | C06; bootstrap grantor may be absent with operator audit kind |
| Season / Season identity seam | id,code,name,startDate,endDate,state,revision,timestamps | C08; only FK support/test fixture insertion in PHASE 1; later owner retains UC05 |
| SeasonRoleAssignment / Identity & Access | accountId,seasonId,roleCode,grantedBy,grantedAt,revokedAt? | C06; scope does not disappear when calendar dates pass |
| SharedMasterGrant / Identity & Access | accountId,masterKind,grantedBy,grantedAt,endedAt?,endReason? | C07; prerequisite roles checked across seasons; preserve history |
| CreateSeasonGrant / Identity & Access | accountId,grantedBy,grantedAt,revokedAt? | C07; create-only authority, no season role implied |
| DelegationCase / Identity & Access | seasonId,proposerId,recipientId; draft/submitted version pointers where applicable | C09/C10; proposal outcome separate from grant lifecycle |
| DelegationVersion / Identity & Access | caseId,versionNumber,preparedBy,predecessorVersionId?,state,submittedAt?,decidedAt?,decidedBy?,decisionReason?,actionCode,startMode,startsAt?,endsAt?,reason? | C09/C10; startMode derives immediate/future selection; server fills grant instant for immediate start |
| DelegationVersionEditor / Identity & Access | versionId,accountId,firstEditedAt | C11; typed join, no generic universal version editor |
| DelegationGrant / Identity & Access | approvedVersionId,startsAt,endsAt,grantedBy,grantedAt,revokedAt?,revokedBy?,reason? | C10/C11; exact version context; revoked/terminated/expired projection uses recorded lifecycle facts |
| AuditRecord / Audit support | actorId?,actorKind,occurredAt,actionCode,objectKind,objectId?,seasonId?,outcome,reason?,beforeData?,afterData?,requestId? | C12; append in caller transaction, safe metadata projection; generic locator is not a core domain FK replacement |
| CommandReceipt / shared execution | accountId,actionCode,requestKey,contentDigest,outcomeState,responseStatus?,responseData?,expiresAt | C13; same transaction as action/audit, current-access projection on replay |
| SystemGuard / platform | key | C14; bootstrap, last-active-admin and admission guards pre-created by migration |
| MaintenanceState / technical operations | singletonId,closed,operationId?,changedAt | C14; closed admission combined with host durable marker outside restored snapshot; technical support, not a new permission |
| DelegationBoundary / technical security | grantId,boundaryKind,effectiveAt,processedAt,terminationBasis? | C14; effect-start/expiry/revocation/termination processing once; informs grant lifecycle and recipient authRevision; same transaction as audit/revocation |

Nullable columns remain physically nullable until their approved milestone; this does not
authorize a submitted incomplete delegation. Required reasons use the shared 2000-code-point
limit; revocationReason/endReason/decisionReason obey the same D092 scope. Role/action/state
wire codes are mapped once in the contract and must not introduce a seventh business actor.

## State and Consistency Rules

- Account locking leaves assignments/shared grants recorded, prevents all use and invalidates
  sessions. Reset does not unlock. Temporary-credential/change-required state is separate.
- Proposal: Draft -> Pending; Pending -> Returned/Rejected/Granted/Cancelled;
  Returned -> Pending/Cancelled; Draft -> Cancelled. Terminal outcomes do not reopen.
  Resubmission creates a successor version retaining prior content/editors.
- Grant: Scheduled -> Active -> Expired, or Scheduled/Active -> Revoked/Terminated.
  Ended grant never revives; its proposal remains Granted. Process start/end crossed during
  downtime in order without repeatedly invalidating sessions issued after those boundaries.
- Serialize bootstrap/final-admin invariants before account locks. All role/grant/delegation
  changes lock the complete affected accounts, including indirect recipient invalidations.
- Use action-specific audit JSON schemas, not unrestricted snapshots. History cannot be
  deleted to satisfy FK operations. List indexes support actor/time/action/object and
  account/role/season/session expiry; no indiscriminate index on every field.
- Test-only Season rows and direct fixture state preparation are allowed only against
  explicit isolated targets. Do not create operational season/admin defaults or fixture APIs.

## Verification Mapping

US1: C01/C02/C06/C08/C12/C14 and restore/session invalidation.
US2: C01-C05/C12, password-reset/issuance races and exact time boundaries.
US3: C01/C06-C14, person separation, two-season scope, overlap and receipt/final-check races.
US4: C12 plus deterministic list ordering and current object-read projections.
All schema/transaction tests use real PostgreSQL 17; failure-state comparisons use independent
connections. This design mapping does not itself establish execution results; the linked
verification report records the implemented schema/shared-foundation checks and their limits.
