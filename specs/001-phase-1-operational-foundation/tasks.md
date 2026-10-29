# Tasks: PHASE 1 — Operational Foundation and Access Administration

**Input**: [Approved Specification](spec.md), [Plan](plan.md), [research](research.md),
[data model](data-model.md), [REST](contracts/rest.md), [operator contract](contracts/operator-cli.md)
and [quickstart](quickstart.md).
**Status**: Approved by the Team Leader on 2026-10-28 (Asia/Bangkok).
**Execution status (2026-10-29)**: T001–T014 complete and published at [892f172](https://github.com/quocthai912/Whistle-EPL/commit/892f172f9ec539d5789a31a2f8046480afe15772) on `feat/phase-1-core-foundation`; T015–T048 remain pending. Issues #6–#19 are Closed with label `completed`. [The Phase ledger](../../context/progress-checker.md#phase-1-execution-evidence---2026-10-29) records project PHASE 1 as `IN_PROGRESS`; no Phase acceptance is claimed.
**Task approval evidence**: After reviewing the 48 Tasks and three analysis remediations, the
Team Leader selected “Duyệt sửa/Tasks; tôi sẽ tự commit/push tài liệu trước khi mở Issue”.
The approved wording corrections are incorporated; that Task approval itself claimed no software implementation. Subsequent execution is recorded separately above and per Task below.
**Issue publication**: Published 48/48 approved Task Issues after verifying the pushed documents at b8e6e15b27ed8446cc60dba94bf1a0b0259e51b2.
Returned Issue URLs are recorded against every published Task and in the dependency table.
**Tests**: Explicitly required by FR-059/FR-061 and the Constitution; core security/CLI tests below
are authored before their implementation where specified. There is no universal TDD requirement.
**Numbering**: Internal task phases below are not project PHASE 1-PHASE 10.
**Paths**: Repository-relative implementation targets; completion is recorded per Task below.

**Setup execution evidence (2026-10-29):** T001–T004 implemented and verified on Windows x64
and Ubuntu 24.04 x64; see [setup verification](../../docs/verification/phase-1/workspace-setup.md).
This does not establish project PHASE 1 acceptance. T005–T014 have subsequent execution evidence below; T015–T048 remain pending.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Pin/verify the selected toolchain and establish the two Workspaces. No implementation
may start until corresponding approved Task Issues exist.

- [X] T001 Establish root package.json, pnpm-workspace.yaml and pnpm-lock.yaml plus docs/operations/dependency-baseline.md with exact D097-compatible Node24/pnpm/package/image pins, two Workspaces and native-build allowlists; verify clean install/native argon2 and sharp imports on Ubuntu/Windows before claiming compatibility; no competing lockfile. (Depends: none; Covers: FR-001, FR-002, FR-057, FR-059, FR-060; SC-001, SC-012.) — Issue: [#6](https://github.com/quocthai912/Whistle-EPL/issues/6)

- [X] T002 [P] Create frontend/package.json, frontend/tsconfig.json, frontend/vite.config.ts and frontend/src/app/App.tsx using approved React/Vite/Router/Ant Design/CSS Modules baseline; Vietnamese shell, no fake league screens. (Depends: T001; Covers: FR-001, FR-007, FR-056; SC-001, SC-010.) — Issue: [#7](https://github.com/quocthai912/Whistle-EPL/issues/7)

- [X] T003 [P] Create backend/package.json, backend/tsconfig.json, backend/prisma.config.ts, backend/src/main.ts and backend/src/app.module.ts with Nest11/Express5 CommonJS, explicit Prisma7 CJS generator/output and PrismaPg/pg; provide bootstrap/build/health entry points without default accounts. (Depends: T001; Covers: FR-001, FR-002, FR-007, FR-050; SC-001.) — Issue: [#8](https://github.com/quocthai912/Whistle-EPL/issues/8)

- [X] T004 Configure eslint.config.mjs, .prettierrc.json, .prettierignore, root package.json and workspace Jest/Vitest configurations; implement root lint/typecheck/format/format:check/build/test commands with failure propagation and approved source scopes; generate client before checking generated imports. (Depends: T002, T003; Covers: FR-057, FR-059, FR-060; SC-012.) — Issue: [#9](https://github.com/quocthai912/Whistle-EPL/issues/9)

**Foundation execution evidence (2026-10-29):** T005–T014 implemented and verified on Windows x64 and Ubuntu 24.04 x64 with real PostgreSQL 17.11; see [foundation verification](../../docs/verification/phase-1/foundation.md). This is Task-scoped verification; project PHASE 1 acceptance and T015–T048 remain pending.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement shared typed schema/security/transaction/audit/fixture/HTTP support.
All story implementation waits for completion of this internal phase. This is not project PHASE 2.

- [X] T005 Implement Account/Session/PreloginCsrfContext/LoginThrottleKey/LoginFailure in backend/prisma/schema.prisma and backend/prisma/migrations/202610280001_identity_security/migration.sql; preserve UUID/FK/revision/timestamp types and these constraints verbatim: "personnelCode 1-32 code points; uppercase ASCII letters/digits/underscore/hyphen, starting alphanumeric; unique, stable and non-reusable; fullName 1-200 code points after D092 normalization; username 3-50 lowercase ASCII letters/digits/dot/underscore/hyphen, starting alphanumeric, unique case-insensitively"; "password 15-128 Unicode code points; hash UTF-8 without trim/case/NFC/truncation; Argon2id m=19456 KiB,t=2,p=1; no raw credential column; temporaryPasswordExpiresAt nullable until issuance, then 24-hour expiry; mustChangePassword required"; "session tokenHash exactly 64 lowercase hexadecimal characters and unique; csrfToken exactly 43 base64url characters; accountAuthRevision bigint; idle expiry 30 minutes and absolute expiry 8 hours; no raw session token column"; "prelogin id UUID v4; csrfToken exactly 43 base64url characters; expiresAt 15 minutes after creation; consumedAt nullable until success; no business authority"; "throttle key composite(kind,key), kind username or IP; blockedUntil and lastSuccessAt nullable; rolling failures timestamped by trusted time; username threshold 5, IP threshold 20, rolling window/block 15 minutes; evidence retained 24 hours subject to active dependencies". (Depends: T004; Covers: FR-003, FR-004, FR-008, FR-009, FR-010, FR-011, FR-012, FR-015, FR-017, FR-018, FR-019, FR-020, FR-022, FR-023, FR-050, FR-055; SC-003, SC-004, SC-006.) — Issue: [#10](https://github.com/quocthai912/Whistle-EPL/issues/10)

- [X] T006 Implement typed Season reference/system-role/season-role/shared/CreateSeason grants in backend/prisma/schema.prisma and backend/prisma/migrations/202610280002_authority/migration.sql; constraints: "system role live uniqueness(accountId,roleCode); seasonal role live uniqueness(accountId,seasonId,roleCode); real Account/Season FKs; roleCode from the approved finite actor-role set, not arbitrary input"; "shared grant live uniqueness(accountId,masterKind), masterKind club/player/stadium; create-season grant live uniqueness(accountId); grantor Account FK; endedAt/revokedAt nullable until ended; no implicit grant from a role"; "Season reference code 1-32 and name 1-200 code points, unique normalized code; startDate/endDate date; state Open or Closed; no PHASE 1 creation route or operational seed"; no operational Season seed or business routes. (Depends: T005; Covers: FR-024, FR-025, FR-026, FR-027, FR-028, FR-029, FR-030, FR-050; SC-005, SC-006.) — Issue: [#11](https://github.com/quocthai912/Whistle-EPL/issues/11)

- [X] T007 Implement DelegationCase/DelegationVersion/DelegationVersionEditor/DelegationGrant and technical boundary ledger in backend/prisma/schema.prisma and backend/prisma/migrations/202610280003_delegation/migration.sql; constraints: "delegation case has required season/proposer/recipient FKs; versionNumber positive and unique(caseId,versionNumber); reason at most 2000 code points and non-whitespace when required; startsAt/endsAt nullable in draft, complete at submission except server-resolved immediate start"; "submitted delegation version immutable in content; explicit immediate/future start choice; exact case/version FK; grant approvedVersionId unique; grant startsAt strictly before endsAt; no overlapping live intervals for the same recipient/operation/season; interval start inclusive and end exclusive"; "delegation editors unique(versionId,accountId), includes preparer; proposer/recipient/grant recorder are distinct people; recipient has an eligible seasonal role; only the three D019 operation/recipient combinations"; "SystemGuard key is a pre-created unique technical key; maintenance state is singleton and persisted; delegation boundary uniqueness(grantId,boundaryKind,effectiveAt); processedAt uses actual processing time, not claimed effective time". (Depends: T006; Covers: FR-032, FR-033, FR-034, FR-035, FR-036, FR-037, FR-038, FR-039, FR-040, FR-050; SC-007.) — Issue: [#12](https://github.com/quocthai912/Whistle-EPL/issues/12)

- [X] T008 Implement AuditRecord/CommandReceipt/SystemGuard/MaintenanceState in backend/prisma/schema.prisma and backend/prisma/migrations/202610280004_audit_operations/migration.sql; constraints: "audit actorId/objectId/seasonId/requestId nullable where their context requires; actorKind distinguishes account/operator/system; reason at most 2000 code points; before/after JSON follows action allowlists; no password/hash/session/CSRF/storage credential or whole request body"; "receipt unique(accountId,actionCode,requestKey); requestKey UUID v4; contentDigest SHA-256; expiresAt 24 hours after outcome; responseStatus/responseData nullable until outcome; never credential-bearing inputs or secret responses"; "SystemGuard key is a pre-created unique technical key; maintenance state is singleton and persisted; delegation boundary uniqueness(grantId,boundaryKind,effectiveAt); processedAt uses actual processing time, not claimed effective time"; reason fields at most 2000 code points; Restrict/NoAction history, query indexes and pre-created guards; prove fresh PG17 migration replay/status/intended-schema checks in backend/tests/integration/schema.spec.ts. (Depends: T007; Covers: FR-041, FR-042, FR-043, FR-044, FR-045, FR-048, FR-050, FR-051, FR-052, FR-055; SC-006, SC-008, SC-009.) — Issue: [#13](https://github.com/quocthai912/Whistle-EPL/issues/13)

- [X] T009 Implement shared credential/token primitives in backend/src/identity-access/security-primitives.service.ts and backend/tests/unit/security-primitives.spec.ts; pin approved SecLists source revision/checksum/license in backend/resources/password-blocklist/PROVENANCE.md; constraints: "password 15-128 Unicode code points; hash UTF-8 without trim/case/NFC/truncation; Argon2id m=19456 KiB,t=2,p=1; no raw credential column; temporaryPasswordExpiresAt nullable until issuance, then 24-hour expiry; mustChangePassword required"; "session tokenHash exactly 64 lowercase hexadecimal characters and unique; csrfToken exactly 43 base64url characters; accountAuthRevision bigint; idle expiry 30 minutes and absolute expiry 8 hours; no raw session token column"; "prelogin id UUID v4; csrfToken exactly 43 base64url characters; expiresAt 15 minutes after creation; consumedAt nullable until success; no business authority"; secure randomness, digest-only session persistence, corpus rejection and no normalization/secret logging. (Depends: T008; Covers: FR-004, FR-006, FR-009, FR-010, FR-011, FR-012, FR-017, FR-018, FR-044; SC-004, SC-005.) — Issue: [#14](https://github.com/quocthai912/Whistle-EPL/issues/14)

- [X] T010 Implement backend/src/platform/database.service.ts, transaction-context.ts, admission.service.ts, clock.service.ts, validation.pipe.ts and error.filter.ts; ordered shared/exclusive authority/admission locks, pre-created system guards, fresh post-wait clock, retry-at-most-three-known-rollbacks, persisted fail-closed maintenance and safe D085/D096 validation/envelopes; test independent connections in backend/tests/integration/transaction-foundation.spec.ts. (Depends: T009; Covers: FR-007, FR-031, FR-046, FR-047, FR-049, FR-050, FR-051, FR-058, FR-061; SC-005, SC-006, SC-009.) — Issue: [#15](https://github.com/quocthai912/Whistle-EPL/issues/15)

- [X] T011 Implement backend/src/audit/audit-writer.service.ts and audit-payload.policy.ts plus backend/tests/unit/audit-payload.spec.ts; per-action allowlists, explicit account/operator/system actor kinds, no secrets/whole bodies and required audit inside caller transaction; no export/delete. (Depends: T010; Covers: FR-006, FR-009, FR-041, FR-042, FR-044, FR-050; SC-008, SC-009.) — Issue: [#16](https://github.com/quocthai912/Whistle-EPL/issues/16)

- [X] T012 Implement backend/src/platform/command-receipt.service.ts and backend/tests/integration/command-receipt.spec.ts; constraint: "receipt unique(accountId,actionCode,requestKey); requestKey UUID v4; contentDigest SHA-256; expiresAt 24 hours after outcome; responseStatus/responseData nullable until outcome; never credential-bearing inputs or secret responses"; normalized target/content/revision digest, existing receipt before treating replay as new stale edit, current authority/projection checks, unique contenders/unknown commits and no credential receipts. (Depends: T011; Covers: FR-046, FR-047, FR-048, FR-049, FR-050; SC-006, SC-009.) — Issue: [#17](https://github.com/quocthai912/Whistle-EPL/issues/17)

- [X] T013 [P] Create backend/tests/fixtures/phase-1-fixtures.ts, isolated-target.guard.ts and test-clock.ts with backend/tests/integration/fixture-isolation.spec.ts; synthetic identities/two real-FK Season references, deterministic race barriers and reset refusal for operational URLs; no startup seeds or production fixture endpoints. (Depends: T012; Covers: FR-002, FR-024, FR-040, FR-050, FR-059, FR-060; SC-005, SC-006, SC-007, SC-013.) — Issue: [#18](https://github.com/quocthai912/Whistle-EPL/issues/18)

- [X] T014 [P] Implement frontend/src/shared/http/client.ts, session-context.tsx and frontend/src/app/router.tsx with frontend/tests/http-client.spec.ts; one Fetch layer, safe envelope/conflict handling, no automatic write replay, account-change memory clearing and Vietnamese Loading/Empty/Error shell. (Depends: T012; Covers: FR-007, FR-008, FR-017, FR-018, FR-021, FR-047, FR-056; SC-003, SC-010.) — Issue: [#19](https://github.com/quocthai912/Whistle-EPL/issues/19)

## Phase 3: User Story 1 — Establish and Recover the Foundation (Priority: P1)

**Goal**: Clean installation and protected operator initialization/recovery.
**Independent test**: US1/SC-001, SC-006, SC-011; fixtures may prepare isolated states, while
real installation/bootstrap/recovery/restore flows must be exercised.

- [ ] T015 [US1] Write backend/tests/integration/operator-access.spec.ts and backend/tests/unit/operator-contract.spec.ts for secure prompts, bootstrap race/locked-admin rejection, recovery target/reason restrictions and audit rollback; author expected failing scenarios before CLI implementation. (Depends: T013, T014; Covers: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-041, FR-042, FR-046, FR-050; SC-001, SC-006, SC-009.) — Issue: [#20](https://github.com/quocthai912/Whistle-EPL/issues/20)

- [ ] T016 [US1] Implement backend/src/cli/bootstrap-admin.ts and bootstrap-admin.service.ts with root admin:bootstrap; secure identity/credential input, serialized no-admin-even-locked guard and atomic administrator/temporary-credential/audit outcome, no business grants. (Depends: T015; Covers: FR-003, FR-004, FR-006, FR-011, FR-012, FR-022, FR-023, FR-041, FR-042; SC-001, SC-006.) — Issue: [#21](https://github.com/quocthai912/Whistle-EPL/issues/21)

- [ ] T017 [US1] Implement backend/src/cli/recover-admin.ts and recover-admin.service.ts with admin:recover; authenticated host-operator identity, reason, existing-admin-only reset/unlock, all-session invalidation, first-change on reset and no creation/promotion/business-right changes. (Depends: T016; Covers: FR-005, FR-006, FR-012, FR-013, FR-016, FR-041, FR-042; SC-003, SC-004, SC-006.) — Issue: [#22](https://github.com/quocthai912/Whistle-EPL/issues/22)

- [ ] T018 [P] [US1] Create ops/compose.yaml, ops/Caddyfile, frontend/Dockerfile, backend/Dockerfile and .env.example; health/readiness and committed migration deployment, same-origin trusted-local HTTPS, nonpublic PG17, persistent DB/Caddy/operation state, separate profiles and no secret/default-account values. (Depends: T013, T014; Covers: FR-001, FR-002, FR-007, FR-051, FR-058; SC-001, SC-010.) — Issue: [#23](https://github.com/quocthai912/Whistle-EPL/issues/23)

- [ ] T019 [US1] Implement backend/src/cli/maintenance.ts and docs/operations/maintenance.md; reference host executable ops/backup/maintenance.sh manages protected durable marker outside restored DB, shared writer/exclusive drain and verified release after interruption; prove restart/old-snapshot fail-closed behavior in backend/tests/integration/maintenance.spec.ts. (Depends: T017, T018; Covers: FR-046, FR-050, FR-051, FR-054; SC-001, SC-009, SC-011.) — Issue: [#24](https://github.com/quocthai912/Whistle-EPL/issues/24)

- [ ] T020 [US1] Implement ops/backup/backup.sh, restore.sh, verify-set.sh, verify-foundation.sh and docs/operations/backup-format.md; bind root ops:backup, ops:restore and ops:verify in package.json, with ops:verify running verify-foundation.sh only against an explicit isolated target and failing on unmet checks; versioned manifest/checksums/available-data inventory, same-set restore, compatibility/integrity verification, seven complete protected sets, non-overlap and restored-session invalidation; no full-season/media acceptance claim. (Depends: T019; Covers: FR-051, FR-052, FR-054, FR-060; SC-001, SC-011, SC-013.) — Issue: [#25](https://github.com/quocthai912/Whistle-EPL/issues/25)

- [ ] T021 [US1] Implement backend/src/operations/technical-cleanup.service.ts, ops/systemd/whistle-backup.service, whistle-backup.timer and backup-retry timer/service definitions; daily 03:00 Vietnam, 15-minute retry maximum three per run, missed-run/failure feedback, hourly eligible security/receipt cleanup and protected 30-day diagnostic rotation; document in docs/operations/scheduling.md. (Depends: T020; Covers: FR-015, FR-019, FR-020, FR-045, FR-051, FR-052, FR-053, FR-055; SC-003, SC-004, SC-011.) — Issue: [#26](https://github.com/quocthai912/Whistle-EPL/issues/26)

- [ ] T022 [US1] Write docs/operations/installation.md, credential-handoff.md and operator-access.md; real prerequisites, secure OS-operator controls, environment key inventory without values, clean install/start/bootstrap/recovery/reset instructions and correct limitations; defer results to actual execution. (Depends: T021; Covers: FR-001, FR-002, FR-004, FR-005, FR-006, FR-007, FR-059, FR-060; SC-001, SC-013.) — Issue: [#27](https://github.com/quocthai912/Whistle-EPL/issues/27)

## Phase 4: User Story 2 — Authenticate and Control My Sessions (Priority: P1)

**Goal**: Valid/restricted/expired/revoked login lifecycle with protected requests.
**Independent test**: US2/SC-002-SC-005, SC-010, using synthetic accounts and actual server paths.

- [ ] T023 [US2] Write backend/tests/integration/auth-session.spec.ts and login-throttle.spec.ts for all US2 flows, C01-C05 limits, exact expiry, stable tabs/CSRF, unknown-name parity, restart/counter races and reset-versus-issuance; author expected failing scenarios before auth handlers. (Depends: T013, T014; Covers: FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-016, FR-017, FR-018, FR-019, FR-020, FR-021, FR-061; SC-002, SC-003, SC-004, SC-005, SC-009.) — Issue: [#28](https://github.com/quocthai912/Whistle-EPL/issues/28)

- [ ] T024 [US2] Implement backend/src/identity-access/login-throttle.service.ts and trusted-source.policy.ts; deterministic missing-key/upsert locks, rolling username5/IP20 failures in15minutes, 15-minute block, success resets username only, blocked retry does not extend, trusted Caddy source and eligible evidence cleanup. (Depends: T023; Covers: FR-010, FR-019, FR-020, FR-055; SC-004, SC-005.) — Issue: [#29](https://github.com/quocthai912/Whistle-EPL/issues/29)

- [ ] T025 [US2] Implement backend/src/identity-access/session.service.ts, csrf.service.ts and auth.guard.ts; digest-only sessions, account authRevision, exact expiry-before-activity, protected cookie scopes, prelogin15minute/stable-session CSRF and exact Origin/Referer/no-store; every security-state writer uses admission. (Depends: T024; Covers: FR-008, FR-009, FR-014, FR-015, FR-016, FR-017, FR-018, FR-021, FR-044, FR-046, FR-051; SC-003, SC-004, SC-005.) — Issue: [#30](https://github.com/quocthai912/Whistle-EPL/issues/30)

- [ ] T026 [US2] Implement backend/src/identity-access/auth.controller.ts, auth.service.ts and auth.dto.ts for the five contract auth endpoints; generic failures, verified-password/authRevision recheck, temporary24hour/change-only state, personal change/all-session invalidation, current logout and atomic security audit with no secret receipts. (Depends: T025; Covers: FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-016, FR-017, FR-018, FR-019, FR-020, FR-021, FR-041, FR-042, FR-046, FR-061; SC-002, SC-003, SC-004, SC-005.) — Issue: [#31](https://github.com/quocthai912/Whistle-EPL/issues/31)

- [ ] T027 [US2] Implement frontend/src/features/auth/LoginPage.tsx, ChangePasswordPage.tsx and auth-routes.tsx plus frontend/tests/auth-flows.spec.tsx; Vietnamese restricted/full routing, logout/expiry notice, no persisted secrets and no replay; preserve safe validation input and clear internal data on account change. (Depends: T026; Covers: FR-007, FR-008, FR-012, FR-013, FR-014, FR-015, FR-016, FR-017, FR-018, FR-021, FR-056, FR-061; SC-003, SC-004, SC-010.) — Issue: [#32](https://github.com/quocthai912/Whistle-EPL/issues/32)

- [ ] T028 [US2] Implement tests/e2e/auth.spec.ts and playwright.config.ts for real Chrome/Edge HTTPS login/change/logout/multi-tab/revocation and error states; record versions, no bundled-Chromium substitution or application acceptance claim before execution. (Depends: T027, T018; Covers: FR-008, FR-012, FR-013, FR-014, FR-015, FR-016, FR-017, FR-018, FR-021, FR-056, FR-059, FR-060; SC-003, SC-004, SC-010, SC-013.) — Issue: [#33](https://github.com/quocthai912/Whistle-EPL/issues/33)

## Phase 5: User Story 3 — Administer Accounts and Scoped Authority (Priority: P1)

**Goal**: Safe account/role/grant/delegation administration without later business UCs.
**Independent test**: US3/SC-005-SC-007, SC-009; distinct people/two seasons and deterministic races.

- [ ] T029 [US3] Write backend/tests/integration/account-administration.spec.ts and permission-races.spec.ts; two administrators/two seasons, one-person identity, self-grant/self-lock/final-admin races, lock/unlock and prerequisite-loss cascades with independent-connection assertions before handlers. (Depends: T026; Covers: FR-022, FR-023, FR-024, FR-025, FR-026, FR-027, FR-028, FR-029, FR-030, FR-031, FR-041, FR-042, FR-046, FR-047, FR-048, FR-049, FR-050; SC-005, SC-006, SC-009.) — Issue: [#34](https://github.com/quocthai912/Whistle-EPL/issues/34)

- [ ] T030 [US3] Implement backend/src/identity-access/accounts.controller.ts, accounts.service.ts and accounts.dto.ts for allowlisted account/list/system-role actions; C01/C02 identity and credential limits, no hard delete, self/final-admin guards, cancellation-safe updates, secret-free projections and atomic audit/revocation/receipts. (Depends: T029; Covers: FR-022, FR-023, FR-025, FR-026, FR-029, FR-031, FR-041, FR-042, FR-044, FR-045, FR-046, FR-047, FR-048, FR-049, FR-050; SC-005, SC-006, SC-008, SC-009.) — Issue: [#35](https://github.com/quocthai912/Whistle-EPL/issues/35)

- [ ] T031 [US3] Implement backend/src/identity-access/grants.controller.ts, grants.service.ts and authority.policy.ts; seasonal/multiple roles, shared club/stadium/player prerequisites across seasons, CreateSeason separate no-self grant, safe self-reduction, loss cascades/session invalidation and current object/scope checks; no later business handlers. (Depends: T030; Covers: FR-016, FR-022, FR-024, FR-026, FR-027, FR-028, FR-029, FR-030, FR-031, FR-038, FR-040, FR-041, FR-042, FR-046, FR-047, FR-048, FR-049, FR-050; SC-003, SC-005, SC-006, SC-007, SC-009.) — Issue: [#36](https://github.com/quocthai912/Whistle-EPL/issues/36)

- [ ] T032 [US3] Write backend/tests/integration/delegation.spec.ts and delegation-boundaries.spec.ts for all D019 combinations, three-person separation, transitions/version immutability, overlaps/adjacency/future-start and once-only start/end crossed during downtime; expected failing scenarios precede delegation implementation. (Depends: T031; Covers: FR-032, FR-033, FR-034, FR-035, FR-036, FR-037, FR-038, FR-039, FR-040, FR-046, FR-047, FR-048, FR-050; SC-003, SC-006, SC-007, SC-009.) — Issue: [#37](https://github.com/quocthai912/Whistle-EPL/issues/37)

- [ ] T033 [US3] Implement backend/src/identity-access/delegations.controller.ts, delegation-proposal.service.ts and delegation.dto.ts; exact contract actions and version/revision allowlists, immutable submission and preserved editors, grant exactly submitted content, reasoned return/reject/revoke and atomic authority/audit/receipt outcomes. (Depends: T032; Covers: FR-032, FR-033, FR-034, FR-035, FR-036, FR-037, FR-038, FR-040, FR-041, FR-042, FR-046, FR-047, FR-048, FR-049, FR-050; SC-005, SC-006, SC-007, SC-009.) — Issue: [#38](https://github.com/quocthai912/Whistle-EPL/issues/38)

- [ ] T034 [US3] Implement backend/src/identity-access/delegation-boundary.service.ts and integrate due-boundary resolution into session.service.ts and grants.service.ts; durable chronological once-only invalidation under ordered affected-account locks, no revocation of fresh post-boundary logins and no revival after eligibility loss/unlock. (Depends: T033; Covers: FR-015, FR-016, FR-028, FR-029, FR-034, FR-037, FR-038, FR-039, FR-040, FR-046, FR-050, FR-055; SC-003, SC-006, SC-007.) — Issue: [#39](https://github.com/quocthai912/Whistle-EPL/issues/39)

- [ ] T035 [US3] Implement frontend/src/features/accounts/AccountsPage.tsx, GrantsPanel.tsx and DelegationsPage.tsx plus frontend/tests/administration.spec.tsx; approved role/season scopes and states, confirm/cancel, conflict review, required reason/version fields, safe lists and Vietnamese notices; do not offer unrestricted status or business screens. (Depends: T034, T027; Covers: FR-022, FR-023, FR-024, FR-025, FR-026, FR-027, FR-028, FR-029, FR-030, FR-031, FR-032, FR-033, FR-034, FR-035, FR-036, FR-037, FR-038, FR-039, FR-040, FR-045, FR-047, FR-056; SC-005, SC-006, SC-007, SC-008, SC-010.) — Issue: [#40](https://github.com/quocthai912/Whistle-EPL/issues/40)

- [ ] T036 [P] [US3] Complete backend/tests/integration/atomic-admin.spec.ts for audit/save rollback, revoked/expired authority after controlled lock wait, last-admin and delegation overlap contenders, same-intent response loss/different-intent conflict and uncertain commit resolution; verify committed state independently. (Depends: T035; Covers: FR-025, FR-035, FR-039, FR-041, FR-042, FR-046, FR-047, FR-048, FR-049, FR-050; SC-005, SC-006, SC-007, SC-009.) — Issue: [#41](https://github.com/quocthai912/Whistle-EPL/issues/41)

- [ ] T037 [P] [US3] Implement tests/e2e/administration.spec.ts for account/grant/delegation/cancellation/conflict and direct unauthorized navigation in actual Chrome/Edge; no later business operations or mock operational data. (Depends: T035; Covers: FR-022, FR-024, FR-025, FR-026, FR-027, FR-028, FR-029, FR-030, FR-031, FR-032, FR-036, FR-039, FR-040, FR-047, FR-056, FR-059, FR-060; SC-005, SC-006, SC-007, SC-010, SC-013.) — Issue: [#42](https://github.com/quocthai912/Whistle-EPL/issues/42)

## Phase 6: User Story 4 — Inspect Protected Audit History (Priority: P2)

**Goal**: Read-only, access-scoped audit metadata search and safe UI.
**Independent test**: US4/SC-008-SC-010; real in-scope events, safe pagination and denied payloads.
Append/atomicity support is already foundational; this story does not defer auditing earlier writes.

- [ ] T038 [US4] Write backend/tests/integration/audit-access.spec.ts and frontend/tests/audit-query.spec.tsx for administrator-only metadata/current-object redaction, action/time/actor/object filters, empty/errors, default20/max100 deterministic totals/pages and no export/edit/delete or read mutation. (Depends: T031, T026; Covers: FR-041, FR-042, FR-043, FR-044, FR-045, FR-061; SC-005, SC-008, SC-009, SC-010.) — Issue: [#43](https://github.com/quocthai912/Whistle-EPL/issues/43)

- [ ] T039 [US4] Implement backend/src/audit/audit.controller.ts, audit-query.service.ts and audit-view.policy.ts; exact GET-only contract/query allowlists and metadata projection with current object-read boundaries; preserve append-only history and safe requestId errors. (Depends: T038; Covers: FR-041, FR-043, FR-044, FR-045, FR-061; SC-005, SC-008, SC-009.) — Issue: [#44](https://github.com/quocthai912/Whistle-EPL/issues/44)

- [ ] T040 [US4] Implement frontend/src/features/audit/AuditPage.tsx and audit-filters.ts with frontend/tests/audit-page.spec.tsx; authorized Vietnamese metadata lookup, safe filter/pagination/error states and no restricted payload or export/edit/delete controls. (Depends: T039, T027; Covers: FR-043, FR-044, FR-045, FR-056; SC-005, SC-008, SC-010.) — Issue: [#45](https://github.com/quocthai912/Whistle-EPL/issues/45)

- [ ] T041 [US4] Implement tests/e2e/audit.spec.ts; produce real account/login/logout/grant/recovery events and inspect authorized lookup, denied users, no secret payload and unchanged content across pagination; preserve retained history through account locking and technical cleanup. (Depends: T040, T034, T021; Covers: FR-006, FR-009, FR-014, FR-016, FR-041, FR-042, FR-043, FR-044, FR-045, FR-055, FR-059, FR-060; SC-003, SC-005, SC-008, SC-010, SC-013.) — Issue: [#46](https://github.com/quocthai912/Whistle-EPL/issues/46)

## Phase 7: Polish & Cross-Cutting Verification

**Purpose**: Install the real CI/branch gate and execute clean-environment, browser, load,
security and available-foundation recovery evidence. No Phase acceptance is inferred from task completion.

- [ ] T042 Implement .github/workflows/ci.yml and docs/operations/ci.md after real scripts/tests exist; PR development/main, push main, manual, full doc-only pipeline, pinned Actions/minimal token/disposable fixtures, both OS source/unit/build and Ubuntu PG17 migration/integration; explicit always-evaluated gate rejects failure/cancellation/skipped mandatory jobs, no deploy/secrets. (Depends: T028, T036, T037, T041, T004; Covers: FR-001, FR-057, FR-058, FR-059, FR-060; SC-012, SC-013.) — Issue: [#47](https://github.com/quocthai912/Whistle-EPL/issues/47)

- [ ] T043 After genuine passing check discovery, configure and verify development/main PR-only required-check/no-bypass/no-direct-or-force-push/deletion rules under D098; record actual settings and safe success/failure/cancel/doc-only PR evidence in docs/verification/phase-1/branch-protection.md; no mandatory human reviewer gate or destructive branch tests. (Depends: T042; Covers: FR-057, FR-058, FR-060; SC-012, SC-013.) — Issue: [#48](https://github.com/quocthai912/Whistle-EPL/issues/48)

- [ ] T044 Execute the approved clean-environment/Compose/HTTPS/replacement/operator/Chrome+Edge walkthroughs from quickstart.md and retain actual safe output/versions/fixture manifests in docs/verification/phase-1/clean-install.md; fail on undocumented setup or missing entry points. (Depends: T043, T022; Covers: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-056, FR-059, FR-060; SC-001, SC-006, SC-010, SC-012, SC-013.) — Issue: [#49](https://github.com/quocthai912/Whistle-EPL/issues/49)

- [ ] T045 [P] Implement tests/performance/authentication.js and run local k6 with synthetic unlocked/change-completed identities, controls enabled, at least100 attempts/20concurrent/95%within3seconds on recorded 4vCPU/8GiB/SSD reference profile; keep success/error/latency evidence in docs/verification/phase-1/bm01.md, separate from lookup warmup/CI timing. (Depends: T044; Covers: FR-008, FR-009, FR-010, FR-011, FR-012, FR-015, FR-019, FR-020, FR-059, FR-060; SC-002, SC-004, SC-013.) — Issue: [#50](https://github.com/quocthai912/Whistle-EPL/issues/50)

- [ ] T046 [P] Execute isolated complete-seven-set/failed/missed/retried/overlapping/corrupt-set and interrupted-restore/restart drills; prove durable admission and revoked restored sessions, compare available-data inventory and record profile/off-host inputs where selected in docs/verification/phase-1/recovery.md; do not claim full-season BM07. (Depends: T044; Covers: FR-015, FR-045, FR-051, FR-052, FR-053, FR-054, FR-055, FR-059, FR-060; SC-001, SC-003, SC-011, SC-013.) — Issue: [#51](https://github.com/quocthai912/Whistle-EPL/issues/51)

- [ ] T047 [P] Run backend/tests/integration/security-regression.spec.ts plus frontend/browser checks for at least10 distinct unauthorized UI/direct cases, injection/displayed dangerous content, credential/log/artifact/receipt redaction, audit rollback and cross-account memory isolation; document actual results/defects in docs/verification/phase-1/security.md. (Depends: T044; Covers: FR-007, FR-008, FR-010, FR-016, FR-017, FR-018, FR-021, FR-022, FR-024, FR-025, FR-026, FR-027, FR-028, FR-029, FR-030, FR-031, FR-032, FR-033, FR-035, FR-038, FR-039, FR-040, FR-041, FR-042, FR-043, FR-044, FR-045, FR-046, FR-047, FR-048, FR-049, FR-050, FR-058, FR-059, FR-060, FR-061; SC-003, SC-004, SC-005, SC-006, SC-007, SC-008, SC-009, SC-010, SC-013.) — Issue: [#52](https://github.com/quocthai912/Whistle-EPL/issues/52)

- [ ] T048 Consolidate actual SC-001-SC-013/source/UC evidence, environments, fixture reset, commands, outcomes, remaining O08/O12/O13/O14 inputs and defects in docs/verification/phase-1/acceptance.md; request reviewer acceptance and only then update context/progress-checker.md with supported evidence/status; Tasks/Issues or document checks alone never complete the Phase. (Depends: T045, T046, T047; Covers: FR-001, FR-059, FR-060; SC-001, SC-002, SC-003, SC-004, SC-005, SC-006, SC-007, SC-008, SC-009, SC-010, SC-011, SC-012, SC-013.) — Issue: [#53](https://github.com/quocthai912/Whistle-EPL/issues/53)

## Dependencies & Execution Order

Every Phase 2 Task additionally waits for all Phase 1 setup Tasks; every US1-US4 Task additionally
waits for all Phase 2 foundational Tasks. Listed Depends entries are direct prerequisites in addition
to those barriers. Cross-cutting execution waits for the listed actual story integrations. A [P]
marker permits parallel work only after all prerequisites/barriers pass and only in distinct files.
Do not edit shared schema, root manifests or the same service concurrently without coordination.

| Task | Direct prerequisites | Story | Issue |
|---|---|---|---|
| T001 | None | Shared | [#6](https://github.com/quocthai912/Whistle-EPL/issues/6) |
| T002 | T001 | Shared | [#7](https://github.com/quocthai912/Whistle-EPL/issues/7) |
| T003 | T001 | Shared | [#8](https://github.com/quocthai912/Whistle-EPL/issues/8) |
| T004 | T002, T003 | Shared | [#9](https://github.com/quocthai912/Whistle-EPL/issues/9) |
| T005 | T004 | Shared | [#10](https://github.com/quocthai912/Whistle-EPL/issues/10) |
| T006 | T005 | Shared | [#11](https://github.com/quocthai912/Whistle-EPL/issues/11) |
| T007 | T006 | Shared | [#12](https://github.com/quocthai912/Whistle-EPL/issues/12) |
| T008 | T007 | Shared | [#13](https://github.com/quocthai912/Whistle-EPL/issues/13) |
| T009 | T008 | Shared | [#14](https://github.com/quocthai912/Whistle-EPL/issues/14) |
| T010 | T009 | Shared | [#15](https://github.com/quocthai912/Whistle-EPL/issues/15) |
| T011 | T010 | Shared | [#16](https://github.com/quocthai912/Whistle-EPL/issues/16) |
| T012 | T011 | Shared | [#17](https://github.com/quocthai912/Whistle-EPL/issues/17) |
| T013 | T012 | Shared | [#18](https://github.com/quocthai912/Whistle-EPL/issues/18) |
| T014 | T012 | Shared | [#19](https://github.com/quocthai912/Whistle-EPL/issues/19) |
| T015 | T013, T014 | US1 | [#20](https://github.com/quocthai912/Whistle-EPL/issues/20) |
| T016 | T015 | US1 | [#21](https://github.com/quocthai912/Whistle-EPL/issues/21) |
| T017 | T016 | US1 | [#22](https://github.com/quocthai912/Whistle-EPL/issues/22) |
| T018 | T013, T014 | US1 | [#23](https://github.com/quocthai912/Whistle-EPL/issues/23) |
| T019 | T017, T018 | US1 | [#24](https://github.com/quocthai912/Whistle-EPL/issues/24) |
| T020 | T019 | US1 | [#25](https://github.com/quocthai912/Whistle-EPL/issues/25) |
| T021 | T020 | US1 | [#26](https://github.com/quocthai912/Whistle-EPL/issues/26) |
| T022 | T021 | US1 | [#27](https://github.com/quocthai912/Whistle-EPL/issues/27) |
| T023 | T013, T014 | US2 | [#28](https://github.com/quocthai912/Whistle-EPL/issues/28) |
| T024 | T023 | US2 | [#29](https://github.com/quocthai912/Whistle-EPL/issues/29) |
| T025 | T024 | US2 | [#30](https://github.com/quocthai912/Whistle-EPL/issues/30) |
| T026 | T025 | US2 | [#31](https://github.com/quocthai912/Whistle-EPL/issues/31) |
| T027 | T026 | US2 | [#32](https://github.com/quocthai912/Whistle-EPL/issues/32) |
| T028 | T027, T018 | US2 | [#33](https://github.com/quocthai912/Whistle-EPL/issues/33) |
| T029 | T026 | US3 | [#34](https://github.com/quocthai912/Whistle-EPL/issues/34) |
| T030 | T029 | US3 | [#35](https://github.com/quocthai912/Whistle-EPL/issues/35) |
| T031 | T030 | US3 | [#36](https://github.com/quocthai912/Whistle-EPL/issues/36) |
| T032 | T031 | US3 | [#37](https://github.com/quocthai912/Whistle-EPL/issues/37) |
| T033 | T032 | US3 | [#38](https://github.com/quocthai912/Whistle-EPL/issues/38) |
| T034 | T033 | US3 | [#39](https://github.com/quocthai912/Whistle-EPL/issues/39) |
| T035 | T034, T027 | US3 | [#40](https://github.com/quocthai912/Whistle-EPL/issues/40) |
| T036 | T035 | US3 | [#41](https://github.com/quocthai912/Whistle-EPL/issues/41) |
| T037 | T035 | US3 | [#42](https://github.com/quocthai912/Whistle-EPL/issues/42) |
| T038 | T031, T026 | US4 | [#43](https://github.com/quocthai912/Whistle-EPL/issues/43) |
| T039 | T038 | US4 | [#44](https://github.com/quocthai912/Whistle-EPL/issues/44) |
| T040 | T039, T027 | US4 | [#45](https://github.com/quocthai912/Whistle-EPL/issues/45) |
| T041 | T040, T034, T021 | US4 | [#46](https://github.com/quocthai912/Whistle-EPL/issues/46) |
| T042 | T028, T036, T037, T041, T004 | Shared | [#47](https://github.com/quocthai912/Whistle-EPL/issues/47) |
| T043 | T042 | Shared | [#48](https://github.com/quocthai912/Whistle-EPL/issues/48) |
| T044 | T043, T022 | Shared | [#49](https://github.com/quocthai912/Whistle-EPL/issues/49) |
| T045 | T044 | Shared | [#50](https://github.com/quocthai912/Whistle-EPL/issues/50) |
| T046 | T044 | Shared | [#51](https://github.com/quocthai912/Whistle-EPL/issues/51) |
| T047 | T044 | Shared | [#52](https://github.com/quocthai912/Whistle-EPL/issues/52) |
| T048 | T045, T046, T047 | Shared | [#53](https://github.com/quocthai912/Whistle-EPL/issues/53) |

### Story graph and three-member coordination

Setup -> shared schema/platform/audit/receipts -> all story foundations.
US1 operator work and US2 authentication may progress on separate files after shared prerequisites.
US3 handlers depend on implemented US2 authentication; its browser work waits for its own handlers.
US4 query/UI depends on authentication and event producers, but not all delegation UI.
US1 full install acceptance integrates the later completed first-login change from US2.
No story is permitted to omit shared audit/security simply to appear independent.

### Parallel examples

- Setup: T002 and T003 after T001, then shared root configuration serially.
- US1: T018 alongside CLI work after the foundation barrier; maintenance integrates both.
- US2: once auth handlers are stable, a teammate can prepare UI/browser scenarios while the backend
  owner closes auth-test failures; do not mark prerequisites complete until actually verified.
- US3: T036 and T037 after T035 use distinct files.
- US4: query/backend and UI reviews can be staffed separately after contract implementation;
  the final browser task waits for both event production and audit UI.
- Final verification: T045, T046 and T047 after T044,
  using separate isolated datasets/databases; final evidence waits for all three.

## Implementation Strategy

Deliver setup/shared controls, US1 operator initialization and US2 first-login/session flows as the
initial engineering slice. Validate each US independently with its approved fixtures/prerequisites,
then add US3 administration/delegation and US4 metadata lookup. All four stories and final mandatory
criteria are required for PHASE 1 acceptance; the initial slice is not Phase completion.

Task approval is recorded above. The Team Leader published the documents at
b8e6e15b27ed8446cc60dba94bf1a0b0259e51b2; GitHub CLI then created and verified one Issue for each
approved Task, with immutable Task/Specification links, direct and barrier dependencies, scoped
acceptance checks and expected evidence. Returned URLs are attached to every Task and table row.
Reuse these Issues rather than creating duplicates. Implementation commits/pushes are separate
authorized work; Issue publication does not implement functionality or complete the Phase.
