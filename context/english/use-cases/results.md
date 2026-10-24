# Match reports, results, and statistics: UC16-UC20

[Entry point](../README.md) · [Business/BM/QĐ](../business.md) · [Quality](../quality.md) · [Open decisions](../open-decisions.md)

The records below convert PDF specification tables to Markdown, retaining content and step order; only headers/footers and line wrapping are removed. They are not new feature Specifications. Page and figure references follow the [source conventions](../sources.md). Class/sequence diagrams are analysis models in the report, not approved APIs, schemas, or code structures.

## UC16

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
5. The system checks that players belong to the respective clubs and have valid registrations.
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
8. The user confirms.
9. The system saves the new result and correction history.
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


