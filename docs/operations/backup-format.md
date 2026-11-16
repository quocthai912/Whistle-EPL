# Available-data backup and restore

Owners: D088/D097; see maintenance.md, scheduling.md and installation.md. Default protected backup root: `/srv/whistle/backups`, separate from live DB, app/Git/public paths. Retain at least seven verified complete sets. Operator-only access protects confidentiality/integrity; checksums detect damage, not malicious trusted-administrator replacement.

Each `<UTC timestamp>-<UUID>` directory contains PG17 custom-format `database.dump`, `inventory.json`, `manifest.json` and `manifest.sha256`. Inventory records actual table counts and content SHA-256 values without row values. Maintenance fields, account auth revision and session revocation fields are excluded because restore deliberately changes them. Other content and relationships must match.

Format v1 is `available-foundation` for the exact legacy foundation migration profile. Its empty `media` array means media is outside that recovery scope. Verify and restore it only with its matching legacy application/schema; do not restore it into an expanded schema or convert it automatically.

Format v2 is `available-phase-2` for the exact expanded Phase 2 migration profile. It records the operation ID, application revision provenance, UTC snapshot instant, exact migration names/checksums, and available-data inventory. Club and Stadium rows may be populated. Until T019 implements nonempty-media recovery, v2 requires an empty `media/` directory, zero `media_asset` rows and zero current-logo references. A v1 set is never upgraded or labeled media-complete by the v2 verifier.

```bash
export OPS_CONFIG_FILE=/etc/whistle-epl/operator.conf
pnpm ops:backup '<manual or pre-migration reason>'
bash ops/backup/verify-set.sh <complete-set-id>
pnpm ops:restore <complete-set-id> RESTORE:<selected-database>:<complete-set-id>
```

Root-owned profile selects `OPS_PROFILE`, `OPS_APP_DIR`, `OPS_APP_REVISION`, `OPS_STATE_DIR`, `OPS_BACKUP_DIR`, `OPS_DB_NAME`, `DATABASE_URL`, `PGSERVICE`, `PGSERVICEFILE`, `PGPASSFILE` and explicit host/port where needed. Set `OPS_APP_REVISION` in the protected configuration to the release commit, build revision or image digest before scheduled v2 backups. It is recorded for provenance and is not a compatibility equality check; compatibility is established by the format/scope, application package version, PostgreSQL major, exact migration names/checksums and verified table/data inventory. The legacy v1 profile does not require `OPS_APP_REVISION`. Keep password file 0600; never put credentials/URL in argv. Node/libpq server/database identities must match before effects. Follow installation for private-network connectivity. `OPS_ISOLATED=yes` alone is insufficient: ops:verify also requires test profile/name and loopback targets.

Backup closes/drains writes, inventories data, writes/verifies `.incomplete-*`, flushes and publishes atomically. Failures do not count toward retention. Internet additionally requires operator-mounted `OPS_OFFHOST_DIR`; verify/flush that copy before local publication. `mountpoint` cannot prove remote-provider ownership; operator must supply a real off-host protected mount. Failure returns nonzero and leaves maintenance closed. Only complete compatible sets participate in cleanup; incompatible historical sets are conservatively retained.

Restore verifies selected identity/checksums/compatibility before mutation, binds set path to the durable marker, then uses `pg_restore --single-transaction --exit-on-error --clean --if-exists --no-owner --no-privileges`. It compares restored content/counts, migration inventory and FK relationships, revokes all restored sessions and increments auth revisions. Full operation verification repeats before release. Resolve uncertain outcomes before another execution. Interrupted restore is repaired under its retained closure; do not remove the marker or start a competing fresh restore.

`pnpm ops:verify <complete-set-id>` runs verify-foundation.sh against an explicit isolated loopback `whistle_test_*` profile. It checks supplied set/current foundation, performs real backup/same-set restore, verifies data/session outcomes and corrupt-copy rejection. Any failed required check returns nonzero. Actual complete-seven-set/timer/interrupted-restore deployment drills remain T044/T046; full-season/media recovery and BM-07 remain PHASE 10.
