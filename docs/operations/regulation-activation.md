# Regulation activation recovery

The backend checks approved waiting versions at startup and every minute. The approved effectivity instant is the start of the new rule interval. The separately recorded processing instant shows when the transaction applied the version.

When a read cannot establish the current basis at the approved instant, it returns `503 REGULATION_BASIS_UNRESOLVED`. Business incompatibility records `REGULATION_ACTIVATION_BLOCKED`, retains the previous effective rules, and releases the waiting slot. Prepare a new regulation proposal to address the incompatibility.

Use the deployed build through the existing Linux operator launcher after restoring the dependent service or releasing maintenance.

```sh
node dist/cli/process-due-regulations.js
```

Supply the same protected database and maintenance configuration as the backend. The operator runtime derives identity from the Linux account and the command accepts no arguments. It processes due versions using database time and the same admitted transaction as the scheduled job.

The command reports activated, blocked, skipped, and failed counts. A nonzero failed count sets a failing exit status. Check database connectivity, maintenance state, and dependent-provider availability before a further attempt. A failed transaction leaves the version waiting at its original approved instant. A later run can recover it, and a version already processed produces no duplicate activation history.

Route the backend job and operator CLI output to the existing protected diagnostics, for example `/var/log/whistle-epl/regulation-activation.log` under the 30-day rotation described in [scheduling operations](scheduling.md). Candidate failure records include the season and version IDs, trusted scan time, and a bounded cause category. Use these entries and the operator correlation ID when escalating a persistent failure. Business audit records have separate retention.
