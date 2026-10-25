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
- **Still open:** Exact permission representation, qualifying-role lifecycle as settled by D038 below, session-change rules for these shared permissions (D037 settles self-granting), field-level access, snapshot details under D035 and detailed write constraints. D034 does not approve destructive deletion or any new operation beyond the applicable UCs and integrity rules.

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

### D037 - Prohibit administrator self-granting of shared master-management permissions

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q37, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O08/O12; UC03 and D010/D034. This extends the confirmed self-grant safeguard to separately assigned shared master-management permissions.
- **Decision:** A System Administrator cannot grant or expand their own shared club, stadium or player master-management permissions. Another System Administrator must make the grant through UC03. Holding the corresponding business role does not permit self-granting.
- **Administration boundary:** A sole administrator may still grant these permissions to other eligible personnel. Receiving additional shared-management permissions themselves requires a second administrator. Enforce the restriction on the backend and retain assignment history.
- **Alternatives/basis:** Prohibit self-granting versus allow it when the administrator holds the corresponding business responsibility, with audit logging. The Team Leader chose consistency with D010 and separation of grantor and recipient, accepting coordination with another administrator.
- **Record:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#administrator-self-granting-of-shared-master-management-permissions).
- **Affected Phases:** PHASE 1 account/permission administration, PHASE 2 club/stadium masters, PHASE 3 player masters and PHASE 10 authorization verification. No Phase status changes.
- **Still open:** Exact permission representation; D040 below settles self-reduction/revocation. D038 below settles the qualifying-role lifecycle; D039 settles session-change handling. D037 does not settle these aspects or introduce a separate grant-approval workflow.

### D038 - End shared master-management permission after loss of the last corresponding role assignment

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q38, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O08/O12; UC03 and D034/D037.
- **Decision:** Shared club master-management permission requires a Season Manager role assignment in at least one season; stadium master-management requires a Scheduling Officer assignment in at least one season; player master-management requires a Registration Officer assignment in at least one season. A corresponding role remains a prerequisite after the separate permission grant.
- **Termination and restoration:** Removing the person's last corresponding role assignment ends the related shared-management permission and preserves history. Assigning a corresponding role again does not revive that permission; a new separate grant under D034/D037 is required. Retaining a corresponding assignment in another season prevents this particular termination trigger.
- **Boundary:** Loss means removal of the role assignment, not merely the season reaching its end date. Season closure/archive behavior remains undecided. This decision does not grant access to other seasons' internal records.
- **Alternatives/basis:** Continuing role dependency versus checking the corresponding role only at grant time and retaining permission until explicit revocation. The Team Leader chose responsibility-aligned access and prevention of leftover permissions, accepting reassignment-order coordination and possible regranting.
- **Record:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#shared-master-management-permission-depends-on-a-corresponding-role).
- **Affected Phases:** PHASE 1 role/permission lifecycle, PHASE 2 club/stadium masters, PHASE 3 player masters and PHASE 10 authorization verification. No Phase status changes.
- **Still open:** Session-change handling is settled by D039. Self-reduction/revocation is settled by D040. Account-lock effects are settled by D041. Season closure/archive rules and technical consistency/concurrency mechanisms. No permission storage structure or automatic scheduling mechanism is selected.

### D039 - Invalidate sessions after shared master-management permission changes

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q39, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O08/O12; UC03 and D007/D022/D030/D034/D038.
- **Decision:** Successfully granting, expanding, revoking or terminating shared master-management permissions invalidates all existing sessions of the affected recipient, including termination under D038. The next internal request using an old session is rejected; the user must log in again with current permissions.
- **User notice:** Display the D007 notice: “Phiên đăng nhập không còn hiệu lực do tài khoản hoặc quyền truy cập đã thay đổi. Vui lòng đăng nhập lại.” No real-time notification infrastructure is required.
- **In-flight writes:** D030 still requires final authorization/session revalidation inside the business transaction. Permission/session changes and concurrent writes must have consistent ordering; previously valid completed operations are not undone.
- **Alternatives/basis:** Invalidate all recipient sessions versus retain sessions and check current permissions on each request with UI updates. The Team Leader chose consistency with D007/D022 and an explicit user-visible permission-change boundary, accepting login interruptions even for additional grants.
- **Record:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#session-invalidation-for-shared-master-management-permissions).
- **Affected Phases:** PHASE 1 authorization/sessions, PHASE 2 club/stadium masters, PHASE 3 player masters and PHASE 10 access/concurrency verification. No Phase status changes.
- **Still open:** Session technology/storage, error contracts, unsaved-input behavior and technical enforcement/concurrency mechanisms. D040 settles self-reduction/revocation. No new supporting technology is selected.

### D040 - Allow administrator self-reduction of business permissions

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q40, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O08/O12; UC03 and D007/D009/D010/D037-D039.
- **Decision:** Through UC03, a System Administrator may remove their own seasonal business roles, narrow their own season scope or revoke their own shared master-management permissions. The operation must only reduce permission, without granting or expanding their own access.
- **Consequences:** Preserve change history. Losing the last corresponding role assignment ends related shared-management permission under D038. Apply session invalidation under D007/D039 and final authorization checks under D030. A later regrant requires another administrator under D010/D037. Preserve history and responsibility for earlier operations.
- **Administration boundary:** D009 still prohibits self-locking and removal of the person's own System Administrator role. D040 permits business-permission reduction only.
- **Alternatives/basis:** Allow self-reduction versus require another administrator for every change to one's own business permissions. The Team Leader chose prompt removal of unneeded access and simpler staffing coordination, accepting accidental loss of needed business access and dependence on another administrator for restoration.
- **Record:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#administrator-self-reduction-of-business-permissions).
- **Affected Phases:** PHASE 1 UC03/authorization, PHASE 2-PHASE 9 business access and PHASE 10 verification. No Phase status changes.
- **Still open:** Detailed UI/error contracts, pending-work handover and technical consistency/concurrency mechanisms. D041 settles account-lock effects on shared permissions. No new technology or automatic handover workflow is selected.

### D041 - Retain shared master-management assignments while an account is locked

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q41, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O08/O12; UC03 and D007/D020/D034/D038-D040.
- **Decision:** Locking an account prevents login and all use of its permissions, and invalidates all sessions under D007. Locking alone does not remove its role assignments or terminate separately granted shared master-management permissions.
- **Unlocking:** Require a new login; old sessions never revive. The person may use only permissions still valid at that time. Removal of the last corresponding role assignment during the lock still ends the shared permission under D038, and unlocking does not restore it.
- **Delegation boundary:** Business delegations remain governed by D020: delegation terminated because of account locking does not automatically revive on unlocking. Retention of shared assignments does not change that policy.
- **Alternatives/basis:** Retain assignments while blocking account access versus terminate shared-management permission on locking and require a new grant after unlocking. The Team Leader chose separation of account locking from responsibility revocation and simpler temporary-lock operations, accepting review of retained permissions on unlocking and different lifecycle treatment for delegation.
- **Record:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#account-locking-and-shared-master-management-assignments).
- **Affected Phases:** PHASE 1 account/access lifecycle, PHASE 2 club/stadium masters, PHASE 3 player masters and PHASE 10 verification. No Phase status changes.
- **Still open:** UI/error contracts, permanent account retirement, season closure/archive behavior and technical enforcement/concurrency mechanisms. No new technology or automatic permission-review workflow is selected.

### D042 - Immutable approved versions of seasonal regulations

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q42, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O07/O12; QĐ6, PDF p.11; UC06 pp.79-82; D005/D035.
- **Decision:** Each approval establishes a distinct seasonal regulation version containing the full regulation configuration for that season. Approved content is immutable; changing it requires a new proposal and approval of a new version. Retain older versions for lookup and as the basis of related business records.
- **Proposal boundary:** Proposals may be edited during drafting. Draft or pending versions do not replace regulations currently in effect. Approval still requires a person other than the submitted content's preparers/editors under D005.
- **Alternatives/basis:** Immutable approved full versions versus one mutable current configuration with change-history reconstruction. The Team Leader chose explicit approved baselines and historical traceability, accepting duplicated configuration and version/approval/effectivity management.
- **Record:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md); [glossary](../GLOSSARY.md#context-v2-additions).
- **Affected Phases:** PHASE 2 regulations, PHASE 3 registration, PHASE 4 schedules, PHASE 5 results, PHASE 6/PHASE 7 statistics/reports and PHASE 10 verification. No Phase status changes.
- **Still open:** D043 below settles basic effective-time rules. Detailed effectivity, in-season change restrictions, pending/approved record treatment, exact version references/capture points, proposal lifecycle and schema/API/concurrency contracts. D042 does not approve automatic retrospective revalidation or recalculation.

### D043 - Immediate or future regulation effectivity without backdating

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q43, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O07/O12; QĐ6.6, PDF p.11; UC06 pp.79-82; D024/D042.
- **Decision:** A regulation proposal specifies either immediate effectivity or a future effective instant for the approver to review. Immediate effectivity begins when the system successfully records approval. A future-dated approved version does not replace the currently effective regulations before its approved instant. Backdated effectivity is not allowed.
- **Late approval:** Reject approval if the proposed future instant has already passed; do not silently switch to immediate effectivity. Revising the proposal requires resubmission for approval.
- **Time convention:** Apply D024: store/compare UTC instants and use Asia/Ho_Chi_Minh for input/display.
- **Alternatives/basis:** Immediate or future effectivity versus immediate-only approval. The Team Leader chose advance preparation and an explicit time boundary, accepting management of approved-but-not-yet-effective versions and resubmission when approval is late.
- **Record:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#effective-time-policy).
- **Affected Phases:** PHASE 2 regulations, PHASE 3-PHASE 7 dependent business work and PHASE 10 time-boundary verification. No Phase status changes.
- **Still open:** Exact equality/precision and transaction boundaries, overlapping future versions, replacement/cancellation, in-season change limits, activation eligibility checks and pending/approved record treatment. D043 does not permit every type of change mid-season or automatically recalculate prior data. No activation scheduler, SQL type or library is selected.

### D044 - Freeze competition structure after initial schedule approval

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q44, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O07/O10/O12; QĐ6.3, PDF p.11; QĐ2; UC13/UC14; D042/D043.
- **Decision:** From the first approval of the season's initial schedule, freeze the configured club count, competition format and number of legs for that season. Later regulation versions must retain these structural settings, even if no match has started.
- **Scope:** The current project scope includes no unlocking or whole-schedule cancellation process for changing competition structure. Date/time or stadium adjustments for unplayed matches remain subject to UC14 and its separate conditions.
- **Alternatives/basis:** Freeze at initial schedule approval versus permit structural changes before the first match through impact review, schedule replacement and renewed approval. The Team Leader chose consistency between regulations and the approved schedule and reduced implementation/testing complexity, accepting reduced flexibility before kickoff.
- **Record:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#competition-structure-freeze).
- **Affected Phases:** PHASE 2 regulations, PHASE 4 scheduling and PHASE 10 integrity verification. No Phase status changes.
- **Still open:** Club withdrawal/replacement policy, other regulation groups, pre-approval draft invalidation, future-version activation checks and transaction/concurrency contracts. D044 does not select supported competition formats or authorize changes outside existing approval/integrity conditions.

### D045 - Freeze points and ranking priority after the first official result

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q45, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O07/O12; QĐ5.2/QĐ5.3 and QĐ6.5, PDF pp.10-11; UC18-UC20; D042-D044.
- **Decision:** From the season's first officially confirmed result, freeze win/draw/loss points and the priority order of ranking criteria for that season. Later regulation versions must preserve these settings. Before this milestone, changes still require regulation versioning and approval under D042/D043.
- **Corrections and scope:** UC19 official-result corrections and UC20 recalculation remain available under their applicable conditions, using the frozen points/ranking rules. No unlocking workflow for these settings is included in the current project scope.
- **Alternatives/basis:** Freeze after the first official result versus permit separately approved mid-season changes and recalculate the entire season. The Team Leader chose a consistent seasonal calculation basis and reduced processing/testing complexity, accepting inability to change these rules mid-season even with an organizing-committee basis.
- **Record:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#points-and-ranking-priority-freeze).
- **Affected Phases:** PHASE 2 regulations, PHASE 5 results/statistics, PHASE 6 lookup, PHASE 7 reports and PHASE 10 regression verification. No Phase status changes.
- **Still open:** Supported ranking criteria, tie handling, playoffs/relegation, future-version activation checks and transaction/concurrency contracts. D045 settles a configuration-freeze milestone, not the remaining O05 ranking policies.

### D046 - Preserve codes and meanings of referenced goal and card types

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q46, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O07/O09/O12; QĐ3.3-QĐ3.5 and QĐ6.4; D042/D043.
- **Decision:** Once a goal/card type has been used, including in a draft match report, retain its code and business meaning and prohibit deletion while it is referenced. Do not reinterpret a used type, including its score/statistics treatment, or reuse its code for a different meaning.
- **Evolution:** A different meaning requires proposing a new type through a regulation version and approval. Withdrawal from selection for new input may be proposed while retaining the old type for historical reading and interpretation. Adding a type does not itself authorize a new calculation formula or unapproved business behavior.
- **Alternatives/basis:** Stable referenced codes/meanings versus allowing the same code to have different definitions by regulation version, with each event bound to its definition. The Team Leader chose stable references and simpler history protection, accepting retention of unused types and inability to directly redefine an erroneously used type.
- **Record:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#preserve-referenced-goal-and-card-type-meanings).
- **Affected Phases:** PHASE 2 regulation catalogs, PHASE 5 match events/results, PHASE 6/PHASE 7 historical lookup/reports and PHASE 10 integrity verification. No Phase status changes.
- **Still open:** Display-name typo correction, detailed withdrawal workflow, correction of old events, catalog fields and technical constraints. D047 below settles match-time catalog applicability. No new goal/card type or calculation behavior is selected.

### D047 - Bind match event catalogs to recorded actual kickoff

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q47, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O07/O09/O12; QĐ6.4, UC16/UC19; D042/D043/D046.
- **Decision:** Use the goal/card catalog effective at the match's recorded actual kickoff, rather than the data-entry or correction time. Record that actual-start instant and the applicable regulation-version basis. Late entry or correction does not by itself switch the match to a newer catalog.
- **Withdrawal boundary:** A type withdrawn in a later regulation version remains available for a match whose applicable catalog included it. The withdrawal affects matches starting when the new version is effective, while preserving historical event interpretation.
- **Official corrections:** Corrections to official results still require the confirmed authorized approval process; no automatic historical data modification is authorized.
- **Alternatives/basis:** Match-time applicability versus current catalog at entry/correction time while retaining previously saved types. The Team Leader chose rules aligned with the match as played and consistent late entry/history, accepting actual-kickoff recording, version references and historical catalog presentation.
- **Record:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#match-event-catalog-applicability-at-actual-kickoff); [glossary](../GLOSSARY.md#context-v2-additions).
- **Affected Phases:** PHASE 2 regulations, PHASE 5 reports/results/corrections, PHASE 6/PHASE 7 history/reports and PHASE 10 temporal verification. No Phase status changes.
- **Still open:** D048 below settles actual-kickoff recording/confirmation through the report/result workflow. Detailed kickoff correction effects, missing or ambiguous effective versions, draft behavior before kickoff is known, catalog withdrawal workflow and technical contracts. D047 applies only to goal/card catalogs, not player-registration eligibility or every regulation group. No external API or Live Score design is selected.

### D048 - Record actual kickoff in the report and confirm it with the official result

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q48, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O07/O09/O12; UC16-UC19; D005/D047.
- **Decision:** The Results Officer enters actual kickoff from the match's business basis within UC16/UC17. Distinguish scheduled and actual start in the UI; do not silently treat the scheduled time as confirmed actual kickoff. Actual kickoff is mandatory before submitting the result for official confirmation.
- **Confirmation/correction:** The authorized confirmer reviews this instant together with the report under UC18 and D005's separation rule. After official confirmation, changing actual kickoff must use the approved UC19 correction process. There is no separate actual-kickoff approval workflow.
- **Operational scope:** Entry may occur after the match; staff are not required to operate the system at kickoff. The report's catalog/events require rechecking if draft actual kickoff changes; detailed handling of a version-boundary crossing remains open.
- **Alternatives/basis:** Record/review within the existing report/result workflow versus a separate submission/approval workflow for actual kickoff. The Team Leader chose reuse of existing responsibilities and support for after-match entry, accepting no independent prior confirmation of kickoff and revalidation needs when draft kickoff changes.
- **Record:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#recording-and-confirming-actual-kickoff).
- **Affected Phases:** PHASE 5 report/result/correction workflow and PHASE 10 validation; PHASE 2 regulation applicability integration. No Phase status changes.
- **Still open:** Basis format, field precision/validation, pre-kickoff draft behavior, technical contracts. D049 below settles correction across catalog versions. No Live Score integration or external timestamp authority is selected.

### D049 - Revalidate events when corrected kickoff changes the applicable catalog

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q49, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O07/O09/O12; UC16-UC20; D005/D036/D047/D048.
- **Decision:** Permit correction of actual kickoff across a catalog-version boundary. Determine the catalog for the proposed corrected instant and revalidate all events in the proposed report. Identify incompatible events; the preparer must correct them using the business basis. Do not automatically remap event types or delete events.
- **Validation gate:** Block submission or approval until all such errors are resolved.
- **Official boundary:** For an already official result, keep all changes in the UC19 correction proposal. Existing official kickoff, catalog and result remain unchanged while approval is pending. After a valid proposal is approved by a different authorized person, apply all related changes consistently, recalculate statistics where necessary and retain history.
- **Alternatives/basis:** Allow correction with full proposed-report revalidation versus prohibit cross-version kickoff corrections once events exist and leave exceptional handling outside current functionality. The Team Leader chose controlled correction of erroneous information, accepting event-level error presentation and potentially wider report review.
- **Record:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#kickoff-correction-across-catalog-versions).
- **Affected Phases:** PHASE 2 regulation applicability, PHASE 5 reports/results/corrections, PHASE 6/PHASE 7 dependent outputs and PHASE 10 integrity/regression verification. No Phase status changes.
- **Still open:** Draft persistence/error representation, supporting-basis format, missing or ambiguous applicable versions and transaction/concurrency contracts. No automatic event conversion or new correction authority is selected.

### D050 - At most one approved future regulation version per season

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to Q50, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O07/O12; D042/D043.
- **Decision:** Each season may have at most one approved regulation version awaiting its future effective instant. While it exists, block approval of another version, including an immediately effective version.
- **Preparation:** Further proposals may be drafted, but must be rechecked against the regulations currently in effect before approval. Replacing or cancelling an approved waiting version requires a separate process still to be decided; do not edit approved content directly.
- **Alternatives/basis:** One approved waiting version versus multiple future versions with timeline/dependency checks and possible downstream reapproval. The Team Leader chose simpler full-version management and fewer configuration conflicts, accepting inability to preapprove a sequence and the need to handle a waiting version before urgent approval.
- **Record:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#one-approved-future-version-per-season).
- **Affected Phases:** PHASE 2 regulation workflow and PHASE 10 validation/concurrency verification. No Phase status changes.
- **Still open:** D051 below settles cancellation/replacement authority, the controlled replacement exception and business-incompatibility checks at activation. Baseline/conflict checks, technical failures/retries and concurrency enforcement remain open. No new proposal-count limit or implementation mechanism is selected.

### D051 - Controlled cancellation, replacement and activation of waiting regulations

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to grouped Q51, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the whole proposed policy package.
- **Source:** O07/O08/O12; UC06; D005/D042-D045/D050.
- **Cancellation:** Before the approved effective instant, an authorized Season Manager proposes cancellation with a reason and another authorized Season Manager approves it. Preserve approved content and history; record cancellation separately.
- **Replacement:** One proposal may request cancellation of the waiting version and approval of its replacement together. Record both only after the entire valid proposal is approved; on failure retain the waiting version. This is an explicit controlled exception to D050's block on approving another version while one is waiting, not permission for two approved future versions.
- **Time boundary:** A pending cancellation/replacement request does not postpone effectivity. Once the effective instant is reached, the future-version cancellation process is unavailable; further changes require a new regulation version.
- **Activation eligibility:** At the effective instant, recheck constraints arising since approval, including D044/D045 freeze milestones. If the version has become incompatible, do not apply it: retain the currently effective regulations, record the reason and require a new proposal for resolution. Do not silently edit approved content or move its effective time.
- **Alternatives/basis:** Separate proposal/approval for cancellation versus direct cancellation by an authorized Season Manager with a reason/history; both alternatives included consistent replacement and activation checks. The Team Leader chose independent responsibility control, accepting two authorized people and handling of requests still pending at effectivity or versions blocked from activation.
- **Record:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#controlled-cancellation-replacement-and-activation).
- **Affected Phases:** PHASE 2 regulation lifecycle, PHASE 3-PHASE 7 dependent business work and PHASE 10 boundary/concurrency verification. No Phase status changes.
- **Still open:** Detailed lifecycle/error codes, technical failure/retry handling, initial-version absence, baseline/conflict checks, other regulation-group impact policies and concurrency mechanisms. D051 does not select a scheduler, storage representation or notification technology.

### D052 - Compatible registration-rule changes and revalidation of pending records

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to grouped Q52, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the proposed policy package.
- **Source:** O01/O02/O07/O12; QĐ6.2, UC06/UC10/UC11; D036/D042/D043/D051.
- **Decision:** Permit controlled mid-season changes to squad limits, homegrown and U21 conditions only if they do not invalidate approved registrations/lists currently in effect. Check impact at approval and at effectivity; block an incompatible change.
- **Existing decisions:** Do not automatically cancel registrations, remove players or rewrite approved decisions to force compliance with new rules. Preserve the original regulation-version basis of historical decisions.
- **Pending work:** Revalidate draft/pending records against regulations effective at decision time. Earlier submission does not guarantee assessment under the old eligibility/limit rules. Record the regulation version supporting each decision.
- **Correction boundary:** Erroneous master data or previous decisions follow their corresponding correction processes; regulation changes do not substitute for correction.
- **Alternatives/basis:** Controlled compatible changes versus freezing these conditions from the first approved registration. The Team Leader chose support for QĐ6.2 seasonal adjustment without mass revocation or grandfathering of incompatible current registrations, accepting impact checks and possible supplementation/change of pending records.
- **Record:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#registration-rule-changes-and-affected-records).
- **Affected Phases:** PHASE 2 regulations, PHASE 3 registration, PHASE 5 participation checks and PHASE 10 regression verification. No Phase status changes.
- **Still open:** Concrete homegrown/U21 criteria and values, registration windows/deadline exceptions, detailed record lifecycle and schema/concurrency contracts. This decision concerns player conditions and squad limits, not the deadline time basis; it does not introduce an additional approver into UC10.

### D053 - Registration windows, receipt deadlines and individual exceptions

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to grouped Q53, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the proposed policy package.
- **Source:** O02/O07/O08/O12; QĐ1.6/QĐ6.2, UC06/UC08/UC10/UC11; D024/D052.
- **Calendars:** Configure separate seasonal intake calendars for club participation applications and player registration/squad changes. Each group may have multiple windows, without overlap within the group, managed through seasonal regulations. Use explicit opening/closing instants and half-open intervals [open, close), following D024. Do not import external EPL transfer-calendar defaults.
- **Deadline basis:** Use the server instant successfully recording receipt of the application version being assessed, not draft creation or a user-declared timestamp. Timely received versions may be processed after closing. Player conditions/limits still use decision-time rules under D052.
- **Supplementation:** Supplementing or changing assessed content creates a new received version whose timeliness must be checked again.
- **Individual exception:** A Registration Officer proposes an exception for a specific application/version with a reason and basis; an authorized Season Manager separately approves it. The exception waives only receipt timing for that version, not player conditions, limits or conflicting registrations. Exception approval does not replace the registration-processing decision.
- **Traceability:** Retain receipt instants, calendar basis and exception decisions. Do not edit calendars or backdate timestamps to legitimize previous receipts.
- **Alternatives/basis:** Individual approved exceptions versus requiring the next window or an additional generally approved window. The Team Leader chose bounded case-specific flexibility under QĐ1.6, accepting an exception-approval step and possible exceptions for post-deadline supplementation.
- **Record:** [ADR 0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md); [glossary](../GLOSSARY.md#context-v2-additions).
- **Affected Phases:** PHASE 2 regulation calendars, PHASE 3 intake/registration and PHASE 10 time/permission verification. No Phase status changes.
- **Still open:** Concrete seasonal dates, record/exception lifecycle and required fields, eligibility details, schema/API/error/concurrency contracts. No public submission portal, file-upload mechanism or new general approval step in UC10 is selected.

### D054 - Automatic U21 assessment and evidence-based staff verification of homegrown status

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to grouped Q54, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the proposed policy package.
- **Source:** O01/O07/O09/O12; QĐ1.2-QĐ1.4/QĐ6.2, UC10/UC11; D024/D033/D052.
- **Season parameters:** Require the U21 birth-date cutoff and homegrown qualifying training-age range in regulations submitted for approval. Do not fill these gaps from external EPL rules. Retain the source thresholds of at least three seasons or 36 months as defaults; changes follow D052. Actual seasonal values must be entered and approved as configuration, not silently assumed.
- **U21:** Automatically qualify a player whose birth date is on or after the seasonal cutoff. Compare calendar dates rather than age today; missing birth date means insufficient basis to conclude.
- **Homegrown:** A Registration Officer checks evidence and records the qualifying-seasons or qualifying-months basis, conclusion, verifier, time and regulation version. The basis must support the prescribed age range and English/Welsh association requirement; nationality is not a proxy.
- **Insufficient evidence:** Do not mark homegrown as satisfied. The preparer may choose non-homegrown treatment if applicable limits and all other requirements are met; missing homegrown evidence does not automatically reject every registration.
- **Independent attributes and scope:** U21 and homegrown are independent, not inferred from nationality or one another. The first version does not implement automatic accumulation of full multi-club training histories, overlap handling or season/month conversion. Evidence remains internal under confirmed viewing rules.
- **Alternatives/basis:** Automatic U21 plus staff-verified homegrown evidence versus automatic homegrown calculation from detailed training histories. The Team Leader chose traceable verification at SE104 scope, accepting dependence on staff evidence quality and no automatic proof of the full training history.
- **Record:** [ADR 0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#u21-assessment-and-homegrown-verification); [glossary](../GLOSSARY.md#context-v2-additions).
- **Affected Phases:** PHASE 2 regulation configuration, PHASE 3 eligibility, PHASE 5 participation checks and PHASE 10 boundary/evidence verification. No Phase status changes.
- **Still open:** Concrete season parameter values, required evidence fields/formats, field validation, lifecycle and technical contracts. No file-upload technology, external eligibility service or extra approval role is selected.

### D055 - Versioned club-application and player-registration workflows

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to grouped Q55, the Team Leader selected option A: “tôi chọn A.” (“I choose A.”), confirming the proposed policy package.
- **Source:** O02/O08/O09/O12; UC08/UC10/UC11; D005/D052-D054.
- **Club workflow:** Draft -> Received -> Pending approval -> Approved or Rejected. Registration Officers prepare/review; the authorized Season Manager approves under UC08/D005.
- **Player workflow:** Draft -> Received -> Valid. The Registration Officer confirms validity after UC11 checks under UC10; no additional manager approval is introduced.
- **Supplementation/versioning:** Received records, or club applications pending approval, may be returned to Needs supplementation with a reason. Supplementation creates a new version for receipt and rechecking under D053. Submitted club content is immutable; editing requires withdrawal or return for supplementation, then a new submitted version.
- **Cancellation/resubmission:** Permit cancellation before club approval or player-validity confirmation, retaining reason/history. Rejected/cancelled versions cannot be edited into approved ones; a new processing round links to the history. Keep one club-season application case containing its versions/rounds, not multiple independent participation applications for the same club-season.
- **Dependency:** Prepare and check player lists while club approval is pending, but confirm a player's registration as valid only after the club participation application is approved. Club approval does not automatically validate every player registration; UC10 must still check and confirm.
- **Temporal boundary:** Validity confirmation is distinct from playing effectivity, termination and club transfer, which remain to be settled.
- **Alternatives/basis:** Persist incomplete player-registration work with states/versions versus save only registrations passing validation while leaving incomplete entry on screen. The Team Leader chose traceable supplementation and collaboration, accepting extra workflow/version management. Both options retained the club workflow and UC08/UC10 authority difference.
- **Record:** [ADR 0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#club-and-player-registration-workflows); [glossary](../GLOSSARY.md#context-v2-additions).
- **Affected Phases:** PHASE 3 application/registration workflow, PHASE 4 valid-club scheduling integration, PHASE 5 participation checks and PHASE 10 workflow verification. No Phase status changes.
- **Still open:** D056 below settles basic playing-effectivity/termination/transfer rules. Cancellation/withdrawal action details, required fields, enum/API/error and concurrency contracts. These business state names do not select technical enum codes.

### D056 - Playing-effective intervals and consistent club transfers

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to grouped Q56, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the proposed policy package.
- **Source:** O02/O08/O09/O12; QĐ1.5, UC10/UC11; D024/D053-D055.
- **Intervals:** A validated registration has a playing-effective start and a half-open interval [start, end). End may remain unspecified until valid termination. Ordinary start/termination operations may take effect at successful recording or in the future, never before recording; historical errors require a separate correction process.
- **Exclusivity:** Reject overlapping confirmed registration intervals for the same player and competition, including future-start registrations and registrations in different seasons. Adjacent intervals sharing an end/start instant are permitted.
- **Transfer:** Within UC10, terminate the old club registration and start the new one at a common instant in one consistent operation. Record both only when the new registration passes all checks; failure leaves the old registration unchanged.
- **Authority/validation:** The Registration Officer needs authority over the affected registrations/seasons, with a reason and history. Transfers still satisfy D053 deadlines/exceptions, D054 eligibility, limits and all other checks; no bypass is introduced.
- **History:** Termination or transfer does not automatically remove earlier appearances, goals or statistics.
- **Alternatives/basis:** Consistent paired transfer versus independently terminating the old registration and creating the new one. Both alternatives used interval-based effectivity. The Team Leader chose no unintended loss of the old registration when the new one fails, accepting coordination and future-interval checks.
- **Record:** [ADR 0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#playing-effectivity-and-club-transfers); [glossary](../GLOSSARY.md#context-v2-additions).
- **Affected Phases:** PHASE 3 registration/transfers, PHASE 5 appearance eligibility, PHASE 6/PHASE 7 history and PHASE 10 overlap/concurrency verification. No Phase status changes.
- **Still open:** D057 below settles historical-registration correction policy. Season closure effects, field/temporal precision, future-plan changes/cancellation, quota evaluation across planned intervals and technical contracts. No financial transfer subsystem, external service or database mechanism is selected.

### D057 - Independently approved correction of validated registrations

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to grouped Q57, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), explicitly approving this v2 refinement to UC10.
- **Source:** O02/O08/O09/O12; UC10/UC11/UC19; D036/D055/D056.
- **Scope:** Correction of erroneous confirmed content/basis, classification conclusions or incorrectly recorded playing intervals, including historical correction, requires a proposal and independent approval. This adds no approval step to initial UC10 validity confirmation or ordinary termination/transfer.
- **Responsibility:** The Registration Officer reviews and proposes the correction with reason, basis, before/after values and related impacts. An authorized Season Manager other than the proposal's preparers/editors approves, returns for supplementation or rejects.
- **Pending review:** Keep the current official decision and record the need for review. New business work still validates against corrected source data under D036 rather than stale checks.
- **Validation:** Recheck conditions, limits and overlap for affected intervals using the corresponding regulations. Correction is not a waiver or a way to legitimize violations.
- **Invalid prior decision:** If the registration cannot remain valid, the proposal must state the disposition, such as ending effectivity or recording the prior decision as erroneous. Do not erase the registration's historical existence.
- **Match impacts:** Identify reports/results requiring separate review. Registration-correction approval does not automatically alter results, award a loss or change statistics; official-result changes still follow UC19.
- **Alternatives/basis:** Independent manager approval versus Registration Officer self-application with equivalent evidence/impact checks and history. The Team Leader chose independent control of data already used as a playing basis, accepting an added correction workflow and coordination with result correction.
- **Source refinement:** Preserve the v1 UC10 text. This confirmed v2 policy adds approval specifically for corrections of already validated registrations, not a claim that v1 already required it.
- **Record:** [ADR 0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#correction-of-validated-registrations); [glossary](../GLOSSARY.md#context-v2-additions).
- **Affected Phases:** PHASE 3 registration corrections, PHASE 5 match-impact review, PHASE 6/PHASE 7 historical outputs and PHASE 10 integrity verification. No Phase status changes.
- **Still open:** Detailed correction/impact fields, representation of an erroneous prior decision, historical public display, exact lifecycle/error and transaction/concurrency contracts. No automatic disciplinary action, match forfeiture or new UC is selected.

### D058 - Stable business codes, duplicate review and temporal shirt-number uniqueness

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to grouped Q58, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the proposed policy package.
- **Source:** O09/O12; UC05/UC07/UC09/UC10/UC12, BM1; D035/D055-D057.
- **Identity:** Seasons, clubs, stadiums and players have unique, stable, non-reusable business codes within each entity group. Names, abbreviations and birth dates do not replace identity codes. Duplicate codes are rejected.
- **Suspected duplicate players:** Matching normalized full name, birth date and nationality triggers staff review, not automatic merging or a hard uniqueness rule. Reuse the existing profile for the same person; distinct people may have separate profiles after confirmation with a recorded reason.
- **Clubs/stadiums:** Matching names trigger review; a shared name does not automatically identify the same entity.
- **Shirt numbers:** Require an integer 1-99 when confirming registration validity. In the same club-season, confirmed registrations with overlapping playing-effective intervals cannot share a number, including U21 and future-start registrations. Reuse is allowed after the old interval ends. The 1-99 range is an explicit v2 choice, not a PDF rule.
- **History/scope:** Current name/number changes do not automatically rewrite recorded history. Suspected duplicate records are not automatically merged or their references reassigned. Automatic profile-merging tools are outside the first-version scope.
- **Alternatives/basis:** Stable codes plus reviewable duplicate warnings versus hard-blocking identical player name/birth-date/nationality tuples; both used the same code/shirt rules. The Team Leader chose support for genuinely distinct people sharing attributes without collecting extra identity papers solely for duplicate resolution, accepting staff verification and residual duplicate risk.
- **Record:** [ADR 0009](../../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#business-codes-and-suspected-duplicates); [ADR 0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#shirt-number-constraints).
- **Affected Phases:** PHASE 2 identities/masters, PHASE 3 registrations, PHASE 5 appearance/history integration and PHASE 10 duplicate/concurrency verification. No Phase status changes.
- **Still open:** Code generation/format and database key types, normalization rules, detailed fields and duplicate-review UI, historical snapshot contracts and technical concurrency enforcement.

### D059 - Required registration data and official snapshot milestones

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to grouped Q59, the Team Leader selected option A: “Tôi chọn phương án A.” (“I choose option A.”), confirming the fields and snapshot package.
- **Source:** O04/O09/O12; BM1/BM4, UC05/UC07-UC12; D032-D036/D054-D058.
- **Required fields:** Season: code, name, start/end dates, with regulations managed separately. Club master: code, name, abbreviation. Stadium master: code, name. Player master: code, full name, birth date, nationality, position.
- **Club submission:** Require club, season, coach, home ground, representative name/phone/contact address and at least one proposed player, checked at preparation level. This does not require an already playing-effective registration before club approval.
- **Player confirmation:** Require player, club, season, shirt number, U21/homegrown classification results, playing-effective start and corresponding validation basis. Drafts may omit business fields; block progression at the milestone requiring completeness.
- **Homegrown evidence:** A positive finding requires qualifying-seasons/months branch, qualifying value, evidence summary and reference. Retain verifier/time/regulation version through the system. Upload functionality is not mandatory. Notes are optional; do not add personal identity papers.
- **Club snapshot:** At club-application approval preserve the approved version's club name/abbreviation, coach, home ground, representative details and proposed player list.
- **Player snapshot:** At validity confirmation preserve name, birth date, nationality, position, shirt number, classifications and regulation/verification basis. Approved corrections create a successor record while retaining the old one.
- **Seasonal lookup:** Use season-recorded information, including approved corrections, rather than automatically reading all latest master values. D032/D033 public/internal boundaries still apply.
- **Alternatives/basis:** Milestone completeness and descriptive snapshots versus the same required fields with snapshots limited to references/conclusions and current descriptive lookup. The Team Leader chose reproduction of approved records and stable seasonal views, accepting selective duplication and separation of current versus season-recorded information.
- **Record:** [ADR 0009](../../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#registration-snapshot-fields-and-seasonal-lookup); [ADR 0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#required-fields-at-registration-milestones).
- **Affected Phases:** PHASE 2 master/season fields, PHASE 3 intake/snapshots, PHASE 6 seasonal lookup and PHASE 10 validation/history verification. No Phase status changes.
- **Still open:** Detailed types/lengths/formats and normalization, position/nationality representations, exact snapshot schema/record references, schedule/report snapshot contracts and implementation-level concurrency. No upload technology or identity-document collection is selected.

### D060 - Automatic fixture pairing with manually completed schedule drafts

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to grouped Q60, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O10/O12; QĐ2, UC13, TH-02; D005/D044.
- **Supported scope:** First-version double round-robin with an even club count from 4 through 20, default 20. The 4-20 range is a confirmed v2 scope choice. Report odd counts, single-leg and other unsupported formats explicitly rather than generate an invalid schedule.
- **Input/generation:** The Scheduling Officer selects exactly the configured number of clubs, all with approved participation applications. Generate all rounds and pairings automatically, reversing home/away roles between legs: 2*(N-1) rounds and N*(N-1) matches; the default produces 38 rounds and 380 matches.
- **Completion:** Staff enter dates/times; suggest the registered home ground. Stadium substitutions remain subject to source approval conditions. No automatic complete calendar/venue optimization is required.
- **Drafts/approval:** Persist incomplete drafts with missing-field/conflict feedback; drafts are not public. Submit the entire initial schedule only after complete data, correct structure and successful club/stadium checks. Publication requires D005 approval; do not approve the initial schedule in separate partial sections.
- **Alternatives/basis:** Automatic pairings/rounds/home-away with manual completion versus automatic dates/times/venue assignment as well. The Team Leader chose useful automation at SE104 scope, accepting staff allocation/conflict resolution instead of availability datasets and an optimization engine.
- **Record:** [ADR 0012](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md).
- **Affected Phases:** PHASE 2 supported regulation configuration, PHASE 4 generation/drafts/approval, PHASE 6 published lookup and PHASE 10 schedule verification. No Phase status changes.
- **Still open:** D061 below settles playing/venue planning intervals and buffers. D062 below settles adjustment/version/publication and regeneration policy. Snapshot/schema/API/concurrency contracts. No 90-minute duration, buffer, algorithm library or generation-time target is assumed.

### D061 - Seasonal planning intervals and system-wide schedule conflict checks

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to grouped Q61, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the proposed interval/conflict package.
- **Source:** O03/O07/O10/O12; QĐ2.4-QĐ2.6, UC13/UC14; D024/D044/D060.
- **Parameters:** Require season-approved planned match duration, pre-match stadium preparation buffer and post-match release buffer, all in minutes. Duration is positive; buffers are nonnegative. Do not silently default to 90 minutes or any buffer. Lock all three from initial schedule approval in first-version scope.
- **Intervals:** Club use is [scheduled start, scheduled start + planned duration). Venue occupancy is [scheduled start - preparation buffer, planned end + release buffer). Reject overlapping club or stadium intervals; exact adjacency is permitted.
- **Scope:** Check the same club or stadium system-wide, including other seasons. Validate a draft against itself and approved schedules; drafts and pending requests do not reserve capacity.
- **Approval/adjustment:** Recheck conflicts before successful approval, including concurrent requests. An adjustment replaces its own match's old allocation rather than conflicting with itself. Date/time/stadium changes still follow UC14.
- **Operational boundary:** These intervals support planning; actual kickoff remains recorded under D047/D048 and does not automatically edit the approved schedule. First-version scope adds no minimum between-match rest or club travel-time constraint.
- **Alternatives/basis:** Derive intervals from common seasonal parameters versus enter separate playing/occupancy intervals per match. The Team Leader chose less per-match data entry and consistent checks at SE104 scale, accepting reduced venue/match-specific flexibility.
- **Record:** [ADR 0012](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md#planning-intervals-and-conflict-checks); [glossary](../GLOSSARY.md#context-v2-additions).
- **Affected Phases:** PHASE 2 regulation parameters, PHASE 4 scheduling/adjustments, PHASE 6 schedule lookup and PHASE 10 boundary/concurrency verification. No Phase status changes.
- **Still open:** Concrete per-season minute values, snapshot/schema/API and technical concurrency contracts. D062 below settles adjustment/publication/regeneration policy. No interval may be treated as a factual actual match duration.

### D062 - Schedule approval publishes immediately and adjustments are versioned

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to grouped Q62, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the lifecycle/publication package.
- **Source:** O08/O09/O10/O12; UC13-UC15; D005/D019/D044/D060/D061.
- **Initial lifecycle:** The Scheduling Officer drafts and submits a complete schedule; an authorized person other than its preparers/editors approves it. Successful approval publishes immediately, without a separate publication step.
- **Pending versions:** Submitted content is immutable. Before a decision the preparer may withdraw it; the approver may return it for supplementation or reject it with reasons. Changes and resubmission create a new version with history.
- **Regeneration:** Regenerate only while the initial schedule is still unapproved and in draft, with confirmation of replacement and traceability of the previous version. After publication, prohibit whole-schedule regeneration and changes to pairings, rounds or home/away roles.
- **Adjustments:** Propose date/time or stadium changes with reasons and before/after values. One proposal may cover several matches in the same season; approve/apply the entire proposal or none. The old schedule remains public pending approval.
- **Match eligibility:** Adjust only matches not yet started. If scheduled kickoff has passed, the approver must establish with supporting basis that the match has not taken place; elapsed scheduled time alone proves neither played nor unplayed status.
- **Final checks/publication:** Recheck match state, authority, schedule version and D061 conflicts on adjustment approval. Changed underlying data requires review/resubmission. Successful approval updates the public schedule and preserves history. Retain D005/D019 authority and separation rules, including delegated adjustment approvers.
- **Alternatives/basis:** Immediate publication on approval versus a separate approved-but-unpublished state and Season Manager publication action, with the same other workflow safeguards. The Team Leader chose fewer operations and no gap between approved and public versions, accepting that approvers must be ready for immediate publication.
- **Record:** [ADR 0012](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md#schedule-lifecycle-and-publication).
- **Affected Phases:** PHASE 4 schedule workflow/adjustments, PHASE 6 publication/history and PHASE 10 workflow/concurrency verification. No Phase status changes.
- **Still open:** Exact action/state codes, supporting-basis fields, match-state recording, snapshot/display details and transaction/API/concurrency contracts. No notification service or automatic publication scheduler is selected.

### D063 - Separate match, report-version and official-result lifecycles

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to grouped Q63, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the lifecycle package.
- **Source:** O08/O09/O12; UC16-UC20; D005/D047-D049/D062.
- **State groups:** Match: Not started -> In progress -> Ended. Report version: Draft -> Pending confirmation -> Confirmed, with return for supplementation or withdrawal before a decision. Result: Unofficial -> Official, with correction proposals managed separately.
- **Actual times:** The Results Officer records actual kickoff and actual end in the report. Require both before submission; end must be after start. Scheduled time or planned duration alone cannot establish completion. Both actual instants may be entered after the match; live operation at start/end is not required.
- **Version control:** Keep one report case per match with historical versions, and at most one version pending confirmation or correction at a time. Submitted content is immutable; withdrawal/return and a new submitted version are required for changes.
- **Initial confirmation:** UC18 requires an ended match and a complete validated report, with previously confirmed authority/separation rules. Saving the report or entering a score does not make it official.
- **Corrections/consistency:** The current official result remains public and feeds statistics pending UC19 approval. Return/rejection/withdrawal of a correction does not invalidate it. Successful confirmation/correction consistently updates result, statistics and history under UC18-UC20; failure must not leave partial official/statistical updates.
- **Alternatives/basis:** Separate linked business states versus one combined match/result state chain. The Team Leader chose accurate representation of completion, pending versions and still-effective official results, accepting checks between multiple state groups.
- **Record:** [ADR 0013](../../../docs/adr/0013-match-report-and-official-result-lifecycles.md); [glossary](../GLOSSARY.md#context-v2-additions).
- **Affected Phases:** PHASE 5 report/result workflow, PHASE 4 match-state adjustment checks, PHASE 6/PHASE 7 official outputs and PHASE 10 lifecycle/concurrency verification. No Phase status changes.
- **Still open:** Appearance/event validation, actual-time precision, detailed transitions/errors and supporting fields, snapshots and transaction/API contracts. These internal business states do not select or approve the deferred Live Score design.

### D064 - Kickoff-based appearance eligibility and report-defined goalkeepers

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to grouped Q64, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the appearance/goalkeeper package.
- **Source:** O02/O06/O09/O12; QĐ3.2/QĐ5.7, BM3, UC16/UC18/UC20; D047/D048/D056.
- **Eligibility instant:** Each appearing player needs a validated registration for the correct club-season whose playing-effective interval contains actual kickoff. Late report entry does not substitute the player's current club for the historical basis.
- **Appearance lists:** Each team has a nonempty list. A player appears at most once per match and belongs to one of its two teams. First-version scope adds no mandatory eleven-player count, tactical formation or substitution management.
- **Shirt/position:** Take shirt number from the applicable registration at the assessment instant. Record match position separately; it may differ from profile position.
- **Goalkeeper validation:** Before submission/confirmation, each team's report list must identify exactly one goalkeeper by match position. Missing or multiple goalkeepers block submission/confirmation until corrected; do not automatically choose one or skip statistics.
- **Clean sheets:** For official results, a team conceding no goals credits one clean sheet to its report-defined goalkeeper. Goalkeeper substitutions remain outside source scope.
- **History:** At confirmation preserve registration basis, name, shirt number and match position. Subsequent transfer/master updates do not automatically change the report; official corrections still follow UC19.
- **Alternatives/basis:** Match-position goalkeeper designation versus deriving goalkeeper from registered profile position with the same exact-one validation. The Team Leader chose actual match roles and consistent late-entry history, accepting staff entry and resolution of incomplete/conflicting lists.
- **Record:** [ADR 0013](../../../docs/adr/0013-match-report-and-official-result-lifecycles.md#appearance-eligibility-and-goalkeeper-basis).
- **Affected Phases:** PHASE 3 registration-history integration, PHASE 5 reports/clean sheets, PHASE 6/PHASE 7 historical outputs and PHASE 10 temporal/goalkeeper verification. No Phase status changes.
- **Still open:** D065 below settles goal/card/time/referee policy. Golden Glove ties, detailed appearance/snapshot schema and correction/concurrency contracts. No disciplinary or substitution subsystem is selected.

### D065 - Structured event minutes, score checks and referee-signature references

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to grouped Q65, the Team Leader selected option A: “tôi chọn A.” (“I choose A.”), confirming the event/referee package.
- **Source:** O09/O12; BM3, QĐ3.3-QĐ3.5, UC16-UC19; D046-D049/D063/D064.
- **Event minutes:** Store integer main minute 1-90 and nonnegative integer added time; positive added time is allowed only with main minute 45 or 90. Display 45+2 or 90+5 without converting 45+2 to minute 47. First-half added time sorts before minute 46.
- **Scope:** This is the first-version report convention, without extra-time or penalty-shootout events. D061 planning duration remains separate.
- **Event validity:** Require an appearing player, the player's correct club, a valid type from the match's applicable catalog and a valid event time. Retain source default types; add no types implicitly.
- **Score:** Derive scores from valid goals; own goals benefit the opposing team and do not count toward personal goals. The entered final score must match; mismatch blocks submission/confirmation.
- **Cards:** Record yellow/red cards from the report, without automatic suspensions, forfeitures or a disciplinary subsystem.
- **Referee basis:** Before submission require referee full name, original-report identifier/reference and the inputter's confirmation of cross-checking the signature on the original. Retain verifier/time; the approver reviews this basis with the report.
- **History/attachments:** Preserve events and referee basis in the confirmed version; corrections use UC19. First version requires no signature image, scanned attachment or digital-signature implementation. This specifies v2 representation of BM3's signature basis, not deletion of the source field.
- **Alternatives/basis:** Original-report reference and recorded signature cross-check versus mandatory scanned signed-report attachment with the same event/score rules. The Team Leader chose traceability without file/signature infrastructure, accepting reliance on staff verification and access to the original.
- **Record:** [ADR 0013](../../../docs/adr/0013-match-report-and-official-result-lifecycles.md#event-minutes-scores-and-referee-basis); [glossary](../GLOSSARY.md#context-v2-additions).
- **Affected Phases:** PHASE 5 report validation, PHASE 6/PHASE 7 official output/history and PHASE 10 boundary/evidence verification. No Phase status changes.
- **Still open:** Exact event/referee schema/lengths, source-reference format, duplicate-event feedback, detailed snapshot/display/API and concurrency contracts. No upload or digital-signature technology is selected.

### D066 - Shared standings ranks and shared individual awards

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).
- **Confirmation evidence:** In response to grouped Q66, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).
- **Source:** O05/O06/O12; QĐ5.3-QĐ5.5/QĐ5.7, BM5.1-BM5.3; D045/D064.
- **In-season ranks:** Clubs equal on all applicable main ranking criteria share competition ranks, e.g. 1, 2, 2, 4. Do not use head-to-head criteria reserved for end-of-season resolution during the season. Use stable club-code order within a tied group only for presentation, without a sporting advantage or distinct rank.
- **Season-end stakes:** Mark unresolved tied groups affecting championship, qualification or relegation for the source's additional-criteria/playoff process. Do not resolve sporting outcomes by club name/code. The detailed resolution workflow remains open.
- **Individual awards:** Retain shared top-scorer awards under the source, without implicit assists/appearances/minutes tiebreakers. Goalkeepers tied for the highest clean-sheet total share the Golden Glove, without extra ratios, appearances or goals-conceded tiebreakers.
- **Positive achievement:** Identify top-scorer recipients only with at least one valid personal goal, and Golden Glove recipients only with at least one clean sheet. Otherwise show no recipient yet, not a shared award for all zero totals.
- **Recalculation/finalization:** Valid official-result corrections update tied groups and award leaders. Final awards are confirmed through season summary.
- **Alternatives/basis:** Shared Golden Glove versus fewer appearances as an additional tiebreaker, then a shared award if still tied. Both retained the proposed club-ranking/top-scorer policies. The Team Leader chose transparent equal-achievement treatment without extra unsupported criteria, accepting multiple Golden Glove recipients and nonunique in-season ranks.
- **Record:** [ADR 0014](../../../docs/adr/0014-shared-ranks-and-individual-awards.md); [glossary](../GLOSSARY.md#context-v2-additions).
- **Affected Phases:** PHASE 5 standings/statistics, PHASE 6 public lookup, PHASE 7 reports/summary and PHASE 10 tie/award verification. No Phase status changes.
- **Still open:** Exact head-to-head/multi-club calculations, qualification/relegation parameters, playoff recording, summary approval and technical contracts. D066 does not settle those remaining season-end choices.

## Pending v2 extensions

See the [pending decision queue](pending-decisions.md). V2-EXT-01 records the Team Leader's requested Live Match Tracking / Live Score improvement and explicit reference-data boundaries. Its design interview is deferred until the existing foundation decision groups are complete, and must be raised proactively before the v2 summary and package-approval proposal. It is not D037, not a resolved Oxx and not approved implementation design.

## Decision coverage

All 16 source issues remain **OPEN** until their constituent decisions are confirmed. O12 has partial confirmed coverage through D001, D002, D007, D011, D022, D024, D030, D031, D034-D036 and D042-D066. O03 has confirmed policy coverage through D024's time zone and D061's planned club/venue intervals, buffers, boundaries and global conflict scope; concrete seasonal values and technical enforcement remain open. O04 has partial confirmed coverage through D032-D034 and D059's seasonal lookup basis, including the explicit player-birth-date exception and responsibility-based internal viewing; detailed field/file/log scopes remain open. O08 has partial confirmed coverage through D003-D023, D025-D031, D033-D034, D037-D041 and D051/D053/D055-D057 and D062-D063. O07 has partial confirmed coverage through D005's separation rule for regulation approval and D013-D023 and D025-D030's delegation model/responsibilities/authority limits/recipient matrix/termination/revocation/session/time/duration policies; D042 settles immutable approved regulation versions and D043 permits immediate/future effectivity without backdating; D044 freezes competition structure after initial schedule approval and D045 freezes points/ranking priority after the first official result; D046 preserves referenced goal/card type codes and meanings and D047 binds their applicability to recorded actual kickoff; D050 limits each season to one approved future version and D051 governs controlled cancellation/replacement and activation checks; D052 permits compatible registration-rule changes and revalidates pending records; D053 establishes calendars, receipt deadlines and individual exceptions; detailed effectivity and remaining group policies stay open. O09 has partial confirmed coverage through D036's general correction policy and D046-D049's event-type preservation/applicability and actual-kickoff recording/correction workflow, plus D054's eligibility-evidence policy and D057's validated-registration correction/impact review; D058 settles business-code identity, duplicate warnings and temporal shirt-number rules; D059 settles master/registration required fields and snapshot milestones; D063 establishes report/match states and required actual start/end; D064 settles appearance eligibility and goalkeeper basis; D065 settles event-minute/score checks and referee-signature basis; detailed correction/technical contracts and schema/display details remain open. None is RESOLVED. O10 has partial coverage through D044's structural freeze and D060's pairing automation, supported configurations, incomplete drafts and whole-schedule submission; D062 adds regeneration safeguards, versioned adjustments and immediate publication; exact lifecycle/action and technical contracts remain open. O01 has partial coverage through D052's change/impact policy and D054's U21 comparison/configuration and staff homegrown-verification policy; D059 settles required evidence fields; concrete seasonal values and detailed validation/format contracts remain open. O02 additionally has D053's windows/deadline/exception policy and D055's versioned club/player workflows; D056 adds playing intervals and consistent transfers; D057 adds independent historical-registration correction; concrete calendar dates, detailed exception/action transitions, closure effects and detailed action/correction contracts remain open. O06 has partial coverage through D064's report-position goalkeeper basis and missing/multiple-goalkeeper gate; D066 adds shared Golden Glove and positive-achievement thresholds. O05 has partial coverage through D066's shared-rank presentation and unresolved-stakes policy; detailed head-to-head/playoff/summary decisions remain open. O11 and O13-O16 have no confirmed resolutions in v2 yet. The new Live Score request is separately queued as V2-EXT-01, not counted as a resolved v1 issue. The [v1 register](../open-decisions.md) is retained as the source baseline; this supplement records subsequent confirmations.

## Interview order

Interview guidance updated by the Team Leader after Q50: ask only material decisions requiring approval, group related policy choices where they can be assessed together, and do not repeat confirmed decisions. Preserve completeness, consistency and implementability. Distinguish proposed technical elaborations from confirmed decisions; seek confirmation for new material trade-offs rather than every mechanical consequence. Do not use question-count reduction to conceal unresolved requirements.

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

Q1-Q66 are confirmed as D001-D066; the package as a whole remains DRAFT. Q66 establishes shared ranks, shared individual awards and positive-achievement thresholds. The Team Leader requested a break before Q67; no Q67 question or answer is recorded. Resume with grouped head-to-head/playoff and season-summary decisions, recomputing dependencies before asking. The updated working estimate is 30-45 further question turns, including foreseeable follow-ups, technical design, operations, Live Score and final consistency/approval; it is not a fixed cap. Ask only material decisions, grouping related policies and avoiding repeated confirmations. Interview V2-EXT-01 after the foundation groups and before summary/approval. A commit message is requested as a suggestion only; no commit/push is authorized.
