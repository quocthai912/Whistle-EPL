# ADR 0005 - Action-scoped, seasonal and time-bounded business delegation

This ADR records decisions and rationale; authoritative current rules are owned by [D013](../../context/english/design/access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation), [D014](../../context/english/design/access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations), [D015](../../context/english/design/access-control.md#d015---single-level-delegation-based-on-direct-role-authority), [D016](../../context/english/design/access-control.md#d016---recipient-cannot-propose-or-record-their-own-delegation-grant), [D017](../../context/english/design/access-control.md#d017---three-different-people-for-a-delegation-grant), [D018](../../context/english/design/access-control.md#d018---delegation-recipients-must-already-hold-a-business-role-in-the-target-season), [D019](../../context/english/design/access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix), [D020](../../context/english/design/access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost), [D021](../../context/english/design/access-control.md#d021---direct-administrative-revocation-of-business-delegation), [D022](../../context/english/design/access-control.md#d022---invalidate-recipient-sessions-when-delegation-starts-or-ends), [D023](../../context/english/design/access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end), [D025](../../context/english/design/access-control.md#d025---finite-delegation-periods-without-a-fixed-numerical-duration-cap), [D026](../../context/english/design/access-control.md#d026---delegation-periods-may-extend-beyond-season-startend-dates), [D027](../../context/english/design/access-control.md#d027---reject-overlapping-delegation-grants-for-the-same-recipient-operation-and-season), [D028](../../context/english/design/access-control.md#d028---lock-submitted-delegation-versions-and-grant-exactly-the-submitted-content), [D029](../../context/english/design/access-control.md#d029---separate-delegation-proposal-and-granted-authority-lifecycles). Historical open-point notes do not reopen subsequently confirmed policy.

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q13, option B; Context decision [D013](../../context/english/design/access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation).

Follow-up decisions [D014](../../context/english/design/access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations)-[D023](../../context/english/design/access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end) and [D025](../../context/english/design/access-control.md#d025---finite-delegation-periods-without-a-fixed-numerical-duration-cap)-[D029](../../context/english/design/access-control.md#d029---separate-delegation-proposal-and-granted-authority-lifecycles) below refine administration, authority, person separation, recipient prerequisites, the permitted role/operation matrix, termination/revocation, recipient-session behavior, time boundaries, duration, relation to season dates, overlap, submitted versions and business lifecycles. [D024](../../context/english/design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone) confirms the shared UTC and Vietnam input/display policy in [ADR 0006](0006-utc-instants-and-vietnam-time-zone.md). [D030](../../context/english/design/architecture.md#d030---recheck-current-session-and-authority-at-the-final-decision-point-of-writes) confirms final in-transaction session/authority revalidation in [ADR 0007](0007-final-authorization-check-for-writes.md); its technical enforcement remains open. Earlier open-point notes describe their interview round; later confirmed decisions govern where those points have since been settled.

O07/O08 leave valid business delegation unresolved; QĐ6.1 (PDF p.11), UC14 (pp.103-106) and UC19 (pp.118-121) recognize authorized/delegated operations. The Team Leader selected separate delegation specifying an operation, season and validity period, rather than relying solely on assigning an existing broader seasonal role. The trade-off is precise operation scope without granting the whole broader role, at the cost of designing explicit grant, expiry, revocation and authorization rules.

This does not bypass [D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities)'s separation of preparation and approval or change [D006](../../context/english/use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments)'s role-assignment authority or [D010](../../context/english/use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions)'s self-grant restriction. At Q13, administration authority was open; [D014](../../context/english/design/access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations) below subsequently assigns those responsibilities. [D015](../../context/english/design/access-control.md#d015---single-level-delegation-based-on-direct-role-authority) below prohibits onward delegation and requires direct role authority. [D016](../../context/english/design/access-control.md#d016---recipient-cannot-propose-or-record-their-own-delegation-grant) below settles recipient separation. Remaining recipient eligibility, permitted operations, time boundaries/time zone, detailed lifecycle/audit and session/pending-request/in-flight effects remain open. Q13's proposed option A administration rules were not accepted by selecting B; later confirmations are recorded separately. No additional actor or UC is introduced. See [Context v2 D013](../../context/english/design/access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation).

## Delegation administration responsibilities

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q14, option A; Context decision [D014](../../context/english/design/access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations).

The Organizing Committee / Season Manager proposes delegation by specifying the recipient, operation, season, validity period and basis. The System Administrator checks applicable conditions and records grants/revocations; Season Managers do not directly execute those changes. Direct Season Manager grant/revocation was considered; the Team Leader preferred centralized access administration, accepting coordination with an administrator.

Delegation remains action/season/time-specific under [D013](../../context/english/design/access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation), distinct from role assignment under [D006](../../context/english/use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments). Recording delegation is not approval of underlying business content, and [D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities) still applies. [D015](../../context/english/design/access-control.md#d015---single-level-delegation-based-on-direct-role-authority) below settles direct-role authority and prohibits onward delegation. Detailed proposal/revocation states, remaining recipient eligibility, audit/session/expiry behavior and concurrency remain open. See [Context v2 D014](../../context/english/design/access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations).

## Single-level delegation from direct role authority

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q15, option A; Context decision [D015](../../context/english/design/access-control.md#d015---single-level-delegation-based-on-direct-role-authority).

The proposer must base delegation on authority held directly through their own role in the applicable season, within the list of delegable operations still to be confirmed. Delegated authority can be used to perform an operation, but cannot support onward delegation. Replacing a recipient requires a new proposal under [D014](../../context/english/design/access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations). A recipient who independently holds direct role authority may propose based on that authority, subject to the same checks; this is not a delegation chain.

Allowing bounded delegation chains was considered. The Team Leader chose a single level for simpler authority provenance, validity and responsibility, accepting the need for a new directly authorized proposal when replacing recipients. [D016](../../context/english/design/access-control.md#d016---recipient-cannot-propose-or-record-their-own-delegation-grant) below settles self-proposal/self-recording. Remaining recipient/operation eligibility, time boundaries, effects of changes to the proposer's direct role, lifecycle/audit/session and concurrency contracts remain open. See [Context v2 D015](../../context/english/design/access-control.md#d015---single-level-delegation-based-on-direct-role-authority).

## Recipient separation from proposal and grant recording

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q16, option A; Context decision [D016](../../context/english/design/access-control.md#d016---recipient-cannot-propose-or-record-their-own-delegation-grant).

The recipient cannot also be the delegation proposer or the System Administrator recording the grant, even when holding multiple roles. An administrator may receive delegation when another person proposes it and another administrator records the grant. Allowing self-recording after an independent Season Manager proposal was considered; the Team Leader chose recipient separation, consistent with [D010](../../context/english/use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions)'s self-grant restriction, accepting the need for another administrator when the recipient is an administrator.

[D017](../../context/english/design/access-control.md#d017---three-different-people-for-a-delegation-grant) below requires a different proposer and recorder. Remaining recipient/operation eligibility, self-revocation, request lifecycle, audit/session/expiry behavior and concurrency implementation are not otherwise settled. This decision does not prohibit administrators from receiving valid delegation. See [Context v2 D016](../../context/english/design/access-control.md#d016---recipient-cannot-propose-or-record-their-own-delegation-grant).

## Three-person separation for delegation grants

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q17, option A; Context decision [D017](../../context/english/design/access-control.md#d017---three-different-people-for-a-delegation-grant).

The delegation proposer and the System Administrator checking and recording the grant must be different people. With [D016](../../context/english/design/access-control.md#d016---recipient-cannot-propose-or-record-their-own-delegation-grant), this requires three different people for a delegation grant: proposer, recorder and recipient, regardless of multiple roles. Allowing a person holding both proposer and administrator roles to perform both responsibilities was considered; the Team Leader chose an independent pre-grant check, accepting coordination among three people. The backend must verify these conditions at grant recording.

This is an additional grant-administration rule; [D014](../../context/english/design/access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations) previously allocated roles without deciding person separation. It does not approve underlying business content, which remains subject to [D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities), or automatically impose the three-person grant rule on emergency revocation. [D018](../../context/english/design/access-control.md#d018---delegation-recipients-must-already-hold-a-business-role-in-the-target-season) below settles the prior seasonal assignment prerequisite; the role/operation matrix, revocation responsibilities, lifecycle/time/session/audit, concurrency and representation/enforcement of person identity across accounts remain open. See [Context v2 D017](../../context/english/design/access-control.md#d017---three-different-people-for-a-delegation-grant).

## Prior seasonal business assignment for recipients

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q18, option A; Context decision [D018](../../context/english/design/access-control.md#d018---delegation-recipients-must-already-hold-a-business-role-in-the-target-season).

A recipient must have an active account and at least one business role assigned in the target season before receiving delegation. Delegation adds a specific operation, rather than serving as an alternative seasonal staffing assignment. An account with only the System Administrator role is not eligible; UC03 must first assign a seasonal business role. The Team Leader chose this over allowing any active internal account to gain season access through delegation alone, preserving the staffing/access distinction at the cost of a prior assignment step.

This prerequisite does not allow all seasonal roles to receive all delegated operations. [D019](../../context/english/design/access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix) below settles the first-version role/operation matrix. Account-status details, effects of later assignment revocation/account locking, request/time/session/audit and concurrency contracts remain open. [D015](../../context/english/design/access-control.md#d015---single-level-delegation-based-on-direct-role-authority)-[D017](../../context/english/design/access-control.md#d017---three-different-people-for-a-delegation-grant) still apply. See [Context v2 D018](../../context/english/design/access-control.md#d018---delegation-recipients-must-already-hold-a-business-role-in-the-target-season).

## First-version delegation matrix

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q19, option A; Context decision [D019](../../context/english/design/access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix).

| Delegated operation | Eligible recipient role in the target season | Boundary |
|---|---|---|
| Prepare/edit a proposed seasonal regulation change - UC06 | Registration Officer, Scheduling Officer or Results Officer | Regulation approval is excluded |
| Approve a schedule-adjustment request - UC14 | Scheduling Officer | Cannot approve a version they prepared/edited |
| Prepare/edit a proposed correction to an official result - UC19 | Results Officer | Another authorized person must approve before application |

Regulation approval, club participation application approval, initial schedule approval, official result confirmation, approval of official-result corrections, season-summary confirmation and news publication/withdrawal remain with the Organizing Committee / Season Manager and cannot be granted through business delegation in the first version. Account administration is outside business delegation; no other delegated operations are enabled. These are confirmed v2 design refinements to the source's conditional delegation scope, not an assertion that v1 already contained the matrix.

The limited list was chosen over a wider set of delegated approvals to distinguish preparation, approval and application, accepting direct Season Manager involvement in retained operations. [D015](../../context/english/design/access-control.md#d015---single-level-delegation-based-on-direct-role-authority)-[D018](../../context/english/design/access-control.md#d018---delegation-recipients-must-already-hold-a-business-role-in-the-target-season) remain mandatory. [D020](../../context/english/design/access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost) below settles termination on loss of required eligibility. Other lifecycle/time/session/audit, concurrency and detailed contracts remain open; the full baseline permission matrix is separate. See [Context v2 D019](../../context/english/design/access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix).

## Termination on loss of required eligibility

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q20, option A; Context decision [D020](../../context/english/design/access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost).

An already-granted delegation terminates when the proposer loses the corresponding direct authority in the season or their account is locked/disabled, or when the recipient loses the eligible role for the operation in that season or their account is locked/disabled. Losing an unrelated extra role does not itself violate these required conditions. Unlocking or role reassignment does not revive the delegation; continued delegated access requires a new proposal/grant under [D014](../../context/english/design/access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations)-[D019](../../context/english/design/access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix). Preserve termination history/reason without automatically undoing previously valid completed operations.

Suspension with automatic reactivation was considered. The Team Leader chose permanent termination to avoid unexpected restoration of old rights, accepting the need for a new grant. [D021](../../context/english/design/access-control.md#d021---direct-administrative-revocation-of-business-delegation) below settles direct administrative revocation. Lifecycle states, time boundaries, recipient-session handling, pending requests and in-flight transaction ordering remain open. This behavioral rule prevents further reliance on terminated delegation without selecting session technology or deciding already-running transaction outcomes. See [Context v2 D020](../../context/english/design/access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost).

## Direct administrative revocation

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q21, option A; Context decision [D021](../../context/english/design/access-control.md#d021---direct-administrative-revocation-of-business-delegation).

A System Administrator may directly revoke delegation without waiting for a proposal or the three-person grant process, including delegation they themselves receive. A Season Manager or recipient may request termination; the administrator performs revocation and may also initiate it independently. Require the operator, time, affected delegation and reason. After revocation is successfully saved, the delegation cannot support further operations. It does not automatically revive; granting again requires a new grant process. Other independently held permissions are not removed merely by revoking delegation.

Applying the three-person grant process to revocation was considered. The Team Leader chose prompt access removal, accepting possible workflow interruption from mistaken revocation and requiring traceable reasons. This refines [D014](../../context/english/design/access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations) for revocation; [D016](../../context/english/design/access-control.md#d016---recipient-cannot-propose-or-record-their-own-delegation-grant)/[D017](../../context/english/design/access-control.md#d017---three-different-people-for-a-delegation-grant) still apply to granting. Revoking one's own business delegation does not remove the System Administrator role or relax [D009](../../context/english/use-cases/administration.md#d009---protect-administrator-access-and-prohibit-self-locking)'s self-removal prohibition. [D022](../../context/english/design/access-control.md#d022---invalidate-recipient-sessions-when-delegation-starts-or-ends) below settles recipient-session invalidation. Detailed states/UI/API, time/implementation behavior, pending/in-flight work, audit implementation/retention and concurrent changes remain open. See [Context v2 D021](../../context/english/design/access-control.md#d021---direct-administrative-revocation-of-business-delegation).

## Recipient-session invalidation at effective delegation changes

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q22, option A; Context decision [D022](../../context/english/design/access-control.md#d022---invalidate-recipient-sessions-when-delegation-starts-or-ends).

Invalidate all existing recipient sessions when delegation starts, expires, is revoked or terminates under [D020](../../context/english/design/access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost). Reject the next internal request using an old session and show [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking)'s re-login notice. A future-start delegation recorded in advance invalidates sessions at actual activation, not at advance recording. Administering someone else's delegation does not itself invalidate the proposer/recorder's sessions; [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking) triggers remain independent. Notification occurs upon the server response, without requiring real-time notification infrastructure.

Keeping sessions while checking current permissions and notifying users was considered. The Team Leader chose consistency with [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking) and an explicit user-visible permission boundary, accepting re-login at scheduled expiry. [D023](../../context/english/design/access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end) below settles interval boundaries and activation/renewal policy. Time zone, activation/expiry detection, session implementation, API/error contracts, lifecycle/audit, overlapping delegations, pending work and in-flight/concurrent ordering remain open. No scheduler, cookie/JWT or session store is selected. See [Context v2 D022](../../context/english/design/access-control.md#d022---invalidate-recipient-sessions-when-delegation-starts-or-ends).

## Explicit start/end instants and exclusive end

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q23, option A; Context decision [D023](../../context/english/design/access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end).

Every delegation has defined start/end date-times with end strictly after start. Its validity interval is [start, end): usable at the start, unusable at or after the end, subject to all other authorization/eligibility conditions. Support immediate activation at successful grant recording, with the server determining that start, or a future scheduled start. Backdating and automatic renewal are prohibited; continuing after expiry requires a new grant.

Whole-day periods were considered. The Team Leader chose explicit instants for short-duration delegation and clear authorization/session boundaries, accepting more precise entry. These are confirmed v2 design choices, not source defaults. [D024](../../context/english/design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone) settles the time-zone policy and [D025](../../context/english/design/access-control.md#d025---finite-delegation-periods-without-a-fixed-numerical-duration-cap) below selects no fixed numerical duration cap. Relation to season dates, precision/activation/expiry implementation, overlap, request lifecycle and concurrency/in-flight ordering remain open. See [Context v2 D023](../../context/english/design/access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end).

## Finite periods without a fixed numerical duration cap

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q25, option A; Context decision [D025](../../context/english/design/access-control.md#d025---finite-delegation-periods-without-a-fixed-numerical-duration-cap).

Do not impose a fixed numerical maximum number of days per delegation in the first version. Every grant still requires a defined end instant, with its basis and period specified by the proposer and checked for suitability by the administrator. Indefinite delegation is not allowed. A 30-day cap was considered; the Team Leader chose the simpler finite-period policy to support short and long work without repeating the three-person grant process solely because of an arbitrary numerical limit, accepting review of long periods at proposal/grant time.

[D020](../../context/english/design/access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost)-[D023](../../context/english/design/access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end) still govern termination, revocation, sessions, expiry and new grants. [D026](../../context/english/design/access-control.md#d026---delegation-periods-may-extend-beyond-season-startend-dates) below settles independence from season dates subject to business/lifecycle conditions. Detailed lifecycle conditions, overlap, request states, time precision/implementation and pending/concurrent/in-flight behavior remain open. No additional duration-configuration technology is selected. See [Context v2 D025](../../context/english/design/access-control.md#d025---finite-delegation-periods-without-a-fixed-numerical-duration-cap).

## Delegation periods outside season dates

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q26, option A; Context decision [D026](../../context/english/design/access-control.md#d026---delegation-periods-may-extend-beyond-season-startend-dates).

A delegation may start before its target season's start date or extend after its end date, supporting legitimate preparation and post-season work. It remains bound to that season and its own finite interval; the season end date does not automatically truncate it, and it does not automatically renew. Every operation remains subject to the season lifecycle and its business conditions, which delegation cannot override. Detailed summarized/archived-season states and reopening rules remain open.

Restricting the entire interval to season dates was considered. The Team Leader chose independence from those calendar dates subject to explicit lifecycle/operation checks, enabling pre-season and post-season work. [D027](../../context/english/design/access-control.md#d027---reject-overlapping-delegation-grants-for-the-same-recipient-operation-and-season) below settles overlap policy. Detailed lifecycle effects on delegation, request states, precision/implementation, pending work and concurrency/in-flight contracts remain open. See [Context v2 D026](../../context/english/design/access-control.md#d026---delegation-periods-may-extend-beyond-season-startend-dates).

## Non-overlapping grants for the same recipient, operation and season

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q27, option A; Context decision [D027](../../context/english/design/access-control.md#d027---reject-overlapping-delegation-grants-for-the-same-recipient-operation-and-season).

Reject overlapping delegation grants for the same recipient, operation and season even when proposers differ. Check already-granted delegations that can still become effective, including scheduled future grants. Different operations/seasons do not conflict merely because their times overlap. Adjacent intervals are valid under [D023](../../context/english/design/access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end)'s exclusive-end rule. Revoked/terminated grants do not block new grants for time after termination, while retaining history. Concurrent grant requests must not persist conflicting intervals.

Independent overlapping sources were considered. The Team Leader chose clearer authority provenance and simpler revocation/traceability, accepting interval changes or prior revocation when replacing overlapping grants. [D028](../../context/english/design/access-control.md#d028---lock-submitted-delegation-versions-and-grant-exactly-the-submitted-content) below settles submitted-version immutability and exact-content granting. Exact states, conflict feedback, audit/interval representation and concurrent/in-flight enforcement remain open. No database constraint or locking technology is selected. See [Context v2 D027](../../context/english/design/access-control.md#d027---reject-overlapping-delegation-grants-for-the-same-recipient-operation-and-season).

## Locked submitted versions and exact-content granting

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q28, option A; Context decision [D028](../../context/english/design/access-control.md#d028---lock-submitted-delegation-versions-and-grant-exactly-the-submitted-content).

The proposer may edit a draft; submitting locks that version's content. The administrator checks and grants exactly the submission or returns/rejects it with a reason, without changing parameters, including shortening the period. Revision and resubmission produce a new submitted version while preserving prior history. Recheck current authority, validity, person separation and overlap before granting. A submitted immediate-start choice is resolved by the server at successful grant recording under [D023](../../context/english/design/access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end), rather than treated as an administrator's parameter change.

Granted delegations are not directly editable; changes require revocation and a new grant process. Administrator adjustment limited to narrowing authority was considered; the Team Leader chose consistent proposed/granted content and clear responsibility, accepting an additional exchange for changes. [D029](../../context/english/design/access-control.md#d029---separate-delegation-proposal-and-granted-authority-lifecycles) below settles business states/transitions and cancellation/return/rejection rules. Version representation, conflict feedback and concurrent/in-flight contracts remain open. No storage or locking implementation is selected. See [Context v2 D028](../../context/english/design/access-control.md#d028---lock-submitted-delegation-versions-and-grant-exactly-the-submitted-content).

## Separate proposal and granted-delegation lifecycles

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q29, option A; Context decision [D029](../../context/english/design/access-control.md#d029---separate-delegation-proposal-and-granted-authority-lifecycles).

Proposal states are Draft, Pending, Returned, Rejected, Cancelled and Granted. Draft -> Pending on submission; Pending -> Returned / Rejected / Granted through administrator processing. Returned -> Pending after proposer revision and submission of a new version. The proposer may cancel from Draft, Pending or Returned. Rejected, Cancelled and Granted are terminal for that proposal. Return/rejection require a reason. Failed grant validation creates no delegation and leaves the proposal Pending with an error; the administrator may then return or reject it.

Granted-delegation states are Scheduled, Active, Expired, Revoked and Terminated due to lost eligibility. A successful grant starts Scheduled or Active according to its start instant; Scheduled becomes Active at the start subject to eligibility. Expired, Revoked and Terminated due to lost eligibility are terminal and cannot reactivate. Existing timing, revocation and termination rules apply. A proposal remains Granted when its delegation later expires or is revoked.

A single combined lifecycle was considered. The Team Leader chose separate processing and authority lifecycles for clear history. State codes/storage, version/schema design, UI/API, audit/transition implementation, simultaneous terminal-cause ordering and pending/concurrent/in-flight contracts remain open. This is a business-state decision, not a schema choice; [D021](../../context/english/design/access-control.md#d021---direct-administrative-revocation-of-business-delegation) direct revocation does not require a new three-person proposal. See [Context v2 D029](../../context/english/design/access-control.md#d029---separate-delegation-proposal-and-granted-authority-lifecycles).

### D013 english evidence

Current policy owner: [D013](../../context/english/design/access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q13, the Team Leader selected option B: “Tôi chọn phương án B.” (“I choose option B.”).

- **Source:** O07/O08; QĐ6.1, PDF p.11; UC14 pp.103-106 and UC19 pp.118-121; [D003](../../context/english/use-cases/administration.md#d003---season-scoped-business-permissions)-[D006](../../context/english/use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments)/[D010](../../context/english/use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions).

- **Alternatives/trade-off:** Delegation through existing seasonal roles versus specific operation/season/time delegation. The selected model can grant the intended operation without granting the whole broader role, but requires explicit grant, expiry, revocation and authorization rules. The Team Leader did not yet select those rules.

- **Record:** [ADR 0005](0005-action-scoped-business-delegation.md). Business meaning is recorded in the [glossary](../../context/english/GLOSSARY.md#authority-and-information-scope).

- **Affected Phases:** PHASE 1 authorization, PHASE 2 regulation authority, PHASE 4 schedule adjustments, PHASE 5 official corrections and PHASE 10 integration/verification. No Phase status changes.

- **Still open:** [D014](../../context/english/design/access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations) settles proposal and grant/revocation recording responsibilities. [D015](../../context/english/design/access-control.md#d015---single-level-delegation-based-on-direct-role-authority) prohibits onward delegation and requires direct role authority. [D018](../../context/english/design/access-control.md#d018---delegation-recipients-must-already-hold-a-business-role-in-the-target-season)-[D019](../../context/english/design/access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix) settle recipient prerequisites and the role/operation list. Detailed request states, validity boundaries/time zone, lifecycle/audit and consequences for sessions, pending requests and in-flight transactions when delegation changes or expires. The rejected option A's proposed administration and lifecycle rules are not implicitly accepted.

### D014 english evidence

Current policy owner: [D014](../../context/english/design/access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q14, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O07/O08; QĐ6.1, PDF p.11; UC03 pp.72-74, UC14 pp.103-106 and UC19 pp.118-121; [D006](../../context/english/use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments)/[D013](../../context/english/design/access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation).

- **Alternatives/basis:** Season Manager proposal followed by administrator recording versus direct Season Manager grant/revocation. The Team Leader chose a centralized access-administration point, accepting coordination with an administrator for delegation changes.

- **Record:** [ADR 0005](0005-action-scoped-business-delegation.md#delegation-administration-responsibilities).

- **Affected Phases:** PHASE 1 access administration, PHASE 2/PHASE 4/PHASE 5 delegated operations and PHASE 10 integration/verification. No Phase status changes.

- **Still open:** Detailed proposal/revocation lifecycle, remaining authority limits, recipient eligibility, applicable audit/session/expiry contracts and concurrent changes. [D014](../../context/english/design/access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations) allocates responsibilities without treating an administrator's check as business-content approval.

### D015 english evidence

Current policy owner: [D015](../../context/english/design/access-control.md#d015---single-level-delegation-based-on-direct-role-authority). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q15, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O07/O08; QĐ6.1, PDF p.11; UC14 pp.103-106 and UC19 pp.118-121; [D003](../../context/english/use-cases/administration.md#d003---season-scoped-business-permissions)/[D013](../../context/english/design/access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation)/[D014](../../context/english/design/access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations).

- **Alternatives/basis:** Prohibit onward delegation versus allow delegation chains bounded by inherited operation/season/time scope. The chosen model keeps authority provenance, validity and responsibility simpler, at the cost of requiring a new proposal from a directly authorized proposer when replacing a recipient.

- **Record:** [ADR 0005](0005-action-scoped-business-delegation.md#single-level-delegation-from-direct-role-authority). See [direct business authority](../../context/english/GLOSSARY.md#authority-and-information-scope).

- **Affected Phases:** PHASE 1 authorization, PHASE 2/PHASE 4/PHASE 5 delegated operations and PHASE 10 verification. No Phase status changes.

- **Still open:** [D016](../../context/english/design/access-control.md#d016---recipient-cannot-propose-or-record-their-own-delegation-grant) settles self-proposal/self-recording. [D018](../../context/english/design/access-control.md#d018---delegation-recipients-must-already-hold-a-business-role-in-the-target-season)-[D019](../../context/english/design/access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix) settle eligible roles/operations. [D020](../../context/english/design/access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost) settles termination on loss of required eligibility, including the proposer's direct authority. Time boundaries, audit/session/lifecycle and concurrency contracts remain open.

### D016 english evidence

Current policy owner: [D016](../../context/english/design/access-control.md#d016---recipient-cannot-propose-or-record-their-own-delegation-grant). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q16, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O07/O08; UC03, PDF pp.72-74; BM-02/BM-06, pp.23-24; [D010](../../context/english/use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions)/[D013](../../context/english/design/access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation)-[D015](../../context/english/design/access-control.md#d015---single-level-delegation-based-on-direct-role-authority).

- **Alternatives/basis:** Prohibit self-proposal and self-recording versus allow an administrator to record a grant to themselves after another Season Manager's proposal. The Team Leader chose separation of the recipient from requesting/granting access, consistent with [D010](../../context/english/use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions), accepting dependence on another administrator when the recipient is an administrator.

- **Follow-up:** [D017](../../context/english/design/access-control.md#d017---three-different-people-for-a-delegation-grant) requires the proposer and recording administrator to be different people. [D016](../../context/english/design/access-control.md#d016---recipient-cannot-propose-or-record-their-own-delegation-grant) does not prohibit administrators from receiving delegation or expand the list of eligible recipients/operations.

- **Record:** [ADR 0005](0005-action-scoped-business-delegation.md#recipient-separation-from-proposal-and-grant-recording).

- **Affected Phases:** PHASE 1 delegation authorization, PHASE 2/PHASE 4/PHASE 5 delegated workflows and PHASE 10 verification. No Phase status changes.

- **Still open:** Effects of losing recipient/operation eligibility, request lifecycle, audit/session/expiry behavior and concurrency implementation. [D017](../../context/english/design/access-control.md#d017---three-different-people-for-a-delegation-grant) settles proposer/recorder separation.

### D017 english evidence

Current policy owner: [D017](../../context/english/design/access-control.md#d017---three-different-people-for-a-delegation-grant). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q17, the Team Leader selected option A: “tôi chọn A.” (“I choose A.”).

- **Source:** O07/O08; UC03, PDF pp.72-74; BM-02/BM-06, pp.23-24; [D004](../../context/english/use-cases/administration.md#d004---multiple-business-roles-in-the-same-season)/[D014](../../context/english/design/access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations)/[D016](../../context/english/design/access-control.md#d016---recipient-cannot-propose-or-record-their-own-delegation-grant).

- **Alternatives/basis:** Require a different proposer and recorder versus permit one person with both roles to perform both responsibilities. The Team Leader chose an independent check before granting access, accepting the coordination needed among three people.

- **Record:** [ADR 0005](0005-action-scoped-business-delegation.md#three-person-separation-for-delegation-grants).

- **Affected Phases:** PHASE 1 delegation administration, PHASE 2/PHASE 4/PHASE 5 delegated workflows and PHASE 10 verification. No Phase status changes.

- **Still open:** Effects of losing recipient/operation eligibility, lifecycle/time/session/audit and concurrency contracts, and how person identity is represented/enforced across accounts. [D021](../../context/english/design/access-control.md#d021---direct-administrative-revocation-of-business-delegation) permits direct administrative revocation without the three-person grant process.

### D018 english evidence

Current policy owner: [D018](../../context/english/design/access-control.md#d018---delegation-recipients-must-already-hold-a-business-role-in-the-target-season). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q18, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O07/O08; BM-02, PDF p.23; UC03 pp.72-74; [D003](../../context/english/use-cases/administration.md#d003---season-scoped-business-permissions)/[D006](../../context/english/use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments)/[D013](../../context/english/design/access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation)-[D017](../../context/english/design/access-control.md#d017---three-different-people-for-a-delegation-grant).

- **Alternatives/basis:** Require prior seasonal business assignment versus allow any active internal account to receive season access through delegation alone. The chosen policy separates staffing assignment from additional delegated authority, at the cost of completing UC03 assignment before delegation.

- **Record:** [ADR 0005](0005-action-scoped-business-delegation.md#prior-seasonal-business-assignment-for-recipients).

- **Affected Phases:** PHASE 1 assignment/delegation authorization, PHASE 2/PHASE 4/PHASE 5 delegated workflows and PHASE 10 verification. No Phase status changes.

- **Still open:** Account-status lifecycle details and request/time/session/audit/concurrency contracts. [D019](../../context/english/design/access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix) settles the role/operation matrix; [D020](../../context/english/design/access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost) settles termination after loss of required eligibility.

### D019 english evidence

Current policy owner: [D019](../../context/english/design/access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q19, the Team Leader selected option A: “Chọn A là hợp lý.” (“Choosing A is reasonable.”).

- **Source:** O07/O08; QĐ6.1, PDF p.11; UC06 pp.79-82, UC14 pp.103-106, UC19 pp.118-121; approval boundaries in UC08/UC13/UC18/UC22/UC24; [D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities)/[D013](../../context/english/design/access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation)-[D018](../../context/english/design/access-control.md#d018---delegation-recipients-must-already-hold-a-business-role-in-the-target-season).

- **Alternatives/basis:** A limited role/operation list versus considering a wider set of delegated approvals. The Team Leader selected the limited list, distinguishing proposal preparation, approval and application of changes, while accepting continued direct Season Manager involvement in the retained operations.

- **Record:** [ADR 0005](0005-action-scoped-business-delegation.md#first-version-delegation-matrix).

- **Affected Phases:** PHASE 1 authorization, PHASE 2 regulation proposals, PHASE 4 schedule adjustments, PHASE 5 official corrections; PHASE 3/PHASE 7/PHASE 8 retained authority; PHASE 10 integration/verification. No Phase status changes.

- **Still open:** [D020](../../context/english/design/access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost) settles termination on loss of eligibility. Other delegation lifecycle/time/session/audit, concurrency and detailed API/UI/schema contracts remain open. This matrix does not replace the complete baseline role/action permission matrix.

### D020 english evidence

Current policy owner: [D020](../../context/english/design/access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q20, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O07/O08; BM-02/BM-06, PDF pp.23-24; [D003](../../context/english/use-cases/administration.md#d003---season-scoped-business-permissions)/[D015](../../context/english/design/access-control.md#d015---single-level-delegation-based-on-direct-role-authority)/[D018](../../context/english/design/access-control.md#d018---delegation-recipients-must-already-hold-a-business-role-in-the-target-season)/[D019](../../context/english/design/access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix).

- **Alternatives/basis:** Permanent termination versus suspension with automatic reactivation if conditions recover before expiry. The Team Leader chose a clear boundary preventing old delegated rights from unexpectedly returning, accepting the need for a new grant.

- **Record:** [ADR 0005](0005-action-scoped-business-delegation.md#termination-on-loss-of-required-eligibility).

- **Affected Phases:** PHASE 1 access/assignment lifecycle, PHASE 2/PHASE 4/PHASE 5 delegated workflows and PHASE 10 verification. No Phase status changes.

- **Still open:** [D021](../../context/english/design/access-control.md#d021---direct-administrative-revocation-of-business-delegation) settles direct administrative revocation; [D022](../../context/english/design/access-control.md#d022---invalidate-recipient-sessions-when-delegation-starts-or-ends) settles recipient-session invalidation. Exact lifecycle states, time boundaries, session implementation, pending-request treatment and ordering of in-flight transactions concurrent with eligibility changes. [D020](../../context/english/design/access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost) prevents further reliance on a terminated delegation but does not select a session technology or decide already-running transaction outcomes.

### D021 english evidence

Current policy owner: [D021](../../context/english/design/access-control.md#d021---direct-administrative-revocation-of-business-delegation). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q21, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O07/O08; UC03, PDF pp.72-74; BM-02/BM-06, pp.23-24; [D014](../../context/english/design/access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations)/[D016](../../context/english/design/access-control.md#d016---recipient-cannot-propose-or-record-their-own-delegation-grant)/[D017](../../context/english/design/access-control.md#d017---three-different-people-for-a-delegation-grant)/[D020](../../context/english/design/access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost).

- **Alternatives/basis:** Direct administrative revocation versus requiring the same three-person proposal/check separation as granting. The Team Leader chose prompt removal of access without assembling three people, accepting the risk of workflow interruption if revocation is mistaken and requiring a traceable reason.

- **Record:** [ADR 0005](0005-action-scoped-business-delegation.md#direct-administrative-revocation).

- **Affected Phases:** PHASE 1 delegation administration, PHASE 2/PHASE 4/PHASE 5 delegated workflows and PHASE 10 verification. No Phase status changes.

- **Still open:** [D022](../../context/english/design/access-control.md#d022---invalidate-recipient-sessions-when-delegation-starts-or-ends) settles recipient-session invalidation. Request/revocation states and UI/API contracts, session implementation, time boundaries, pending business work and in-flight transaction ordering, audit implementation/retention and concurrent revocation/grant handling.

### D022 english evidence

Current policy owner: [D022](../../context/english/design/access-control.md#d022---invalidate-recipient-sessions-when-delegation-starts-or-ends). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q22, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O07/O08/O12; BM-01/BM-02, PDF p.23; [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking)/[D013](../../context/english/design/access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation)/[D020](../../context/english/design/access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost)/[D021](../../context/english/design/access-control.md#d021---direct-administrative-revocation-of-business-delegation).

- **Alternatives/basis:** Invalidate sessions on effective delegation changes versus retain sessions while checking current permissions and notifying users. The Team Leader chose behavior consistent with [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking) and a clear user-visible permission boundary, accepting re-login even for scheduled expiry.

- **Record:** [ADR 0005](0005-action-scoped-business-delegation.md#recipient-session-invalidation-at-effective-delegation-changes).

- **Affected Phases:** PHASE 1 sessions/delegation lifecycle, PHASE 2/PHASE 4/PHASE 5 internal workflows and PHASE 10 verification. No Phase status changes.

- **Still open:** [D023](../../context/english/design/access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end) settles interval boundaries and activation/renewal policy. [D024](../../context/english/design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone) settles the shared time-zone policy. Expiry/activation detection and session implementation, exact API/error contract, lifecycle/audit, overlapping delegations, pending work and concurrent/in-flight transaction ordering. No scheduler, cookie/JWT or session storage is selected by [D022](../../context/english/design/access-control.md#d022---invalidate-recipient-sessions-when-delegation-starts-or-ends).

### D023 english evidence

Current policy owner: [D023](../../context/english/design/access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q23, the Team Leader selected option A: “Tôi chọn phương án A.” (“I choose option A.”).

- **Source:** O07/O08; QĐ6.1, PDF p.11; [D013](../../context/english/design/access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation)/[D022](../../context/english/design/access-control.md#d022---invalidate-recipient-sessions-when-delegation-starts-or-ends). These time-boundary details are confirmed v2 design choices, not source defaults.

- **Alternatives/basis:** Explicit start/end date-times versus whole-day delegation periods. The Team Leader chose explicit instants for short-duration delegation and unambiguous authorization/session boundaries, accepting more precise time entry.

- **Record:** [ADR 0005](0005-action-scoped-business-delegation.md#explicit-startend-instants-and-exclusive-end).

- **Affected Phases:** PHASE 1 delegation/session timing, PHASE 2/PHASE 4/PHASE 5 delegated operations and PHASE 10 boundary verification. No Phase status changes.

- **Still open:** [D024](../../context/english/design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone) settles the shared time-zone policy; [D025](../../context/english/design/access-control.md#d025---finite-delegation-periods-without-a-fixed-numerical-duration-cap) confirms no fixed numerical duration cap; [D026](../../context/english/design/access-control.md#d026---delegation-periods-may-extend-beyond-season-startend-dates) allows periods outside season dates subject to business/season lifecycle conditions. Time precision and activation/expiry implementation, overlap enforcement under [D027](../../context/english/design/access-control.md#d027---reject-overlapping-delegation-grants-for-the-same-recipient-operation-and-season), request lifecycle and concurrent/in-flight ordering remain open.

### D025 english evidence

Current policy owner: [D025](../../context/english/design/access-control.md#d025---finite-delegation-periods-without-a-fixed-numerical-duration-cap). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** The Team Leader explicitly confirmed Q25 option A: “Tôi xác nhận phương án A cho Q25.” (“I confirm option A for Q25.”).

- **Source:** O07/O08; [D013](../../context/english/design/access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation)/[D014](../../context/english/design/access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations)/[D020](../../context/english/design/access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost)-[D023](../../context/english/design/access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end). The PDF specifies no 7-day or 30-day delegation cap; this is a confirmed v2 policy choice.

- **Alternatives/basis:** No fixed numerical cap versus a 30-day limit per grant. The Team Leader selected the simpler finite-period policy, supporting short or long work without repeating the three-person process solely because of an arbitrary duration threshold; long periods require appropriate proposal/administration review.

- **Record:** [ADR 0005](0005-action-scoped-business-delegation.md#finite-periods-without-a-fixed-numerical-duration-cap).

- **Affected Phases:** PHASE 1 delegation validation, PHASE 2/PHASE 4/PHASE 5 delegated workflows and PHASE 10 verification. No Phase status changes.

- **Still open:** Detailed season lifecycle conditions, overlap enforcement under [D027](../../context/english/design/access-control.md#d027---reject-overlapping-delegation-grants-for-the-same-recipient-operation-and-season), request states, time precision/implementation, pending work and concurrency/in-flight contracts. [D025](../../context/english/design/access-control.md#d025---finite-delegation-periods-without-a-fixed-numerical-duration-cap) selects no extra duration-configuration technology or mechanism.

### D026 english evidence

Current policy owner: [D026](../../context/english/design/access-control.md#d026---delegation-periods-may-extend-beyond-season-startend-dates). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q26, the Team Leader selected option A: “Tôi chọn phương án A.” (“I choose option A.”).

- **Source:** O07/O08; season management UC05, PDF pp.77-78; regulation proposals UC06 pp.79-82 and official corrections UC19 pp.118-121; [D019](../../context/english/design/access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix)/[D023](../../context/english/design/access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end)/[D025](../../context/english/design/access-control.md#d025---finite-delegation-periods-without-a-fixed-numerical-duration-cap).

- **Alternatives/basis:** Independence from season dates subject to business/lifecycle conditions versus requiring the entire delegation period to fall within season start/end dates. The Team Leader chose support for pre-season preparation and post-season processing, accepting explicit lifecycle/operation checks.

- **Record:** [ADR 0005](0005-action-scoped-business-delegation.md#delegation-periods-outside-season-dates).

- **Affected Phases:** PHASE 1 authorization, PHASE 2 season/regulation workflows, PHASE 4/PHASE 5 delegated operations and PHASE 10 verification. No Phase status changes.

- **Still open:** Season lifecycle/archival/reopening conditions, effects of lifecycle changes on delegation, overlap enforcement under [D027](../../context/english/design/access-control.md#d027---reject-overlapping-delegation-grants-for-the-same-recipient-operation-and-season), request states, precision/implementation, pending work and concurrency/in-flight contracts.

### D027 english evidence

Current policy owner: [D027](../../context/english/design/access-control.md#d027---reject-overlapping-delegation-grants-for-the-same-recipient-operation-and-season). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q27, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O07/O08; BM-02/BM-06, PDF pp.23-24; [D013](../../context/english/design/access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation)/[D020](../../context/english/design/access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost)/[D021](../../context/english/design/access-control.md#d021---direct-administrative-revocation-of-business-delegation)/[D023](../../context/english/design/access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end).

- **Alternatives/basis:** Prohibit overlaps versus allow independent concurrent grants from multiple sources. The Team Leader chose clear authority provenance and simpler revocation/traceability, accepting that replacing overlapping grants may require changing the proposed interval or revoking the prior grant.

- **Record:** [ADR 0005](0005-action-scoped-business-delegation.md#non-overlapping-grants-for-the-same-recipient-operation-and-season).

- **Affected Phases:** PHASE 1 delegation validation, PHASE 2/PHASE 4/PHASE 5 delegated workflows and PHASE 10 boundary/concurrency verification. No Phase status changes.

- **Still open:** [D028](../../context/english/design/access-control.md#d028---lock-submitted-delegation-versions-and-grant-exactly-the-submitted-content) settles submitted-version locking and exact-content granting. Exact states/version representation, detailed conflict feedback, precise audit/interval representation, enforcement and pending/concurrent/in-flight contracts. [D027](../../context/english/design/access-control.md#d027---reject-overlapping-delegation-grants-for-the-same-recipient-operation-and-season) selects no database constraint or locking technology.

### D028 english evidence

Current policy owner: [D028](../../context/english/design/access-control.md#d028---lock-submitted-delegation-versions-and-grant-exactly-the-submitted-content). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q28, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O07/O08; BM-02/BM-06, PDF pp.23-24; [D014](../../context/english/design/access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations)/[D017](../../context/english/design/access-control.md#d017---three-different-people-for-a-delegation-grant)/[D023](../../context/english/design/access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end)/[D027](../../context/english/design/access-control.md#d027---reject-overlapping-delegation-grants-for-the-same-recipient-operation-and-season).

- **Alternatives/basis:** Locked submission with return/revision versus administrator adjustment limited to narrowing authority with reason/history. The Team Leader chose matching proposed/granted content and clear responsibility, accepting another exchange when changes are needed.

- **Record:** [ADR 0005](0005-action-scoped-business-delegation.md#locked-submitted-versions-and-exact-content-granting).

- **Affected Phases:** PHASE 1 delegation administration, PHASE 2/PHASE 4/PHASE 5 delegated workflows and PHASE 10 history/concurrency verification. No Phase status changes.

- **Still open:** [D029](../../context/english/design/access-control.md#d029---separate-delegation-proposal-and-granted-authority-lifecycles) settles the business states/transitions and cancellation/return/rejection rules. Version representation, conflict feedback, pending work and concurrent/in-flight ordering remain open. [D028](../../context/english/design/access-control.md#d028---lock-submitted-delegation-versions-and-grant-exactly-the-submitted-content) does not select a storage or locking implementation.

### D029 english evidence

Current policy owner: [D029](../../context/english/design/access-control.md#d029---separate-delegation-proposal-and-granted-authority-lifecycles). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q29, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the proposed states and transitions.

- **Source:** O07/O08; [D014](../../context/english/design/access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations)/[D020](../../context/english/design/access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost)-[D023](../../context/english/design/access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end)/[D028](../../context/english/design/access-control.md#d028---lock-submitted-delegation-versions-and-grant-exactly-the-submitted-content). These are confirmed v2 business states; no database/schema implementation is selected.

- **Alternatives/basis:** Two lifecycles versus a single combined lifecycle. The Team Leader chose clear separation between successful proposal processing and whether granted authority is currently usable.

- **Record:** [ADR 0005](0005-action-scoped-business-delegation.md#separate-proposal-and-granted-delegation-lifecycles).

- **Affected Phases:** PHASE 1 delegation workflows, PHASE 2/PHASE 4/PHASE 5 authorized operations and PHASE 10 transition/history verification. No Phase status changes.

- **Still open:** State storage/codes, version/schema design, UI/API contracts, audit/transition implementation, ordering of simultaneous terminal causes, pending business work and concurrent/in-flight enforcement. This decision concerns grant proposals; [D021](../../context/english/design/access-control.md#d021---direct-administrative-revocation-of-business-delegation) direct revocation does not require a new three-person proposal.
