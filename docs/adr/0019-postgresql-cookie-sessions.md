# ADR 0019 - PostgreSQL server-side sessions with protected cookies

**Status:** accepted. **Decision:** D080. The Team Leader selected Q80 option A ("Tôi chọn A"), confirming the full proposed package. Authoritative policy is owned by [D080](../../context/english/design/architecture.md#d080---postgresql-server-side-sessions-with-protected-cookies).

Choose server-side PostgreSQL sessions and opaque protected-cookie tokens over JWT access/refresh tokens. This reuses the chosen database and supports the already-approved revocation/current-authority rules, accepting server-side session lookup on authenticated requests. Hash stored tokens, use protected cookies with a new token on login, deploy frontend/API under one HTTPS origin, and apply CSRF token/origin protections including login/logout. Allow concurrent sessions, current-session logout and all-session invalidation on existing access-change events. The Team Leader approved 30-minute idle and 8-hour absolute timeouts as project values, not externally mandated thresholds.

The security design was checked against [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) and [CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html). Exact implementation contracts remain open; no session/password library, deployment provider, reverse proxy or new cache infrastructure is selected.

## Q96 - Transport and CSRF completion

The Team Leader approved D096 option A and its entire package. [D096](../../context/english/design/architecture.md#d096---api-execution-synchronized-csrf-and-transaction-contracts) now owns the token/hash/cookie, synchronized CSRF, prelogin context and shared execution details left open in the original D080 interview. D080 session duration/revocation/concurrency rules remain unchanged; [ADR 0023](0023-shared-rest-contract.md#q96---execution-security-and-concurrency-contracts) records the chosen CSRF trade-off. Q97 library/environment configuration remains open.
