# PHASE 2 Data Model

**Status**: Implementation mapping approved with the Plan on 2026-11-10; no schema/migration has run.
Normative owners: [D095 dictionary](../../context/design/architecture.md#detailed-relational-dictionary),
[D092/D099](../../context/business.md), [season regulations](../../context/use-cases/registration.md#current-confirmed-rules).
This document fixes physical-contract details needed for Tasks without replacing policy.

## Common representation and migration rules

- New entity IDs: backend UUID v4; SQL uuid. Existing IDs/codes/references never change.
- Mutable aggregate revision: bigint > 0, starting 1; transmitted as decimal string. Business
  versionNumber: integer > 0, unique within its case; not interchangeable with revision.
- createdAt/updatedAt and instants: timestamptz; wire UTC ISO-8601 ending Z. Calendar dates:
  date, wire YYYY-MM-DD. User entry/display: Asia/Ho_Chi_Minh.
- Code: normalized uppercase ASCII `[A-Z0-9][A-Z0-9_-]{0,31}`, unique per entity group,
  immutable/non-reusable, supplied explicitly; leading zeros survive. Name normalization:
  NFC, trim/collapse single-line whitespace, preserve accents/case/punctuation. Count Unicode
  code points; reject overlength, never truncate. Duplicate-name comparison ignores case,
  retains accents and is a review warning rather than a UNIQUE key.
- Shared bounds: code 1-32; season/club/stadium names 1-200; club abbreviation 1-20;
  stadium location <=500; reason/basis/notes <=2,000. Required text is non-whitespace.
  competitionName uses the existing dictionary T(200) requirement.
- Version envelope: caseId, versionNumber, preparedBy, state, submittedAt?, decidedAt?,
  decidedBy?, decisionReason?, predecessorVersionId?, revision, createdAt. Typed Editor joins:
  PK(versionId,accountId), firstEditedAt; include the preparer and every editor permanently.
- Composite unique(caseId,id) and same-case predecessor/current pointers; same-season targets
  checked using scoped FKs where expressible plus final transaction checks otherwise.
- Restrict/NoAction protects masters/accounts/submitted/accepted history. No master-delete
  route, blanket cascade or history nulling. Controlled draft-child replacement affects only
  the editable draft, never predecessor snapshots or submitted children.
- SQL CHECK handles local type/range/state/shape constraints; quotas, editor exclusion,
  availability, interval overlap and source readiness run under owning ordered transactions.
  Explicit SQL migrations add partial UNIQUE/CHECK constraints Prisma cannot represent directly.

## Season and regulation families

| Model | Fields and relationships | Constraints/milestone |
|---|---|---|
| Season (extend existing) | Existing id/code/name/startDate/endDate/state/revision/timestamps; add competitionName, currentRegulationVersionId?, statisticsRevision bigint | startDate <= endDate; state OPEN/CLOSED; statisticsRevision initially 0 for a new season. Current pointer belongs to this season. No implicit role or effective version. Metadata writes require OPEN under FR-005. |
| RegulationCase | id, seasonId, revision/timestamps, optional currentDraftVersionId | UNIQUE seasonId; exactly one regulation case per season. |
| RegulationVersion | Version envelope; effectiveMode IMMEDIATE/SCHEDULED, proposedEffectiveAt?, approvedAt?, activationProcessedAt?, activeFrom?, activeUntil?; scalar content below | SCHEDULED requires proposedEffectiveAt before submit; IMMEDIATE has no caller-selected effective instant. Content immutable after submission; decisions/activation update processing fields only. UNIQUE(caseId,versionNumber). |
| RegulationVersionEditor | Typed editor join to RegulationVersion/Account | Include every content preparer/editor; no deletion to evade approval separation. |
| RankingPriority | regulationVersionId, position integer, criterionCode | PK(version,position), UNIQUE(version,criterionCode), positive contiguous positions; exactly POINTS/GOAL_DIFFERENCE/GOALS_FOR in configured priority order at submission. D070/D071 consequential season-end resolution is not another configurable formula. |
| RegistrationWindow | id, regulationVersionId, intakeKind CLUB_APPLICATION/PLAYER_CHANGE, opensAt, closesAt | opensAt < closesAt; half-open; no overlap within version/group. Adjacent windows allowed; different groups may overlap. |
| GoalType | id, regulationVersionId, code, name, isOwnGoal boolean, enabled boolean | UNIQUE(version,code); code/name required on submit, code <=32/name <=200 as bounded DTO/column mapping. Preserve referenced code and interpretation across successor versions. Baseline A ordinary/B penalty/C own goal/D direct free kick; new labels never add formulas. |
| CardType | id, regulationVersionId, code, name, meaning YELLOW/RED, enabled boolean | UNIQUE(version,code); bounded code/name as GoalType. Referenced meaning cannot change; no suspension calculation. |
| RegulationChangeRequest | id, seasonId, state, revision/timestamps | Typed cancellation/replacement case, not generic status patch. |
| RegulationChangeVersion | Envelope; waitingVersionId, replacementVersionId?, action CANCEL/REPLACE, reason? | Same season; replacement required only for REPLACE and must be exact immutable SUBMITTED content. Submission requires reason/targets. Approval before effectivity excludes the union of request and replacement preparers/editors; pair effects atomic. |
| RegulationChangeVersionEditor | Typed editor join | Same permanent preparer/editor exclusion. |
| SeasonLifecycleRequest | id, seasonId, revision/timestamps | Own close/reopen case; exact pending version read under season lock. |
| SeasonLifecycleVersion | Envelope; action CLOSE/REOPEN, reason?, summaryVersionId? | Submission requires reason; CLOSE submission server-binds the exact current valid confirmed summary and its immutable basis in the same season. Approval rejects changed current summary/basis rather than replacing the submitted FK. REOPEN is distinct, never date-derived. |
| SeasonLifecycleVersionEditor | Typed editor join | Independent nondelegable assigned-manager approval. |

### Full regulation content and validation

Payload is typed columns/child rows, never a generic JSON rules document. Draft fields may be
null where incomplete; submission/approval requires all applicable groups. JSON PATCH of an
approved version is never allowed.

| Content group | Columns/contract | Validation |
|---|---|---|
| Registration limits | squadLimit, nonHomegrownLimit integer | Nonnegative counts; source initial values 25/17 shown as editable proposed defaults, not effective rules without approval. |
| Homegrown | homegrownSeasons, homegrownMonths, homegrownAgeStart, homegrownAgeEnd integer | Positive qualifying thresholds, ordered age bounds. The seasons OR months qualification branches remain distinct; no automatic conversion/training-history engine. Source defaults 3 seasons/36 months; actual seasonal age range explicit. |
| U21 | u21Cutoff date | Explicit full valid calendar date at submission; no inferred cutoff/age-today rule. |
| Intake | RegistrationWindow children | Explicit separate calendar groups; do not silently infer outside-season containment from season dates (approved test intake begins before startDate). |
| Structure | clubCount, legs integer; formatCode DOUBLE_ROUND_ROBIN | Even count 4..20, two legs. formatCode is an explicit bounded representation of the only supported format, not an extension point for unimplemented algorithms. |
| Planning | plannedMinutes, preparationMinutes, releaseMinutes integer | Duration >0; buffers >=0; explicit seasonal values. Structure and all three parameters freeze at initial schedule approval. |
| Points/ranking | winPoints, drawPoints, lossPoints integer; RankingPriority children | win > draw > loss; unique complete configured main-criteria order. Do not invent a source-unsupported points floor. Freeze at first Official Result. |
| Position groups | qualificationCount Q, relegationCount R integer | Q >=0, R >=0, R < N, Q+R <= N; Q explicit; default R=3 only for N=20, otherwise explicit. Freeze both at first Official Result. |
| Catalogs | GoalType/CardType children | Complete selected seasonal catalogs, stable referenced interpretation and enabled selection flags; newly effective catalogs do not rewrite event bases. |

Local scalar checks on nullable draft fields apply only when supplied; cross-field completeness
is checked at submission and again at approval/effectivity. For example, an omitted U21 cutoff
is allowed in a draft but never filled with a fabricated date to pass NOT NULL.

### Regulation states and pointer invariants

Technical state codes: DRAFT, SUBMITTED, RETURNED, WITHDRAWN, REJECTED, APPROVED_WAITING,
EFFECTIVE, SUPERSEDED, CANCELLED, ACTIVATION_BLOCKED. These map existing business states;
they introduce no approval or reopening route.

- DRAFT -> SUBMITTED; SUBMITTED -> RETURNED/REJECTED/WITHDRAWN or valid approval.
  Edits after return/withdrawal use a new DRAFT version; old submitted content is retained.
- Approval -> EFFECTIVE for immediate, otherwise APPROVED_WAITING. Approval records immutable
  reviewed content and its instant; activationProcessedAt differs from effective time on catch-up.
- APPROVED_WAITING -> EFFECTIVE/CANCELLED/ACTIVATION_BLOCKED through the permitted operations;
  failure of infrastructure is rollback, not another business-terminal state.
- EFFECTIVE -> SUPERSEDED when a successor takes effect. Set activeUntil to successor's
  approved effective instant; preserve [activeFrom,activeUntil) interpretation. Equality of
  consecutive recorded instants may leave an empty historical interval, never invented time.
- Partial UNIQUE(caseId) WHERE state=APPROVED_WAITING and a separate EFFECTIVE unique guard
  supplement the season lock. Index waiting proposedEffectiveAt for due scans. Do not put a
  moving clock predicate in an index or use highest versionNumber as the effective pointer.
- Approval/replacement/activation checks use current protected facts under shared coordination;
  blocked/cancelled/rejected/superseded content cannot be edited or silently revived.

Request-family state codes are DRAFT/SUBMITTED/RETURNED/WITHDRAWN/REJECTED/APPROVED.
Their action checks, not a generic enum update, establish effects; a due cancellation target
causes STATE_CONFLICT and requires a fresh regulation workflow.

## Club, Stadium and media

| Model | Fields | Integrity and use |
|---|---|---|
| Club | id/code/name/abbreviation, discontinuedAt?, currentLogoId?, revision/timestamps | Unique immutable code; non-unique name search. Current image belongs to the same club using a scoped Club/MediaAsset pair constraint. No seasonal coach/representative columns. |
| Stadium | id/code/name, location?, discontinuedAt?, revision/timestamps | Unique immutable code; preserve schedule references. No capacity field required. |
| MediaAsset | id, clubId, provider LOCAL, objectKey, mimeType, byteSize, width, height, checksum, storedBy, unreferencedAt?, contentDeletedAt?, createdAt | Club/Account actual FKs; UNIQUE(provider,objectKey) and UNIQUE(clubId,id). Stored normalized static content obeys LOGO-01; never store paths or credentials in client projections. |

MediaAsset implements Club ownership in this Phase; Player ownership is added with a real
Player FK by the owning Phase, not an unvalidated UUID or fake Player table now. This is the
applicable subset of D095, preserving the future exactly-one-owner constraint when extended.
provider is an internal allowlisted storage-profile discriminator, not arbitrary request input.

D099 availability is derived from discontinuedAt=null versus non-null. Discontinue writes the
current recording instant; resume clears the current marker. Required audit stores every
cycle/reason/operator/before-after. Never infer history from a single marker or delete an old
transition. Parent revision protects metadata, availability and current-logo switches together.

On replace/remove, old asset unreferencedAt is set at the successful reference switch. Cleanup
retains metadata and marks contentDeletedAt only after verified content deletion. SQL rollback
after storing a new immutable file leaves an orphan; the cleanup inventory records its first
observed unreferenced time and waits >=24 hours, never treating upload age alone as sufficient.
See [media/recovery](contracts/media-recovery.md) for filesystem coordination.

## Schema-only summary dependency targets

Use D095's actual SeasonSummaryCase, SeasonSummaryVersion and SeasonSummaryVersionEditor,
not a new readiness engine or shadow table. Case: seasonId UNIQUE, currentConfirmedVersionId?,
needsReconfirmation; Version: common envelope plus basisStatisticsRevision?, sourceSnapshot?,
reportDate?; editor join as above. Exact same-case pointer/predecessor checks and Season/Account
FKs apply. CLOSE summaryVersionId is scoped to the lifecycle's season via case/season checks.

No authoring, confirmation, report generation, export or public UI is implemented. Production
empty/current-unconfirmed source means not ready. Guarded fixtures can insert valid typed
evidence to exercise real PHASE 2 closure; future PHASE 7 adopts these tables and owns full
snapshot validation/current-source readiness. Test providers cannot be registered operationally.

## Audit and command receipts

Retain current AuditRecord/CommandReceipt tables and protected history; add per-action typed
policies, not arbitrary payload fields. Scalar changes use bounded before/after values;
regulation decisions additionally identify immutable version IDs so exact structured content
can be inspected through authorized version/history lookup. An unrestricted serialized full
regulation request does not belong in the scalar audit allowlist.

Creation gets an action-specific intent schema with no fake expectedRevision; generated entity
UUID is stored once in the receipt outcome. Existing-update intents carry revision and exact
version/action targets. See [execution](contracts/execution.md#command-receipts).

## Migration and indexes

1. Expand current Season with nullable competitionName and optional new references; initialize
   new technical counters. Preserve current code/date/state/revision constraints and all FKs.
2. Validate an explicit existing-row competition-name mapping from recorded season context;
   do not infer from a season code. Missing mapping blocks operational migration completion,
   not Plan preparation. Existing isolated fixture tools may supply their declared test value.
3. Create owning PHASE 2 tables and schema-only summary targets, then scoped pointers/constraints;
   finalize competitionName NOT NULL only after the verified backfill. Seed no effective regulations.
4. Add FK indexes, case/version-number and state/time indexes, deterministic name/id list indexes,
   media club/unreferenced timestamps. Keep name suspicion indexes non-unique. No new extension.
5. Upgrade backup/schema-version inventory and restore checks in the same deployment change;
   migration must not strand the inherited recovery path. Verify fresh and populated foundation
   databases; compare identifiers/roles/delegations/audit through an independent connection.

No migration SQL, ORM implementation or test suite is generated by this design document.
