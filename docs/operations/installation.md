# Foundation installation

Scope: T015–T022, PHASE 1. Follow the [operator contract](../../specs/001-phase-1-operational-foundation/contracts/operator-cli.md), [operator access](operator-access.md) and [execution evidence](../verification/phase-1/operator-foundation.md). Login/password-change screens arrive with T023–T028; these instructions do not establish Phase acceptance.

## Prerequisites and profiles

Reference host: Ubuntu Server 24.04 LTS x64, Docker Engine/Compose v2, Node 24.14.0, pnpm 10.33.2, Python 3, PostgreSQL 17 client tools (`psql`, `pg_dump`, `pg_restore`), Bash, util-linux (`flock`, `mountpoint`), coreutils, systemd, logrotate and timezone data. Install from trusted vendor/OS packages. Windows supports source/build/unit tests; protected operations run on Linux. Use the locked workspace dependencies/native-build allowlist. Never replace committed migrations with db push.

Separate protected configuration files, Compose project names, DBs, volumes, operation directories and backup directories for development, isolated test, local HTTPS and Internet deployment. `.env.example` inventories keys without credentials. Startup creates no administrator, season or fixture. Operator identities, hostname/certificate trust, credentials and off-host mount are deployment inputs. The shipped Caddyfile is the trusted-local-CA profile.

Pinned images: Node `24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8`; PostgreSQL `17.11-bookworm@sha256:839fbb5a4942a7758dd93e18b42ea5649807491a0545b5eeeb8f0b8bb11857a5`; Caddy `2.11.7@sha256:5e5286cb37d44086d651a5363f05f43a692ce4d649d88fb1bd844579f45fa9e8`.

## Protected configuration

Install the checkout at `/opt/whistle-epl`, root-owned and not writable by runtime/operator groups. Provision the accounts/configuration from operator-access.md. Use approved `/srv/whistle/backups`, protected and separate from live data. D097's media/temp defaults remain `/var/lib/whistle/media` and `/var/lib/whistle/tmp`; no media workflow is delivered here. Compose uses named PG/Caddy volumes outside Git/executables. Host maintenance/schedule state lives at `/var/lib/whistle-epl-operations`, outside the restored DB.

Create that state directory before runtime startup. The operator writes it; backend UID 1000 can traverse/read it and its marker but cannot write. Configure group ownership/default ACLs accordingly, including read access on newly created marker files. Backups/configuration remain operator-only. Missing/inaccessible marker directories fail closed.

Create an external Compose interpolation file containing `COMPOSE_PROJECT_NAME`, `POSTGRES_DB`, `POSTGRES_USER`, `DATABASE_PASSWORD_FILE`, `BACKEND_ENV_FILE`, `OPERATION_STATE_DIR`, `HTTPS_BIND`, `SITE_ADDRESS` and `CADDY_IMAGE`. Password file: protected single-value Docker secret. Backend env file: `DATABASE_URL` using Compose hostname `db` and matching DB/user/password; percent-encode URL credentials. Never put a secret in argv. Bind local HTTPS to loopback and choose `SITE_ADDRESS=localhost`; use a separate explicit port override for isolated acceptance if needed.

The Linux host's protected operator profile selects the same database through its private Docker bridge address; obtain the current DB container address from Docker inspection after startup and configure matching Node/libpq connections. No DB port is published. If the deployment blocks host bridge access, provision an operator-only namespace/tunnel before enabling operations. The scripts compare actual server address, port and DB for both connections before any maintenance/dump/restore effect. A replacement DB address requires an explicit profile update, never a guessed fallback.

## Build, migrate and start

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm build
chmod 0755 ops/backup/*.sh
docker compose --env-file /etc/whistle-epl/compose.env -f ops/compose.yaml config --quiet
docker compose --env-file /etc/whistle-epl/compose.env -f ops/compose.yaml up -d --build
docker compose --env-file /etc/whistle-epl/compose.env -f ops/compose.yaml ps
```

Migrate waits for DB health and runs committed `prisma migrate deploy`; backend waits for migration success; web waits for readiness. Correct failed migration/readiness before use. `/api/v1/health` is liveness; `/api/v1/ready` checks foundation/maintenance without updating session activity. DB/backend have no public ports. Caddy serves the SPA and proxies same-origin `/api/v1`; forwarding headers are overwritten. Owning authentication tasks implement the remaining trusted-proxy/session rules.

Readiness intentionally becomes unhealthy while maintenance is closed. If `docker compose up` was attempted during maintenance, its health-based dependency may leave `web` unstarted. After the verified maintenance release, rerun the same `docker compose ... up -d` command and check `docker compose ... ps`; release does not automatically restart a previously blocked Compose startup. Caddy currently strips `/api/v1` for the backend's unprefixed `/health` and `/ready` controllers. Future prefixed business routes must update proxy/controller routing together.

Export Caddy's **public root certificate only** from `/data/caddy/pki/authorities/local/root.crt`, inspect its fingerprint and install it in the selected test browser/OS trust store. Verify HTTPS without bypassing TLS checks; never copy its private key. Preserve `/data` and `/config` across replacement. Real Chrome/Edge trust/login walkthroughs remain T028/T044. Internet deployment requires explicitly supplied hostname/public-certificate configuration in place of `tls internal`; preserve routing/persistence.

Run bootstrap/recovery using operator-access.md and hand off under credential-handoff.md. Once US2 exists, perform the required first-login password change. `docker compose ... up -d --force-recreate` preserves named volumes; do not use `down -v` on an operational profile.

## Isolated verification and reset

Use a loopback DB named `whistle_test_*`, `NODE_ENV=test`, explicit fixture manifest and reset acknowledgement from the existing fixture tools. Set `TEST_DATABASE_URL` separately from operational configuration. Run `pnpm test`, `pnpm test:integration`, `pnpm test:ops` and root quality commands. On Linux select a protected test `OPS_CONFIG_FILE` and run `pnpm ops:verify <complete-set-id>` for real recovery. It rejects non-isolated targets and returns nonzero on failed checks. Full clean-install/browser/recovery acceptance remains T044/T046/T048.
