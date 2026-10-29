# Backup schedule and eligible cleanup

Owners: D089/D097. Install root-owned `ops/systemd/*` units under `/etc/systemd/system`, scripts under `/opt/whistle-epl`, restricted `whistle-operator` service account in `whistle-operations`, and protected `/etc/whistle-epl/operator.env` with `OPS_CONFIG_FILE=/etc/whistle-epl/operator.conf`. Profile may be root:whistle-operations 0640; executables remain root-owned. Units permit writes to `/var/lib/whistle-epl-operations` and approved `/srv/whistle/backups`; explicitly adapt for separately supplied paths/off-host mount.

```bash
sudo systemd-analyze verify /etc/systemd/system/whistle-backup*.service /etc/systemd/system/whistle-backup*.timer
sudo systemctl daemon-reload
sudo systemctl enable --now whistle-backup.timer whistle-backup-resume.timer
systemctl list-timers 'whistle-backup*'
journalctl -u whistle-backup.service -u 'whistle-backup-retry-*.service'
```

Daily timer: `03:00:00 Asia/Ho_Chi_Minh`, `Persistent=true`, one-second accuracy. Catch up after recovery; downtime is never success. `schedule.json` durably records due date, attempts, next permitted retry and success. `missed-runs.log` preserves skipped-date evidence even after prior success; unresolved prior runs also reach the journal. `operations.log` contains safe set IDs/outcomes. Inspect real timer/journal/state daily; failures require operator action. No email/SMS channel is selected.

Failure activates retry-1 after 15 minutes, then retry-2/retry-3 through separate timer/service definitions. `RemainAfterElapse=no` allows later due runs. Durable runner refuses early retries, overlapping schedules and over four executions per due run (initial + three retries), including restarts. A successful due run is not repeated by a late retry. Only failed backup maintenance may be reconciled automatically after verification; restore/manual closure requires operator repair. Final failed service/journal/state stays visible. Injected-clock tests are separate from actual elapsed reference-host timer drills.

The enabled boot-resume timer starts reconciliation one minute after boot. It reads durable pending state, waits only the remaining part of the 15-minute delay, and resumes the bounded chain; a newly due day records the missed interval and starts that day's run. Reboot cannot erase the attempt count or leave a pending retry without a boot entry point. The host scheduler owns these waits; the command-line smoke test does not wait 15 minutes or claim an elapsed timer drill.

Pinned `@nestjs/schedule` runs hourly backend cleanup through shared admission/ordered locks: eligible expired/revoked sessions, expired prelogin contexts, failures older than 24 hours when no active block depends on them, and completed receipts after the full 24-hour expiry. Preserve pending receipts, live blocks/windows, accounts/grants/business/audit history. Receipt locks match the command module. Expiry remains enforced at use. Maintenance produces safe failure feedback, with no partial cleanup. No media/regulation job is delivered here.

Install `ops/diagnostic.logrotate` under `/etc/logrotate.d/whistle-epl`: daily protected diagnostic rotation, 30 retained days. Configure bounded Docker/journal logging separately. Rotation never deletes business audit; no audit-delete/export interface exists. Validate actual users/paths/logrotate before enablement and never log credentials/URLs/tokens. This setup alone is not Phase acceptance.
