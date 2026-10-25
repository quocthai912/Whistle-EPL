# ADR 0011 - Registration intake and eligibility verification

## Required fields at registration milestones

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q59, option A; Context decision D059.

Require season code/name/start/end dates; club code/name/abbreviation; stadium code/name; player code/name/birth date/nationality/position. Club submission requires club/season/coach/home ground, representative name/phone/contact address and at least one proposed player checked at preparation level, without requiring an already effective registration. Player-validity confirmation requires player/club/season/shirt number, U21/homegrown conclusions, playing-effective start and relevant validation basis. Drafts may be incomplete; enforce completeness at the appropriate milestone.

A positive homegrown conclusion requires qualifying seasons/months branch and value, evidence summary/reference, with system-retained verifier/time/regulation version. Upload functionality is not mandatory. Notes are optional and additional identity papers are not required. D059's historical snapshot trade-off is recorded in [ADR 0009](0009-stable-identities-and-selective-business-snapshots.md#registration-snapshot-fields-and-seasonal-lookup). Detailed types/lengths/formats, normalization, position/nationality representation and technical contracts remain open. See [Context v2 D059](../../context/english/design/README.md#d059---required-registration-data-and-official-snapshot-milestones).

## Shirt-number constraints

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q58, option A; Context decision D058.

Require integer shirt numbers 1-99 at registration-validity confirmation. Confirmed registrations in the same club-season cannot share a number over overlapping playing-effective intervals, including U21 and future starts. Reuse is allowed after the old interval ends. Recorded history is not automatically overwritten by current number changes. The range is an explicitly approved v2 choice, not a source-PDF requirement.

D058's identity/duplicate trade-off is recorded in [ADR 0009](0009-stable-identities-and-selective-business-snapshots.md#business-codes-and-suspected-duplicates). Exact schema, temporal validation/concurrency and snapshot contracts remain open. See [Context v2 D058](../../context/english/design/README.md#d058---stable-business-codes-duplicate-review-and-temporal-shirt-number-uniqueness).

## Correction of validated registrations

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q57, option A; Context decision D057.

Correcting erroneous confirmed registration content/basis, classifications or recorded playing intervals, including history, requires a Registration Officer proposal and an authorized Season Manager's approval, return for supplementation or rejection. The approver differs from proposal preparers/editors. Record reason, basis, before/after values and related impacts. Pending review preserves the current official decision while new work uses corrected source data under D036.

Recheck conditions, limits and overlaps for affected intervals under the corresponding regulations; correction is not a waiver. If validity cannot be retained, propose an explicit disposition, such as ending effectivity or recording the prior decision as erroneous, without erasing historical existence. Identify affected reports/results for separate review; do not automatically change results, award losses or alter statistics. Official results still require UC19.

Officer self-application with the same evidence/history checks was considered. The Team Leader chose independent control of data used as a playing basis, accepting a new correction workflow and result-review coordination. This is an explicit v2 refinement of UC10; preserve the v1 text and do not add approval to initial validity confirmation or ordinary termination/transfers. Detailed fields, erroneous-decision representation, public historical display, lifecycle/error and concurrency contracts remain open. No automatic discipline, forfeiture or new UC is selected. See [Context v2 D057](../../context/english/design/README.md#d057---independently-approved-correction-of-validated-registrations).

## Playing effectivity and club transfers

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q56, option A; Context decision D056.

Validated registrations use [start, end) playing-effective intervals; end may remain unspecified until valid termination. Ordinary starts/terminations may take effect at successful recording or in the future, never before recording; historical correction is separate. Reject overlapping confirmed intervals for the same player/competition, including future starts and different seasons; adjacent intervals are permitted.

A UC10 club transfer records old-registration termination and new-registration start at a common instant consistently, only if the new registration passes all checks. Failure leaves the old registration intact. The Registration Officer needs authority over affected registrations/seasons, with reason/history; deadlines/exceptions, eligibility and limits still apply. Termination/transfer does not automatically delete prior appearances, goals or statistics.

Independent old-registration termination and new-registration creation was considered. The Team Leader chose consistent paired changes to prevent unintended loss of the old registration on failure, accepting coordination and planned-interval validation. Season closure, historical correction, time precision, future-plan changes/cancellation, quota checks across plans and technical contracts remain open. No financial subsystem, external service or database mechanism is selected. See [Context v2 D056](../../context/english/design/README.md#d056---playing-effective-intervals-and-consistent-club-transfers).

D053 settles windows/receipt exceptions, D054 U21/homegrown verification and D055 club/player registration workflows. Earlier open-point notes retain their interview context and are governed by confirmed follow-ups.

## Club and player registration workflows

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q55, option A; Context decision D055.

Club application states follow Draft -> Received -> Pending approval -> Approved/Rejected under UC08 and D005. Player registrations follow Draft -> Received -> Valid, confirmed by the Registration Officer after UC11 under UC10, without an extra manager approval. Received records or pending club applications may be returned for supplementation with reasons. Supplementation creates a new received version under D053. Submitted club content cannot be edited directly; withdraw/return it and submit a new version.

Allow cancellation before club approval or player-validity confirmation with reason/history. Rejected/cancelled versions are not edited into approved ones; resubmission is a new linked processing round. Keep one club-season application case across versions/rounds. Player lists can be prepared/checked before club approval, but individual registrations become valid only after club approval and their own UC10 checks/confirmation. Validity is distinct from playing effectivity.

Saving only successful player registrations while incomplete work remained on screen was considered. The Team Leader chose persisted incomplete work and traceable supplementation/collaboration, accepting state/version management. Both alternatives retained UC08/UC10 authority differences. Effectivity, termination/transfers, cancellation/withdrawal action details, required fields and technical enum/API/concurrency contracts remain open. See [Context v2 D055](../../context/english/design/README.md#d055---versioned-club-application-and-player-registration-workflows).

## U21 assessment and homegrown verification

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q54, option A; Context decision D054.

Require a seasonal U21 birth-date cutoff and qualifying homegrown training-age range in regulations submitted for approval; do not borrow missing values from external EPL rules. Actual seasonal values must be entered and approved. Source thresholds of at least three seasons or 36 months remain defaults, with changes governed by D052. U21 is automatically determined by birth date on or after the cutoff, using calendar dates rather than current age; missing birth date prevents a conclusion.

A Registration Officer checks homegrown evidence and records the qualifying-seasons or qualifying-months basis, conclusion, verifier, time and regulation version. Evidence must support the prescribed age range and English/Welsh association requirement. Without sufficient evidence, do not mark homegrown satisfied; non-homegrown treatment may be selected if limits and other conditions are met. U21/homegrown are independent attributes, neither inferred from nationality nor from one another. Evidence remains internal.

Automatic homegrown calculation from full multi-club training histories was considered. The Team Leader chose traceable staff verification at SE104 scope, accepting reliance on staff evidence quality. No automatic history accumulation, overlap handling or season/month conversion is included in the first version. Concrete seasonal values, evidence fields/formats, field validation, lifecycle and technical contracts remain open. No upload technology, external eligibility service or extra approval role is selected. See [Context v2 D054](../../context/english/design/README.md#d054---automatic-u21-assessment-and-evidence-based-staff-verification-of-homegrown-status).

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q53, option A; Context decision D053.

Maintain separate seasonal intake calendars for club applications and player registration/squad changes through regulation management. Each group supports multiple nonoverlapping windows with explicit [open, close) instants using D024; external EPL calendar defaults are not inherited. Assess timeliness using successful server receipt of the assessed application version, not draft creation or a user-declared timestamp. A timely version may be processed after closing; player conditions/limits still follow D052 at decision time. Supplementation or assessed-content changes create a new received version and require a new deadline check.

For a specific application/version, a Registration Officer may propose a receipt-deadline exception with a reason and basis for separate approval by an authorized Season Manager. The exception waives only receipt timing, not eligibility, limits or registration conflicts, and does not substitute for the registration-processing decision. Preserve receipt/calendar/exception history; do not rewrite calendars or backdate timestamps to legitimize prior receipts.

Requiring the next or an additional generally approved window instead of individual exceptions was considered. The Team Leader chose bounded case-specific flexibility under QĐ1.6, accepting an exception-approval step and possible exceptions for post-deadline supplementation. Concrete dates, detailed record/exception lifecycles and fields, eligibility and technical contracts remain open. No public submission portal, upload mechanism or extra general UC10 approval step is selected.

See [Context v2 D053](../../context/english/design/README.md#d053---registration-windows-receipt-deadlines-and-individual-exceptions).
