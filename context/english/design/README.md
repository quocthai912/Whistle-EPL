# Whistle-EPL Design Context - Context Package v2

**Package status:** DRAFT - interview in progress; not approved as a whole.

This design supplement builds on [approved Context v1](../README.md). V1 remains the approved business foundation; its approval, requirements, Phase statuses and checkboxes are unchanged. Confirmed decisions below do not establish implementation, acceptance, or readiness of any Phase. English and [Vietnamese](../../vietnamese/design/README.md) are equivalent views of this supplement.

## Documentation conventions

Confirmed by the Team Leader on 2026-10-25: design documentation lives in `context/english/design/` and `context/vietnamese/design/`; package version remains metadata rather than a directory name. Keep these language views semantically equivalent. `docs/adr/` and all ADR records are English-only; Vietnamese design documents link to the same English records.

## Confirmed decisions

### D001 - Modular, layered monolithic backend

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** Interview Q1 proposed option A; the Team Leader replied “Tôi chọn A.” (“I choose A.”).
- **Source:** O12; CN-01-CN-04, PDF p.26; centralized data constraint in §1.2.6.1; three-member team and source project plan in §1.5 pp.50-52.
- **Decision:** One backend deployed as a single unit, organized into business modules with clear request-handling, business-processing and data-access responsibilities; one centralized relational database.
- **Alternatives discussed:** A modular layered monolith; a monolith organized only by technical layers; independently deployed services.
- **Basis and consequences:** Business module boundaries help organize team responsibilities while a single backend/database keeps deployment and cross-functional transactions manageable. Module dependencies require discipline. Exact modules, dependency rules and transaction boundaries still need confirmation.
- **Record:** [ADR 0001](../../../docs/adr/0001-modular-layered-backend.md).
- **Affected Phases:** PHASE 1 foundation and PHASE 2-PHASE 10 design/integration. No Phase status changes.
- **Follow-up:** D002 below settles the stack and REST API style. Frontend rendering/deployment, schema/ERD, detailed API contracts, authentication/sessions, hashing, encoding, transport protection, audit, conflict handling and transaction design remain open. D001 settles the backend architectural shape within O12.

### D002 - Approved technology stack and API style

- **Status:** APPROVED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q2, the Team Leader confirmed option A and explicitly approved the technology stack as final for Context Package v2.
- **Source:** O12; CN-01-CN-04, PDF p.26; Q2 confirmation. The selection principle prioritizes technologies the team has practiced, subject to course constraints. The confirmation does not establish individual members' experience or additional course constraints.
- **Decision:** Frontend: React + TypeScript. Backend: NestJS + TypeScript. Database: PostgreSQL. ORM: Prisma ORM. API style: REST API. Architecture: Modular Monolith combined with Layered Architecture, consistent with D001.
- **Alternatives/basis:** Q2 contrasted prioritizing practiced technologies with adopting a new stack as a learning objective. The Team Leader selected A and supplied the final stack; no named alternative stack was compared or approved in this interview.
- **Consequences:** Chapter 3 design and subsequent implementation planning use this approved stack. Module boundaries, the PostgreSQL schema, Prisma mappings and REST contracts must be designed consistently with it.
- **Record:** [ADR 0002](../../../docs/adr/0002-approved-technology-stack.md).
- **Affected Phases:** PHASE 1-PHASE 10. No Phase status changes.
- **Still open:** Product/library/runtime versions, frontend rendering and routing, build/UI/testing tools, hosting and deployment topology, API paths/payloads/errors, authentication/sessions, hashing, schema/ERD, transaction/conflict handling, encoding, transport protection and operational tooling. None is implicitly selected by this stack approval.

### D003 - Season-scoped business permissions

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q3, the Team Leader confirmed option A: “Có, tôi xác nhận phương án A.” (“Yes, I confirm option A.”).
- **Source:** O08; BM-02, PDF p.23; QĐ4.1, PDF p.9; responsibility scopes in §1.3.3 p.35 and §2.1 p.53.
- **Decision:** Business roles are granted for assigned seasons. Holding a business role in one season does not grant internal business access to another season. System account administration is system-wide and does not automatically grant business approval authority. Public Viewers may access published public information without an account.
- **Alternatives/basis:** Season-scoped business roles versus business roles applying to all seasons. The chosen scope makes assignments explicit and limits unintended cross-season operations, at the cost of maintaining seasonal assignments.
- **Consequences:** Internal requests must be checked against the operator's applicable role and season scope, as well as the operation's business conditions. UI visibility alone is insufficient. Detailed permissions and schemas remain to be designed.
- **Record:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md).
- **Affected Phases:** PHASE 1 permission foundation and PHASE 2-PHASE 10 authorized workflows and verification. No Phase status changes.
- **Follow-up:** D004 settles multiple roles, D005 separation of preparation and approval, D006 assignment authority and D007 session invalidation after access changes. D008 settles first-administrator bootstrap. D012 settles Results Officer scope without per-match assignments. D013 selects action/season/time delegation, with administration responsibilities confirmed in D014 and lifecycle details still open. Season creation and permissions for shared club/player/stadium master records remain open, as does O04's full public/internal field matrix.

### D004 - Multiple business roles in the same season

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q4, the Team Leader selected option A: “tôi chọn phương án A.” (“I choose option A.”).
- **Source:** O08; BM-02, PDF p.23; six actors in §1.3.3 p.35 and §2.1 p.53; D003.
- **Decision:** An account may be assigned multiple business roles in the same season. Every operation must still have its corresponding permission in the assigned season and satisfy the applicable business conditions. Holding multiple roles does not itself authorize self-approval.
- **Alternatives/basis:** Allow multiple roles per account in a season versus restrict each account to one role per season. Multiple roles support a small team's combined responsibilities and attribution through a single account, while requiring control of accumulated permissions and responsibility conflicts.
- **Consequences:** Account/assignment design and authorization checks must support multiple seasonal role assignments. The six business actors and 25 UCs remain unchanged; account-role cardinality does not introduce new actors.
- **Record:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#multiple-roles-per-season).
- **Affected Phases:** PHASE 1 role administration and dependent authorized workflows in PHASE 2-PHASE 10. No Phase status changes.
- **Follow-up:** D005 settles separation of preparation and approval, D006 assignment authority and D007 session invalidation after access changes. D012 settles Results Officer match scope. D013 selects the delegation model. Detailed action permissions and delegation administration remain open.

### D005 - Separate preparation and approval responsibilities

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q5, the Team Leader selected option A and explained that submission and approval were intended from the outset to separate these responsibilities.
- **Source:** O07/O08; QĐ6, PDF p.11; UC06 pp.79-82, UC08 pp.85-88, UC13-UC14 pp.100-106 and UC18-UC19 pp.115-121; D003/D004.
- **Decision:** Preparation and approval must be performed by different people for seasonal regulations, club participation applications, schedules and schedule adjustment requests, official result confirmation and correction of confirmed results. Anyone who prepared or edited the content of the submitted version cannot approve that version, even if holding the required approval role. The approver must have the appropriate authority in the target season.
- **Correction flow:** A proposed correction to an official result must be submitted for a different authorized person's approval before the correction is applied. This is an explicitly confirmed v2 refinement of UC19, not a claim that v1 already specified this separate approval step. The existing official result remains effective pending approval; the approved correction must follow UC19/UC20 validation, history and consistent recalculation requirements.
- **Alternatives/basis:** Mandatory separation, self-approval with sufficient roles, or separation only for selected operations. The Team Leader confirmed mandatory separation throughout the listed approval workflows because submission and approval represent distinct responsibilities.
- **Consequences:** Supporting multiple roles must not bypass the separation rule. Version history must identify content preparers/editors so approval eligibility can be checked. At least two different appropriately authorized people are required to complete an approval workflow. Ordinary saves without an approval step continue under their applicable permissions.
- **Record:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#separation-of-preparation-and-approval).
- **Affected Phases:** PHASE 1 authorization foundation, PHASE 2 regulations, PHASE 3 club applications, PHASE 4 schedules, PHASE 5 results and PHASE 10 integration/acceptance. No Phase status changes.
- **Still open:** Detailed states/transitions, submitted-version editing/resubmission rules, delegation administration and assignment effectivity and approval eligibility after permission revocation. This decision does not automatically add approval steps to unrelated ordinary saves or decide news/report approval policies.

### D006 - System Administrator manages seasonal role assignments

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q6, the Team Leader selected option A: “Tôi chọn phương án A.” (“I choose option A.”).
- **Source:** O08; UC03, PDF pp.72-74; BM-02/BM-06, pp.23-24; D003-D005.
- **Decision:** Only the System Administrator may grant or revoke business roles and their season scopes. The Organizing Committee / Season Manager cannot directly change role assignments. System account administration does not automatically grant business approval authority.
- **Alternatives/basis:** Administrator-only assignment management versus allowing Season Managers to assign staff roles within their seasons. The chosen approach keeps one accountable administration point and remains consistent with UC03, at the cost of coordination with the administrator for staffing changes.
- **Consequences:** Role/season assignment changes are administered through UC03, checked on the server and logged under BM-06. Business approval remains subject to D003-D005. This decision does not introduce a new staffing-request workflow.
- **Record:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#seasonal-role-assignment-administration).
- **Affected Phases:** PHASE 1 account/role administration and dependent authorized workflows in PHASE 2-PHASE 10. No Phase status changes.
- **Follow-up:** D007 settles session invalidation after role/scope changes or account locking. D008 settles first-administrator bootstrap. D009 settles self-locking/self-revocation and last-active-administrator protection. D010 prohibits self-granting or expansion of seasonal business permissions. D012 settles Results Officer match scope. D013 selects the delegation model; its administration and in-flight transaction ordering remain unresolved.

### D007 - Invalidate sessions after permission changes or account locking

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** After discussing Q7's alternatives and notification behavior, the Team Leader confirmed option A: “Hợp lý, chọn A thôi.” (“That makes sense, choose A.”).
- **Source:** O08/O12; UC01-UC03, PDF pp.67-74; BM-01/BM-02, p.23; D003/D006.
- **Decision:** Successfully saving a change to an account's roles or season scopes, including granting additional access, or locking the account invalidates all its existing sessions. On the next internal request, the server rejects the old session and the application informs the user that the account or permissions changed and asks them to log in again. A locked account cannot log in; unlocking it does not restore old sessions.
- **Notification:** The confirmed Vietnamese message is: “Phiên đăng nhập không còn hiệu lực do tài khoản hoặc quyền truy cập đã thay đổi. Vui lòng đăng nhập lại.” English meaning: “Your session is no longer valid because your account or access permissions have changed. Please log in again.” The notification is displayed when the application receives the server response; no real-time notification mechanism is required by this decision.
- **Alternatives/basis:** Invalidate all existing sessions versus retain sessions while applying current permissions on subsequent requests. Both alternatives must reject operations without current permission. The Team Leader chose invalidation for a clear user-visible boundary and an explicit re-login message.
- **Consequences:** Old sessions cannot be reused for internal access after invalidation. Successfully completed prior operations and their history are not automatically undone by a permission change. This is a behavioral contract and does not select cookie/JWT, session storage or supporting infrastructure.
- **Record:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#session-invalidation-after-access-changes).
- **Affected Phases:** PHASE 1 account/session/role administration and PHASE 2-PHASE 10 internal workflows and verification. No Phase status changes.
- **Still open:** Authentication/session implementation, exact API error contract, treatment of unsaved form input and ordering of in-flight transactions concurrent with permission changes. That concurrency policy must be explicitly designed; invalidating a session alone does not settle an already-running request. D008 settles first-administrator bootstrap; D009 settles self-locking/self-revocation and last-active-administrator protection. D010 prohibits self-granting or expansion of seasonal business permissions; D011 settles emergency administrator recovery.

### D008 - First System Administrator bootstrap through a server CLI

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** The Team Leader explicitly confirmed Q8 option A, a server-side CLI, and supplied the mandatory safeguards recorded below.
- **Source:** O08; UC03, PDF pp.72-74; BM-03/BM-06, pp.23-24; CN-03, p.26; D003/D006.
- **Decision:** Initialize the first System Administrator using a CLI run on the server. Initialization is allowed only when no System Administrator account exists, including locked accounts. Concurrent executions must not bypass that condition: at most one bootstrap administrator can be created, without partial initialization.
- **Credential safeguards:** The installer supplies the username and password; there are no default credentials. Password entry must be secure, with no password in command-line arguments, logs or the repository. Hash the password before storing it; the hashing algorithm remains undecided.
- **Access boundary:** Do not expose a public bootstrap API or web page. The initial account receives system administration authority; seasonal business roles are managed separately. After initialization, ordinary account management uses UC03.
- **Alternatives/basis:** A server CLI versus a first-time web setup page. The Team Leader chose the CLI with explicit credential and concurrency safeguards, avoiding a public bootstrap endpoint while accepting that installation includes a server command.
- **Record:** [ADR 0004](../../../docs/adr/0004-first-administrator-cli-bootstrap.md).
- **Affected Phases:** PHASE 1 foundation/account setup and PHASE 10 fresh-installation/operations verification. No Phase status changes.
- **Still open:** Exact bootstrap CLI command and secure-input implementation, concurrency mechanism, password hashing parameters and bootstrap audit details remain open. D011 settles the separate emergency recovery flow. Existing administrator accounts must not be reset, replaced or supplemented through this bootstrap flow; emergency recovery is governed by D011.

### D009 - Protect administrator access and prohibit self-locking

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q9, the Team Leader selected option A: “Tôi chọn phương án A.” (“I choose option A.”).
- **Source:** O08; UC03, PDF pp.72-74; BM-02/BM-06, pp.23-24; D006-D008.
- **Decision:** A System Administrator cannot lock their own account or revoke their own System Administrator role. Reject any account-locking or administrator-role revocation operation that would leave no active System Administrator. An active System Administrator is an account that is not locked/disabled and still holds the System Administrator role.
- **Concurrency:** Preserve the at-least-one-active-administrator condition under concurrent operations, including administrators attempting to lock or remove each other's administrator access. Checking a previously loaded account count alone is insufficient; the concurrency mechanism remains to be designed.
- **Alternatives/basis:** Prohibit self-locking/self-revocation versus allow them if another active administrator remains. The Team Leader chose prohibition to make the rule explicit and prevent accidental self-loss of administration access, accepting that another administrator must handle their account's deactivation or removal of the administrator role.
- **Record:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#administrator-access-safeguards).
- **Affected Phases:** PHASE 1 account/role administration and PHASE 10 concurrency/integration verification. No Phase status changes.
- **Still open:** D010 settles administrator self-granting of seasonal business permissions. Password changes and the concrete transactional/concurrency implementation remain open. D011 settles emergency recovery. D009 does not prohibit ordinary profile/password changes or establish a recovery mechanism.

### D010 - Prohibit administrator self-granting of seasonal business permissions

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q10, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O08; UC03, PDF pp.72-74; BM-02/BM-06, pp.23-24; D003-D006/D009.
- **Decision:** A System Administrator must not grant themselves an additional seasonal business role or expand their own season scope. An administrator may hold business roles, but another System Administrator must grant or expand those assignments through UC03. A sole administrator can still assign business roles to other staff.
- **Alternatives/basis:** Prohibit self-granting/expansion versus permit it with full audit logging. The chosen rule separates the person granting access from the recipient, at the cost of requiring another administrator when an administrator needs additional business access.
- **Consequences:** Server-side authorization must check the assignment's recipient as well as the requested role/scope. D007 session invalidation and BM-06 logging apply to successful changes. D005's separate preparer/approver rule still applies to subsequent business operations; another administrator granting a role does not itself approve any business content.
- **Record:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#administrator-self-granting-of-business-permissions).
- **Affected Phases:** PHASE 1 assignment administration and PHASE 2-PHASE 10 dependent workflows and verification. No Phase status changes.
- **Still open:** D011 settles emergency administrator recovery. Password-change rules, self-reduction of business permissions and concrete assignment/schema/concurrency contracts remain open. This decision neither forbids administrators from holding business roles nor requires a second administrator for assigning roles to other staff.

### D011 - Emergency recovery CLI for existing administrators

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q11, the Team Leader agreed to option A, including the proposed recovery scope and safeguards.
- **Source:** O08/O12; UC03, PDF pp.72-74; BM-02/BM-03/BM-06, pp.23-24; D007-D010. This is an explicitly approved v2 operational refinement, not an additional actor or UC.
- **Decision:** Provide a separate emergency recovery CLI on the server for an operator with server access. It may reset the password and/or unlock an existing account that already has the System Administrator role. It must not create accounts, grant the System Administrator role or change seasonal business permissions. Do not expose a public API or web page for this emergency recovery flow.
- **Credential/session safeguards:** Enter the replacement password securely, never through command-line arguments, logs or the repository, and hash it before storage. Successful recovery invalidates all existing sessions for the target account.
- **Audit:** Require the recovery reason and record the operator's identity, time, target account and operation type; never record passwords.
- **Alternatives/basis:** A separate server recovery CLI versus relying only on another administrator. The chosen approach supports recovery when no administrator can log in, at the cost of protecting command execution and auditing recovery actions. D008 bootstrap remains separate and unavailable when an administrator account exists.
- **Record:** [ADR 0004](../../../docs/adr/0004-first-administrator-cli-bootstrap.md#emergency-recovery-of-existing-administrators).
- **Affected Phases:** PHASE 1 account/session operations and PHASE 10 operational verification. No Phase status changes.
- **Still open:** Exact command and server/operator authorization contract, operator identification, secure input implementation, hashing algorithm/parameters, atomic recovery/audit/session invalidation and concurrent recovery handling. Ordinary password changes/resets and self-reduction of business permissions are not decided by this emergency flow.

### D012 - Season-wide Results Officer scope without per-match assignments

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q12, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O08; UC16-UC17, PDF pp.109-114; BM-02/BM-06, pp.23-24; AT-02, p.32; D003/D005.
- **Decision:** A Results Officer may create and update match reports and unofficial results for any match in an assigned season, subject to the applicable match status and business validations. The first version does not require per-match assignment or a match-assignment management mechanism.
- **Permission boundary:** This scope does not itself grant official result confirmation or correction of confirmed results. Those require their corresponding permissions and D005's separation of preparation and approval. It grants no access to another season or additional rights to other roles.
- **Alternatives/basis:** Season-wide Results Officer access versus assignment to individual matches. Season-wide access supports a small team's collaboration and staff substitution without maintaining match assignments, at the cost of not restricting data-entry responsibility to particular matches through authorization.
- **Consequences:** Record the operator of each change in history and prevent silent overwrites under concurrent edits. Season scope does not bypass business validation or conflict handling.
- **Record:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#results-officer-match-scope).
- **Affected Phases:** PHASE 1 authorization, PHASE 5 match reports/unofficial results and PHASE 10 integration/concurrency verification. No Phase status changes.
- **Still open:** Detailed action permissions, states/transitions, delegation administration, report ownership/version rules and concrete concurrency contracts. D013 settles the delegation model. Confirmed-result correction authority remains a separate permission decision.

### D013 - Action-scoped, seasonal and time-bounded business delegation

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q13, the Team Leader selected option B: “Tôi chọn phương án B.” (“I choose option B.”).
- **Source:** O07/O08; QĐ6.1, PDF p.11; UC14 pp.103-106 and UC19 pp.118-121; D003-D006/D010.
- **Decision:** Represent business delegation separately, specifying the authorized operation, applicable season and validity period. Do not substitute the proposed option A of granting a broader existing role as the sole delegation mechanism.
- **Alternatives/trade-off:** Delegation through existing seasonal roles versus specific operation/season/time delegation. The selected model can grant the intended operation without granting the whole broader role, but requires explicit grant, expiry, revocation and authorization rules. The Team Leader did not yet select those rules.
- **Boundaries:** Delegation does not bypass D005's separation of preparation and approval. D006's authority over role/season assignments and D010's self-grant restrictions remain in place; D013 alone does not decide who grants delegation or how those restrictions apply to delegation administration. No new actor or UC is introduced.
- **Record:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md). Business meaning is recorded in the [glossary](../GLOSSARY.md#context-v2-additions).
- **Affected Phases:** PHASE 1 authorization, PHASE 2 regulation authority, PHASE 4 schedule adjustments, PHASE 5 official corrections and PHASE 10 integration/verification. No Phase status changes.
- **Still open:** D014 settles proposal and grant/revocation recording responsibilities. D015 prohibits onward delegation and requires direct role authority. D018-D019 settle recipient prerequisites and the role/operation list. Detailed request states, validity boundaries/time zone, lifecycle/audit and consequences for sessions, pending requests and in-flight transactions when delegation changes or expires. The rejected option A's proposed administration and lifecycle rules are not implicitly accepted.

### D014 - Season Manager proposes delegation; System Administrator records grants/revocations

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q14, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O07/O08; QĐ6.1, PDF p.11; UC03 pp.72-74, UC14 pp.103-106 and UC19 pp.118-121; D006/D013.
- **Decision:** The Organizing Committee / Season Manager proposes business delegation, specifying the recipient, operation, season, validity period and basis. The System Administrator checks the applicable conditions and records the grant or revocation on the system. Season Managers do not directly execute delegation grants/revocations.
- **Alternatives/basis:** Season Manager proposal followed by administrator recording versus direct Season Manager grant/revocation. The Team Leader chose a centralized access-administration point, accepting coordination with an administrator for delegation changes.
- **Boundaries:** Recording a delegation does not approve the underlying business content; D005 still applies. Role/season assignments remain governed by D006; delegation remains action/season/time-specific under D013. This decision does not itself select the request states, eligible recipients, self-delegation rules or onward delegation rules.
- **Record:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#delegation-administration-responsibilities).
- **Affected Phases:** PHASE 1 access administration, PHASE 2/PHASE 4/PHASE 5 delegated operations and PHASE 10 integration/verification. No Phase status changes.
- **Still open:** Detailed proposal/revocation lifecycle, remaining authority limits, recipient eligibility, applicable audit/session/expiry contracts and concurrent changes. D014 allocates responsibilities without treating an administrator's check as business-content approval.

### D015 - Single-level delegation based on direct role authority

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q15, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O07/O08; QĐ6.1, PDF p.11; UC14 pp.103-106 and UC19 pp.118-121; D003/D013/D014.
- **Decision:** Business delegation is single-level. The proposer must base a delegation on authority held directly through their own role in the applicable season, restricted to operations eligible for delegation. Authority received through delegation cannot be used as the basis for further delegation.
- **Replacement and independent authority:** If a recipient must be replaced, submit a new delegation proposal under D014. If a recipient independently holds direct role authority, a proposal based on that direct authority is not onward delegation; it must satisfy the same eligibility checks.
- **Alternatives/basis:** Prohibit onward delegation versus allow delegation chains bounded by inherited operation/season/time scope. The chosen model keeps authority provenance, validity and responsibility simpler, at the cost of requiring a new proposal from a directly authorized proposer when replacing a recipient.
- **Record:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#single-level-delegation-from-direct-role-authority). See [direct business authority](../GLOSSARY.md#context-v2-additions).
- **Affected Phases:** PHASE 1 authorization, PHASE 2/PHASE 4/PHASE 5 delegated operations and PHASE 10 verification. No Phase status changes.
- **Still open:** D016 settles self-proposal/self-recording. D018-D019 settle eligible roles/operations. D020 settles termination on loss of required eligibility, including the proposer's direct authority. Time boundaries, audit/session/lifecycle and concurrency contracts remain open.

### D016 - Recipient cannot propose or record their own delegation grant

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q16, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O07/O08; UC03, PDF pp.72-74; BM-02/BM-06, pp.23-24; D010/D013-D015.
- **Decision:** The delegation recipient must be different from the proposer and from the System Administrator recording the grant. Multiple roles do not bypass either restriction. An administrator may receive a valid delegation only when someone else proposes it and a different administrator records the grant.
- **Alternatives/basis:** Prohibit self-proposal and self-recording versus allow an administrator to record a grant to themselves after another Season Manager's proposal. The Team Leader chose separation of the recipient from requesting/granting access, consistent with D010, accepting dependence on another administrator when the recipient is an administrator.
- **Follow-up:** D017 requires the proposer and recording administrator to be different people. D016 does not prohibit administrators from receiving delegation or expand the list of eligible recipients/operations.
- **Record:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#recipient-separation-from-proposal-and-grant-recording).
- **Affected Phases:** PHASE 1 delegation authorization, PHASE 2/PHASE 4/PHASE 5 delegated workflows and PHASE 10 verification. No Phase status changes.
- **Still open:** Effects of losing recipient/operation eligibility, request lifecycle, audit/session/expiry behavior and concurrency implementation. D017 settles proposer/recorder separation.

### D017 - Three different people for a delegation grant

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q17, the Team Leader selected option A: “tôi chọn A.” (“I choose A.”).
- **Source:** O07/O08; UC03, PDF pp.72-74; BM-02/BM-06, pp.23-24; D004/D014/D016.
- **Decision:** The person proposing delegation must differ from the System Administrator checking and recording its grant. Combined with D016, every delegation grant requires three different people: proposer, recorder and recipient. Holding multiple roles does not bypass these restrictions.
- **Alternatives/basis:** Require a different proposer and recorder versus permit one person with both roles to perform both responsibilities. The Team Leader chose an independent check before granting access, accepting the coordination needed among three people.
- **Consequences:** The backend must verify the separation conditions when recording the grant. Recording delegation remains distinct from approving the underlying business content; D005 separately governs subsequent business approval. This is an additional rule for granting delegation, not a claim that D014 already required different people.
- **Record:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#three-person-separation-for-delegation-grants).
- **Affected Phases:** PHASE 1 delegation administration, PHASE 2/PHASE 4/PHASE 5 delegated workflows and PHASE 10 verification. No Phase status changes.
- **Still open:** Effects of losing recipient/operation eligibility, lifecycle/time/session/audit and concurrency contracts, and how person identity is represented/enforced across accounts. D021 permits direct administrative revocation without the three-person grant process.

### D018 - Delegation recipients must already hold a business role in the target season

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q18, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O07/O08; BM-02, PDF p.23; UC03 pp.72-74; D003/D006/D013-D017.
- **Decision:** A recipient must have an active account and at least one business role assigned in the target season before receiving delegation. Delegation adds a specific operation and does not replace seasonal staffing assignment. An account holding only the System Administrator role is not eligible until separately assigned a business role in that season through UC03.
- **Alternatives/basis:** Require prior seasonal business assignment versus allow any active internal account to receive season access through delegation alone. The chosen policy separates staffing assignment from additional delegated authority, at the cost of completing UC03 assignment before delegation.
- **Boundaries:** D018 is a prerequisite, not approval for every seasonal role to receive every delegated operation. D019 below confirms the first-version role/operation matrix. Existing D015-D017 authority and person-separation conditions still apply.
- **Record:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#prior-seasonal-business-assignment-for-recipients).
- **Affected Phases:** PHASE 1 assignment/delegation authorization, PHASE 2/PHASE 4/PHASE 5 delegated workflows and PHASE 10 verification. No Phase status changes.
- **Still open:** Account-status lifecycle details and request/time/session/audit/concurrency contracts. D019 settles the role/operation matrix; D020 settles termination after loss of required eligibility.

### D019 - First-version delegation operation and recipient-role matrix

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q19, the Team Leader selected option A: “Chọn A là hợp lý.” (“Choosing A is reasonable.”).
- **Source:** O07/O08; QĐ6.1, PDF p.11; UC06 pp.79-82, UC14 pp.103-106, UC19 pp.118-121; approval boundaries in UC08/UC13/UC18/UC22/UC24; D005/D013-D018.
- **Decision:** Only the operations and recipient roles in the table below may be delegated in the first version. The recipient must hold a listed role in the target season and meet D015-D018. These are confirmed v2 design refinements, not claims that v1 already contained the detailed matrix.

| Delegated operation | Eligible recipient business role in the season | Boundary |
|---|---|---|
| Prepare/edit a proposed seasonal regulation change - UC06 | Registration Officer, Scheduling Officer or Results Officer | Does not include regulation approval |
| Approve a schedule-adjustment request - UC14 | Scheduling Officer | Cannot approve a submitted version they prepared/edited |
| Prepare/edit a proposed correction to an official result - UC19 | Results Officer | Cannot directly apply it; another authorized person must approve |

- **Retained approval/publication authority:** Regulation approval, club participation application approval, initial schedule approval, official result confirmation, approval of official-result corrections, season-summary confirmation, and news publication/withdrawal remain with the Organizing Committee / Season Manager and cannot be granted through this delegation mechanism in the first version. Account administration is outside business delegation. No other delegated operations are enabled by this decision.
- **Alternatives/basis:** A limited role/operation list versus considering a wider set of delegated approvals. The Team Leader selected the limited list, distinguishing proposal preparation, approval and application of changes, while accepting continued direct Season Manager involvement in the retained operations.
- **Record:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#first-version-delegation-matrix).
- **Affected Phases:** PHASE 1 authorization, PHASE 2 regulation proposals, PHASE 4 schedule adjustments, PHASE 5 official corrections; PHASE 3/PHASE 7/PHASE 8 retained authority; PHASE 10 integration/verification. No Phase status changes.
- **Still open:** D020 settles termination on loss of eligibility. Other delegation lifecycle/time/session/audit, concurrency and detailed API/UI/schema contracts remain open. This matrix does not replace the complete baseline role/action permission matrix.

### D020 - Terminate delegation permanently when required eligibility is lost

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q20, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O07/O08; BM-02/BM-06, PDF pp.23-24; D003/D015/D018/D019.
- **Decision:** An already-granted delegation terminates when its proposer loses the corresponding direct business authority in the season or their account is locked/disabled, or when the recipient no longer holds an eligible role for that operation in the season or their account is locked/disabled. Evaluate the relevant authority/eligible role; losing an unrelated extra role is not itself loss of the required condition.
- **No automatic restoration:** Unlocking an account or reassigning a role does not revive the terminated delegation. Continued delegated access requires a new proposal and grant under D014-D018 and the D019 operation/role matrix. Preserve the termination history and reason; do not automatically undo operations validly completed beforehand.
- **Alternatives/basis:** Permanent termination versus suspension with automatic reactivation if conditions recover before expiry. The Team Leader chose a clear boundary preventing old delegated rights from unexpectedly returning, accepting the need for a new grant.
- **Record:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#termination-on-loss-of-required-eligibility).
- **Affected Phases:** PHASE 1 access/assignment lifecycle, PHASE 2/PHASE 4/PHASE 5 delegated workflows and PHASE 10 verification. No Phase status changes.
- **Still open:** D021 settles direct administrative revocation; D022 settles recipient-session invalidation. Exact lifecycle states, time boundaries, session implementation, pending-request treatment and ordering of in-flight transactions concurrent with eligibility changes. D020 prevents further reliance on a terminated delegation but does not select a session technology or decide already-running transaction outcomes.

### D021 - Direct administrative revocation of business delegation

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q21, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O07/O08; UC03, PDF pp.72-74; BM-02/BM-06, pp.23-24; D014/D016/D017/D020.
- **Decision:** A System Administrator may revoke a business delegation directly without waiting for a proposal or the three-person grant process, including a delegation they themselves receive. A Season Manager or recipient may request termination, but the System Administrator executes the revocation. An administrator may also initiate it independently.
- **History and effect:** Require the operator, time, revoked delegation and reason. After revocation is successfully saved, no operation may continue to rely on that delegation. Revocation is not automatically reversed; regranting requires the new-grant process. Other independently held permissions are not removed merely by revoking a delegation.
- **Alternatives/basis:** Direct administrative revocation versus requiring the same three-person proposal/check separation as granting. The Team Leader chose prompt removal of access without assembling three people, accepting the risk of workflow interruption if revocation is mistaken and requiring a traceable reason.
- **Boundaries:** This explicitly refines D014's revocation process. D016/D017 remain mandatory for grants; their restrictions do not block this direct revocation. D009 still prohibits self-removal of the System Administrator role: revoking one's own business delegation is a different operation.
- **Record:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#direct-administrative-revocation).
- **Affected Phases:** PHASE 1 delegation administration, PHASE 2/PHASE 4/PHASE 5 delegated workflows and PHASE 10 verification. No Phase status changes.
- **Still open:** D022 settles recipient-session invalidation. Request/revocation states and UI/API contracts, session implementation, time boundaries, pending business work and in-flight transaction ordering, audit implementation/retention and concurrent revocation/grant handling.

### D022 - Invalidate recipient sessions when delegation starts or ends

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q22, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O07/O08/O12; BM-01/BM-02, PDF p.23; D007/D013/D020/D021.
- **Decision:** Invalidate all existing sessions of the recipient when a delegation becomes effective, expires, is revoked, or terminates after loss of eligibility under D020. The next internal request from an old session is rejected and displays the re-login notification confirmed in D007.
- **Future start:** Recording a delegation whose start is in the future does not invalidate sessions at that advance-recording time. Invalidate the recipient's existing sessions when the delegation actually becomes effective.
- **Alternatives/basis:** Invalidate sessions on effective delegation changes versus retain sessions while checking current permissions and notifying users. The Team Leader chose behavior consistent with D007 and a clear user-visible permission boundary, accepting re-login even for scheduled expiry.
- **Boundaries:** This decision concerns recipient sessions; it does not invalidate the proposer/recorder's sessions merely for administering someone else's delegation. Other D007 account/role-change triggers still apply independently. No real-time notification is required: the application shows the notice on receiving the server response.
- **Record:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#recipient-session-invalidation-at-effective-delegation-changes).
- **Affected Phases:** PHASE 1 sessions/delegation lifecycle, PHASE 2/PHASE 4/PHASE 5 internal workflows and PHASE 10 verification. No Phase status changes.
- **Still open:** D023 settles interval boundaries and activation/renewal policy. D024 settles the shared time-zone policy. Expiry/activation detection and session implementation, exact API/error contract, lifecycle/audit, overlapping delegations, pending work and concurrent/in-flight transaction ordering. No scheduler, cookie/JWT or session storage is selected by D022.

### D023 - Explicit delegation start/end instants with an exclusive end

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q23, the Team Leader selected option A: “Tôi chọn phương án A.” (“I choose option A.”).
- **Source:** O07/O08; QĐ6.1, PDF p.11; D013/D022. These time-boundary details are confirmed v2 design choices, not source defaults.
- **Decision:** Every delegation has a defined start and end date/time; the end must be strictly after the start. Its validity interval is [start, end): it can be used at the start instant and cannot be used at or after the end instant, subject to all other permission/eligibility conditions.
- **Activation and renewal:** Support immediate activation at successful grant recording or a scheduled future start. Do not backdate delegation. For immediate activation, the server determines the start at successful grant recording. Expiry does not renew automatically; continuing requires a new grant.
- **Alternatives/basis:** Explicit start/end date-times versus whole-day delegation periods. The Team Leader chose explicit instants for short-duration delegation and unambiguous authorization/session boundaries, accepting more precise time entry.
- **Record:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#explicit-startend-instants-and-exclusive-end).
- **Affected Phases:** PHASE 1 delegation/session timing, PHASE 2/PHASE 4/PHASE 5 delegated operations and PHASE 10 boundary verification. No Phase status changes.
- **Still open:** D024 settles the shared time-zone policy; D025 confirms no fixed numerical duration cap; D026 allows periods outside season dates subject to business/season lifecycle conditions. Time precision and activation/expiry implementation, overlap enforcement under D027, request lifecycle and concurrent/in-flight ordering remain open.

### D024 - UTC instants and a single Vietnam display/input time zone

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q24, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O03/O12 and cross-cutting O07/O08; TT-04, PDF p.19; time-related scheduling/registration/regulation/delegation requirements. This is an explicitly confirmed v2 design policy, not a time zone specified by the PDF.
- **Decision:** Store and compare exact instants using UTC. Use Asia/Ho_Chi_Minh consistently for time entry and display across the system, including match schedules, registration deadlines, regulation/delegation effectivity and activity history. Clearly label the time zone and do not automatically switch to the user's device time zone.
- **Date-only values:** Preserve dates without a time component, such as dates of birth and U21 birth-date cutoffs, as calendar-date values without time-zone conversion. This does not select the actual seasonal cutoff dates or deadline values.
- **Alternatives/basis:** Vietnam input/display time, Europe/London input/display time, or each user's device time zone. The Team Leader selected a single Vietnam time zone for straightforward local operation, demonstrations and verification, accepting that displayed times differ from local stadium time in England.
- **Record:** [ADR 0006](../../../docs/adr/0006-utc-instants-and-vietnam-time-zone.md).
- **Affected Phases:** PHASE 1 shared time handling; PHASE 2-PHASE 9 time/date inputs, processing and output; PHASE 10 integration/boundary verification. No Phase status changes.
- **Still open:** Database column types, API serialization, time precision, time libraries, activation/expiry/session mechanisms, scheduling intervals, concrete seasonal dates and business-specific boundary rules. The delegation interval boundary remains as confirmed in D023; D024 does not extend that interval rule to every other business interval.

### D025 - Finite delegation periods without a fixed numerical duration cap

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** The Team Leader explicitly confirmed Q25 option A: “Tôi xác nhận phương án A cho Q25.” (“I confirm option A for Q25.”).
- **Source:** O07/O08; D013/D014/D020-D023. The PDF specifies no 7-day or 30-day delegation cap; this is a confirmed v2 policy choice.
- **Decision:** Do not impose a fixed numerical maximum number of days per delegation in the first version. Every delegation still requires a defined end instant; indefinite delegation is not allowed. The proposer specifies the basis and period, and the administrator checks suitability before granting.
- **Alternatives/basis:** No fixed numerical cap versus a 30-day limit per grant. The Team Leader selected the simpler finite-period policy, supporting short or long work without repeating the three-person process solely because of an arbitrary duration threshold; long periods require appropriate proposal/administration review.
- **Boundaries:** D020 termination, D021 revocation, D022 session behavior and D023 expiry/new-grant rules remain mandatory. D026 confirms the relationship with season dates; detailed season lifecycle conditions remain open.
- **Record:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#finite-periods-without-a-fixed-numerical-duration-cap).
- **Affected Phases:** PHASE 1 delegation validation, PHASE 2/PHASE 4/PHASE 5 delegated workflows and PHASE 10 verification. No Phase status changes.
- **Still open:** Detailed season lifecycle conditions, overlap enforcement under D027, request states, time precision/implementation, pending work and concurrency/in-flight contracts. D025 selects no extra duration-configuration technology or mechanism.

### D026 - Delegation periods may extend beyond season start/end dates

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q26, the Team Leader selected option A: “Tôi chọn phương án A.” (“I choose option A.”).
- **Source:** O07/O08; season management UC05, PDF pp.77-78; regulation proposals UC06 pp.79-82 and official corrections UC19 pp.118-121; D019/D023/D025.
- **Decision:** A delegation period may start before the season's start date or extend after its end date, supporting legitimate preparation and post-season work. It still applies only to its target season and defined validity interval. The season's end date does not itself truncate the delegation, and the delegation does not automatically renew.
- **Business boundary:** An operation remains permitted only when the season's lifecycle and the operation's business conditions allow it. Delegation cannot override those conditions. Detailed rules for summarized/archived seasons remain to be confirmed; D026 does not itself select season states or reopening policy.
- **Alternatives/basis:** Independence from season dates subject to business/lifecycle conditions versus requiring the entire delegation period to fall within season start/end dates. The Team Leader chose support for pre-season preparation and post-season processing, accepting explicit lifecycle/operation checks.
- **Record:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#delegation-periods-outside-season-dates).
- **Affected Phases:** PHASE 1 authorization, PHASE 2 season/regulation workflows, PHASE 4/PHASE 5 delegated operations and PHASE 10 verification. No Phase status changes.
- **Still open:** Season lifecycle/archival/reopening conditions, effects of lifecycle changes on delegation, overlap enforcement under D027, request states, precision/implementation, pending work and concurrency/in-flight contracts.

### D027 - Reject overlapping delegation grants for the same recipient, operation and season

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q27, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O07/O08; BM-02/BM-06, PDF pp.23-24; D013/D020/D021/D023.
- **Decision:** Do not grant overlapping delegation intervals for the same recipient, operation and season, even when the proposers differ. Check against already-granted delegations that can still take effect, including future-start grants. Different operations or seasons are not conflicts merely because their times overlap.
- **Boundaries:** Adjacent intervals are allowed under D023, such as 09:00-12:00 followed by 12:00-14:00. Revoked/terminated delegation must not block new grants for time after its termination, while preserving its history. Prevent conflicting grants under concurrent requests; the technical enforcement mechanism remains open.
- **Alternatives/basis:** Prohibit overlaps versus allow independent concurrent grants from multiple sources. The Team Leader chose clear authority provenance and simpler revocation/traceability, accepting that replacing overlapping grants may require changing the proposed interval or revoking the prior grant.
- **Record:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#non-overlapping-grants-for-the-same-recipient-operation-and-season).
- **Affected Phases:** PHASE 1 delegation validation, PHASE 2/PHASE 4/PHASE 5 delegated workflows and PHASE 10 boundary/concurrency verification. No Phase status changes.
- **Still open:** D028 settles submitted-version locking and exact-content granting. Exact states/version representation, detailed conflict feedback, precise audit/interval representation, enforcement and pending/concurrent/in-flight contracts. D027 selects no database constraint or locking technology.

### D028 - Lock submitted delegation versions and grant exactly the submitted content

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q28, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O07/O08; BM-02/BM-06, PDF pp.23-24; D014/D017/D023/D027.
- **Decision:** A proposer may edit a draft. Submitting locks that version's content. The administrator checks and grants exactly that content, or returns/rejects it with a reason. The administrator cannot change parameters before granting, including narrowing the period.
- **Revision and checks:** Editing and resubmitting produces a new submitted version while retaining prior-version history. Before granting, recheck current permissions, validity period, person separation and overlap conditions. For the submitted choice to start immediately at grant, the server fills the actual successful grant-recording instant under D023; this is not an administrator changing the period.
- **Granted delegation:** Do not directly edit a granted delegation. Changes require revocation and a new grant process, subject to all previously confirmed safeguards.
- **Alternatives/basis:** Locked submission with return/revision versus administrator adjustment limited to narrowing authority with reason/history. The Team Leader chose matching proposed/granted content and clear responsibility, accepting another exchange when changes are needed.
- **Record:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#locked-submitted-versions-and-exact-content-granting).
- **Affected Phases:** PHASE 1 delegation administration, PHASE 2/PHASE 4/PHASE 5 delegated workflows and PHASE 10 history/concurrency verification. No Phase status changes.
- **Still open:** D029 settles the business states/transitions and cancellation/return/rejection rules. Version representation, conflict feedback, pending work and concurrent/in-flight ordering remain open. D028 does not select a storage or locking implementation.

### D029 - Separate delegation proposal and granted-authority lifecycles

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q29, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the proposed states and transitions.
- **Source:** O07/O08; D014/D020-D023/D028. These are confirmed v2 business states; no database/schema implementation is selected.
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
| Terminated due to lost eligibility | Ended under D020 |

- **Proposal transitions:** Draft -> Pending on submission. Pending -> Returned / Rejected / Granted by the administrator. Returned -> Pending on proposer revision and submission of a new version. The proposer may cancel from Draft, Pending or Returned. Rejected, Cancelled and Granted are terminal for that proposal; another proposal requires a new one.
- **Grant transitions:** A successful grant starts Scheduled or Active according to its start instant. Scheduled becomes Active at the start, subject to eligibility. Expired, Revoked and Terminated due to lost eligibility are terminal and never become Active again. Existing timing/termination/revocation rules govern their applicable transitions.
- **Failed grant validation:** Do not create delegation or mark the proposal Granted. Keep it Pending and report the error; the administrator may then return or reject it.
- **Alternatives/basis:** Two lifecycles versus a single combined lifecycle. The Team Leader chose clear separation between successful proposal processing and whether granted authority is currently usable.
- **Record:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#separate-proposal-and-granted-delegation-lifecycles).
- **Affected Phases:** PHASE 1 delegation workflows, PHASE 2/PHASE 4/PHASE 5 authorized operations and PHASE 10 transition/history verification. No Phase status changes.
- **Still open:** State storage/codes, version/schema design, UI/API contracts, audit/transition implementation, ordering of simultaneous terminal causes, pending business work and concurrent/in-flight enforcement. This decision concerns grant proposals; D021 direct revocation does not require a new three-person proposal.

### D030 - Recheck current session and authority at the final decision point of writes

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** The Team Leader explicitly confirmed Q30 option A: “Tôi xác nhận phương án A.” (“I confirm option A.”).
- **Source:** O07/O08/O12; BM-01/BM-02 and CN-02, PDF pp.23/26; AT-02/AT-03, p.32; D007/D020-D023.
- **Decision:** For internal write operations, check permission when receiving the request and recheck the current session, authority and validity period at a final decision point inside the transaction before successfully recording the change. Starting with valid permission is insufficient if the session/authority is no longer valid at that final point.
- **Failure and consistency:** If the final check fails, reject and roll back that business transaction without partial business data, statistics or workflow-state changes. Permission revocation and concurrent writes must have a consistent order so an old permission check cannot write past a revocation already in effect. Previously valid completed operations remain unchanged; revocation does not undo them retroactively.
- **Boundary example:** A request received at 11:59:59 using authority expiring at 12:00 must fail if its final authorization check occurs at 12:00:01. The interval boundary is as confirmed in D023.
- **Alternatives/basis:** Final in-transaction revalidation versus permission only at request entry. The Team Leader chose current authority at the final decision point, accepting coordination between authorization, transactions and concurrent permission changes.
- **Record:** [ADR 0007](../../../docs/adr/0007-final-authorization-check-for-writes.md).
- **Affected Phases:** PHASE 1 shared session/authorization foundation, PHASE 2-PHASE 9 internal writes and PHASE 10 failure/concurrency verification. No Phase status changes.
- **Still open:** Exact enforcement/serialization point, transaction/isolation/locking mechanism, authoritative time/permission reads, error contracts, retries and pending-work behavior. D030 selects the behavioral policy, not database isolation, lock types or other implementation technology.

### D031 - One personal internal account per person

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q31, the Team Leader selected option A: “Tôi chọn phương án A.” (“I choose option A.”).
- **Source:** O08/O12; UC03, PDF pp.72-74; BM-02/BM-06, pp.23-24; D004/D005/D017.
- **Decision:** Each person has one personal internal account across the system; shared accounts/credentials are not permitted. Combined or changed responsibilities use role assignments on that account, rather than separate accounts for the same person.
- **Identity and separation:** The administrator verifies identity during account creation and prevents another account for an existing person. Separation-of-person checks rely on the person's individual account under this one-to-one policy. Identity fields and duplicate-detection details remain to be designed; a unique username alone does not establish person uniqueness.
- **Alternatives/basis:** One personal account per person versus multiple accounts linked to a separate person identity. The Team Leader chose simpler accountability and separation checks consistent with multiple-role support, accepting identity/duplicate checks at provisioning.
- **Record:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#one-personal-internal-account-per-person); [glossary](../GLOSSARY.md#context-v2-additions).
- **Affected Phases:** PHASE 1 account/role administration, PHASE 2-PHASE 9 attributable internal operations and PHASE 10 verification. No Phase status changes.
- **Still open:** Required identity fields, duplicate detection, storage/constraints and account lifecycle/password rules. D031 does not select a separate personnel subsystem, identity provider or government-identity collection.

### D032 - Public information boundary including player dates of birth

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q32, the Team Leader selected option A with the explicit addition that player dates of birth are public information.
- **Source:** O04; BM4.1-BM4.4, PDF pp.8-9; QĐ4.1-QĐ4.6, p.9; BM-05 and §1.2.5.3, pp.21/23; UC15/UC21/UC23/UC25.
- **Decision:** Publish the seasonal lookup information in the table below, including the player's full calendar date of birth. Retain the other proposed A restrictions. The birth-date exception concerns players in the public seasonal lookup scope, not unrestricted access to all player/application records.

| Group | Public information |
|---|---|
| Season | Competition/season name, club count, round count, total matches, start/end dates |
| Participating club | Name, abbreviation, coach, home ground, valid registered-player count |
| Player in the season | Full name, date of birth, nationality, position, club, shirt number, registration category |
| Schedule/results | Published schedule: round, clubs, date/time and stadium; score only after official confirmation |
| Statistics | Standings, goalscorers and clean-sheet statistics from official results |
| News | Published content; detailed fields remain to be settled under O15 |

- **Internal boundary:** Club representative information, contact details, training/homegrown evidence, application/review content, drafts, unconfirmed results, change reasons and system logs remain internal with appropriate access. Fields not approved for publication remain internal. Player date of birth is the explicit exception to Q32 A's original proposed internal list.
- **Source-default change:** V1 BM-05 records dates of birth as requiring appropriate authority. The Team Leader explicitly changes that default for player birth dates in v2. Preserve the v1 source transcription and approval; future specifications/acceptance must trace this approved exception rather than claim public birth dates were already the v1 default. This does not make contact information or other internal data public.
- **Delivery boundary:** The backend must enforce the public scope consistently for public UI/API data and any files intended for public use. This does not itself authorize a public file-export feature. Internal viewing/export scopes remain to be designed.
- **Alternatives/basis:** Q32 A kept representative information and birth dates internal; B would additionally publish representative names. The Team Leader instead approved modified A with player birth dates public while representative information stays internal. No other exception was approved.
- **Record:** [ADR 0008](../../../docs/adr/0008-public-information-and-player-birth-dates.md).
- **Affected Phases:** PHASE 1 data-access boundaries, PHASE 3 profiles/registration, PHASE 6 public lookup, PHASE 7/PHASE 9 file scopes, PHASE 8 publication and PHASE 10 verification. No Phase status changes.
- **Follow-up:** D033 settles the internal viewing groups by responsibility. Field-level API/export schemas, log payloads, detailed news fields, publication defaults and public lookup eligibility details remain open. O04 is only partially settled.

### D033 - Internal viewing follows business responsibility

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q33, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), including the matrix and accompanying limits.
- **Source:** O04/O08; BM-02/BM-05/BM-06, PDF pp.23-24; UC03/UC04, registration/scheduling/results UCs; D003/D004/D019/D032.
- **Decision:** Login and assignment to a season do not themselves authorize viewing all internal information. Apply the following responsibility-based viewing scope.

| Internal data group | Authorized role in the assigned season |
|---|---|
| Club participation applications, representative and contact information | Organizing Committee / Season Manager; Registration Officer |
| Player registration records and homegrown evidence | Organizing Committee / Season Manager; Registration Officer |
| Draft schedules and unapproved adjustment proposals | Organizing Committee / Season Manager; Scheduling Officer |
| Match reports, unofficial results and correction proposals | Organizing Committee / Season Manager; Results Officer |
| Proposed regulation changes | Organizing Committee / Season Manager; staff holding the corresponding delegation under D019 |
| Account administration and system-wide activity-log search | System Administrator under UC03/UC04 |

- **Multiple roles and delegation:** A person holding multiple roles may view according to the roles actually assigned in the season. Delegation adds only the data needed for its operation. A function needing eligibility checks may receive the result and necessary reasons without automatically receiving the whole underlying source record.
- **Administration and history:** System Administrators do not automatically gain every business-profile screen; business work requires the corresponding role. Object-specific history is viewed within the object's access scope; system-wide log search remains UC04. Exact log fields and export permissions remain open, so UC04 is not an implicit grant to every business screen or unrestricted log payload.
- **Alternatives/basis:** Responsibility-based viewing versus all business roles seeing all internal seasonal data while writes/approvals remain separate. The Team Leader chose data scope aligned with responsibilities and server-side UI/API checks.
- **Record:** [ADR 0008](../../../docs/adr/0008-public-information-and-player-birth-dates.md#responsibility-based-internal-viewing).
- **Affected Phases:** PHASE 1 authorization/log access, PHASE 2-PHASE 5 business records, PHASE 6 lookup, PHASE 7-PHASE 9 internal output and PHASE 10 access verification. No Phase status changes.
- **Follow-up:** D034 settles separate shared-master management permissions. Detailed field/API/export schemas, log/history payload filtering and remaining read/write action matrices stay open. Existing D032 public player birth dates remain public.

### D034 - Separately assigned shared master-record management permissions

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q34, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O04/O08/O12; UC03 pp.72-74, UC07 pp.82-84, UC09 pp.88-90 and UC12 pp.97-99; shared records in PDF §1.3.4.1 pp.37-38; D003/D006/D033.
- **Decision:** Distinguish shared management permissions for club, stadium and player master records. The System Administrator separately grants/revokes them through UC03 for personnel carrying the corresponding business responsibility; a seasonal role alone does not automatically grant shared-record management.

| Shared record group | Corresponding business responsibility |
|---|---|
| Club master records - UC07 | Organizing Committee / Season Manager |
| Stadium master records - UC12 | Scheduling Officer |
| Player master profiles - UC09 | Registration Officer |

- **Scope:** These permissions apply to shared master records, not participation applications or internal seasonal records from other seasons. This resolves the shared-data scope left open by D003 alongside seasonal business permissions. Keep the existing actors/UCs; no new actor is introduced.
- **Alternatives/basis:** Explicit separate shared permissions versus automatically deriving them from the corresponding role in any season. The Team Leader chose an explicit shared-data assignment boundary, accepting additional permission configuration.
- **Record:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#separately-assigned-shared-master-management-permissions).
- **Affected Phases:** PHASE 1 UC03/authorization, PHASE 2 clubs/stadiums, PHASE 3 player profiles and PHASE 10 access/history verification. No Phase status changes.
- **Still open:** Exact permission representation and qualifying-role lifecycle, self-grant/session-change rules for these shared permissions, field-level access, snapshot details under D035 and detailed write constraints. D034 does not approve destructive deletion or any new operation beyond the applicable UCs and integrity rules.

### D035 - Stable master identity with selective snapshots of official business information

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q35, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O12; AT-04, PDF p.32; TH-05/TH-06, pp.13-14; master/seasonal object distinction in §1.3.4.1 pp.37-38; D034.
- **Decision:** Keep stable identities for clubs, stadiums and players across seasons. At official business-recording milestones, retain selective snapshots of the information needed to reproduce the corresponding historical records/reports. A master-record update does not automatically overwrite officially recorded historical information.
- **Official corrections:** Changes to official business data use the corresponding authorized process with a reason and history. Do not snapshot every field indiscriminately; the exact fields and capture milestones remain to be designed.
- **Alternatives/basis:** Stable master identities plus selective business snapshots versus versioning every master-record change and referencing the relevant master version. The Team Leader chose simpler reproduction of official historical context, accepting selective duplication and the need to define snapshot fields/milestones.
- **Boundary example:** A club renaming in a later season should not silently replace the name officially used in an earlier season's report, while its identity remains the same club. D036 below settles the general correction policy for originally incorrect master information, including birth-date errors.
- **Record:** [ADR 0009](../../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md).
- **Affected Phases:** PHASE 2 club/stadium masters, PHASE 3 player/registration data, PHASE 4 schedules, PHASE 5 official results, PHASE 6/PHASE 7 historical lookup/reports and PHASE 10 integrity verification. No Phase status changes.
- **Still open:** Snapshot field sets/milestones/schema, detailed impact/review workflows under D036, relationship to regulation versions and report regeneration, API/display choices and consistency/concurrency mechanisms. No identifier type, storage structure or full temporal-versioning technology is selected.

### D036 - Correct erroneous master data with separate review of affected business records

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** The Team Leader explicitly finalized Q36 option A before requesting a break and queuing Live Match Tracking / Live Score for later interview.
- **Source:** O09/O12; UC07 pp.82-84, UC09 pp.88-90 and UC12 pp.97-99; QĐ4.5, PDF p.9; TH-06 and AT-03/AT-04, pp.14/32; D034/D035.
- **Decision:** An authorized master-record manager may correct erroneous source information with a reason and supporting basis. Preserve before/after values, operator and time, and identify related records/operations needing review. Do not require prior approval of the entire downstream correction plan before correcting the master.
- **Historical boundary:** Keep snapshots and previously official decisions unchanged until corrected through their corresponding authorized business processes. A master correction must not automatically cancel registrations, alter official results or change statistics.
- **New business work:** Recheck affected eligibility using corrected information when processing new business operations; do not rely on outdated validation results. For example, correcting a birth date may require review of prior U21 registration without automatically rewriting its official historical decision.
- **Alternatives/basis:** Correct the master with traceability and separately review affected business records versus block an impactful master correction until a correction plan is approved. The Team Leader chose timely correction of current information while preserving official history, accepting a period in which related records await review.
- **Record:** [ADR 0009](../../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#correction-of-erroneous-master-data-and-separate-impact-review).
- **Affected Phases:** PHASE 2 masters/regulations, PHASE 3 profiles/registration, PHASE 4 schedules, PHASE 5 official results, PHASE 6/PHASE 7 lookup/reports and PHASE 10 integration/integrity verification. No Phase status changes.
- **Still open:** Impacted field/record mapping, supporting-basis format, review ownership/states, handling of registrations no longer eligible, historical correction/public display rules, snapshot details and transaction/concurrency contracts. No upload mechanism, automatic disciplinary action or new workflow-state code is selected.

## Pending v2 extensions

See the [pending decision queue](pending-decisions.md). V2-EXT-01 records the Team Leader's requested Live Match Tracking / Live Score improvement and explicit reference-data boundaries. Its design interview is deferred until the existing foundation decision groups are complete, and must be raised proactively before the v2 summary and package-approval proposal. It is not D037, not a resolved Oxx and not approved implementation design.

## Decision coverage

All 16 source issues remain **OPEN** until their constituent decisions are confirmed. O12 has partial confirmed coverage through D001, D002, D007, D011, D022, D024, D030, D031 and D034-D036. O03 has partial confirmed coverage through D024's time-zone policy; match/stadium intervals and boundary rules remain open. O04 has partial confirmed coverage through D032-D034, including the explicit player-birth-date exception and responsibility-based internal viewing; detailed field/file/log scopes remain open. O08 has partial confirmed coverage through D003-D023, D025-D031 and D033-D034. O07 has partial confirmed coverage through D005's separation rule for regulation approval and D013-D023 and D025-D030's delegation model/responsibilities/authority limits/recipient matrix/termination/revocation/session/time/duration policies; regulation effectivity and in-season change policies remain open. O09 has partial confirmed coverage through D036's general correction policy; required fields, identifiers and detailed correction rules remain open. None is RESOLVED. O01-O02, O05-O06, O10-O11 and O13-O16 have no confirmed resolutions in v2 yet. The new Live Score request is separately queued as V2-EXT-01, not counted as a resolved v1 issue. The [v1 register](../open-decisions.md) is retained as the source baseline; this supplement records subsequent confirmations.

## Interview order

1. Architecture, technology constraints, stack/database and baseline environment - O12, part of O13.
2. Authority, scope, lifecycle, data visibility and regulation effectivity - O08, O04, O07.
3. Seasonal registration, evidence, deadlines, identifiers and required fields - O01, O02, relevant O09 decisions.
4. Scheduling automation, drafts, supported configurations, time intervals and conflicts - O03, O10.
5. Match reports/events, confirmation and corrections - remaining O09 and O08 decisions.
6. Ranking, season completion, goalkeeper statistics and awards - O05, O06.
7. News publication and file exchange - O15, O11.
8. Consolidated Chapter 3 design: ERD/data dictionary, database constraints, transactions, APIs, sessions, UI and processing flows - complete O12; cross-check O16 throughout.
9. Deployment, backup/recovery, retention and measurement methodology - complete O13, O14.
10. Deferred Live Match Tracking / Live Score interview - V2-EXT-01, after the foundation groups above and before package summary/approval.
11. Cross-document consistency review, summary and explicit whole-package approval.

Ask dependent questions after their prerequisites are confirmed. Record each confirmation with source, options, basis, approver/date and affected documents/Phases. Resolve an Oxx only when its whole scope is covered. Use the business glossaries for domain terms; architectural implementation terminology belongs in design documents. Whole-package approval requires a separate Team Leader confirmation after the interview and consistency review.

This work is limited to Context/design documentation. No code, feature Specifications, Plans, Tasks, Issues, commits or pushes are authorized by this interview.

## Resume checkpoint

Q1-Q36 are confirmed as D001-D036; the package as a whole remains DRAFT. The Team Leader requested a break before Q37. Resume the existing foundation interview at Q37, one detailed question at a time, recomputing prerequisites from unresolved decisions. Do not start V2-EXT-01 at Q37 merely because it was queued; interview it after the foundation groups and before summary/approval. No Q37 question or answer has yet been recorded. A commit message was requested as a suggestion only; no commit/push is authorized.
