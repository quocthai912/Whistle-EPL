# PHASE 1 Operator Interface and Recovery Contract

**Status**: Bootstrap/recovery and maintenance/backup/restore/verify root commands are implemented, verified and published in T015–T022 at [`7ac09e6`](https://github.com/quocthai912/Whistle-EPL/commit/7ac09e6cec9fb434248c82db142ab04695961823); see [execution evidence](../../../docs/verification/phase-1/operator-foundation.md). Isolated fixture modules exist, but the planned root test:fixtures/test:reset aliases remain unavailable. Full installation/browser/operational acceptance is pending.
Owners: [D008/D011](../../../docs/adr/0004-first-administrator-cli-bootstrap.md),
[D087-D089/D096/D097](../../../context/design/architecture.md) and
[Q102 allocation](../../../context/progress-checker.md#phase-1-specification-readiness-and-foundation-verification).

## Execution Authority

Operator commands run locally in the protected server installation. Deployment must restrict
the executable/service environment to authorized host operators, derive the audit identity
from the authenticated OS/operator execution context and protect DB credentials. A caller-
supplied display name alone is not operator authentication. Exact host accounts/group/sudo
configuration is a deployment/runbook input. No browser session, public route or remote
fixture endpoint is required or permitted for these operator paths.

## Command Families and Availability

Commands run through root pnpm scripts/installed backend entry points; exact package patches
are verified during setup. Passwords are secure prompts, never flags, environment defaults,
returned JSON, repository fixtures or command logs. Non-secret identifiers/reasons may be
arguments. Prompts must not echo secrets, including on errors; tests inject an isolated prompt
adapter rather than placing a secret in argv.

| Root command | Non-secret input | Success and rejection contract |
|---|---|---|
| pnpm admin:bootstrap | personnel code, full name, username; secure password prompt | No administrator, including locked, may exist; at most one concurrent success; create personal administrator + change-required credential + audit atomically; no business grants |
| pnpm admin:recover | existing administrator identifier, reset/unlock selection, nonblank reason; secure prompt if resetting | Target already has administrator role; never create/promote/change business authority; invalidate all sessions, preserve reset/unlock distinction and audit operator identity atomically |
| pnpm ops:backup | named environment/config profile; optional pre-migration/manual reason | Close admission/drain writers; complete versioned manifest/checksums + database/available media inventory; never publish incomplete/overlapping set; keep seven complete sets |
| pnpm ops:restore | validated backup-set identifier and isolated/operational target profile, explicit operator confirmation | Keep host/DB maintenance active; reject incompatible/corrupt/incomplete set; restore same-set data, verify constraints/functions, revoke restored sessions; reopen only after verification |
| pnpm ops:maintenance | status/close/release and reason | Release requires successful verification of the selected operation; ordinary backend restart never auto-releases interrupted restore |
| pnpm ops:verify | explicit isolated target profile and fixture/backup-set manifest | Run ops/backup/verify-foundation.sh for available-foundation persistence/backup/restore/failure checks; reject non-isolated targets and return nonzero if any required check fails; no full-season/media acceptance claim |
| pnpm test:fixtures / pnpm test:reset | explicit isolated test target/profile and fixture manifest | Reject operational/non-isolated URLs; deterministic synthetic identities/seasons/clock; no implicit startup action, business authority or acceptance credit |

Exit 0 only for completed requested outcome; nonzero for invalid input, unauthorized operator,
failed invariant or processing failure. Safe messages contain operation correlation and release
condition, not credentials. Unknown commit outcome is resolved before repeating a critical effect.

## Maintenance, Scheduling and Durability

Use pre-created guards, shared ordinary-writer admission and exclusive drain synchronization
with persisted closed state. An operator-owned durable marker outside the restored DB snapshot
survives controlling-process/DB restart and old-snapshot restoration. Configure it as protected
reference-host state, readable to admission checks but writable only to the operator procedure.
Do not rely solely on a connection-lifetime advisory lock or open DB transaction across dumps.

All actual writers participate: auth/session activity, prelogin/counters, administration,
audit/receipts, CLI and cleanup. Safe reads may continue; a read that writes activity cannot
bypass admission. Checks/release are explicit and failure keeps maintenance closed.

Reference backup schedule is daily 03:00 Asia/Ho_Chi_Minh via host systemd timers; missed runs
are detected and unresolved failures visible. Retry after 15 minutes, at most three retries
for that due run. Downtime is not a successful backup. Complete sets are restricted, separate
from live data/Git/public paths and include inventory/schema/app versions/checksums; an Internet
profile requires an off-host destination supplied by the operator. Do not buy/select a provider.

Hourly eligible technical cleanup uses backend scheduling/transactions, preserving active
blocks/windows and receipt retention; diagnostic logs rotate at 30 days. No media cleanup or
regulation-activation business is delivered in PHASE 1. Preserve their later approved contracts.

## Verification

Prove bootstrap race/existing-locked rejection, recovery target restrictions, no secret exposure,
atomic recovery/audit/session effects, set verification, failed/missed/overlapping backup runs,
process/connection loss during restore, closed-state persistence and fresh login after restore.
Use a separate isolated target and independent state inspection. Compare the actual available
foundation data to its backup-point inventory; this is not complete BM-07 season/media acceptance.

No command, timer or restore has been implemented or run by this contract document.
