# ADR 0004 - Administrator bootstrap and emergency recovery through server CLIs

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q8, option A; Context decision D008.

UC03 (PDF pp.72-74) requires an authorized administrator for ordinary account management, but O08 leaves initial administrator creation open. The Team Leader approved a CLI run on the server rather than a first-time web setup page, with explicit safeguards. Initialization is allowed only when no System Administrator account exists, including locked accounts. Concurrent executions must preserve that condition, creating at most one bootstrap administrator without partial initialization. No public bootstrap API or web page is provided.

The installer supplies the username and password without default credentials. Password input must be secure: passwords must not appear in command-line arguments, logs or the repository, and must be hashed before storage. The initial account has system administration authority; seasonal business roles are managed separately. Subsequent ordinary account management uses UC03. This keeps bootstrap within server installation at the cost of requiring a server command.

Exact command/input implementation, concurrency mechanism, password-hashing algorithm/parameters and bootstrap audit details remain open. D011 below settles the separate emergency recovery flow; the bootstrap flow must not reset, replace or add to existing administrator accounts. See [Context v2 D008](../../context/english/design/README.md#d008---first-system-administrator-bootstrap-through-a-server-cli).

## Emergency recovery of existing administrators

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q11, option A; Context decision D011.

An operator with server access may run a separate emergency recovery CLI to reset the password and/or unlock an existing account that already holds the System Administrator role. The command must not create accounts, grant the System Administrator role or change seasonal business permissions. No public API or web page exposes this emergency recovery flow. This is an explicitly approved v2 operational refinement, not an additional actor or UC.

Replacement passwords require secure input, must not appear in command-line arguments, logs or the repository, and must be hashed before storage. Successful recovery invalidates every existing session for the target account. Require a recovery reason and record the operator's identity, time, target account and operation type without passwords. Compared with relying only on another administrator, the CLI allows recovery when no administrator can log in, at the cost of protecting execution and auditing recovery actions. It remains distinct from D008 bootstrap.

Exact command and server/operator authorization, operator identification, secure-input implementation, hashing algorithm/parameters, atomic recovery/audit/session invalidation and concurrent recovery handling remain open. Ordinary password operations and self-reduction of business permissions are not settled here. See [Context v2 D011](../../context/english/design/README.md#d011---emergency-recovery-cli-for-existing-administrators).
