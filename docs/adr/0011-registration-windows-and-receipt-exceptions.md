# ADR 0011 - Registration intake and eligibility verification

This ADR records decisions and rationale; authoritative current rules are owned by [D053](../../context/english/use-cases/registration.md#d053---registration-windows-receipt-deadlines-and-individual-exceptions), [D054](../../context/english/use-cases/registration.md#d054---automatic-u21-assessment-and-evidence-based-staff-verification-of-homegrown-status), [D055](../../context/english/use-cases/registration.md#d055---versioned-club-application-and-player-registration-workflows), [D056](../../context/english/use-cases/registration.md#d056---playing-effective-intervals-and-consistent-club-transfers), [D057](../../context/english/use-cases/registration.md#d057---independently-approved-correction-of-validated-registrations). Historical open-point notes do not reopen subsequently confirmed policy.

## Required fields at registration milestones

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q59, option A; Context decision [D059](../../context/english/business.md#d059---required-registration-data-and-official-snapshot-milestones).

Require season code/name/start/end dates; club code/name/abbreviation; stadium code/name; player code/name/birth date/nationality/position. Club submission requires club/season/coach/home ground, representative name/phone/contact address and at least one proposed player checked at preparation level, without requiring an already effective registration. Player-validity confirmation requires player/club/season/shirt number, U21/homegrown conclusions, playing-effective start and relevant validation basis. Drafts may be incomplete; enforce completeness at the appropriate milestone.

A positive homegrown conclusion requires qualifying seasons/months branch and value, evidence summary/reference, with system-retained verifier/time/regulation version. Upload functionality is not mandatory. Notes are optional and additional identity papers are not required. [D059](../../context/english/business.md#d059---required-registration-data-and-official-snapshot-milestones)'s historical snapshot trade-off is recorded in [ADR 0009](0009-stable-identities-and-selective-business-snapshots.md#registration-snapshot-fields-and-seasonal-lookup). Detailed types/lengths/formats, normalization, position/nationality representation and technical contracts remain open. See [Context v2 D059](../../context/english/business.md#d059---required-registration-data-and-official-snapshot-milestones).

## Shirt-number constraints

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q58, option A; Context decision [D058](../../context/english/business.md#d058---stable-business-codes-duplicate-review-and-temporal-shirt-number-uniqueness).

Require integer shirt numbers 1-99 at registration-validity confirmation. Confirmed registrations in the same club-season cannot share a number over overlapping playing-effective intervals, including U21 and future starts. Reuse is allowed after the old interval ends. Recorded history is not automatically overwritten by current number changes. The range is an explicitly approved v2 choice, not a source-PDF requirement.

[D058](../../context/english/business.md#d058---stable-business-codes-duplicate-review-and-temporal-shirt-number-uniqueness)'s identity/duplicate trade-off is recorded in [ADR 0009](0009-stable-identities-and-selective-business-snapshots.md#business-codes-and-suspected-duplicates). Exact schema, temporal validation/concurrency and snapshot contracts remain open. See [Context v2 D058](../../context/english/business.md#d058---stable-business-codes-duplicate-review-and-temporal-shirt-number-uniqueness).

## Correction of validated registrations

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q57, option A; Context decision [D057](../../context/english/use-cases/registration.md#d057---independently-approved-correction-of-validated-registrations).

Correcting erroneous confirmed registration content/basis, classifications or recorded playing intervals, including history, requires a Registration Officer proposal and an authorized Season Manager's approval, return for supplementation or rejection. The approver differs from proposal preparers/editors. Record reason, basis, before/after values and related impacts. Pending review preserves the current official decision while new work uses corrected source data under [D036](../../context/english/business.md#d036---correct-erroneous-master-data-with-separate-review-of-affected-business-records).

Recheck conditions, limits and overlaps for affected intervals under the corresponding regulations; correction is not a waiver. If validity cannot be retained, propose an explicit disposition, such as ending effectivity or recording the prior decision as erroneous, without erasing historical existence. Identify affected reports/results for separate review; do not automatically change results, award losses or alter statistics. Official results still require UC19.

Officer self-application with the same evidence/history checks was considered. The Team Leader chose independent control of data used as a playing basis, accepting a new correction workflow and result-review coordination. This is an explicit v2 refinement of UC10; preserve the v1 text and do not add approval to initial validity confirmation or ordinary termination/transfers. Detailed fields, erroneous-decision representation, public historical display, lifecycle/error and concurrency contracts remain open. No automatic discipline, forfeiture or new UC is selected. See [Context v2 D057](../../context/english/use-cases/registration.md#d057---independently-approved-correction-of-validated-registrations).

## Playing effectivity and club transfers

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q56, option A; Context decision [D056](../../context/english/use-cases/registration.md#d056---playing-effective-intervals-and-consistent-club-transfers).

Validated registrations use [start, end) playing-effective intervals; end may remain unspecified until valid termination. Ordinary starts/terminations may take effect at successful recording or in the future, never before recording; historical correction is separate. Reject overlapping confirmed intervals for the same player/competition, including future starts and different seasons; adjacent intervals are permitted.

A UC10 club transfer records old-registration termination and new-registration start at a common instant consistently, only if the new registration passes all checks. Failure leaves the old registration intact. The Registration Officer needs authority over affected registrations/seasons, with reason/history; deadlines/exceptions, eligibility and limits still apply. Termination/transfer does not automatically delete prior appearances, goals or statistics.

Independent old-registration termination and new-registration creation was considered. The Team Leader chose consistent paired changes to prevent unintended loss of the old registration on failure, accepting coordination and planned-interval validation. Season closure, historical correction, time precision, future-plan changes/cancellation, quota checks across plans and technical contracts remain open. No financial subsystem, external service or database mechanism is selected. See [Context v2 D056](../../context/english/use-cases/registration.md#d056---playing-effective-intervals-and-consistent-club-transfers).

[D053](../../context/english/use-cases/registration.md#d053---registration-windows-receipt-deadlines-and-individual-exceptions) settles windows/receipt exceptions, [D054](../../context/english/use-cases/registration.md#d054---automatic-u21-assessment-and-evidence-based-staff-verification-of-homegrown-status) U21/homegrown verification and [D055](../../context/english/use-cases/registration.md#d055---versioned-club-application-and-player-registration-workflows) club/player registration workflows. Earlier open-point notes retain their interview context and are governed by confirmed follow-ups.

## Club and player registration workflows

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q55, option A; Context decision [D055](../../context/english/use-cases/registration.md#d055---versioned-club-application-and-player-registration-workflows).

Club application states follow Draft -> Received -> Pending approval -> Approved/Rejected under UC08 and [D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities). Player registrations follow Draft -> Received -> Valid, confirmed by the Registration Officer after UC11 under UC10, without an extra manager approval. Needs supplementation is an explicit alternate state: Received -> Needs supplementation for club/player records, and Pending approval -> Needs supplementation for club applications, with reasons. Resubmission follows Needs supplementation -> Received as a new version and repeats the applicable review/approval path. Supplementation creates a new received version under [D053](../../context/english/use-cases/registration.md#d053---registration-windows-receipt-deadlines-and-individual-exceptions). Submitted club content cannot be edited directly; withdraw/return it and submit a new version.

Allow cancellation before club approval or player-validity confirmation with reason/history. Rejected/cancelled versions are not edited into approved ones; resubmission is a new linked processing round. Keep one club-season application case across versions/rounds. Player lists can be prepared/checked before club approval, but individual registrations become valid only after club approval and their own UC10 checks/confirmation. Validity is distinct from playing effectivity, termination and club transfer, which follow [D056](../../context/english/use-cases/registration.md#d056---playing-effective-intervals-and-consistent-club-transfers).

Saving only successful player registrations while incomplete work remained on screen was considered. The Team Leader chose persisted incomplete work and traceable supplementation/collaboration, accepting state/version management. Both alternatives retained UC08/UC10 authority differences. Effectivity and termination/transfers follow D056. Cancellation/withdrawal action details, required fields and technical enum/API/concurrency contracts remain open. See [Context v2 D055](../../context/english/use-cases/registration.md#d055---versioned-club-application-and-player-registration-workflows).

## U21 assessment and homegrown verification

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q54, option A; Context decision [D054](../../context/english/use-cases/registration.md#d054---automatic-u21-assessment-and-evidence-based-staff-verification-of-homegrown-status).

Require a seasonal U21 birth-date cutoff and qualifying homegrown training-age range in regulations submitted for approval; do not borrow missing values from external EPL rules. Actual seasonal values must be entered and approved. Source thresholds of at least three seasons or 36 months remain defaults, with changes governed by [D052](../../context/english/use-cases/registration.md#d052---compatible-registration-rule-changes-and-revalidation-of-pending-records). U21 is automatically determined by birth date on or after the cutoff, using calendar dates rather than current age; missing birth date prevents a conclusion.

A Registration Officer checks homegrown evidence and records the qualifying-seasons or qualifying-months basis, conclusion, verifier, time and regulation version. Evidence must support the prescribed age range and English/Welsh association requirement. Without sufficient evidence, do not mark homegrown satisfied; non-homegrown treatment may be selected if limits and other conditions are met. U21/homegrown are independent attributes, neither inferred from nationality nor from one another. Evidence remains internal.

Automatic homegrown calculation from full multi-club training histories was considered. The Team Leader chose traceable staff verification at SE104 scope, accepting reliance on staff evidence quality. No automatic history accumulation, overlap handling or season/month conversion is included in the first version. Concrete seasonal values, evidence fields/formats, field validation, lifecycle and technical contracts remain open. No upload technology, external eligibility service or extra approval role is selected. See [Context v2 D054](../../context/english/use-cases/registration.md#d054---automatic-u21-assessment-and-evidence-based-staff-verification-of-homegrown-status).

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q53, option A; Context decision [D053](../../context/english/use-cases/registration.md#d053---registration-windows-receipt-deadlines-and-individual-exceptions).

Maintain separate seasonal intake calendars for club applications and player registration/squad changes through regulation management. Each group supports multiple nonoverlapping windows with explicit [open, close) instants using [D024](../../context/english/design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone); external EPL calendar defaults are not inherited. Assess timeliness using successful server receipt of the assessed application version, not draft creation or a user-declared timestamp. A timely version may be processed after closing; player conditions/limits still follow [D052](../../context/english/use-cases/registration.md#d052---compatible-registration-rule-changes-and-revalidation-of-pending-records) at decision time. Supplementation or assessed-content changes create a new received version and require a new deadline check.

For a specific application/version, a Registration Officer may propose a receipt-deadline exception with a reason and basis for separate approval by an authorized Season Manager. The exception waives only receipt timing, not eligibility, limits or registration conflicts, and does not substitute for the registration-processing decision. Preserve receipt/calendar/exception history; do not rewrite calendars or backdate timestamps to legitimize prior receipts.

Requiring the next or an additional generally approved window instead of individual exceptions was considered. The Team Leader chose bounded case-specific flexibility under QĐ1.6, accepting an exception-approval step and possible exceptions for post-deadline supplementation. Concrete dates, detailed record/exception lifecycles and fields, eligibility and technical contracts remain open. No public submission portal, upload mechanism or extra general UC10 approval step is selected.

See [Context v2 D053](../../context/english/use-cases/registration.md#d053---registration-windows-receipt-deadlines-and-individual-exceptions).

### D053 english evidence

Current policy owner: [D053](../../context/english/use-cases/registration.md#d053---registration-windows-receipt-deadlines-and-individual-exceptions). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to grouped Q53, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the proposed policy package.

- **Source:** O02/O07/O08/O12; QĐ1.6/QĐ6.2, UC06/UC08/UC10/UC11; [D024](../../context/english/design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone)/[D052](../../context/english/use-cases/registration.md#d052---compatible-registration-rule-changes-and-revalidation-of-pending-records).

- **Alternatives/basis:** Individual approved exceptions versus requiring the next window or an additional generally approved window. The Team Leader chose bounded case-specific flexibility under QĐ1.6, accepting an exception-approval step and possible exceptions for post-deadline supplementation.

- **Record:** [ADR 0011](0011-registration-windows-and-receipt-exceptions.md); [glossary](../../context/english/GLOSSARY.md#authority-and-information-scope).

- **Affected Phases:** PHASE 2 regulation calendars, PHASE 3 intake/registration and PHASE 10 time/permission verification. No Phase status changes.

- **Still open:** Concrete seasonal dates, record/exception lifecycle and required fields, eligibility details, schema/API/error/concurrency contracts. No public submission portal, file-upload mechanism or new general approval step in UC10 is selected.

### D054 english evidence

Current policy owner: [D054](../../context/english/use-cases/registration.md#d054---automatic-u21-assessment-and-evidence-based-staff-verification-of-homegrown-status). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to grouped Q54, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the proposed policy package.

- **Source:** O01/O07/O09/O12; QĐ1.2-QĐ1.4/QĐ6.2, UC10/UC11; [D024](../../context/english/design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone)/[D033](../../context/english/use-cases/publication.md#d033---internal-viewing-follows-business-responsibility)/[D052](../../context/english/use-cases/registration.md#d052---compatible-registration-rule-changes-and-revalidation-of-pending-records).

- **Alternatives/basis:** Automatic U21 plus staff-verified homegrown evidence versus automatic homegrown calculation from detailed training histories. The Team Leader chose traceable verification at SE104 scope, accepting dependence on staff evidence quality and no automatic proof of the full training history.

- **Record:** [ADR 0011](0011-registration-windows-and-receipt-exceptions.md#u21-assessment-and-homegrown-verification); [glossary](../../context/english/GLOSSARY.md#authority-and-information-scope).

- **Affected Phases:** PHASE 2 regulation configuration, PHASE 3 eligibility, PHASE 5 participation checks and PHASE 10 boundary/evidence verification. No Phase status changes.

- **Still open:** Concrete season parameter values, required evidence fields/formats, field validation, lifecycle and technical contracts. No file-upload technology, external eligibility service or extra approval role is selected.

### D055 english evidence

Current policy owner: [D055](../../context/english/use-cases/registration.md#d055---versioned-club-application-and-player-registration-workflows). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to grouped Q55, the Team Leader selected option A: “tôi chọn A.” (“I choose A.”), confirming the proposed policy package.

- **Source:** O02/O08/O09/O12; UC08/UC10/UC11; [D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities)/[D052](../../context/english/use-cases/registration.md#d052---compatible-registration-rule-changes-and-revalidation-of-pending-records)-[D054](../../context/english/use-cases/registration.md#d054---automatic-u21-assessment-and-evidence-based-staff-verification-of-homegrown-status).

- **Alternatives/basis:** Persist incomplete player-registration work with states/versions versus save only registrations passing validation while leaving incomplete entry on screen. The Team Leader chose traceable supplementation and collaboration, accepting extra workflow/version management. Both options retained the club workflow and UC08/UC10 authority difference.

- **Record:** [ADR 0011](0011-registration-windows-and-receipt-exceptions.md#club-and-player-registration-workflows); [glossary](../../context/english/GLOSSARY.md#authority-and-information-scope).

- **Affected Phases:** PHASE 3 application/registration workflow, PHASE 4 valid-club scheduling integration, PHASE 5 participation checks and PHASE 10 workflow verification. No Phase status changes.

- **Still open:** [D056](../../context/english/use-cases/registration.md#d056---playing-effective-intervals-and-consistent-club-transfers) below settles basic playing-effectivity/termination/transfer rules. Cancellation/withdrawal action details, required fields, enum/API/error and concurrency contracts. These business state names do not select technical enum codes.

### D056 english evidence

Current policy owner: [D056](../../context/english/use-cases/registration.md#d056---playing-effective-intervals-and-consistent-club-transfers). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to grouped Q56, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the proposed policy package.

- **Source:** O02/O08/O09/O12; QĐ1.5, UC10/UC11; [D024](../../context/english/design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone)/[D053](../../context/english/use-cases/registration.md#d053---registration-windows-receipt-deadlines-and-individual-exceptions)-[D055](../../context/english/use-cases/registration.md#d055---versioned-club-application-and-player-registration-workflows).

- **Alternatives/basis:** Consistent paired transfer versus independently terminating the old registration and creating the new one. Both alternatives used interval-based effectivity. The Team Leader chose no unintended loss of the old registration when the new one fails, accepting coordination and future-interval checks.

- **Record:** [ADR 0011](0011-registration-windows-and-receipt-exceptions.md#playing-effectivity-and-club-transfers); [glossary](../../context/english/GLOSSARY.md#authority-and-information-scope).

- **Affected Phases:** PHASE 3 registration/transfers, PHASE 5 appearance eligibility, PHASE 6/PHASE 7 history and PHASE 10 overlap/concurrency verification. No Phase status changes.

- **Still open:** [D057](../../context/english/use-cases/registration.md#d057---independently-approved-correction-of-validated-registrations) below settles historical-registration correction policy. Season closure effects, field/temporal precision, future-plan changes/cancellation, quota evaluation across planned intervals and technical contracts. No financial transfer subsystem, external service or database mechanism is selected.

### D057 english evidence

Current policy owner: [D057](../../context/english/use-cases/registration.md#d057---independently-approved-correction-of-validated-registrations). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to grouped Q57, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), explicitly approving this v2 refinement to UC10.

- **Source:** O02/O08/O09/O12; UC10/UC11/UC19; [D036](../../context/english/business.md#d036---correct-erroneous-master-data-with-separate-review-of-affected-business-records)/[D055](../../context/english/use-cases/registration.md#d055---versioned-club-application-and-player-registration-workflows)/[D056](../../context/english/use-cases/registration.md#d056---playing-effective-intervals-and-consistent-club-transfers).

- **Alternatives/basis:** Independent manager approval versus Registration Officer self-application with equivalent evidence/impact checks and history. The Team Leader chose independent control of data already used as a playing basis, accepting an added correction workflow and coordination with result correction.

- **Record:** [ADR 0011](0011-registration-windows-and-receipt-exceptions.md#correction-of-validated-registrations); [glossary](../../context/english/GLOSSARY.md#authority-and-information-scope).

- **Affected Phases:** PHASE 3 registration corrections, PHASE 5 match-impact review, PHASE 6/PHASE 7 historical outputs and PHASE 10 integrity verification. No Phase status changes.

- **Still open:** Detailed correction/impact fields, representation of an erroneous prior decision, historical public display, exact lifecycle/error and transaction/concurrency contracts. No automatic disciplinary action, match forfeiture or new UC is selected.

## Q74 follow-up - Closure prerequisites for playing registrations

[D074](../../context/english/use-cases/registration.md#d074---independently-approved-season-closure-and-reopening) requires playing intervals to end no later than closure and future registration plans to be resolved through UC10, without automatic cancellation by closing. Its approval and rationale are in [ADR 0010](0010-immutable-approved-season-regulation-versions.md#q74---season-closure-and-reopening). D056/D057 interval, authority, correction and historical-preservation rules remain binding; prospective plan-change/cancellation and quota policy are subsequently settled by D075 below; technical contracts remain open.

## Q75 - Prospective registration-plan changes

**Status:** accepted. **Decision:** D075. The Team Leader selected Q75 option A ("Tôi chọn A."), approving the full common package. Current policy is owned by [D075](../../context/english/use-cases/registration.md#d075---prospective-registration-plan-changes-and-interval-quota-checks).

Choose ordinary Registration Officer processing for prospective plan changes/cancellation rather than introducing manager approval for every such operation. D057 independent approval still applies to corrections of confirmed errors, including future-effective errors. Successor versions/history, explicit cancellation before effectivity and consistent paired transfer updates prevent accidental loss of the old registration. Restoring the old end on cancellation is conditional on validation, with conflicts/dependencies rejected instead of automatic cascading changes. Include confirmed future intervals in quota and shirt-number checks; retain current processing-time regulation/deadline, authority and Open-season gates. This supports D074 closure preparation without silently cancelling registrations or selecting technical storage/concurrency mechanisms.
