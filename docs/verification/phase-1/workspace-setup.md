# T001–T004 workspace setup verification

**Executed:** 2026-10-29, Asia/Bangkok. **Scope:** internal task Phase 1 setup,
not project PHASE 1 acceptance. **Baseline:** `95b01a3f26a8b95d22047b5fe67cbdb35d4b0d06`,
branch `feat/phase-1-workspace-setup`, plus the uncommitted implementation in this session.
No implementation commit/push was made. Issues #6–#9 matched the approved Tasks before
implementation. The requirements checklist passed 16/16.

## Actual environments and inputs

| Item | Windows | Ubuntu |
|---|---|---|
| OS | Microsoft Windows 10.0.26300, x64 | Ubuntu 24.04.5 LTS, linux/x64, Docker Linux engine |
| Node / pnpm | 24.14.0 / 10.33.2 | 24.14.0 / 10.33.2 |
| Compiler / ORM | TypeScript 5.9.3 / Prisma 7.10.1 | Same locked versions |
| Test tools | Jest 30.5.2, Vitest 5.0.5, RTL 16.3.3, jsdom 28.1.0 | Same locked versions |
| Clean install | Empty `.verification/windows-clean`; copied manifests/lock only; pnpm download store reused | Fresh Ubuntu filesystem and pnpm store; host node_modules excluded |

Docker Engine: 29.9.2. Tested verification image ID:
`sha256:7f6dc80062d01eccc68dc7a44b82cdd37145fc06058ecf7f06c9448caa62b432`.
Ubuntu is the actual container userspace; Node binaries come from the pinned Node image.
This is container verification on Windows, not a standalone Ubuntu server installation
or a GitHub-hosted CI run. Input images/direct pins are owned by
[dependency-baseline.md](../../operations/dependency-baseline.md).

Lockfile SHA-256:
`9d18badf5800b4fc19b6ffcf11d5a277844da33d1c8654ab341cfba3ba685088`.
The adjacent `workspace-source-sha256.txt` identifies tested source/configuration files.
Generated clients, builds and dependencies are excluded from Git/manual formatting.

No database, account, Season or operational fixture was prepared. Native checks use an
in-memory synthetic string and a 2×3 PNG. Root-command checks create named synthetic
probes, refuse overwrites and remove probes in finally blocks. Run them serially with
other host source checks. Docker excludes probes from its context. Local diagnostic
logs are in `.verification/command-probes/`.

## Acceptance evidence

| Task | Acceptance criterion | Actual result |
|---|---|---|
| T001 | Two Workspaces, exact runtime/package/image references, one lockfile, lifecycle allowlist, clean frozen install/native compatibility on both OSes | PASS: Windows 800 packages, Ubuntu 801 platform-specific packages; no final peer/engine error; native Argon2id hash/verify and sharp PNG encode/decode pass |
| T002 | React 19/Vite 8/Router 8/Ant Design 6/CSS Modules; Vietnamese shell without fake league screens | PASS: RTL 1/1 and frontend production build on both OSes; Vietnamese document/labels, no internal administration controls |
| T003 | Nest 11/Express 5/CommonJS, strict TS, explicit Prisma CJS output with PrismaPg/pg, bootstrap/build/health without default accounts | PASS: HTTP health 1/1 on both OSes; Prisma validation/generation/compilation/import/adapter construction pass; separately spawned compiled server returns HTTP 200 `{ "status": "ok" }` on both OSes |
| T004 | Root lint/typecheck/format/format:check/build/test, Jest/Vitest, generation before checking generated imports, approved source scopes/failure propagation | PASS: all positive gates on both OSes; 10/10 negative command checks per OS; Context/ADRs/Constitution unchanged |

`/health` verifies process liveness, not database readiness. Client construction does not
establish transaction/migration correctness. Those are later Tasks.

Representative actual output:

```text
Native compatibility PASS: win32/x64, v24.14.0
Native compatibility PASS: linux/x64, v24.14.0
Generated Prisma Client (7.10.1) to ./src/generated/prisma
CommonJS PrismaClient / PrismaPg / pg construction PASS (no database connection)
Backend Jest: Test Suites: 1 passed; Tests: 1 passed
Frontend Vitest: Test Files: 1 passed; Tests: 1 passed
Root probes, Windows: tests 10, pass 10, fail 0, skipped 0
Root probes, Ubuntu: tests 10, pass 10, fail 0, skipped 0
Compiled backend bootstrap /health PASS on win32
Compiled backend bootstrap /health PASS on linux
```

## Reproduction

From the repository root with the pinned runtime, run sequentially:

```powershell
pnpm install --frozen-lockfile
pnpm verify:native
pnpm db:validate
pnpm lint
pnpm typecheck
pnpm format:check
pnpm test
pnpm build
pnpm verify:commands
```

Typecheck/test/build generate the client first. Build also runs verify:client. Test runs
nonempty Jest/Vitest suites. Verify:commands invokes actual root lint/typecheck/format:check/
build/test with one intentional failure at a time in each workspace. Do not run these
mutating probes concurrently with other host checks.

For a clean Windows dependency tree, copy package.json, pnpm-workspace.yaml,
pnpm-lock.yaml and .npmrc into an empty directory under `.verification/`, preserving
frontend/package.json, backend/package.json and backend/scripts/verify-native.cjs.
Run frozen install and the native check there. Reusing the pnpm download store is permitted;
node_modules must not be copied from the main tree.

```powershell
docker build -f docs/verification/phase-1/ubuntu.Dockerfile -t whistle-epl-setup-verification .
docker run --rm whistle-epl-setup-verification pnpm verify:native
```

The Dockerfile executes all positive gates and ten negative probes. Final processes exited
zero. For compiled bootstrap inspection run `pnpm --filter @whistle-epl/backend start`,
request `http://127.0.0.1:3000/health`, then stop it. For local shell development run
`pnpm --filter @whistle-epl/frontend dev`. HTTP development liveness is not HTTPS/browser acceptance.

`pnpm format` ran explicitly on the same source/config scopes as format:check, excluding
Context/ADRs/unrelated Markdown. `git diff --check` passed;
`git diff -- context docs/adr .specify/memory/constitution.md` was empty.

## Red/green and resolved findings

- Frontend first failed importing the absent App, then passed after implementation.
  Backend first failed TS2307 for absent main, then passed after bootstrap/health implementation.
  App, HTTP and root pnpm seams were explicitly confirmed by the user before tests.
- Strict engines rejected jsdom 30.1.3 for Node 24.14.0: selected 28.1.0. Strict peers rejected
  React 19.1.10 for Router 8.5.1: selected React/react-dom 19.2.9.
- First Ubuntu build hit an unrelated Yarn symlink: Corepack now enables pnpm only.
- Initial probes were 9/10 because Vite ignored an unimported erroneous TS file. Frontend
  build now checks `tsc --noEmit && vite build`; final probes are 10/10 on each OS.
- An intermediate Docker build captured a live host probe. `.dockerignore` now excludes
  `**/__setup_gate_probe__*`; the final clean-context build passed.
- Installation notices remain: pinned ESLint 9/transitive glob deprecation; @parcel/watcher
  and unrs-resolver lifecycle scripts are unapproved. Packaged native/fallback paths worked
  in the executed checks; no blanket lifecycle permission was added.

## Standards

Independent Reviewer Agent: no actionable documented-standard violations or baseline smells.
D097 majors, module formats, pins, scopes and absence of seeds are preserved. **0 open findings.**

## Spec

Independent Reviewer Agent: **0 open findings** after frontend build gained TypeScript checking.
Final checks/probes subsequently passed. Review covered all uncommitted additions against
the user-approved baseline; no empty commit-only diff was treated as evidence.

## Scoped convergence and remaining scope

Assessed all four requested Tasks; setup obligations under eight FR references
(001, 002, 007, 050, 056, 057, 059, 060), three SC references (001, 010, 012), seven plan
decisions (runtime, workspaces, frontend/backend stacks, Prisma generation, source scopes,
test tools), and five Constitution principles. No setup gap remains: missing/partial/
contradicts/unrequested all 0; severity counts all 0. No convergence Tasks appended.
This is convergence of T001–T004 only, not the full feature or entire referenced criteria.

T005–T048 remain pending: database/migrations/transactions, auth/admin/audit, actual Chrome/
Edge journeys, Compose/HTTPS, CI/protection, recovery and full SC-001–SC-013 acceptance.
Context Phase statuses/checklists and unresolved operator inputs are preserved.

Both Spec Kit prerequisite checks succeeded. `.specify/extensions.yml` is absent, so no
before/after implementation/convergence hooks were registered. Codex and two Reviewer Agents
performed execution/review; Team Leader software acceptance remains separate.
