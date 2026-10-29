# Durable maintenance and verified release

Owners: D088/D096. `MaintenanceService`, `maintenance.sh` and `AdmissionService` share host state at `OPS_STATE_DIR/maintenance.json`, outside the restored DB. Backend mounts it read-only and checks `MAINTENANCE_MARKER_PATH` for every admitted write. Inaccessible marker or missing parent fails closed; provision permissions before runtime startup.

Root-owned `OPS_CONFIG_FILE` selects absolute protected app/state/backup paths and matching Node/libpq targets. It cannot be group/world writable. Host `controller.lock`/flock allows one controller. Exclusive marker creation/fsync precedes DB closure and exclusive writer drain; ordinary writers share admission. No DB transaction spans external dump/restore. Safe reads may continue; readiness reports maintenance.

```bash
export OPS_CONFIG_FILE=/etc/whistle-epl/operator.conf
pnpm ops:maintenance status manual '<inspection reason>' <operation-uuid>
pnpm ops:maintenance close manual '<maintenance reason>' <new-operation-uuid>
pnpm ops:maintenance verify manual '<verification reason>' <same-operation-uuid>
pnpm ops:maintenance release manual '<release reason>' <same-operation-uuid>
```

`backup.sh`/`restore.sh` manage their IDs. Restore closure additionally requires the absolute selected complete-set path as fifth argument; prefer restore.sh. Verification checks PG17, required guards/constraints/audit protection and foundation reads. Restore also reruns selected-set integrity, app/schema/migration compatibility, actual relationships/content inventory, and requires revoked restored sessions. Release repeats verification, removes/fsyncs the marker, then opens DB admission. A crash between those steps leaves the DB closed.

After interruption stop competing controllers and inspect marker/log/current DB. Restart never releases maintenance; old DB snapshots cannot erase the marker. Repair an interrupted restore by completing the **same set** under retained closure, then verifying data/relationships and revoking restored sessions before verify/release with the same ID. If compatibility/set identity cannot be proven, leave closed. Never manually delete the marker. Failed backup may be verified/released against unchanged live data before retry; scheduling never releases restore/manual maintenance.

All persisted writers, including auth activity/counters, audit/receipts, CLI and cleanup, must use shared admission/ordered transactions and the same configured marker. Direct privileged DB procedures remain operator-only.
