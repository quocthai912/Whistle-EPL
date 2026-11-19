# Club logo storage and recovery

Before upgrading, verify retained sets with their matching application release and keep the release needed to restore them. Cleanup stops when any active retained set cannot verify against the installed release. Its error identifies the affected set. Preserve a verified recoverable copy in a separately managed archive before removing an incompatible set from active retention, and retain at least seven verified active sets. Retry cleanup after every active set verifies.

Provision an absolute media directory on the Linux deployment host with UID 1000 (the backend container's `node` user) and mode 0700. Keep it outside the application, backup and operator-state directories. Set `OPS_MEDIA_ROOT` to this host directory in both the Compose interpolation file and the protected backup configuration. Compose exposes it only to the backend at `/var/lib/whistle-epl/media`, with `MEDIA_STORAGE_PROFILE=local`. For an isolated backend outside Compose, provide its absolute directory as `MEDIA_ROOT` and provision ownership for the running backend user.

Run `ops/backup/backup.sh` through the existing operator profile. Once writes have drained, it captures the database and verifies and copies every asset whose content has not been deleted. Each set contains its own media inventory, normalized bytes and checksums. Run `ops/backup/verify-set.sh SET_ID` to check the complete set before selecting it for recovery.

After a daily backup, the same operator job checks retained sets before cleaning detached content. Both known assets and unregistered files have a 24-hour grace period. The orphan clock starts at first observation. Cleanup keeps rollback copies until database markers commit and reconciles those copies before the next backup. Check the operator log for `MEDIA_CLEANUP_RETRY` when a protected copy or filesystem operation cannot be verified.

Use `ops/backup/restore.sh SET_ID RESTORE:DATABASE:SET_ID` on the matching application release. During recovery the service stays in maintenance while the database and the selected set's media are installed and checked. If interrupted, rerun the same command with `--resume` after correcting the cause. The command checks the persisted operation and set, drains writers, and reinstalls that same snapshot. Release requires verification and invalidates earlier browser sessions. Sign in again after release.

The v1 foundation format remains usable on a matching legacy release. Validate the new recovery path in an isolated application and database before enabling nonempty production media.
