# ADR 0012 - Schedule generation scope and drafts

**Scope addition, 2026-10-26:** [POSTPONE-01](../../context/english/use-cases/scheduling.md#postpone-01---first-version-match-postponement) adds mandatory first-version postponement under existing UC14. Its authority, allocation and resumption policy were subsequently confirmed by Q67 / D067 below; interruption/cancellation/forfeit workflows remain unapproved.

This ADR records decisions and rationale; authoritative current rules are owned by [D060](../../context/english/use-cases/scheduling.md#d060---automatic-fixture-pairing-with-manually-completed-schedule-drafts), [D061](../../context/english/use-cases/scheduling.md#d061---seasonal-planning-intervals-and-system-wide-schedule-conflict-checks), [D062](../../context/english/use-cases/scheduling.md#d062---schedule-approval-publishes-immediately-and-adjustments-are-versioned). Historical open-point notes do not reopen subsequently confirmed policy.

## Schedule lifecycle and publication

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q62, option A; Context decision [D062](../../context/english/use-cases/scheduling.md#d062---schedule-approval-publishes-immediately-and-adjustments-are-versioned).

Initial schedules move from draft to complete submission and independent approval under [D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities). Approval publishes immediately. Submitted content is immutable; preparers may withdraw before a decision, approvers may return/reject with reasons, and edited resubmissions are new versions. Regeneration is limited to unapproved initial drafts with replacement confirmation and prior-version traceability. Published schedules cannot be regenerated wholesale or have pairings, rounds or home/away roles changed.

Date/time/stadium adjustment proposals retain reason and before/after values and may include multiple same-season matches, approved/applied all-or-none. Old public schedules remain until approval. Only not-yet-started matches may be adjusted; after scheduled kickoff the approver must establish with supporting basis that play has not occurred. Recheck match state, authority, schedule version and conflicts before approval; underlying changes require review/resubmission. Successful approval immediately updates public data and history. [D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities)/[D019](../../context/english/design/access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix) still govern delegated approval and separation.

Separate approval and publication was considered with otherwise identical workflow safeguards. The Team Leader chose fewer operations and no approved/public gap, accepting readiness to publish at approval. Exact codes, evidence fields, match-state recording, snapshots/display and technical transaction/API/concurrency contracts remain open. No notification service or publication scheduler is selected. See [Context v2 D062](../../context/english/use-cases/scheduling.md#d062---schedule-approval-publishes-immediately-and-adjustments-are-versioned).

[D062](../../context/english/use-cases/scheduling.md#d062---schedule-approval-publishes-immediately-and-adjustments-are-versioned) governs lifecycle/publication/regeneration aspects left open in earlier interview notes.

## Planning intervals and conflict checks

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q61, option A; Context decision [D061](../../context/english/use-cases/scheduling.md#d061---seasonal-planning-intervals-and-system-wide-schedule-conflict-checks).

Require season-approved planned duration (positive minutes), pre-match preparation and post-match release buffers (nonnegative minutes), without silent defaults. Freeze them at initial schedule approval. Club use is [scheduled start, start + duration); venue occupancy is [start - preparation buffer, planned end + release buffer). Reject overlapping club or venue use, permit exact adjacency and check shared identities system-wide across seasons.

Validate drafts against their own matches and approved schedules; drafts/pending requests do not reserve capacity. Recheck conflicts on approval with concurrency protection. Adjustments replace the same match's old allocation, subject to UC14. Actual kickoff remains [D047](../../context/english/use-cases/results.md#d047---bind-match-event-catalogs-to-recorded-actual-kickoff)/[D048](../../context/english/use-cases/results.md#d048---record-actual-kickoff-in-the-report-and-confirm-it-with-the-official-result) report data and does not automatically edit approved schedules. No minimum club rest or travel-time rule is added to first-version scope.

Separate per-match playing/occupancy intervals were considered. The Team Leader chose lower data-entry cost and consistent checks, accepting reduced venue/match-specific flexibility. Concrete seasonal values, workflow/regeneration, snapshots and technical contracts remain open. Planning duration is not actual match duration. See [Context v2 D061](../../context/english/use-cases/scheduling.md#d061---seasonal-planning-intervals-and-system-wide-schedule-conflict-checks).

Earlier [D060](../../context/english/use-cases/scheduling.md#d060---automatic-fixture-pairing-with-manually-completed-schedule-drafts) open-point notes retain their interview context; [D061](../../context/english/use-cases/scheduling.md#d061---seasonal-planning-intervals-and-system-wide-schedule-conflict-checks) governs intervals and conflict checks.

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q60, option A; Context decision [D060](../../context/english/use-cases/scheduling.md#d060---automatic-fixture-pairing-with-manually-completed-schedule-drafts).

Support double round-robin with an even club count from 4 through 20, default 20; explicitly reject unsupported odd counts, single-leg or other formats. This range is a v2 scope choice. The Scheduling Officer selects exactly the configured number of clubs with approved applications. Automatically generate rounds/pairings and reversed home/away legs: 2*(N-1) rounds and N*(N-1) matches, producing the source default of 38 rounds/380 matches.

Staff complete dates/times, with registered home grounds suggested; stadium changes still require the source approval conditions. Save incomplete drafts with missing/conflict feedback, without public exposure. Submit only a complete valid initial schedule as a whole; publication requires [D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities) approval, without partial initial-schedule approvals.

Automatic complete calendar/venue allocation was considered. The Team Leader chose pairing automation plus manual completion for SE104 feasibility, accepting staff conflict resolution rather than availability/optimization machinery. Occupancy intervals/buffers, adjustment/version/publication details, regeneration safeguards, snapshots and technical contracts remain open. No match duration, buffer, algorithm library or generation-time target is selected.

See [Context v2 D060](../../context/english/use-cases/scheduling.md#d060---automatic-fixture-pairing-with-manually-completed-schedule-drafts).

### D060 english evidence

Current policy owner: [D060](../../context/english/use-cases/scheduling.md#d060---automatic-fixture-pairing-with-manually-completed-schedule-drafts). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to grouped Q60, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O10/O12; QĐ2, UC13, TH-02; [D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities)/[D044](../../context/english/use-cases/registration.md#d044---freeze-competition-structure-after-initial-schedule-approval).

- **Alternatives/basis:** Automatic pairings/rounds/home-away with manual completion versus automatic dates/times/venue assignment as well. The Team Leader chose useful automation at SE104 scope, accepting staff allocation/conflict resolution instead of availability datasets and an optimization engine.

- **Record:** [ADR 0012](0012-schedule-generation-scope-and-drafts.md).

- **Affected Phases:** PHASE 2 supported regulation configuration, PHASE 4 generation/drafts/approval, PHASE 6 published lookup and PHASE 10 schedule verification. No Phase status changes.

- **Still open:** [D061](../../context/english/use-cases/scheduling.md#d061---seasonal-planning-intervals-and-system-wide-schedule-conflict-checks) below settles playing/venue planning intervals and buffers. [D062](../../context/english/use-cases/scheduling.md#d062---schedule-approval-publishes-immediately-and-adjustments-are-versioned) below settles adjustment/version/publication and regeneration policy. Snapshot/schema/API/concurrency contracts. No 90-minute duration, buffer, algorithm library or generation-time target is assumed.

### D061 english evidence

Current policy owner: [D061](../../context/english/use-cases/scheduling.md#d061---seasonal-planning-intervals-and-system-wide-schedule-conflict-checks). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to grouped Q61, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the proposed interval/conflict package.

- **Source:** O03/O07/O10/O12; QĐ2.4-QĐ2.6, UC13/UC14; [D024](../../context/english/design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone)/[D044](../../context/english/use-cases/registration.md#d044---freeze-competition-structure-after-initial-schedule-approval)/[D060](../../context/english/use-cases/scheduling.md#d060---automatic-fixture-pairing-with-manually-completed-schedule-drafts).

- **Alternatives/basis:** Derive intervals from common seasonal parameters versus enter separate playing/occupancy intervals per match. The Team Leader chose less per-match data entry and consistent checks at SE104 scale, accepting reduced venue/match-specific flexibility.

- **Record:** [ADR 0012](0012-schedule-generation-scope-and-drafts.md#planning-intervals-and-conflict-checks); [glossary](../../context/english/GLOSSARY.md#authority-and-information-scope).

- **Affected Phases:** PHASE 2 regulation parameters, PHASE 4 scheduling/adjustments, PHASE 6 schedule lookup and PHASE 10 boundary/concurrency verification. No Phase status changes.

- **Still open:** Concrete per-season minute values, snapshot/schema/API and technical concurrency contracts. [D062](../../context/english/use-cases/scheduling.md#d062---schedule-approval-publishes-immediately-and-adjustments-are-versioned) below settles adjustment/publication/regeneration policy. No interval may be treated as a factual actual match duration.

### D062 english evidence

Current policy owner: [D062](../../context/english/use-cases/scheduling.md#d062---schedule-approval-publishes-immediately-and-adjustments-are-versioned). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to grouped Q62, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the lifecycle/publication package.

- **Source:** O08/O09/O10/O12; UC13-UC15; [D005](../../context/english/use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities)/[D019](../../context/english/design/access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix)/[D044](../../context/english/use-cases/registration.md#d044---freeze-competition-structure-after-initial-schedule-approval)/[D060](../../context/english/use-cases/scheduling.md#d060---automatic-fixture-pairing-with-manually-completed-schedule-drafts)/[D061](../../context/english/use-cases/scheduling.md#d061---seasonal-planning-intervals-and-system-wide-schedule-conflict-checks).

- **Alternatives/basis:** Immediate publication on approval versus a separate approved-but-unpublished state and Season Manager publication action, with the same other workflow safeguards. The Team Leader chose fewer operations and no gap between approved and public versions, accepting that approvers must be ready for immediate publication.

- **Record:** [ADR 0012](0012-schedule-generation-scope-and-drafts.md#schedule-lifecycle-and-publication).

- **Affected Phases:** PHASE 4 schedule workflow/adjustments, PHASE 6 publication/history and PHASE 10 workflow/concurrency verification. No Phase status changes.

- **Still open:** Exact action/state codes, supporting-basis fields, match-state recording, snapshot/display details and transaction/API/concurrency contracts. No notification service or automatic publication scheduler is selected.

## Q67 - Postponement approval and allocation

**Status:** accepted. **Decision:** D067 / POSTPONE-01. **Approval evidence:** The Team Leader explicitly selected option A and the entire common package: "Tôi chọn A cùng toàn bộ gói quy tắc chung."

The authoritative current policy is [D067](../../context/english/use-cases/scheduling.md#d067---approved-postponement-and-return-through-uc14). Retain UC14 preparation/independent approval and existing D019 delegated adjustment approval for postponement, rather than allowing a direct Season Manager emergency exception to D005. This reuses the established workflow, accepting a second person's approval before postponement becomes public.

The approved package releases old club/stadium allocations only on effective postponement and requires approved, conflict-checked UC14 rescheduling to return to Not started, including correction of a mistaken postponement. Pending replacements reserve no capacity. Identity/history and official-result/statistical authority are preserved; no forfeits, permanent cancellation or started-match interruption are added. This resolves the earlier pending-Q67 note without changing source Chapters 1-2 or Phase completion.

## Q93 - Deterministic generation and draft replacement

**Status:** accepted. **Decision:** D093. **Approver:** Team Leader. The Team Leader answered "Tôi chọn A." to Q93, approving the entire package. [D093](../../context/english/use-cases/scheduling.md#d093---deterministic-fixture-generation-and-stable-published-match-identity) owns generation/replacement/identity; D060-D062 retain scope and approval/adjustment rules.

Choose deterministic circle pairing with a fresh replacement draft rather than carrying forward manually entered dates/venues for matching pairs. Stable sorted inputs and a stored algorithm version support repeatability; clearing manual values avoids silently retaining invalid allocations at the cost of re-entry after explicit confirmation. Keep the replaced draft read-only with actor/time/reason, and preserve the complete current draft if replacement fails. Stable Match UUIDs are created atomically at initial schedule approval, separately from draft-item identifiers, with directed season/home/away uniqueness; later adjustments, postponement and reports retain those UUIDs. The full package preserves structural validation across N=4..20, D061 conflict checks, independent complete approval and the prohibition on whole-schedule regeneration after publication. No calendar optimization, additional sporting constraint, implementation or whole-v2/Phase approval is selected. Earlier open algorithm/regeneration notes are historical for this settled policy; exact physical/API/lock mappings remain elaboration.
