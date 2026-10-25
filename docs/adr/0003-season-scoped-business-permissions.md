# ADR 0003 - Season-scoped business permissions

## Account locking and shared master-management assignments

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q41, option A; Context decision D041.

Account locking blocks login and permission use and invalidates all sessions under D007, but does not itself remove role assignments or terminate separately granted shared master-management permissions. Unlocking requires a new login and permits only still-valid access. If the last corresponding role assignment was removed during the lock, D038 still terminates the shared permission; unlocking does not restore it. D020 remains unchanged: business delegation terminated by locking does not revive automatically.

Terminating shared permissions on every lock and requiring a fresh grant after unlocking was considered. The Team Leader chose to separate account locking from responsibility revocation and simplify temporary locking, accepting review of retained permissions on unlocking and different lifecycle treatment for delegation. UI/error contracts, permanent account retirement, season closure/archive behavior and technical enforcement remain open. See [Context v2 D041](../../context/english/design/README.md#d041---retain-shared-master-management-assignments-while-an-account-is-locked).

## Administrator self-reduction of business permissions

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q40, option A; Context decision D040.

A System Administrator may use UC03 to remove their own seasonal business roles, narrow their season scope or revoke their shared master-management permissions, provided the operation only reduces access and does not grant or expand their own permissions. Preserve history and prior accountability, apply D038's dependent-permission termination, D007/D039 session invalidation and D030 final authorization checks. Restoration requires another administrator under D010/D037. D009 still prohibits self-locking and self-removal of the System Administrator role.

Requiring another administrator for every change to one's own business permissions was considered. The Team Leader chose timely removal of unneeded permissions and simpler staffing coordination, accepting accidental loss of needed business access and reliance on another administrator for restoration. UI/error contracts, pending-work handover and technical consistency/concurrency mechanisms remain open. See [Context v2 D040](../../context/english/design/README.md#d040---allow-administrator-self-reduction-of-business-permissions).

## Session invalidation for shared master-management permissions

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q39, option A; Context decision D039.

Successfully granting, expanding, revoking or terminating shared master-management permissions invalidates all sessions of the affected recipient, including D038 termination. The next internal request with an old session is rejected and displays D007's account/permission-change notice requesting login again; real-time notification is not required. In-flight writes remain subject to D030's final in-transaction authorization/session check and consistent ordering with access changes. Previously valid completed operations are not undone.

Retaining sessions while checking current permissions and updating the UI was considered. The Team Leader chose the same explicit login boundary as D007/D022, accepting interruptions even for additional grants. Session technology/storage, detailed error contracts, unsaved-input handling and concurrency mechanisms remain open. See [Context v2 D039](../../context/english/design/README.md#d039---invalidate-sessions-after-shared-master-management-permission-changes).

D037 prohibits administrator self-grants of shared master-management permissions. D038 makes continued possession of a corresponding role assignment a prerequisite; see the confirmed follow-ups below.

## Shared master-management permission depends on a corresponding role

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q38, option A; Context decision D038.

Separately granted shared club, stadium and player master-management permissions require, respectively, a Season Manager, Scheduling Officer or Registration Officer role assignment in at least one season. Removing the last corresponding assignment ends the related shared permission with history. Reassigning the role does not revive it: a new grant under D034/D037 is required. Retaining a corresponding assignment in another season avoids this termination trigger. Season end dates alone do not mean role removal; closure/archive behavior remains open.

Checking the role only at grant time and retaining permission until explicit revocation was considered. The Team Leader chose continuing responsibility-based access to prevent leftover permissions, accepting coordination of assignment order and possible regranting. Session handling, self-reduction/revocation, account-lock effects and technical concurrency mechanisms remain open. See [Context v2 D038](../../context/english/design/README.md#d038---end-shared-master-management-permission-after-loss-of-the-last-corresponding-role-assignment).

## Administrator self-granting of shared master-management permissions

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q37, option A; Context decision D037.

A System Administrator cannot grant or expand their own shared club, stadium or player master-management permissions, even when holding the corresponding business role. Another administrator must grant them through UC03, with backend enforcement and assignment history. A sole administrator can still assign these permissions to other eligible personnel, but needs another administrator to receive additional permissions themselves.

Allowing self-grants based on the corresponding business responsibility with logging was considered. The Team Leader chose consistency with D010 and separation of grantor and recipient, accepting dependence on another administrator. Self-reduction/revocation, session handling and qualifying-role lifecycle remain open; this decision adds no separate grant-approval workflow. See [Context v2 D037](../../context/english/design/README.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions).

Current confirmed follow-ups in this record: D003-D007, D009-D010, D012, D031, D034 and D037-D041. Earlier open-point notes below describe the scope at their interview round; the later follow-ups govern where those points have since been settled. D008 settles first-administrator bootstrap in [ADR 0004](0004-first-administrator-cli-bootstrap.md). D009 settles self-locking/self-revocation and last-active-administrator safeguards; D010 settles administrator self-granting of seasonal business permissions. D011 settles the separate emergency recovery flow in ADR 0004; ordinary password operations remain open. D012 settles season-wide Results Officer scope without per-match assignments. D031 establishes one personal internal account per person. D034 separately assigns shared master-record management permissions.

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok).

D013 subsequently selects action/season/time business delegation in [ADR 0005](0005-action-scoped-business-delegation.md); its administration and detailed lifecycle remain open.

O08 leaves responsibility scopes unresolved; BM-02 (PDF p.23) requires server-side authorization by role and responsibility, while QĐ4.1 (p.9) keeps seasonal data distinct. In interview Q3, the Team Leader selected season-scoped business roles rather than roles automatically applying to all seasons. A business role grants internal business access only within its assigned seasons, subject to the operation's other conditions. System account administration is system-wide and does not automatically confer business approval authority. Public Viewers can read published public information without an account.

This decision makes seasonal assignments explicit and limits unintended cross-season operations, at the cost of maintaining assignments and checking scope on internal requests. At Q3, multiple roles, separation of preparation/approval and assignment authority remained open; Q4-Q6 below settle those aspects. Match assignments, delegation, assignment effectivity, first-administrator/session policies, season creation and shared master-record permissions remain open. This record does not settle O04's public/internal field matrix or resolve all of O08. See [Context v2 D003](../../context/english/design/README.md#d003---season-scoped-business-permissions).

## Multiple roles per season

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q4, option A; Context decision D004.

An account may hold multiple business roles in the same season, rather than being restricted to one role per season. This supports combined responsibilities in a small team and attribution through one account, while requiring control of accumulated permissions and responsibility conflicts. Each operation still requires its corresponding permission in the assigned season and compliance with business conditions. Multiple roles do not by themselves permit self-approval; the Q5 follow-up below settles the separation rule. The six actors and 25 UCs remain unchanged. See [Context v2 D004](../../context/english/design/README.md#d004---multiple-business-roles-in-the-same-season).

## Separation of preparation and approval

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q5, option A; Context decision D005.

Preparation and approval require different people for seasonal regulations, club participation applications, schedules and schedule adjustments, official result confirmation and corrections to confirmed results. Anyone who prepared or edited the submitted version's content cannot approve that version, even with multiple roles. The approver must have the appropriate seasonal authority. The Team Leader explicitly stated that submission and approval were intended to separate responsibilities. Self-approval based only on role membership and selective separation were rejected in favor of a consistent rule across these workflows.

Corrections to official results must be submitted to another authorized person and approved before being applied. This explicitly confirmed v2 refinement adds a separate approval step to UC19; the existing official result remains effective pending approval, and approved corrections still require UC19/UC20 validation, history and consistent recalculation. At least two appropriately authorized people and traceability of submitted-version preparers/editors are necessary. Ordinary saves without approval remain governed by their applicable permissions. Detailed version transitions, resubmission, delegation and revocation effectivity remain open. See [Context v2 D005](../../context/english/design/README.md#d005---separate-preparation-and-approval-responsibilities).

## Seasonal role assignment administration

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q6, option A; Context decision D006.

Only the System Administrator may grant or revoke business roles and their season scopes; the Organizing Committee / Season Manager cannot directly change these assignments. Compared with allowing Season Managers to assign staff roles, this preserves UC03's administration responsibility and a single accountable management point, at the cost of coordinating staffing changes with the administrator. Server-side checks and BM-06 logs apply. Administration authority does not automatically grant business approval rights or bypass D005. Grant/revocation effectivity, active-session handling, first-administrator bootstrap, administrator self-assignment/self-locking and last-administrator protection remain open. No additional staffing-request workflow is established. See [Context v2 D006](../../context/english/design/README.md#d006---system-administrator-manages-seasonal-role-assignments).

## Session invalidation after access changes

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q7, option A; Context decision D007.

Successfully saving an account role/season-scope change, including an additional grant, or locking the account invalidates all existing sessions for that account. The next internal request using an old session is rejected, and the application displays an explicit account/permission-change notice asking the user to log in again. Locked accounts cannot log in; unlocking does not revive old sessions. The notification appears upon receipt of the server response; no real-time notification infrastructure is selected.

Retaining sessions while checking current permissions was considered; it can also notify users and must reject unauthorized actions. The Team Leader preferred invalidation for a clearer user-visible boundary. Previously completed operations are not automatically undone. Session technology/storage, detailed error contracts, unsaved-input handling and the ordering of in-flight transactions concurrent with access changes remain open. This behavioral decision does not select cookie/JWT or supporting infrastructure. See [Context v2 D007](../../context/english/design/README.md#d007---invalidate-sessions-after-permission-changes-or-account-locking).

## Administrator access safeguards

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q9, option A; Context decision D009.

A System Administrator cannot lock their own account or revoke their own System Administrator role. Reject any locking or administrator-role revocation that would leave no active System Administrator, defined as an account that is not locked/disabled and still holds the System Administrator role. Preserve this condition under concurrent operations, including administrators attempting to lock or remove each other's administrator access. A previously read account count alone is insufficient; the concrete concurrency mechanism is not selected here.

Allowing self-locking/self-revocation when another active administrator remains was considered. The Team Leader instead confirmed prohibition for clearer rules and prevention of accidental self-loss of administration access, accepting dependence on another administrator for their account's deactivation or removal of the administrator role. D010 below settles self-granting seasonal business permissions. D011 settles emergency recovery in ADR 0004; password changes and transaction implementation remain open. This decision does not prohibit ordinary profile/password changes. See [Context v2 D009](../../context/english/design/README.md#d009---protect-administrator-access-and-prohibit-self-locking).

## Administrator self-granting of business permissions

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q10, option A; Context decision D010.

A System Administrator cannot grant themselves additional seasonal business roles or expand their own season scope. Another System Administrator must make those grants/expansions through UC03. Administrators may hold business roles, and a sole administrator can still assign business roles to other staff. Allowing self-granting with audit logging was considered; the Team Leader chose separation of grantor and recipient, accepting that an administrator needing additional business access depends on another administrator.

Server-side checks must consider the recipient and the requested role/scope. Successful changes follow BM-06 logging and D007 session invalidation. D005 continues to govern business preparation and approval independently of who assigned the role. D011 settles emergency recovery in ADR 0004; password changes, self-reduction of business permissions and implementation contracts remain open. See [Context v2 D010](../../context/english/design/README.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions).

## Results Officer match scope

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q12, option A; Context decision D012.

A Results Officer may create and update match reports and unofficial results for all matches in an assigned season, subject to status and business validation. The first version does not require per-match assignments or assignment-management functionality. Compared with individual match assignments, this simplifies collaboration and staff substitution in a small team, while not restricting data-entry responsibility to particular matches through authorization. Change history must identify operators, and concurrent editing must not silently overwrite changes.

This decision grants no access outside assigned seasons and no additional rights to other roles. Official result confirmation and correction of confirmed results still require their corresponding permissions and D005's separation of preparation and approval. Detailed states, correction authority and concurrency contracts remain open. See [Context v2 D012](../../context/english/design/README.md#d012---season-wide-results-officer-scope-without-per-match-assignments).

## One personal internal account per person

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q31, option A; Context decision D031.

Each person has one personal internal account across the system, with no shared accounts/credentials. Combined or changed duties use role assignments on that account. The administrator verifies identity when provisioning and prevents another account for a person already represented. Separation-of-person checks rely on the personal account under this one-to-one policy; username uniqueness alone does not prove person uniqueness.

Multiple accounts linked to a separate person identity were considered. The Team Leader chose simpler attribution and separation checks consistent with multiple roles, accepting identity/duplicate checks at provisioning. Required identity fields, duplicate detection, storage constraints and account/password lifecycle remain open. No separate personnel subsystem, identity provider or government-identity collection is selected. See [Context v2 D031](../../context/english/design/README.md#d031---one-personal-internal-account-per-person).

## Separately assigned shared master-management permissions

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q34, option A; Context decision D034.

The System Administrator separately assigns/revokes shared permissions through UC03 for club master management (Season Manager responsibility, UC07), stadium master management (Scheduling Officer responsibility, UC12) and player master profiles (Registration Officer responsibility, UC09). A seasonal role does not automatically grant shared-master management. This applies to shared records without granting access to other seasons' applications/internal business data and creates no new actor or UC.

Automatically deriving global shared-management access from a corresponding role in any season was considered. The Team Leader chose an explicit shared-data boundary at the cost of additional permission configuration. Exact representation, qualifying-role lifecycle and session rules for these permissions (D037 above settles self-granting), field access, historical preservation and write constraints remain open. No destructive deletion or new operation beyond applicable UCs/integrity rules is authorized. See [Context v2 D034](../../context/english/design/README.md#d034---separately-assigned-shared-master-record-management-permissions).
