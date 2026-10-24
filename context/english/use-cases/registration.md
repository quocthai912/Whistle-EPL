# Seasons, regulations, and registration: UC05–UC11

[Entry point](../README.md) · [Business/BM/QĐ](../business.md) · [Quality](../quality.md) · [Open decisions](../open-decisions.md)

The records below convert PDF specification tables to Markdown, retaining content and step order; only headers/footers and line wrapping are removed. They are not new feature Specifications. Page and figure references follow the [source conventions](../sources.md). Class/sequence diagrams are analysis models in the report, not approved APIs, schemas, or code structures.

## UC05

**Manage seasons**

Source: §2.4.1.5, pp.77–78 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows authorized users to create and manage Premier League seasons. Each season must be separately identifiable so participating clubs, regulations, schedules, and results are not mixed across seasons.

**Description:**

Create, update, and look up season information.

**Actors:**

Organizing Committee / Season Manager.

**Preconditions:**

The user is logged in and has season-management permission.

**Postconditions:**

Valid season information is saved and available to related business activities.

**Main flow:**

1. The user opens season management.
2. The system displays the season list.
3. The user selects create or update a season.
4. The system requests information or edits.
5. The user supplies information and confirms.
6. The system checks validity and consistency.
7. The system saves the data.
8. The system reports the result.

**Alternative flow:**

Lookup only: display season information the user may view.

**Exceptions:**

1. Missing required information or duplicate code: reject saving.
2. Changes affecting historical data: check constraints before acceptance.
3. Storage failure: preserve existing data.

## UC06

**Manage season regulations**

Source: §2.4.1.6, pp.79–82 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows authorized users to manage regulations for each season. These regulations affect player eligibility, competition format, match-event recording, points, and ranking. Every change requires appropriate authority, effective time, and history to avoid distorting completed seasons.

**Description:**

Create, review, approve, or update seasonal regulation configuration within assigned permissions.

**Actors:**

Organizing Committee / Season Manager.

**Preconditions:**

1. The user is logged in.
2. The user has permission appropriate to the operation.
3. The target season exists.

**Postconditions:**

1. Regulations are saved with their applicable season and effective time.
2. Change history is recorded.
3. Historical data from previous seasons is preserved without retroactive alteration.

**Main flow:**

1. The user selects a season.
2. The system displays the current regulations.
3. The user selects the content to update.
4. The system checks permissions and requests change information.
5. The user enters the content, basis, and effective time under the approved process.
6. The system checks validity and conflicts with related data.
7. An authorized person confirms or approves according to policy.
8. The system saves the new regulations and before/after history.
9. The system reports the result.

**Alternative flow:**

1. View only: display effective regulations for the season.
2. Approval required: keep the change pending until a valid decision is made.

**Exceptions:**

1. Insufficient permissions: reject the operation.
2. Invalid regulations or missing effective time: request correction.
3. Conflict with confirmed data: reject or require handling under approved policy.
4. Storage failure: do not apply only part of the new regulations.

## UC07

**Manage clubs**

Source: §2.4.1.7, pp.82–84 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows management of basic information about clubs in the system. A club's master profile is separate from its participation application for a specific season because participation status and registration lists may differ by season.

**Description:**

Create, update, and look up basic club profiles.

**Actors:**

Organizing Committee / Season Manager.

**Preconditions:**

The user is logged in and has the relevant permissions.

**Postconditions:**

A valid club profile is saved and can be linked to seasons.

**Main flow:**

1. The user opens club management.
2. The system displays the club list.
3. The user selects create, update, or view a profile.
4. The system receives the information.
5. The system checks required data and duplicates.
6. The user confirms.
7. The system saves or displays the profile.
8. The system reports the result.

**Alternative flow:**

The user searches for clubs: filter the list by the entered conditions.

**Exceptions:**

1. Missing required information or duplicate identifier: reject saving.
2. Insufficient edit permissions: allow only assigned operations.
3. Data-save failure: preserve the previous profile.

## UC08

**Manage club registration applications**

Source: §2.4.1.8, pp.85–88 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows authorized staff to receive a club's application for a season, check completeness, record review results, and manage application status. This does not imply a club representative is automatically entitled to approve their own application.

**Description:**

Receive and process club participation applications by season.

**Actors:**

Registration Officer; Organizing Committee / Season Manager.

**Preconditions:**

1. The season has been created.
2. The club profile can be identified.
3. The operator is logged in and authorized for application intake, review, or approval.

**Postconditions:**

1. The participation application is recorded under the correct season.
2. Application status, review results, and approval decisions are recorded within the relevant authority.
3. Important change history is recorded.

**Main flow:**

1. The officer opens participation-application management.
2. The system displays applications by season.
3. The officer selects a new application or an existing application to process.
4. The system checks the club, season, and required fields.
5. The officer reviews the application and related information.
6. The officer records review results and submits eligible applications to the Organizing Committee for approval.
7. The system validates the status transition.
8. The authorized Organizing Committee approves or rejects; the system saves the decision, application status, and related logs.
9. The system reports the result.

**Alternative flow:**

1. Incomplete application: record a supplementation-required status under the agreed business process.
2. Further review required: retain an unapproved status.

**Exceptions:**

1. Application does not belong to the selected season: reject processing.
2. Insufficient review permissions: reject the operation.
3. Duplicate application or conflicting data: request checking before saving.
4. Data-save failure: do not leave a partially approved state.

## UC09

**Manage player profiles**

Source: §2.4.1.9, pp.88–90 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows management of player identity records and basic information. These profiles are distinct from registrations for particular clubs and seasons, preserving history and preventing confusion when registration status changes.

**Description:**

Create, update, and look up basic player information.

**Actors:**

Registration Officer.

**Preconditions:**

The user is logged in and has permission to manage player profiles.

**Postconditions:**

A valid player profile is saved and can be referenced by corresponding registrations.

**Main flow:**

1. The user opens player-profile management.
2. The system displays the player list.
3. The user selects create, update, or look up a profile.
4. The system requests the necessary information.
5. The user enters or edits the data.
6. The system checks completeness and duplicates.
7. The user confirms.
8. The system saves or displays the profile.
9. The system reports the result.

**Alternative flow:**

The user searches by name or identifying information: display matching results within their permissions.

**Exceptions:**

1. Invalid data or duplicate profile: reject saving.
2. Insufficient edit permissions: reject the operation.
3. Storage failure: preserve previous data.

## UC10

**Manage player registrations**

Source: §2.4.1.10, pp.91–94 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows intake and management of player registration for a club in a season. This is central because registration status determines eligibility for inclusion in the appearance list. The system must check squad limits, homegrown criteria, U21 conditions, deadlines, and overlapping active registrations.

**Description:**

Receive, validate, save, and manage player-registration status by club and season.

**Actors:**

Registration Officer.

**Preconditions:**

1. The season exists and has applicable registration regulations.
2. The club has an appropriate participation application.
3. The player profile exists or can be identified.
4. The operator has registration-management permission.

**Postconditions:**

1. The registration is saved with the club, player, season, and corresponding status.
2. Eligibility-check results are recorded.
3. Operation history is saved as required.

**Main flow:**

1. The officer selects the season and club.
2. The system displays existing registrations.
3. The officer selects the player to register.
4. The system checks the player information, participation application, and registration deadline.
5. The system performs UC11 – Check player registration eligibility.
6. The system returns validation results and any unmet conditions.
7. If valid, the officer confirms registration.
8. The system saves the registration and status.
9. The system records the log and reports the result.

**Alternative flow:**

1. The officer updates an existing registration's status or information: recheck related constraints before saving.
2. Ineligible registration: display reasons and do not transition to a valid status.

**Exceptions:**

1. The player has a conflicting active registration under the rules: reject the new registration.
2. Squad-limit or eligibility violation: reject confirmation.
3. Outside registration deadlines without a defined exception: reject.
4. Data-save failure: do not leave an incomplete registration record.

## UC11

**Check player registration eligibility**

Source: §2.4.1.11, pp.94–97 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** This validation is used during player-registration management. It determines whether registration meets the season's applicable regulations. Results must explain the reasons rather than returning only pass/fail.

**Description:**

Evaluate a registration against season regulations and return validation results.

**Actors:**

Registration Officer (through UC10 - Manage player registrations).

**Preconditions:**

1. Player, club, and season information is available for checking.
2. The applicable registration regulations have been identified.

**Postconditions:**

Return validation results and related reasons so UC10 can decide the next step.

**Main flow:**

1. UC10 passes registration information to validation.
2. The system retrieves the season regulations.
3. The system checks the official squad-list limit.
4. The system checks the limit on players who do not meet homegrown criteria.
5. The system checks U21 conditions using the applicable cutoff.
6. The system checks registration deadlines and exceptions.
7. The system checks conflicts with active registrations.
8. The system aggregates results and returns them to UC10.

**Alternative flow:**

A criterion does not apply to the specific case under the regulations: record it as not applicable rather than treating it as an error.

**Exceptions:**

1. Missing required data: return an insufficient-basis-to-conclude status.
2. No effective regulations found: do not substitute another season's regulations.
3. Violation found: return specific reasons and do not allow UC10 to confirm a valid registration.


