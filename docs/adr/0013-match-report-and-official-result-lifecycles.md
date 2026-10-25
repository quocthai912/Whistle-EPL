# ADR 0013 - Match, report and official-result lifecycles

## Event minutes, scores and referee basis

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q65, option A; Context decision D065.

Record integer main minute 1-90 and nonnegative added time, positive only at 45/90. Preserve 45+2 and 90+5 notation; first-half added time precedes minute 46 rather than turning 45+2 into 47. This first-version report scope excludes extra-time/shootout events and is separate from D061 planning duration.

Require appearing player, correct club, applicable-catalog type and valid time. Retain source default types without implicit additions. Derive score from valid goals with own goals credited to the opponent and excluded from personal totals; entered final score must match before submission/confirmation. Record yellow/red cards without automatic discipline, suspensions or forfeiture.

Before submission require referee name, original-report identifier/reference and inputter confirmation of checking the original signature, with verifier/time retained and approver review. Confirmed versions preserve events/referee basis; corrections use UC19. This specifies BM3 signature-basis representation without removing the source field.

Mandatory scanned signed-report attachment was considered with the same event/score rules. The Team Leader chose reference-based traceability without mandatory signature images/scans/digital signatures, accepting staff verification and original-document retrieval. Detailed schema/lengths, reference format, duplicate feedback, snapshots/display/API and concurrency remain open. No upload or signature technology is selected. See [Context v2 D065](../../context/english/design/README.md#d065---structured-event-minutes-score-checks-and-referee-signature-references).

## Appearance eligibility and goalkeeper basis

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q64, option A; Context decision D064.

Assess appearance eligibility at actual kickoff using a validated registration for the correct club-season whose effective interval contains that instant. Late entry must not replace this with the current club. Each team has a nonempty list; each player appears once per match for one of its teams. Add no mandatory eleven-player, tactical-formation or substitution-management rule. Take shirt number from the applicable registration and record match position separately from profile position.

Require exactly one report-position goalkeeper per team before submission/confirmation. Missing/multiple goalkeepers block progression rather than selecting one or omitting statistics. For official results, credit one clean sheet to that goalkeeper when the team concedes no goals, without goalkeeper-substitution calculations. At confirmation retain registration basis, name, shirt and match position; subsequent transfers/master changes do not rewrite reports. Official corrections remain UC19.

Deriving goalkeepers from registered profile position was considered with the same exact-one gate. The Team Leader chose actual match roles and consistent historical entry, accepting staff position entry and resolution of incomplete/conflicting lists. Goal/card/time/referee validation, Golden Glove ties and detailed schema/correction/concurrency contracts remain open. See [Context v2 D064](../../context/english/design/README.md#d064---kickoff-based-appearance-eligibility-and-report-defined-goalkeepers).

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q63, option A; Context decision D063.

Separate match states (Not started -> In progress -> Ended), report-version states (Draft -> Pending confirmation -> Confirmed, with return/withdrawal before decision) and result status (Unofficial -> Official). Manage official-result correction proposals separately. The Results Officer records actual start/end; require both before submission with end after start, rather than inferring completion from scheduled time or planned duration. After-match entry of both is permitted.

Keep one report case per match, historical versions and at most one version pending confirmation or correction. Submitted content is immutable; changes require withdrawal/return and a new submitted version. UC18 requires an ended match and a complete validated report under existing authority/separation rules; saving a report or score is insufficient.

The existing official result remains public and feeds statistics while a UC19 correction is pending. Return/rejection/withdrawal does not invalidate it. Confirmation/correction updates result, statistics and history consistently under UC18-UC20, without partial official/statistical changes on failure.

A combined match/result state chain was considered. The Team Leader chose accurate independent representation of match completion, pending versions and still-effective results, accepting inter-state checks. Appearance/event validation, actual-time precision, detailed transitions/errors, fields, snapshots and technical contracts remain open. These are internal business states; the deferred Live Score design is not selected.

See [Context v2 D063](../../context/english/design/README.md#d063---separate-match-report-version-and-official-result-lifecycles).
