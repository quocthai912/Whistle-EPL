# Dependency baseline — T001

Scope: D097, PHASE 1 setup only. Exact direct package pins are owned by the root,
frontend and backend package.json files; transitive versions and integrity hashes are
owned by the single pnpm-lock.yaml. There are exactly two Workspaces. All packages
are private. No competing lockfile or application startup seed is permitted.

## Runtime and installation

- Node.js **24.14.0**, pnpm **10.33.2**. `.node-version`, engines and packageManager
  record the runtime contract; `.npmrc` enforces engines and exact additions.
- Run `pnpm install --frozen-lockfile` from the repository root on each OS.
- `pnpm-workspace.yaml` allows lifecycle builds only for argon2, sharp, prisma
  and @prisma/engines. Nest's optional postinstall is deliberately ignored.
  Never approve all dependency scripts or copy node_modules between operating systems.
- Run `pnpm --filter @whistle-epl/backend exec node scripts/verify-native.cjs`
  to exercise native Argon2id hashing/verification with D096 costs and a sharp
  PNG encode/decode. This verifies installation, not delivered credential/media UCs.
- jsdom 30.1.3 was rejected by engine checking (requires Node >=24.15 on the
  Node 24 line). jsdom 28.1.0 supports the chosen runtime.

The selected major versions remain React 19 / Router 8 / Vite 8 / Ant Design 6,
Nest 11 / Express 5, Prisma 7 / PrismaPg / pg, TypeScript 5.9. ESLint 9 is pinned
with compatible typescript-eslint; its registry deprecation warning is recorded,
not silently suppressed. Future dependency updates require relevant checks.

## Image pins

| Purpose | Immutable reference | Verification scope |
|---|---|---|
| Ubuntu setup verification | ubuntu:24.04@sha256:24737cef17f4e22b1977df7d9a05e77c4e28b7da5b8911f8d8ccda136bf3573c | Ubuntu 24.04 verification container |
| Node binary source | node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 | Node copied into Ubuntu, no Debian-as-Ubuntu claim |
| PostgreSQL 17 | postgres@sha256:839fbb5a4942a7758dd93e18b42ea5649807491a0545b5eeeb8f0b8bb11857a5 | T008: PostgreSQL 17.11, fresh four-migration replay/status/intended-schema checks and 18 integration tests pass; [evidence](../verification/phase-1/foundation.md). T018 Compose deployment remains pending |
| Caddy 2 candidate | caddy@sha256:eb4d35b7452d1ab6171fbdbe8d9275b2301dad6dad92115d91e19fb9b24d510f | Manifest resolved from 2-alpine; HTTPS/Compose verification belongs to T018/T044 |

Image references are exact content pins. T001 setup alone did not verify PostgreSQL
transactions; the subsequent T008 result is recorded above. Backup tools, Caddy HTTPS
and Compose deployment still require verification at their owning tasks.

## Ubuntu reproduction

From the repository root with Docker Desktop's Linux engine:

```powershell
docker build -f docs/verification/phase-1/ubuntu.Dockerfile -t whistle-epl-setup-verification .
```

The build installs into a clean Ubuntu image using only manifests and the locked
dependency graph. No host node_modules is copied. Actual results and further
commands are recorded in [setup evidence](../verification/phase-1/workspace-setup.md).

Primary references: [Prisma generator/CJS configuration](https://www.prisma.io/docs/orm/v7/prisma-schema/overview/generators),
[pnpm 10 build policy](https://pnpm.io/10.x/settings#onlybuiltdependencies),
[Vite 8 runtime/plugin baseline](https://vite.dev/blog/announcing-vite8),
[sharp installation](https://sharp.pixelplumbing.com/install/).
