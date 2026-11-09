# Tasks: PHASE 2 - Seasons, Catalogs, and Regulations

**Status**: T001-T030 approved by the Team Leader on 2026-11-10 (Asia/Bangkok).

**Approval evidence**: After the 30-Task breakdown and read-only cross-artifact analysis
(48 FRs/12 SCs covered; no reported findings) were presented, the Team Leader answered
"Tôi đồng ý." to final approval and one GitHub Issue per Task. Specification and Plan
approvals remain separately recorded. No Task is started or completed by approval/publication.

**Issue publication, 2026-11-10 (Asia/Bangkok)**: Published and read back 30/30 unique Task
Issues, [#72](https://github.com/quocthai912/Whistle-EPL/issues/72) through
[#101](https://github.com/quocthai912/Whistle-EPL/issues/101), labelled ready-for-agent,
with exactly 44 native blocked-by relationships matching the approved dependencies. Every
Task row below records its actual Issue URL. Approval criteria and Task definitions were
compared against their publication snapshots; all Task checkboxes remain unchecked.
Spec/Plan/Tasks source links in the Issues explicitly await human publication of the local
documents. After that publication, verify source links and replace the pending-source note;
publishing documents alone does not close Issues or complete Tasks.

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts](contracts/rest.md), [verification.md](verification.md)
and [quickstart.md](quickstart.md). Current Context/Constitution remain normative.

**Tests**: Required by FR-046-FR-048 and Constitution V. Each implementation slice includes
its own tests; test code may be developed alongside the slice, without a universal TDD rule.
Final verification tasks run integrated/deep checks and record actual results, not duplicate
feature implementation. No source code or tests are written by this Task-generation command.

**Task identity**: T001-T030 are local to this feature; canonical identity is this tasks.md
path plus Task ID, distinct from PHASE 1's IDs. One Issue per finally approved canonical Task;
Issue title must identify PHASE 2 and Task ID. No independent ticket split/merge is permitted.

## Format and execution controls

Every Task has an unchecked box, sequential ID, optional [P], story label where applicable,
paths, exact blocking IDs, FR/SC traceability and required acceptance. Paths below are planned
implementation targets, not claims those files exist today. Supporting paths may be extended
within the approved module boundary, never by creating another architecture or future Phase.

[P] permits concurrency only after listed blockers are complete and while file sets are
disjoint. Dependencies govern execution rather than document proximity. Finish each Task's
verification before checking it off. Changes to shared schema/route/fixture/audit files are
serialized even when feature-specific work can proceed concurrently.

There is no automatic commit, deployment, push, PR, next-Phase work or implementation
authorization. Final Task approval is recorded above; publishing/linking the approved Issues
is now authorized. Application implementation remains outside this chat's authorized scope.
All seven stories are mandatory for PHASE 2.

## Phase 1: Setup

These numbered phases organize Spec Kit Tasks, not project PHASE 1/PHASE 2.

**Purpose**: Verify inherited foundation and classify actual inputs before changing it.

- [ ] T001 Record the reproducible PHASE 2 preflight in docs/verification/phase-2/preflight.md using existing package.json commands, accepted PHASE 1 evidence, test-target guards and protected configuration. **Blocked by:** none. **Trace:** FR-046-FR-048; SC-012. **Acceptance:** record actual revision/pins/OS/commands and baseline regressions without fabricated passes; identify reviewed existing-Season competitionName mapping, authorized 20-club logo provenance, isolated database/browser/restore roots and storage/UID/space inputs. Missing operational inputs block only their affected deployment/acceptance; do not fill them from test defaults or fetch unapproved assets. **Issue:** [#72](https://github.com/quocthai912/Whistle-EPL/issues/72)

## Phase 2: Foundational prerequisites

**Purpose**: Add the shared typed schema/security/transport/readiness seams needed by every
story. These are verified foundation exceptions to feature vertical slices, not new business
workflows. Production deployment of expanded media schema remains blocked until T019/T028.

- [ ] T002 Expand the Season/regulation/lifecycle and schema-only summary relationships in backend/prisma/schema.prisma and backend/prisma/migrations/, updating backend/tests/fixtures/phase-1-fixtures.ts and backend/tests/integration/phase-2-seasons.spec.ts. **Blocked by:** T001. **Trace:** FR-002-FR-023, FR-035-FR-041, FR-046; SC-002-SC-004, SC-008-SC-009. **Acceptance:** additive fresh/populated migration preserves existing IDs/roles/delegations/audit; use reviewed competitionName backfill before NOT NULL, no effective-rule seed. Enforce quoted data-model clauses: "backend UUID v4; SQL uuid", "bigint > 0, starting 1", "integer > 0, unique within its case", "startDate <= endDate", "state OPEN/CLOSED", "statisticsRevision initially 0 for a new season", "UNIQUE seasonId", "UNIQUE(caseId,versionNumber)", "SCHEDULED requires proposedEffectiveAt before submit", "IMMEDIATE has no caller-selected effective instant", "Content immutable after submission", "positive contiguous positions", "opensAt < closesAt", "UNIQUE(version,code)", "replacement required only for REPLACE", "Restrict/NoAction" and same-case/season FK checks. Create actual SeasonSummaryCase/Version/Editor targets and lifecycle summary FK without summary authoring. Retain typed nullable draft columns, complete editor/predecessor history, all allowed state codes from data-model.md, and partial single APPROVED_WAITING/EFFECTIVE guards; do not fake required values, ignore wrong-season references or cascade historical deletion. Independent PostgreSQL comparison and existing fixture regressions must pass. **Issue:** [#73](https://github.com/quocthai912/Whistle-EPL/issues/73)

- [ ] T003 Add Club/Stadium/Club-only MediaAsset storage and media-aware backup-schema recognition in backend/prisma/schema.prisma, backend/prisma/migrations/, ops/backup/set-format.py, ops/backup/common.sh, ops/backup/backup.sh, backend/src/operations/maintenance.service.ts and ops/backup/tests/test_set_format.py. **Blocked by:** T002. **Trace:** FR-024-FR-034, FR-041, FR-046-FR-048; SC-002, SC-007, SC-009, SC-012. **Acceptance:** preserve "Unique immutable code", "UNIQUE(provider,objectKey) and UNIQUE(clubId,id)", actual Club/Account FKs and same-owner currentLogoId; Club name/abbreviation required, Stadium location nullable, discontinuedAt/currentLogoId/unreferencedAt/contentDeletedAt nullable as designed. No Player FK without its target, fake Player or master cascade. Dispatch v1 only for matching legacy foundation schema and v2 available-phase-2 for expanded schema; fail closed on mismatch/incomplete sets. Verify the no-assets expanded-schema backup/verification path, with nonempty media deployment explicitly gated on T019; no format may silently label an empty v1 set media-complete. **Issue:** [#74](https://github.com/quocthai912/Whistle-EPL/issues/74)

- [ ] T004 Extend ordered business execution, typed locks and per-action command receipts in backend/src/platform/business-execution.ts, backend/src/platform/transaction-context.ts, backend/src/platform/command-receipt.service.ts and backend/tests/integration/phase-2-security.spec.ts. **Blocked by:** T003. **Trace:** FR-001, FR-006, FR-039-FR-041, FR-046-FR-047; SC-003, SC-005, SC-009. **Acceptance:** require operation-specific authority, preserve session/CSRF and D096 order, static table mappings and at most three known-rollback attempts. Season creation uses fixed SeasonCollection scope with no fake prior revision; exact-version intents cover regulation/change/lifecycle approvals. Test same-account/action/key replay for 24 hours before stale-state checks, changed-content rejection, current-access replay denial, unknown outcome resolution, expiry business guards and independent committed-state rollback; existing administration behavior must remain intact. **Issue:** [#75](https://github.com/quocthai912/Whistle-EPL/issues/75)

- [ ] T005 [P] Implement fail-closed later-fact interfaces and isolated evidence composition in backend/src/season-regulations/season-dependencies.port.ts, backend/src/season-regulations/season-dependencies.service.ts, backend/tests/fixtures/phase-2-fixtures.ts, backend/tests/fixtures/phase-2-evidence.ts and backend/tests/unit/phase-2-ports.spec.ts. **Blocked by:** T004. **Trace:** FR-004, FR-014-FR-016, FR-022-FR-023, FR-026-FR-029, FR-036-FR-038, FR-046-FR-047; SC-002-SC-004, SC-006, SC-008. **Acceptance:** return KNOWN, VERIFIED_NOT_INTRODUCED or UNAVAILABLE with explicit basis/lock discovery; verified absence requires both absent owning relations and no registered owning writer, while partial schema/provider failure blocks. Actual empty summary target is not closure readiness. Use real typed IDs/FKs for fixture references, label other later-port simulations, preserve existing reset isolation/acknowledgement and ensure production imports no fixture adapter or permissive empty fallback. **Issue:** [#76](https://github.com/quocthai912/Whistle-EPL/issues/76)

- [ ] T006 [P] Extend existing session capability projection and HTTP/UI transport in backend/src/identity-access/auth.service.ts, backend/src/platform/response-envelope.interceptor.ts, frontend/src/shared/http/client.ts, frontend/src/shared/http/session-view.ts, frontend/src/shared/http/session-store.ts, frontend/tests/phase-2-http.spec.tsx and playwright.config.ts. **Blocked by:** T004. **Trace:** FR-001, FR-030-FR-033, FR-039, FR-043-FR-045; SC-005, SC-007, SC-011. **Acceptance:** expose only current create/shared/seasonal/delegated preparation hints; retain server authority and PHASE 1 response compatibility. FormData preserves browser boundary, CSRF/cookies/session epochs/unknown outcomes; retain validated field-error details. Successful validated file bytes alone bypass the JSON success envelope; errors remain protected. Register phase-2 browser test discovery without dropping existing suites; no public lookup, new permission store or unrestricted route bypass. **Issue:** [#77](https://github.com/quocthai912/Whistle-EPL/issues/77)

- [ ] T007 Add PHASE 2 action-specific audit and object-authorized history infrastructure in backend/src/audit/audit-payload.policy.ts, backend/src/audit/audit-view.policy.ts, backend/src/audit/business-history.service.ts, backend/src/app.module.ts and backend/tests/integration/phase-2-security.spec.ts. **Blocked by:** T005, T006. **Trace:** FR-026-FR-029, FR-035, FR-039-FR-042, FR-046; SC-005, SC-009. **Acceptance:** bounded scalar before/after and exact immutable version references cover Season/regulation/change/lifecycle/Club/Stadium/MediaAsset actions with required reason/effectivity. Owning services supply actual resource authority; administrator UC04 remains metadata-only absent current object-read permission. Required audit failure rolls back business writes; no secret/path/unrestricted request snapshot, edit/delete/export or broadening of existing audit payload access. Wire shared execution/providers without activating later workflows. **Issue:** [#78](https://github.com/quocthai912/Whistle-EPL/issues/78)

**Checkpoint**: Shared schema/guards/transport are verifiable and existing foundation tests
remain active. No later-Phase application is enabled; expanded-schema operational release is
not allowed until real media backup/restore and integrated verification pass.

## Phase 3: User Story 1 - Season shell (Priority: P1)

**Goal**: Create and manage a season with explicit authority, not implicit roles.
**Independent test**: Create with only the global creation grant, separately staff it, then
look up/edit permitted metadata and reject cross-season, stale and Closed writes.

- [ ] T008 [US1] Deliver create-only season acknowledgement through backend/src/season-regulations/seasons.controller.ts, backend/src/season-regulations/seasons.service.ts, frontend/src/features/seasons/SeasonCreateForm.tsx, frontend/src/app/router.tsx, backend/tests/integration/phase-2-seasons.spec.ts and tests/e2e/phase-2-seasons.spec.ts. **Blocked by:** T007. **Trace:** FR-001-FR-004, FR-025, FR-039-FR-043; SC-001-SC-005, SC-009, SC-011. **Acceptance:** explicitly entered normalized code, name, competitionName and dates create OPEN state without rules/roles/internal read grants; preserve exact "code 1-32", "season/club/stadium names 1-200", "startDate <= endDate" and required competitionName T(200). Server assigns UUID v4; repeated creation replays minimal id/revision, duplicate code fails, missing/revoked creation grant cannot use administrator/season-role status as substitute. Test UI/direct request, normalized preview, cancellation, concurrent creation and atomic audit. **Issue:** [#79](https://github.com/quocthai912/Whistle-EPL/issues/79)

- [ ] T009 [US1] Deliver scoped season list/detail/edit/history and Closed-metadata rejection in backend/src/season-regulations/seasons.service.ts, backend/src/season-regulations/seasons.controller.ts, frontend/src/features/seasons/SeasonsPage.tsx, frontend/src/features/seasons/SeasonDetail.tsx, frontend/tests/phase-2-forms.spec.tsx and tests/e2e/phase-2-seasons.spec.ts. **Blocked by:** T008. **Trace:** FR-001, FR-003-FR-005, FR-039-FR-044; SC-001-SC-002, SC-005, SC-008-SC-009, SC-011. **Acceptance:** responsibility-filtered lists/details and immutable code; positive revision detects stale writes. Closed name/competition display/dates are read-only on server and screen until committed independent reopening, not a pending request. Show required errors/history, preserve valid input, reject closure/edit races using declared fixtures and retain other-season data. Provide Loading/Empty/Error and correct paging where applicable; actual lifecycle flows remain T023/T024. **Issue:** [#80](https://github.com/quocthai912/Whistle-EPL/issues/80)

## Phase 4: User Story 2 - Full regulation decisions (Priority: P1)

**Goal**: Prepare a full typed version and independently approve the exact submitted content.
**Independent test**: Draft incomplete/full content, submit/return/withdraw/succeed it, deny
all editors' approval and verify validity/freezes against isolated declared facts.

- [ ] T010 [US2] Deliver typed incomplete/full regulation drafting and validation in backend/src/season-regulations/regulation.dto.ts, backend/src/season-regulations/regulation-validation.ts, backend/src/season-regulations/regulations.controller.ts, backend/src/season-regulations/regulations.service.ts, frontend/src/features/regulations/RegulationForm.tsx and backend/tests/unit/phase-2-validation.spec.ts. **Blocked by:** T009. **Trace:** FR-006-FR-007, FR-009-FR-012, FR-016, FR-043; SC-001, SC-003, SC-011. **Acceptance:** nullable incomplete drafts versus full submission; enforce quoted constraints "Nonnegative counts", "Positive qualifying thresholds, ordered age bounds", "Explicit full valid calendar date at submission", "Even count 4..20, two legs", "Duration >0; buffers >=0", "win > draw > loss", "Q >=0, R >=0, R < N, Q+R <= N", "Q explicit; default R=3 only for N=20, otherwise explicit", "opensAt < closesAt", "positive contiguous positions" and exactly POINTS/GOAL_DIFFERENCE/GOALS_FOR once each. Goal/card "code <=32/name <=200", baseline A/B/C/D and YELLOW/RED meaning stay bounded; no formula/suspension additions. Validate every child field/group, non-overlapping same-group half-open windows, date-only versus UTC instants and unknown fields; test NFC/code-point lengths and source/test-default distinction without requiring windows inside season dates. **Issue:** [#81](https://github.com/quocthai912/Whistle-EPL/issues/81)

- [ ] T011 [US2] Deliver immutable regulation submission, return, withdrawal, rejection and successor editing in backend/src/season-regulations/regulations.service.ts, backend/src/season-regulations/regulations.controller.ts, frontend/src/features/regulations/RegulationVersionsPage.tsx, backend/tests/integration/phase-2-regulations.spec.ts and tests/e2e/phase-2-regulations.spec.ts. **Blocked by:** T010. **Trace:** FR-006-FR-009, FR-013, FR-039-FR-043; SC-001-SC-003, SC-005, SC-009, SC-011. **Acceptance:** exact allowed action/authority, "Content immutable after submission", "UNIQUE(caseId,versionNumber)", same-case predecessors and permanent preparer/editor inclusion. Returned/withdrawn content creates a successor; no approved PATCH, current-basis overwrite or self-removal from editor history. UI shows exact version and permitted history, and failed/stale/cross-season/audit-invalid commands preserve prior content. **Issue:** [#82](https://github.com/quocthai912/Whistle-EPL/issues/82)

- [ ] T012 [US2] Deliver independent regulation approval with immediate activation/future waiting in backend/src/season-regulations/regulation-decision.service.ts, backend/src/season-regulations/regulation-activation.service.ts, frontend/src/features/regulations/RegulationReview.tsx, backend/tests/integration/phase-2-regulations.spec.ts and tests/e2e/phase-2-regulations.spec.ts. **Blocked by:** T011. **Trace:** FR-004, FR-006, FR-008, FR-013-FR-018, FR-039-FR-043; SC-001-SC-005, SC-009, SC-011. **Acceptance:** independent assigned manager outside every editor set approves exact full submitted content, rechecking current basis, freezes, protected registration/future plans and referenced catalog meanings under ordered locks. Immediate activeFrom is successful recording; scheduled approval retains future instant and one waiting slot. Enforce immutable approved versions, current-version pointer/interval history and atomic receipt/audit; missing initial effective version keeps dependent use blocked. UI confirmation/cancel and negative port, self-approval, time, slot, validation and rollback cases all pass. No business job or later registration workflow is added here. **Issue:** [#83](https://github.com/quocthai912/Whistle-EPL/issues/83)

## Phase 5: User Story 3 - Timed regulations (Priority: P1)

**Goal**: Use correct effective rules through time boundaries, cancellation and recovery.
**Independent test**: Controlled-time immediate/future rules, due/cancel races, missed scan,
startup, incompatibility versus technical rollback and shared request/background processing.

- [ ] T013 [US3] Deliver every-minute/startup/request due resolution in backend/src/season-regulations/regulation-activation.service.ts, backend/src/season-regulations/regulation-jobs.service.ts, backend/src/season-regulations/regulations.service.ts, backend/src/app.module.ts and backend/tests/integration/phase-2-regulations.spec.ts. **Blocked by:** T012. **Trace:** FR-014-FR-015, FR-017-FR-018, FR-020-FR-023, FR-039-FR-042, FR-047; SC-003-SC-004, SC-009. **Acceptance:** admitted caller-owned processing preserves approved effectivity versus actual processing, rechecks frozen/current/future-plan facts and safely resolves reads without treating GET as a caller-selected activation command. Incompatibility is terminal ACTIVATION_BLOCKED with reason/slot release; technical/provider failure rolls back and blocks stale work. Deterministic job/request/restart/boundary races and independent committed-state checks prove one effect/history, no shifted clock, no revived blocked version and maintenance compliance. **Issue:** [#84](https://github.com/quocthai912/Whistle-EPL/issues/84)

- [ ] T014 [US3] Deliver independent pre-effectivity cancellation/atomic replacement through backend/src/season-regulations/regulation-change.service.ts, backend/src/season-regulations/regulation-changes.controller.ts, frontend/src/features/regulations/RegulationChangeReview.tsx, backend/tests/integration/phase-2-regulations.spec.ts and tests/e2e/phase-2-regulations.spec.ts. **Blocked by:** T013. **Trace:** FR-006, FR-013-FR-020, FR-039-FR-043; SC-001, SC-003-SC-005, SC-009, SC-011. **Acceptance:** exact same-season waiting target, required reason and immutable SUBMITTED replacement, independent approver outside the union of request/replacement editors, one-waiting-slot swap and atomic receipt/audit. Pending requests never postpone effectivity; at/after cutoff (including technical activation failure) reject the pre-effectivity route. Test changed basis, replacement-only editor, stale/duplicate/mid-failure requests, full prior-state preservation and explicit user confirmation/cancel. **Issue:** [#85](https://github.com/quocthai912/Whistle-EPL/issues/85)

- [ ] T015 [US3] Deliver safe operator retry and visible activation outcomes in backend/src/cli/process-due-regulations.ts, backend/src/season-regulations/regulation-jobs.service.ts, frontend/src/features/regulations/RegulationVersionsPage.tsx, backend/tests/integration/phase-2-regulations.spec.ts and docs/operations/regulation-activation.md. **Blocked by:** T014. **Trace:** FR-020-FR-023, FR-039, FR-041-FR-043, FR-047-FR-048; SC-003-SC-004, SC-009, SC-012. **Acceptance:** trusted server-operator invocation reuses owning service/admission without fake browser login or ability to approve/edit/time-shift regulations; bounded transactions differ from later scheduled retries. Record actual processing outcome and secret-free persistent-failure diagnostics under existing retention; UI never calls unresolved stale rules current. Unit/integration/CLI-negative and restart recovery checks prove no duplicate business history or operational fixture/time bypass. **Issue:** [#86](https://github.com/quocthai912/Whistle-EPL/issues/86)

## Phase 6: User Story 4 - Clubs and actual logos (Priority: P1)

**Goal**: Maintain shared club identity/current content with safe history and recovery.
**Independent test**: Real CRUD/correction/name-review and image upload/replace/remove,
failure/permission/fallback/current-delivery checks plus available-data restoration.

- [ ] T016 [US4] Deliver Club master create/search/edit/correction/history in backend/src/registry-registration/clubs.service.ts, backend/src/registry-registration/clubs.controller.ts, frontend/src/features/clubs/ClubsPage.tsx, frontend/src/app/router.tsx, backend/tests/integration/phase-2-masters.spec.ts and tests/e2e/phase-2-masters.spec.ts. **Blocked by:** T007. **Trace:** FR-001, FR-024-FR-026, FR-039-FR-044; SC-001-SC-002, SC-005, SC-009, SC-011. **Acceptance:** required code/name/abbreviation; preserve "code 1-32", "season/club/stadium names 1-200", "club abbreviation 1-20" and "reason/basis/notes <=2,000", normalized stable non-reusable codes and same-name acknowledgement/reason with changed-candidate review. No role-only write, merge, seasonal application or snapshot rewrite. Correction identifies permitted affected work; field/history/search/paging/error/rollback and cross-season reference checks pass. **Issue:** [#87](https://github.com/quocthai912/Whistle-EPL/issues/87)

- [ ] T017 [US4] Deliver real bounded logo upload/replace/remove and authorized bytes/fallback in backend/src/media/media.service.ts, backend/src/media/local-media.store.ts, backend/src/media/media.controller.ts, backend/src/registry-registration/clubs.controller.ts, frontend/src/features/clubs/ClubLogo.tsx, backend/tests/unit/media-validation.spec.ts, backend/tests/integration/phase-2-media.spec.ts and tests/e2e/phase-2-masters.spec.ts. **Blocked by:** T016. **Trace:** FR-030-FR-033, FR-039-FR-043, FR-045, FR-047; SC-001, SC-005, SC-007, SC-009, SC-011. **Acceptance:** static PNG/JPEG/WebP only, <=2,097,152 input/output bytes and <=2048 each dimension; full decode/frame/type validation, safe opaque normalized static WebP, no arbitrary paths/URLs. Matching shared grant/parent revision, admitted storage-before-reference/audit switch, same-owner pointer and failure preservation; protected local root/volume survive replacement. Current-scope/no-store delivery rejects old/non-current addresses; missing content uses alt-text/aspect-ratio fallback, no public scope inferred from provider absence. Test corruption/animation/type/size, unauthorized/stale access, storage/audit failures and FormData/session epochs with real persistence/content. Nonempty-media operational deployment still awaits T019. **Issue:** [#88](https://github.com/quocthai912/Whistle-EPL/issues/88)

- [ ] T018 [US4] Deliver daily safe asset/orphan cleanup in backend/src/media/media-cleanup.service.ts, backend/src/media/orphan-inventory.service.ts, backend/src/media/media.service.ts and backend/tests/integration/phase-2-media.spec.ts. **Blocked by:** T017. **Trace:** FR-032-FR-034, FR-041-FR-042, FR-047; SC-007, SC-009. **Acceptance:** eligible known assets wait >=24 hours after unreferencedAt; unknown orphan files wait >=24 hours after first observed unreferenced state, never upload age alone. Under admission/owning locks, recheck current/in-flight/retained-backup copies, retain metadata and mark contentDeletedAt only on successful deletion. Failures log/retry later without corrupting a completed replacement; current/cleanup/retention races and path/symlink refusal pass. No business history deletion or historical image browsing. **Issue:** [#89](https://github.com/quocthai912/Whistle-EPL/issues/89)

- [ ] T019 [US4] Complete nonempty-media coordinated backup/restore and protected deployment in ops/backup/backup.sh, ops/backup/restore.sh, ops/backup/verify-set.sh, ops/backup/verify-foundation.sh, ops/backup/set-format.py, backend/src/operations/maintenance.service.ts, ops/compose.yaml, .env.example, ops/backup/tests/test_set_format.py and docs/operations/media-recovery.md. **Blocked by:** T018. **Trace:** FR-030-FR-034, FR-041, FR-046-FR-048; SC-007, SC-009, SC-012. **Acceptance:** protected absolute local root/UID/mount and same-set v2 dump/inventory/content/checksums; reject missing/corrupt/path-escaped/incomplete/wrong-schema sets before destructive steps. Writer drain covers snapshot and restoration, partial recovery remains closed/resumable, verify real FK/current references/content and require fresh login before safe release. Preserve v1 validation only for matching legacy release, >=7 separate sets and 24-hour scheduling; no legacy media-complete mislabelling, cross-set content, database-only logo restore or claim of full-season <=30-minute BM-07. Run available-data/nonempty-file and interrupted recovery tests plus inherited operations regressions before permitting expanded-schema deployment. **Issue:** [#90](https://github.com/quocthai912/Whistle-EPL/issues/90)

## Phase 7: User Story 5 - Stadium masters (Priority: P1)

**Goal**: Manage reusable venues under Scheduling ownership without moving matches.
**Independent test**: Shared-authority CRUD/search, duplicate review, referenced correction
and before/after history with no scheduling side effect.

- [ ] T020 [US5] Deliver Stadium create/search/edit/correction/history in backend/src/scheduling/stadiums.service.ts, backend/src/scheduling/stadiums.controller.ts, frontend/src/features/stadiums/StadiumsPage.tsx, frontend/src/app/router.tsx, backend/tests/integration/phase-2-masters.spec.ts and tests/e2e/phase-2-masters.spec.ts. **Blocked by:** T007. **Trace:** FR-001, FR-024-FR-026, FR-039-FR-044; SC-001-SC-002, SC-005, SC-009, SC-011. **Acceptance:** Scheduling owns UC12; require code/name, permit optional location, enforce "code 1-32", "season/club/stadium names 1-200", "stadium location <=500" and "reason/basis/notes <=2,000". No capacity requirement, same-name merge, role-only write or silent relocation/postponement. Corresponding shared grant, normalized code/duplicate review, permitted impacts/history, deterministic >20 pagination, field/error/cancel and reference/audit rollback tests pass. No UC13/UC14 workflow is implemented. **Issue:** [#91](https://github.com/quocthai912/Whistle-EPL/issues/91)

## Phase 8: User Story 6 - D099 availability (Priority: P2)

**Goal**: Discontinue/resume the same Club/Stadium identity without changing approved work.
**Independent test**: New/pending use blocked while discontinued, approved references kept,
every reasoned cycle traceable and no rejected work/permissions revived after resumption.

- [ ] T021 [US6] Deliver Club D099 availability commands/history/UI and new-use guard in backend/src/registry-registration/clubs.service.ts, backend/src/registry-registration/clubs.controller.ts, frontend/src/features/clubs/ClubAvailability.tsx, backend/tests/integration/phase-2-club-availability.spec.ts, frontend/tests/club-availability.spec.tsx and tests/e2e/phase-2-club-availability.spec.ts. **Blocked by:** T016. **Trace:** FR-027-FR-029, FR-039-FR-044, FR-047; SC-001-SC-002, SC-005-SC-006, SC-009, SC-011. **Acceptance:** discontinuedAt is nullable current marker; discontinue records trusted successful instant, resume clears marker without changing identity/code. Nonempty reason <=2,000, matching shared grant/revision and audit retain every cycle. Final Club lock rejects new/pending commitments while preserving approved/history/correction UC gates; resume never restores old outcomes/roles. Barrier-based concurrent new-use/authority/audit-failure tests and real UI confirmation/search/history pass, using labelled later-port fixtures rather than implementing registrations. **Issue:** [#92](https://github.com/quocthai912/Whistle-EPL/issues/92)

- [ ] T022 [P] [US6] Deliver Stadium D099 commands/history/UI and new-use guard in backend/src/scheduling/stadiums.service.ts, backend/src/scheduling/stadiums.controller.ts, frontend/src/features/stadiums/StadiumAvailability.tsx, backend/tests/integration/phase-2-stadium-availability.spec.ts, frontend/tests/stadium-availability.spec.tsx and tests/e2e/phase-2-stadium-availability.spec.ts. **Blocked by:** T020. **Trace:** FR-027-FR-029, FR-039-FR-044, FR-047; SC-001-SC-002, SC-005-SC-006, SC-009, SC-011. **Acceptance:** enforce the same nullable-marker/nonempty <=2,000 reason, recording-time/revision/shared-grant/audit and same-identity cycle constraints under Stadium locks. Pending new use fails after discontinuation, approved venue references/history remain, no automatic UC14 postponement/relocation or resumption of rejected work. Pass isolated race/failure/UI tests in these disjoint files; do not edit shared test/router/audit registries concurrently with T021. **Issue:** [#93](https://github.com/quocthai912/Whistle-EPL/issues/93)

## Phase 9: User Story 7 - Season lifecycle (Priority: P2)

**Goal**: Propose/independently approve close/reopen against exact current readiness.
**Independent test**: Actual commands on persisted typed summary fixture, every blocker,
changed basis, independent approval, metadata-state race, reopen and retained freeze/roles.

- [ ] T023 [US7] Deliver lifecycle request preparation/submission and exact readiness review in backend/src/season-regulations/season-lifecycle.service.ts, backend/src/season-regulations/season-lifecycle.controller.ts, frontend/src/features/seasons/SeasonLifecycleReview.tsx, backend/tests/integration/phase-2-seasons.spec.ts and tests/e2e/phase-2-seasons.spec.ts. **Blocked by:** T015. **Trace:** FR-005, FR-035-FR-038, FR-039-FR-043; SC-001, SC-005, SC-008-SC-009, SC-011. **Acceptance:** typed CLOSE/REOPEN action, nonempty reason <=2,000, exact version/editor history and no generic status PATCH. CLOSE submission server-binds actual same-season current confirmed summaryVersionId and immutable source basis; missing summary/readiness blocks submission without fake data, while draft preparation remains possible. Show current blockers/confirmation, preserve pending state and reject wrong-season/FK/unauthorized/stale/audit-failed requests. No summary preparation/confirmation UI/API is introduced. **Issue:** [#94](https://github.com/quocthai912/Whistle-EPL/issues/94)

- [ ] T024 [US7] Deliver independently approved close/reopen and final Closed gates in backend/src/season-regulations/season-lifecycle.service.ts, backend/src/season-regulations/seasons.service.ts, frontend/src/features/seasons/SeasonLifecycleReview.tsx, backend/tests/integration/phase-2-seasons.spec.ts and tests/e2e/phase-2-seasons.spec.ts. **Blocked by:** T023. **Trace:** FR-003-FR-005, FR-014, FR-035-FR-043, FR-047; SC-001-SC-005, SC-008-SC-009, SC-011. **Acceptance:** nondelegable manager outside every preparer/editor set approves exact submitted version; compare unchanged current summary/basis or return BASIS_CHANGED, no other pending requests/waiting effects/unended or unresolved future intervals. CLOSE/audit/receipt commit atomically; no registration cancellation, role removal/logout or automatic dates-based closure. REOPEN preserves all frozen settings and unchanged valid summary; pending reopen cannot edit metadata, reclosing rechecks prerequisites. Use actual typed fixture rows/independent PostgreSQL observers and labelled later-port simulations; production missing readiness remains blocked. **Issue:** [#95](https://github.com/quocthai912/Whistle-EPL/issues/95)

## Phase 10: Polish, integration and acceptance evidence

**Purpose**: Integrate all mandatory slices, run deep/current regressions and produce actual
reviewable evidence. These verification Tasks do not add features or replace story tests.

- [ ] T025 Execute cross-story authority/receipt/audit/atomicity integration in backend/tests/integration/phase-2-security.spec.ts, backend/tests/integration/transaction-foundation.spec.ts and docs/verification/phase-2/security-consistency.md. **Blocked by:** T009, T014, T019, T020, T021, T022, T024. **Trace:** FR-001, FR-006, FR-039-FR-042, FR-046-FR-048; SC-002-SC-006, SC-008-SC-009, SC-012. **Acceptance:** >=10 UI/direct-request unauthorized cases cover create/season/shared/delegation/media/history boundaries, CSRF/origin/expired/revoked access, exact-version/union-editor checks, replay before stale checks, unknown outcome and expiry guards. New search/form endpoints must also reject unsupported input and process SQL-injection/dangerous-content probes without unintended execution or unauthorized change, preserving valid literal text and safe queries. Deterministic barriers plus independent committed-state inspection prove no partial state or hidden overwrite after induced failures; retain existing account/grant/delegation/auth/audit regressions and redacted evidence. **Issue:** [#96](https://github.com/quocthai912/Whistle-EPL/issues/96)

- [ ] T026 Execute all real browser journeys and responsive/error behavior through playwright.config.ts, tests/e2e/global-setup.ts, tests/e2e/phase-2-seasons.spec.ts, tests/e2e/phase-2-regulations.spec.ts, tests/e2e/phase-2-masters.spec.ts and docs/verification/phase-2/browser.md. **Blocked by:** T025. **Trace:** FR-043-FR-048; SC-001, SC-005, SC-007, SC-011-SC-012. **Acceptance:** actual recorded Chrome/Edge, Vietnamese text/diacritics, three approved viewports 360x800/768x1024/1366x768, unobscured controls/table scroll, >20 paging/totals without omissions/duplicates, confirmations/cancel/retained input, Loading/Empty/Error/retry and session/conflict feedback. Register and run both availability E2E files plus all inherited files; fixture reset preserves required fields/isolation and captures no credentials/password DOM. Mocked network-only journeys do not count. **Issue:** [#97](https://github.com/quocthai912/Whistle-EPL/issues/97)

- [ ] T027 Implement and measure the isolated club lookup workload in tests/performance/phase-2-club-lookup.js and docs/verification/phase-2/lookup.md. **Blocked by:** T019, T020, T021, T022. **Trace:** FR-044-FR-048; SC-010-SC-012. **Acceptance:** real scoped data with one-season/20-club baseline and enough additional declared list records to exercise pagination; 20 concurrent users, one-minute warm-up, 10 minutes measured, >=95% within 2 seconds per lookup group under recorded D097 4-vCPU/8-GiB/SSD baseline/deviation. Preserve authentication.js regression, stable counts/search/diacritics and protected credentials; no new write/generation SLA or claim of later 10-season/3,800-match evidence. **Issue:** [#98](https://github.com/quocthai912/Whistle-EPL/issues/98)

- [ ] T028 Execute integrated available-data/media recovery and lifecycle-preservation drills in ops/backup/verify-foundation.sh, ops/backup/tests/test_set_format.py, backend/tests/integration/phase-2-media.spec.ts and docs/verification/phase-2/recovery.md. **Blocked by:** T019, T021, T022, T024. **Trace:** FR-027-FR-029, FR-030-FR-038, FR-041-FR-042, FR-046-FR-048; SC-002, SC-006-SC-009, SC-012. **Acceptance:** declared 20-club authorized assets, two seasons and every current reference/audit/availability cycle survive same-set DB/content restore; backup/upload/cleanup/retention and interrupted-restore races stay closed until verified release/fresh login. Reject incomplete/missing/corrupt/wrong-schema/traversal sets and preserve v1 matching-only behavior. Confirm actual available-data backup scheduling/retention controls without claiming full integrated BM-07 or later workflows passed. **Issue:** [#99](https://github.com/quocthai912/Whistle-EPL/issues/99)

- [ ] T029 Run mandatory fast/deep and inherited full regression entry points using package.json, .github/workflows/ci.yml, backend/tests/, frontend/tests/, tests/e2e/, ops/backup/tests/ and docs/verification/phase-2/regression.md. **Blocked by:** T026, T027, T028. **Trace:** FR-045-FR-048; SC-001, SC-011-SC-012. **Acceptance:** existing pnpm lockfile/native/client/schema/migration/lint/typecheck/source-format/build/unit/PostgreSQL checks run with required Ubuntu/Windows coverage; deep Chrome/Edge/load/recovery results are separately identified. Preserve pinned stack/required checks and verify new suite discovery; change CI only if necessary to run already required commands, not to weaken them. Record actual outputs/versions and failures; no broad rerun beyond unresolved concerns and no fabricated evidence. **Issue:** [#100](https://github.com/quocthai912/Whistle-EPL/issues/100)

- [ ] T030 Assemble handover and reviewer acceptance assessment in docs/verification/phase-2/acceptance.md, docs/operations/regulation-activation.md, docs/operations/media-recovery.md and specs/002-phase-2-season-regulations/quickstart.md. **Blocked by:** T029. **Trace:** FR-046-FR-048; SC-001-SC-012. **Acceptance:** map all FR/SC and seven stories to actual revision/environment/assets/fixtures/commands/results/defects and the accountable reviewer; reconcile executable guides and recovery/schema prerequisites without duplicating Context policy. Keep later operational/integrated evidence and actual missing inputs open. Request/record human Phase acceptance separately; completed docs, green CI or closed Issues alone never establish COMPLETED. Update owning Phase ledger only when actual criterion evidence/reviewer approval exists, preserving historical approvals and later Phases. **Issue:** [#101](https://github.com/quocthai912/Whistle-EPL/issues/101)

## Dependencies and execution order

| Gate/story | Blocking frontier | Completion signal |
|---|---|---|
| Setup | T001 | Actual baseline/input classification, not a runtime default. |
| Foundation | T002 -> T003 -> T004 -> {T005,T006} -> T007 | Typed integrity and shared guards/transport/audit verified. |
| US1 | T007 -> T008 -> T009 | Creation-only and scoped Open/Closed metadata behavior. |
| US2 | T009 -> T010 -> T011 -> T012 | Full exact submitted rules independently approved. |
| US3 | T012 -> T013 -> T014 -> T015 | Timed/cancel/replace/recovery and honest current basis. |
| US4 | T007 -> T016 -> T017 -> T018 -> T019 | Real Club/logo plus safe nonempty recovery. |
| US5 | T007 -> T020 | Stadium master UC12, no schedule changes. |
| US6 | T016 -> T021; T020 -> T022 | Both D099 owner-specific cycles/guards pass. |
| US7 | T015 -> T023 -> T024 | Exact-summary lifecycle checks and independent transitions. |
| Final verification | Explicit T025-T030 blockers above | Actual integrated evidence/reviewer, not automatic completion. |

All IDs in a blocked-by clause precede the dependent Task; no forward dependency or implicit
permission to skip the foundational gate. Stories listed later may proceed once genuine
blockers finish, subject to shared-file serialization. US1 after T009 is the minimum useful
demo, not permission to declare PHASE 2 finished or deploy before recovery is safe.

### Parallel examples per story

| Area | Safe opportunity after prerequisites | Serialization rule |
|---|---|---|
| Foundation | T005 and T006 after T004 | Different port/fixture versus session/client files; T007 integrates after both. |
| US1 | Within T008/T009, feature UI and backend test scaffolding can be prepared separately | T008 before T009; one owner coordinates shared season service/router/tests. |
| US2 | Within a slice, typed form components and validator tests can progress independently | T010 -> T011 -> T012; same service/state history is not parallel-edited. |
| US3 | Operator guide/scenario preparation can accompany service work | T013 -> T014 -> T015; activation/change integration and shared tests serialize. |
| US4 | Isolated media-buffer cases can accompany Club UI preparation | T016 -> T017 -> T018 -> T019; current reference/cleanup/recovery changes integrate in order. |
| US5 | Stadium-specific files can be prepared alongside completed-foundation feature work | Root router/shared fixture/test edits are serialized with Club/Season tasks. |
| US6 | T021 and T022 after their owning master prerequisites | Explicit disjoint per-owner source/tests; no simultaneous shared registry edits. |
| US7 | Review UI and typed readiness negative-case preparation may progress separately | T023 -> T024; exact submitted summary/approval semantics integrated together. |

These examples do not dispatch agents or make a dependency optional. Avoid concurrent runs
that reset the same test database or share mutable media/backup roots.

## Implementation strategy and publication gate

1. After final Task approval and exactly one linked Issue per Task, establish foundation and
   deliver US1 as the smallest demonstrable workflow, retaining security/atomicity tests.
2. Deliver US2/US3 and the independent Club/Stadium branches along their true dependencies;
   keep expanded-schema/media deployment blocked until T019 and integrated T028 pass.
3. Complete both D099 owners and lifecycle with isolated typed prerequisite evidence. Never
   implement later applications/schedules/results/reports or import production test adapters.
4. Execute T025-T030 and record real outcomes before any criterion/status update. Test assets,
   parameters, environment and measurements are evidence, not new operational defaults.
5. Cross-artifact analysis and explicit final approval of this exact Task set are recorded
   above. Follow docs/agents/issue-tracker.md and to-tickets, searching existing Issues by the
   feature path plus Task ID, reusing matches and publishing blockers in dependency order.
   Record Issue links against the corresponding Task without changing IDs/dependencies or
   inventing issue numbers. A Task's Issue link is pending until actual publication succeeds.

No GitHub Issue, application code, commit/push/PR or Phase acceptance is performed by this file.
