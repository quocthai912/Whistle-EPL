# Protected server operator commands

Owners: [D008/D011](../adr/0004-first-administrator-cli-bootstrap.md), [operator contract](../../specs/001-phase-1-operational-foundation/contracts/operator-cli.md). Local server procedures have no HTTP route or browser-session prerequisite.

Use individually authenticated Linux accounts, restricted SSH/local console, root-owned installation/configuration, protected DB credentials and an audited group/sudo allowlist. Runtime identities cannot write executables/configuration/operation state. Docker membership grants root-equivalent host power and is restricted to trusted operators. A supplied display name is not authentication. CLI obtains UID/username from the OS; sudo-root additionally records `SUDO_UID`/`SUDO_USER`. Direct root bootstrap/recovery is refused: use an individual authenticated sudo origin. Do not grant arbitrary SETENV/interpreter access through a purported restricted wrapper.

Build first (`pnpm db:generate && pnpm build`), load the root-managed host environment without printing it, and use an interactive TTY. Passwords are hidden prompts only: no argv, environment defaults, redirected input, JSON output or logs. Ctrl-C/Ctrl-D/Escape cancels and restores terminal mode. Verify the person's identity independently; equal full names do not prove identity. CLI enforces personnel/name/username constraints; passwords preserve exact Unicode/whitespace and use the approved blocklist/Argon2id policy.

```bash
pnpm admin:bootstrap --personnel-code <verified-code> --full-name '<verified-name>' --username <username>
pnpm admin:recover --target <existing-admin-username> --mode unlock --reason '<verified reason>'
pnpm admin:recover --target <existing-admin-username> --mode reset --reason '<verified reason>'
pnpm admin:recover --target <existing-admin-username> --mode reset-unlock --reason '<verified reason>'
```

Bootstrap serializes on the pre-created guard, refuses any current administrator including locked, and atomically creates one personal administrator, 24-hour temporary credential and audit. It adds no business rights. Recovery never creates/promotes accounts or changes business authority. Unlock preserves the credential; reset requires a hidden replacement and first-login change. Both revoke all target sessions and audit mode/reason atomically; unlocking cannot revive terminated delegations.

Exit 0 means completed outcome; nonzero means input/authority/invariant/processing failure. Safe output contains a correlation ID and correction guidance. After lost output/connection inspect protected audit/current state and resolve the outcome before repeating; no secret-bearing command receipt is persisted. See maintenance.md and backup-format.md for recovery operations. Actual operator accounts, certificates, credentials, off-host destination and handoff recipient remain deployment inputs.
