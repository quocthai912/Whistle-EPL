# ADR 0020 - Password hashing and managed account credentials

**Status:** accepted. **Decision:** D081. The Team Leader selected Q81 option A ("Tôi chọn A."), confirming the full proposed package. Authoritative policy is owned by [D081](../../context/english/use-cases/administration.md#d081---password-hashing-and-managed-credential-lifecycle).

Choose Argon2id over bcrypt for the new application, accepting target-load verification of the initial m=19456 KiB/t=2/p=1 configuration. Passwords support long Unicode/whitespace passphrases without composition rules or silent truncation, and common-password checks remain local. UC03-managed temporary credentials, first-login change after provisioning/bootstrap/reset, all-session invalidation on self-change, and distinct reset/unlock actions keep recovery within the approved internal/CLI scope. Temporary login throttling is separate from administrator account locking, and historical accounts are retained.

The algorithm/strength approach was checked against [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) and [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html). The 24-hour temporary expiry and login-throttling thresholds are approved project choices. No specific hashing library, email service, public reset service, implementation or whole-v2 approval is established; detailed contracts remain open.

## Q96 - Hashing and rolling-counter completion

The Team Leader approved D096 option A and the entire common package. [D096](../../context/english/design/architecture.md#d096---api-execution-synchronized-csrf-and-transaction-contracts) now specifies Unicode-code-point/UTF-8 handling without password transformation, the initial Argon2id cost and PostgreSQL rolling-counter semantics/trusted-proxy inputs. D081 credential lifecycle, length/strength, temporary expiry, reset/unlock separation and thresholds remain unchanged. Reviewed blocklist/library/environment and handoff runbook details remain Q97/implementation planning; no external password API is selected.
