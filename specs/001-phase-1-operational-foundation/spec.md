# Feature Specification: PHASE 1 — Operational Foundation and Access Administration

**Feature Branch**: `spec/phase-1-operational-foundation`

**Created**: 2026-10-28

**Status**: Approved by the Team Leader on 2026-10-28 (Asia/Bangkok)

**Implementation tracking (2026-10-29)**: T001–T014 are implemented, verified and published
at `892f172f9ec539d5789a31a2f8046480afe15772`; T015–T048 and full acceptance remain pending.
[tasks.md](tasks.md) owns Task completion; the [Phase ledger](../../context/progress-checker.md#phase-1-execution-evidence---2026-10-29)
records PHASE 1 as `IN_PROGRESS`. This status note does not amend the approved requirements.

**Approval evidence**: The Team Leader selected “Phê duyệt Spec, tiếp tục Plan/Tasks/Analyze”
after the Specification and requirements-quality checklist were made available for review.
This approves Specification preparation for planning, not implementation or future Tasks.

**Input**: Create the integrated PHASE 1 specification from the approved Context, ADRs and
ratified Constitution on the existing branch, then follow the project process for Task Issues.

**Baseline**: Repository commit `e3c3c81d4782ae57443af3249b6a119a8e34f4f3`, identical to
development when inspected. [Constitution v1.0.0](../../.specify/memory/constitution.md)
is ratified. This document is not evidence that application functionality exists.

## Context and Scope

PHASE 1 establishes a runnable web foundation, UC01-UC04, administrator bootstrap/recovery,
account and authority administration, session security, searchable audit, and foundation
operations/verification. It enables subsequent business Phases without implementing them.

The [Phase ledger](../../context/progress-checker.md#phase-1-specification-readiness-and-foundation-verification)
owns the Phase boundary. The [approved decision index](../../context/design/README.md#confirmed-decisions)
routes normative owners. This specification translates approved rules into observable outcomes;
its source references do not create alternative current policy.

### Actors and authority boundaries

- **Internal staff member**: one personal internal account, potentially carrying several
  business roles and distinct scopes.
- **System Administrator**: system account/authority administration and UC04 metadata search;
  this status does not confer seasonal business authority or unrestricted payload access.
- **Organizing Committee / Season Manager**: direct authority in assigned seasons and
  delegation proposal authority under the approved rules.
- **Registration Officer, Scheduling Officer, Results Officer**: assigned-season business
  responsibilities, with only approved separately granted or delegated additional authority.
- **Public Viewer**: no account is needed for published public information; internal
  administration and audit are never public.
- **Server operator**: operational execution context for installation/recovery; not a new
  business actor, public account registration path or browser permission.

### Out of scope

No season/regulation management workflows, club/player master workflows or media upload/delivery,
registration, scheduling, results/statistics, public league lookup/dashboard, reports, news,
XLSX exchange, external football APIs or Live Score are delivered here. Administering rights
used by later Phases does not implement the business operations those rights authorize.

PHASE 1 proves foundation backup/restore with available data. Full-season database/media
recovery and complete BM-07 system acceptance remain PHASE 10. Later media and regulation
jobs are verified in their owning Phases. No new provider, paid service, default operational
season, approval bypass, universal TDD mandate or human-review merge gate is introduced.

## User Scenarios & Testing *(mandatory)*

All four stories are mandatory for PHASE 1 acceptance. Priorities express delivery order,
not permission to omit audit or other safety controls from an otherwise delivered story.
Independent tests may use approved isolated fixtures and already established shared controls.

### User Story 1 - Establish and Recover the Foundation (Priority: P1)

As a server operator, I can install a fresh environment, initialize the first administrator,
verify protected access, and recover the available foundation data without default credentials
or public recovery entry points.

**Why this priority**: Staff cannot safely use any internal function without a working,
repeatable installation and a recoverable administrator access path.

**Independent Test**: Starting from an isolated empty environment and documented prerequisites,
complete installation, bootstrap one administrator, perform the required first-login change,
restart/replace the application, and restore a controlled foundation backup. Verify durable
data, fresh-login requirements and refusal of unsafe bootstrap/recovery attempts.

**Acceptance Scenarios**:

1. **Given** a clean supported environment, **When** the operator follows the documented
   installation procedure, **Then** the browser application starts, required services are
   checked, protected communication works, and no operational test accounts are silently added.
2. **Given** no administrator exists, **When** two bootstrap executions race,
   **Then** at most one administrator is initialized, with identity, secure credentials
   and audit recorded consistently and no seasonal business authority added.
3. **Given** an administrator exists even if locked, **When** bootstrap is attempted,
   **Then** it refuses to create, reset or supplement administrator accounts.
4. **Given** an existing administrator needs recovery, **When** the authorized operator
   supplies a reason and secure replacement credential and/or requests unlock,
   **Then** only the permitted recovery effects occur, previous sessions are invalid,
   and the operator identity and outcome are recorded without credentials.
5. **Given** a valid foundation backup, **When** the operator restores it in a separate
   environment, **Then** the data and relationships match its declared backup point,
   restored sessions cannot be reused, and only verified recovery permits reopening writes.
6. **Given** a failed, incomplete or overlapping backup or interrupted restore,
   **When** the operation fails, **Then** no failed set is published as valid,
   prior valid sets remain protected, failure is visible, and unsafe writes do not resume.

---

### User Story 2 - Authenticate and Control My Sessions (Priority: P1)

As an internal staff member, I can log in, complete required password changes, use only
my current access, and log out, while expired or revoked sessions cannot be reused.

**Why this priority**: Every internal operation depends on the user's current identity
and authority; invalid authentication must never establish business access.

**Independent Test**: With synthetic active, locked, temporary-credential and non-existent
identities, exercise login, restricted first login, personal password change, concurrent
sessions, logout, expiry and permission-triggered revocation, without requiring later business UCs.

**Acceptance Scenarios**:

1. **Given** valid personal credentials for an active account, **When** login succeeds,
   **Then** a fresh session is established, a login event is recorded, and only current
   permitted navigation and account information are shown.
2. **Given** wrong, unknown, locked or expired temporary credentials,
   **When** login is attempted, **Then** business access is denied without revealing
   whether the username exists or creating a valid logged-in state on processing failure.
3. **Given** an unexpired temporary password, **When** the user first logs in,
   **Then** access is restricted to required credential-change/logout steps;
   completing the change invalidates every existing session and requires a new login.
4. **Given** sessions in two browsers, **When** the user logs out in one,
   **Then** that session is unusable and its browser returns to an unauthenticated state,
   while the other remains subject to its own validity.
5. **Given** 30 minutes without a valid internal request or 8 hours since login,
   **When** the session is used, **Then** access is denied even before cleanup runs.
6. **Given** a role/grant/account change invalidated the user's sessions,
   **When** an old session is next used, **Then** the approved Vietnamese re-login notice
   appears, internal client data is cleared, and no pending mutation is automatically replayed.
7. **Given** missing, forged or wrong-origin request protection,
   **When** a state-changing request including login/logout is submitted,
   **Then** it is rejected without the intended state change.
8. **Given** repeated login failures at a username or source address,
   **When** the approved rolling-window threshold is reached,
   **Then** the temporary block survives restart and applies consistently under concurrency,
   without converting the account to administrator-managed Locked state.

---

### User Story 3 - Administer Accounts and Scoped Authority (Priority: P1)

As a System Administrator, I can manage personal accounts and explicitly assigned rights
without self-escalation, loss of the final active administrator or cross-season authority leaks.
As a Season Manager, I can propose only the business delegations already permitted.

**Why this priority**: Correct identity and permission lifecycles determine who can safely
perform the later Phases' business operations.

**Independent Test**: Using at least two administrators, distinct proposers/recipients and
two isolated Season identities, exercise account changes, grants, delegation states and
concurrent revocations. Check both visible navigation and direct server requests.
Test fixtures do not implement operational season creation or approve later business content.

**Acceptance Scenarios**:

1. **Given** a verified staff identity, **When** an administrator creates an account,
   **Then** the unique personnel code, full name, username and temporary-credential state
   are recorded; duplicate identity/code/username or invalid input is rejected.
2. **Given** authority in only one season, **When** the account accesses another season's
   internal resource, **Then** access is denied; multiple roles do not remove scope or
   separation-of-person checks.
3. **Given** an administrator attempts self-lock, self-removal of the administrator role,
   or an operation leaving no active administrator, **When** it is submitted,
   **Then** it is rejected, including when administrators concurrently remove each other's access.
4. **Given** self-grant or scope expansion of seasonal/shared-master/Create Season rights,
   **When** the administrator targets themselves, **Then** it is denied.
   Allowed self-reduction of business rights preserves history and invalidates sessions.
5. **Given** a shared-master grant whose final prerequisite role is removed,
   **When** the change commits, **Then** the grant ends and sessions are invalidated;
   reassigning the role does not revive the old grant.
6. **Given** an account is locked and later unlocked, **When** it logs in again,
   **Then** old sessions remain invalid, retained role/shared grants follow their current
   validity, and terminated delegations do not revive.
7. **Given** a valid delegation proposal, **When** a different administrator grants the
   exact submitted version to a third eligible person, **Then** only its operation,
   season and finite validity interval are authorized; invalid separation or overlap is rejected.
8. **Given** concurrent edits or revoked authority while an administrative write waits,
   **When** its final recording point is reached, **Then** stale/conflicting or unauthorized
   work is rejected without partial account/grant/session/audit changes.
9. **Given** a network ambiguity and the same critical command intent,
   **When** the request is retried with its original identity, **Then** its permitted
   recorded outcome is recovered without another business effect; changed intent is rejected.

---

### User Story 4 - Inspect Protected Audit History (Priority: P2)

As a System Administrator, I can search traceability metadata for account, session and
permission operations, without gaining access to restricted business payloads or editing history.

**Why this priority**: Administrators need evidence of who changed access and when;
audit must already participate in the atomic changes of the other stories.

**Independent Test**: Produce real in-scope account/login/logout/grant/recovery events;
search them with authorized and unauthorized identities, inspect redaction, and force
an audit-write failure during an important change.

**Acceptance Scenarios**:

1. **Given** recorded operations, **When** an administrator filters by actor, time,
   action or object, **Then** matching authorized metadata and required before/after
   content are shown with deterministic, complete pagination.
2. **Given** restricted values in object-specific change history,
   **When** an administrator has only UC04 authority, **Then** system-wide metadata
   does not expose those values; corresponding current object-read authority is required.
3. **Given** an unauthorized user or a request to edit, delete or export audit,
   **When** it is attempted, **Then** no protected content or mutation/export is permitted.
4. **Given** a required audit write fails, **When** the related important change is saved,
   **Then** neither the change nor its partial permission/session effects are committed.
5. **Given** audit search is repeated, **When** results are read,
   **Then** audit/business content is unchanged, credentials are absent and retained
   history remains searchable after account locking or technical cleanup.

### Edge Cases

- Unknown username, locked account and expired temporary credential use non-enumerating
  login feedback; missing/invalid fields still have safe correction guidance.
- Unicode and whitespace passwords are counted as code points and never silently
  trimmed, normalized, case-converted or truncated.
- The fifth consecutive username failure and twentieth address failure in their rolling
  windows, concurrent attempts, successes and blocked retries obey the same counter rules.
- Idle, absolute, temporary-password, prelogin-context and delegation boundaries include
  exact equality; cleanup delay or restart never extends validity.
- Multiple browser tabs retain request protection for their live session; successful login
  rotates from the unauthenticated context without granting it business authority.
- A future delegation does not revoke sessions merely when recorded; its effective start
  and subsequent end/revocation/eligibility loss invalidate recipient sessions as approved.
- Adjacent delegation periods are permitted, overlapping eligible grants for the same
  recipient/operation/season are not; account unlock does not revive a terminated grant.
- Role loss in one season differs from loss of the last prerequisite role across all seasons;
  season dates do not silently erase assignments or truncate approved delegations.
- A stale edit, reused critical-command identity with different content, lost response,
  unknown commit outcome and audit failure cannot produce duplicate or partial changes.
- Bootstrap considers locked administrators; recovery cannot create or promote accounts.
  CLI paths use their approved operator controls rather than requiring a browser login.
- Test-only Season identities never become production seeds or evidence that actual
  season/regulation workflows were exercised.
- Backup admission includes session/security-state writers and scheduled cleanup; restore
  failure preserves maintenance until safe recovery, and restored sessions never revive.
- Empty lists, failed loads, validation errors, expired sessions and permission changes show
  explicit feedback. Safe unsaved non-secret input is preserved for correction/conflict review;
  internal state is not exposed to a later logged-in account.
- Unsupported actions/fields, malformed types, forged actor/scope information and dangerous
  content are rejected; frontend hiding or a guessed identifier does not authorize access.

## Requirements *(mandatory)*

### Functional Requirements

#### Foundation and operator access — US1

- **FR-001**: The system MUST install and start from documented prerequisites in a clean
  supported environment, with browser access, service-health verification and durable data.
- **FR-002**: Operational, development and isolated test configuration/data MUST remain
  separated; startup MUST NOT silently create test accounts, official seasons or credentials.
- **FR-003**: Bootstrap MUST initialize at most one administrator only when none exists,
  including locked administrators, with no partial initialization under concurrent executions.
- **FR-004**: Bootstrap MUST collect verified personnel identity, username and secure
  operator-supplied credentials without defaults; it MUST add no seasonal/shared business rights.
- **FR-005**: Recovery MUST be operator-controlled and limited to password reset and/or
  unlocking an existing administrator; it MUST NOT create, promote or alter business rights.
- **FR-006**: Bootstrap/recovery MUST have no public entry point and MUST protect secure
  credential entry. Recovery MUST require reason/operator identity, audit its permitted
  effects and invalidate every target session; credential resets require first-login change.
- **FR-007**: Browser and server failures MUST give safe actionable feedback without
  exposing secrets or diagnostic internals; protected transport and persisted data MUST
  survive replacement/restart under the approved foundation profile.

#### Authentication and sessions — US2

- **FR-008**: Internal functions MUST require valid current authentication and authority;
  public visitors MUST NOT acquire access to internal account or audit information.
- **FR-009**: Login MUST validate credentials and current account state, create a fresh
  protected session only on success, and record the event; a processing/storage failure
  MUST NOT create a valid logged-in state.
- **FR-010**: Failed login MUST NOT disclose whether a username exists. Unknown usernames
  MUST receive the same applicable attempt/block treatment as existing usernames.
- **FR-011**: Passwords MUST allow 15-128 Unicode code points, including whitespace,
  without forced composition classes, trimming, normalization, case conversion or truncation;
  reject the approved local common-password corpus and protect stored credentials.
- **FR-012**: Issued/reset credentials MUST be temporary for 24 hours and require first-login
  change; until changed, permit only necessary password-change/logout steps. Expiry requires
  administrator reissue, not business access.
- **FR-013**: Self-service password change MUST verify the current password and acceptable
  replacement, invalidate all sessions including the current session, and require a new login.
  Reset and unlock MUST remain separately authorized actions.
- **FR-014**: Concurrent sessions MUST be supported. Ordinary logout MUST invalidate the
  current session and clear its browser state without invalidating unrelated valid sessions;
  an already expired session returns the user to an unauthenticated state.
- **FR-015**: Sessions MUST expire at 30 minutes of inactivity or 8 hours after login,
  whichever occurs first; enforcement MUST occur at use and cannot depend on cleanup.
  Only a valid authenticated internal request counts as activity; no remember-me extension.
- **FR-016**: Account/season-role/shared-grant/Create Season right changes and account
  locking MUST invalidate affected sessions according to their owners. Unlocking MUST NOT
  revive sessions; successful completed prior work remains valid history.
- **FR-017**: State-changing browser requests, including login/logout, MUST reject missing,
  mismatched or wrong-origin request protection. An unauthenticated protection context
  expires after 15 minutes, grants no business access and is consumed on successful login.
- **FR-018**: Request protection MUST remain stable across tabs of the same live session,
  renew with the new authenticated session and never appear in URLs or logs.
  Exact-origin validation MUST reject requests without a valid Origin or Referer basis.
- **FR-019**: Temporarily block login for 15 minutes after five consecutive failures for a
  supplied username within a rolling 15-minute window, or 20 failures from a source address
  within that window; account locking remains a separate administrator action.
- **FR-020**: Failure counters/blocks MUST survive restart and coordinate concurrent attempts.
  Success resets the username sequence but not the address history; blocked retries MUST
  NOT continually extend an existing block. Use only a trusted source-address basis.
- **FR-021**: Session loss MUST clear internal client state and require login. Permission-change
  feedback MUST use the approved message: “Phiên đăng nhập không còn hiệu lực do tài khoản
  hoặc quyền truy cập đã thay đổi. Vui lòng đăng nhập lại.” Pending writes MUST NOT auto-replay
  after expiry, permission changes or a state/revision conflict.

#### Account and permission administration — US3

- **FR-022**: Only a currently authorized System Administrator MUST create, search, update,
  lock/unlock or reset personal accounts and administer system/seasonal roles and explicit
  grants. Account identity MUST be verified; one person has one account, not shared credentials.
- **FR-023**: Personnel code MUST be unique, stable, non-reusable and 1-32 approved code
  characters; full name MUST be 1-200 code points under approved business-text normalization.
  Username MUST satisfy the approved 3-50 character syntax and case-insensitive uniqueness/
  login comparison. Equal names alone MUST NOT establish identical people.
- **FR-024**: An account MAY hold several business roles per season, but internal authority
  MUST remain operation/season-specific; system administration MUST NOT imply business approval.
  Required separation of preparer/editor and approver MUST remain enforceable by identity.
- **FR-025**: Reject administrator self-lock, self-removal of the administrator role, or any
  lock/removal leaving no active administrator, including concurrent cross-removal attempts.
- **FR-026**: Reject self-grant/expansion of seasonal business roles/scopes, shared-master
  rights and Create Season authority. Permit approved self-reduction of business rights
  with audit/session invalidation; it MUST NOT remove the operator's administrator role.
- **FR-027**: Club, stadium and player shared-master rights MUST be separate grants,
  respectively requiring a Season Manager, Scheduling Officer or Registration Officer role
  in at least one season. A qualifying role alone MUST NOT grant the shared right.
- **FR-028**: Loss of the final prerequisite role MUST terminate the corresponding shared
  grant and invalidate sessions. Reassignment MUST require a new grant; loss of an unrelated
  role or retaining another qualifying season assignment MUST NOT trigger this termination.
- **FR-029**: Locking MUST prevent use of all authority and invalidate sessions without
  itself deleting role/shared-grant assignments. Unlocking restores only currently valid
  authority; delegations terminated by locking MUST NOT revive.
- **FR-030**: Create Season authority MUST be separately administered as create-only
  system authority, with no self-grant or automatic seasonal access. PHASE 1 administers
  this right; actual season creation and initial regulations remain PHASE 2.
- **FR-031**: Invalid, missing, duplicate, unknown or forbidden input fields MUST be rejected
  on the server with safe correction guidance. Cancelled administration changes MUST leave
  saved data unchanged; account references/history MUST survive discontinuation/locking.

#### Delegation administration — US3

- **FR-032**: Only the approved Season Manager with direct authority in the target season
  MUST propose a delegation; only a System Administrator MUST record its grant/revocation.
  Proposer, recorder and recipient MUST be three different people; onward delegation is forbidden.
- **FR-033**: A recipient MUST have an active account and an eligible seasonal business
  role. Permitted delegations are exactly: regulation-change preparation/editing to a
  Registration/Scheduling/Results Officer; schedule-adjustment approval to a Scheduling
  Officer; official-result correction preparation/editing to a Results Officer.
  Other approvals/publications/account administration MUST NOT become delegable.
- **FR-034**: Each delegation MUST identify recipient, operation, season, basis and finite
  start/end instants with end strictly after start. Validity is start-inclusive/end-exclusive.
  Immediate and future starts are allowed; backdating, indefinite periods and automatic
  renewal are forbidden. No unapproved fixed maximum duration is introduced.
- **FR-035**: Reject overlapping potentially effective grants for the same recipient/
  operation/season, including future grants and concurrent proposals. Adjacent periods are
  allowed; different operations/seasons are not conflicts solely due to simultaneous dates.
- **FR-036**: Proposal states MUST be Draft, Pending, Returned, Rejected, Cancelled and Granted.
  Submission locks the version; the administrator grants exactly submitted content or returns/
  rejects it with reason. The proposer may cancel Draft/Pending/Returned; a Returned proposal
  can be revised/resubmitted as a new preserved version. Invalid grant validation leaves
  Pending without a grant; Rejected/Cancelled/Granted proposals are terminal.
- **FR-037**: Granted-authority state MUST be separate from proposal outcome:
  Scheduled, Active, Expired, Revoked or Terminated due to lost eligibility.
  Granted proposals remain Granted after authority ends; ended grants do not reactivate.
  A granted delegation MUST NOT be edited in place; changes require revocation/new grant.
- **FR-038**: Loss of the proposer's required direct authority or recipient eligibility,
  or locking/disabling either, MUST terminate affected granted delegations permanently.
  Unrelated extra-role loss MUST NOT terminate them; administrator revocation requires a reason
  and does not require the proposer's prior approval.
- **FR-039**: Effective start, expiry, revocation or termination MUST invalidate recipient
  sessions at the actual boundary. Recording a future start MUST NOT prematurely revoke;
  recipient-session invalidation MUST NOT alone revoke the proposer/recorder's sessions.
- **FR-040**: Season dates alone MUST NOT truncate assignments/delegations. Delegation
  never overrides season lifecycle, business conditions or independent approval;
  PHASE 1 tests authority lifecycles without implementing the delegated later-Phase operation.

#### Audit — US4 and shared safety for US1-US3

- **FR-041**: Record required in-scope login/logout/security, bootstrap/recovery and
  important account/permission/delegation events, with actor/operator, time, action,
  object, outcome, applicable season, required reason/effective time and necessary before/after values.
- **FR-042**: Required audit and the related successful change MUST commit atomically.
  If audit cannot be recorded, the important change and dependent session/grant effects
  MUST NOT partially commit.
- **FR-043**: UC04 MUST permit only System Administrators to search authorized traceability
  metadata by actor, time, action and object. Restricted payload detail requires the
  corresponding current object-read authority, not merely the administrator role.
- **FR-044**: Audit responses/logs MUST exclude passwords/hashes, reusable session or
  request-protection tokens, storage credentials and whole sensitive request bodies.
  There MUST be no first-version audit export, application edit/delete or automatic
  business-audit/history deletion.
- **FR-045**: Audit and account list results MUST be deterministically paginated, with
  default 20 and maximum 100 per page, correct totals and allowlisted filters/sorts.
  Lookup MUST NOT modify business/audit content. Diagnostic logs MUST remain protected
  with 30-day rotation and MUST NOT replace business audit/history.

#### Shared safety and operations — all stories

- **FR-046**: All applicable writers MUST recheck current session/authority, scope, state
  and time at their final recording point, including after waits; permission changes,
  affected writes and session invalidation MUST coordinate consistently.
- **FR-047**: Stale edits MUST be rejected with conflict feedback and safe entered values
  preserved for review; silently overwriting a newer revision or replaying a conflict is forbidden.
- **FR-048**: Critical administration commands MUST recover matching outcomes for the
  same intent within the approved 24-hour receipt window without repeating effects;
  changed target/content with the same identity MUST conflict. Replays MUST recheck
  current access and filter returned content. Credential inputs MUST NOT enter receipts.
- **FR-049**: Unknown commit outcomes MUST be resolved before another execution.
  Only known-rolled-back transient failures MAY receive at most three total executions;
  business/authorization/revision errors MUST NOT be retried as transient failures.
- **FR-050**: Foundation relationship, scope and uniqueness constraints MUST reject invalid
  references, including synthetic wrong-season cases. Required audit, grants, account state,
  receipts and session effects MUST remain consistent under injected failure/concurrency.
- **FR-051**: Write maintenance MUST stop admitting persisted writers and drain existing
  work before the declared backup/restore point, including session/security-state and
  background writers. Safe reads MAY continue with explicit maintenance feedback.
- **FR-052**: Foundation backups MUST contain a verified, versioned inventory for the data
  actually present, use protected separate storage, prevent overlap, reject incomplete sets
  and retain at least seven complete sets without replacing good sets with failures.
- **FR-053**: Foundation backup scheduling MUST follow the approved daily 03:00 Vietnam-time
  default and at least once per 24 hours during operation, with missed-run handling,
  15-minute failure retries up to three retries for that due run and visible unresolved failures.
- **FR-054**: Operator restore MUST preserve maintenance, verify set compatibility,
  relationships and foundation functions before reopening, and invalidate restored sessions.
  Full-season/media recovery and the 30-minute BM-07 system demonstration remain PHASE 10;
  selected Internet off-host requirements remain due for that deployment profile.
- **FR-055**: Expiry MUST remain independent of cleanup. Hourly technical cleanup MUST retain
  active windows/blocks/operations and 24-hour receipt guarantees; login-failure evidence
  follows its approved 24-hour eligibility rule. No cleanup may delete protected business history.
- **FR-056**: Staff MUST receive Vietnamese labels, required-field guidance, Loading/Empty/Error
  feedback and permitted navigation. Date/time entry/display follows the approved Vietnam
  timezone rather than device-zone changes; date-only values remain dates.
- **FR-057**: The foundation MUST establish the mandatory automated quality/verification
  baseline on Ubuntu and Windows, with Ubuntu real-database migration/integration verification.
  Changes targeting development/main MUST follow the approved PR-only, required-check,
  no-bypass policy. Failures/cancellations/skipped mandatory checks MUST NOT appear successful;
  documentation-only changes MUST NOT leave required checks waiting indefinitely.
- **FR-058**: Verification execution MUST use isolated nonproduction data/credentials and
  minimal privileges, without exposing operational secrets or privileged execution of
  untrusted PR code. Automatic deployment is not part of the foundation CI.
- **FR-059**: PHASE 1 MUST provide documented clean-install/reset/verification procedures
  and meaningful automated frontend/backend, security/authority, transaction/race/failure
  and regression checks. Browser/HTTPS/load/recovery evidence MUST be recorded separately
  where required; an empty suite or green source check is not acceptance.
- **FR-060**: All acceptance evidence MUST identify source revision, actual environment/
  versions, fixture/reset basis, commands/scenarios, results, defects and reviewer;
  documented procedures or tool selections MUST NOT be represented as executed outcomes.
- **FR-061**: Dangerous input, including injection attempts and executable page content,
  MUST be rejected or safely handled without unintended execution, unauthorized updates
  or sensitive disclosure. Error feedback MUST identify safe correction information;
  stored content MUST NOT become an execution path when later displayed or searched.

### Key Entities *(include if feature involves data)*

- **Personal internal account**: one verified staff identity with personnel code, full name,
  unique username, protected credential state, administrator status and authority revision.
- **Session**: one login's account association, created/activity/absolute-expiry times and
  revocation state, distinct from current permissions and the unauthenticated protection context.
- **Login protection state**: unauthenticated request-protection lifetime and persistent
  username/source-address failure history and temporary-block boundaries; not a business grant.
- **Season identity and role assignment**: existing season reference and per-account business
  responsibility; multiple roles and seasons are independent. PHASE 1 has no season-creation UC.
- **Shared-master/Create Season grant**: separately administered permission with its own
  prerequisites and history, not an implicit property of administrator or seasonal role.
- **Delegation proposal/version**: editable/submitted content, proposer/recipient, operation,
  season, basis, validity choice and processing outcome.
- **Granted delegation**: exact granted version and recorded start/end/current termination
  basis, independently tracked from the proposal's Granted outcome.
- **Audit record**: protected traceability metadata and permitted changes; linked to actor,
  object and optional season without conferring access to the object's restricted content.
- **Technical revision/command receipt**: stale-change detection and a matching critical
  command's recoverable outcome, distinct from immutable submitted business versions.
- **Foundation backup set**: verified recovery inventory and available-data snapshot at one
  declared backup point, distinct from a claim of full-season/media acceptance.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A documented clean-environment installation and restart/replacement exercise
  passes US1 without default credentials, lost committed foundation data or undocumented setup.
- **SC-002**: At least 100 authentication attempts with 20 concurrent users achieve at least
  95% authentication responses within 3 seconds in the declared measurement environment;
  invalid credentials are rejected and security controls remain enabled.
- **SC-003**: Every session-boundary scenario in US2 denies reuse at idle/absolute expiry,
  logout and applicable revocation, including exact boundaries before cleanup and after restart.
- **SC-004**: Every temporary-password, personal-change and throttling boundary scenario
  in US2 passes, including concurrent attempts and unknown usernames, without disclosing credentials.
- **SC-005**: At least 10 distinct unauthorized-access cases through the UI and direct
  requests are rejected without sensitive disclosure or unauthorized data changes; include
  cross-season, non-administrator, self-escalation, audit and revoked-session cases.
- **SC-006**: Concurrent bootstrap, final-active-administrator, permission-revocation,
  stale-edit and repeated-command scenarios preserve every applicable invariant and
  produce no partial or duplicate important change.
- **SC-007**: All permitted/forbidden delegation combinations, proposal transitions,
  exact interval boundaries, overlaps and eligibility-loss scenarios in US3 pass without
  granting unapproved authority or reviving ended grants.
- **SC-008**: Actual in-scope events can be found through authorized audit filters;
  pagination has correct totals and no duplicate/omitted records on unchanged data.
  Searches leave content unchanged; restricted payload and secret-exclusion tests all pass.
- **SC-009**: Injected save/audit/transaction failures preserve the prior complete committed
  state in every failure scenario; replay after response loss does not duplicate effects.
- **SC-010**: The in-scope login/credential/account/audit journeys work on actual Google Chrome
  and Microsoft Edge with recorded versions and no compatibility error blocking the operation;
  failed loads, invalid input and session loss provide the specified feedback.
- **SC-011**: Foundation backup/restore and failed/missed/overlapping-run drills demonstrate
  recovery to a verified available-data backup point, retention of seven complete sets,
  safe write maintenance and fresh login after restore. Full BM-07 system acceptance is not claimed.
- **SC-012**: Both mandatory operating-system verification paths and the additional
  database verification path produce genuine passing results for the tested revision;
  failure/cancellation/skip and PR-only protection checks reject noncompliant changes.
- **SC-013**: A reviewer can reproduce the Phase acceptance assessment from the recorded
  revision, environment, fixtures, commands/scenarios and outcomes, with every mandatory
  criterion addressed and unresolved defects explicitly reported.

## Assumptions

- The current Context approvals and ratified Constitution provide the requirements/design
  baseline; this Specification was explicitly approved as recorded above. Its approval alone
  does not authorize implementation or complete G0 execution.
- The existing feature branch is retained. No branch creation, commit, push or PR publication
  is implied by preparing this Specification.
- O08 blocklist provenance/handoff, O12 exact compatibility/pins, O13 environment/fixture
  measurements and O14 deployment inputs remain downstream work under their owners.
  They are not substitute architecture questions and no actual result is invented here.
- Isolated Season identities and synthetic authority/history fixtures may support tests
  without replaying all operational approvals. Actual acceptance workflows explicitly
  exercised must use their real path; fixtures are never operational seeds.
- Browser and foundation-operation checks are required here; full league dataset,
  later business usability/load scenarios and complete media/season recovery are accepted
  in their owning Phases, not silently pulled into PHASE 1.
- Source timing, concurrency, field, browser and recovery thresholds are inherited without
  alteration; no new availability target, accessibility certification or numerical
  performance threshold is inferred.

## Source and Acceptance Traceability

The unchanged PDF is intentionally absent from this checkout. Page references use the
verified-name/hash conventions in [sources.md](../../context/sources.md#pdf);
no fresh PDF inspection or new source approval is claimed.

| Requirement group | Source / approved owner | Acceptance coverage |
|---|---|---|
| Foundation/CLI FR-001-FR-007 | CN-01-CN-04 p.26; D001/D002/D008/D011/D079/D087/D092/D095/D097 | US1; SC-001, SC-006 |
| Authentication FR-008-FR-021 | UC01 pp.67-69, UC02 pp.69-71; BM-01/BM-03 pp.23-24; D007/D080/D081/D096 | US2; SC-002-SC-005, SC-010 |
| Accounts/rights FR-022-FR-031 | UC03 pp.72-74; BM-02/BM-05; D003-D010/D031/D034/D037-D041/D076/D092 | US3; SC-005-SC-006 |
| Delegation FR-032-FR-040 | D013-D023/D025-D029 and D076; UC03 plus approved UC06/UC14/UC19 authority boundaries | US3; SC-003, SC-007 |
| Audit FR-041-FR-045 | UC04 pp.75-76; BM-06 p.24; D094 audit owner | US4; SC-008-SC-009 |
| Consistency FR-046-FR-050 | AT-02/AT-04 p.32; D030/D082/D084/D085/D095/D096 | US1-US4; SC-005-SC-006, SC-009 |
| Operations/feedback FR-051-FR-056 | CN-01/CN-03/CN-04; TD-02/03; D024/D086-D089/D097 and Q102 allocation | US1-US4; SC-001, SC-010-SC-011 |
| Verification FR-057-FR-060 | D090/D097/D098; Constitution I-V; BM-01-BM-06, applicable TD/AT constraints | All stories; SC-002-SC-013 |
| Dangerous input FR-061 | BM-04 p.23; TD-02 p.29; D085/D092/D096 | US2-US4 edge cases; SC-005, SC-009 |

Read the [administration owner](../../context/use-cases/administration.md),
[delegation owner](../../context/design/access-control.md),
[shared field rules](../../context/business.md#d092---shared-field-validation-identifiers-and-reference-catalogs),
[Create Season boundary](../../context/use-cases/registration.md#d076---separate-season-creation-authority-and-initial-regulation-gate),
[architecture/security/operations](../../context/design/architecture.md),
[quality](../../context/quality.md) and
[Phase ledger](../../context/progress-checker.md#phase-1---operational-foundation-and-access-administration)
together. Existing ADRs retain rationale and approval; this specification introduces no ADR.
