# ADR 0010 - Immutable approved seasonal regulation versions

Current package approval: [Q98 approved v2](../../context/README.md#q98---whole-package-approval). Earlier pending/open statements below are historical interview evidence; current rules remain in their linked owners.

**Scope supersession, 2026-10-26:** [LS-01 / ADR 0017](0017-live-score-excluded-from-first-version.md) excludes Live Score from the first version and cancels its interview/design/acceptance work. Earlier mentions below are historical, not an active backlog or future implementation commitment. The independent-core acceptance gate remains for media APIs only.

This ADR records decisions and rationale; authoritative current rules are owned by [D042](../../context/use-cases/registration.md#d042---immutable-approved-versions-of-seasonal-regulations), [D043](../../context/use-cases/registration.md#d043---immediate-or-future-regulation-effectivity-without-backdating), [D044](../../context/use-cases/registration.md#d044---freeze-competition-structure-after-initial-schedule-approval), [D045](../../context/use-cases/registration.md#d045---freeze-points-and-ranking-priority-after-the-first-official-result), [D046](../../context/use-cases/registration.md#d046---preserve-codes-and-meanings-of-referenced-goal-and-card-types), [D047](../../context/use-cases/results.md#d047---bind-match-event-catalogs-to-recorded-actual-kickoff), [D048](../../context/use-cases/results.md#d048---record-actual-kickoff-in-the-report-and-confirm-it-with-the-official-result), [D049](../../context/use-cases/results.md#d049---revalidate-events-when-corrected-kickoff-changes-the-applicable-catalog), [D050](../../context/use-cases/registration.md#d050---at-most-one-approved-future-regulation-version-per-season), [D051](../../context/use-cases/registration.md#d051---controlled-cancellation-replacement-and-activation-of-waiting-regulations), [D052](../../context/use-cases/registration.md#d052---compatible-registration-rule-changes-and-revalidation-of-pending-records). Historical open-point notes do not reopen subsequently confirmed policy.

## Registration-rule changes and affected records

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q52, option A; Context decision [D052](../../context/use-cases/registration.md#d052---compatible-registration-rule-changes-and-revalidation-of-pending-records).

Allow controlled changes to squad limits, homegrown and U21 conditions during a season only if they do not invalidate approved registrations/lists currently in effect. Check impact at approval and effectivity; block incompatible changes. Do not automatically cancel registrations, remove players or rewrite approved decisions. Preserve original historical regulation bases. Revalidate draft/pending records under regulations effective at decision time; earlier submission does not guarantee old conditions/limits. Record each decision's regulation-version basis. Erroneous master data or prior decisions still use their respective correction processes.

Freezing these conditions from the first approved registration was considered. The Team Leader chose QĐ6.2 flexibility without mass revocation or grandfathering incompatible current registrations, accepting impact checks and changes/supplementation for pending work. Exact homegrown/U21 values, calendar/deadline exceptions, record lifecycle and technical contracts remain open. This selects the policy for player conditions/limits, not deadline assessment, and adds no extra UC10 approver. See [Context v2 D052](../../context/use-cases/registration.md#d052---compatible-registration-rule-changes-and-revalidation-of-pending-records).

## Controlled cancellation, replacement and activation

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q51, option A; Context decision [D051](../../context/use-cases/registration.md#d051---controlled-cancellation-replacement-and-activation-of-waiting-regulations).

Before effectivity, an authorized Season Manager proposes cancellation with a reason and another authorized Season Manager approves it; approved content/history remain intact. A combined proposal may cancel the waiting version and approve its replacement together, recording both only after successful approval of the entire valid proposal. Failure retains the waiting version. This explicitly refines [D050](../../context/use-cases/registration.md#d050---at-most-one-approved-future-regulation-version-per-season): a controlled replacement is allowed while a version is waiting, without allowing two approved future versions.

Pending cancellation/replacement does not postpone effectivity. Once the effective instant is reached, the future-version cancellation route is unavailable; further changes require a new version. At effectivity, recheck constraints arising since approval, including [D044](../../context/use-cases/registration.md#d044---freeze-competition-structure-after-initial-schedule-approval)/[D045](../../context/use-cases/registration.md#d045---freeze-points-and-ranking-priority-after-the-first-official-result) freeze milestones. If incompatible, do not apply the version: retain current effective regulations, record the reason and end that approved version in the terminal business state Activation blocked. It no longer occupies D050's approved future waiting-version slot; resolution requires a new proposal and approval against current regulations/constraints, not reactivation of that version. Never silently edit approved content or shift its effective time. This clarifies business-incompatibility handling under D050/D051, not technical-failure retry policy or a technical enum code.

Direct cancellation by an authorized Season Manager with reason/history was considered. Both alternatives included consistent replacement and activation checks; the Team Leader chose independent approval for cancellation, accepting two authorized people and pending-request/blocked-activation handling. Lifecycle/error codes, technical failures/retries, initial-version absence, baseline/conflict checks, other regulation-group impacts and concurrency mechanisms remain open. No scheduler, storage or notification technology is selected. See [Context v2 D051](../../context/use-cases/registration.md#d051---controlled-cancellation-replacement-and-activation-of-waiting-regulations).

## One approved future version per season

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q50, option A; Context decision [D050](../../context/use-cases/registration.md#d050---at-most-one-approved-future-regulation-version-per-season).

Allow at most one approved regulation version awaiting a future effective instant per season. While it exists, block approval of another version, including one intended for immediate effectivity. Further proposals may be drafted, but must be rechecked against currently effective regulations before approval. Cancellation or replacement follows the confirmed [D051](../../context/use-cases/registration.md#d051---controlled-cancellation-replacement-and-activation-of-waiting-regulations) workflow; approved content remains immutable.

Multiple approved future versions with timeline/dependency checks and possible downstream reapproval were considered. The Team Leader chose simpler full-version management and fewer conflicts, accepting inability to preapprove a sequence and the need to handle a waiting version before urgent approval. Cancellation/replacement authority, activation eligibility/failures, baseline/conflict checks and concurrency mechanisms remain open. No proposal-count limit is selected. See [Context v2 D050](../../context/use-cases/registration.md#d050---at-most-one-approved-future-regulation-version-per-season).

## Kickoff correction across catalog versions

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q49, option A; Context decision [D049](../../context/use-cases/results.md#d049---revalidate-events-when-corrected-kickoff-changes-the-applicable-catalog).

Actual kickoff may be corrected across a catalog-version boundary. Determine the catalog for the proposed corrected instant, revalidate all proposed report events and identify incompatibilities. The preparer must resolve them using the business basis; do not automatically remap types or delete events. Block submission/approval until errors are resolved. For official results, changes remain in a UC19 proposal while existing official kickoff, catalog and result remain effective. After a valid proposal receives another authorized person's approval, apply related changes consistently, recalculate statistics if necessary and preserve history.

Prohibiting cross-version kickoff correction once events exist was considered. The Team Leader chose controlled correction rather than leaving known errors outside the current workflow, accepting event-level errors and wider review. Draft persistence/error contracts, basis format, missing/ambiguous versions and concurrency mechanisms remain open. No new correction authority or automatic conversion is selected. See [Context v2 D049](../../context/use-cases/results.md#d049---revalidate-events-when-corrected-kickoff-changes-the-applicable-catalog).

## Recording and confirming actual kickoff

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q48, option A; Context decision [D048](../../context/use-cases/results.md#d048---record-actual-kickoff-in-the-report-and-confirm-it-with-the-official-result).

The Results Officer records actual kickoff from the match's business basis within UC16/UC17. The UI distinguishes it from scheduled start and must not silently treat scheduled time as confirmed actual kickoff. Require actual kickoff before submission for official-result confirmation. The authorized confirmer reviews it with the report under UC18 and [D005](../../context/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities)'s separation rule. After official confirmation, changes follow the approved UC19 correction process.

A separate actual-kickoff submission/approval workflow was considered. The Team Leader chose the existing report/result workflow and after-match entry, accepting no independent prior kickoff confirmation and revalidation when draft kickoff changes. Staff need not operate at kickoff. Basis format, precision/validation, pre-kickoff drafts, catalog-version crossing effects and technical contracts remain open. No Live Score integration or external timestamp authority is selected. See [Context v2 D048](../../context/use-cases/results.md#d048---record-actual-kickoff-in-the-report-and-confirm-it-with-the-official-result).

Confirmed follow-ups [D043](../../context/use-cases/registration.md#d043---immediate-or-future-regulation-effectivity-without-backdating)-[D047](../../context/use-cases/results.md#d047---bind-match-event-catalogs-to-recorded-actual-kickoff) below settle basic effective-time rules, competition-structure freezing, points/ranking-priority freezing, preservation of referenced goal/card type meanings and match-time catalog applicability. Earlier open-point notes retain their interview context; these follow-ups govern those aspects.

## Match event catalog applicability at actual kickoff

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q47, option A; Context decision [D047](../../context/use-cases/results.md#d047---bind-match-event-catalogs-to-recorded-actual-kickoff).

Use the goal/card catalog effective at recorded actual kickoff, recording that instant and the applicable regulation-version basis. Late entry or correction alone does not switch catalogs. A type withdrawn in a later version remains usable for a match whose applicable catalog included it; withdrawal affects matches starting when the new version is effective. Official-result correction still requires the confirmed authorized approval process and does not authorize automatic historical modification.

Using the current entry/correction-time catalog while retaining previously saved types was considered. The Team Leader chose match-time applicability and consistent late entry/history, accepting actual-kickoff recording, version references and historical catalog presentation. Actual-kickoff recording/confirmation/correction, missing or ambiguous effective versions, pre-kickoff draft behavior, withdrawal workflow and technical contracts remain open. This applies only to goal/card catalogs and selects no external API or Live Score design. See [Context v2 D047](../../context/use-cases/results.md#d047---bind-match-event-catalogs-to-recorded-actual-kickoff).

## Preserve referenced goal and card type meanings

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q46, option A; Context decision [D046](../../context/use-cases/registration.md#d046---preserve-codes-and-meanings-of-referenced-goal-and-card-types).

Once used, including in draft reports, a goal/card type retains its code and business meaning, including score/statistics treatment; prohibit deletion while referenced and code reuse for a different meaning. A different meaning requires a new type proposed and approved through a regulation version. Withdrawal from new-input selection may be proposed while preserving historical interpretation. Adding a type does not authorize new formulas or unapproved business behavior.

Allowing a code to carry different meanings by regulation version with explicit event-definition references was considered. The Team Leader chose stable references and simpler historical protection, accepting retention of unused types and inability to redefine an erroneously used type directly. Display-name corrections, withdrawal timing, match/event regulation binding, old-event corrections and catalog constraints remain open. No new type or calculation behavior is selected. See [Context v2 D046](../../context/use-cases/registration.md#d046---preserve-codes-and-meanings-of-referenced-goal-and-card-types).

## Points and ranking priority freeze

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q45, option A; Context decision [D045](../../context/use-cases/registration.md#d045---freeze-points-and-ranking-priority-after-the-first-official-result).

From the first officially confirmed result of the season, freeze win/draw/loss points and the priority order of ranking criteria. Subsequent regulation versions must retain these settings. Before this milestone, changes still follow [D042](../../context/use-cases/registration.md#d042---immutable-approved-versions-of-seasonal-regulations)/[D043](../../context/use-cases/registration.md#d043---immediate-or-future-regulation-effectivity-without-backdating) versioning and approval. UC19 result corrections and UC20 recalculation remain available under their applicable conditions using the frozen rules. The current project scope includes no unlocking workflow for these settings.

Separately approved mid-season changes with whole-season recalculation were considered. The Team Leader chose a consistent seasonal calculation basis and reduced processing/testing complexity, accepting inability to change these rules mid-season. Supported ranking criteria, ties, playoffs/relegation, future-version activation checks and concurrency contracts remain open. This decision does not resolve O05's remaining ranking policies. See [Context v2 D045](../../context/use-cases/registration.md#d045---freeze-points-and-ranking-priority-after-the-first-official-result).

## Competition structure freeze

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q44, option A; Context decision [D044](../../context/use-cases/registration.md#d044---freeze-competition-structure-after-initial-schedule-approval).

From the first approval of the initial season schedule, freeze the configured club count, competition format and number of legs, even before any match starts. Later regulation versions must preserve these settings. No unlocking or whole-schedule cancellation workflow to change structure is included in the current project scope. UC14 date/time or stadium adjustments for unplayed matches remain available subject to their separate conditions.

Permitting structural change before the first match through impact review, schedule replacement and renewed approval was considered. The Team Leader chose stable regulations/schedule consistency and reduced implementation/testing complexity, accepting reduced pre-kickoff flexibility. Club withdrawal/replacement, other regulation groups, pre-approval draft invalidation, future-version activation checks and concurrency contracts remain open. Supported formats are not selected by this decision. See [Context v2 D044](../../context/use-cases/registration.md#d044---freeze-competition-structure-after-initial-schedule-approval).

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q42, option A; Context decision [D042](../../context/use-cases/registration.md#d042---immutable-approved-versions-of-seasonal-regulations).

QĐ6 (PDF p.11) and UC06 (pp.79-82) require approval, effective times and historical preservation for seasonal regulation changes. Each approval establishes a distinct version containing the full seasonal regulation configuration. Approved content cannot be edited directly; changes require a new proposal and approval of a new version. Older versions remain available as historical business bases. Draft/pending versions do not replace effective regulations, and [D005](../../context/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities)'s separation of preparation and approval applies.

A single mutable current configuration with historical reconstruction from change logs was considered. The Team Leader chose explicit approved baselines and traceability, accepting configuration duplication and version/approval/effectivity management. Effective-time rules, in-season change limits, treatment of pending and approved records, exact references/capture points, proposal lifecycle and schema/API/concurrency contracts remain open. This decision does not authorize automatic retrospective revalidation or recalculation.

See [Context v2 D042](../../context/use-cases/registration.md#d042---immutable-approved-versions-of-seasonal-regulations).

## Effective-time policy

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q43, option A; Context decision [D043](../../context/use-cases/registration.md#d043---immediate-or-future-regulation-effectivity-without-backdating).

The proposal specifies immediate effectivity or a future instant for review. Immediate effectivity begins upon successful recording of approval. An approved future version does not replace current regulations before its approved instant. Backdating is prohibited. If approval is attempted after the proposed future instant has passed, reject it rather than silently switching to immediate effectivity; a revised proposal must be resubmitted. [D024](../../context/design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone) governs UTC comparison/storage and Vietnam-time input/display.

Immediate-only effectivity was considered. The Team Leader chose advance preparation and explicit time boundaries, accepting management of approved-but-not-yet-effective versions and possible resubmission. Exact equality/precision, transaction boundaries, future-version conflicts, replacement/cancellation, in-season limits, activation eligibility and treatment of pending/approved records remain open. This is not permission for every mid-season change or automatic recalculation of previous data, and selects no scheduler or storage technology. See [Context v2 D043](../../context/use-cases/registration.md#d043---immediate-or-future-regulation-effectivity-without-backdating).

### D042 english evidence

Current policy owner: [D042](../../context/use-cases/registration.md#d042---immutable-approved-versions-of-seasonal-regulations). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q42, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O07/O12; QĐ6, PDF p.11; UC06 pp.79-82; [D005](../../context/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities)/[D035](../../context/business.md#d035---stable-master-identity-with-selective-snapshots-of-official-business-information).

- **Alternatives/basis:** Immutable approved full versions versus one mutable current configuration with change-history reconstruction. The Team Leader chose explicit approved baselines and historical traceability, accepting duplicated configuration and version/approval/effectivity management.

- **Record:** [ADR 0010](0010-immutable-approved-season-regulation-versions.md); [glossary](../../context/GLOSSARY.md#authority-and-information-scope).

- **Affected Phases:** PHASE 2 regulations, PHASE 3 registration, PHASE 4 schedules, PHASE 5 results, PHASE 6/PHASE 7 statistics/reports and PHASE 10 verification. No Phase status changes.

- **Still open:** [D043](../../context/use-cases/registration.md#d043---immediate-or-future-regulation-effectivity-without-backdating) below settles basic effective-time rules. Detailed effectivity, in-season change restrictions, pending/approved record treatment, exact version references/capture points, proposal lifecycle and schema/API/concurrency contracts. [D042](../../context/use-cases/registration.md#d042---immutable-approved-versions-of-seasonal-regulations) does not approve automatic retrospective revalidation or recalculation.

### D043 english evidence

Current policy owner: [D043](../../context/use-cases/registration.md#d043---immediate-or-future-regulation-effectivity-without-backdating). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q43, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O07/O12; QĐ6.6, PDF p.11; UC06 pp.79-82; [D024](../../context/design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone)/[D042](../../context/use-cases/registration.md#d042---immutable-approved-versions-of-seasonal-regulations).

- **Alternatives/basis:** Immediate or future effectivity versus immediate-only approval. The Team Leader chose advance preparation and an explicit time boundary, accepting management of approved-but-not-yet-effective versions and resubmission when approval is late.

- **Record:** [ADR 0010](0010-immutable-approved-season-regulation-versions.md#effective-time-policy).

- **Affected Phases:** PHASE 2 regulations, PHASE 3-PHASE 7 dependent business work and PHASE 10 time-boundary verification. No Phase status changes.

- **Still open:** Exact equality/precision and transaction boundaries, overlapping future versions, replacement/cancellation, in-season change limits, activation eligibility checks and pending/approved record treatment. [D043](../../context/use-cases/registration.md#d043---immediate-or-future-regulation-effectivity-without-backdating) does not permit every type of change mid-season or automatically recalculate prior data. No activation scheduler, SQL type or library is selected.

### D044 english evidence

Current policy owner: [D044](../../context/use-cases/registration.md#d044---freeze-competition-structure-after-initial-schedule-approval). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q44, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O07/O10/O12; QĐ6.3, PDF p.11; QĐ2; UC13/UC14; [D042](../../context/use-cases/registration.md#d042---immutable-approved-versions-of-seasonal-regulations)/[D043](../../context/use-cases/registration.md#d043---immediate-or-future-regulation-effectivity-without-backdating).

- **Alternatives/basis:** Freeze at initial schedule approval versus permit structural changes before the first match through impact review, schedule replacement and renewed approval. The Team Leader chose consistency between regulations and the approved schedule and reduced implementation/testing complexity, accepting reduced flexibility before kickoff.

- **Record:** [ADR 0010](0010-immutable-approved-season-regulation-versions.md#competition-structure-freeze).

- **Affected Phases:** PHASE 2 regulations, PHASE 4 scheduling and PHASE 10 integrity verification. No Phase status changes.

- **Still open:** Club withdrawal/replacement policy, other regulation groups, pre-approval draft invalidation, future-version activation checks and transaction/concurrency contracts. [D044](../../context/use-cases/registration.md#d044---freeze-competition-structure-after-initial-schedule-approval) does not select supported competition formats or authorize changes outside existing approval/integrity conditions.

### D045 english evidence

Current policy owner: [D045](../../context/use-cases/registration.md#d045---freeze-points-and-ranking-priority-after-the-first-official-result). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q45, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O07/O12; QĐ5.2/QĐ5.3 and QĐ6.5, PDF pp.10-11; UC18-UC20; [D042](../../context/use-cases/registration.md#d042---immutable-approved-versions-of-seasonal-regulations)-[D044](../../context/use-cases/registration.md#d044---freeze-competition-structure-after-initial-schedule-approval).

- **Alternatives/basis:** Freeze after the first official result versus permit separately approved mid-season changes and recalculate the entire season. The Team Leader chose a consistent seasonal calculation basis and reduced processing/testing complexity, accepting inability to change these rules mid-season even with an organizing-committee basis.

- **Record:** [ADR 0010](0010-immutable-approved-season-regulation-versions.md#points-and-ranking-priority-freeze).

- **Affected Phases:** PHASE 2 regulations, PHASE 5 results/statistics, PHASE 6 lookup, PHASE 7 reports and PHASE 10 regression verification. No Phase status changes.

- **Still open:** Supported ranking criteria, tie handling, playoffs/relegation, future-version activation checks and transaction/concurrency contracts. [D045](../../context/use-cases/registration.md#d045---freeze-points-and-ranking-priority-after-the-first-official-result) settles a configuration-freeze milestone, not the remaining O05 ranking policies.

### D046 english evidence

Current policy owner: [D046](../../context/use-cases/registration.md#d046---preserve-codes-and-meanings-of-referenced-goal-and-card-types). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q46, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O07/O09/O12; QĐ3.3-QĐ3.5 and QĐ6.4; [D042](../../context/use-cases/registration.md#d042---immutable-approved-versions-of-seasonal-regulations)/[D043](../../context/use-cases/registration.md#d043---immediate-or-future-regulation-effectivity-without-backdating).

- **Alternatives/basis:** Stable referenced codes/meanings versus allowing the same code to have different definitions by regulation version, with each event bound to its definition. The Team Leader chose stable references and simpler history protection, accepting retention of unused types and inability to directly redefine an erroneously used type.

- **Record:** [ADR 0010](0010-immutable-approved-season-regulation-versions.md#preserve-referenced-goal-and-card-type-meanings).

- **Affected Phases:** PHASE 2 regulation catalogs, PHASE 5 match events/results, PHASE 6/PHASE 7 historical lookup/reports and PHASE 10 integrity verification. No Phase status changes.

- **Still open:** Display-name typo correction, detailed withdrawal workflow, correction of old events, catalog fields and technical constraints. [D047](../../context/use-cases/results.md#d047---bind-match-event-catalogs-to-recorded-actual-kickoff) below settles match-time catalog applicability. No new goal/card type or calculation behavior is selected.

### D047 english evidence

Current policy owner: [D047](../../context/use-cases/results.md#d047---bind-match-event-catalogs-to-recorded-actual-kickoff). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q47, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O07/O09/O12; QĐ6.4, UC16/UC19; [D042](../../context/use-cases/registration.md#d042---immutable-approved-versions-of-seasonal-regulations)/[D043](../../context/use-cases/registration.md#d043---immediate-or-future-regulation-effectivity-without-backdating)/[D046](../../context/use-cases/registration.md#d046---preserve-codes-and-meanings-of-referenced-goal-and-card-types).

- **Alternatives/basis:** Match-time applicability versus current catalog at entry/correction time while retaining previously saved types. The Team Leader chose rules aligned with the match as played and consistent late entry/history, accepting actual-kickoff recording, version references and historical catalog presentation.

- **Record:** [ADR 0010](0010-immutable-approved-season-regulation-versions.md#match-event-catalog-applicability-at-actual-kickoff); [glossary](../../context/GLOSSARY.md#authority-and-information-scope).

- **Affected Phases:** PHASE 2 regulations, PHASE 5 reports/results/corrections, PHASE 6/PHASE 7 history/reports and PHASE 10 temporal verification. No Phase status changes.

- **Still open:** [D048](../../context/use-cases/results.md#d048---record-actual-kickoff-in-the-report-and-confirm-it-with-the-official-result) below settles actual-kickoff recording/confirmation through the report/result workflow. Detailed kickoff correction effects, missing or ambiguous effective versions, draft behavior before kickoff is known, catalog withdrawal workflow and technical contracts. [D047](../../context/use-cases/results.md#d047---bind-match-event-catalogs-to-recorded-actual-kickoff) applies only to goal/card catalogs, not player-registration eligibility or every regulation group. No external API or Live Score design is selected.

### D048 english evidence

Current policy owner: [D048](../../context/use-cases/results.md#d048---record-actual-kickoff-in-the-report-and-confirm-it-with-the-official-result). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q48, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O07/O09/O12; UC16-UC19; [D005](../../context/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities)/[D047](../../context/use-cases/results.md#d047---bind-match-event-catalogs-to-recorded-actual-kickoff).

- **Alternatives/basis:** Record/review within the existing report/result workflow versus a separate submission/approval workflow for actual kickoff. The Team Leader chose reuse of existing responsibilities and support for after-match entry, accepting no independent prior confirmation of kickoff and revalidation needs when draft kickoff changes.

- **Record:** [ADR 0010](0010-immutable-approved-season-regulation-versions.md#recording-and-confirming-actual-kickoff).

- **Affected Phases:** PHASE 5 report/result/correction workflow and PHASE 10 validation; PHASE 2 regulation applicability integration. No Phase status changes.

- **Still open:** Basis format, field precision/validation, pre-kickoff draft behavior, technical contracts. [D049](../../context/use-cases/results.md#d049---revalidate-events-when-corrected-kickoff-changes-the-applicable-catalog) below settles correction across catalog versions. No Live Score integration or external timestamp authority is selected.

### D049 english evidence

Current policy owner: [D049](../../context/use-cases/results.md#d049---revalidate-events-when-corrected-kickoff-changes-the-applicable-catalog). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q49, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O07/O09/O12; UC16-UC20; [D005](../../context/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities)/[D036](../../context/business.md#d036---correct-erroneous-master-data-with-separate-review-of-affected-business-records)/[D047](../../context/use-cases/results.md#d047---bind-match-event-catalogs-to-recorded-actual-kickoff)/[D048](../../context/use-cases/results.md#d048---record-actual-kickoff-in-the-report-and-confirm-it-with-the-official-result).

- **Alternatives/basis:** Allow correction with full proposed-report revalidation versus prohibit cross-version kickoff corrections once events exist and leave exceptional handling outside current functionality. The Team Leader chose controlled correction of erroneous information, accepting event-level error presentation and potentially wider report review.

- **Record:** [ADR 0010](0010-immutable-approved-season-regulation-versions.md#kickoff-correction-across-catalog-versions).

- **Affected Phases:** PHASE 2 regulation applicability, PHASE 5 reports/results/corrections, PHASE 6/PHASE 7 dependent outputs and PHASE 10 integrity/regression verification. No Phase status changes.

- **Still open:** Draft persistence/error representation, supporting-basis format, missing or ambiguous applicable versions and transaction/concurrency contracts. No automatic event conversion or new correction authority is selected.

### D050 english evidence

Current policy owner: [D050](../../context/use-cases/registration.md#d050---at-most-one-approved-future-regulation-version-per-season). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q50, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O07/O12; [D042](../../context/use-cases/registration.md#d042---immutable-approved-versions-of-seasonal-regulations)/[D043](../../context/use-cases/registration.md#d043---immediate-or-future-regulation-effectivity-without-backdating).

- **Alternatives/basis:** One approved waiting version versus multiple future versions with timeline/dependency checks and possible downstream reapproval. The Team Leader chose simpler full-version management and fewer configuration conflicts, accepting inability to preapprove a sequence and the need to handle a waiting version before urgent approval.

- **Record:** [ADR 0010](0010-immutable-approved-season-regulation-versions.md#one-approved-future-version-per-season).

- **Affected Phases:** PHASE 2 regulation workflow and PHASE 10 validation/concurrency verification. No Phase status changes.

- **Still open:** [D051](../../context/use-cases/registration.md#d051---controlled-cancellation-replacement-and-activation-of-waiting-regulations) below settles cancellation/replacement authority, the controlled replacement exception and business-incompatibility checks at activation. Baseline/conflict checks, technical failures/retries and concurrency enforcement remain open. No new proposal-count limit or implementation mechanism is selected.

### D051 english evidence

Current policy owner: [D051](../../context/use-cases/registration.md#d051---controlled-cancellation-replacement-and-activation-of-waiting-regulations). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to grouped Q51, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the whole proposed policy package.

- **Source:** O07/O08/O12; UC06; [D005](../../context/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities)/[D042](../../context/use-cases/registration.md#d042---immutable-approved-versions-of-seasonal-regulations)-[D045](../../context/use-cases/registration.md#d045---freeze-points-and-ranking-priority-after-the-first-official-result)/[D050](../../context/use-cases/registration.md#d050---at-most-one-approved-future-regulation-version-per-season).

- **Alternatives/basis:** Separate proposal/approval for cancellation versus direct cancellation by an authorized Season Manager with a reason/history; both alternatives included consistent replacement and activation checks. The Team Leader chose independent responsibility control, accepting two authorized people and handling of requests still pending at effectivity or versions blocked from activation.

- **Record:** [ADR 0010](0010-immutable-approved-season-regulation-versions.md#controlled-cancellation-replacement-and-activation).

- **Affected Phases:** PHASE 2 regulation lifecycle, PHASE 3-PHASE 7 dependent business work and PHASE 10 boundary/concurrency verification. No Phase status changes.

- **Still open:** Detailed lifecycle/error codes, technical failure/retry handling, initial-version absence, baseline/conflict checks, other regulation-group impact policies and concurrency mechanisms. [D051](../../context/use-cases/registration.md#d051---controlled-cancellation-replacement-and-activation-of-waiting-regulations) does not select a scheduler, storage representation or notification technology.

### D052 english evidence

Current policy owner: [D052](../../context/use-cases/registration.md#d052---compatible-registration-rule-changes-and-revalidation-of-pending-records). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to grouped Q52, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the proposed policy package.

- **Source:** O01/O02/O07/O12; QĐ6.2, UC06/UC10/UC11; [D036](../../context/business.md#d036---correct-erroneous-master-data-with-separate-review-of-affected-business-records)/[D042](../../context/use-cases/registration.md#d042---immutable-approved-versions-of-seasonal-regulations)/[D043](../../context/use-cases/registration.md#d043---immediate-or-future-regulation-effectivity-without-backdating)/[D051](../../context/use-cases/registration.md#d051---controlled-cancellation-replacement-and-activation-of-waiting-regulations).

- **Alternatives/basis:** Controlled compatible changes versus freezing these conditions from the first approved registration. The Team Leader chose support for QĐ6.2 seasonal adjustment without mass revocation or grandfathering of incompatible current registrations, accepting impact checks and possible supplementation/change of pending records.

- **Record:** [ADR 0010](0010-immutable-approved-season-regulation-versions.md#registration-rule-changes-and-affected-records).

- **Affected Phases:** PHASE 2 regulations, PHASE 3 registration, PHASE 5 participation checks and PHASE 10 regression verification. No Phase status changes.

- **Still open:** Concrete homegrown/U21 criteria and values, registration windows/deadline exceptions, detailed record lifecycle and schema/concurrency contracts. This decision concerns player conditions and squad limits, not the deadline time basis; it does not introduce an additional approver into UC10.

## Q72 follow-up - Ranking-position parameter freeze

[D072](../../context/use-cases/registration.md#d072---seasonal-qualification-and-relegation-counts) explicitly extends D045's first-Official-Result freeze milestone to seasonal qualification/relegation counts Q/R. Approval evidence and the configuration trade-off are recorded in [ADR 0014](0014-shared-ranks-and-individual-awards.md#q72---seasonal-qualification-and-relegation-counts); existing approved-version/cancellation/activation rules remain unchanged.

## Q74 - Season closure and reopening

**Status:** accepted. **Decision:** D074. The Team Leader selected Q74 option A ("Tôi chọn A."), approving the full common package. Current policy is owned by [D074](../../context/use-cases/registration.md#d074---independently-approved-season-closure-and-reopening).

Choose independent proposal/approval by two authorized Season Managers rather than direct one-manager closure/reopening. This adds coordination for a season-wide write gate. Open/Closed transitions require explicit, nondelegable proposal/approval; dates or summary confirmation do not trigger them automatically. Closure requires a valid confirmed summary, resolved seasonal pending/future work and ended playing-registration intervals; it does not silently cancel registrations. Closed seasons preserve authorized lookup/export and independent shared-media management. Reopening permits existing correction workflows without unlocking frozen regulations or restoring permissions. Existing summary validity changes only when its official basis changes; final writes check both lifecycle and current session/authority. Technical workflow/error/concurrency details remain open; no implementation or whole-v2 approval is established.

## Q76 follow-up - Initial effective-regulation prerequisite

[D076](../../context/use-cases/registration.md#d076---separate-season-creation-authority-and-initial-regulation-gate) settles absence of an effective first version: allow staffing/preparation/drafts, block dependent business steps, and use no implicit template or prior-season baseline. First-version approval/effectivity still follows D005/D042/D043; an initial version that cannot validly activate leaves the gate closed. Approval evidence is in [ADR 0003](0003-season-scoped-business-permissions.md#q76---separate-season-creation-authority); technical activation/retry mechanisms remain open.

## Q89 - Technical activation recovery follow-up

**Status:** accepted. **Decision:** D089. The Team Leader confirmed Q89 option A and its whole package. [D089](../../context/design/architecture.md#d089---periodic-jobs-and-overdue-regulation-activation) settles the technical discovery/recovery questions left open in earlier rounds; [ADR 0001](0001-modular-layered-backend.md#q89---periodic-jobs-and-overdue-activation) records the execution-model trade-off. D051's business-incompatible Activation blocked outcome remains distinct from a rolled-back technical failure. Delayed processing preserves the approved time and history, and unresolved technical activation cannot silently allow dependent operations on stale regulations. Exact field/lock/error mappings remain open; no approved regulation content, approval responsibility or whole-package status is changed.
