# ADR 0005 - Action-scoped, seasonal and time-bounded business delegation

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q13, option B; Context decision D013.

Follow-up decisions D014-D023 and D025-D029 below refine administration, authority, person separation, recipient prerequisites, the permitted role/operation matrix, termination/revocation, recipient-session behavior, time boundaries, duration, relation to season dates, overlap, submitted versions and business lifecycles. D024 confirms the shared UTC and Vietnam input/display policy in [ADR 0006](0006-utc-instants-and-vietnam-time-zone.md). D030 confirms final in-transaction session/authority revalidation in [ADR 0007](0007-final-authorization-check-for-writes.md); its technical enforcement remains open. Earlier open-point notes describe their interview round; later confirmed decisions govern where those points have since been settled.

O07/O08 leave valid business delegation unresolved; QĐ6.1 (PDF p.11), UC14 (pp.103-106) and UC19 (pp.118-121) recognize authorized/delegated operations. The Team Leader selected separate delegation specifying an operation, season and validity period, rather than relying solely on assigning an existing broader seasonal role. The trade-off is precise operation scope without granting the whole broader role, at the cost of designing explicit grant, expiry, revocation and authorization rules.

This does not bypass D005's separation of preparation and approval or change D006's role-assignment authority or D010's self-grant restriction. At Q13, administration authority was open; D014 below subsequently assigns those responsibilities. D015 below prohibits onward delegation and requires direct role authority. D016 below settles recipient separation. Remaining recipient eligibility, permitted operations, time boundaries/time zone, detailed lifecycle/audit and session/pending-request/in-flight effects remain open. Q13's proposed option A administration rules were not accepted by selecting B; later confirmations are recorded separately. No additional actor or UC is introduced. See [Context v2 D013](../../context/english/design/README.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation).

## Delegation administration responsibilities

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q14, option A; Context decision D014.

The Organizing Committee / Season Manager proposes delegation by specifying the recipient, operation, season, validity period and basis. The System Administrator checks applicable conditions and records grants/revocations; Season Managers do not directly execute those changes. Direct Season Manager grant/revocation was considered; the Team Leader preferred centralized access administration, accepting coordination with an administrator.

Delegation remains action/season/time-specific under D013, distinct from role assignment under D006. Recording delegation is not approval of underlying business content, and D005 still applies. D015 below settles direct-role authority and prohibits onward delegation. Detailed proposal/revocation states, remaining recipient eligibility, audit/session/expiry behavior and concurrency remain open. See [Context v2 D014](../../context/english/design/README.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations).

## Single-level delegation from direct role authority

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q15, option A; Context decision D015.

The proposer must base delegation on authority held directly through their own role in the applicable season, within the list of delegable operations still to be confirmed. Delegated authority can be used to perform an operation, but cannot support onward delegation. Replacing a recipient requires a new proposal under D014. A recipient who independently holds direct role authority may propose based on that authority, subject to the same checks; this is not a delegation chain.

Allowing bounded delegation chains was considered. The Team Leader chose a single level for simpler authority provenance, validity and responsibility, accepting the need for a new directly authorized proposal when replacing recipients. D016 below settles self-proposal/self-recording. Remaining recipient/operation eligibility, time boundaries, effects of changes to the proposer's direct role, lifecycle/audit/session and concurrency contracts remain open. See [Context v2 D015](../../context/english/design/README.md#d015---single-level-delegation-based-on-direct-role-authority).

## Recipient separation from proposal and grant recording

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q16, option A; Context decision D016.

The recipient cannot also be the delegation proposer or the System Administrator recording the grant, even when holding multiple roles. An administrator may receive delegation when another person proposes it and another administrator records the grant. Allowing self-recording after an independent Season Manager proposal was considered; the Team Leader chose recipient separation, consistent with D010's self-grant restriction, accepting the need for another administrator when the recipient is an administrator.

D017 below requires a different proposer and recorder. Remaining recipient/operation eligibility, self-revocation, request lifecycle, audit/session/expiry behavior and concurrency implementation are not otherwise settled. This decision does not prohibit administrators from receiving valid delegation. See [Context v2 D016](../../context/english/design/README.md#d016---recipient-cannot-propose-or-record-their-own-delegation-grant).

## Three-person separation for delegation grants

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q17, option A; Context decision D017.

The delegation proposer and the System Administrator checking and recording the grant must be different people. With D016, this requires three different people for a delegation grant: proposer, recorder and recipient, regardless of multiple roles. Allowing a person holding both proposer and administrator roles to perform both responsibilities was considered; the Team Leader chose an independent pre-grant check, accepting coordination among three people. The backend must verify these conditions at grant recording.

This is an additional grant-administration rule; D014 previously allocated roles without deciding person separation. It does not approve underlying business content, which remains subject to D005, or automatically impose the three-person grant rule on emergency revocation. D018 below settles the prior seasonal assignment prerequisite; the role/operation matrix, revocation responsibilities, lifecycle/time/session/audit, concurrency and representation/enforcement of person identity across accounts remain open. See [Context v2 D017](../../context/english/design/README.md#d017---three-different-people-for-a-delegation-grant).

## Prior seasonal business assignment for recipients

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q18, option A; Context decision D018.

A recipient must have an active account and at least one business role assigned in the target season before receiving delegation. Delegation adds a specific operation, rather than serving as an alternative seasonal staffing assignment. An account with only the System Administrator role is not eligible; UC03 must first assign a seasonal business role. The Team Leader chose this over allowing any active internal account to gain season access through delegation alone, preserving the staffing/access distinction at the cost of a prior assignment step.

This prerequisite does not allow all seasonal roles to receive all delegated operations. D019 below settles the first-version role/operation matrix. Account-status details, effects of later assignment revocation/account locking, request/time/session/audit and concurrency contracts remain open. D015-D017 still apply. See [Context v2 D018](../../context/english/design/README.md#d018---delegation-recipients-must-already-hold-a-business-role-in-the-target-season).

## First-version delegation matrix

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q19, option A; Context decision D019.

| Delegated operation | Eligible recipient role in the target season | Boundary |
|---|---|---|
| Prepare/edit a proposed seasonal regulation change - UC06 | Registration Officer, Scheduling Officer or Results Officer | Regulation approval is excluded |
| Approve a schedule-adjustment request - UC14 | Scheduling Officer | Cannot approve a version they prepared/edited |
| Prepare/edit a proposed correction to an official result - UC19 | Results Officer | Another authorized person must approve before application |

Regulation approval, club participation application approval, initial schedule approval, official result confirmation, approval of official-result corrections, season-summary confirmation and news publication/withdrawal remain with the Organizing Committee / Season Manager and cannot be granted through business delegation in the first version. Account administration is outside business delegation; no other delegated operations are enabled. These are confirmed v2 design refinements to the source's conditional delegation scope, not an assertion that v1 already contained the matrix.

The limited list was chosen over a wider set of delegated approvals to distinguish preparation, approval and application, accepting direct Season Manager involvement in retained operations. D015-D018 remain mandatory. D020 below settles termination on loss of required eligibility. Other lifecycle/time/session/audit, concurrency and detailed contracts remain open; the full baseline permission matrix is separate. See [Context v2 D019](../../context/english/design/README.md#d019---first-version-delegation-operation-and-recipient-role-matrix).

## Termination on loss of required eligibility

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q20, option A; Context decision D020.

An already-granted delegation terminates when the proposer loses the corresponding direct authority in the season or their account is locked/disabled, or when the recipient loses the eligible role for the operation in that season or their account is locked/disabled. Losing an unrelated extra role does not itself violate these required conditions. Unlocking or role reassignment does not revive the delegation; continued delegated access requires a new proposal/grant under D014-D019. Preserve termination history/reason without automatically undoing previously valid completed operations.

Suspension with automatic reactivation was considered. The Team Leader chose permanent termination to avoid unexpected restoration of old rights, accepting the need for a new grant. D021 below settles direct administrative revocation. Lifecycle states, time boundaries, recipient-session handling, pending requests and in-flight transaction ordering remain open. This behavioral rule prevents further reliance on terminated delegation without selecting session technology or deciding already-running transaction outcomes. See [Context v2 D020](../../context/english/design/README.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost).

## Direct administrative revocation

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q21, option A; Context decision D021.

A System Administrator may directly revoke delegation without waiting for a proposal or the three-person grant process, including delegation they themselves receive. A Season Manager or recipient may request termination; the administrator performs revocation and may also initiate it independently. Require the operator, time, affected delegation and reason. After revocation is successfully saved, the delegation cannot support further operations. It does not automatically revive; granting again requires a new grant process. Other independently held permissions are not removed merely by revoking delegation.

Applying the three-person grant process to revocation was considered. The Team Leader chose prompt access removal, accepting possible workflow interruption from mistaken revocation and requiring traceable reasons. This refines D014 for revocation; D016/D017 still apply to granting. Revoking one's own business delegation does not remove the System Administrator role or relax D009's self-removal prohibition. D022 below settles recipient-session invalidation. Detailed states/UI/API, time/implementation behavior, pending/in-flight work, audit implementation/retention and concurrent changes remain open. See [Context v2 D021](../../context/english/design/README.md#d021---direct-administrative-revocation-of-business-delegation).

## Recipient-session invalidation at effective delegation changes

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q22, option A; Context decision D022.

Invalidate all existing recipient sessions when delegation starts, expires, is revoked or terminates under D020. Reject the next internal request using an old session and show D007's re-login notice. A future-start delegation recorded in advance invalidates sessions at actual activation, not at advance recording. Administering someone else's delegation does not itself invalidate the proposer/recorder's sessions; D007 triggers remain independent. Notification occurs upon the server response, without requiring real-time notification infrastructure.

Keeping sessions while checking current permissions and notifying users was considered. The Team Leader chose consistency with D007 and an explicit user-visible permission boundary, accepting re-login at scheduled expiry. D023 below settles interval boundaries and activation/renewal policy. Time zone, activation/expiry detection, session implementation, API/error contracts, lifecycle/audit, overlapping delegations, pending work and in-flight/concurrent ordering remain open. No scheduler, cookie/JWT or session store is selected. See [Context v2 D022](../../context/english/design/README.md#d022---invalidate-recipient-sessions-when-delegation-starts-or-ends).

## Explicit start/end instants and exclusive end

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q23, option A; Context decision D023.

Every delegation has defined start/end date-times with end strictly after start. Its validity interval is [start, end): usable at the start, unusable at or after the end, subject to all other authorization/eligibility conditions. Support immediate activation at successful grant recording, with the server determining that start, or a future scheduled start. Backdating and automatic renewal are prohibited; continuing after expiry requires a new grant.

Whole-day periods were considered. The Team Leader chose explicit instants for short-duration delegation and clear authorization/session boundaries, accepting more precise entry. These are confirmed v2 design choices, not source defaults. D024 settles the time-zone policy and D025 below selects no fixed numerical duration cap. Relation to season dates, precision/activation/expiry implementation, overlap, request lifecycle and concurrency/in-flight ordering remain open. See [Context v2 D023](../../context/english/design/README.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end).

## Finite periods without a fixed numerical duration cap

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q25, option A; Context decision D025.

Do not impose a fixed numerical maximum number of days per delegation in the first version. Every grant still requires a defined end instant, with its basis and period specified by the proposer and checked for suitability by the administrator. Indefinite delegation is not allowed. A 30-day cap was considered; the Team Leader chose the simpler finite-period policy to support short and long work without repeating the three-person grant process solely because of an arbitrary numerical limit, accepting review of long periods at proposal/grant time.

D020-D023 still govern termination, revocation, sessions, expiry and new grants. D026 below settles independence from season dates subject to business/lifecycle conditions. Detailed lifecycle conditions, overlap, request states, time precision/implementation and pending/concurrent/in-flight behavior remain open. No additional duration-configuration technology is selected. See [Context v2 D025](../../context/english/design/README.md#d025---finite-delegation-periods-without-a-fixed-numerical-duration-cap).

## Delegation periods outside season dates

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q26, option A; Context decision D026.

A delegation may start before its target season's start date or extend after its end date, supporting legitimate preparation and post-season work. It remains bound to that season and its own finite interval; the season end date does not automatically truncate it, and it does not automatically renew. Every operation remains subject to the season lifecycle and its business conditions, which delegation cannot override. Detailed summarized/archived-season states and reopening rules remain open.

Restricting the entire interval to season dates was considered. The Team Leader chose independence from those calendar dates subject to explicit lifecycle/operation checks, enabling pre-season and post-season work. D027 below settles overlap policy. Detailed lifecycle effects on delegation, request states, precision/implementation, pending work and concurrency/in-flight contracts remain open. See [Context v2 D026](../../context/english/design/README.md#d026---delegation-periods-may-extend-beyond-season-startend-dates).

## Non-overlapping grants for the same recipient, operation and season

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q27, option A; Context decision D027.

Reject overlapping delegation grants for the same recipient, operation and season even when proposers differ. Check already-granted delegations that can still become effective, including scheduled future grants. Different operations/seasons do not conflict merely because their times overlap. Adjacent intervals are valid under D023's exclusive-end rule. Revoked/terminated grants do not block new grants for time after termination, while retaining history. Concurrent grant requests must not persist conflicting intervals.

Independent overlapping sources were considered. The Team Leader chose clearer authority provenance and simpler revocation/traceability, accepting interval changes or prior revocation when replacing overlapping grants. D028 below settles submitted-version immutability and exact-content granting. Exact states, conflict feedback, audit/interval representation and concurrent/in-flight enforcement remain open. No database constraint or locking technology is selected. See [Context v2 D027](../../context/english/design/README.md#d027---reject-overlapping-delegation-grants-for-the-same-recipient-operation-and-season).

## Locked submitted versions and exact-content granting

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q28, option A; Context decision D028.

The proposer may edit a draft; submitting locks that version's content. The administrator checks and grants exactly the submission or returns/rejects it with a reason, without changing parameters, including shortening the period. Revision and resubmission produce a new submitted version while preserving prior history. Recheck current authority, validity, person separation and overlap before granting. A submitted immediate-start choice is resolved by the server at successful grant recording under D023, rather than treated as an administrator's parameter change.

Granted delegations are not directly editable; changes require revocation and a new grant process. Administrator adjustment limited to narrowing authority was considered; the Team Leader chose consistent proposed/granted content and clear responsibility, accepting an additional exchange for changes. D029 below settles business states/transitions and cancellation/return/rejection rules. Version representation, conflict feedback and concurrent/in-flight contracts remain open. No storage or locking implementation is selected. See [Context v2 D028](../../context/english/design/README.md#d028---lock-submitted-delegation-versions-and-grant-exactly-the-submitted-content).

## Separate proposal and granted-delegation lifecycles

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q29, option A; Context decision D029.

Proposal states are Draft, Pending, Returned, Rejected, Cancelled and Granted. Draft -> Pending on submission; Pending -> Returned / Rejected / Granted through administrator processing. Returned -> Pending after proposer revision and submission of a new version. The proposer may cancel from Draft, Pending or Returned. Rejected, Cancelled and Granted are terminal for that proposal. Return/rejection require a reason. Failed grant validation creates no delegation and leaves the proposal Pending with an error; the administrator may then return or reject it.

Granted-delegation states are Scheduled, Active, Expired, Revoked and Terminated due to lost eligibility. A successful grant starts Scheduled or Active according to its start instant; Scheduled becomes Active at the start subject to eligibility. Expired, Revoked and Terminated due to lost eligibility are terminal and cannot reactivate. Existing timing, revocation and termination rules apply. A proposal remains Granted when its delegation later expires or is revoked.

A single combined lifecycle was considered. The Team Leader chose separate processing and authority lifecycles for clear history. State codes/storage, version/schema design, UI/API, audit/transition implementation, simultaneous terminal-cause ordering and pending/concurrent/in-flight contracts remain open. This is a business-state decision, not a schema choice; D021 direct revocation does not require a new three-person proposal. See [Context v2 D029](../../context/english/design/README.md#d029---separate-delegation-proposal-and-granted-authority-lifecycles).
