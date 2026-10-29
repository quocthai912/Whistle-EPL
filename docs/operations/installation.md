# Foundation installation

Scope: T015–T026, PHASE 1. Follow the [operator contract](../../specs/001-phase-1-operational-foundation/contracts/operator-cli.md), [operator access](operator-access.md) and [operator evidence](../verification/phase-1/operator-foundation.md). Authentication HTTP execution is recorded separately in [authentication evidence](../verification/phase-1/authentication.md). Login/password-change screens and browser verification remain T027–T028; these instructions do not establish Phase acceptance.

## Prerequisites and profiles

Reference host: Ubuntu Server 24.04 LTS x64, Docker Engine/Compose v2, Node 24.14.0, pnpm 10.33.2, Python 3, PostgreSQL 17 client tools (`psql`, `pg_dump`, `pg_restore`), Bash, util-linux (`flock`, `mountpoint`), coreutils, systemd, logrotate and timezone data. Install from trusted vendor/OS packages. Windows supports source/build/unit tests; protected operations run on Linux. Use the locked workspace dependencies/native-build allowlist. Never replace committed migrations with db push.

Separate protected configuration files, Compose project names, DBs, volumes, operation directories and backup directories for development, isolated test, local HTTPS and Internet deployment. `.env.example` inventories keys without credentials. Startup creates no administrator, season or fixture. Operator identities, hostname/certificate trust, credentials and off-host mount are deployment inputs. The shipped Caddyfile is the trusted-local-CA profile.

Pinned images: Node `24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8`; PostgreSQL `17.11-bookworm@sha256:839fbb5a4942a7758dd93e18b42ea5649807491a0545b5eeeb8f0b8bb11857a5`; Caddy `2.11.7@sha256:5e5286cb37d44086d651a5363f05f43a692ce4d649d88fb1bd844579f45fa9e8`.

## Protected configuration

Install the checkout at `/opt/whistle-epl`, root-owned and not writable by runtime/operator groups. Provision the accounts/configuration from operator-access.md. Use approved `/srv/whistle/backups`, protected and separate from live data. D097's media/temp defaults remain `/var/lib/whistle/media` and `/var/lib/whistle/tmp`; no media workflow is delivered here. Compose uses named PG/Caddy volumes outside Git/executables. Host maintenance/schedule state lives at `/var/lib/whistle-epl-operations`, outside the restored DB.

Create that state directory before runtime startup. The operator writes it; backend UID 1000 can traverse/read it and its marker but cannot write. Configure group ownership/default ACLs accordingly, including read access on newly created marker files. Backups/configuration remain operator-only. Missing/inaccessible marker directories fail closed.

Create an external Compose interpolation file containing `COMPOSE_PROJECT_NAME`, `POSTGRES_DB`, `POSTGRES_USER`, `DATABASE_PASSWORD_FILE`, `BACKEND_ENV_FILE`, `OPERATION_STATE_DIR`, `HTTPS_BIND`, `SITE_ADDRESS`, `AUTH_ORIGIN`, `PRIVATE_SUBNET`, `PRIVATE_DYNAMIC_RANGE`, `CADDY_PRIVATE_IP` and `CADDY_IMAGE`. Password file: protected single-value Docker secret. Backend env file: `DATABASE_URL` using Compose hostname `db` and matching DB/user/password; percent-encode URL credentials. Never put a secret in argv. Bind local HTTPS to loopback and choose `SITE_ADDRESS=localhost`; use a separate explicit port override for isolated acceptance if needed.

Set `AUTH_ORIGIN` to the exact browser HTTPS origin (scheme, hostname and nondefault port, with no path or trailing slash). It is configuration, never derived from Host or forwarding headers. Choose a dedicated IPv4 `PRIVATE_SUBNET` that does not overlap host/VPN/container networks and reserve `CADDY_PRIVATE_IP` inside it, distinct from the network/gateway/broadcast addresses. Compose pins that address for Caddy and sets backend `AUTH_TRUSTED_PROXY_CIDRS` to that single `/32`; replacement retains the source trust relationship. Only that immediate socket peer may supply one Caddy-overwritten `X-Forwarded-For` address. Direct backend requests ignore forwarding headers. Never expose the backend port or trust an unbounded proxy subnet. A non-Compose backend requires explicit `AUTH_ORIGIN`, `DATABASE_URL` and exact immediate proxy CIDRs (empty only for genuinely direct clients). Secure host-prefixed cookies require browser HTTPS; direct HTTP tests do not establish HTTPS/browser acceptance.

Set `PRIVATE_DYNAMIC_RANGE` to a CIDR contained inside `PRIVATE_SUBNET` that excludes `CADDY_PRIVATE_IP`. Compose passes it to IPAM `ip_range`, so dynamically addressed DB/migration/backend containers cannot acquire Caddy's trusted address before web starts. For example, an isolated test subnet `172.31.245.0/24` may use dynamic range `172.31.245.128/25` and static Caddy address `172.31.245.10`; these are examples, not operational defaults. Check the actual host's networks before selecting values. Existing Compose profiles must supply the new key; apply the changed IPAM configuration by recreating only the selected private network in a controlled maintenance window, preserving named data volumes. Do not use `down -v`.

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

Migrate waits for DB health and runs committed `prisma migrate deploy`; backend waits for migration success; web waits for readiness. Correct failed migration/readiness before use. `/api/v1/health` is liveness; `/api/v1/ready` checks foundation/maintenance without updating session activity. DB/backend have no public ports. Caddy serves the SPA and preserves the same-origin `/api/v1` prefix; forwarding headers are overwritten. Internal `/health` and `/ready` aliases remain available for container probes.

Readiness intentionally becomes unhealthy while maintenance is closed. If `docker compose up` was attempted during maintenance, its health-based dependency may leave `web` unstarted. After the verified maintenance release, rerun the same `docker compose ... up -d` command and check `docker compose ... ps`; release does not automatically restart a previously blocked Compose startup.

Export Caddy's **public root certificate only** from `/data/caddy/pki/authorities/local/root.crt`, inspect its fingerprint and install it in the selected test browser/OS trust store. Verify HTTPS without bypassing TLS checks; never copy its private key. Preserve `/data` and `/config` across replacement. Real Chrome/Edge trust/login walkthroughs remain T028/T044. Internet deployment requires explicitly supplied hostname/public-certificate configuration in place of `tls internal`; preserve routing/persistence.

Run bootstrap/recovery using operator-access.md and hand off under credential-handoff.md. Use the implemented authentication HTTP contract for the required first-login password change; browser screens remain T027. `docker compose ... up -d --force-recreate` preserves named volumes; do not use `down -v` on an operational profile.

## Isolated verification and reset

Use a loopback DB named `whistle_test_*`, `NODE_ENV=test`, explicit fixture manifest and reset acknowledgement from the existing fixture tools. Set `TEST_DATABASE_URL` separately from operational configuration. Run `pnpm test`, `pnpm test:integration`, `pnpm test:ops` and root quality commands. On Linux select a protected test `OPS_CONFIG_FILE` and run `pnpm ops:verify <complete-set-id>` for real recovery. It rejects non-isolated targets and returns nonzero on failed checks. Full clean-install/browser/recovery acceptance remains T044/T046/T048.
