# ADR 0004 - Administrator bootstrap and emergency recovery through server CLIs

This ADR records decisions and rationale; authoritative current rules are owned by [D008](../../context/english/use-cases/administration.md#d008---first-system-administrator-bootstrap-through-a-server-cli), [D011](../../context/english/use-cases/administration.md#d011---emergency-recovery-cli-for-existing-administrators). Historical open-point notes do not reopen subsequently confirmed policy.

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q8, option A; Context decision [D008](../../context/english/use-cases/administration.md#d008---first-system-administrator-bootstrap-through-a-server-cli).

UC03 (PDF pp.72-74) requires an authorized administrator for ordinary account management, but O08 leaves initial administrator creation open. The Team Leader approved a CLI run on the server rather than a first-time web setup page, with explicit safeguards. Initialization is allowed only when no System Administrator account exists, including locked accounts. Concurrent executions must preserve that condition, creating at most one bootstrap administrator without partial initialization. No public bootstrap API or web page is provided.

The installer supplies the username and password without default credentials. Password input must be secure: passwords must not appear in command-line arguments, logs or the repository, and must be hashed before storage. The initial account has system administration authority; seasonal business roles are managed separately. Subsequent ordinary account management uses UC03. This keeps bootstrap within server installation at the cost of requiring a server command.

Exact command/input implementation, concurrency mechanism, password-hashing algorithm/parameters and bootstrap audit details remain open. [D011](../../context/english/use-cases/administration.md#d011---emergency-recovery-cli-for-existing-administrators) below settles the separate emergency recovery flow; the bootstrap flow must not reset, replace or add to existing administrator accounts. See [Context v2 D008](../../context/english/use-cases/administration.md#d008---first-system-administrator-bootstrap-through-a-server-cli).

## Emergency recovery of existing administrators

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q11, option A; Context decision [D011](../../context/english/use-cases/administration.md#d011---emergency-recovery-cli-for-existing-administrators).

An operator with server access may run a separate emergency recovery CLI to reset the password and/or unlock an existing account that already holds the System Administrator role. The command must not create accounts, grant the System Administrator role or change seasonal business permissions. No public API or web page exposes this emergency recovery flow. This is an explicitly approved v2 operational refinement, not an additional actor or UC.

Replacement passwords require secure input, must not appear in command-line arguments, logs or the repository, and must be hashed before storage. Successful recovery invalidates every existing session for the target account. Require a recovery reason and record the operator's identity, time, target account and operation type without passwords. Compared with relying only on another administrator, the CLI allows recovery when no administrator can log in, at the cost of protecting execution and auditing recovery actions. It remains distinct from [D008](../../context/english/use-cases/administration.md#d008---first-system-administrator-bootstrap-through-a-server-cli) bootstrap.

Exact command and server/operator authorization, operator identification, secure-input implementation, hashing algorithm/parameters, atomic recovery/audit/session invalidation and concurrent recovery handling remain open. Ordinary password operations and self-reduction of business permissions are not settled here. See [Context v2 D011](../../context/english/use-cases/administration.md#d011---emergency-recovery-cli-for-existing-administrators).

### D008 english evidence

Current policy owner: [D008](../../context/english/use-cases/administration.md#d008---first-system-administrator-bootstrap-through-a-server-cli). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** The Team Leader explicitly confirmed Q8 option A, a server-side CLI, and supplied the mandatory safeguards recorded below.

- **Source:** O08; UC03, PDF pp.72-74; BM-03/BM-06, pp.23-24; CN-03, p.26; [D003](../../context/english/use-cases/administration.md#d003---season-scoped-business-permissions)/[D006](../../context/english/use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments).

- **Alternatives/basis:** A server CLI versus a first-time web setup page. The Team Leader chose the CLI with explicit credential and concurrency safeguards, avoiding a public bootstrap endpoint while accepting that installation includes a server command.

- **Record:** [ADR 0004](0004-first-administrator-cli-bootstrap.md).

- **Affected Phases:** PHASE 1 foundation/account setup and PHASE 10 fresh-installation/operations verification. No Phase status changes.

- **Still open:** Exact bootstrap CLI command and secure-input implementation, concurrency mechanism, password hashing parameters and bootstrap audit details remain open. [D011](../../context/english/use-cases/administration.md#d011---emergency-recovery-cli-for-existing-administrators) settles the separate emergency recovery flow. Existing administrator accounts must not be reset, replaced or supplemented through this bootstrap flow; emergency recovery is governed by [D011](../../context/english/use-cases/administration.md#d011---emergency-recovery-cli-for-existing-administrators).

### D011 english evidence

Current policy owner: [D011](../../context/english/use-cases/administration.md#d011---emergency-recovery-cli-for-existing-administrators). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q11, the Team Leader agreed to option A, including the proposed recovery scope and safeguards.

- **Source:** O08/O12; UC03, PDF pp.72-74; BM-02/BM-03/BM-06, pp.23-24; [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking)-[D010](../../context/english/use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions). This is an explicitly approved v2 operational refinement, not an additional actor or UC.

- **Alternatives/basis:** A separate server recovery CLI versus relying only on another administrator. The chosen approach supports recovery when no administrator can log in, at the cost of protecting command execution and auditing recovery actions. [D008](../../context/english/use-cases/administration.md#d008---first-system-administrator-bootstrap-through-a-server-cli) bootstrap remains separate and unavailable when an administrator account exists.

- **Record:** [ADR 0004](0004-first-administrator-cli-bootstrap.md#emergency-recovery-of-existing-administrators).

- **Affected Phases:** PHASE 1 account/session operations and PHASE 10 operational verification. No Phase status changes.

- **Still open:** Exact command and server/operator authorization contract, operator identification, secure input implementation, hashing algorithm/parameters, atomic recovery/audit/session invalidation and concurrent recovery handling. Ordinary password changes/resets and self-reduction of business permissions are not decided by this emergency flow.

## Q81 follow-up - Credential hashing and first-login change

[D081](../../context/english/use-cases/administration.md#d081---password-hashing-and-managed-credential-lifecycle) selects Argon2id and requires first-login password change after bootstrap/reset. Existing CLI scope, secure input, no-default-password and session-invalidation safeguards remain binding. Full approval/rationale is in [ADR 0020](0020-password-and-account-lifecycle.md); this does not expose a public bootstrap/recovery service.
