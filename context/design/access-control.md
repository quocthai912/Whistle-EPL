# Business delegation

Owns action-scoped delegation under the existing UC03/UC06 responsibilities. Account/role administration is owned by [UC01-UC04](../use-cases/administration.md); public/internal field scope by [lookup](../use-cases/publication.md). No new actor or Use Case is introduced.

### D013 - Action-scoped, seasonal and time-bounded business delegation

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0005-action-scoped-business-delegation.md#d013-english-evidence).

- **Source:** O07/O08; QĐ6.1, PDF p.11; UC14 pp.103-106 and UC19 pp.118-121; [D003](../use-cases/administration.md#d003---season-scoped-business-permissions)-[D006](../use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments)/[D010](../use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions).

- **Decision:** Represent business delegation separately, specifying the authorized operation, applicable season and validity period. Do not substitute the proposed option A of granting a broader existing role as the sole delegation mechanism.

- **Boundaries:** Delegation does not bypass [D005](../use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities)'s separation of preparation and approval. [D006](../use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments)'s authority over role/season assignments and [D010](../use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions)'s self-grant restrictions remain in place; [D013](access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation) alone does not decide who grants delegation or how those restrictions apply to delegation administration. No new actor or UC is introduced.

### D014 - Season Manager proposes delegation; System Administrator records grants/revocations

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0005-action-scoped-business-delegation.md#d014-english-evidence).

- **Source:** O07/O08; QĐ6.1, PDF p.11; UC03 pp.72-74, UC14 pp.103-106 and UC19 pp.118-121; [D006](../use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments)/[D013](access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation).

- **Decision:** The Organizing Committee / Season Manager proposes business delegation, specifying the recipient, operation, season, validity period and basis. The System Administrator checks the applicable conditions and records the grant or revocation on the system. Season Managers do not directly execute delegation grants/revocations.

- **Boundaries:** Recording a delegation does not approve the underlying business content; [D005](../use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities) still applies. Role/season assignments remain governed by [D006](../use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments); delegation remains action/season/time-specific under [D013](access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation). This decision does not itself select the request states, eligible recipients, self-delegation rules or onward delegation rules.

### D015 - Single-level delegation based on direct role authority

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0005-action-scoped-business-delegation.md#d015-english-evidence).

- **Source:** O07/O08; QĐ6.1, PDF p.11; UC14 pp.103-106 and UC19 pp.118-121; [D003](../use-cases/administration.md#d003---season-scoped-business-permissions)/[D013](access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation)/[D014](access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations).

- **Decision:** Business delegation is single-level. The proposer must base a delegation on authority held directly through their own role in the applicable season, restricted to operations eligible for delegation. Authority received through delegation cannot be used as the basis for further delegation.

- **Replacement and independent authority:** If a recipient must be replaced, submit a new delegation proposal under [D014](access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations). If a recipient independently holds direct role authority, a proposal based on that direct authority is not onward delegation; it must satisfy the same eligibility checks.

### D016 - Recipient cannot propose or record their own delegation grant

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0005-action-scoped-business-delegation.md#d016-english-evidence).

- **Source:** O07/O08; UC03, PDF pp.72-74; BM-02/BM-06, pp.23-24; [D010](../use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions)/[D013](access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation)-[D015](access-control.md#d015---single-level-delegation-based-on-direct-role-authority).

- **Decision:** The delegation recipient must be different from the proposer and from the System Administrator recording the grant. Multiple roles do not bypass either restriction. An administrator may receive a valid delegation only when someone else proposes it and a different administrator records the grant.

### D017 - Three different people for a delegation grant

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0005-action-scoped-business-delegation.md#d017-english-evidence).

- **Source:** O07/O08; UC03, PDF pp.72-74; BM-02/BM-06, pp.23-24; [D004](../use-cases/administration.md#d004---multiple-business-roles-in-the-same-season)/[D014](access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations)/[D016](access-control.md#d016---recipient-cannot-propose-or-record-their-own-delegation-grant).

- **Decision:** The person proposing delegation must differ from the System Administrator checking and recording its grant. Combined with [D016](access-control.md#d016---recipient-cannot-propose-or-record-their-own-delegation-grant), every delegation grant requires three different people: proposer, recorder and recipient. Holding multiple roles does not bypass these restrictions.

- **Consequences:** The backend must verify the separation conditions when recording the grant. Recording delegation remains distinct from approving the underlying business content; [D005](../use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities) separately governs subsequent business approval. This is an additional rule for granting delegation, not a claim that [D014](access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations) already required different people.

### D018 - Delegation recipients must already hold a business role in the target season

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0005-action-scoped-business-delegation.md#d018-english-evidence).

- **Source:** O07/O08; BM-02, PDF p.23; UC03 pp.72-74; [D003](../use-cases/administration.md#d003---season-scoped-business-permissions)/[D006](../use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments)/[D013](access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation)-[D017](access-control.md#d017---three-different-people-for-a-delegation-grant).

- **Decision:** A recipient must have an active account and at least one business role assigned in the target season before receiving delegation. Delegation adds a specific operation and does not replace seasonal staffing assignment. An account holding only the System Administrator role is not eligible until separately assigned a business role in that season through UC03.

- **Boundaries:** [D018](access-control.md#d018---delegation-recipients-must-already-hold-a-business-role-in-the-target-season) is a prerequisite, not approval for every seasonal role to receive every delegated operation. [D019](access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix) below confirms the first-version role/operation matrix. Existing [D015](access-control.md#d015---single-level-delegation-based-on-direct-role-authority)-[D017](access-control.md#d017---three-different-people-for-a-delegation-grant) authority and person-separation conditions still apply.

### D019 - First-version delegation operation and recipient-role matrix

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0005-action-scoped-business-delegation.md#d019-english-evidence).

- **Source:** O07/O08; QĐ6.1, PDF p.11; UC06 pp.79-82, UC14 pp.103-106, UC19 pp.118-121; approval boundaries in UC08/UC13/UC18/UC22/UC24; [D005](../use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities)/[D013](access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation)-[D018](access-control.md#d018---delegation-recipients-must-already-hold-a-business-role-in-the-target-season).

- **Decision:** Only the operations and recipient roles in the table below may be delegated in the first version. The recipient must hold a listed role in the target season and meet [D015](access-control.md#d015---single-level-delegation-based-on-direct-role-authority)-[D018](access-control.md#d018---delegation-recipients-must-already-hold-a-business-role-in-the-target-season). These are confirmed v2 design refinements, not claims that v1 already contained the detailed matrix.

| Delegated operation | Eligible recipient business role in the season | Boundary |
|---|---|---|
| Prepare/edit a proposed seasonal regulation change - UC06 | Registration Officer, Scheduling Officer or Results Officer | Does not include regulation approval |
| Approve a schedule-adjustment request - UC14 | Scheduling Officer | Cannot approve a submitted version they prepared/edited |
| Prepare/edit a proposed correction to an official result - UC19 | Results Officer | Cannot directly apply it; another authorized person must approve |

- **Retained approval/publication authority:** Regulation approval, club participation application approval, initial schedule approval, official result confirmation, approval of official-result corrections, season-summary confirmation, and news publication/withdrawal remain with the Organizing Committee / Season Manager and cannot be granted through this delegation mechanism in the first version. Account administration is outside business delegation. No other delegated operations are enabled by this decision.

UC14 scope clarification: postponement approval uses the existing schedule-adjustment delegation operation under [D067](../use-cases/scheduling.md#d067---approved-postponement-and-return-through-uc14).


UC22 playoff-based ranking-resolution approval remains nondelegable under [D071](../use-cases/publication.md#d071---approved-playoff-based-ranking-resolutions-within-uc22); summary confirmation/reconfirmation is independently controlled and nondelegable under [D073](../use-cases/publication.md#d073---versioned-season-summary-confirmation-and-reconfirmation).

UC24 news publication/withdrawal remains nondelegable under [D077](../use-cases/publication.md#d077---season-scoped-versioned-news-publication).

UC05 season closure/reopening approval is nondelegable under [D074](../use-cases/registration.md#d074---independently-approved-season-closure-and-reopening).

### D020 - Terminate delegation permanently when required eligibility is lost

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0005-action-scoped-business-delegation.md#d020-english-evidence).

- **Source:** O07/O08; BM-02/BM-06, PDF pp.23-24; [D003](../use-cases/administration.md#d003---season-scoped-business-permissions)/[D015](access-control.md#d015---single-level-delegation-based-on-direct-role-authority)/[D018](access-control.md#d018---delegation-recipients-must-already-hold-a-business-role-in-the-target-season)/[D019](access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix).

- **Decision:** An already-granted delegation terminates when its proposer loses the corresponding direct business authority in the season or their account is locked/disabled, or when the recipient no longer holds an eligible role for that operation in the season or their account is locked/disabled. Evaluate the relevant authority/eligible role; losing an unrelated extra role is not itself loss of the required condition.

- **No automatic restoration:** Unlocking an account or reassigning a role does not revive the terminated delegation. Continued delegated access requires a new proposal and grant under [D014](access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations)-[D018](access-control.md#d018---delegation-recipients-must-already-hold-a-business-role-in-the-target-season) and the [D019](access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix) operation/role matrix. Preserve the termination history and reason; do not automatically undo operations validly completed beforehand.

### D021 - Direct administrative revocation of business delegation

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0005-action-scoped-business-delegation.md#d021-english-evidence).

- **Source:** O07/O08; UC03, PDF pp.72-74; BM-02/BM-06, pp.23-24; [D014](access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations)/[D016](access-control.md#d016---recipient-cannot-propose-or-record-their-own-delegation-grant)/[D017](access-control.md#d017---three-different-people-for-a-delegation-grant)/[D020](access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost).

- **Decision:** A System Administrator may revoke a business delegation directly without waiting for a proposal or the three-person grant process, including a delegation they themselves receive. A Season Manager or recipient may request termination, but the System Administrator executes the revocation. An administrator may also initiate it independently.

- **History and effect:** Require the operator, time, revoked delegation and reason. After revocation is successfully saved, no operation may continue to rely on that delegation. Revocation is not automatically reversed; regranting requires the new-grant process. Other independently held permissions are not removed merely by revoking a delegation.

- **Boundaries:** This explicitly refines [D014](access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations)'s revocation process. [D016](access-control.md#d016---recipient-cannot-propose-or-record-their-own-delegation-grant)/[D017](access-control.md#d017---three-different-people-for-a-delegation-grant) remain mandatory for grants; their restrictions do not block this direct revocation. [D009](../use-cases/administration.md#d009---protect-administrator-access-and-prohibit-self-locking) still prohibits self-removal of the System Administrator role: revoking one's own business delegation is a different operation.

### D022 - Invalidate recipient sessions when delegation starts or ends

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0005-action-scoped-business-delegation.md#d022-english-evidence).

- **Source:** O07/O08/O12; BM-01/BM-02, PDF p.23; [D007](../use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking)/[D013](access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation)/[D020](access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost)/[D021](access-control.md#d021---direct-administrative-revocation-of-business-delegation).

- **Decision:** Invalidate all existing sessions of the recipient when a delegation becomes effective, expires, is revoked, or terminates after loss of eligibility under [D020](access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost). The next internal request from an old session is rejected and displays the re-login notification confirmed in [D007](../use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking).

- **Future start:** Recording a delegation whose start is in the future does not invalidate sessions at that advance-recording time. Invalidate the recipient's existing sessions when the delegation actually becomes effective.

- **Boundaries:** This decision concerns recipient sessions; it does not invalidate the proposer/recorder's sessions merely for administering someone else's delegation. Other [D007](../use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking) account/role-change triggers still apply independently. No real-time notification is required: the application shows the notice on receiving the server response.

### D023 - Explicit delegation start/end instants with an exclusive end

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0005-action-scoped-business-delegation.md#d023-english-evidence).

- **Source:** O07/O08; QĐ6.1, PDF p.11; [D013](access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation)/[D022](access-control.md#d022---invalidate-recipient-sessions-when-delegation-starts-or-ends). These time-boundary details are confirmed v2 design choices, not source defaults.

- **Decision:** Every delegation has a defined start and end date/time; the end must be strictly after the start. Its validity interval is [start, end): it can be used at the start instant and cannot be used at or after the end instant, subject to all other permission/eligibility conditions.

- **Activation and renewal:** Support immediate activation at successful grant recording or a scheduled future start. Do not backdate delegation. For immediate activation, the server determines the start at successful grant recording. Expiry does not renew automatically; continuing requires a new grant.

### D025 - Finite delegation periods without a fixed numerical duration cap

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0005-action-scoped-business-delegation.md#d025-english-evidence).

- **Source:** O07/O08; [D013](access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation)/[D014](access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations)/[D020](access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost)-[D023](access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end). The PDF specifies no 7-day or 30-day delegation cap; this is a confirmed v2 policy choice.

- **Decision:** Do not impose a fixed numerical maximum number of days per delegation in the first version. Every delegation still requires a defined end instant; indefinite delegation is not allowed. The proposer specifies the basis and period, and the administrator checks suitability before granting.

- **Boundaries:** [D020](access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost) termination, [D021](access-control.md#d021---direct-administrative-revocation-of-business-delegation) revocation, [D022](access-control.md#d022---invalidate-recipient-sessions-when-delegation-starts-or-ends) session behavior and [D023](access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end) expiry/new-grant rules remain mandatory. [D026](access-control.md#d026---delegation-periods-may-extend-beyond-season-startend-dates) confirms the relationship with season dates; the [D074 lifecycle gates](../use-cases/registration.md#d074---independently-approved-season-closure-and-reopening) now govern seasonal work.

### D026 - Delegation periods may extend beyond season start/end dates

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0005-action-scoped-business-delegation.md#d026-english-evidence).

- **Source:** O07/O08; season management UC05, PDF pp.77-78; regulation proposals UC06 pp.79-82 and official corrections UC19 pp.118-121; [D019](access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix)/[D023](access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end)/[D025](access-control.md#d025---finite-delegation-periods-without-a-fixed-numerical-duration-cap).

- **Decision:** A delegation period may start before the season's start date or extend after its end date, supporting legitimate preparation and post-season work. It still applies only to its target season and defined validity interval. The season's end date does not itself truncate the delegation, and the delegation does not automatically renew.

- **Business boundary:** An operation remains permitted only when the season's lifecycle and the operation's business conditions allow it. Delegation cannot override those conditions. [D073 summary](../use-cases/publication.md#d073---versioned-season-summary-confirmation-and-reconfirmation) and [D074 closure/reopening](../use-cases/registration.md#d074---independently-approved-season-closure-and-reopening) govern that boundary; no separate archive feature is selected here; [D026](access-control.md#d026---delegation-periods-may-extend-beyond-season-startend-dates) does not itself select season states or reopening policy.

### D027 - Reject overlapping delegation grants for the same recipient, operation and season

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0005-action-scoped-business-delegation.md#d027-english-evidence).

- **Source:** O07/O08; BM-02/BM-06, PDF pp.23-24; [D013](access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation)/[D020](access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost)/[D021](access-control.md#d021---direct-administrative-revocation-of-business-delegation)/[D023](access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end).

- **Decision:** Do not grant overlapping delegation intervals for the same recipient, operation and season, even when the proposers differ. Check against already-granted delegations that can still take effect, including future-start grants. Different operations or seasons are not conflicts merely because their times overlap.

- **Boundaries:** Adjacent intervals are allowed under [D023](access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end), such as 09:00-12:00 followed by 12:00-14:00. Revoked/terminated delegation must not block new grants for time after its termination, while preserving its history. Prevent conflicting grants under concurrent requests; the technical enforcement mechanism remains open.

### D028 - Lock submitted delegation versions and grant exactly the submitted content

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0005-action-scoped-business-delegation.md#d028-english-evidence).

- **Source:** O07/O08; BM-02/BM-06, PDF pp.23-24; [D014](access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations)/[D017](access-control.md#d017---three-different-people-for-a-delegation-grant)/[D023](access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end)/[D027](access-control.md#d027---reject-overlapping-delegation-grants-for-the-same-recipient-operation-and-season).

- **Decision:** A proposer may edit a draft. Submitting locks that version's content. The administrator checks and grants exactly that content, or returns/rejects it with a reason. The administrator cannot change parameters before granting, including narrowing the period.

- **Revision and checks:** Editing and resubmitting produces a new submitted version while retaining prior-version history. Before granting, recheck current permissions, validity period, person separation and overlap conditions. For the submitted choice to start immediately at grant, the server fills the actual successful grant-recording instant under [D023](access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end); this is not an administrator changing the period.

- **Granted delegation:** Do not directly edit a granted delegation. Changes require revocation and a new grant process, subject to all previously confirmed safeguards.

### D029 - Separate delegation proposal and granted-authority lifecycles

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0005-action-scoped-business-delegation.md#d029-english-evidence).

- **Source:** O07/O08; [D014](access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations)/[D020](access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost)-[D023](access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end)/[D028](access-control.md#d028---lock-submitted-delegation-versions-and-grant-exactly-the-submitted-content). These are confirmed v2 business states; no database/schema implementation is selected.

- **Decision:** Track the proposal's processing outcome separately from the granted delegation's current lifecycle. A successfully processed proposal remains Granted even when the related delegation later expires or is revoked.

| Proposal state | Meaning |
|---|---|
| Draft | Proposer is preparing editable content |
| Pending | Submitted version is locked and awaiting administrator processing |
| Returned | Administrator requests revision, with a reason |
| Rejected | Administrator declines the grant, with a reason |
| Cancelled | Proposer withdraws before grant |
| Granted | Checks and grant recording succeeded |

| Granted delegation state | Meaning |
|---|---|
| Scheduled | Granted, before its start instant |
| Active | Within its validity interval and meeting required eligibility |
| Expired | Its end instant has been reached |
| Revoked | Administrator explicitly revoked it |
| Terminated due to lost eligibility | Ended under [D020](access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost) |

- **Proposal transitions:** Draft -> Pending on submission. Pending -> Returned / Rejected / Granted by the administrator. Returned -> Pending on proposer revision and submission of a new version. The proposer may cancel from Draft, Pending or Returned. Rejected, Cancelled and Granted are terminal for that proposal; another proposal requires a new one.

- **Grant transitions:** A successful grant starts Scheduled or Active according to its start instant. Scheduled becomes Active at the start, subject to eligibility. Expired, Revoked and Terminated due to lost eligibility are terminal and never become Active again. Existing timing/termination/revocation rules govern their applicable transitions.

- **Failed grant validation:** Do not create delegation or mark the proposal Granted. Keep it Pending and report the error; the administrator may then return or reject it.
