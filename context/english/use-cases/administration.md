# Authentication and administration: UC01-UC04

[Entry point](../README.md) · [Business/BM/QĐ](../business.md) · [Quality](../quality.md) · [Open decisions](../open-decisions.md)

Current UC flows retain source codes/pages and incorporate explicitly approved refinements. The authoritative rules for this domain are linked below; approval/source/rationale evidence is in English ADRs. These are Context documents, not generated feature Specifications. Analysis figures are not approved API/schema designs. See [sources](../sources.md).

## UC01

Current rules: [D007](administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking).

**Log in**

Source: §2.4.1.1, pp.67-69 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows internal users to authenticate to access competition-management functions. Permissions follow assigned roles. Public viewers do not need to log in to view information permitted for publication.

**Description:**

Authenticate users and allow access according to their permissions.

**Actors:**

System Administrator, Competition Manager, and business staff issued accounts.

**Preconditions:**

1. The user has an account.
2. The system can process authentication requests.

**Postconditions:**

1. The user's identity is authenticated.
2. The user receives access according to their role.
3. The login event is recorded under security requirements.

**Main flow:**

1. The user opens the login function.
2. The system displays the form.
3. The user enters account credentials and password.
4. The system validates the input.
5. The system verifies the login credentials.
6. The system checks account status and permissions.
7. The system creates a valid session and records the login event.
8. The system redirects the user to the appropriate interface.

**Alternative flow:**

1. Required data is missing or incorrectly formatted: the system requests re-entry.

**Exceptions:**

1. Incorrect credentials: reject login and display an appropriate message.
2. Locked or disabled account: deny access.
3. Authentication or storage failure: report that processing is unavailable and do not create a valid logged-in state.

## UC02

**Log out**

Source: §2.4.1.2, pp.69-71 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows the user to end the current session. After logout, the ended session cannot be reused for internal operations.

**Description:**

End an authenticated working session.

**Actors:**

Logged-in internal user.

**Preconditions:**

The user has a current login session.

**Postconditions:**

1. The session is ended according to the system's authentication mechanism.
2. The user is redirected to the unauthenticated interface.
3. The logout event is recorded according to logging policy.

**Main flow:**

1. The user selects Log out.
2. The system checks the current session.
3. The system ends or invalidates the session using the implemented mechanism.
4. The system records the event.
5. The system redirects to the unauthenticated interface.

**Alternative flow:**

Session already expired: return the user to an unauthenticated state and display an appropriate message.

**Exceptions:**

Session-processing failure: report the error and do not allow further internal operations using an invalid session.

## UC03

Current rules: [D003](administration.md#d003---season-scoped-business-permissions), [D004](administration.md#d004---multiple-business-roles-in-the-same-season), [D006](administration.md#d006---system-administrator-manages-seasonal-role-assignments), [D009](administration.md#d009---protect-administrator-access-and-prohibit-self-locking), [D010](administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions), [D031](administration.md#d031---one-personal-internal-account-per-person), [D034](administration.md#d034---separately-assigned-shared-master-record-management-permissions), [D037](administration.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions), [D038](administration.md#d038---end-shared-master-management-permission-after-loss-of-the-last-corresponding-role-assignment), [D039](administration.md#d039---invalidate-sessions-after-shared-master-management-permission-changes), [D040](administration.md#d040---allow-administrator-self-reduction-of-business-permissions), [D041](administration.md#d041---retain-shared-master-management-assignments-while-an-account-is-locked).

**Manage accounts and roles**

Source: §2.4.1.3, pp.72-74 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows the administrator to manage internal user accounts, account status, and assigned roles. The function must ensure users perform business activities only within approved permissions.

**Description:**

Create, update, lock, unlock accounts and assign roles to users.

**Actors:**

System Administrator.

**Preconditions:**

1. The administrator is logged in.
2. The administrator has permission to manage accounts and roles.

**Postconditions:**

1. Account or role information is validly updated.
2. Important changes are recorded in the log.

**Main flow:**

1. The administrator opens account management.
2. The system displays the account list.
3. The administrator selects create, edit, lock, unlock, or assign roles.
4. The system validates data and permission to act.
5. The administrator confirms the change.
6. The system saves the data.
7. The system records the log and reports the result.

**Alternative flow:**

The administrator only searches accounts: display information within the permitted scope.

**Exceptions:**

1. Insufficient permissions: reject the operation.
2. Duplicate or invalid account information: request correction.
3. Data-save failure: do not retain partial changes.

## UC04

**Search activity logs**

Source: §2.4.1.4, pp.75-76 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows authorized users to inspect important-operation history for checking, traceability, and accountability. Logs must identify the person, time, affected object, and changed content as required by security requirements.

**Description:**

Search and view business-operation logs within permitted access.

**Actors:**

System Administrator.

**Preconditions:**

1. The user is logged in.
2. The user has permission to search logs.

**Postconditions:**

Display logs matching the search conditions; searching does not modify log data.

**Main flow:**

1. The user opens activity-log search.
2. The system displays search conditions.
3. The user enters conditions such as time, operator, business-operation type, or object.
4. The system checks access rights.
5. The system searches logs.
6. The system displays the result list.
7. The user selects a record to view details.

**Alternative flow:**

No filters entered: display the list within permitted query limits.

**Exceptions:**

1. Insufficient permissions: deny access.
2. No results: report that no matching data was found.
3. Query failure: report that logs cannot be loaded.

## Current confirmed rules

The rules below are the authoritative current policy for this domain. The UC flows/source clauses above are read with these explicit refinements, not as a separate version. Approval evidence and interview-time notes are in the linked English ADR records; outstanding work is in [open decisions](../open-decisions.md).

### D003 - Season-scoped business permissions

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0003-season-scoped-business-permissions.md#d003-english-evidence).

- **Source:** O08; BM-02, PDF p.23; QĐ4.1, PDF p.9; responsibility scopes in §1.3.3 p.35 and §2.1 p.53.

- **Decision:** Business roles are granted for assigned seasons. Holding a business role in one season does not grant internal business access to another season. System account administration is system-wide and does not automatically grant business approval authority. Public Viewers may access published public information without an account.

- **Consequences:** Internal requests must be checked against the operator's applicable role and season scope, as well as the operation's business conditions. UI visibility alone is insufficient. Detailed permissions and schemas remain to be designed.

### D004 - Multiple business roles in the same season

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0003-season-scoped-business-permissions.md#d004-english-evidence).

- **Source:** O08; BM-02, PDF p.23; six actors in §1.3.3 p.35 and §2.1 p.53; [D003](administration.md#d003---season-scoped-business-permissions).

- **Decision:** An account may be assigned multiple business roles in the same season. Every operation must still have its corresponding permission in the assigned season and satisfy the applicable business conditions. Holding multiple roles does not itself authorize self-approval.

- **Consequences:** Account/assignment design and authorization checks must support multiple seasonal role assignments. The six business actors and 25 UCs remain unchanged; account-role cardinality does not introduce new actors.

### D005 - Separate preparation and approval responsibilities

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0003-season-scoped-business-permissions.md#d005-english-evidence).

- **Source:** O07/O08; QĐ6, PDF p.11; UC06 pp.79-82, UC08 pp.85-88, UC13-UC14 pp.100-106 and UC18-UC19 pp.115-121; [D003](administration.md#d003---season-scoped-business-permissions)/[D004](administration.md#d004---multiple-business-roles-in-the-same-season).

- **Decision:** Preparation and approval must be performed by different people for seasonal regulations, club participation applications, schedules and schedule adjustment requests, official result confirmation and correction of confirmed results. Anyone who prepared or edited the content of the submitted version cannot approve that version, even if holding the required approval role. The approver must have the appropriate authority in the target season.

- **Correction flow:** A proposed correction to an official result must be submitted for a different authorized person's approval before the correction is applied. This is an explicitly confirmed v2 refinement of UC19, not a claim that v1 already specified this separate approval step. The existing official result remains effective pending approval; the approved correction must follow UC19/UC20 validation, history and consistent recalculation requirements.

- **Consequences:** Supporting multiple roles must not bypass the separation rule. Version history must identify content preparers/editors so approval eligibility can be checked. At least two different appropriately authorized people are required to complete an approval workflow. Ordinary saves without an approval step continue under their applicable permissions.

### D006 - System Administrator manages seasonal role assignments

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0003-season-scoped-business-permissions.md#d006-english-evidence).

- **Source:** O08; UC03, PDF pp.72-74; BM-02/BM-06, pp.23-24; [D003](administration.md#d003---season-scoped-business-permissions)-[D005](administration.md#d005---separate-preparation-and-approval-responsibilities).

- **Decision:** Only the System Administrator may grant or revoke business roles and their season scopes. The Organizing Committee / Season Manager cannot directly change role assignments. System account administration does not automatically grant business approval authority.

- **Consequences:** Role/season assignment changes are administered through UC03, checked on the server and logged under BM-06. Business approval remains subject to [D003](administration.md#d003---season-scoped-business-permissions)-[D005](administration.md#d005---separate-preparation-and-approval-responsibilities). This decision does not introduce a new staffing-request workflow.

### D007 - Invalidate sessions after permission changes or account locking

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0003-season-scoped-business-permissions.md#d007-english-evidence).

- **Source:** O08/O12; UC01-UC03, PDF pp.67-74; BM-01/BM-02, p.23; [D003](administration.md#d003---season-scoped-business-permissions)/[D006](administration.md#d006---system-administrator-manages-seasonal-role-assignments).

- **Decision:** Successfully saving a change to an account's roles or season scopes, including granting additional access, or locking the account invalidates all its existing sessions. On the next internal request, the server rejects the old session and the application informs the user that the account or permissions changed and asks them to log in again. A locked account cannot log in; unlocking it does not restore old sessions.

- **Notification:** The confirmed Vietnamese message is: “Phiên đăng nhập không còn hiệu lực do tài khoản hoặc quyền truy cập đã thay đổi. Vui lòng đăng nhập lại.” English meaning: “Your session is no longer valid because your account or access permissions have changed. Please log in again.” The notification is displayed when the application receives the server response; no real-time notification mechanism is required by this decision.

- **Consequences:** Old sessions cannot be reused for internal access after invalidation. Successfully completed prior operations and their history are not automatically undone by a permission change. This is a behavioral contract and does not select cookie/JWT, session storage or supporting infrastructure.

### D008 - First System Administrator bootstrap through a server CLI

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0004-first-administrator-cli-bootstrap.md#d008-english-evidence).

- **Source:** O08; UC03, PDF pp.72-74; BM-03/BM-06, pp.23-24; CN-03, p.26; [D003](administration.md#d003---season-scoped-business-permissions)/[D006](administration.md#d006---system-administrator-manages-seasonal-role-assignments).

- **Decision:** Initialize the first System Administrator using a CLI run on the server. Initialization is allowed only when no System Administrator account exists, including locked accounts. Concurrent executions must not bypass that condition: at most one bootstrap administrator can be created, without partial initialization.

- **Credential safeguards:** The installer supplies the username and password; there are no default credentials. Password entry must be secure, with no password in command-line arguments, logs or the repository. Hash the password before storing it; the hashing algorithm remains undecided.

- **Access boundary:** Do not expose a public bootstrap API or web page. The initial account receives system administration authority; seasonal business roles are managed separately. After initialization, ordinary account management uses UC03.

### D009 - Protect administrator access and prohibit self-locking

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0003-season-scoped-business-permissions.md#d009-english-evidence).

- **Source:** O08; UC03, PDF pp.72-74; BM-02/BM-06, pp.23-24; [D006](administration.md#d006---system-administrator-manages-seasonal-role-assignments)-[D008](administration.md#d008---first-system-administrator-bootstrap-through-a-server-cli).

- **Decision:** A System Administrator cannot lock their own account or revoke their own System Administrator role. Reject any account-locking or administrator-role revocation operation that would leave no active System Administrator. An active System Administrator is an account that is not locked/disabled and still holds the System Administrator role.

- **Concurrency:** Preserve the at-least-one-active-administrator condition under concurrent operations, including administrators attempting to lock or remove each other's administrator access. Checking a previously loaded account count alone is insufficient; the concurrency mechanism remains to be designed.

### D010 - Prohibit administrator self-granting of seasonal business permissions

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0003-season-scoped-business-permissions.md#d010-english-evidence).

- **Source:** O08; UC03, PDF pp.72-74; BM-02/BM-06, pp.23-24; [D003](administration.md#d003---season-scoped-business-permissions)-[D006](administration.md#d006---system-administrator-manages-seasonal-role-assignments)/[D009](administration.md#d009---protect-administrator-access-and-prohibit-self-locking).

- **Decision:** A System Administrator must not grant themselves an additional seasonal business role or expand their own season scope. An administrator may hold business roles, but another System Administrator must grant or expand those assignments through UC03. A sole administrator can still assign business roles to other staff.

- **Consequences:** Server-side authorization must check the assignment's recipient as well as the requested role/scope. [D007](administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking) session invalidation and BM-06 logging apply to successful changes. [D005](administration.md#d005---separate-preparation-and-approval-responsibilities)'s separate preparer/approver rule still applies to subsequent business operations; another administrator granting a role does not itself approve any business content.

### D011 - Emergency recovery CLI for existing administrators

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0004-first-administrator-cli-bootstrap.md#d011-english-evidence).

- **Source:** O08/O12; UC03, PDF pp.72-74; BM-02/BM-03/BM-06, pp.23-24; [D007](administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking)-[D010](administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions). This is an explicitly approved v2 operational refinement, not an additional actor or UC.

- **Decision:** Provide a separate emergency recovery CLI on the server for an operator with server access. It may reset the password and/or unlock an existing account that already has the System Administrator role. It must not create accounts, grant the System Administrator role or change seasonal business permissions. Do not expose a public API or web page for this emergency recovery flow.

- **Credential/session safeguards:** Enter the replacement password securely, never through command-line arguments, logs or the repository, and hash it before storage. Successful recovery invalidates all existing sessions for the target account.

- **Audit:** Require the recovery reason and record the operator's identity, time, target account and operation type; never record passwords.

### D012 - Season-wide Results Officer scope without per-match assignments

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0003-season-scoped-business-permissions.md#d012-english-evidence).

- **Source:** O08; UC16-UC17, PDF pp.109-114; BM-02/BM-06, pp.23-24; AT-02, p.32; [D003](administration.md#d003---season-scoped-business-permissions)/[D005](administration.md#d005---separate-preparation-and-approval-responsibilities).

- **Decision:** A Results Officer may create and update match reports and unofficial results for any match in an assigned season, subject to the applicable match status and business validations. The first version does not require per-match assignment or a match-assignment management mechanism.

- **Permission boundary:** This scope does not itself grant official result confirmation or correction of confirmed results. Those require their corresponding permissions and [D005](administration.md#d005---separate-preparation-and-approval-responsibilities)'s separation of preparation and approval. It grants no access to another season or additional rights to other roles.

- **Consequences:** Record the operator of each change in history and prevent silent overwrites under concurrent edits. Season scope does not bypass business validation or conflict handling.

### D031 - One personal internal account per person

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0003-season-scoped-business-permissions.md#d031-english-evidence).

- **Source:** O08/O12; UC03, PDF pp.72-74; BM-02/BM-06, pp.23-24; [D004](administration.md#d004---multiple-business-roles-in-the-same-season)/[D005](administration.md#d005---separate-preparation-and-approval-responsibilities)/[D017](../design/access-control.md#d017---three-different-people-for-a-delegation-grant).

- **Decision:** Each person has one personal internal account across the system; shared accounts/credentials are not permitted. Combined or changed responsibilities use role assignments on that account, rather than separate accounts for the same person.

- **Identity and separation:** The administrator verifies identity during account creation and prevents another account for an existing person. Separation-of-person checks rely on the person's individual account under this one-to-one policy. Identity fields and duplicate-detection details remain to be designed; a unique username alone does not establish person uniqueness.

### D034 - Separately assigned shared master-record management permissions

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0003-season-scoped-business-permissions.md#d034-english-evidence).

- **Source:** O04/O08/O12; UC03 pp.72-74, UC07 pp.82-84, UC09 pp.88-90 and UC12 pp.97-99; shared records in PDF §1.3.4.1 pp.37-38; [D003](administration.md#d003---season-scoped-business-permissions)/[D006](administration.md#d006---system-administrator-manages-seasonal-role-assignments)/[D033](publication.md#d033---internal-viewing-follows-business-responsibility).

- **Decision:** Distinguish shared management permissions for club, stadium and player master records. The System Administrator separately grants/revokes them through UC03 for personnel carrying the corresponding business responsibility; a seasonal role alone does not automatically grant shared-record management.

| Shared record group | Corresponding business responsibility |
|---|---|
| Club master records - UC07 | Organizing Committee / Season Manager |
| Stadium master records - UC12 | Scheduling Officer |
| Player master profiles - UC09 | Registration Officer |

- **Scope:** These permissions apply to shared master records, not participation applications or internal seasonal records from other seasons. This resolves the shared-data scope left open by [D003](administration.md#d003---season-scoped-business-permissions) alongside seasonal business permissions. Keep the existing actors/UCs; no new actor is introduced.

### D037 - Prohibit administrator self-granting of shared master-management permissions

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0003-season-scoped-business-permissions.md#d037-english-evidence).

- **Source:** O08/O12; UC03 and [D010](administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions)/[D034](administration.md#d034---separately-assigned-shared-master-record-management-permissions). This extends the confirmed self-grant safeguard to separately assigned shared master-management permissions.

- **Decision:** A System Administrator cannot grant or expand their own shared club, stadium or player master-management permissions. Another System Administrator must make the grant through UC03. Holding the corresponding business role does not permit self-granting.

- **Administration boundary:** A sole administrator may still grant these permissions to other eligible personnel. Receiving additional shared-management permissions themselves requires a second administrator. Enforce the restriction on the backend and retain assignment history.

### D038 - End shared master-management permission after loss of the last corresponding role assignment

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0003-season-scoped-business-permissions.md#d038-english-evidence).

- **Source:** O08/O12; UC03 and [D034](administration.md#d034---separately-assigned-shared-master-record-management-permissions)/[D037](administration.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions).

- **Decision:** Shared club master-management permission requires a Season Manager role assignment in at least one season; stadium master-management requires a Scheduling Officer assignment in at least one season; player master-management requires a Registration Officer assignment in at least one season. A corresponding role remains a prerequisite after the separate permission grant.

- **Termination and restoration:** Removing the person's last corresponding role assignment ends the related shared-management permission and preserves history. Assigning a corresponding role again does not revive that permission; a new separate grant under [D034](administration.md#d034---separately-assigned-shared-master-record-management-permissions)/[D037](administration.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions) is required. Retaining a corresponding assignment in another season prevents this particular termination trigger.

- **Boundary:** Loss means removal of the role assignment, not merely the season reaching its end date. Season closure/archive behavior remains undecided. This decision does not grant access to other seasons' internal records.

### D039 - Invalidate sessions after shared master-management permission changes

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0003-season-scoped-business-permissions.md#d039-english-evidence).

- **Source:** O08/O12; UC03 and [D007](administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking)/[D022](../design/access-control.md#d022---invalidate-recipient-sessions-when-delegation-starts-or-ends)/[D030](../design/architecture.md#d030---recheck-current-session-and-authority-at-the-final-decision-point-of-writes)/[D034](administration.md#d034---separately-assigned-shared-master-record-management-permissions)/[D038](administration.md#d038---end-shared-master-management-permission-after-loss-of-the-last-corresponding-role-assignment).

- **Decision:** Successfully granting, expanding, revoking or terminating shared master-management permissions invalidates all existing sessions of the affected recipient, including termination under [D038](administration.md#d038---end-shared-master-management-permission-after-loss-of-the-last-corresponding-role-assignment). The next internal request using an old session is rejected; the user must log in again with current permissions.

- **User notice:** Display the [D007](administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking) notice: “Phiên đăng nhập không còn hiệu lực do tài khoản hoặc quyền truy cập đã thay đổi. Vui lòng đăng nhập lại.” No real-time notification infrastructure is required.

- **In-flight writes:** [D030](../design/architecture.md#d030---recheck-current-session-and-authority-at-the-final-decision-point-of-writes) still requires final authorization/session revalidation inside the business transaction. Permission/session changes and concurrent writes must have consistent ordering; previously valid completed operations are not undone.

### D040 - Allow administrator self-reduction of business permissions

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0003-season-scoped-business-permissions.md#d040-english-evidence).

- **Source:** O08/O12; UC03 and [D007](administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking)/[D009](administration.md#d009---protect-administrator-access-and-prohibit-self-locking)/[D010](administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions)/[D037](administration.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions)-[D039](administration.md#d039---invalidate-sessions-after-shared-master-management-permission-changes).

- **Decision:** Through UC03, a System Administrator may remove their own seasonal business roles, narrow their own season scope or revoke their own shared master-management permissions. The operation must only reduce permission, without granting or expanding their own access.

- **Consequences:** Preserve change history. Losing the last corresponding role assignment ends related shared-management permission under [D038](administration.md#d038---end-shared-master-management-permission-after-loss-of-the-last-corresponding-role-assignment). Apply session invalidation under [D007](administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking)/[D039](administration.md#d039---invalidate-sessions-after-shared-master-management-permission-changes) and final authorization checks under [D030](../design/architecture.md#d030---recheck-current-session-and-authority-at-the-final-decision-point-of-writes). A later regrant requires another administrator under [D010](administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions)/[D037](administration.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions). Preserve history and responsibility for earlier operations.

- **Administration boundary:** [D009](administration.md#d009---protect-administrator-access-and-prohibit-self-locking) still prohibits self-locking and removal of the person's own System Administrator role. [D040](administration.md#d040---allow-administrator-self-reduction-of-business-permissions) permits business-permission reduction only.

### D041 - Retain shared master-management assignments while an account is locked

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0003-season-scoped-business-permissions.md#d041-english-evidence).

- **Source:** O08/O12; UC03 and [D007](administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking)/[D020](../design/access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost)/[D034](administration.md#d034---separately-assigned-shared-master-record-management-permissions)/[D038](administration.md#d038---end-shared-master-management-permission-after-loss-of-the-last-corresponding-role-assignment)-[D040](administration.md#d040---allow-administrator-self-reduction-of-business-permissions).

- **Decision:** Locking an account prevents login and all use of its permissions, and invalidates all sessions under [D007](administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking). Locking alone does not remove its role assignments or terminate separately granted shared master-management permissions.

- **Unlocking:** Require a new login; old sessions never revive. The person may use only permissions still valid at that time. Removal of the last corresponding role assignment during the lock still ends the shared permission under [D038](administration.md#d038---end-shared-master-management-permission-after-loss-of-the-last-corresponding-role-assignment), and unlocking does not restore it.

- **Delegation boundary:** Business delegations remain governed by [D020](../design/access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost): delegation terminated because of account locking does not automatically revive on unlocking. Retention of shared assignments does not change that policy.
