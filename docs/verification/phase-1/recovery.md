# Available-foundation recovery verification

- **Date** 2026-11-06 (Asia/Bangkok)
- **Task** T046 and SC-011
- **Tested server revision** [ee5da91](https://github.com/quocthai912/Whistle-EPL/commit/ee5da91b1b8b8fdece641ed6b6790f7df9280093)
- **Environment** Isolated Debian Bookworm Linux container with networking
  disabled outside loopback, PostgreSQL server and client tools 17.11,
  Node 24.14.0, pnpm 10.33.2 and Python 3.11.2. The Node and libpq targets both
  resolved to the disposable `whistle_test_recovery` database.

## Fixture and commands

A fresh PostgreSQL data volume received all seven committed migrations.
The fixture used the audited bootstrap module, one synthetic administrator,
one assignment, one Season and an actual login session. A non-root Linux
operator used a root-owned test profile and protected libpq credential file.
State, backup and application directories were separate. The marker lived
outside the PostgreSQL data directory and was retained across restart.

Used the actual [operator runbook](../../operations/backup-format.md)
commands, including `pnpm ops:backup`, `verify-set.sh`,
`scheduled-backup.sh daily|retry`, `restore.sh`, and
`pnpm ops:maintenance verify|release` with the original operation ID.
The documented [interruption procedure](../../operations/maintenance.md)
was followed to resume the selected set. No operational data or off-host
destination was used.

To reproduce the fault setup in the isolated profile, put a prior successful
due date three days before the current Vietnam due date in `schedule.json`.
Prepend a fixture-only `pg_dump` wrapper to PATH for the daily run. It
passes through `--version` and exits nonzero on the dump. After proving the
immediate retry is refused, move the fixture's `nextRetry` into the past and
run retry with the original PATH. To stop restore at the closure boundary,
pass through `pg_restore --version` and `--list` and terminate the restore
controller when its wrapper receives `--dbname=…`. Use the original
unwrapped tools for the same-set repair and verification.

## Observations

| Drill | Result |
| --- | --- |
| Retention | Eight real verified backup operations left seven complete sets. Each retained set was verified again. |
| Overlap | While the operator controller lock was held, a competing backup returned nonzero. The set count stayed seven and admission stayed open. |
| Corrupted set | Appending bytes to a copy made restore reject it before closure. The original retained set remained valid. |
| Missed / failed / retry | A controlled due-state fixture represented two missed dates. The scheduler logged both. A fault wrapper made the actual dump command fail, recorded failure and left the durable marker with seven complete sets. An early retry was refused. With the fixture retry deadline advanced, the real second attempt reconciled the failed backup, published a complete set and reopened admission. |
| Interrupted restore and restart | A test wrapper terminated the actual restore controller after durable closure and before the physical database restore. Both host marker and persisted database closure survived a PostgreSQL-container and backend restart. Readiness returned 503 after restart and again after applying the older snapshot while its host marker remained present. |
| Same-set repair | The original set was verified and applied under retained closure. The inventory matched byte for byte after invalidating restored sessions. The existing operation ID passed verify/release. The old session returned 401 and a fresh login succeeded. |
| Standard verification entry point | `pnpm ops:verify <selected-set>` passed the available-foundation inventory comparison, same-set restore, restored-session invalidation and corrupt-copy refusal. |
| Operational unit checks | `pnpm test:ops` passed all five Python set and schedule tests, including the bounded retry chain. |

Selected set `20261106T052758Z-c5fab010-5cb2-461a-869f-88af0ef3a875`
inventory SHA-256 was
`2874857d583c6d75772369eb6ba80395b27912a9708472bbe13daafa5be1a8f9`.
It contained seven migrations, one account, one system assignment, one
season, one session and two audit records. The inventory intentionally
excludes the recovery-controlled revocation/admission fields.

The retry deadline was controlled in the isolated fixture. The actual
deployment's elapsed systemd timer, log rotation, protected operator and
selected off-host location remain deployment evidence. Full-season data and
BM-07 remain PHASE 10 work.
