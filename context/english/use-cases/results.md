# Match reports, results, and statistics: UC16-UC20

[Entry point](../README.md) · [Business/BM/QĐ](../business.md) · [Quality](../quality.md) · [Open decisions](../open-decisions.md)

Current UC flows retain source codes/pages and incorporate explicitly approved refinements. The authoritative rules for this domain are linked below; approval/source/rationale evidence is in English ADRs. These are Context documents, not generated feature Specifications. Analysis figures are not approved API/schema designs. See [sources](../sources.md).

## UC16

Current rules: [D047](results.md#d047---bind-match-event-catalogs-to-recorded-actual-kickoff), [D048](results.md#d048---record-actual-kickoff-in-the-report-and-confirm-it-with-the-official-result), [D063](results.md#d063---separate-match-report-version-and-official-result-lifecycles), [D064](results.md#d064---kickoff-based-appearance-eligibility-and-report-defined-goalkeepers), [D065](results.md#d065---structured-event-minutes-score-checks-and-referee-signature-references).

**Create a match report**

Source: §2.4.1.16, pp.109-112 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows authorized users to create a report for a validly scheduled match. It records player appearances and match events, including goals, scoring times, goal types, and cards. Data must provide sufficient basis for score validation and result confirmation.

**Description:**

Create a match report and record match information and events.

**Actors:**

Results Officer.

**Preconditions:**

1. The match has a valid schedule.
2. The operator has permission to create match reports.
3. Related player and registration data can be checked.

**Postconditions:**

The match report is saved in a status appropriate to the process; creating it alone does not make the result official.

**Main flow:**

1. The user selects the match.
2. The system checks that the match has a valid schedule.
3. The system displays match information and related registered players.
4. The user enters both teams' appearance lists.
5. Check club-season registration at actual kickoff and report-position goalkeeper completeness under [D064](results.md#d064---kickoff-based-appearance-eligibility-and-report-defined-goalkeepers).
6. The user records goals, goal types, regulation/stoppage-time minutes, yellow/red cards, and related players/clubs.
7. The system checks event completeness and consistency.
8. The user saves the match report.
9. The system records report status and reports the result.

**Alternative flow:**

An unfinished report can continue to be updated before proceeding to confirmation under the process.

**Exceptions:**

1. Player belongs to the wrong club or lacks valid registration: reject that player's inclusion in the appearance list.
2. Event lacks a required type or time: request completion.
3. Score does not match recorded goals: do not allow the report to be confirmed as valid.
4. Data-save failure: do not leave an inconsistent match report.

## UC17

**Update a match result**

Source: §2.4.1.17, pp.112-114 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows authorized users to update result data from a match report. The updated result is not automatically official; official recognition is performed through UC18 - Confirm a match result.

**Description:**

Update the score and result data based on the match report.

**Actors:**

Results Officer.

**Preconditions:**

1. The match exists and is validly scheduled.
2. A match report or result data is available for updating.
3. The operator has update permission.

**Postconditions:**

Save the result pending confirmation or in the corresponding agreed status; do not use it as an official result before UC18.

**Main flow:**

1. The user selects the match.
2. The system loads the report and existing result.
3. The user updates the score or result information using match data.
4. The system checks consistency between the score and goal events.
5. The system checks match status and update permission.
6. The user confirms saving the updated data.
7. The system saves the result in the appropriate status.
8. The system records the log and reports the result.

**Alternative flow:**

No data changed: retain the existing result.

**Exceptions:**

1. Score does not match goal events: reject saving it as a valid result.
2. Result already officially confirmed: do not use the ordinary update process; use UC19 - Correct a confirmed match result within approved scope and authority.
3. Insufficient permissions or concurrently changed data: reject or require reload.
4. Data-save failure: preserve the previous state.

## UC18

Current rules: [D063](results.md#d063---separate-match-report-version-and-official-result-lifecycles), [D064](results.md#d064---kickoff-based-appearance-eligibility-and-report-defined-goalkeepers), [D065](results.md#d065---structured-event-minutes-score-checks-and-referee-signature-references).

**Confirm a match result**

Source: §2.4.1.18, pp.115-118 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows authorized users to validate and confirm an official result after the match ends. The system must ensure consistency with the match report, prevent repeated confirmation, and avoid partial updates to dependent data. After successful confirmation, standings, statistics, and related reports must reflect the recognized result.

**Description:**

Validate and transition a match result to official status.

**Actors:**

Organizing Committee / Season Manager.

**Preconditions:**

1. The match has ended.
2. The match report and result have been updated.
3. The operator has confirmation permission.
4. The match result has not yet been officially confirmed.

**Postconditions:**

1. The result is marked official.
2. Standings and related statistics are recalculated or synchronized.
3. The confirmation log is recorded.
4. Reports based on official results can use the new data.

**Main flow:**

1. The confirmer selects the match.
2. The system loads match status, report, and result.
3. The system checks confirmation permission.
4. The system checks that the match has ended and is not yet confirmed.
5. The system validates the appearance list, player registrations, and match events.
6. The system checks goal types, times, own goals, cards, and score consistency.
7. The system displays the data to confirm.
8. The user confirms.
9. The system saves official result status.
10. The system updates standings and related statistics and records the log in a consistent process.
11. The system reports the result.

**Alternative flow:**

1. The confirmer finds data requiring correction: cancel confirmation and return to authorized data updating.
2. Result already confirmed: report its current status and do not confirm again.

**Exceptions:**

1. Match not ended or invalid report: reject confirmation.
2. Insufficient permissions: reject.
3. Result data changed concurrently: require reload and review.
4. Failure while updating the result, standings, or statistics: do not leave an official result with stale dependent data.

## UC19

Current rules: [D005](administration.md#d005---separate-preparation-and-approval-responsibilities), [D049](results.md#d049---revalidate-events-when-corrected-kickoff-changes-the-applicable-catalog), [D063](results.md#d063---separate-match-report-version-and-official-result-lifecycles).

**Correct a confirmed match result**

Source: §2.4.1.19, pp.118-121 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows authorized users to correct an officially confirmed result on a valid basis. Because the result affects standings, statistics, and reports, preserve before/after history, check permissions, and process the change consistently. Direct updates that leave dependent data incorrect are not permitted.

**Description:**

Correct an official result with valid authority and basis while updating dependent data.

**Actors:**

Organizing Committee / Season Manager; Results Officer (if authorized).

**Preconditions:**

1. The match has an official result.
2. The operator has correction permission.
3. A basis and reason for the correction exist under the approved process.

**Postconditions:**

1. The new result is validly saved.
2. Before/after history and the correction reason are recorded.
3. Standings, statistics, and related reports are updated consistently.
4. The operation log is saved.

**Main flow:**

1. The user selects a match with a confirmed result.
2. The system loads the current result and correction history.
3. The user enters corrected data and a reason.
4. The system checks permissions, match status, and current data.
5. The system validates the report, goal/card events, and score consistency.
6. The system detects whether data changed after the user opened it.
7. The system displays before/after data.
8. Submit the correction version for another authorized person to approve under [D005](administration.md#d005---separate-preparation-and-approval-responsibilities)/[D049](results.md#d049---revalidate-events-when-corrected-kickoff-changes-the-applicable-catalog)/[D063](results.md#d063---separate-match-report-version-and-official-result-lifecycles).
9. After valid approval, save the new result and correction history; keep the previous official result while pending.
10. The system recalculates standings, statistics, and affected report data.
11. The system records the log and reports the result.

**Alternative flow:**

1. The user cancels before confirmation: leave data unchanged.
2. Supporting evidence for a correction is incomplete: request completion before processing.

**Exceptions:**

1. Insufficient permissions: reject.
2. Current result changed concurrently: require reload and confirmation against the latest data.
3. Invalid correction data: reject the update.
4. Failure saving the result or updating dependent data: do not leave partial updates.
5. Effective regulations cannot be identified: do not infer correction rules.

## UC20

Current rules: [D064](results.md#d064---kickoff-based-appearance-eligibility-and-report-defined-goalkeepers), [D066](publication.md#d066---shared-standings-ranks-and-shared-individual-awards).

**Update standings and statistics**

Source: §2.4.1.20, pp.121-123 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Status: Internal processing, not an independent function allowing users to change points arbitrarily.

**Description:**

Calculate and synchronize seasonal standings and player statistics from confirmed match results.

**Actors:**

No separate initiating actor; the system runs automatically after UC18 - Confirm a match result or UC19 - Correct a confirmed match result.

**Preconditions:**

1. An official result has been validly confirmed or corrected.
2. The season's points and ranking regulations have been identified.

**Postconditions:**

Standings and player statistics accurately reflect the related official results.

**Main flow:**

1. UC18 or UC19 triggers updates to standings and related statistics.
2. The system retrieves related official results.
3. The system calculates matches, wins, draws, losses, goals for, goals against, goal difference, and points.
4. The system applies ranking criteria and configured seasonal tiebreakers.
5. The system updates player goals from valid goal events, excluding own goals from individual totals.
6. The system calculates goalkeeper clean sheets from official results and appearance lists under QĐ5.7.
7. The system saves or synchronizes standings and player statistics.
8. The system reports processing results to the calling business operation.

**Alternative flow:**

No standings-affecting change: unaffected data need not be recalculated.

**Exceptions:**

1. Effective ranking regulations cannot be identified: do not apply another season's rules.
2. Calculation or storage failure: do not leave standings/player statistics partially updated.
## Current managed media behavior

Use [media policy](../design/media.md) for current logos, player portraits and fallback. These displays do not change the UC business authority or calculations.

## Current confirmed rules

The rules below are the authoritative current policy for this domain. The UC flows/source clauses above are read with these explicit refinements, not as a separate version. Approval evidence and interview-time notes are in the linked English ADR records; outstanding work is in [open decisions](../open-decisions.md).

### D047 - Bind match event catalogs to recorded actual kickoff

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d047-english-evidence).

- **Source:** O07/O09/O12; QĐ6.4, UC16/UC19; [D042](registration.md#d042---immutable-approved-versions-of-seasonal-regulations)/[D043](registration.md#d043---immediate-or-future-regulation-effectivity-without-backdating)/[D046](registration.md#d046---preserve-codes-and-meanings-of-referenced-goal-and-card-types).

- **Decision:** Use the goal/card catalog effective at the match's recorded actual kickoff, rather than the data-entry or correction time. Record that actual-start instant and the applicable regulation-version basis. Late entry or correction does not by itself switch the match to a newer catalog.

- **Withdrawal boundary:** A type withdrawn in a later regulation version remains available for a match whose applicable catalog included it. The withdrawal affects matches starting when the new version is effective, while preserving historical event interpretation.

- **Official corrections:** Corrections to official results still require the confirmed authorized approval process; no automatic historical data modification is authorized.

### D048 - Record actual kickoff in the report and confirm it with the official result

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d048-english-evidence).

- **Source:** O07/O09/O12; UC16-UC19; [D005](administration.md#d005---separate-preparation-and-approval-responsibilities)/[D047](results.md#d047---bind-match-event-catalogs-to-recorded-actual-kickoff).

- **Decision:** The Results Officer enters actual kickoff from the match's business basis within UC16/UC17. Distinguish scheduled and actual start in the UI; do not silently treat the scheduled time as confirmed actual kickoff. Actual kickoff is mandatory before submitting the result for official confirmation.

- **Confirmation/correction:** The authorized confirmer reviews this instant together with the report under UC18 and [D005](administration.md#d005---separate-preparation-and-approval-responsibilities)'s separation rule. After official confirmation, changing actual kickoff must use the approved UC19 correction process. There is no separate actual-kickoff approval workflow.

- **Operational scope:** Entry may occur after the match; staff are not required to operate the system at kickoff. The report's catalog/events require rechecking if draft actual kickoff changes; detailed handling of a version-boundary crossing remains open.

### D049 - Revalidate events when corrected kickoff changes the applicable catalog

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d049-english-evidence).

- **Source:** O07/O09/O12; UC16-UC20; [D005](administration.md#d005---separate-preparation-and-approval-responsibilities)/[D036](../business.md#d036---correct-erroneous-master-data-with-separate-review-of-affected-business-records)/[D047](results.md#d047---bind-match-event-catalogs-to-recorded-actual-kickoff)/[D048](results.md#d048---record-actual-kickoff-in-the-report-and-confirm-it-with-the-official-result).

- **Decision:** Permit correction of actual kickoff across a catalog-version boundary. Determine the catalog for the proposed corrected instant and revalidate all events in the proposed report. Identify incompatible events; the preparer must correct them using the business basis. Do not automatically remap event types or delete events.

- **Validation gate:** Block submission or approval until all such errors are resolved.

- **Official boundary:** For an already official result, keep all changes in the UC19 correction proposal. Existing official kickoff, catalog and result remain unchanged while approval is pending. After a valid proposal is approved by a different authorized person, apply all related changes consistently, recalculate statistics where necessary and retain history.

### D063 - Separate match, report-version and official-result lifecycles

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0013-match-report-and-official-result-lifecycles.md#d063-english-evidence).

- **Source:** O08/O09/O12; UC16-UC20; [D005](administration.md#d005---separate-preparation-and-approval-responsibilities)/[D047](results.md#d047---bind-match-event-catalogs-to-recorded-actual-kickoff)-[D049](results.md#d049---revalidate-events-when-corrected-kickoff-changes-the-applicable-catalog)/[D062](scheduling.md#d062---schedule-approval-publishes-immediately-and-adjustments-are-versioned).

- **Postponement extension:** [POSTPONE-01](scheduling.md#postpone-01---first-version-match-postponement) requires a distinct Postponed branch; authority and return transitions follow [D067](scheduling.md#d067---approved-postponement-and-return-through-uc14). This does not turn postponement into an Official Result.

- **State groups:** Normal match progression: Not started -> In progress -> Ended. Report version: Draft -> Pending confirmation -> Confirmed, with return for supplementation or withdrawal before a decision. Result: Unofficial -> Official, with correction proposals managed separately.

- **Actual times:** The Results Officer records actual kickoff and actual end in the report. Require both before submission; end must be after start. Scheduled time or planned duration alone cannot establish completion. Both actual instants may be entered after the match; live operation at start/end is not required.

- **Version control:** Keep one report case per match with historical versions, and at most one version pending confirmation or correction at a time. Submitted content is immutable; withdrawal/return and a new submitted version are required for changes.

- **Initial confirmation:** UC18 requires an ended match and a complete validated report, with previously confirmed authority/separation rules. Saving the report or entering a score does not make it official.

- **Corrections/consistency:** The current official result remains public and feeds statistics pending UC19 approval. Return/rejection/withdrawal of a correction does not invalidate it. Successful confirmation/correction consistently updates result, statistics and history under UC18-UC20; failure must not leave partial official/statistical updates.

### D064 - Kickoff-based appearance eligibility and report-defined goalkeepers

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0013-match-report-and-official-result-lifecycles.md#d064-english-evidence).

- **Source:** O02/O06/O09/O12; QĐ3.2/QĐ5.7, BM3, UC16/UC18/UC20; [D047](results.md#d047---bind-match-event-catalogs-to-recorded-actual-kickoff)/[D048](results.md#d048---record-actual-kickoff-in-the-report-and-confirm-it-with-the-official-result)/[D056](registration.md#d056---playing-effective-intervals-and-consistent-club-transfers).

- **Eligibility instant:** Each appearing player needs a validated registration for the correct club-season whose playing-effective interval contains actual kickoff. Late report entry does not substitute the player's current club for the historical basis.

- **Appearance lists:** Each team has a nonempty list. A player appears at most once per match and belongs to one of its two teams. First-version scope adds no mandatory eleven-player count, tactical formation or substitution management.

- **Shirt/position:** Take shirt number from the applicable registration at the assessment instant. Record match position separately; it may differ from profile position.

- **Goalkeeper validation:** Before submission/confirmation, each team's report list must identify exactly one goalkeeper by match position. Missing or multiple goalkeepers block submission/confirmation until corrected; do not automatically choose one or skip statistics.

- **Clean sheets:** For official results, a team conceding no goals credits one clean sheet to its report-defined goalkeeper. Goalkeeper substitutions remain outside source scope.

- **History:** At confirmation preserve registration basis, name, shirt number and match position. Subsequent transfer/master updates do not automatically change the report; official corrections still follow UC19.

### D065 - Structured event minutes, score checks and referee-signature references

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0013-match-report-and-official-result-lifecycles.md#d065-english-evidence).

- **Source:** O09/O12; BM3, QĐ3.3-QĐ3.5, UC16-UC19; [D046](registration.md#d046---preserve-codes-and-meanings-of-referenced-goal-and-card-types)-[D049](results.md#d049---revalidate-events-when-corrected-kickoff-changes-the-applicable-catalog)/[D063](results.md#d063---separate-match-report-version-and-official-result-lifecycles)/[D064](results.md#d064---kickoff-based-appearance-eligibility-and-report-defined-goalkeepers).

- **Event minutes:** Store integer main minute 1-90 and nonnegative integer added time; positive added time is allowed only with main minute 45 or 90. Display 45+2 or 90+5 without converting 45+2 to minute 47. First-half added time sorts before minute 46.

- **Scope:** This is the first-version report convention, without extra-time or penalty-shootout events. [D061](scheduling.md#d061---seasonal-planning-intervals-and-system-wide-schedule-conflict-checks) planning duration remains separate.

- **Event validity:** Require an appearing player, the player's correct club, a valid type from the match's applicable catalog and a valid event time. Retain source default types; add no types implicitly.

- **Score:** Derive scores from valid goals; own goals benefit the opposing team and do not count toward personal goals. The entered final score must match; mismatch blocks submission/confirmation.

- **Cards:** Record yellow/red cards from the report, without automatic suspensions, forfeitures or a disciplinary subsystem.

- **Referee basis:** Before submission require referee full name, original-report identifier/reference and the inputter's confirmation of cross-checking the signature on the original. Retain verifier/time; the approver reviews this basis with the report.

- **History/attachments:** Preserve events and referee basis in the confirmed version; corrections use UC19. First version requires no signature image, scanned attachment or digital-signature implementation. This specifies v2 representation of BM3's signature basis, not deletion of the source field.
