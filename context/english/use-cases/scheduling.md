# Stadiums and scheduling: UC12-UC15

[Entry point](../README.md) · [Business/BM/QĐ](../business.md) · [Quality](../quality.md) · [Open decisions](../open-decisions.md)

Current UC flows retain source codes/pages and incorporate explicitly approved refinements. The authoritative rules for this domain are linked below; approval/source/rationale evidence is in English ADRs. These are Context documents, not generated feature Specifications. Analysis figures are not approved API/schema designs. See [sources](../sources.md).

## UC12

**Manage stadiums**

Source: §2.4.1.12, pp.97-99 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows management of stadiums used in the match schedule. Stadium data must identify the selected venue for a match and support venue-use conflict checks.

**Description:**

Create, update, and look up stadium information.

**Actors:**

Scheduling Officer.

**Preconditions:**

The user is logged in and authorized to manage stadiums.

**Postconditions:**

Valid stadium information is saved and can be used in scheduling.

**Main flow:**

1. The user opens stadium management.
2. The system displays the stadium list.
3. The user selects create, update, or lookup.
4. The system receives the information.
5. The system checks required data and duplicates.
6. The user confirms.
7. The system saves or displays the data.
8. The system reports the result.

**Alternative flow:**

The user searches stadiums: display matching stadiums.

**Exceptions:**

1. Invalid stadium information: reject saving.
2. A stadium is referenced by the schedule: check constraints before allowing changes affecting that schedule.
3. Data-save failure: preserve existing information.

## UC13

Current rules: [D060](scheduling.md#d060---automatic-fixture-pairing-with-manually-completed-schedule-drafts), [D061](scheduling.md#d061---seasonal-planning-intervals-and-system-wide-schedule-conflict-checks), [D062](scheduling.md#d062---schedule-approval-publishes-immediately-and-adjustments-are-versioned).

**Create the match schedule**

Source: §2.4.1.13, pp.100-103 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows authorized users to build the season schedule. It supports a configurable even club count from 4 through 20 under D060, with defaults of 20 clubs, 38 rounds and 380 matches, and each club pair meeting twice at home and away. The system must check club and stadium schedule conflicts.

**Description:**

Create and validate a season schedule under the approved competition format.

**Actors:**

Scheduling Officer; Organizing Committee / Season Manager.

**Preconditions:**

1. The season exists.
2. Participating clubs have been identified.
3. Required stadium data is available.
4. The season format is configured.

**Postconditions:**

1. A valid schedule is saved pending approval before official publication.
2. Each match is linked to its season, round, clubs, time, and stadium.
3. Operation history is recorded.

**Main flow:**

1. The officer selects the season to schedule.
2. The system loads clubs, format, and stadiums.
3. The officer enters or sets up the schedule using the implemented functionality.
4. The system checks round and match counts against the format.
5. The system checks each club pair's home/away legs.
6. The system checks whether a club is scheduled for two matches at the same time.
7. The system checks stadium-use conflicts.
8. The system displays validation results.
9. The officer corrects invalid items and requests revalidation.
10. Once valid, the officer confirms saving and submits the schedule for approval by an authorized Organizing Committee / Season Manager who did not prepare or edit it, under [D005](administration.md#d005---separate-preparation-and-approval-responsibilities)/[D062](#d062---schedule-approval-publishes-immediately-and-adjustments-are-versioned).
11. The system saves the schedule as pending approval and records the log.

**Alternative flow:**

1. The user enters the schedule in parts: validate entered matches and overall schedule consistency.
2. Insufficient schedule data: save an incomplete draft under [D060](scheduling.md#d060---automatic-fixture-pairing-with-manually-completed-schedule-drafts); it is not an official schedule.
3. The authorized independent approver approves the submitted schedule: publish immediately under [D062](scheduling.md#d062---schedule-approval-publishes-immediately-and-adjustments-are-versioned); return/rejection keeps it unpublished for revision.

**Exceptions:**

1. Incorrect round or match count: reject schedule confirmation.
2. Overlapping club matches or stadium conflicts: identify the affected matches.
3. A club pair lacks the required home/away legs: request correction.
4. Data-save failure: do not leave an official schedule only partially saved.

## UC14

Current rules: [D061](scheduling.md#d061---seasonal-planning-intervals-and-system-wide-schedule-conflict-checks), [D062](scheduling.md#d062---schedule-approval-publishes-immediately-and-adjustments-are-versioned).

**Adjust the match schedule**

Source: §2.4.1.14, pp.103-106 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows authorized users to change a match's time or stadium under the regulations. Recheck conflicts, retain history, and avoid distorting matches already played or confirmed result data.

**Description:**

Change schedule information for a match eligible for adjustment.

**Actors:**

Scheduling Officer; Organizing Committee / Season Manager.

**Preconditions:**

1. The match is in the schedule.
2. The user has adjustment permission.
3. The match meets the conditions for changes under the regulations.

**Postconditions:**

1. The new schedule is validly saved.
2. Before/after adjustment history is preserved.
3. Current schedule information reflects the new values.

**Main flow:**

1. The user finds and selects the match to adjust.
2. The system displays its current schedule and match status.
3. The user enters the new time or stadium and reason information under the defined process.
4. The system checks authority and adjustment conditions.
5. The system checks club and stadium conflicts.
6. The system displays before/after information.
7. Submit the versioned adjustment; another authorized approver, including eligible delegated authority, approves under [D005](administration.md#d005---separate-preparation-and-approval-responsibilities)/[D019](../design/access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix)/[D062](scheduling.md#d062---schedule-approval-publishes-immediately-and-adjustments-are-versioned).
8. The system saves the new schedule and adjustment history.
9. The system reports the result.

**Alternative flow:**

1. The user cancels before confirmation: do not change the schedule.
2. Approval required: record a pending request and retain the current schedule until a valid decision.

**Exceptions:**

1. Match already played or otherwise ineligible: reject.
2. New schedule conflicts: request another time or stadium.
3. Schedule changed concurrently: require reload and review before saving.
4. Storage failure: preserve the previous schedule.

## UC15

**Look up the match schedule**

Source: §2.4.1.15, pp.106-108 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows users to search published schedules by season, club, round, or time. This function only reads schedule data permitted for publication and does not change the schedule.

**Description:**

Search and view the schedule using filters.

**Actors:**

Public Viewer; Scheduling Officer; Organizing Committee / Season Manager.

**Preconditions:**

The system has schedule data permitted for publication.

**Postconditions:**

Display the schedule matching search conditions.

**Main flow:**

1. The user opens schedule lookup.
2. The system displays filters.
3. The user selects a season and search conditions.
4. The system checks access rights if any data is non-public.
5. The system finds matching schedule data.
6. The system displays matches and schedule information permitted for publication.

**Alternative flow:**

Without detailed filters: display the schedule within the defined default scope.

**Exceptions:**

1. No results: display an appropriate message.
2. Schedule data cannot be loaded: report the error without changing data.
## Current managed media behavior

Use [media policy](../design/media.md) for current logos, player portraits and fallback. These displays do not change the UC business authority or calculations.

## Current confirmed rules

The rules below are the authoritative current policy for this domain. The UC flows/source clauses above are read with these explicit refinements, not as a separate version. Approval evidence and interview-time notes are in the linked English ADR records; outstanding work is in [open decisions](../open-decisions.md).

### D060 - Automatic fixture pairing with manually completed schedule drafts

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md#d060-english-evidence).

- **Source:** O10/O12; QĐ2, UC13, TH-02; [D005](administration.md#d005---separate-preparation-and-approval-responsibilities)/[D044](registration.md#d044---freeze-competition-structure-after-initial-schedule-approval).

- **Supported scope:** First-version double round-robin with an even club count from 4 through 20, default 20. The 4-20 range is a confirmed v2 scope choice. Report odd counts, single-leg and other unsupported formats explicitly rather than generate an invalid schedule.

- **Input/generation:** The Scheduling Officer selects exactly the configured number of clubs, all with approved participation applications. Generate all rounds and pairings automatically, reversing home/away roles between legs: 2*(N-1) rounds and N*(N-1) matches; the default produces 38 rounds and 380 matches.

- **Completion:** Staff enter dates/times; suggest the registered home ground. Stadium substitutions remain subject to source approval conditions. No automatic complete calendar/venue optimization is required.

- **Drafts/approval:** Persist incomplete drafts with missing-field/conflict feedback; drafts are not public. Submit the entire initial schedule only after complete data, correct structure and successful club/stadium checks. Publication requires [D005](administration.md#d005---separate-preparation-and-approval-responsibilities) approval; do not approve the initial schedule in separate partial sections.

### D061 - Seasonal planning intervals and system-wide schedule conflict checks

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md#d061-english-evidence).

- **Source:** O03/O07/O10/O12; QĐ2.4-QĐ2.6, UC13/UC14; [D024](../design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone)/[D044](registration.md#d044---freeze-competition-structure-after-initial-schedule-approval)/[D060](scheduling.md#d060---automatic-fixture-pairing-with-manually-completed-schedule-drafts).

- **Parameters:** Require season-approved planned match duration, pre-match stadium preparation buffer and post-match release buffer, all in minutes. Duration is positive; buffers are nonnegative. Do not silently default to 90 minutes or any buffer. Lock all three from initial schedule approval in first-version scope.

- **Intervals:** Club use is [scheduled start, scheduled start + planned duration). Venue occupancy is [scheduled start - preparation buffer, planned end + release buffer). Reject overlapping club or stadium intervals; exact adjacency is permitted.

- **Scope:** Approved postponement releases allocations under [D067](#d067---approved-postponement-and-return-through-uc14). Check the same club or stadium system-wide, including other seasons. Validate a draft against itself and approved schedules; drafts and pending requests do not reserve capacity.

- **Approval/adjustment:** Recheck conflicts before successful approval, including concurrent requests. An adjustment replaces its own match's old allocation rather than conflicting with itself. Date/time/stadium changes still follow UC14.

- **Operational boundary:** These intervals support planning; actual kickoff remains recorded under [D047](results.md#d047---bind-match-event-catalogs-to-recorded-actual-kickoff)/[D048](results.md#d048---record-actual-kickoff-in-the-report-and-confirm-it-with-the-official-result) and does not automatically edit the approved schedule. First-version scope adds no minimum between-match rest or club travel-time constraint.

### D062 - Schedule approval publishes immediately and adjustments are versioned

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md#d062-english-evidence).

- **Source:** O08/O09/O10/O12; UC13-UC15; [D005](administration.md#d005---separate-preparation-and-approval-responsibilities)/[D019](../design/access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix)/[D044](registration.md#d044---freeze-competition-structure-after-initial-schedule-approval)/[D060](scheduling.md#d060---automatic-fixture-pairing-with-manually-completed-schedule-drafts)/[D061](scheduling.md#d061---seasonal-planning-intervals-and-system-wide-schedule-conflict-checks).

- **Initial lifecycle:** The Scheduling Officer drafts and submits a complete schedule; an authorized person other than its preparers/editors approves it. Successful approval publishes immediately, without a separate publication step.

- **Pending versions:** Submitted content is immutable. Before a decision the preparer may withdraw the submitted version; the approver may return it for supplementation or reject it with reasons. Changes and resubmission create a new version with history.

- **Regeneration:** Regenerate only while the initial schedule is still unapproved and in draft, with confirmation of replacement and traceability of the previous version. After publication, prohibit whole-schedule regeneration and changes to pairings, rounds or home/away roles.

- **Adjustments:** Propose date/time or stadium changes with reasons and before/after values. One proposal may cover several matches in the same season; approve/apply the entire proposal or none. The old schedule remains public pending approval.

- **Match eligibility:** Adjust only matches not yet started. If scheduled kickoff has passed, the approver must establish with supporting basis that the match has not taken place; elapsed scheduled time alone proves neither played nor unplayed status.

- **Final checks/publication:** Recheck match state, authority, schedule version and [D061](scheduling.md#d061---seasonal-planning-intervals-and-system-wide-schedule-conflict-checks) conflicts on adjustment approval. Changed underlying data requires review/resubmission. Successful approval updates the public schedule and preserves history. Retain [D005](administration.md#d005---separate-preparation-and-approval-responsibilities)/[D019](../design/access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix) authority and separation rules, including delegated adjustment approvers.

## POSTPONE-01 - First-version match postponement

**Scope:** CONFIRMED by Team Leader instruction on 2026-10-26 (Asia/Bangkok), after the initial specification. **Detailed authority/lifecycle:** CONFIRMED in D067, Q67 option A and the entire common package. This is an explicit current-package improvement, not a source Chapter 1-2 requirement.

- UC14 must support recording and displaying Postponed for a match unable to take place under its published schedule, distinctly from Not started, In progress and Ended.
- A business record, not elapsed scheduled time, establishes postponement. Require authorized recording, reason, operator, recording time and before/after history.
- Show the status on published schedules, match details and related lookup views. Do not expose internal reasons/operator details merely because status is public.
- New date/time/stadium use UC14, D062 approval/separation and D061 conflict checks. Unapproved proposed dates must not be presented as official. The previous time is historical context when shown for a postponed match, not a newly confirmed arrangement.
- Postponement does not create an Official Result or change standings/statistics. D063 report/result separation and ended-match confirmation gates remain binding.
- Do not expand to forfeits, permanent cancellation or interruption of an already-started match.
Authority, transitions and allocation follow [D067](#d067---approved-postponement-and-return-through-uc14).

### D067 - Approved postponement and return through UC14

**Confirmed policy:** Q67 option A and the entire common package, explicitly approved by the Team Leader. [Approval and rationale](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md#q67---postponement-approval-and-allocation).

- **Authority:** The Scheduling Officer prepares/submits a UC14 postponement request. The Season Manager or a valid delegated approver under D019 approves; the approver must differ from all preparers/editors. The existing delegated UC14 schedule-adjustment approval operation includes postponement; all other delegation conditions remain unchanged. No direct-manager exception to D005 is introduced.
- **Eligibility and pending work:** Only a not-yet-started match may be postponed; recheck at approval. Reject postponement for a started/ended match or a match with an Official Result. Pending requests do not establish the official Postponed state; retain D062 version, separation and final-check rules, including supporting basis when scheduled kickoff has passed.
- **Effective postponement:** Successful approval changes Not started to Postponed and records reason, preparer/operator, approver, time and before/after history. Public views show "Postponed - new schedule not yet determined"; any old date/time is clearly the pre-postponement schedule, not a confirmed replacement.
- **Allocation:** Effective postponement releases the old club-use and stadium-occupancy intervals from D061 conflict checking while retaining history. Until approval the old allocation remains effective. An unapproved replacement proposal reserves no capacity.
- **Approved return:** Only an approved UC14 date/time/stadium adjustment returns Postponed to Not started, after D061/D062 authority, state, version and conflict checks. Retain match identity, round, pairing and home/away roles. Postponed does not directly progress to In progress without this approved return.
- **Mistaken postponement:** Restoration also follows UC14 approval and conflict checks; no undo bypasses approval. Postponement or rescheduling creates no Official Result and changes no standings/statistics. Forfeits, permanent cancellation and interruption of an already-started match remain outside this addition.
