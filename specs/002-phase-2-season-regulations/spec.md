<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:cd1fe2e228bee4f52514b07204b8d425fccdc58b2076b24dc89b0f292915e18b -->

# Feature Specification: PHASE 2 - Seasons, Catalogs, and Regulations

**Feature Branch**: `docs/phase-2-architecture-and-specification`

**Created**: 2026-11-10 (Asia/Bangkok)

**Status**: Approved by the Team Leader on 2026-11-10 (Asia/Bangkok)

**Approval evidence**: After the completed clarification and 16/16 requirements-quality
checklist were presented, the Team Leader explicitly answered "Tôi đồng ý phê duyệt." to
approval of this Specification for speckit-plan. Plan review and final Task approval remain
separate gates; no implementation or publication is authorized by this approval.

**Input**: Prepare approved PHASE 2 through Specification, clarification, reviewed Plan,
approved Tasks and cross-artifact analysis; create one Issue per finally approved Task.
No application implementation, commit, push or PR is authorized.

**Baseline**: Repository `e7490c580316fec1039da8e12176abcc9537800e`; Constitution v1.0.0;
Context v2 through Q98 and separately approved D098/D099. The existing branch is reused.

## Context and Scope

PHASE 2 delivers UC05/UC06/UC07/UC12: internal season management, seasonal regulation
preparation/approval/effectivity and goal/card catalogs, shared Club/Stadium masters,
club logos, and D099 discontinuation/resumption. It supplies validated configuration to
later Phases without implementing their business workflows.

The [Phase ledger](../../context/progress-checker.md#phase-2---seasons-catalogs-and-regulations)
owns scope/evidence and the [decision index](../../context/design/README.md#confirmed-decisions)
routes current policy owners. This Specification translates approved policy into observable
outcomes rather than creating another Context Package. Documentation is English; product
interactions are Vietnamese.

### Actors and authority boundaries

- **Create Season permission holder**: creates without a prior seasonal role; creation confers
  neither roles nor seasonal management/internal viewing.
- **Season Manager**: manages assigned seasons and prepares regulations. Independent assigned
  managers who did not prepare/edit the submitted content approve regulations/lifecycle.
- **Delegated officer**: prepares/edits regulations only within the D019 action, eligible role,
  season and valid delegation; no delegated regulation/lifecycle approval is introduced.
- **Shared Club/Stadium manager**: holds the corresponding separately granted permission;
  seasonal roles or administrator status alone do not authorize master/media/D099 actions.
- **Authorized internal reader**: sees only permitted responsibility-scoped information.
  Public Viewer rights do not include administration, drafts, internal reasons or history.
- **Operator/background execution**: processes approved due work/recovery under existing
  operational controls, not a new business role or approval bypass.

### Out of scope

No PHASE 3 player profiles/portraits, participation, eligibility confirmation or transfers;
no PHASE 4 fixture generation/publication/adjustment/postponement; no PHASE 5 reports/results/
statistics; no PHASE 6 public lookup/dashboard; no PHASE 7 summary preparation/confirmation;
no PHASE 8 news; no PHASE 9 XLSX exchange; no football-data API research/integration or Live Score.

Configuration consumed by those workflows and checks of their existing prerequisite facts
are in scope. Building their workflows to manufacture PHASE 2 readiness is not. No new
permission model, format unlock, rules engine, editable nationality/position catalog,
automatic merge, sporting formula or production approval seed is introduced.

## Clarifications

### Session 2026-11-10

- Q: While a season is Closed, may its assigned manager edit its name, competition display information and start/end dates? → A: Option A, explicitly selected by the Team Leader ("Tôi chọn A."). Metadata is read-only while Closed; editing requires successful independently approved reopening first. Existing authority, validation, history and frozen milestones still apply after reopening. [Current D074 owner](../../context/use-cases/registration.md#d074---independently-approved-season-closure-and-reopening) and [approval evidence](../../docs/adr/0010-immutable-approved-season-regulation-versions.md#phase-2-specification-clarification---closed-season-metadata).

## User Scenarios & Testing *(mandatory)*

All seven stories are mandatory. Priorities express delivery order, not optional scope.
Independent tests may use PHASE 1 and approved isolated fixtures for other stories/later facts;
fixtures do not prove omitted operational workflows passed.

### User Story 1 - Create and Manage a Season Shell (Priority: P1)

As authorized staff, I can create and manage a distinct season without acquiring implicit roles.

**Why this priority**: Seasonal work needs explicit identity, staffing and configuration.

**Independent Test**: Grant creation through existing administration, create a season, verify
no implicit access, separately assign managers, then test lookup/update and rejection paths.

**Acceptance Scenarios**:

1. **Given** creation permission without a prior seasonal role, **When** complete unique season
   data is saved, **Then** the season is Open without effective rules or automatically assigned
   roles; acknowledgement grants no internal seasonal viewing.
2. **Given** only a seasonal role/administrator status, **When** creation is attempted, **Then**
   it fails without creating a season or roles.
3. **Given** an assigned manager, **When** permitted metadata changes succeed, **Then** history
   is recorded and other seasons remain unchanged; invalid fields/dates, duplicate normalized
   codes and stale writes preserve the prior state.
4. **Given** no effective approved regulations, **When** dependent work is checked, **Then**
   staffing/regulation/draft preparation is possible but regulation-dependent receipt,
   confirmation, scheduling and result work is blocked.
5. **Given** a Closed season and an otherwise authorized manager, **When** its name,
   competition display information or start/end dates are edited through the screen or a
   direct request, **Then** the change is rejected and saved metadata remains unchanged.
   A pending reopening request does not permit editing; after successful independent
   reopening, ordinary authority, revision, validation and history checks apply.

### User Story 2 - Prepare and Independently Approve Regulations (Priority: P1)

As a manager or delegated preparer, I prepare full rules for another manager's exact-content review.

**Why this priority**: Later decisions need approved rules rather than implicit defaults.

**Independent Test**: In an Open season, draft, submit, return/withdraw, revise and approve
initial/successor versions; compare content, editor membership, history and protected facts.

**Acceptance Scenarios**:

1. **Given** incomplete draft content, **When** saved, **Then** it stays editable/inactive;
   submission/approval identifies missing or invalid required content.
2. **Given** submitted content, **When** its preparer or any previous editor approves, **Then**
   approval fails regardless of multiple roles; an independent assigned manager may approve
   only the exact valid reviewed version and its content becomes immutable.
3. **Given** return/withdrawal, **When** content is revised, **Then** successor/predecessor and
   editor history remain intact without editing old submissions or effective content.
4. **Given** invalid points/windows/cutoff/age/Q/R/structure or conflicts with protected
   registration/frozen milestones, **When** approval is attempted, **Then** actionable errors
   identify the conditions and neither rules nor protected records are partially changed.

### User Story 3 - Apply, Cancel and Replace Regulations on Time (Priority: P1)

As a manager, I distinguish future/effective rules and use independent cancellation/replacement
before the deadline, with correct operation after processing delays.

**Why this priority**: Valid rules must also apply at the right time.

**Independent Test**: Use controlled time to test immediate/future activation, exact boundaries,
replacement/cancellation, catch-up, incompatibility, technical failure and concurrent processing.

**Acceptance Scenarios**:

1. **Given** immediate/future effectivity, **When** approved, **Then** effectivity starts on
   successful approval recording or the reviewed future instant respectively; pending content
   does not replace the current basis early.
2. **Given** a waiting future version, **When** another ordinary approval is attempted, **Then**
   it fails; independent replacement swaps the complete pair or leaves the original unchanged.
3. **Given** pending cancellation/replacement, **When** the target becomes due, **Then** the
   request does not delay effectivity or extend cancellation; passed proposed times require
   revision/resubmission rather than silent immediate approval.
4. **Given** delayed processing/restart, **When** due work or dependent operations execute,
   **Then** they resolve the correct basis or explicitly fail, never commit using stale rules
   or shift the approved effective instant. A GET that needs a current basis reads persisted
   state only. If a bounded recheck cannot establish the correct basis, it returns an explicit
   temporary failure without activating a version or recording a business outcome.
5. **Given** business incompatibility, **When** activation is checked, **Then** terminal
   Activation blocked records reasons, retains the prior effective version if any and frees
   the waiting slot; resolving it requires a new proposal.
6. **Given** technical failure, **When** rolled back, **Then** no false success/business-block
   is recorded; recovery retries cannot duplicate successful effects/history.

### User Story 4 - Manage Club Masters and Logos (Priority: P1)

As a shared Club manager, I maintain identities and real logos with duplicate review and history.

**Why this priority**: Clubs/media are required masters, distinct from seasonal participation.

**Independent Test**: Create/search/correct clubs; upload/replace/remove logos and verify
permissions, validation, fallback, failure preservation, concurrency and restoration.

**Acceptance Scenarios**:

1. **Given** shared authority, **When** required data is saved, **Then** stable identity/code
   can be referenced across seasons without creating participation.
2. **Given** a same-name warning, **When** staff confirms a distinct club with reason, **Then**
   identities stay separate; duplicate codes always fail and no automatic merge occurs.
3. **Given** referenced data, **When** corrected with reason/basis, **Then** before/after and
   affected-record review information persist while official snapshots/decisions await their
   own correction workflow.
4. **Given** valid static image content, **When** upload/replacement succeeds, **Then** the real
   logo renders with preserved aspect ratio/club-name alternative text; invalid content or
   failed storage/reference/audit changes preserve the previous logo.
5. **Given** absence/removal/unavailability, **When** displayed, **Then** fallback works without
   blocking non-media business. Current-logo changes affect old-season consumers but do not
   overwrite historical descriptive snapshots.

### User Story 5 - Manage Stadium Masters (Priority: P1)

As a shared Stadium manager, I maintain venues without damaging schedules or moving matches.

**Why this priority**: Scheduling needs reusable venue identities and intact references.

**Independent Test**: Create/find same-name/distinct stadiums and correct referenced data,
comparing history and schedule references before/after.

**Acceptance Scenarios**:

1. **Given** shared authority, **When** unique code/name and optional location are saved,
   **Then** the venue is available without an invented mandatory capacity field.
2. **Given** a same-name warning, **When** a distinct venue is confirmed with reason, **Then**
   identities remain separate; duplicate normalized codes fail.
3. **Given** approved schedule references, **When** master data is corrected, **Then** history
   and references survive, affected work is identified and no match moves/becomes postponed.

### User Story 6 - Discontinue and Resume Club/Stadium Use (Priority: P2)

As the shared manager, I stop new use and later resume the same identity, preserving commitments.

**Why this priority**: D099 defines safe availability changes without destructive deletion.

**Independent Test**: Prepare approved references/draft selections, discontinue, verify new-use
rejection and approved-commitment preservation, resume and compare every identity/history cycle.

**Acceptance Scenarios**:

1. **Given** authority/reason, **When** discontinuation succeeds, **Then** new use is blocked
   from recording time while approved commitments/history remain processable under UC checks.
2. **Given** an earlier draft/pending selection, **When** it establishes a new commitment after
   discontinuation, **Then** current availability is checked and progression fails without
   automatically cancelling approved records.
3. **Given** discontinued status, **When** authorized resumption with reason succeeds, **Then**
   the same identity/code is available for new validated work; rejected/cancelled work, drafts
   and permissions do not automatically revive or gain approval.
4. **Given** repeated cycles, stale edits, revoked rights or recording failure, **When** a
   transition executes, **Then** successful cycles remain traceable and failures preserve state.

### User Story 7 - Independently Close and Reopen a Season (Priority: P2)

As a manager, I propose lifecycle changes for independent approval against current prerequisites.

**Why this priority**: UC05 owns lifecycle even when later Phases supply readiness facts.

**Independent Test**: Use isolated valid-summary/resolved-request/ended-interval fixtures,
execute real proposal/approval, negative readiness, concurrent changes, reopen and reclose.
Do not build later workflows or fabricate operational readiness.

**Acceptance Scenarios**:

1. **Given** a pending lifecycle proposal, **When** its preparer/editor approves, **Then** it
   fails; pending work and the scheduled end date change no state.
2. **Given** an absent/stale summary, other pending seasonal work, waiting approved effects,
   an unresolved future plan or a playing interval with no end or an end after the closing
   instant, **When** closure is approved, **Then** it fails with blockers. A finite end
   before or exactly at that instant satisfies the interval condition. Recheck after any wait
   for competing writes and decide using the facts at final recording.
3. **Given** all prerequisites still hold, **When** an independent manager approves, **Then**
   closure/history record together without cancelling registrations, revoking roles, logging
   everyone out or invalidating an unchanged confirmed summary.
4. **Given** Closed state, **When** official seasonal work is attempted, **Then** D074 gates
   hold while authorized reading and separate master/media management remain possible.
5. **Given** independent reopening, **When** work resumes, **Then** owning UC rules/freezes
   remain; reclosing checks every prerequisite again.

### Edge Cases

- Normalized duplicate codes/leading zeros, accents/combining characters, identical names for
  distinct masters, unknown inputs, overlength text and invalid dates.
- Concurrent creation/edit/approval, stale versions, authority revoked during waits, repeated
  commands and failures to record required audit.
- Due-time races between cancel/replace/activate/read; initial activation failing without fallback;
  new freeze milestones or registration plans established between approval and effectivity.
- Intake overlap across different groups versus prohibited within-group overlap; missing
  operational values and calendar edits purporting to legitimize old receipts.
- Used goal/card types in draft reports and withdrawal without historical reinterpretation.
- Fake image types/extensions, corrupt decode/animation, excessive size/dimensions, storage
  outage, lost responses, replacement races and unauthorized/stale image addresses.
- Cleanup racing an upload/backup, failed deletion and retained backups needing old content.
- New-use/discontinuation races, repeated resumption and previously rejected drafts, historical
  corrections retaining discontinued identities.
- Closure racing summary changes/pending work, open/future intervals, reopening an unchanged summary.
- Metadata edits racing closure/reopening: the final write decision must enforce the current
  season state, rather than the state when the editing screen was opened.

## Requirements *(mandatory)*

### Functional Requirements

**Season identity and access - US1, US7**

- **FR-001**: The system MUST enforce separate creation permission, target-season management
  responsibility and shared Club/Stadium grants. Administrator status MUST not imply these rights.
- **FR-002**: Creation MUST accept approved code/name/start/end dates/competition display data,
  reject incomplete/invalid input and duplicate normalized codes, and create Open state without
  effective rules or implicit roles/access. Acknowledgement MUST disclose no unrelated internals.
- **FR-003**: Lookup/update MUST preserve identity/code and season separation, enforce
  startDate <= endDate, record changes and reject stale/history-breaking edits. Dates MUST not
  automatically close seasons, expire roles, establish match progress or unlock frozen settings.
- **FR-004**: Without effective initial full regulations, staffing/draft preparation MUST remain
  possible but regulation-dependent receipt/confirmation/schedule/result work MUST be blocked.
  Templates/other seasons MUST not silently become official rules.
- **FR-005**: While Closed, season name, competition display information and start/end dates
  MUST be read-only; server-side metadata changes MUST be rejected even for an otherwise
  authorized manager. Editing MUST require successful independently approved reopening,
  not merely a pending request. After reopening, existing authority, revision, validation,
  history and frozen milestones MUST still apply, with state rechecked at final recording.

**Regulation preparation and approval - US2**

- **FR-006**: The system MUST permit drafting/editing only within assigned-manager or D019
  delegated-preparer authority and restrict approval/cancellation/replacement of approved
  regulations to independent assigned managers, excluding every preparer/editor, including former editors.
- **FR-007**: Versions MUST represent full seasonal configuration, distinct from technical edit
  revisions. Incomplete drafts MAY persist; submission/approval MUST identify missing/invalid content.
- **FR-008**: Submission/withdrawal/return/rejection MUST preserve submitted content and the
  current effective version. Revisions after return/withdrawal MUST retain successor/predecessor/
  editor history. Independent approval MUST target the exact reviewed version and current basis.
  The current version remains in effect until a valid transition under FR-017–FR-023. A valid
  immediate approval makes the successor effective at successful recording and preserves the
  former version, its content and its historical effective interval.
- **FR-009**: Full content MUST include squad/non-homegrown limits, homegrown seasons/months/age
  range, U21 cutoff, separate intake calendars, supported count/format/legs, duration/buffers,
  goal/card types, points/ranking priority and Q/R under their approved owners. Missing real
  seasonal inputs MUST not be inferred.
- **FR-010**: Intake groups MUST permit multiple explicit half-open [open, close) windows with
  opening before closing and no within-group overlap. Cutoffs MUST retain date-only meaning;
  instants MUST follow D024 Asia/Ho_Chi_Minh input/display. Backdating/calendar rewrites MUST
  not legitimize earlier receipts.
- **FR-011**: Supported structure MUST be double round-robin, even N=4-20, two legs, default 20;
  unsupported count/format/legs MUST be reported without enabling invalid schedules. Duration
  MUST be positive, buffers nonnegative, with no silent operational defaults.
- **FR-012**: Points MUST satisfy win > draw > loss; ranking configuration MUST retain approved
  semantics. Q/R MUST be nonnegative integers, R < N, Q + R <= N; Q MUST be explicit (0 disables
  qualification). R defaults to 3 only for N=20, otherwise explicit. Test Q=4 is not an operational default.
- **FR-013**: Approved content MUST be immutable, retaining previous versions, actors/instants
  and exact historical bases. Changes MUST require a new full proposal and independent approval.
- **FR-014**: Initial schedule approval MUST freeze count/format/legs and duration/buffers for
  later approval/activation. First Official Result MUST freeze points/ranking priority/Q/R.
  Reopening MUST not unlock either milestone.
- **FR-015**: Approval/effectivity MUST check compatibility with protected approved registrations/
  lists and confirmed future plans under D052/D075. Incompatible changes MUST fail without
  removing players or rewriting decisions; pending work MUST use effective decision-time rules
  while historical decision bases remain preserved.
- **FR-016**: Goal/card changes MUST follow versioning/approval. Used codes/meanings, including
  draft-report use, MUST be protected from deletion/reinterpretation/reuse. New meanings require
  new types; withdrawal MUST preserve history. Source A/B/C/D and approved own-goal/yellow/red
  semantics remain the baseline, without new sporting formulas or suspension rules.

**Effectivity and recovery - US3**

- **FR-017**: Immediate effectivity MUST begin on successful approval recording; future content
  MUST preserve its reviewed instant without replacing the current basis early. Backdating/passed
  proposed times MUST fail and require resubmission rather than silent immediate effectivity.
- **FR-018**: At most one approved future version MAY wait per season; it MUST block another
  ordinary approval, even immediate. Atomic replacement is the explicit exception; further
  proposals MUST be revalidated against the current basis.
- **FR-019**: Before effectivity, one manager MUST propose cancellation with reason and another
  independently approve. Replacement MUST cancel/approve together or preserve the whole prior
  state. Pending requests MUST not postpone effectivity or extend cancellation, even during failure.
- **FR-020**: Activation MUST recheck compatibility/freezes. Business incompatibility MUST become
  terminal Activation blocked with reason, retain former effective rules if any and free the
  waiting slot. No silent time/content change or reactivation is permitted; a new proposal is required.
- **FR-021**: Due work MUST be discovered every minute during operation and at startup. Approved
  effectivity/actual processing time MUST remain distinct; catch-up MUST not shift effectivity
  or rewrite historical decisions.
- **FR-022**: PHASE 2 operations relying on current rules MUST resolve due activation consistently;
  writes MUST not use stale rules and reads MUST return the correct basis or explicit failure.
  Reads MUST NOT invoke due processing or write activation, activation-blocked outcomes or
  related business history. Later owners MUST have the same protection available without
  building their workflows here.
- **FR-023**: Technical failure MUST roll back without false activation/business-blocking; later
  scheduled/authorized operator recovery MUST remain possible and persistent failure visible.
  Concurrent/repeated processing MUST not duplicate successful effects/history.

**Shared masters and D099 - US4, US5, US6**

- **FR-024**: Club MUST require code/name/abbreviation; Stadium MUST require code/name and permit
  optional location. Masters MUST remain distinct from seasonal coach/representative/home-ground/
  participation and MUST not create registrations.
- **FR-025**: Inputs MUST apply D092 normalization/limits and stable non-reusable codes. Equivalent
  codes MUST conflict; same normalized master names MUST trigger review, permitting distinct
  entities after acknowledgement/reason without merging or adding name uniqueness.
- **FR-026**: Corrections MUST require reason/basis and retain before/after/operator/time plus
  affected-record review identification. References/snapshots MUST survive until owning correction
  workflows change them; destructive relationship-breaking edits/deletion MUST fail.
- **FR-027**: Shared managers MUST discontinue with reason on successful recording without
  backdating. New selection/reference MUST then fail; pending/draft progression MUST recheck
  availability before new commitments, without eligibility reservation from earlier selection.
- **FR-028**: Approved commitments/history/correction MUST remain processable under existing UC
  checks. Discontinuation MUST not automatically change/cancel applications, registrations,
  schedules, results, permissions or snapshots, or substitute for UC14.
- **FR-029**: Resumption with authority/reason MUST restore new validated use under the same
  identity/code on recording, without backdating, retaining every cycle. It MUST not revive
  rejected/cancelled work, approve drafts, change decisions or restore permissions; no Player
  or goal/card lifecycle policy is introduced.

**Managed logos - US4**

- **FR-030**: Shared Club permission MUST authorize actual durable upload/replacement/removal
  to fallback for at most one current logo, without hardcoded mappings or automatic external downloads.
- **FR-031**: Validation MUST accept only static PNG/JPEG/WebP up to 2,097,152 bytes and 2048 pixels
  per dimension, checking actual type/decoding/dimensions. SVG/GIF/animation, corrupt/oversized
  content and misleading types MUST fail; accepted content MUST be normalized with safe new names.
- **FR-032**: References MUST switch only after validation/storage succeeds; failure MUST preserve
  the old logo without partial required reference/audit changes. Absence/removal/unavailability
  MUST use fallback/alternative text; rendered images MUST preserve aspect ratio.
- **FR-033**: Current logos MUST be consistent even in old-season consumers without changing
  descriptive snapshots. Delivery MUST enforce current visibility and prevent private locations/
  credentials or replaced/removed content leaking through old addresses under D094.
- **FR-034**: Daily cleanup MUST consider only content unreferenced at least 24 hours, rechecking
  current/in-flight/retained-backup dependencies before deletion and retaining failure traceability
  for retry. Content/references MUST survive application replacement and coordinated restoration
  under maintenance/selected-profile controls; database-only restore is not logo recovery.

**Season lifecycle - US7**

- **FR-035**: Managers MUST propose close/reopen with reason for independent assigned-manager
  exact-version approval. Approval MUST be nondelegable and exclude every preparer/editor;
  pending requests MUST leave current state unchanged.
- **FR-036**: Closing MUST recheck a current valid confirmed summary, no other pending seasonal
  requests/approved effects awaiting activation, and all playing intervals against the trusted
  final closing instant. A finite end at or before that instant satisfies the interval gate.
  A later or unspecified end or unresolved future interval MUST block closure. Missing facts
  MUST block with reasons. Closing MUST NOT fabricate readiness or cancel registrations.
  The deciding lifecycle request is not itself another pending request.
- **FR-037**: Closed state MUST enforce D074 regulation/registration/schedule/report/result/
  ranking-resolution/summary write gates while preserving authorized reading/export and separate
  master/media authority. Close/reopen MUST not revoke roles/force logout. PHASE 8's news
  exception remains owned there; news/export are not implemented here.
- **FR-038**: Reopening MUST require independent approval, preserve freezes and leave an unchanged
  valid summary intact; later corrections/reclosing MUST follow current owning-workflow prerequisites.

**Safety, interaction and verification - all stories**

- **FR-039**: Server enforcement MUST check current session/authority/action/scope/state/allowed
  inputs after waits and at final recording. Unauthorized/revoked/expired screen/direct access
  MUST reveal no protected information or unauthorized partial changes.
- **FR-040**: Stale revisions MUST conflict; decisions MUST target exact versions/current facts.
  Critical commands MUST retain approved 24-hour repeat-request/current-access behavior and reject
  changed-content key reuse. Business-state checks MUST prevent duplicate effects afterwards.
- **FR-041**: Business changes/effective references/required audit/transitions MUST record together
  or preserve complete prior state. Failure/conflict/cancellation/maintenance MUST not silently
  overwrite or claim success; background/media writers MUST obey maintenance/recovery controls.
- **FR-042**: Important changes MUST retain actor/execution context, action/object, time, before/
  after, exact version and required reason/effectivity. Existing audit search/access MUST expose
  permitted history without secrets or public internal-data leakage; users MUST not edit/delete history.
- **FR-043**: Vietnamese screens MUST show required fields/normalized values/correctable errors,
  retain valid entries on validation failure, and provide Loading/Empty/Error/retry states.
  Regulation confirmation MUST show content/affected objects/effectivity; cancel/discard MUST
  preserve saved state. Session loss/conflict MUST guide reauthentication or reload/review.
- **FR-044**: Master lists MUST support name search/relevant filters and deterministic pagination
  over 20 records, totals and no omissions/duplicates across unchanged pages. Selectors MUST
  respect availability; management/history MUST retain relevant discontinued records.
- **FR-045**: Real Vietnamese journeys MUST work in actual Chrome/Edge, with desktop administration
  and applicable lookup/media presentation at three approved viewports; mocked data is insufficient.
- **FR-046**: Required checks MUST cover functional/permission/input, save/audit failure, version/
  state/time boundaries, concurrency, two-season/reference preservation and PHASE 1 regressions.
  Actual persistence/independent committed-state checks MUST prove atomicity; isolated fixtures
  MAY provide later facts but not operational seeds or proof of omitted workflows.
- **FR-047**: Verification MUST distinguish business/technical activation failure, exercise startup/
  overdue/concurrent processing, D099 final-use races/cycles, and logo validation/access/replacement/
  cleanup/backup races plus coordinated restoration for the selected profile.
- **FR-048**: Evidence MUST identify revision, actual environment/versions, reproducible dataset/
  clock, commands/scenarios, outcomes/defects/reviewer, following D097/D098. Documents/green checks/
  closed Issues MUST not alone establish Phase completion or waive later acceptance.

### Key Entities *(include if feature involves data)*

- **Season**: identity/code, descriptive information, dates, Open/Closed state, effective rules
  and applicable freeze evidence.
- **Regulation case/version**: successive full proposals, editors/submissions/decisions,
  approved effectivity and actual activation outcomes, distinct from technical revisions.
- **Regulation content**: eligibility/limits, window groups, competition/planning, event types,
  points/ranking priorities and Q/R.
- **Cancellation/replacement request**: versioned reason, exact waiting target and optional
  replacement in the same season.
- **Lifecycle request**: close/reopen proposal/reason/independent decision and summary/readiness basis.
- **Club/Stadium**: shared identities/codes/descriptions/availability; club current logo and
  optional stadium location, distinct from seasonal participation/home-ground/match venue.
- **Availability transition**: reason/operator/time/before-after for every Club/Stadium cycle.
- **Managed logo**: current durable content/reference and protected delivery/cleanup metadata,
  retaining history rather than seasonal image snapshots.
- **Audit record**: protected traceability for permitted inspection of important changes.
- **Prerequisite evidence**: registration plans/schedule/result milestones/summary/pending work,
  owned by later Phases rather than independently duplicated PHASE 2 sporting facts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every main/alternative/exception flow of UC05/UC06/UC07/UC12 passes the approved
  acceptance matrix, including all seven stories and mandatory PHASE 2 criteria.
- **SC-002**: Across at least two isolated seasons sharing masters, 100% of compared historical
  identities/references/approved content/snapshots remain intact except authorized changes;
  tested seasonal changes do not affect other seasons.
- **SC-003**: Every invalid/self-approved/cross-season/stale/failed decision test preserves prior
  state; concurrent approval/activation leaves at most one current version and at most one waiting
  version per season, independently. One current version and one approved future waiting version
  may coexist; no duplicate effects occur.
- **SC-004**: All immediate/future/boundary/missed-scan/restart cases expose the correct basis or
  explicit failure; none commit stale-rule work or silently shift approved effectivity.
- **SC-005**: At least 10 unauthorized scenarios across screens/direct requests, season/shared
  rights, delegation, media/history all reject without sensitive disclosure or unauthorized changes.
- **SC-006**: D099 cases prove same-identity transitions, rejection of all tested new use while
  discontinued, preservation of approved commitments/every cycle and no automatically revived outcomes.
- **SC-007**: A reproducible 20-club dataset shows an actual authorized logo for every club.
  File boundaries/operations, failed replacement, controlled delivery/fallback and coordinated
  restoration pass without a football-data provider.
- **SC-008**: All readiness/independence/closure/reopening/freeze cases pass against declared facts;
  no closure has an unmet prerequisite and reopening unlocks no frozen setting or revoked right.
- **SC-009**: Every successful important change has permitted inspectable actor/time/object,
  before/after/required reason/effectivity; induced failures/concurrency cause no partial state
  or silent overwritten change.
- **SC-010**: The internal club master list achieves at least 95% of lookups within 2 seconds
  in each measured group with one-season/20-club data and 20 concurrent users under D097.
  Use a one-minute warm-up and ten minutes of measurement, record the environment/workload,
  and keep API measurements separate from applicable browser/UI evidence. This PHASE 2
  measurement is a partial benchmark, not evidence of HQ-01 public club lookup acceptance. HQ-01 acceptance
  remains in PHASE 6 with D097's full one-season baseline of 20 clubs, 380 matches and at least
  600 player profiles. HQ-03's same threshold at 10 seasons/3,800 matches remains required in
  owning historical integration Phases; no new write/generation target is introduced.
- **SC-011**: Actual Chrome/Edge journeys pass with recorded versions; applicable lookup/media
  is usable at 360x800, 768x1024 and 1366x768 with unobscured controls. Lists over 20 records
  preserve complete results and Vietnamese diacritics.
- **SC-012**: All PHASE 2 checks/applicable PHASE 1 regressions pass with reproducible evidence/
  reviewer assessment. Later registration/scheduling/results/reporting and complete BM-07
  retain owning-Phase evidence rather than fixture/document-based claims.

## Assumptions

- PHASE 1 acceptance and 2026-11-08 regression are inherited prerequisites, not newly executed
  tests or an implementation authorization from this documentation work.
- Current configuration/security/media owners remain normative; no inferred real-EPL values,
  unsupported formats or new operational defaults are introduced.
- Technical contracts/schema/task details follow approved Spec in Plan under existing architecture.
- Internal administration does not deliver public league lookup or a new public master/season
  dataset; existing visibility rules govern media consumers and later surfaces.

### Prerequisite and dependency assessment

| Item | Assessment and release condition |
|---|---|
| G0 | Recorded v1/Q98, ratified Constitution and separate D098/D099 approvals satisfy document conditions, not software completion. |
| PHASE 1 | COMPLETED per ledger, with dated post-acceptance regression. Reuse foundation and retain regression protection. |
| PHASE 2 policy | Approved owners and the recorded 2026-11-10 clarification settle scope. FR-005 requires independent reopening before editing Closed-season metadata; it does not reopen established lifecycle or freeze decisions. |
| O01/O02/O03/O05 | Real eligibility/calendars/planning/Q/R needed before operational approval/use. D097 supplies isolated test values; missing real inputs do not block specifying validation. |
| Historical O07/O10 | Use current resolved owners rather than reopen policy from historical identifiers. |
| Later facts | PHASE 3/4/5/7 own registration/schedule/result/summary facts. Check them and block absent readiness; isolated fixtures verify guards without starting later Phases. |
| O08/O12-O14 | Production handoff/deployment/unexecuted operations remain inputs/evidence at their owning stage, not architecture choices. |
| Media | Use approved local reference profile unless an Internet profile is separately selected. Authorized logos/source rights and runtime settings are required before affected acceptance; do not fetch unapproved assets. |
| Approval gates | Spec approval precedes Plan; Plan review precedes Tasks; analysis/final Task approval precede one Issue per approved Task. No implementation/commit/push/PR is authorized. |

### Verification allocation

PHASE 2 exercises its real workflows, master/media persistence, transitions, activation,
readiness and shared safeguards. Isolated/reproducible labelled fixtures may supply freeze,
compatibility, closure/history facts. Actual closure approval must run against prepared
evidence, not be replaced by directly setting Closed. Operational closure remains blocked
without actual downstream readiness even when fixture guard tests pass.

Later owners verify real configuration consumption, D099 new-use/approved-commitment gates,
D089 stale-basis prevention, freeze creation and historical report consistency. PHASE 10 retains
full integration/BM-07. Media restore here proves available-data content/references and safe
cleanup, not complete full-season recovery thresholds.

Constitution V requires risk-based security/concurrency/rollback/regression checks, not universal
TDD or an extra coverage percentage. Plan must define executable checks and Tasks allocate evidence.

## Source and Acceptance Traceability

[Sources](../../context/sources.md) owns PDF provenance. The original PDF is intentionally absent;
page references use the authoritative English transcription/approval records, not a newly
performed direct PDF comparison. Current Context owners retain policy.

| Requirement group | Owner and source basis | Acceptance coverage |
|---|---|---|
| FR-001-FR-005 | [UC05](../../context/use-cases/registration.md#uc05), pp.77-78; D003/D005/D059/D074/D076/D092 | US1/US7; SC-001/SC-002/SC-005/SC-008 |
| FR-006-FR-016 | [UC06](../../context/use-cases/registration.md#uc06), pp.79-82; QĐ6 p.11, QĐ1/QĐ2/QĐ3/QĐ5; D019/D042-D046/D050-D054/D072/D075; [D060/D061](../../context/use-cases/scheduling.md#d060---automatic-fixture-pairing-with-manually-completed-schedule-drafts) | US2; SC-001/SC-003/SC-004 |
| FR-017-FR-023 | [D043/D050/D051](../../context/use-cases/registration.md#d051---controlled-cancellation-replacement-and-activation-of-waiting-regulations), [D089](../../context/design/architecture.md#d089---periodic-jobs-and-overdue-regulation-activation); QĐ6.6/TH-06 | US3; SC-003/SC-004/SC-009 |
| FR-024-FR-026 | [Business identity/correction](../../context/business.md#d035---stable-master-identity-with-selective-snapshots-of-official-business-information), D034-D041/D058/D059/D092; [UC07](../../context/use-cases/registration.md#uc07) pp.82-84, [UC12](../../context/use-cases/scheduling.md#uc12) pp.97-99 | US4/US5; SC-001/SC-002/SC-005/SC-009 |
| FR-027-FR-029 | [D099](../../context/business.md#d099---club-and-stadium-discontinuation-with-controlled-resumption), [ADR 0009](../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#d099---club-and-stadium-discontinuation-and-resumption); TH-04/TH-06 pp.13-14, AT-04 p.32 | US6; SC-002/SC-006/SC-009 |
| FR-030-FR-034 | [LOGO-01/D094 media](../../context/design/media.md#logo-01---approved-logo-design); D087-D090/D097; UC07 refinement/recovery allocation | US4; SC-005/SC-007/SC-009 |
| FR-035-FR-038 | [D074](../../context/use-cases/registration.md#d074---independently-approved-season-closure-and-reopening), D071/D073/D076; UC05 refinement | US7; SC-008/SC-009 |
| FR-039-FR-042 | [D030/D084/D085/D095/D096](../../context/design/architecture.md#d096---api-execution-synchronized-csrf-and-transaction-contracts), [D094 audit](../../context/use-cases/administration.md#audit-access-and-retention---d094); BM-02/BM-04-BM-06 pp.23-24, AT-02-AT-04 p.32 | All stories; SC-002-SC-006/SC-008/SC-009 |
| FR-043-FR-045 | [Quality](../../context/quality.md): TD-02-TD-04 p.29, TT-01/TT-02/TT-04 pp.19-20, HQ-01/HQ-03; D024/D086/D092 | All stories; SC-001/SC-010/SC-011 |
| FR-046-FR-048 | [Constitution I-V](../../.specify/memory/constitution.md), [D097](../../context/quality.md#d097-test-season-and-measurement-baseline), D090/D098; [Phase ledger](../../context/progress-checker.md#phase-2---seasons-catalogs-and-regulations) | All stories; SC-001-SC-012 |

<!-- /coderabbit-ai-generated:v1 -->
