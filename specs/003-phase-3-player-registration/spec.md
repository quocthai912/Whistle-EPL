# Feature Specification: PHASE 3 - Profiles and Player Registration

**Feature Branch**: `docs/phase-3-architecture-and-specification`  
**Created**: 2026-11-12 (Asia/Bangkok)  
**Status**: Approved by the Team Leader on 2026-11-12 (Asia/Bangkok)  
**Approval evidence**: The Team Leader answered "Tôi phê duyệt." after the FR-020 clarification and 16/16 requirements checklist were presented for Specification approval before Planning.  
**Input**: Prepare UC08–UC11 for future implementation against the approved Context, including D100 and the approved PHASE 2 contracts.

## Context and Scope

PHASE 3 owns seasonal club participation applications (BM1), shared Player master profiles and portraits, seasonal player registrations, and explainable eligibility checks within registration processing. The [Context](../../context/README.md), [Phase ledger](../../context/progress-checker.md#phase-3---profiles-and-player-registration), [decision index](../../context/design/README.md#confirmed-decisions) and [Constitution](../../.specify/memory/constitution.md) govern this feature. Source references use the approved Context transcription and [PDF traceability](../../context/sources.md#pdf). The original PDF is outside the checkout.

| Actor | In-scope responsibility |
| --- | --- |
| Assigned Registration Officer | Prepare and process UC08 and UC10 in the assigned season, perform UC11 checks, and propose timing exceptions and official corrections. Transfers require authority over all affected registrations and seasons. |
| Assigned Season Manager | Independently decide UC08 applications, D053 timing exceptions, D100 club application corrections and D057 registration corrections. A preparer or editor cannot approve their own submitted version. |
| Holder of the separate Player master-management grant | Create, update, correct and manage portraits on shared Player profiles. The corresponding seasonal role is a prerequisite for the grant and does not itself grant this authority. |
| Authorized reader | Read records and history within responsibility and season scope. Public media delivery uses the approved seasonal lookup eligibility and field rules. |

Account and grant administration belongs to PHASE 1. Season, Club/Stadium masters, Club logos, regulation management and Open/Closed transitions belong to PHASE 2. Scheduling and venue changes, match reports/results/statistics, public lookup screens and XLSX exchange belong to their respective later Phases. PHASE 3 supplies its owned facts to those workflows. First-version scope excludes Player discontinuation/resumption, automated duplicate merging, automated training-history accumulation, and external football/media data acquisition.

## Clarifications

### Session 2026-11-12

- Q: Which regulation version applies when a D057 correction affects a historical playing interval that crosses a change of regulations? → A: The Team Leader selected option A ("Tôi chọn A."). Use the regulations effective in each affected segment and preserve the original receipt and confirmation bases as historical evidence.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Receive and decide club participation applications (Priority: P1)

A Registration Officer prepares BM1 and submits a reviewed application so an independent Season Manager can decide whether the club participates.

**Why this priority**: Approved participation is required for player registration validity.  
**Independent Test**: Start with an Open season, approved effective regulations, eligible masters and distinct authorized staff. Exercise the complete BM1 workflow.

1. **Given** a complete BM1 received on time, **when** an independent manager approves after the window closes, **then** the exact submitted version is approved and its official snapshot and receipt basis are retained.
2. **Given** a version is returned for supplementation, **when** staff resubmit after the window closes, **then** the successor is assessed at its own receipt time and cannot be approved without its own approved timing exception.
3. **Given** a rejected or cancelled version, **when** intake starts again, **then** the new round uses the same club-season case and retains the prior decision.
4. **Given** a pending application, **when** a former editor attempts approval or a selected master becomes discontinued, **then** the attempted approval leaves the application unapproved.

### User Story 2 - Maintain Player identity and portraits (Priority: P1)

A holder of the Player master-management grant maintains one stable profile per identified player and can supply a current portrait.

**Why this priority**: Every registration depends on an identified player.  
**Independent Test**: Use separate accounts with and without the shared grant and records with duplicate codes and similar identity attributes.

1. **Given** a matching normalized name, birth date and nationality, **when** staff review a proposed profile, **then** they reuse the existing profile for the same person or confirm distinct people with a recorded reason. A duplicate business code is rejected.
2. **Given** a birth-date error in a referenced profile, **when** an authorized manager corrects it with evidence, **then** review needs are identifiable, existing official versions remain intact and affected new eligibility uses corrected data.
3. **Given** an existing portrait, **when** invalid bytes or a storage failure prevent replacement, **then** the old portrait remains current. On successful removal or an unavailable image, the view uses the approved fallback.

### User Story 3 - Confirm eligible seasonal registrations (Priority: P1)

A Registration Officer receives and validates a player's registration and can explain unmet conditions before confirming it.

**Why this priority**: The decision supplies the playing eligibility basis to later Phases.  
**Independent Test**: Exercise UC10 and its UC11 findings against approved seasons and applications with controlled receipt, player evidence and interval data.

1. **Given** an unapproved club application, **when** staff prepare or check a player list, **then** preparation can proceed under the applicable regulation gate, while confirmation waits for approved participation.
2. **Given** a timely version and a rule change before confirmation, **when** staff confirm, **then** timing uses the recorded receipt basis and eligibility uses the applicable decision-time rules. A rejected check leaves the version unconfirmed.
3. **Given** 25 counted players including 17 non-homegrown, **when** a qualifying U21 candidate and candidates exceeding each limit are assessed separately, **then** the checks enforce the applicable exclusions and identify the specific breached limits.
4. **Given** missing evidence or an inapplicable criterion, **when** staff check the version, **then** the findings distinguish insufficient basis, non-applicability and rule violation. A successful precheck does not guarantee the final outcome.

### User Story 4 - Manage playing intervals and transfers (Priority: P1)

A Registration Officer ends a registration, transfers a player, or changes or cancels a confirmed plan before it begins.

**Why this priority**: A transfer affects two official registration histories and later match eligibility.  
**Independent Test**: Use two clubs and two seasons, touching and overlapping intervals, and a competing future plan.

1. **Given** a validated registration, **when** staff confirm a transfer, **then** the old interval ends and the new interval starts at the same instant. A failed transfer leaves the old interval intact.
2. **Given** a future transfer, **when** staff change or cancel it, **then** both sides change together or neither changes. Cancellation restores the earlier end only when the restoration is valid.
3. **Given** an authorized transfer out of a discontinued club into an eligible club, **when** the existing interval can validly end and the new registration passes confirmation checks, **then** record both changes together without re-confirming the original registration.
4. **Given** an overlapping future registration or shirt allocation, **when** staff confirm a competing plan, **then** the conflict blocks confirmation even if today's roster has room.

### User Story 5 - Correct official records with preserved history (Priority: P1)

Authorized staff can correct proven errors after approval or confirmation, with a separate decision and traceable effects.

**Why this priority**: Official snapshots and eligibility decisions are consumed by other workflows.  
**Independent Test**: Exercise D100 and D057 separately against previously approved records, outside an intake window, with distinct staff and related record references.

1. **Given** an Open season and proven original BM1 venue error, **when** an independent manager approves correction outside intake, **then** the successor becomes official with its own decision time. The original receipt, approved version and scheduled matches are preserved.
2. **Given** a Closed season, changed correction basis, same-person approval or attempted BM1 roster change through D100, **when** staff try to approve the correction, **then** the existing official version remains current.
3. **Given** a wrong birth date or wrongly recorded interval on a validated registration, including one not yet effective, **when** staff propose correction, **then** the official decision remains until independent approval. Approval retains earlier versions and identifies related match records for separate review.
4. **Given** a submitted D057 correction, **when** an independent manager returns it for supplementation or rejects it, **then** record that outcome and retain the submitted version and the existing official decision. Revised content follows the successor-version rules.
5. **Given** an incorrect U21 classification and an affected historical interval spanning R1 and R2 with different limits, **when** staff assess the D057 correction, **then** they evaluate the corrected facts and composition against R1 before R2 takes effect and against R2 from its effective instant. If either segment fails, report the affected segment and rule basis and require the explicit D057 disposition before approval. Retain the original receipt and confirmation bases and preserve official match outcomes.

### Edge Cases

- Compare exact window opening and closing instants, exact U21 cutoff dates and adjacent playing intervals. Exercise UTC instants and Vietnam time presentation under D024.
- Exercise insufficient homegrown evidence with and without authorized non-homegrown treatment, and recheck a pending version after a regulation change.
- Cover wrong season references, duplicate case/profile codes, stale submitted bases, permission changes during processing, same-person approval with multiple roles, and a concurrent intake/closure or new-use/discontinuation race.
- Cover a transfer whose destination loses eligibility, competing quota/shirt allocation, a blocked restoration after cancellation, interrupted writes and repeated critical requests.
- Cover missing/unavailable portrait content, restricted media identifiers, failed replacement, and recovery of linked metadata and content.

## Requirements *(mandatory)*

### Functional Requirements

**UC08 and D100**

- **FR-001**: Maintain one club application case per club and season with versioned rounds. Require the D059 BM1 submission fields at the applicable milestone, including coach, home ground, representative name/phone/address and a nonempty proposed player list. Preserve BM1 content without equating the proposed list with valid registrations.
- **FR-002**: Support Draft → Received → Pending approval → Approved/Rejected, return from Received or Pending approval for supplementation with reason, and cancellation before approval with reason/history. Changes to submitted content use withdrawal or return and a successor version. Rejected and cancelled versions remain historical.
- **FR-003**: Bind approval to the exact immutable version, applicable regulation/receipt bases and independent assigned authority. Record the decision, accepted application and D059 snapshot together. Reject mismatched season, stale basis, unavailable new-use masters and failed authority/state checks.
- **FR-004**: Under D100, accept evidence-backed proposals to correct descriptive recording errors on the exact approved BM1 basis. Require reason, before/after facts and related records needing review. Exclude later changes in circumstances, proposed-player-list changes and club withdrawal/replacement.
- **FR-005**: Approve a D100 successor independently in the same case while the season is Open, including outside intake without a D053 exception. Retain the original receipt instant, basis and decision, keep the old approved version current until success, and record the correction at its own decision instant. Subsequent work uses the corrected official basis. Already recorded registrations, fixtures, results and statistics follow their owning UCs, including UC14 for a scheduled venue change.

**UC09**

- **FR-006**: Allow authorized create, update, search and lookup of stable Player profiles. Enforce required name, code, birth date, approved nationality and position under D058/D059/D092. Reject reused codes, and treat matching normalized name/birth date/nationality as a review trigger with recorded reason for distinct people. Seasonal club and shirt number belong to the registration.
- **FR-007**: Permit authorized source-data correction with reason, evidence, before/after values, operator and time. Identify affected records for review. Preserve official snapshots and decisions until their owning correction processes apply. Re-evaluate affected new business using corrected source data.
- **FR-008**: Manage at most one current portrait per Player. Accept only static PNG/JPEG/WebP up to 2 MiB and 2048 pixels per dimension after checking actual content and decoding. Normalize valid images. Authorized replacement switches the current reference only after successful storage. Record actor/time and reference changes. Failed replacement preserves the previous image.
- **FR-009**: Deliver portraits through current access checks under D032/D033/D094. Show current portrait on authorized historical views with aspect preservation, player-name alternative text and fallback. Unavailable or missing portraits do not prevent saving or registration. Retain audit references and coordinate cleanup and recovery with D088/D094, including the 24-hour unreferenced grace and retained-backup checks.

**UC08/UC10 intake and UC10–UC11 validation**

- **FR-010**: Assess each exact received version using the applicable seasonal intake group and its server-recorded receipt instant in [open, close). Retain the calendar basis. A timely version remains processable after the window ends. Recheck supplemented or changed assessed content on its own receipt.
- **FR-011**: Allow a Registration Officer to propose a reasoned exception for an exact received version and an independent assigned Season Manager to decide it. An approved exception only waives that version's timing condition. It cannot carry over to a successor or approve participation or playing eligibility.
- **FR-012**: Support player Draft → Received → Valid, with return for supplementation and versioned re-receipt, or reasoned cancellation before validity. Require approved participation for validity. Allow authorized preparation and applicable prechecks while club approval is pending. Initial validity is the Registration Officer's decision after UC11.
- **FR-013**: Use applicable approved decision-time rules for pending work and retain the exact rule basis. Distinguish met, unmet, insufficient-basis and not-applicable findings with permitted reasons. Missing effective rules or required data block dependent confirmation. Check again at final recording, including changes since precheck.
- **FR-014**: Calculate U21 from birth date on or after the configured cutoff. For positive homegrown findings, require staff verification against the configured qualifying age range and affiliated English/Welsh training basis, recording qualifying seasons or months, value, evidence summary/reference, verifier, time and rule version. Nationality never determines either status. Allow non-homegrown treatment where the operator chooses it and all requirements pass.
- **FR-015**: Enforce configured squad and non-homegrown limits at affected composition boundaries, including confirmed future intervals. Source defaults are 25 counted and at most 17 non-homegrown in that list, with qualifying U21 outside the 25, and homegrown training of three seasons or 36 months under the configured conditions. Do not make test-only dates or age ranges operational defaults.
- **FR-016**: Require identified player, club, season, shirt number, playing start, findings and validation basis at confirmation. Store the D059 official snapshot. Reject overlapping playing registrations for the same player within the competition, including across seasons. Enforce shirt numbers 1–99 and no overlap for the same number in a club-season, including U21 and future plans.

**UC10 intervals, plans and corrections**

- **FR-017**: Use half-open playing intervals, with an optional end. Ordinary start and termination are effective at successful recording or prospectively. A transfer pairs the old end and new start at the same instant, after checking authority over both registrations and seasons. Apply termination rules to the existing registration, full confirmation checks to the new registration, and conflict and quota checks to all affected intervals. Record the reason and history. The existing registration does not undergo a fresh intake or validity confirmation.
- **FR-018**: Under D075, allow reasoned ordinary prospective plan change/cancellation before playing effectivity. Preserve validation history and successor/cancellation facts. Update paired transfer dates together or restore the prior end on valid cancellation. Block conflicting restorations or dependent plans and identify the conflict. Do not cascade shifts or cancellations.
- **FR-019**: Under D057, separately process errors in confirmed facts, classifications or intervals, including future plans. Require exact basis, reason, before/after and impact. The independent Season Manager may approve, return for supplementation or reject. Preserve the current official decision while review is pending and after return or rejection. Record each outcome and preserve the submitted version. Recheck affected conditions, limits and overlap using the corresponding regulations and require explicit disposition where the prior decision cannot remain valid. Preserve historical existence and identify match-report/result review needs for UC19 without changing sporting outcomes.
- **FR-020**: For a D057 correction affecting a historical playing interval that spans a regulation change, assess corrected eligibility and limits against the approved regulation version effective in each affected segment. Split the assessment at applicable regulation effectivity boundaries and retain the exact basis for each segment. Where corrected facts fail a segment's rules, identify the failing segment and apply the explicit disposition requirement in FR-019. Preserve the original receipt and confirmation bases as historical evidence.

**Shared execution and information protection**

- **FR-021**: Enforce live session, role/grant, season scope, exact version and state on the server, including final authorization. Apply D005/D019 approval independence and D034–D041 shared-grant lifecycle. Neither administrator status nor a season role alone authorizes Player master management.
- **FR-022**: Reject stale/concurrent changes without silent overwrite. Apply approved replay behavior to critical decisions, and persist related changes, version pointers and required audit atomically. Audit records capture actor, time, action, target and approved before/after, reason and effectivity fields where applicable. Restrict audit and evidence to authorized viewers.
- **FR-023**: Apply D032/D033/D094 visibility at each read, including direct access, media and history. Keep representative/contact data, homegrown evidence and draft/pending material internal. The birth-date exception applies only to players in the approved public seasonal scope.
- **FR-024**: Provide Vietnamese guidance, field-specific and action-specific failures, stable scoped searches and pagination for lists over 20 records. Preserve valid input on validation failure. Use consistent labels and protect persisted data when a user cancels or discards uncommitted changes.
- **FR-025**: Consume the actual PHASE 2 lifecycle, masters and rule basis. Allow permitted preparation without initial effective regulations and block regulation-dependent receipt/confirmation. Closed seasons block seasonal writes while allowing authorized reads. Closing does not itself revoke assignments or invalidate sessions. Authorized shared Player profile and portrait management remains available under D074 and D034–D041. Reject new uses of discontinued masters, including new player confirmations/transfers into a discontinued club, while preserving existing approved references and their owning workflows. Resolve due regulation state through the PHASE 2 owner and fail safely when the correct basis is unavailable.
- **FR-026**: Supply owned registration facts for PHASE 2 compatibility and closure checks, including approved current/future compositions, pending seasonal work and unresolved future plans. For closure, supply playing intervals needed to distinguish an end at or before the closing instant from a later or unspecified end. Supply scoped references for master-impact review and the registration basis for authorized media visibility. Once a source is introduced, unknown or unavailable facts cannot be treated as empty or public.

### Key Entities *(include if feature involves data)*

- **Player and portrait**: Shared identity, controlled reference values and a current managed image. Club, shirt and playing eligibility are seasonal.
- **Club registration application and version**: One club-season case, proposed player list, receipt and decisions, approved BM1 snapshot and D100 successor history.
- **Seasonal player registration and version**: Player/club/season, shirt, findings and evidence, exact rule basis, playing interval and official snapshot.
- **Receipt exception, transfer and correction**: Version-bound timing decision, paired interval change, or independently decided correction with history and affected references.
- **Season, Club, Stadium and approved regulation version**: PHASE 2 reference and lifecycle owners. PHASE 3 consumes their official identity, availability and rule bases.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All UC08 and D100 acceptance scenarios pass, including independent approval, exact versions, supplementation, rejection/cancellation, Open/Closed and preservation after failure.
- **SC-002**: All UC09 scenarios pass for required data, duplicate review, corrected source use, authorized portrait handling, invalid content, fallback and reference/content recovery. The D090 full-season profile dataset has 20 clubs and at least 600 Player Profiles. Demonstrate 30 per club under the approved fixture rules and managed portrait handling at hundreds-of-profiles scale.
- **SC-003**: Every declared UC10/UC11 boundary case produces the expected finding and saved outcome for quota, U21, homegrown, receipt, conflicts, stale evidence and wrong-season inputs. No failing eligibility case becomes valid.
- **SC-004**: Every transfer/correction/concurrency scenario preserves exact-version history and shows complete committed changes or unchanged prior state. Verify two-season preservation and continued use of approved references under D099.
- **SC-005**: All phase authorization/response-scope cases pass, including at least 10 unauthorized access cases with no unauthorized state change or sensitive disclosure. Verify revocation races and independent approval with real distinct staff. Audit captures the required facts without exposing restricted evidence.
- **SC-006**: In-scope Player/Club lookups meet HQ-01: at least 95% of ordinary requests within 2 seconds with one season and 20 concurrent users under the D097 reference environment and measurement protocol. Warm up for one minute, measure for ten minutes, report each lookup group and measure API and UI separately. Verify actual Chrome/Edge, applicable lookup behavior at 360 × 800, 768 × 1024 and 1366 × 768, Vietnamese text and pagination per TT-01/02/04 and TD-04. Retain TD-01's 5 users × 4 attempts, at least 80% within 30 seconds and at most three navigation actions in the applicable usability assessment.
- **SC-007**: Integrated verification exercises the actual PHASE 1/2 prerequisites, including due activation, missing basis, effectivity changes, closed-season denial, D099 races and registration facts for compatibility/closure. Record real revision, environment, fixtures, observed outcomes and reviewer. Isolated fixture tests establish only the exercised behavior.

## Assumptions

### Prerequisite and dependency assessment

| Gate / owner | Evidence now | Required PHASE 3 consumption or return path |
| --- | --- | --- |
| G0 / governance | Q98, the ratified Constitution and the D100 preparation approval are recorded. Specification clarification and approval are separate. | Resolve material scope/behavior questions and record explicit Team Leader approval before Planning. |
| PHASE 1 | Foundation implementation accepted in its recorded scope. | Reuse authenticated access, assigned roles/grants, approved command safeguards and scoped audit for FR-006–009 and FR-021–024. |
| PHASE 2 UC05 | Approved Spec, Plan and Tasks. Implementation and acceptance outstanding. | FR-001–005 and FR-010–026 require actual season identity and Open/Closed gates where seasonal work is involved. FR-026 provides the registration portion of closing readiness. |
| PHASE 2 UC06 | Approved effective-version, intake, compatibility and due-activation contracts. Implementation and acceptance outstanding. | FR-003 and FR-010–020 require effective initial configuration, exact receipt calendar and applicable decision/correction basis. FR-025–026 require due activation handling and the compatibility return path. |
| PHASE 2 UC07 / UC12 | Approved Club/Stadium master and D099 availability contracts. Implementation and acceptance outstanding. | FR-001–005, FR-012, FR-017 and FR-025 require real master references and final new-use checks. FR-026 supplies owned impact references. |
| Operational inputs | O01/O02/O08/O09 and applicable O12–O14 remain classified in the Context. | Actual approved cutoffs, qualifying ages and intake windows, case evidence, authorized assets and selected environment are required at their operational or verification gates. D090/D097 fixture values are isolated. |

PHASE 3 documentation may be approved before PHASE 2 execution. **PHASE 3 implementation remains blocked until the required PHASE 2 capabilities are implemented and accepted.** Reconcile the accepted PHASE 2 contracts against this Specification and the future Plan before implementation. Surface differences for review and amend affected artifacts through their approval gates. Use the [PHASE 2 Specification](../002-phase-2-season-regulations/spec.md), [Plan](../002-phase-2-season-regulations/plan.md) and [execution contract](../002-phase-2-season-regulations/contracts/execution.md#typed-dependency-ports) as planning inputs.

### Verification allocation

Use isolated, reproducible D090/D097 fixtures for focused scenarios. Integrated acceptance requires actual owned flows. Exercise PHASE 3 portrait reference/content recovery under the selected profile and keep full-system BM-07 acceptance, historical/load evidence and later workflow verification with their Phase owners. PHASE 3 supplies eligibility/history to PHASE 4–7 and Player masters to PHASE 9 under approved boundaries.

## Source and Acceptance Traceability

| Requirements | Source and approved refinement | Stories / outcomes |
| --- | --- | --- |
| FR-001–003, FR-010–011 | [BM1/QĐ1.1/QĐ1.6](../../context/business.md#qđ1), [UC08](../../context/use-cases/registration.md#uc08) pp.85–88, D005/D019/D053/D055/D059 | US1, US3 / SC-001, SC-003, SC-005 |
| FR-004–005 | [D100](../../context/use-cases/registration.md#d100---correction-of-approved-club-participation-applications), [ADR 0009](../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#d100---correction-of-approved-club-participation-applications), D035/D036/D074, UC14 | US5 / SC-001, SC-004, SC-005 |
| FR-006–009 | [UC09](../../context/use-cases/registration.md#uc09) pp.88–90, D034–D041/D058/D059/D069/D088/D090/D092/D094, [media policy](../../context/design/media.md) | US2 / SC-002, SC-005, SC-006 |
| FR-012–016 | [UC10–UC11](../../context/use-cases/registration.md#uc10) pp.91–97, QĐ1.2–1.6 pp.6–7, QĐ6.2, D052–D056/D058/D059/D075 | US3, US4 / SC-003, SC-004 |
| FR-017–020 | UC10/QĐ1.5–1.6, D024/D036/D056/[D057](../../context/use-cases/registration.md#d057---independently-approved-correction-of-validated-registrations)/D075 and UC19 | US4, US5 / SC-003, SC-004 |
| FR-021–024 | [Quality](../../context/quality.md), TH-01/05/06, HQ-01, TT-01/02/04, BM-01/02/04/05/06, TD-01–04, AT-01–04, D003–D005/D030/D032–D041/D084/D085/D092/D094/D096 | US1–US5 / SC-001–SC-006 |
| FR-025–026 | TH-04/06 and AT-04, D051/D052/D074/D076/D079/D089/D099, [PHASE 2 FR-004/015/027–029/036–037](../002-phase-2-season-regulations/spec.md#functional-requirements) | US1, US3–US5 / SC-003, SC-004, SC-007 |
