# PHASE 2 REST Contract

**Status**: Contract approved with the Plan on 2026-11-10; no endpoints are implemented by this document.
Apply [D085/D096](../../../context/design/architecture.md#d096---api-execution-synchronized-csrf-and-transaction-contracts)
and owning UC05/06/07/12 authority. Relative paths below are under `/api/v1`.

## Shared request and response rules

- Reuse protected same-origin session cookies, Origin/CSRF checks for mutations, final
  current-access checks and existing error/envelope middleware. No business state change via GET.
- UUIDs are UUID v4 strings; revisions positive decimal strings; version numbers JSON integers.
  Dates YYYY-MM-DD; instants UTC Z. Reject unknown properties, unknown enum values, invalid
  types, duplicate fields/invalid nested structures and oversized JSON using current D096 limits.
- Success: `{data, meta?, requestId}`; list meta contains page/pageSize/total. Defaults page=1,
  pageSize=20, maximum 100. Stable sort ties always include id; reject unsupported filters/sorts.
- Domain conflicts use existing `REVISION_CONFLICT`, `STATE_CONFLICT`, `BASIS_CHANGED`,
  `DUPLICATE_CODE`, `IDEMPOTENCY_KEY_REUSED`. Field errors use 400 INVALID_INPUT or
  VALIDATION_FAILED with safe `{field,code,message}` details; nested fields use explicit paths
  such as `registrationWindows[0].closesAt`. Never expose SQL, secrets or unrelated records.
- 401 missing/expired/session-changed; 403 current authenticated but disallowed; 404 absent/
  non-discoverable; 409 state/revision/basis conflict; 413 excessive file; 415 unsupported image;
  503 maintenance/unresolved technical processing. Business failure is never HTTP 200.
- Critical R operations require Idempotency-Key. Replay checks current access before returning
  the bounded stored outcome; new-state/revision checks happen after replay resolution.
- JSON command acknowledgement is `{id,revision,relatedId?}`. A subsequent authorized GET loads
  a full object. A creation-only actor receives this acknowledgement, not new seasonal read rights.
- Mutating allowlists never include state, decidedBy, preparedBy, editor lists, role/grant
  fields, activationProcessedAt, statisticsRevision, storage paths or arbitrary public flags.

## UC05 - Seasons and lifecycle

| Method/path | Authority and input | Output and final checks |
|---|---|---|
| GET /seasons | Current authorized seasonal read scope; optional search/state, pagination/sort by code/name/startDate/id | Only assigned/permitted season summaries. Create-only authority does not confer unrelated season discovery; existing UC03 minimal season selectors retain their separate administration scope. |
| POST /seasons (R) | Live CreateSeasonGrant; code, name, competitionName, startDate, endDate | 201 minimal id/revision; OPEN, no rules/roles. Normalize before digest; duplicate code 409. No fake expectedRevision or caller entity ID. |
| GET /seasons/{seasonId} | Current target-season read responsibility | Permitted metadata, state, revision, effective/waiting version summaries and permitted action capabilities. |
| PATCH /seasons/{seasonId} | Assigned manager; expectedRevision plus changed name/competitionName/startDate/endDate | OPEN required at final write; immutable code/id rejected; dates/order/history checks; 200 acknowledgement. |
| GET /seasons/{seasonId}/history | Current object-read authority, scoped filters/pagination | D094 permitted actor/action/time/before-after/reason/version references; no audit mutation/export. |
| GET /seasons/{seasonId}/lifecycle-requests | Current seasonal responsibility | Versioned requests with permitted reasons/readiness blockers; not a new summary-report endpoint. |
| POST /seasons/{seasonId}/lifecycle-requests | Assigned manager; action CLOSE/REOPEN, reason | Draft request/version identity; no state transition or implicit readiness. |
| PATCH /season-lifecycle-requests/{requestId}/draft | Assigned preparer; expectedRevision, action/reason while editable | Updated draft or successor version after return/withdrawal; editor history retained. |
| POST /season-lifecycle-requests/{requestId}/{action} | Explicit submit/withdraw/return/reject/approve; expectedRevision, submittedVersionId where applicable, required reason | Approve is R, independent assigned manager/nondelegable. CLOSE binds current valid summary and all readiness gates; REOPEN preserves freezes. No generic status PATCH. |

On CLOSE submission, the server binds the exact current valid confirmed summaryVersionId
and current source basis into the submitted version; the client cannot substitute an unrelated
summary. A draft may exist before readiness, but submission reports missing summary/readiness
instead of manufacturing a basis. Approval must compare the same summary is still current,
valid and based on unchanged sources; otherwise return BASIS_CHANGED and require a revised
successor/resubmission. Never overwrite a submitted summary reference at approval.

`submittedVersionId` is the exact immutable version being decided. The successful lifecycle
acknowledgement does not remove roles or invalidate sessions. Missing confirmed summary or
unavailable later readiness returns 409 STATE_CONFLICT or 503 as appropriate, not a simulated closure.

## UC06 - Regulation content and decisions

| Method/path | Authority/input | Outcome |
|---|---|---|
| GET /seasons/{seasonId}/regulation-versions | Current responsibility-scoped read, state filter/pagination | Safe version summaries, separately labelled current/waiting/draft and effectivity/processing state. |
| POST /seasons/{seasonId}/regulation-versions | Assigned manager or valid D019 delegated preparer; optional predecessorVersionId and draft content | 201 draft/version acknowledgement; never an approved copy from a template. |
| GET /regulation-versions/{versionId} | Current source-season responsibility/allowed preparation access | Exact content, revision, editor exclusion/action capabilities and permitted decision basis. |
| PATCH /regulation-versions/{versionId} | Authorized preparer; expectedRevision, draft content allowlist | Editable draft only. Resuming returned/withdrawn submitted content creates successor content; no approved-content mutation. |
| POST /regulation-versions/{versionId}/{action} | Allowlisted submit/withdraw/return/reject/approve; expectedRevision, submittedVersionId for decisions, required reason | approve is R and independent assigned manager only; full completeness/slot/freeze/compatibility/time checks; 200 acknowledgement. |
| GET /seasons/{seasonId}/regulation-change-requests | Current seasonal responsibility | Cancellation/replacement request summaries with exact waiting/replacement targets. |
| POST /seasons/{seasonId}/regulation-change-requests | Assigned manager; action CANCEL/REPLACE, waitingVersionId, replacementVersionId only for replacement, reason | Versioned request; pending request does not delay activation. |
| PATCH /regulation-change-requests/{requestId}/draft | Assigned preparer; expectedRevision, exact target/replacement/reason allowlist | Draft revision or new successor, never edit approved content. |
| POST /regulation-change-requests/{requestId}/{action} | submit/withdraw/return/reject/approve, exact version/revision/reason | approve is R, independent manager; valid before effectivity only, atomic cancel/replace. |

For action families, the handler separately checks authority to return/reject (assigned
manager), withdraw (authorized preparer of the submitted work) or submit (current preparation
authority); these do not confer approval. D019 delegates preparation/editing, not manager
decision powers. Every submitted-content change retains successor/editor history.

REPLACE also approves the replacement regulation content. Its target must already be exact
immutable SUBMITTED content in the same season, and the approver must be outside the union
of preparers/editors of both the change request and that replacement version. Independence
from the request alone is insufficient; failure preserves the original waiting version.

### Regulation draft content schema

Input scalars: effectiveMode, proposedEffectiveAt, squadLimit, nonHomegrownLimit,
homegrownSeasons, homegrownMonths, homegrownAgeStart, homegrownAgeEnd, u21Cutoff,
clubCount, formatCode, legs, plannedMinutes, preparationMinutes, releaseMinutes,
winPoints, drawPoints, lossPoints, qualificationCount, relegationCount.

Typed child arrays: registrationWindows[{intakeKind,opensAt,closesAt}],
rankingPriority[{position,criterionCode}], goalTypes[{code,name,isOwnGoal,enabled}],
cardTypes[{code,name,meaning,enabled}]. Backend assigns child IDs; edits target only current
draft-owned children. Arrays replace that draft's submitted field as a unit and validate
every nested field; omitted PATCH fields remain unchanged. Unknown child IDs cannot move
content from another version. Draft nulls are allowed only where data-model milestones permit.

All [data-model constraints](../data-model.md#full-regulation-content-and-validation) are
enforced on supplied draft values and as a complete set at submission/approval. No caller
chooses arbitrary rule formulas. SCHEDULED requires a future instant at final decision;
an instant already reached is a conflict, not automatic IMMEDIATE conversion.

### Read-time due activation

GET itself is not an activation command. Before reading an effective basis, the protected
query orchestration may invoke the separately admitted owning due-work processor (also used
by startup/timer), then acquire its normal current-scope/read boundary and recheck basis.
If a due boundary is reached during that processing, retry bounded basis resolution or return
503; never label stale content current. No caller can select a version or override trusted time.
Mutation orchestration performs its final due check in the caller-owned season transaction.

## UC07/UC12 - Shared masters and D099

| Method/path | Input/authority | Outcome |
|---|---|---|
| GET /clubs; GET /stadiums | Corresponding shared/master-read responsibility; search, availability ACTIVE/DISCONTINUED/ALL, pagination; sort name/code/id | Management list can retain discontinued records. New-use selector calls filter ACTIVE; the final owning command still rechecks. |
| POST /clubs; POST /stadiums | Corresponding live shared grant; Club code/name/abbreviation; Stadium code/name/location?; duplicateReview? | 201 id/revision; no seasonal application. Stable normalized code conflicts always fail. |
| GET /clubs/{clubId}; GET /stadiums/{stadiumId} | Current object-read responsibility | Master/revision/current availability, permitted logo application URL, safe capabilities. |
| PATCH /clubs/{clubId}; PATCH /stadiums/{stadiumId} | Matching shared grant; expectedRevision, editable name/abbreviation or name/location, correctionReason/correctionBasis where correcting source information | Preserve identity/references/snapshots; identify affected work; no indirect match/registration edits. |
| POST /clubs/{clubId}/{discontinue,resume}; POST /stadiums/{stadiumId}/{discontinue,resume} | Matching shared grant; expectedRevision, nonempty reason | Exact explicit action; state/revision conflict rejects repeats. Authority, trusted recording instant, marker/revision and required audit commit together. |
| GET /clubs/{clubId}/history; GET /stadiums/{stadiumId}/history | Corresponding current object-read authority | Searchable bounded D094 before/after and complete D099 cycles; no unredacted global audit grant. |

`duplicateReview` is `{acknowledged:true,candidateIds,reason}` for a genuinely distinct entity.
If matching names exist without a current acknowledgement, return 409 BASIS_CHANGED with
permitted candidate labels and the warning, not a successful save. Recheck the candidate set
at final recording; changed candidates require fresh review. This reserves no identity and
never permits duplicate codes or automatic merging. No separate preview workflow is added.

### Logos

- POST /clubs/{clubId}/logo: matching shared Club grant, bounded multipart containing exactly
  file and expectedRevision. Only one file; actual content checks and normalized storage.
  No arbitrary URL/path/provider fields. Browser lets FormData set its own Content-Type boundary.
- POST /clubs/{clubId}/logo/remove: JSON expectedRevision and current mediaAssetId. Final
  pointer must match; removal records old/new references and returns acknowledgement.
- GET /media/{assetId}: successful file bytes only if asset is still current and the caller
  has current public/profile-read scope; `Cache-Control: no-store`, actual normalized MIME.
  Missing/non-discoverable/non-current assets return safe 404; authorized content outage may
  return 503. JSON failures retain envelope/filtering. Possession of assetId grants no access.
- No public football lookup is built here. Missing/unavailable public eligibility is never
  treated as public: only permitted internal profile-read delivery remains possible.

Logo commands use revision/reference checks; do not automatically retry an unknown upload
outcome with a fresh body. Reload current master/reference and let the user resolve it. If
the same old revision is resubmitted after a successful switch it conflicts rather than
duplicating the reference. No unsafe image payload is stored in command receipts.

## Capabilities, transport and audit integration

Extend the existing session/capability projection with canCreateSeason, matching shared-grant
kinds and current seasonal/direct/delegated preparation actions needed for menus. Capabilities
contain no secrets and remain hints; backend rechecks every operation. Preserve PHASE 1
response compatibility and account-epoch isolation.

Add a FormData mode to the existing HTTP client and validated field-error details, preserving
same-origin credentials, CSRF and unknown-outcome behavior. Add an explicit successful
file-response exemption to the response interceptor, not a global envelope bypass.

UC04 remains administrator metadata search. New business history routes authorize their own
object payloads. Existing admin history must continue to hide business payload/reasons unless
the viewer also has that object's current read authority. No audit export, bulk data exchange,
generic permissions CRUD or activation-over-HTTP operator bypass is introduced.
