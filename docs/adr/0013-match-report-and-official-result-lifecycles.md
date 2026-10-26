# ADR 0013 - Match, report and official-result lifecycles

Current package approval: [Q98 approved v2](../../context/README.md#q98---whole-package-approval). Earlier pending/open statements below are historical interview evidence; current rules remain in their linked owners.

**Scope supersession, 2026-10-26:** [LS-01 / ADR 0017](0017-live-score-excluded-from-first-version.md) excludes Live Score from the first version and cancels its interview/design/acceptance work. Earlier mentions below are historical, not an active backlog or future implementation commitment. The independent-core acceptance gate remains for media APIs only.

This ADR records decisions and rationale; authoritative current rules are owned by [D063](../../context/use-cases/results.md#d063---separate-match-report-version-and-official-result-lifecycles), [D064](../../context/use-cases/results.md#d064---kickoff-based-appearance-eligibility-and-report-defined-goalkeepers), [D065](../../context/use-cases/results.md#d065---structured-event-minutes-score-checks-and-referee-signature-references). Historical open-point notes do not reopen subsequently confirmed policy.

## Event minutes, scores and referee basis

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q65, option A; Context decision [D065](../../context/use-cases/results.md#d065---structured-event-minutes-score-checks-and-referee-signature-references).

Record integer main minute 1-90 and nonnegative added time, positive only at 45/90. Preserve 45+2 and 90+5 notation; first-half added time precedes minute 46 rather than turning 45+2 into 47. This first-version report scope excludes extra-time/shootout events and is separate from [D061](../../context/use-cases/scheduling.md#d061---seasonal-planning-intervals-and-system-wide-schedule-conflict-checks) planning duration.

Require appearing player, correct club, applicable-catalog type and valid time. Retain source default types without implicit additions. Derive score from valid goals with own goals credited to the opponent and excluded from personal totals; entered final score must match before submission/confirmation. Record yellow/red cards without automatic discipline, suspensions or forfeiture.

Before submission require referee name, original-report identifier/reference and inputter confirmation of checking the original signature, with verifier/time retained and approver review. Confirmed versions preserve events/referee basis; corrections use UC19. This specifies BM3 signature-basis representation without removing the source field.

Mandatory scanned signed-report attachment was considered with the same event/score rules. The Team Leader chose reference-based traceability without mandatory signature images/scans/digital signatures, accepting staff verification and original-document retrieval. Detailed schema/lengths, reference format, duplicate feedback, snapshots/display/API and concurrency remain open. No upload or signature technology is selected. See [Context v2 D065](../../context/use-cases/results.md#d065---structured-event-minutes-score-checks-and-referee-signature-references).

## Appearance eligibility and goalkeeper basis

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q64, option A; Context decision [D064](../../context/use-cases/results.md#d064---kickoff-based-appearance-eligibility-and-report-defined-goalkeepers).

Assess appearance eligibility at actual kickoff using a validated registration for the correct club-season whose effective interval contains that instant. Late entry must not replace this with the current club. Each team has a nonempty list; each player appears once per match for one of its teams. Add no mandatory eleven-player, tactical-formation or substitution-management rule. Take shirt number from the applicable registration and record match position separately from profile position.

Require exactly one report-position goalkeeper per team before submission/confirmation. Missing/multiple goalkeepers block progression rather than selecting one or omitting statistics. For official results, credit one clean sheet to that goalkeeper when the team concedes no goals, without goalkeeper-substitution calculations. At confirmation retain registration basis, name, shirt and match position; subsequent transfers/master changes do not rewrite reports. Official corrections remain UC19.

Deriving goalkeepers from registered profile position was considered with the same exact-one gate. The Team Leader chose actual match roles and consistent historical entry, accepting staff position entry and resolution of incomplete/conflicting lists. Goal/card/time/referee validation, Golden Glove ties and detailed schema/correction/concurrency contracts remain open. See [Context v2 D064](../../context/use-cases/results.md#d064---kickoff-based-appearance-eligibility-and-report-defined-goalkeepers).

## Match, report and official-result lifecycles

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q63, option A; Context decision [D063](../../context/use-cases/results.md#d063---separate-match-report-version-and-official-result-lifecycles).

Separate match states (Not started -> In progress -> Ended), report-version states (Draft -> Pending confirmation -> Confirmed, with return/withdrawal before decision) and result status (Unofficial -> Official). Manage official-result correction proposals separately. The Results Officer records actual start/end; require both before submission with end after start, rather than inferring completion from scheduled time or planned duration. After-match entry of both is permitted.

Keep one report case per match, historical versions and at most one version pending confirmation or correction. Submitted content is immutable; changes require withdrawal/return and a new submitted version. UC18 requires an ended match and a complete validated report under existing authority/separation rules; saving a report or score is insufficient.

The existing official result remains public and feeds statistics while a UC19 correction is pending. Return/rejection/withdrawal does not invalidate it. Confirmation/correction updates result, statistics and history consistently under UC18-UC20, without partial official/statistical changes on failure.

A combined match/result state chain was considered. The Team Leader chose accurate independent representation of match completion, pending versions and still-effective results, accepting inter-state checks. Appearance/event validation, actual-time precision, detailed transitions/errors, fields, snapshots and technical contracts remain open. These are internal business states; the deferred Live Score design is not selected.

See [Context v2 D063](../../context/use-cases/results.md#d063---separate-match-report-version-and-official-result-lifecycles).

### D063 english evidence

Current policy owner: [D063](../../context/use-cases/results.md#d063---separate-match-report-version-and-official-result-lifecycles). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to grouped Q63, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the lifecycle package.

- **Source:** O08/O09/O12; UC16-UC20; [D005](../../context/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities)/[D047](../../context/use-cases/results.md#d047---bind-match-event-catalogs-to-recorded-actual-kickoff)-[D049](../../context/use-cases/results.md#d049---revalidate-events-when-corrected-kickoff-changes-the-applicable-catalog)/[D062](../../context/use-cases/scheduling.md#d062---schedule-approval-publishes-immediately-and-adjustments-are-versioned).

- **Alternatives/basis:** Separate linked business states versus one combined match/result state chain. The Team Leader chose accurate representation of completion, pending versions and still-effective official results, accepting checks between multiple state groups.

- **Record:** [ADR 0013](0013-match-report-and-official-result-lifecycles.md); [glossary](../../context/GLOSSARY.md#authority-and-information-scope).

- **Affected Phases:** PHASE 5 report/result workflow, PHASE 4 match-state adjustment checks, PHASE 6/PHASE 7 official outputs and PHASE 10 lifecycle/concurrency verification. No Phase status changes.

- **Still open:** Appearance/event validation, actual-time precision, detailed transitions/errors and supporting fields, snapshots and transaction/API contracts. These internal business states do not select or approve the deferred Live Score design.

### D064 english evidence

Current policy owner: [D064](../../context/use-cases/results.md#d064---kickoff-based-appearance-eligibility-and-report-defined-goalkeepers). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to grouped Q64, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the appearance/goalkeeper package.

- **Source:** O02/O06/O09/O12; QĐ3.2/QĐ5.7, BM3, UC16/UC18/UC20; [D047](../../context/use-cases/results.md#d047---bind-match-event-catalogs-to-recorded-actual-kickoff)/[D048](../../context/use-cases/results.md#d048---record-actual-kickoff-in-the-report-and-confirm-it-with-the-official-result)/[D056](../../context/use-cases/registration.md#d056---playing-effective-intervals-and-consistent-club-transfers).

- **Alternatives/basis:** Match-position goalkeeper designation versus deriving goalkeeper from registered profile position with the same exact-one validation. The Team Leader chose actual match roles and consistent late-entry history, accepting staff entry and resolution of incomplete/conflicting lists.

- **Record:** [ADR 0013](0013-match-report-and-official-result-lifecycles.md#appearance-eligibility-and-goalkeeper-basis).

- **Affected Phases:** PHASE 3 registration-history integration, PHASE 5 reports/clean sheets, PHASE 6/PHASE 7 historical outputs and PHASE 10 temporal/goalkeeper verification. No Phase status changes.

- **Still open:** [D065](../../context/use-cases/results.md#d065---structured-event-minutes-score-checks-and-referee-signature-references) below settles goal/card/time/referee policy. Golden Glove ties, detailed appearance/snapshot schema and correction/concurrency contracts. No disciplinary or substitution subsystem is selected.

### D065 english evidence

Current policy owner: [D065](../../context/use-cases/results.md#d065---structured-event-minutes-score-checks-and-referee-signature-references). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to grouped Q65, the Team Leader selected option A: “tôi chọn A.” (“I choose A.”), confirming the event/referee package.

- **Source:** O09/O12; BM3, QĐ3.3-QĐ3.5, UC16-UC19; [D046](../../context/use-cases/registration.md#d046---preserve-codes-and-meanings-of-referenced-goal-and-card-types)-[D049](../../context/use-cases/results.md#d049---revalidate-events-when-corrected-kickoff-changes-the-applicable-catalog)/[D063](../../context/use-cases/results.md#d063---separate-match-report-version-and-official-result-lifecycles)/[D064](../../context/use-cases/results.md#d064---kickoff-based-appearance-eligibility-and-report-defined-goalkeepers).

- **Alternatives/basis:** Original-report reference and recorded signature cross-check versus mandatory scanned signed-report attachment with the same event/score rules. The Team Leader chose traceability without file/signature infrastructure, accepting reliance on staff verification and access to the original.

- **Record:** [ADR 0013](0013-match-report-and-official-result-lifecycles.md#event-minutes-scores-and-referee-basis); [glossary](../../context/GLOSSARY.md#authority-and-information-scope).

- **Affected Phases:** PHASE 5 report validation, PHASE 6/PHASE 7 official output/history and PHASE 10 boundary/evidence verification. No Phase status changes.

- **Still open:** Exact event/referee schema/lengths, source-reference format, duplicate-event feedback, detailed snapshot/display/API and concurrency contracts. No upload or digital-signature technology is selected.

## Q83 - Stored statistics and full-season recalculation

**Status:** accepted. **Decision:** D083. The Team Leader selected Q83 option A ("Tôi chọn A."), approving the full common package. Current policy is owned by [D083](../../context/use-cases/results.md#d083---stored-official-statistics-with-full-season-recalculation).

Choose full recalculation of the affected season after each official confirmation/correction instead of incrementally subtracting the old contribution and adding the new one. Persist season/club and season/player projections while keeping current confirmed report versions authoritative. Full recalculation simplifies manual comparison and correction testing, accepting the need to measure the complete transaction against HQ-02 and reporting against HQ-04. Official references, projections, audit and required ranking/summary review flags change atomically; draft/pending versions do not affect them. Historical registration/appearance attribution and shared formula ownership remain binding. No new infrastructure, manual statistics editor or performance acceptance is implied.
