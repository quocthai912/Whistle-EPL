# PHASE 3 T025 — Player portrait recovery

Executed 2026-11-25 (Asia/Bangkok), base `ff25957ecad03fbbd064f30ea5edee0585569fa2` plus this working delivery. Storage profile: **local**, private backend-owned directory, UID 1000. PostgreSQL/server and client tools **17.11**, Node **24.14.0**, Python **3.11.2** in isolated Linux container `whistle-phase3-t025-ops`. Restore database: `whistle_test_portrait_20261125`, distinct from integration/browser and operational/demo databases. Media, maintenance state and backups are separate protected directories under `/tmp/t025`; source is copied from a read-only checkout mount.

## Changes and test-first evidence

The existing backup, restore, maintenance, retention and daily scheduler commands are reused. `backup.sh` and `restore.sh` already support Player bytes and require no application-specific fork. Two failures were reproduced before modifying `set-format.py`:

- Current application migrations returned `Unsupported application/schema migration profile`. Added the three published follow-up migrations to the supported PHASE 3 profile while retaining the original profile.
- Actual PostgreSQL table inventory differed because `registration_version_editor` was listed although no owned migration creates it. Removed the nonexistent relation; the independent migration-table inventory test now passes.

`python3 -m unittest discover -s ops/backup/tests`: **16/16 passed**, including three new PHASE 3 checks (profile, table inventory and standalone process isolation). Scheduler tests deliberately exercise failed/retried backups; their failure feedback is expected negative-test output.

## Executed checks

| Check | Result |
| --- | --- |
| Actual HTTP portrait creation | Separate guarded fixture/export test passed; bytes originate from authorized synthetic Sharp images. |
| Current references and 24-hour unreferenced grace | `phase-3-portrait-recovery.spec.ts`: **3/3 passed**. At 24 hours minus 1 ms old bytes remain; at the boundary cleanup requires verified retained-copy protection. Current portrait remains readable. |
| Rollback orphan first observation | An unregistered file is observed days later; grace starts then. Retained protection prevents deletion and removal of that protection starts a fresh observation period. |
| Real in-flight write | `phase-3-portrait-races.spec.ts`: **1/1 passed**. An isolated PostgreSQL trigger pauses the actual HTTP upload after durable staging. Cleanup waits on the writer's object lock; after release the reference commits and independently read/delivered bytes remain intact. The trigger/function are removed in `finally`. |
| Cleanup failure and interruption | Corrupt content causes a reported failure without a deletion marker. A staged rollback file is recovered and the next clean succeeds. |
| Matched DB/content set | `phase-3-recovery.sh` ran real `backup.sh`, `verify-set.sh`, `restore.sh`, PostgreSQL dump/restore and inventory comparisons. Restored Player reference, bytes and checksum match. |
| Rejection | Incomplete archive, corrupt portrait bytes and a wrong-profile manifest (with recomputed manifest checksum) were rejected. |
| Interrupted restore | A symlink destination forces failure after DB restore and before content delivery. Both host and database maintenance remain closed. A second complete, independently verified set passes preflight but is rejected by the selected-set guard; the selected path and restored Player state remain unchanged. Same-set `--resume` completes verification and release. |
| Sessions and delivery after release | Every restored session is revoked. Old cookie fails, real fresh login succeeds, current portrait is scoped and `no-store`, anonymous access is concealed, and unavailable bytes return the supported fallback error. |
| Daily operation | Real `schedule-run.py daily` succeeds with one attempt; it invokes accepted backup/retention/cleanup tooling. |

Final drill output: **`T025 same-set portrait restore, interrupted maintenance, fresh login and daily backup/cleanup PASS.`** Initial harness assertion errors were corrected to the existing contracts and the complete drill rerun successfully. Protected configs, credentials, database dumps and portrait exports remain outside Git.

The standalone HTTP recovery verifier independently requires `NODE_ENV=test`, the isolated test profile/database, matching libpq/Node database identity, a canonical media root beneath temporary storage, and a UUID-bound object key before application startup or file mutation. Its guard and the complete alternate-set drill passed after independent review.

To repeat the drill, first migrate a distinct guarded `whistle_test_portrait_*` database and create private, separate media/state/backup directories with a non-root backend UID. Run the integration export test with `NODE_ENV=test`, the explicit `TEST_DATABASE_URL`, and `PHASE3_RECOVERY_ROOT` selecting the private temporary parent: `pnpm --filter @whistle-epl/backend run test:integration -- tests/integration/phase-3-portrait-recovery.spec.ts -t 'exports an isolated'`. Then use the accepted protected operator configuration and matching libpq/Node target, set `PHASE3_RECOVERY_FIXTURE` to the exported private `fixture.json`, and run `bash ops/backup/tests/phase-3-recovery.sh`. The fixture file contains synthetic test credentials and must remain private and outside Git. Existing operator setup/target requirements continue to apply; this is not an operational seed or deployment procedure.

Internet/off-host storage is not selected by this environment. Whole-season BM-07 acceptance remains with its owning later Phase; T028 human PHASE 3 acceptance is unchanged.
