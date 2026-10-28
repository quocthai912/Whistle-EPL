# PHASE 1 REST and Browser Contract

**Status**: Planned interface, not controllers or a running API.
Derives D085/D096 and the [administration owner](../../../context/use-cases/administration.md).
Use [spec.md](../spec.md) for required behavior and [data-model.md](../data-model.md) C01-C14
for field constraints. Exact routes below elaborate existing authority, not new permissions.

## Shared Transport

Base path /api/v1; JSON UTF-8/camelCase. UUIDs are strings, revisions positive decimal strings,
instants ISO 8601 UTC ending Z, calendar dates YYYY-MM-DD. Business display is Vietnam time.
Success: data, optional meta and requestId; failure: error containing code/message/optional
safe details, plus requestId. No SQL, stack, credential hash or reusable token in errors.

All bodies have per-operation allowlists and reject unknown keys, non-object bodies and
incorrect types without silent coercion. Actor, timestamps, authRevision, granted authority
and processing outcome are server-owned. Reject path/body identity mismatch. No generic
status PATCH, arbitrary role string, payload-to-model binding or mass assignment.

POST/PATCH browser mutations require exact Origin, or origin extracted from Referer if
Origin is absent; neither valid basis means rejection. Require X-CSRF-Token matching the
live session or prelogin context for login. SameSite is additional protection, not a bypass.
GET reads do not mutate business data; permitted session activity/CSRF state is explicit.

Use __Host-whistle-session and __Host-whistle-csrf-context cookies under HTTPS: HttpOnly,
Secure, SameSite=Lax, Path=/ and no Domain. Session raw token is 32 random bytes encoded
base64url, returned only by Set-Cookie; persist SHA-256 lowercase hex. CSRF is a separate
32-byte value returned by the dedicated no-store bootstrap. A session's CSRF stays stable
across tabs. Non-HTTPS development uses an explicitly separate cookie/profile and cannot
claim HTTPS acceptance. Authentication/administration/audit responses are no-store.

## Authentication

| Method/path | Exact input allowlist | Authority / output |
|---|---|---|
| GET /auth/csrf | No body | Reuse a valid authenticated context or an unexpired 15-minute prelogin context; when no valid context exists, including after prelogin expiry, create a new 15-minute prelogin context and set its cookie; data.csrfToken only, no business authority or reusable session token |
| POST /auth/login | username,password | Valid prelogin CSRF/origin; generic failure, persistent counters, current state; create fresh session and consume prelogin context; permitted account metadata/changeRequired only |
| GET /auth/session | No body | Live restricted/full session; own account id/personnelCode/fullName/username/changeRequired and permitted role/grant/season metadata; no security internals |
| POST /auth/password/change | currentPassword,newPassword | Current restricted/full session; verify current credential and new C02 rules; invalidate all sessions, clear cookie; no credential receipt |
| POST /auth/logout | No body | Current session and CSRF/origin; invalidate current session, clear cookie and return acknowledgement; invalid/expired uses shared 401 feedback |

The approved generic-login failure is used for wrong/unknown/locked/expired temporary
credentials. Missing/invalid field errors may identify safe fields. Throttling returns 429
with a safe retry indication without account-existence information. Counters use trusted
source IP, never untrusted forwarding headers. Hash verification and subsequent issuance
must recheck their current credential/authRevision basis to defeat reset/issuance races.

## Accounts and Separate Rights

Except current-user auth operations, these endpoints require a current full System
Administrator session. A business role or restricted password-change session is insufficient.
All mutations apply CSRF/origin, ordered final authority/revision and required atomic audit.

| Method/path | Input allowlist | Receipt and additional gates |
|---|---|---|
| GET /accounts | Query page,pageSize,search,state,sort | No receipt; allowlisted username/personnel/fullName search; safe list projection |
| POST /accounts | personnelCode,fullName,username,temporaryPassword | No secret-bearing receipt; verified personal identity, unique C01; initial ordinary staff account, administrator role granted separately |
| PATCH /accounts/{accountId} | fullName,expectedRevision | No receipt; stable personnel identity preserved; username/code changes are not exposed by this initial mapping |
| POST /accounts/{accountId}/lock | expectedRevision | Critical receipt; self-lock/last-active-admin checks, terminate affected delegations and invalidate sessions |
| POST /accounts/{accountId}/unlock | expectedRevision | Critical receipt; no session/grant revival; unlocking does not reset password |
| POST /accounts/{accountId}/reset-password | temporaryPassword,expectedRevision | No secret-bearing receipt; not unlock; temporary expiry/change-required and all-session invalidation |
| POST /accounts/{accountId}/system-role-assignments | roleCode,expectedRevision | Critical receipt; only SYSTEM_ADMINISTRATOR; preserve last-admin/self-removal invariants |
| POST /accounts/{accountId}/system-role-assignments/{assignmentId}/revoke | expectedRevision | Critical receipt; assignment must belong to target; no self-removal/final-admin loss |
| POST /accounts/{accountId}/role-assignments | seasonId,roleCode,expectedRevision | Critical receipt; no self-expansion; roleCode is one of four seasonal business roles |
| POST /accounts/{accountId}/role-assignments/{assignmentId}/revoke | expectedRevision | Critical receipt; target/season checks; shared-grant/delegation dependency termination |
| POST /accounts/{accountId}/permission-grants | kind,expectedRevision | Critical receipt; kind is CLUB_MASTER/STADIUM_MASTER/PLAYER_MASTER/CREATE_SEASON; prerequisites and no self-grant |
| POST /accounts/{accountId}/permission-grants/{grantId}/revoke | kind,expectedRevision | Critical receipt; matching typed grant/target; self-reduction allowed; preserve history |

Business role wire codes: SEASON_MANAGER, REGISTRATION_OFFICER, SCHEDULING_OFFICER,
RESULTS_OFFICER. Public Viewer is not an assignable internal role. These spellings map the
approved actors; they do not add a role. Grant views return only safe identifiers/scope/state
needed to administer rights, not unrestricted later-Phase object details.

The data/permission contracts do not confer internal season access to an administrator.
No seasons, clubs, players, regulations or results business route is exposed by this Phase.

## Delegation

Use operation codes PREPARE_REGULATION_CHANGE, APPROVE_SCHEDULE_ADJUSTMENT,
PREPARE_OFFICIAL_RESULT_CORRECTION only. Eligibility follows D019 exactly; retained manager
approvals are never enabled by a new code. This operates the authority request, not later
business content. Expected revisions bind the edited case/current submitted version.

| Method/path | Input allowlist | Authority / effects |
|---|---|---|
| GET /delegation-proposals | page,pageSize,seasonId,state,sort | Full administrator for administration metadata, or direct manager for own authorized season proposals; safe projection only |
| POST /delegation-proposals | seasonId,recipientId,actionCode,startMode,startsAt,endsAt,reason | Direct Season Manager; proposer from session; startMode IMMEDIATE or SCHEDULED; startsAt forbidden for IMMEDIATE |
| PATCH /delegation-proposals/{caseId} | recipientId,actionCode,startMode,startsAt,endsAt,reason,expectedRevision | Proposer, own Draft; on Returned create editable successor before resubmission, preserve previous content/editor history |
| POST /delegation-proposals/{caseId}/submit | versionId,expectedRevision | Proposer; validate C09-C11 and lock submitted content; Pending only after successful validation |
| POST /delegation-proposals/{caseId}/cancel | versionId,expectedRevision | Proposer in Draft/Pending/Returned; preserve history |
| POST /delegation-proposals/{caseId}/grant | versionId,expectedRevision | Administrator; critical receipt; exact Pending version, three-person separation, current eligibility/no overlap; invalid validation leaves Pending |
| POST /delegation-proposals/{caseId}/return | versionId,reason,expectedRevision | Administrator, Pending; reason required, preserved processing history |
| POST /delegation-proposals/{caseId}/reject | versionId,reason,expectedRevision | Administrator, Pending; reason required, terminal rejection |
| GET /delegation-grants | page,pageSize,seasonId,recipientId,state,sort | Same authorized administration/proposer scope, current metadata only |
| POST /delegation-grants/{grantId}/revoke | reason,expectedRevision | Administrator; critical receipt; no prior proposer approval, end authority/invalidate recipient sessions atomically |

Grant processing fills immediate startsAt using the successful recording instant and never
edits submitted parameters. No PATCH of a granted delegation. Draft nullable fields cannot
leak into a grant. End, revoke and eligibility-loss facts remain distinct from proposal outcome.

## Audit and Lists

GET /audit-logs permits only System Administrators. Query allowlist:
page,pageSize,actorId,occurredFrom,occurredBefore,actionCode,objectKind,objectId,sort.
Time bounds are [occurredFrom,occurredBefore); reject invalid/reversed ranges and filters.
Use default 20/maximum 100 and total count. Default ordering is occurredAt descending then
id ascending; account lists use createdAt descending then id ascending. Sort fields are
explicitly allowlisted and unchanged datasets have no page omission/duplication.

UC04 data contains actor/operator identity, time, action, object locator, outcome, safe reason
and permitted change summary. General metadata does not expose contact/homegrown/internal
profile payloads. No first-version audit detail/export/edit/delete route is added; later
object-specific history uses that owner's current read authority.

## Revisions, Receipts and Failures

Critical receipt-marked commands use Idempotency-Key UUID v4. Digest binds the validated
normalized operation/target/payload and expected revision; header secrets and credential
fields never enter receipts. Matching replay first rechecks current access, recovers its
recorded outcome with a safe projection and does not reject merely because that successful
command advanced revision. Same key with changed intent is conflict. Resolve uncertain commit
outcomes/unique contenders before another execution; retain outcomes for 24 hours.

| HTTP | Stable code family | User/client behavior |
|---|---|---|
| 200/201 | Success envelope | Acknowledge or show created safe object |
| 400 | INVALID_INPUT / VALIDATION_FAILED | Correct allowlisted fields, preserve safe input |
| 401 | AUTH_REQUIRED / SESSION_EXPIRED / PERMISSION_CHANGED | Clear internal state and require login; no automatic write replay |
| 403 | ACCESS_DENIED / CSRF_INVALID / ORIGIN_REJECTED | Deny without restricted content |
| 404 | NOT_FOUND | Absent or not discoverable under the same policy |
| 409 | REVISION_CONFLICT / STATE_CONFLICT / BASIS_CHANGED / DUPLICATE_CODE / IDEMPOTENCY_KEY_REUSED | Reload/review exact current basis; no silent overwrite |
| 429 | LOGIN_THROTTLED | Safe retry indication; do not reveal account existence |
| 500 | INTERNAL_ERROR | Safe error/requestId; no partial business state |
| 503 | TEMPORARILY_UNAVAILABLE / MAINTENANCE / TRANSACTION_UNAVAILABLE | Preserve intent and resolve unknown outcome before another attempt |

413/415 remain reserved by D096 for later file features, not a reason to add PHASE 1 uploads.
Reject unsupported methods/actions without dispatching unrestricted handlers.

## Browser Routes and Verification

Planned browser paths: /login, /change-password, /admin/accounts, /admin/delegations,
/admin/audit and a permitted internal landing shell. Manager delegation views reuse the
appropriate authority without exposing account administration. No fake public league dashboard.
Use one Fetch layer and clear all internal in-memory data on session/account loss. Forms
never retain passwords in recovery drafts; safe fields survive validation/conflict feedback.

Contract checks cover each allowlist, restricted/full/no session, wrong scope, forged actor,
unknown state/action, exact CSRF/origin behavior, secret redaction, conflict/replay, actual
Chrome/Edge paths and atomic rollback after required audit failure. No contract check is
claimed executed by this document.
