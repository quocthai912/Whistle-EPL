# PHASE 2 integrated recovery — T028

Execution date: 2026-11-18 (Asia/Bangkok). Source baseline:
`99c964f8b09b250af2e85582306fd8e5e4a7e5a5` plus this working change set.
Actual operator environment: Debian 12 container, Node 24.14.0, PostgreSQL server
and client 17.11, Python 3.11.2, operator UID 1000, protected mode-0700 roots.
The drill uses newly created `whistle_test_phase2_recovery_*` databases, separate
from browser, integration, lookup and application data.

## Dataset and provenance

The user expressly authorized twenty original synthetic logo fixtures. The
generator authors 64x64 WebP pixels locally using Sharp, without downloads,
third-party club marks or operational data. Each of twenty Clubs has a distinct
current MediaAsset/reference/checksum, a discontinuation/resumption cycle and
three audit records. Two seasons each contain a lifecycle draft with its exact
current-version pointer. A live synthetic session tests invalidation.
These are controlled persistence fixtures, not evidence that later registration,
schedule, result or summary workflows ran.

The integration media suite separately uploads twenty generated images through
the real authorized HTTP endpoint, verifies WebP decoding/current references and
rejects delivery to an unrelated account for every asset.

## Executed drill

`ops/backup/tests/phase-2-recovery.sh` requires empty dedicated roots, an empty
migrated database, `NODE_ENV=test`, `OPS_ISOLATED=yes`, `OPS_PROFILE=test`,
loopback PostgreSQL and a database named `whistle_test_phase2_recovery_<suffix>`.
It uses the existing protected root-owned operator configuration and the built
`backend/scripts/prepare-phase2-recovery.cjs` fixture generator.

Eight actual complete backups leave seven retained sets. Verification checks
all twenty retained files. After changing a Club row, the drill installs an
unsafe media destination and attempts restoration. The command refuses release
and retains the durable maintenance marker. Resuming the **same set** after
removing the unsafe destination restores all twenty files byte-for-byte,
twenty current references/availability states, both seasons and lifecycle drafts,
all sixty Club audit events and the original Club name. Every old session is
revoked before maintenance is released. `verify-foundation.sh` then exercises
another real same-set restoration and rejects a separately corrupted copy.

The final drill also invokes the actual scheduler's `daily` path and checks its
successful first-attempt state. This proves the available-data scheduled command
and seven-set retention controls in the isolated profile, not an installed
production systemd timer or a full-day operational observation.

The twelve operator unit tests retain missing/corrupt/traversal/extra-file,
migration/schema drift, incomplete-set retention, v1 matching-only behavior and
explicit incompatible-retained-set operator policy. PostgreSQL media tests cover
cleanup rollback and interrupted stage recovery. Existing maintenance/admission
and media tests preserve upload/cleanup/reference/backup synchronization.

## Reproduction and remaining operations

Build the backend, migrate a new dedicated database, provision empty protected
media/state/backup roots and the existing operator config/service/password files.
Run the script as the configured media owner, with `OPS_APP_DIR` pointing to the
same release. Credentials and the generated fixture manifest stay private.
The script never resets an existing populated target.

Production logo rights, volume ownership/disk capacity, actual systemd scheduling,
off-host Internet-profile storage and later complete BM-07 remain operator or
later-Phase prerequisites. Fixture authorization does not approve production assets.
