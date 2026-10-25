# Seasons, regulations, and registration: UC05-UC11

[Entry point](../README.md) · [Business/BM/QĐ](../business.md) · [Quality](../quality.md) · [Open decisions](../open-decisions.md)

Current UC flows retain source codes/pages and incorporate explicitly approved refinements. The authoritative rules for this domain are linked below; approval/source/rationale evidence is in English ADRs. These are Context documents, not generated feature Specifications. Analysis figures are not approved API/schema designs. See [sources](../sources.md).

## UC05

**Manage seasons**

Source: §2.4.1.5, pp.77-78 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

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

Current rules: [D042](registration.md#d042---immutable-approved-versions-of-seasonal-regulations), [D043](registration.md#d043---immediate-or-future-regulation-effectivity-without-backdating), [D044](registration.md#d044---freeze-competition-structure-after-initial-schedule-approval), [D045](registration.md#d045---freeze-points-and-ranking-priority-after-the-first-official-result), [D046](registration.md#d046---preserve-codes-and-meanings-of-referenced-goal-and-card-types), [D050](registration.md#d050---at-most-one-approved-future-regulation-version-per-season), [D051](registration.md#d051---controlled-cancellation-replacement-and-activation-of-waiting-regulations), [D052](registration.md#d052---compatible-registration-rule-changes-and-revalidation-of-pending-records), [D053](registration.md#d053---registration-windows-receipt-deadlines-and-individual-exceptions), [D054](registration.md#d054---automatic-u21-assessment-and-evidence-based-staff-verification-of-homegrown-status).

**Manage season regulations**

Source: §2.4.1.6, pp.79-82 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

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
7. A different authorized approver approves the submitted version under [D005](administration.md#d005---separate-preparation-and-approval-responsibilities)/[D042](registration.md#d042---immutable-approved-versions-of-seasonal-regulations); draft saving alone does not activate regulations.
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

Source: §2.4.1.7, pp.82-84 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

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

### Managed logo behavior within UC07

UC07 includes upload, replace and removal-to-fallback under the separately assigned shared club-management authority, with validation, failure preservation and audit per [LOGO-01](../design/media.md#logo-01---approved-logo-design). Display the current managed logo in club views. Backend/database references and stored files are required; frontend hardcoding is insufficient.

## UC08

Current rules: [D055](registration.md#d055---versioned-club-application-and-player-registration-workflows).

**Manage club registration applications**

Source: §2.4.1.8, pp.85-88 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

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

Current rules: [D058](../business.md#d058---stable-business-codes-duplicate-review-and-temporal-shirt-number-uniqueness), [D059](../business.md#d059---required-registration-data-and-official-snapshot-milestones).

**Manage player profiles**

Source: §2.4.1.9, pp.88-90 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

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
6. Check completeness and code uniqueness; suspected duplicate people require review under [D058](../business.md#d058---stable-business-codes-duplicate-review-and-temporal-shirt-number-uniqueness).
7. The user confirms.
8. The system saves or displays the profile.
9. The system reports the result.

**Alternative flow:**

The user searches by name or identifying information: display matching results within their permissions.

**Exceptions:**

1. Invalid data or duplicate code: reject saving; matching personal attributes follow the [D058](../business.md#d058---stable-business-codes-duplicate-review-and-temporal-shirt-number-uniqueness) review process.
2. Insufficient edit permissions: reject the operation.
3. Storage failure: preserve previous data.

### Managed player images within UC09

UC09 must manage player profile images using existing player-master management authority and persist their references. Support hundreds of profiles and consistent fallback rendering. Player club/shirt details come from the applicable seasonal registration, not permanent master identity fields. No external API is required. Portrait-specific format/limit/history policy remains open; LOGO-01 does not silently decide it. See [media scope](../design/media.md#player-image-scope-and-remaining-decisions).

## UC10

Current rules: [D053](registration.md#d053---registration-windows-receipt-deadlines-and-individual-exceptions), [D054](registration.md#d054---automatic-u21-assessment-and-evidence-based-staff-verification-of-homegrown-status), [D055](registration.md#d055---versioned-club-application-and-player-registration-workflows), [D056](registration.md#d056---playing-effective-intervals-and-consistent-club-transfers), [D057](registration.md#d057---independently-approved-correction-of-validated-registrations).

**Manage player registrations**

Source: §2.4.1.10, pp.91-94 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows intake and management of player registration for a club in a season. This is central because registration status determines eligibility for inclusion in the appearance list. The system must check squad limits, homegrown criteria, U21 conditions, deadlines, and overlapping active registrations.

**Description:**

Receive, validate, save, and manage player-registration status by club and season.

**Actors:**

Registration Officer.

**Preconditions:**

1. The season exists and has applicable registration regulations.
2. Validity confirmation requires an approved club application; preparatory player lists may be checked earlier under [D055](registration.md#d055---versioned-club-application-and-player-registration-workflows).
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
5. The system performs UC11 - Check player registration eligibility.
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

Current rules: [D052](registration.md#d052---compatible-registration-rule-changes-and-revalidation-of-pending-records), [D054](registration.md#d054---automatic-u21-assessment-and-evidence-based-staff-verification-of-homegrown-status).

**Check player registration eligibility**

Source: §2.4.1.11, pp.94-97 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

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

## Current confirmed rules

The rules below are the authoritative current policy for this domain. The UC flows/source clauses above are read with these explicit refinements, not as a separate version. Approval evidence and interview-time notes are in the linked English ADR records; outstanding work is in [open decisions](../open-decisions.md).

### D042 - Immutable approved versions of seasonal regulations

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d042-english-evidence).

- **Source:** O07/O12; QĐ6, PDF p.11; UC06 pp.79-82; [D005](administration.md#d005---separate-preparation-and-approval-responsibilities)/[D035](../business.md#d035---stable-master-identity-with-selective-snapshots-of-official-business-information).

- **Decision:** Each approval establishes a distinct seasonal regulation version containing the full regulation configuration for that season. Approved content is immutable; changing it requires a new proposal and approval of a new version. Retain older versions for lookup and as the basis of related business records.

- **Proposal boundary:** Proposals may be edited during drafting. Draft or pending versions do not replace regulations currently in effect. Approval still requires a person other than the submitted content's preparers/editors under [D005](administration.md#d005---separate-preparation-and-approval-responsibilities).

### D043 - Immediate or future regulation effectivity without backdating

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d043-english-evidence).

- **Source:** O07/O12; QĐ6.6, PDF p.11; UC06 pp.79-82; [D024](../design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone)/[D042](registration.md#d042---immutable-approved-versions-of-seasonal-regulations).

- **Decision:** A regulation proposal specifies either immediate effectivity or a future effective instant for the approver to review. Immediate effectivity begins when the system successfully records approval. A future-dated approved version does not replace the currently effective regulations before its approved instant. Backdated effectivity is not allowed.

- **Late approval:** Reject approval if the proposed future instant has already passed; do not silently switch to immediate effectivity. Revising the proposal requires resubmission for approval.

- **Time convention:** Apply [D024](../design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone): store/compare UTC instants and use Asia/Ho_Chi_Minh for input/display.

### D044 - Freeze competition structure after initial schedule approval

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d044-english-evidence).

- **Source:** O07/O10/O12; QĐ6.3, PDF p.11; QĐ2; UC13/UC14; [D042](registration.md#d042---immutable-approved-versions-of-seasonal-regulations)/[D043](registration.md#d043---immediate-or-future-regulation-effectivity-without-backdating).

- **Decision:** From the first approval of the season's initial schedule, freeze the configured club count, competition format and number of legs for that season. Later regulation versions must retain these structural settings, even if no match has started.

- **Scope:** The current project scope includes no unlocking or whole-schedule cancellation process for changing competition structure. Date/time or stadium adjustments for unplayed matches remain subject to UC14 and its separate conditions.

### D045 - Freeze points and ranking priority after the first official result

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d045-english-evidence).

- **Source:** O07/O12; QĐ5.2/QĐ5.3 and QĐ6.5, PDF pp.10-11; UC18-UC20; [D042](registration.md#d042---immutable-approved-versions-of-seasonal-regulations)-[D044](registration.md#d044---freeze-competition-structure-after-initial-schedule-approval).

- **Decision:** From the season's first officially confirmed result, freeze win/draw/loss points and the priority order of ranking criteria for that season. Later regulation versions must preserve these settings. Before this milestone, changes still require regulation versioning and approval under [D042](registration.md#d042---immutable-approved-versions-of-seasonal-regulations)/[D043](registration.md#d043---immediate-or-future-regulation-effectivity-without-backdating).

- **Corrections and scope:** UC19 official-result corrections and UC20 recalculation remain available under their applicable conditions, using the frozen points/ranking rules. No unlocking workflow for these settings is included in the current project scope.

### D046 - Preserve codes and meanings of referenced goal and card types

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d046-english-evidence).

- **Source:** O07/O09/O12; QĐ3.3-QĐ3.5 and QĐ6.4; [D042](registration.md#d042---immutable-approved-versions-of-seasonal-regulations)/[D043](registration.md#d043---immediate-or-future-regulation-effectivity-without-backdating).

- **Decision:** Once a goal/card type has been used, including in a draft match report, retain its code and business meaning and prohibit deletion while it is referenced. Do not reinterpret a used type, including its score/statistics treatment, or reuse its code for a different meaning.

- **Evolution:** A different meaning requires proposing a new type through a regulation version and approval. Withdrawal from selection for new input may be proposed while retaining the old type for historical reading and interpretation. Adding a type does not itself authorize a new calculation formula or unapproved business behavior.

### D050 - At most one approved future regulation version per season

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d050-english-evidence).

- **Source:** O07/O12; [D042](registration.md#d042---immutable-approved-versions-of-seasonal-regulations)/[D043](registration.md#d043---immediate-or-future-regulation-effectivity-without-backdating).

- **Decision:** Each season may have at most one approved regulation version awaiting its future effective instant. While it exists, block approval of another version, including an immediately effective version.

- **Preparation:** Further proposals may be drafted, but must be rechecked against the regulations currently in effect before approval. Replacing or cancelling an approved waiting version requires a separate process still to be decided; do not edit approved content directly.

### D051 - Controlled cancellation, replacement and activation of waiting regulations

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d051-english-evidence).

- **Source:** O07/O08/O12; UC06; [D005](administration.md#d005---separate-preparation-and-approval-responsibilities)/[D042](registration.md#d042---immutable-approved-versions-of-seasonal-regulations)-[D045](registration.md#d045---freeze-points-and-ranking-priority-after-the-first-official-result)/[D050](registration.md#d050---at-most-one-approved-future-regulation-version-per-season).

- **Cancellation:** Before the approved effective instant, an authorized Season Manager proposes cancellation with a reason and another authorized Season Manager approves it. Preserve approved content and history; record cancellation separately.

- **Replacement:** One proposal may request cancellation of the waiting version and approval of its replacement together. Record both only after the entire valid proposal is approved; on failure retain the waiting version. This is an explicit controlled exception to [D050](registration.md#d050---at-most-one-approved-future-regulation-version-per-season)'s block on approving another version while one is waiting, not permission for two approved future versions.

- **Time boundary:** A pending cancellation/replacement request does not postpone effectivity. Once the effective instant is reached, the future-version cancellation process is unavailable; further changes require a new regulation version.

- **Activation eligibility:** At the effective instant, recheck constraints arising since approval, including [D044](registration.md#d044---freeze-competition-structure-after-initial-schedule-approval)/[D045](registration.md#d045---freeze-points-and-ranking-priority-after-the-first-official-result) freeze milestones. If the version has become incompatible, do not apply it: retain the currently effective regulations, record the reason and require a new proposal for resolution. Do not silently edit approved content or move its effective time.

### D052 - Compatible registration-rule changes and revalidation of pending records

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d052-english-evidence).

- **Source:** O01/O02/O07/O12; QĐ6.2, UC06/UC10/UC11; [D036](../business.md#d036---correct-erroneous-master-data-with-separate-review-of-affected-business-records)/[D042](registration.md#d042---immutable-approved-versions-of-seasonal-regulations)/[D043](registration.md#d043---immediate-or-future-regulation-effectivity-without-backdating)/[D051](registration.md#d051---controlled-cancellation-replacement-and-activation-of-waiting-regulations).

- **Decision:** Permit controlled mid-season changes to squad limits, homegrown and U21 conditions only if they do not invalidate approved registrations/lists currently in effect. Check impact at approval and at effectivity; block an incompatible change.

- **Existing decisions:** Do not automatically cancel registrations, remove players or rewrite approved decisions to force compliance with new rules. Preserve the original regulation-version basis of historical decisions.

- **Pending work:** Revalidate draft/pending records against regulations effective at decision time. Earlier submission does not guarantee assessment under the old eligibility/limit rules. Record the regulation version supporting each decision.

- **Correction boundary:** Erroneous master data or previous decisions follow their corresponding correction processes; regulation changes do not substitute for correction.

### D053 - Registration windows, receipt deadlines and individual exceptions

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#d053-english-evidence).

- **Source:** O02/O07/O08/O12; QĐ1.6/QĐ6.2, UC06/UC08/UC10/UC11; [D024](../design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone)/[D052](registration.md#d052---compatible-registration-rule-changes-and-revalidation-of-pending-records).

- **Calendars:** Configure separate seasonal intake calendars for club participation applications and player registration/squad changes. Each group may have multiple windows, without overlap within the group, managed through seasonal regulations. Use explicit opening/closing instants and half-open intervals [open, close), following [D024](../design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone). Do not import external EPL transfer-calendar defaults.

- **Deadline basis:** Use the server instant successfully recording receipt of the application version being assessed, not draft creation or a user-declared timestamp. Timely received versions may be processed after closing. Player conditions/limits still use decision-time rules under [D052](registration.md#d052---compatible-registration-rule-changes-and-revalidation-of-pending-records).

- **Supplementation:** Supplementing or changing assessed content creates a new received version whose timeliness must be checked again.

- **Individual exception:** A Registration Officer proposes an exception for a specific application/version with a reason and basis; an authorized Season Manager separately approves it. The exception waives only receipt timing for that version, not player conditions, limits or conflicting registrations. Exception approval does not replace the registration-processing decision.

- **Traceability:** Retain receipt instants, calendar basis and exception decisions. Do not edit calendars or backdate timestamps to legitimize previous receipts.

### D054 - Automatic U21 assessment and evidence-based staff verification of homegrown status

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#d054-english-evidence).

- **Source:** O01/O07/O09/O12; QĐ1.2-QĐ1.4/QĐ6.2, UC10/UC11; [D024](../design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone)/[D033](publication.md#d033---internal-viewing-follows-business-responsibility)/[D052](registration.md#d052---compatible-registration-rule-changes-and-revalidation-of-pending-records).

- **Season parameters:** Require the U21 birth-date cutoff and homegrown qualifying training-age range in regulations submitted for approval. Do not fill these gaps from external EPL rules. Retain the source thresholds of at least three seasons or 36 months as defaults; changes follow [D052](registration.md#d052---compatible-registration-rule-changes-and-revalidation-of-pending-records). Actual seasonal values must be entered and approved as configuration, not silently assumed.

- **U21:** Automatically qualify a player whose birth date is on or after the seasonal cutoff. Compare calendar dates rather than age today; missing birth date means insufficient basis to conclude.

- **Homegrown:** A Registration Officer checks evidence and records the qualifying-seasons or qualifying-months basis, conclusion, verifier, time and regulation version. The basis must support the prescribed age range and English/Welsh association requirement; nationality is not a proxy.

- **Insufficient evidence:** Do not mark homegrown as satisfied. The preparer may choose non-homegrown treatment if applicable limits and all other requirements are met; missing homegrown evidence does not automatically reject every registration.

- **Independent attributes and scope:** U21 and homegrown are independent, not inferred from nationality or one another. The first version does not implement automatic accumulation of full multi-club training histories, overlap handling or season/month conversion. Evidence remains internal under confirmed viewing rules.

### D055 - Versioned club-application and player-registration workflows

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#d055-english-evidence).

- **Source:** O02/O08/O09/O12; UC08/UC10/UC11; [D005](administration.md#d005---separate-preparation-and-approval-responsibilities)/[D052](registration.md#d052---compatible-registration-rule-changes-and-revalidation-of-pending-records)-[D054](registration.md#d054---automatic-u21-assessment-and-evidence-based-staff-verification-of-homegrown-status).

- **Club workflow:** Draft -> Received -> Pending approval -> Approved or Rejected. Registration Officers prepare/review; the authorized Season Manager approves under UC08/[D005](administration.md#d005---separate-preparation-and-approval-responsibilities).

- **Player workflow:** Draft -> Received -> Valid. The Registration Officer confirms validity after UC11 checks under UC10; no additional manager approval is introduced.

- **Supplementation/versioning:** Received records, or club applications pending approval, may be returned to Needs supplementation with a reason. Supplementation creates a new version for receipt and rechecking under [D053](registration.md#d053---registration-windows-receipt-deadlines-and-individual-exceptions). Submitted club content is immutable; editing requires withdrawal or return for supplementation, then a new submitted version.

- **Cancellation/resubmission:** Permit cancellation before club approval or player-validity confirmation, retaining reason/history. Rejected/cancelled versions cannot be edited into approved ones; a new processing round links to the history. Keep one club-season application case containing its versions/rounds, not multiple independent participation applications for the same club-season.

- **Dependency:** Prepare and check player lists while club approval is pending, but confirm a player's registration as valid only after the club participation application is approved. Club approval does not automatically validate every player registration; UC10 must still check and confirm.

- **Temporal boundary:** Validity confirmation is distinct from playing effectivity, termination and club transfer, which remain to be settled.

### D056 - Playing-effective intervals and consistent club transfers

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#d056-english-evidence).

- **Source:** O02/O08/O09/O12; QĐ1.5, UC10/UC11; [D024](../design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone)/[D053](registration.md#d053---registration-windows-receipt-deadlines-and-individual-exceptions)-[D055](registration.md#d055---versioned-club-application-and-player-registration-workflows).

- **Intervals:** A validated registration has a playing-effective start and a half-open interval [start, end). End may remain unspecified until valid termination. Ordinary start/termination operations may take effect at successful recording or in the future, never before recording; historical errors require a separate correction process.

- **Exclusivity:** Reject overlapping confirmed registration intervals for the same player and competition, including future-start registrations and registrations in different seasons. Adjacent intervals sharing an end/start instant are permitted.

- **Transfer:** Within UC10, terminate the old club registration and start the new one at a common instant in one consistent operation. Record both only when the new registration passes all checks; failure leaves the old registration unchanged.

- **Authority/validation:** The Registration Officer needs authority over the affected registrations/seasons, with a reason and history. Transfers still satisfy [D053](registration.md#d053---registration-windows-receipt-deadlines-and-individual-exceptions) deadlines/exceptions, [D054](registration.md#d054---automatic-u21-assessment-and-evidence-based-staff-verification-of-homegrown-status) eligibility, limits and all other checks; no bypass is introduced.

- **History:** Termination or transfer does not automatically remove earlier appearances, goals or statistics.

### D057 - Independently approved correction of validated registrations

**Confirmed policy.** [Approval, source and rationale](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#d057-english-evidence).

- **Source:** O02/O08/O09/O12; UC10/UC11/UC19; [D036](../business.md#d036---correct-erroneous-master-data-with-separate-review-of-affected-business-records)/[D055](registration.md#d055---versioned-club-application-and-player-registration-workflows)/[D056](registration.md#d056---playing-effective-intervals-and-consistent-club-transfers).

- **Scope:** Correction of erroneous confirmed content/basis, classification conclusions or incorrectly recorded playing intervals, including historical correction, requires a proposal and independent approval. This adds no approval step to initial UC10 validity confirmation or ordinary termination/transfer.

- **Responsibility:** The Registration Officer reviews and proposes the correction with reason, basis, before/after values and related impacts. An authorized Season Manager other than the proposal's preparers/editors approves, returns for supplementation or rejects.

- **Pending review:** Keep the current official decision and record the need for review. New business work still validates against corrected source data under [D036](../business.md#d036---correct-erroneous-master-data-with-separate-review-of-affected-business-records) rather than stale checks.

- **Validation:** Recheck conditions, limits and overlap for affected intervals using the corresponding regulations. Correction is not a waiver or a way to legitimize violations.

- **Invalid prior decision:** If the registration cannot remain valid, the proposal must state the disposition, such as ending effectivity or recording the prior decision as erroneous. Do not erase the registration's historical existence.

- **Match impacts:** Identify reports/results requiring separate review. Registration-correction approval does not automatically alter results, award a loss or change statistics; official-result changes still follow UC19.

- **Source refinement:** The original UC10 remains retrievable in the v1 Git milestone. This confirmed policy adds approval specifically for corrections of already validated registrations, not a claim that v1 already required it.
