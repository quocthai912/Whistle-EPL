# ADR 0022 - Targeted locks and idempotent commands

Current package approval: [Q98 approved v2](../../context/README.md#q98---whole-package-approval). Earlier pending/open statements below are historical interview evidence; current rules remain in their linked owners.

**Status:** accepted. **Decision:** D084. The Team Leader selected Q84 option A ("Tôi chọn A."), confirming the full common package. Authoritative policy is owned by [D084](../../context/design/architecture.md#d084---revision-checks-idempotent-commands-and-targeted-transaction-locks).

Choose Read Committed with explicit domain-resource/season/authorization synchronization rather than blanket Serializable writes. This makes the intended contention points explicit, accepting responsibility for a complete guard/lock-order design and concurrent tests. Technical revisions reject stale edits independently of immutable business versions. PostgreSQL command receipts commit atomically with critical operations; matching retries recover outcomes for 24 hours under current access checks, and changed content with the same key is rejected. Retry at most three total attempts only after known rollback; unknown commit outcomes require receipt lookup.

The trade-off was checked against PostgreSQL documentation on [explicit locks](https://www.postgresql.org/docs/current/explicit-locking.html) and [isolation](https://www.postgresql.org/docs/current/transaction-iso.html). Existing authorization expiry, bootstrap/last-administrator protection, cross-season conflicts and full-season statistics remain binding. Exact guards, receipt representation, timeout/error mapping and indexes remain open; no distributed infrastructure or implementation is selected.

## Q96 - Shared lock order and receipt transport

The Team Leader approved D096 option A and its full package. [D096](../../context/design/architecture.md#d096---api-execution-synchronized-csrf-and-transaction-contracts) now elaborates lock groups, critical-command Idempotency-Key/digest/ambiguity handling, safe error mappings and the owning UC execution matrices. D084 retains Read Committed, targeted synchronization, 24-hour receipts and at most three rolled-back transient execution attempts. Exact SQL/timeout/configuration is implementation-plan elaboration, not an additional business policy or implementation approval.
