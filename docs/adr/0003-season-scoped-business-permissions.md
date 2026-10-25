# ADR 0003 - Season-scoped business permissions

This ADR records decisions and rationale; authoritative current rules are owned by [D003](../../context/english/use-cases/administration.md#d003---season-scoped-business-permissions), [D004](../../context/english/use-cases/administration.md#d004---multiple-business-roles-in-the-same-season), [D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities), [D006](../../context/english/use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments), [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking), [D009](../../context/english/use-cases/administration.md#d009---protect-administrator-access-and-prohibit-self-locking), [D010](../../context/english/use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions), [D012](../../context/english/use-cases/administration.md#d012---season-wide-results-officer-scope-without-per-match-assignments), [D031](../../context/english/use-cases/administration.md#d031---one-personal-internal-account-per-person), [D034](../../context/english/use-cases/administration.md#d034---separately-assigned-shared-master-record-management-permissions), [D037](../../context/english/use-cases/administration.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions), [D038](../../context/english/use-cases/administration.md#d038---end-shared-master-management-permission-after-loss-of-the-last-corresponding-role-assignment), [D039](../../context/english/use-cases/administration.md#d039---invalidate-sessions-after-shared-master-management-permission-changes), [D040](../../context/english/use-cases/administration.md#d040---allow-administrator-self-reduction-of-business-permissions), [D041](../../context/english/use-cases/administration.md#d041---retain-shared-master-management-assignments-while-an-account-is-locked). Historical open-point notes do not reopen subsequently confirmed policy.

## Account locking and shared master-management assignments

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q41, option A; Context decision [D041](../../context/english/use-cases/administration.md#d041---retain-shared-master-management-assignments-while-an-account-is-locked).

Account locking blocks login and permission use and invalidates all sessions under [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking), but does not itself remove role assignments or terminate separately granted shared master-management permissions. Unlocking requires a new login and permits only still-valid access. If the last corresponding role assignment was removed during the lock, [D038](../../context/english/use-cases/administration.md#d038---end-shared-master-management-permission-after-loss-of-the-last-corresponding-role-assignment) still terminates the shared permission; unlocking does not restore it. [D020](../../context/english/design/access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost) remains unchanged: business delegation terminated by locking does not revive automatically.

Terminating shared permissions on every lock and requiring a fresh grant after unlocking was considered. The Team Leader chose to separate account locking from responsibility revocation and simplify temporary locking, accepting review of retained permissions on unlocking and different lifecycle treatment for delegation. UI/error contracts, permanent account retirement, season closure/archive behavior and technical enforcement remain open. See [Context v2 D041](../../context/english/use-cases/administration.md#d041---retain-shared-master-management-assignments-while-an-account-is-locked).

## Administrator self-reduction of business permissions

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q40, option A; Context decision [D040](../../context/english/use-cases/administration.md#d040---allow-administrator-self-reduction-of-business-permissions).

A System Administrator may use UC03 to remove their own seasonal business roles, narrow their season scope or revoke their shared master-management permissions, provided the operation only reduces access and does not grant or expand their own permissions. Preserve history and prior accountability, apply [D038](../../context/english/use-cases/administration.md#d038---end-shared-master-management-permission-after-loss-of-the-last-corresponding-role-assignment)'s dependent-permission termination, [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking)/[D039](../../context/english/use-cases/administration.md#d039---invalidate-sessions-after-shared-master-management-permission-changes) session invalidation and [D030](../../context/english/design/architecture.md#d030---recheck-current-session-and-authority-at-the-final-decision-point-of-writes) final authorization checks. Restoration requires another administrator under [D010](../../context/english/use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions)/[D037](../../context/english/use-cases/administration.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions). [D009](../../context/english/use-cases/administration.md#d009---protect-administrator-access-and-prohibit-self-locking) still prohibits self-locking and self-removal of the System Administrator role.

Requiring another administrator for every change to one's own business permissions was considered. The Team Leader chose timely removal of unneeded permissions and simpler staffing coordination, accepting accidental loss of needed business access and reliance on another administrator for restoration. UI/error contracts, pending-work handover and technical consistency/concurrency mechanisms remain open. See [Context v2 D040](../../context/english/use-cases/administration.md#d040---allow-administrator-self-reduction-of-business-permissions).

## Session invalidation for shared master-management permissions

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q39, option A; Context decision [D039](../../context/english/use-cases/administration.md#d039---invalidate-sessions-after-shared-master-management-permission-changes).

Successfully granting, expanding, revoking or terminating shared master-management permissions invalidates all sessions of the affected recipient, including [D038](../../context/english/use-cases/administration.md#d038---end-shared-master-management-permission-after-loss-of-the-last-corresponding-role-assignment) termination. The next internal request with an old session is rejected and displays [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking)'s account/permission-change notice requesting login again; real-time notification is not required. In-flight writes remain subject to [D030](../../context/english/design/architecture.md#d030---recheck-current-session-and-authority-at-the-final-decision-point-of-writes)'s final in-transaction authorization/session check and consistent ordering with access changes. Previously valid completed operations are not undone.

Retaining sessions while checking current permissions and updating the UI was considered. The Team Leader chose the same explicit login boundary as [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking)/[D022](../../context/english/design/access-control.md#d022---invalidate-recipient-sessions-when-delegation-starts-or-ends), accepting interruptions even for additional grants. Session technology/storage, detailed error contracts, unsaved-input handling and concurrency mechanisms remain open. See [Context v2 D039](../../context/english/use-cases/administration.md#d039---invalidate-sessions-after-shared-master-management-permission-changes).

[D037](../../context/english/use-cases/administration.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions) prohibits administrator self-grants of shared master-management permissions. [D038](../../context/english/use-cases/administration.md#d038---end-shared-master-management-permission-after-loss-of-the-last-corresponding-role-assignment) makes continued possession of a corresponding role assignment a prerequisite; see the confirmed follow-ups below.

## Shared master-management permission depends on a corresponding role

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q38, option A; Context decision [D038](../../context/english/use-cases/administration.md#d038---end-shared-master-management-permission-after-loss-of-the-last-corresponding-role-assignment).

Separately granted shared club, stadium and player master-management permissions require, respectively, a Season Manager, Scheduling Officer or Registration Officer role assignment in at least one season. Removing the last corresponding assignment ends the related shared permission with history. Reassigning the role does not revive it: a new grant under [D034](../../context/english/use-cases/administration.md#d034---separately-assigned-shared-master-record-management-permissions)/[D037](../../context/english/use-cases/administration.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions) is required. Retaining a corresponding assignment in another season avoids this termination trigger. Season end dates alone do not mean role removal; closure/archive behavior remains open.

Checking the role only at grant time and retaining permission until explicit revocation was considered. The Team Leader chose continuing responsibility-based access to prevent leftover permissions, accepting coordination of assignment order and possible regranting. Session handling, self-reduction/revocation, account-lock effects and technical concurrency mechanisms remain open. See [Context v2 D038](../../context/english/use-cases/administration.md#d038---end-shared-master-management-permission-after-loss-of-the-last-corresponding-role-assignment).

## Administrator self-granting of shared master-management permissions

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q37, option A; Context decision [D037](../../context/english/use-cases/administration.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions).

A System Administrator cannot grant or expand their own shared club, stadium or player master-management permissions, even when holding the corresponding business role. Another administrator must grant them through UC03, with backend enforcement and assignment history. A sole administrator can still assign these permissions to other eligible personnel, but needs another administrator to receive additional permissions themselves.

Allowing self-grants based on the corresponding business responsibility with logging was considered. The Team Leader chose consistency with [D010](../../context/english/use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions) and separation of grantor and recipient, accepting dependence on another administrator. Self-reduction/revocation, session handling and qualifying-role lifecycle remain open; this decision adds no separate grant-approval workflow. See [Context v2 D037](../../context/english/use-cases/administration.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions).

Current confirmed follow-ups in this record: [D003](../../context/english/use-cases/administration.md#d003---season-scoped-business-permissions)-[D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking), [D009](../../context/english/use-cases/administration.md#d009---protect-administrator-access-and-prohibit-self-locking)-[D010](../../context/english/use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions), [D012](../../context/english/use-cases/administration.md#d012---season-wide-results-officer-scope-without-per-match-assignments), [D031](../../context/english/use-cases/administration.md#d031---one-personal-internal-account-per-person), [D034](../../context/english/use-cases/administration.md#d034---separately-assigned-shared-master-record-management-permissions) and [D037](../../context/english/use-cases/administration.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions)-[D041](../../context/english/use-cases/administration.md#d041---retain-shared-master-management-assignments-while-an-account-is-locked). Earlier open-point notes below describe the scope at their interview round; the later follow-ups govern where those points have since been settled. [D008](../../context/english/use-cases/administration.md#d008---first-system-administrator-bootstrap-through-a-server-cli) settles first-administrator bootstrap in [ADR 0004](0004-first-administrator-cli-bootstrap.md). [D009](../../context/english/use-cases/administration.md#d009---protect-administrator-access-and-prohibit-self-locking) settles self-locking/self-revocation and last-active-administrator safeguards; [D010](../../context/english/use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions) settles administrator self-granting of seasonal business permissions. [D011](../../context/english/use-cases/administration.md#d011---emergency-recovery-cli-for-existing-administrators) settles the separate emergency recovery flow in ADR 0004; ordinary password operations remain open. [D012](../../context/english/use-cases/administration.md#d012---season-wide-results-officer-scope-without-per-match-assignments) settles season-wide Results Officer scope without per-match assignments. [D031](../../context/english/use-cases/administration.md#d031---one-personal-internal-account-per-person) establishes one personal internal account per person. [D034](../../context/english/use-cases/administration.md#d034---separately-assigned-shared-master-record-management-permissions) separately assigns shared master-record management permissions.

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok).

[D013](../../context/english/design/access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation) subsequently selects action/season/time business delegation in [ADR 0005](0005-action-scoped-business-delegation.md); its administration and detailed lifecycle remain open.

O08 leaves responsibility scopes unresolved; BM-02 (PDF p.23) requires server-side authorization by role and responsibility, while QĐ4.1 (p.9) keeps seasonal data distinct. In interview Q3, the Team Leader selected season-scoped business roles rather than roles automatically applying to all seasons. A business role grants internal business access only within its assigned seasons, subject to the operation's other conditions. System account administration is system-wide and does not automatically confer business approval authority. Public Viewers can read published public information without an account.

This decision makes seasonal assignments explicit and limits unintended cross-season operations, at the cost of maintaining assignments and checking scope on internal requests. At Q3, multiple roles, separation of preparation/approval and assignment authority remained open; Q4-Q6 below settle those aspects. Match assignments, delegation, assignment effectivity, first-administrator/session policies, season creation and shared master-record permissions remain open. This record does not settle O04's public/internal field matrix or resolve all of O08. See [Context v2 D003](../../context/english/use-cases/administration.md#d003---season-scoped-business-permissions).

## Multiple roles per season

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q4, option A; Context decision [D004](../../context/english/use-cases/administration.md#d004---multiple-business-roles-in-the-same-season).

An account may hold multiple business roles in the same season, rather than being restricted to one role per season. This supports combined responsibilities in a small team and attribution through one account, while requiring control of accumulated permissions and responsibility conflicts. Each operation still requires its corresponding permission in the assigned season and compliance with business conditions. Multiple roles do not by themselves permit self-approval; the Q5 follow-up below settles the separation rule. The six actors and 25 UCs remain unchanged. See [Context v2 D004](../../context/english/use-cases/administration.md#d004---multiple-business-roles-in-the-same-season).

## Separation of preparation and approval

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q5, option A; Context decision [D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities).

Preparation and approval require different people for seasonal regulations, club participation applications, schedules and schedule adjustments, official result confirmation and corrections to confirmed results. Anyone who prepared or edited the submitted version's content cannot approve that version, even with multiple roles. The approver must have the appropriate seasonal authority. The Team Leader explicitly stated that submission and approval were intended to separate responsibilities. Self-approval based only on role membership and selective separation were rejected in favor of a consistent rule across these workflows.

Corrections to official results must be submitted to another authorized person and approved before being applied. This explicitly confirmed v2 refinement adds a separate approval step to UC19; the existing official result remains effective pending approval, and approved corrections still require UC19/UC20 validation, history and consistent recalculation. At least two appropriately authorized people and traceability of submitted-version preparers/editors are necessary. Ordinary saves without approval remain governed by their applicable permissions. Detailed version transitions, resubmission, delegation and revocation effectivity remain open. See [Context v2 D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities).

## Seasonal role assignment administration

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q6, option A; Context decision [D006](../../context/english/use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments).

Only the System Administrator may grant or revoke business roles and their season scopes; the Organizing Committee / Season Manager cannot directly change these assignments. Compared with allowing Season Managers to assign staff roles, this preserves UC03's administration responsibility and a single accountable management point, at the cost of coordinating staffing changes with the administrator. Server-side checks and BM-06 logs apply. Administration authority does not automatically grant business approval rights or bypass [D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities). Grant/revocation effectivity, active-session handling, first-administrator bootstrap, administrator self-assignment/self-locking and last-administrator protection remain open. No additional staffing-request workflow is established. See [Context v2 D006](../../context/english/use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments).

## Session invalidation after access changes

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q7, option A; Context decision [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking).

Successfully saving an account role/season-scope change, including an additional grant, or locking the account invalidates all existing sessions for that account. The next internal request using an old session is rejected, and the application displays an explicit account/permission-change notice asking the user to log in again. Locked accounts cannot log in; unlocking does not revive old sessions. The notification appears upon receipt of the server response; no real-time notification infrastructure is selected.

Retaining sessions while checking current permissions was considered; it can also notify users and must reject unauthorized actions. The Team Leader preferred invalidation for a clearer user-visible boundary. Previously completed operations are not automatically undone. Session technology/storage, detailed error contracts, unsaved-input handling and the ordering of in-flight transactions concurrent with access changes remain open. This behavioral decision does not select cookie/JWT or supporting infrastructure. See [Context v2 D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking).

## Administrator access safeguards

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q9, option A; Context decision [D009](../../context/english/use-cases/administration.md#d009---protect-administrator-access-and-prohibit-self-locking).

A System Administrator cannot lock their own account or revoke their own System Administrator role. Reject any locking or administrator-role revocation that would leave no active System Administrator, defined as an account that is not locked/disabled and still holds the System Administrator role. Preserve this condition under concurrent operations, including administrators attempting to lock or remove each other's administrator access. A previously read account count alone is insufficient; the concrete concurrency mechanism is not selected here.

Allowing self-locking/self-revocation when another active administrator remains was considered. The Team Leader instead confirmed prohibition for clearer rules and prevention of accidental self-loss of administration access, accepting dependence on another administrator for their account's deactivation or removal of the administrator role. [D010](../../context/english/use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions) below settles self-granting seasonal business permissions. [D011](../../context/english/use-cases/administration.md#d011---emergency-recovery-cli-for-existing-administrators) settles emergency recovery in ADR 0004; password changes and transaction implementation remain open. This decision does not prohibit ordinary profile/password changes. See [Context v2 D009](../../context/english/use-cases/administration.md#d009---protect-administrator-access-and-prohibit-self-locking).

## Administrator self-granting of business permissions

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q10, option A; Context decision [D010](../../context/english/use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions).

A System Administrator cannot grant themselves additional seasonal business roles or expand their own season scope. Another System Administrator must make those grants/expansions through UC03. Administrators may hold business roles, and a sole administrator can still assign business roles to other staff. Allowing self-granting with audit logging was considered; the Team Leader chose separation of grantor and recipient, accepting that an administrator needing additional business access depends on another administrator.

Server-side checks must consider the recipient and the requested role/scope. Successful changes follow BM-06 logging and [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking) session invalidation. [D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities) continues to govern business preparation and approval independently of who assigned the role. [D011](../../context/english/use-cases/administration.md#d011---emergency-recovery-cli-for-existing-administrators) settles emergency recovery in ADR 0004; password changes, self-reduction of business permissions and implementation contracts remain open. See [Context v2 D010](../../context/english/use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions).

## Results Officer match scope

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q12, option A; Context decision [D012](../../context/english/use-cases/administration.md#d012---season-wide-results-officer-scope-without-per-match-assignments).

A Results Officer may create and update match reports and unofficial results for all matches in an assigned season, subject to status and business validation. The first version does not require per-match assignments or assignment-management functionality. Compared with individual match assignments, this simplifies collaboration and staff substitution in a small team, while not restricting data-entry responsibility to particular matches through authorization. Change history must identify operators, and concurrent editing must not silently overwrite changes.

This decision grants no access outside assigned seasons and no additional rights to other roles. Official result confirmation and correction of confirmed results still require their corresponding permissions and [D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities)'s separation of preparation and approval. Detailed states, correction authority and concurrency contracts remain open. See [Context v2 D012](../../context/english/use-cases/administration.md#d012---season-wide-results-officer-scope-without-per-match-assignments).

## One personal internal account per person

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q31, option A; Context decision [D031](../../context/english/use-cases/administration.md#d031---one-personal-internal-account-per-person).

Each person has one personal internal account across the system, with no shared accounts/credentials. Combined or changed duties use role assignments on that account. The administrator verifies identity when provisioning and prevents another account for a person already represented. Separation-of-person checks rely on the personal account under this one-to-one policy; username uniqueness alone does not prove person uniqueness.

Multiple accounts linked to a separate person identity were considered. The Team Leader chose simpler attribution and separation checks consistent with multiple roles, accepting identity/duplicate checks at provisioning. Required identity fields, duplicate detection, storage constraints and account/password lifecycle remain open. No separate personnel subsystem, identity provider or government-identity collection is selected. See [Context v2 D031](../../context/english/use-cases/administration.md#d031---one-personal-internal-account-per-person).

## Separately assigned shared master-management permissions

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q34, option A; Context decision [D034](../../context/english/use-cases/administration.md#d034---separately-assigned-shared-master-record-management-permissions).

The System Administrator separately assigns/revokes shared permissions through UC03 for club master management (Season Manager responsibility, UC07), stadium master management (Scheduling Officer responsibility, UC12) and player master profiles (Registration Officer responsibility, UC09). A seasonal role does not automatically grant shared-master management. This applies to shared records without granting access to other seasons' applications/internal business data and creates no new actor or UC.

Automatically deriving global shared-management access from a corresponding role in any season was considered. The Team Leader chose an explicit shared-data boundary at the cost of additional permission configuration. Exact representation, qualifying-role lifecycle and session rules for these permissions ([D037](../../context/english/use-cases/administration.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions) above settles self-granting), field access, historical preservation and write constraints remain open. No destructive deletion or new operation beyond applicable UCs/integrity rules is authorized. See [Context v2 D034](../../context/english/use-cases/administration.md#d034---separately-assigned-shared-master-record-management-permissions).

### D003 english evidence

Current policy owner: [D003](../../context/english/use-cases/administration.md#d003---season-scoped-business-permissions). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q3, the Team Leader confirmed option A: “Có, tôi xác nhận phương án A.” (“Yes, I confirm option A.”).

- **Source:** O08; BM-02, PDF p.23; QĐ4.1, PDF p.9; responsibility scopes in §1.3.3 p.35 and §2.1 p.53.

- **Alternatives/basis:** Season-scoped business roles versus business roles applying to all seasons. The chosen scope makes assignments explicit and limits unintended cross-season operations, at the cost of maintaining seasonal assignments.

- **Record:** [ADR 0003](0003-season-scoped-business-permissions.md).

- **Affected Phases:** PHASE 1 permission foundation and PHASE 2-PHASE 10 authorized workflows and verification. No Phase status changes.

- **Follow-up:** [D004](../../context/english/use-cases/administration.md#d004---multiple-business-roles-in-the-same-season) settles multiple roles, [D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities) separation of preparation and approval, [D006](../../context/english/use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments) assignment authority and [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking) session invalidation after access changes. [D008](../../context/english/use-cases/administration.md#d008---first-system-administrator-bootstrap-through-a-server-cli) settles first-administrator bootstrap. [D012](../../context/english/use-cases/administration.md#d012---season-wide-results-officer-scope-without-per-match-assignments) settles Results Officer scope without per-match assignments. [D013](../../context/english/design/access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation) selects action/season/time delegation, with administration responsibilities confirmed in [D014](../../context/english/design/access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations) and lifecycle details still open. Season creation and permissions for shared club/player/stadium master records remain open, as does O04's full public/internal field matrix.

### D004 english evidence

Current policy owner: [D004](../../context/english/use-cases/administration.md#d004---multiple-business-roles-in-the-same-season). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q4, the Team Leader selected option A: “tôi chọn phương án A.” (“I choose option A.”).

- **Source:** O08; BM-02, PDF p.23; six actors in §1.3.3 p.35 and §2.1 p.53; [D003](../../context/english/use-cases/administration.md#d003---season-scoped-business-permissions).

- **Alternatives/basis:** Allow multiple roles per account in a season versus restrict each account to one role per season. Multiple roles support a small team's combined responsibilities and attribution through a single account, while requiring control of accumulated permissions and responsibility conflicts.

- **Record:** [ADR 0003](0003-season-scoped-business-permissions.md#multiple-roles-per-season).

- **Affected Phases:** PHASE 1 role administration and dependent authorized workflows in PHASE 2-PHASE 10. No Phase status changes.

- **Follow-up:** [D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities) settles separation of preparation and approval, [D006](../../context/english/use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments) assignment authority and [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking) session invalidation after access changes. [D012](../../context/english/use-cases/administration.md#d012---season-wide-results-officer-scope-without-per-match-assignments) settles Results Officer match scope. [D013](../../context/english/design/access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation) selects the delegation model. Detailed action permissions and delegation administration remain open.

### D005 english evidence

Current policy owner: [D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q5, the Team Leader selected option A and explained that submission and approval were intended from the outset to separate these responsibilities.

- **Source:** O07/O08; QĐ6, PDF p.11; UC06 pp.79-82, UC08 pp.85-88, UC13-UC14 pp.100-106 and UC18-UC19 pp.115-121; [D003](../../context/english/use-cases/administration.md#d003---season-scoped-business-permissions)/[D004](../../context/english/use-cases/administration.md#d004---multiple-business-roles-in-the-same-season).

- **Alternatives/basis:** Mandatory separation, self-approval with sufficient roles, or separation only for selected operations. The Team Leader confirmed mandatory separation throughout the listed approval workflows because submission and approval represent distinct responsibilities.

- **Record:** [ADR 0003](0003-season-scoped-business-permissions.md#separation-of-preparation-and-approval).

- **Affected Phases:** PHASE 1 authorization foundation, PHASE 2 regulations, PHASE 3 club applications, PHASE 4 schedules, PHASE 5 results and PHASE 10 integration/acceptance. No Phase status changes.

- **Still open:** Detailed states/transitions, submitted-version editing/resubmission rules, delegation administration and assignment effectivity and approval eligibility after permission revocation. This decision does not automatically add approval steps to unrelated ordinary saves or decide news/report approval policies.

### D006 english evidence

Current policy owner: [D006](../../context/english/use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q6, the Team Leader selected option A: “Tôi chọn phương án A.” (“I choose option A.”).

- **Source:** O08; UC03, PDF pp.72-74; BM-02/BM-06, pp.23-24; [D003](../../context/english/use-cases/administration.md#d003---season-scoped-business-permissions)-[D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities).

- **Alternatives/basis:** Administrator-only assignment management versus allowing Season Managers to assign staff roles within their seasons. The chosen approach keeps one accountable administration point and remains consistent with UC03, at the cost of coordination with the administrator for staffing changes.

- **Record:** [ADR 0003](0003-season-scoped-business-permissions.md#seasonal-role-assignment-administration).

- **Affected Phases:** PHASE 1 account/role administration and dependent authorized workflows in PHASE 2-PHASE 10. No Phase status changes.

- **Follow-up:** [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking) settles session invalidation after role/scope changes or account locking. [D008](../../context/english/use-cases/administration.md#d008---first-system-administrator-bootstrap-through-a-server-cli) settles first-administrator bootstrap. [D009](../../context/english/use-cases/administration.md#d009---protect-administrator-access-and-prohibit-self-locking) settles self-locking/self-revocation and last-active-administrator protection. [D010](../../context/english/use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions) prohibits self-granting or expansion of seasonal business permissions. [D012](../../context/english/use-cases/administration.md#d012---season-wide-results-officer-scope-without-per-match-assignments) settles Results Officer match scope. [D013](../../context/english/design/access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation) selects the delegation model; its administration and in-flight transaction ordering remain unresolved.

### D007 english evidence

Current policy owner: [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** After discussing Q7's alternatives and notification behavior, the Team Leader confirmed option A: “Hợp lý, chọn A thôi.” (“That makes sense, choose A.”).

- **Source:** O08/O12; UC01-UC03, PDF pp.67-74; BM-01/BM-02, p.23; [D003](../../context/english/use-cases/administration.md#d003---season-scoped-business-permissions)/[D006](../../context/english/use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments).

- **Alternatives/basis:** Invalidate all existing sessions versus retain sessions while applying current permissions on subsequent requests. Both alternatives must reject operations without current permission. The Team Leader chose invalidation for a clear user-visible boundary and an explicit re-login message.

- **Record:** [ADR 0003](0003-season-scoped-business-permissions.md#session-invalidation-after-access-changes).

- **Affected Phases:** PHASE 1 account/session/role administration and PHASE 2-PHASE 10 internal workflows and verification. No Phase status changes.

- **Still open:** Authentication/session implementation, exact API error contract, treatment of unsaved form input and ordering of in-flight transactions concurrent with permission changes. That concurrency policy must be explicitly designed; invalidating a session alone does not settle an already-running request. [D008](../../context/english/use-cases/administration.md#d008---first-system-administrator-bootstrap-through-a-server-cli) settles first-administrator bootstrap; [D009](../../context/english/use-cases/administration.md#d009---protect-administrator-access-and-prohibit-self-locking) settles self-locking/self-revocation and last-active-administrator protection. [D010](../../context/english/use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions) prohibits self-granting or expansion of seasonal business permissions; [D011](../../context/english/use-cases/administration.md#d011---emergency-recovery-cli-for-existing-administrators) settles emergency administrator recovery.

### D009 english evidence

Current policy owner: [D009](../../context/english/use-cases/administration.md#d009---protect-administrator-access-and-prohibit-self-locking). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q9, the Team Leader selected option A: “Tôi chọn phương án A.” (“I choose option A.”).

- **Source:** O08; UC03, PDF pp.72-74; BM-02/BM-06, pp.23-24; [D006](../../context/english/use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments)-[D008](../../context/english/use-cases/administration.md#d008---first-system-administrator-bootstrap-through-a-server-cli).

- **Alternatives/basis:** Prohibit self-locking/self-revocation versus allow them if another active administrator remains. The Team Leader chose prohibition to make the rule explicit and prevent accidental self-loss of administration access, accepting that another administrator must handle their account's deactivation or removal of the administrator role.

- **Record:** [ADR 0003](0003-season-scoped-business-permissions.md#administrator-access-safeguards).

- **Affected Phases:** PHASE 1 account/role administration and PHASE 10 concurrency/integration verification. No Phase status changes.

- **Still open:** [D010](../../context/english/use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions) settles administrator self-granting of seasonal business permissions. Password changes and the concrete transactional/concurrency implementation remain open. [D011](../../context/english/use-cases/administration.md#d011---emergency-recovery-cli-for-existing-administrators) settles emergency recovery. [D009](../../context/english/use-cases/administration.md#d009---protect-administrator-access-and-prohibit-self-locking) does not prohibit ordinary profile/password changes or establish a recovery mechanism.

### D010 english evidence

Current policy owner: [D010](../../context/english/use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q10, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O08; UC03, PDF pp.72-74; BM-02/BM-06, pp.23-24; [D003](../../context/english/use-cases/administration.md#d003---season-scoped-business-permissions)-[D006](../../context/english/use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments)/[D009](../../context/english/use-cases/administration.md#d009---protect-administrator-access-and-prohibit-self-locking).

- **Alternatives/basis:** Prohibit self-granting/expansion versus permit it with full audit logging. The chosen rule separates the person granting access from the recipient, at the cost of requiring another administrator when an administrator needs additional business access.

- **Record:** [ADR 0003](0003-season-scoped-business-permissions.md#administrator-self-granting-of-business-permissions).

- **Affected Phases:** PHASE 1 assignment administration and PHASE 2-PHASE 10 dependent workflows and verification. No Phase status changes.

- **Still open:** [D011](../../context/english/use-cases/administration.md#d011---emergency-recovery-cli-for-existing-administrators) settles emergency administrator recovery. Password-change rules, self-reduction of business permissions and concrete assignment/schema/concurrency contracts remain open. This decision neither forbids administrators from holding business roles nor requires a second administrator for assigning roles to other staff.

### D012 english evidence

Current policy owner: [D012](../../context/english/use-cases/administration.md#d012---season-wide-results-officer-scope-without-per-match-assignments). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q12, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O08; UC16-UC17, PDF pp.109-114; BM-02/BM-06, pp.23-24; AT-02, p.32; [D003](../../context/english/use-cases/administration.md#d003---season-scoped-business-permissions)/[D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities).

- **Alternatives/basis:** Season-wide Results Officer access versus assignment to individual matches. Season-wide access supports a small team's collaboration and staff substitution without maintaining match assignments, at the cost of not restricting data-entry responsibility to particular matches through authorization.

- **Record:** [ADR 0003](0003-season-scoped-business-permissions.md#results-officer-match-scope).

- **Affected Phases:** PHASE 1 authorization, PHASE 5 match reports/unofficial results and PHASE 10 integration/concurrency verification. No Phase status changes.

- **Still open:** Detailed action permissions, states/transitions, delegation administration, report ownership/version rules and concrete concurrency contracts. [D013](../../context/english/design/access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation) settles the delegation model. Confirmed-result correction authority remains a separate permission decision.

### D031 english evidence

Current policy owner: [D031](../../context/english/use-cases/administration.md#d031---one-personal-internal-account-per-person). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q31, the Team Leader selected option A: “Tôi chọn phương án A.” (“I choose option A.”).

- **Source:** O08/O12; UC03, PDF pp.72-74; BM-02/BM-06, pp.23-24; [D004](../../context/english/use-cases/administration.md#d004---multiple-business-roles-in-the-same-season)/[D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities)/[D017](../../context/english/design/access-control.md#d017---three-different-people-for-a-delegation-grant).

- **Alternatives/basis:** One personal account per person versus multiple accounts linked to a separate person identity. The Team Leader chose simpler accountability and separation checks consistent with multiple-role support, accepting identity/duplicate checks at provisioning.

- **Record:** [ADR 0003](0003-season-scoped-business-permissions.md#one-personal-internal-account-per-person); [glossary](../../context/english/GLOSSARY.md#authority-and-information-scope).

- **Affected Phases:** PHASE 1 account/role administration, PHASE 2-PHASE 9 attributable internal operations and PHASE 10 verification. No Phase status changes.

- **Still open:** Required identity fields, duplicate detection, storage/constraints and account lifecycle/password rules. [D031](../../context/english/use-cases/administration.md#d031---one-personal-internal-account-per-person) does not select a separate personnel subsystem, identity provider or government-identity collection.

### D034 english evidence

Current policy owner: [D034](../../context/english/use-cases/administration.md#d034---separately-assigned-shared-master-record-management-permissions). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q34, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O04/O08/O12; UC03 pp.72-74, UC07 pp.82-84, UC09 pp.88-90 and UC12 pp.97-99; shared records in PDF §1.3.4.1 pp.37-38; [D003](../../context/english/use-cases/administration.md#d003---season-scoped-business-permissions)/[D006](../../context/english/use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments)/[D033](../../context/english/use-cases/publication.md#d033---internal-viewing-follows-business-responsibility).

- **Alternatives/basis:** Explicit separate shared permissions versus automatically deriving them from the corresponding role in any season. The Team Leader chose an explicit shared-data assignment boundary, accepting additional permission configuration.

- **Record:** [ADR 0003](0003-season-scoped-business-permissions.md#separately-assigned-shared-master-management-permissions).

- **Affected Phases:** PHASE 1 UC03/authorization, PHASE 2 clubs/stadiums, PHASE 3 player profiles and PHASE 10 access/history verification. No Phase status changes.

- **Still open:** Exact permission representation, qualifying-role lifecycle as settled by [D038](../../context/english/use-cases/administration.md#d038---end-shared-master-management-permission-after-loss-of-the-last-corresponding-role-assignment) below, session-change rules for these shared permissions ([D037](../../context/english/use-cases/administration.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions) settles self-granting), field-level access, snapshot details under [D035](../../context/english/business.md#d035---stable-master-identity-with-selective-snapshots-of-official-business-information) and detailed write constraints. [D034](../../context/english/use-cases/administration.md#d034---separately-assigned-shared-master-record-management-permissions) does not approve destructive deletion or any new operation beyond the applicable UCs and integrity rules.

### D037 english evidence

Current policy owner: [D037](../../context/english/use-cases/administration.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q37, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O08/O12; UC03 and [D010](../../context/english/use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions)/[D034](../../context/english/use-cases/administration.md#d034---separately-assigned-shared-master-record-management-permissions). This extends the confirmed self-grant safeguard to separately assigned shared master-management permissions.

- **Alternatives/basis:** Prohibit self-granting versus allow it when the administrator holds the corresponding business responsibility, with audit logging. The Team Leader chose consistency with [D010](../../context/english/use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions) and separation of grantor and recipient, accepting coordination with another administrator.

- **Record:** [ADR 0003](0003-season-scoped-business-permissions.md#administrator-self-granting-of-shared-master-management-permissions).

- **Affected Phases:** PHASE 1 account/permission administration, PHASE 2 club/stadium masters, PHASE 3 player masters and PHASE 10 authorization verification. No Phase status changes.

- **Still open:** Exact permission representation; [D040](../../context/english/use-cases/administration.md#d040---allow-administrator-self-reduction-of-business-permissions) below settles self-reduction/revocation. [D038](../../context/english/use-cases/administration.md#d038---end-shared-master-management-permission-after-loss-of-the-last-corresponding-role-assignment) below settles the qualifying-role lifecycle; [D039](../../context/english/use-cases/administration.md#d039---invalidate-sessions-after-shared-master-management-permission-changes) settles session-change handling. [D037](../../context/english/use-cases/administration.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions) does not settle these aspects or introduce a separate grant-approval workflow.

### D038 english evidence

Current policy owner: [D038](../../context/english/use-cases/administration.md#d038---end-shared-master-management-permission-after-loss-of-the-last-corresponding-role-assignment). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q38, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O08/O12; UC03 and [D034](../../context/english/use-cases/administration.md#d034---separately-assigned-shared-master-record-management-permissions)/[D037](../../context/english/use-cases/administration.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions).

- **Alternatives/basis:** Continuing role dependency versus checking the corresponding role only at grant time and retaining permission until explicit revocation. The Team Leader chose responsibility-aligned access and prevention of leftover permissions, accepting reassignment-order coordination and possible regranting.

- **Record:** [ADR 0003](0003-season-scoped-business-permissions.md#shared-master-management-permission-depends-on-a-corresponding-role).

- **Affected Phases:** PHASE 1 role/permission lifecycle, PHASE 2 club/stadium masters, PHASE 3 player masters and PHASE 10 authorization verification. No Phase status changes.

- **Still open:** Session-change handling is settled by [D039](../../context/english/use-cases/administration.md#d039---invalidate-sessions-after-shared-master-management-permission-changes). Self-reduction/revocation is settled by [D040](../../context/english/use-cases/administration.md#d040---allow-administrator-self-reduction-of-business-permissions). Account-lock effects are settled by [D041](../../context/english/use-cases/administration.md#d041---retain-shared-master-management-assignments-while-an-account-is-locked). Season closure/archive rules and technical consistency/concurrency mechanisms. No permission storage structure or automatic scheduling mechanism is selected.

### D039 english evidence

Current policy owner: [D039](../../context/english/use-cases/administration.md#d039---invalidate-sessions-after-shared-master-management-permission-changes). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q39, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O08/O12; UC03 and [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking)/[D022](../../context/english/design/access-control.md#d022---invalidate-recipient-sessions-when-delegation-starts-or-ends)/[D030](../../context/english/design/architecture.md#d030---recheck-current-session-and-authority-at-the-final-decision-point-of-writes)/[D034](../../context/english/use-cases/administration.md#d034---separately-assigned-shared-master-record-management-permissions)/[D038](../../context/english/use-cases/administration.md#d038---end-shared-master-management-permission-after-loss-of-the-last-corresponding-role-assignment).

- **Alternatives/basis:** Invalidate all recipient sessions versus retain sessions and check current permissions on each request with UI updates. The Team Leader chose consistency with [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking)/[D022](../../context/english/design/access-control.md#d022---invalidate-recipient-sessions-when-delegation-starts-or-ends) and an explicit user-visible permission-change boundary, accepting login interruptions even for additional grants.

- **Record:** [ADR 0003](0003-season-scoped-business-permissions.md#session-invalidation-for-shared-master-management-permissions).

- **Affected Phases:** PHASE 1 authorization/sessions, PHASE 2 club/stadium masters, PHASE 3 player masters and PHASE 10 access/concurrency verification. No Phase status changes.

- **Still open:** Session technology/storage, error contracts, unsaved-input behavior and technical enforcement/concurrency mechanisms. [D040](../../context/english/use-cases/administration.md#d040---allow-administrator-self-reduction-of-business-permissions) settles self-reduction/revocation. No new supporting technology is selected.

### D040 english evidence

Current policy owner: [D040](../../context/english/use-cases/administration.md#d040---allow-administrator-self-reduction-of-business-permissions). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q40, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O08/O12; UC03 and [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking)/[D009](../../context/english/use-cases/administration.md#d009---protect-administrator-access-and-prohibit-self-locking)/[D010](../../context/english/use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions)/[D037](../../context/english/use-cases/administration.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions)-[D039](../../context/english/use-cases/administration.md#d039---invalidate-sessions-after-shared-master-management-permission-changes).

- **Alternatives/basis:** Allow self-reduction versus require another administrator for every change to one's own business permissions. The Team Leader chose prompt removal of unneeded access and simpler staffing coordination, accepting accidental loss of needed business access and dependence on another administrator for restoration.

- **Record:** [ADR 0003](0003-season-scoped-business-permissions.md#administrator-self-reduction-of-business-permissions).

- **Affected Phases:** PHASE 1 UC03/authorization, PHASE 2-PHASE 9 business access and PHASE 10 verification. No Phase status changes.

- **Still open:** Detailed UI/error contracts, pending-work handover and technical consistency/concurrency mechanisms. [D041](../../context/english/use-cases/administration.md#d041---retain-shared-master-management-assignments-while-an-account-is-locked) settles account-lock effects on shared permissions. No new technology or automatic handover workflow is selected.

### D041 english evidence

Current policy owner: [D041](../../context/english/use-cases/administration.md#d041---retain-shared-master-management-assignments-while-an-account-is-locked). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q41, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O08/O12; UC03 and [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking)/[D020](../../context/english/design/access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost)/[D034](../../context/english/use-cases/administration.md#d034---separately-assigned-shared-master-record-management-permissions)/[D038](../../context/english/use-cases/administration.md#d038---end-shared-master-management-permission-after-loss-of-the-last-corresponding-role-assignment)-[D040](../../context/english/use-cases/administration.md#d040---allow-administrator-self-reduction-of-business-permissions).

- **Alternatives/basis:** Retain assignments while blocking account access versus terminate shared-management permission on locking and require a new grant after unlocking. The Team Leader chose separation of account locking from responsibility revocation and simpler temporary-lock operations, accepting review of retained permissions on unlocking and different lifecycle treatment for delegation.

- **Record:** [ADR 0003](0003-season-scoped-business-permissions.md#account-locking-and-shared-master-management-assignments).

- **Affected Phases:** PHASE 1 account/access lifecycle, PHASE 2 club/stadium masters, PHASE 3 player masters and PHASE 10 verification. No Phase status changes.

- **Still open:** UI/error contracts, permanent account retirement, season closure/archive behavior and technical enforcement/concurrency mechanisms. No new technology or automatic permission-review workflow is selected.
