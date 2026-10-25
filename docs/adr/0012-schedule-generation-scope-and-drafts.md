# ADR 0012 - Schedule generation scope and drafts

## Schedule lifecycle and publication

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q62, option A; Context decision D062.

Initial schedules move from draft to complete submission and independent approval under D005. Approval publishes immediately. Submitted content is immutable; preparers may withdraw before a decision, approvers may return/reject with reasons, and edited resubmissions are new versions. Regeneration is limited to unapproved initial drafts with replacement confirmation and prior-version traceability. Published schedules cannot be regenerated wholesale or have pairings, rounds or home/away roles changed.

Date/time/stadium adjustment proposals retain reason and before/after values and may include multiple same-season matches, approved/applied all-or-none. Old public schedules remain until approval. Only not-yet-started matches may be adjusted; after scheduled kickoff the approver must establish with supporting basis that play has not occurred. Recheck match state, authority, schedule version and conflicts before approval; underlying changes require review/resubmission. Successful approval immediately updates public data and history. D005/D019 still govern delegated approval and separation.

Separate approval and publication was considered with otherwise identical workflow safeguards. The Team Leader chose fewer operations and no approved/public gap, accepting readiness to publish at approval. Exact codes, evidence fields, match-state recording, snapshots/display and technical transaction/API/concurrency contracts remain open. No notification service or publication scheduler is selected. See [Context v2 D062](../../context/english/design/README.md#d062---schedule-approval-publishes-immediately-and-adjustments-are-versioned).

D062 governs lifecycle/publication/regeneration aspects left open in earlier interview notes.

## Planning intervals and conflict checks

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q61, option A; Context decision D061.

Require season-approved planned duration (positive minutes), pre-match preparation and post-match release buffers (nonnegative minutes), without silent defaults. Freeze them at initial schedule approval. Club use is [scheduled start, start + duration); venue occupancy is [start - preparation buffer, planned end + release buffer). Reject overlapping club or venue use, permit exact adjacency and check shared identities system-wide across seasons.

Validate drafts against their own matches and approved schedules; drafts/pending requests do not reserve capacity. Recheck conflicts on approval with concurrency protection. Adjustments replace the same match's old allocation, subject to UC14. Actual kickoff remains D047/D048 report data and does not automatically edit approved schedules. No minimum club rest or travel-time rule is added to first-version scope.

Separate per-match playing/occupancy intervals were considered. The Team Leader chose lower data-entry cost and consistent checks, accepting reduced venue/match-specific flexibility. Concrete seasonal values, workflow/regeneration, snapshots and technical contracts remain open. Planning duration is not actual match duration. See [Context v2 D061](../../context/english/design/README.md#d061---seasonal-planning-intervals-and-system-wide-schedule-conflict-checks).

Earlier D060 open-point notes retain their interview context; D061 governs intervals and conflict checks.

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q60, option A; Context decision D060.

Support double round-robin with an even club count from 4 through 20, default 20; explicitly reject unsupported odd counts, single-leg or other formats. This range is a v2 scope choice. The Scheduling Officer selects exactly the configured number of clubs with approved applications. Automatically generate rounds/pairings and reversed home/away legs: 2*(N-1) rounds and N*(N-1) matches, producing the source default of 38 rounds/380 matches.

Staff complete dates/times, with registered home grounds suggested; stadium changes still require the source approval conditions. Save incomplete drafts with missing/conflict feedback, without public exposure. Submit only a complete valid initial schedule as a whole; publication requires D005 approval, without partial initial-schedule approvals.

Automatic complete calendar/venue allocation was considered. The Team Leader chose pairing automation plus manual completion for SE104 feasibility, accepting staff conflict resolution rather than availability/optimization machinery. Occupancy intervals/buffers, adjustment/version/publication details, regeneration safeguards, snapshots and technical contracts remain open. No match duration, buffer, algorithm library or generation-time target is selected.

See [Context v2 D060](../../context/english/design/README.md#d060---automatic-fixture-pairing-with-manually-completed-schedule-drafts).
