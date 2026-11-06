# PHASE 1 clean installation verification

- **Date** 2026-11-06 (Asia/Bangkok)
- **Task** T044, US1 and the reference deployment walkthrough
- **Source** [ee5da91](https://github.com/quocthai912/Whistle-EPL/commit/ee5da91b1b8b8fdece641ed6b6790f7df9280093)
- **Environment** Windows 11 x64, Node 24.14.0, pnpm 10.33.2, Docker
  Desktop Engine 29.9.2 and Compose 5.6.1 running Linux containers, PostgreSQL
  17.11, Caddy 2.11.7, Chrome 156.0.8078.81 and Edge 156.0.4314.58.
  The hosted Ubuntu 24.04 cold install/build and migration tests are recorded
  separately in the [CI evidence](branch-protection.md).

## Setup and fixture manifest

Extracted the Git archive into a new directory with no installed dependencies
or generated client. Ran `pnpm install --frozen-lockfile`, `pnpm db:validate`
and `pnpm build`, including the compiled Prisma client import. Created a new
Compose project with a fresh database, private bridge and separate volumes.
Used the documented protected configuration from
[installation.md](../../operations/installation.md) and a port-only override
binding the web entry point to `127.0.0.1:8450`. The backend and PostgreSQL had
no published ports. The profile used its own synthetic database credentials and
Caddy root. Only the public root certificate was exported and trusted by the
browser account for the walkthrough.

The database started with zero accounts, roles and seasons. The test used two
competing synthetic bootstrap identities, one surviving administrator and
the operator-generated bootstrap/recovery audit rows. No fixture reset
command or application seed ran against this database. Credentials were
entered through the protected terminal and browser prompts.

## Observations

| Step | Result |
| --- | --- |
| `docker compose config --quiet`, `build --no-cache`, `up -d --wait` | Pinned Linux images built and started. Migrate exited successfully after seven committed migrations. DB and backend were healthy. |
| Trusted same-origin HTTPS | `/`, `/api/v1/health` and `/api/v1/ready` each returned 200 with normal hostname and CA verification. |
| Concurrent bootstrap | Two simultaneous TTY attempts produced exit 0 and exit 1. Independent database counts showed one account, one administrator assignment, one bootstrap audit row and zero seasons. |
| First login | Chrome redirected the temporary account to password change and blocked direct audit navigation before change. The new personal password authenticated in both browsers, and each found the bootstrap audit event. |
| `up -d --force-recreate --wait` | PostgreSQL, backend and web container IDs changed. The named volumes preserved all seven migrations, one administrator and the bootstrap record. The same trusted certificate and new password worked in both browsers. |
| Existing locked administrator | A direct fixture-only update set the sole administrator to locked. A new TTY bootstrap attempt was refused and created no account. |
| Protected `recover-admin.js --mode reset-unlock` | The CLI completed through its hidden prompt. Independent state showed one account, one system role, one recovery event with operator actor kind and zero active sessions immediately after recovery. Chrome confirmed the old session failed and a new login required changing the recovered temporary password. The recovery event remained visible after the new personal login. |
| Recovery of a missing identity | The CLI exited nonzero. Account, role and recovery-event counts remained 1/1/1. |
| Final migration status | `pnpm db:status` reported the database schema up to date. |

The isolated Compose services were stopped and the temporary CA was removed
from the Windows CurrentUser root store after verification.

The walkthrough exercised an isolated Linux-container deployment and actual
Windows browsers. Deployment-specific identities, domains, public certificates
and off-host recovery remain under their existing operator inputs.
