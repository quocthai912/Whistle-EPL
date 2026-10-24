# Stadiums and scheduling: UC12-UC15

[Entry point](../README.md) · [Business/BM/QĐ](../business.md) · [Quality](../quality.md) · [Open decisions](../open-decisions.md)

The records below convert PDF specification tables to Markdown, retaining content and step order; only headers/footers and line wrapping are removed. They are not new feature Specifications. Page and figure references follow the [source conventions](../sources.md). Class/sequence diagrams are analysis models in the report, not approved APIs, schemas, or code structures.

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

**Create the match schedule**

Source: §2.4.1.13, pp.100-103 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows authorized users to build the season schedule. It must satisfy the base format of 20 clubs, 38 rounds, and 380 matches, with each club pair meeting twice at home and away. The system must check club and stadium schedule conflicts.

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
10. Once valid, the officer confirms saving and submits the schedule to the Organizing Committee for approval.
11. The system saves the schedule as pending approval and records the log.

**Alternative flow:**

1. The user enters the schedule in parts: validate entered matches and overall schedule consistency.
2. Insufficient schedule data: save a draft if draft saving is supported; a draft is not an official schedule.
3. The Organizing Committee approves the submitted schedule: allow publication; if rejected, keep it unpublished and return it for adjustment.

**Exceptions:**

1. Incorrect round or match count: reject schedule confirmation.
2. Overlapping club matches or stadium conflicts: identify the affected matches.
3. A club pair lacks the required home/away legs: request correction.
4. Data-save failure: do not leave an official schedule only partially saved.

## UC14

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
7. The user confirms the proposed adjustment; the change must have valid approval or delegated authority.
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


