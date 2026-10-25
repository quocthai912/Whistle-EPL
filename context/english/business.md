# Business requirements, forms, and regulations

Source: §1.2.1, Table 1.1, and §1.2.1.1 pp.6-11. The sections below retain PDF codes and do not add external EPL regulations. [Provenance](sources.md) · [Open decisions](open-decisions.md).

## Six business requirements

| Original no. | Requirement | Forms | Regulations | Related UCs | Owning Phase |
|---|---|---|---|---|---|
| 1 | Receive registration applications | BM1 | QĐ1 | UC08-UC11; data from UC07, UC09, UC12 | PHASE 3 |
| 2 | Create the match schedule | BM2 | QĐ2 | UC13-UC15 | PHASE 4; lookup in PHASE 6 |
| 3 | Record match results | BM3 | QĐ3 | UC16-UC20 | PHASE 5 |
| 4 | Look up competition information | BM4.1-BM4.4 | QĐ4 | UC15, UC21, UC23; season information in UC05 | PHASE 6 |
| 5 | Generate competition reports | BM5.1-BM5.3 | QĐ5 | UC20, UC22 | PHASE 5 calculates statistics; PHASE 7 generates/exports reports |
| 6 | Change regulations | No separate form in Table 1.1 | QĐ6 | UC06 | PHASE 2 |

Accounts/logs (PHASE 1), master data (PHASE 2), news (PHASE 8), data import/export (PHASE 9), and whole-system acceptance (PHASE 10) are traced to other sections of Chapters 1-2; they are not added as a seventh requirement in Table 1.1.

## Fields in the 10 forms

The columns and information below are business form content, not UI, schema, or API definitions. The forms do not fully mark required fields; do not assume every displayed field is mandatory or public. Cross-check BM-05 and open points O04/O09.

| Code and original form name translated | Pages | Information/columns to retain |
|---|---|---|
| BM1 - Team Profile | 6 | Representative: Full name, Phone number, Contact address. Team: Team name, Home ground, Coach. Registration list: No., Player, Date of birth, Playing position, Shirt number, Registration category, Notes |
| BM2 - Match Schedule | 7 | Match round, Season; No., Team 1 (Home), Team 2 (Away), Date - Time, Stadium |
| BM3 - Match Result | 7-8 | Season, Match round, Date - Time, Team 1 (Home), Team 2 (Away), Final score, Stadium. Appearance list: No., Player, Team, Position, Shirt number. Goals: No., Player, Team, Goal type, Time. Cards: No., Player, Team, Card type, Time. Referee's signature |
| BM4.1 - Competition Information Lookup | 8 | Competition name, Season, Number of participating clubs, Number of rounds, Total matches, Start - End dates |
| BM4.2 - Team Information Lookup | 8 | Season; No., Team name, Head coach, Home ground, Number of players, Representative |
| BM4.3 - Player Information Lookup | 9 | Season; No., Player, Date of birth, Registration category, Shirt number, Team name, Goals |
| BM4.4 - Schedule and Results Lookup | 9 | Season; Round, Home team, Away team, Date - Time, Stadium, Score |
| BM5.1 - Standings | 9-10 | Season, Date; Rank, Team, Matches, Wins, Draws, Losses, BT, BB, HS, Points |
| BM5.2 - Goalscorers List | 10 | Season, Date; No., Player name, Team name, Registration category, Total goals |
| BM5.3 - Season Summary | 10 | Season, Report date; Champion, Runner-up, Third place; relegated clubs table: No., Standings position, Club name (three rows in the form); Top scorer, Golden Glove, Total competition goals |

## Detailed regulations

The 37 clauses are transcribed from the PDF by group below. Default values follow the source; QĐ6 permits controlled seasonal changes, not automatic use of a different configuration.

### QĐ1

Source: §1.2.1.1.1, pp.6-7.

- **QĐ1.1:** Each participating club must have a registration application for each season, containing club information, its representative, and its player list.
- **QĐ1.2:** Each club may register at most 25 players on its official squad list, including at most 17 players who do not meet the homegrown criteria.
- **QĐ1.3:** A player meets the homegrown criteria if registered for at least three seasons or 36 months with clubs affiliated to the English or Welsh football associations during the prescribed age period, regardless of nationality.
- **QĐ1.4:** U21 players register outside the 25-player limit. U21 eligibility is determined by the date-of-birth cutoff for each season.
- **QĐ1.5:** A player may have only one active playing registration at a time within the same competition.
- **QĐ1.6:** Registration applications and player-list changes must comply with the season's registration deadlines and permitted exceptions.

### QĐ2

Source: §1.2.1.1.2, p.7.

- **QĐ2.1:** The source default is 20 clubs; [D060](use-cases/scheduling.md#d060---automatic-fixture-pairing-with-manually-completed-schedule-drafts) owns supported first-version configurations and approved-club selection.
- **QĐ2.2:** For the source-default 20-club double round-robin, each club meets the other 19 home and away: 38 matches per club, 38 rounds and 380 matches. D060 owns supported variable-count generation and validation.
- **QĐ2.3:** Each match must identify its round, home team, away team, date/time, and stadium. The home team uses its registered home ground unless the Organizing Committee approves a stadium change.
- **QĐ2.4:** A club must not participate in two matches whose playing times coincide.
- **QĐ2.5:** A stadium must not host two matches with overlapping playing times. Clubs sharing a stadium must be scheduled appropriately.
- **QĐ2.6:** The Organizing Committee may adjust the date/time or stadium of a match not yet played. Every change must preserve schedule validity and be recorded for lookup and comparison.

### QĐ3

Source: §1.2.1.1.3, p.8.

- **QĐ3.1:** Results may be recorded only for matches validly scheduled under BM2. Match information must correspond to the registered season, round, two clubs, and schedule.
- **QĐ3.2:** Players in the appearance list must belong to the two clubs playing the match and have valid registrations. A match result may be officially confirmed only after the match ends.
- **QĐ3.3:** Four goal types are managed: A (ordinary goal), B (penalty goal), C (own goal), and D (direct free-kick goal).
- **QĐ3.4:** Goal times use regulation-time and stoppage-time minutes. The score must match each team's total valid goals; own goals are credited to the opposing team.
- **QĐ3.5:** The system records yellow and red cards, identifying the player, team, and time. Card events must belong to the match being recorded.
- **QĐ3.6:** Confirmed results must be used to update standings and player statistics. Any correction to a confirmed result must be performed by an authorized person and recorded in change history.

### QĐ4

Source: §1.2.1.1.4, p.9.

- **QĐ4.1:** Lookup information must be scoped to a season, including club, player, schedule, and result information. Data from different seasons must be managed and displayed independently.
- **QĐ4.2:** The system allows lookup of clubs participating in a season, including team name, coach, home ground, registered player count, and representative. Information must match valid registration applications.
- **QĐ4.3:** Players may be searched by name or club, displaying registration information and recorded goal totals. Player information must match the selected season's registration records.
- **QĐ4.4:** Schedules and results may be searched by round or club. The schedule must match BM2; a score is displayed as an official result only after confirmation under BM3.
- **QĐ4.5:** Statistics and lookup results must be aggregated from valid business data. Confirmed corrections must update lookup information consistently without distorting historical data.
- **QĐ4.6:** Users may look up public competition information. Internal data and personal information outside the public scope are displayed only to users with appropriate access rights.

### QĐ5

Source: §1.2.1.1.5, pp.10-11.

- **QĐ5.1:** Competition reports must be generated per season using confirmed match data and results. Standings and goalscorers lists reflect valid results at report-generation time.
- **QĐ5.2:** Points are awarded as follows: win 3, draw 1, loss 0. Goal difference equals total goals scored minus total goals conceded.
- **QĐ5.3:** Clubs are ranked by points, goal difference, and goals scored, in that order. At season end, if those criteria are tied and the championship, qualification for another competition, or relegation must be decided, use head-to-head points, away goals in head-to-head matches, and a ranking playoff if necessary.
- **QĐ5.4:** The goalscorers list is ordered by total valid seasonal goals. Own goals do not count toward individual goalscoring records. Players sharing the highest goal total are jointly recognized as top scorers.
- **QĐ5.5:** The season summary report may be confirmed only after all match results have been recorded and necessary ranking cases resolved. It includes the leading teams, relegated teams, top scorer, Golden Glove, and total competition goals.
- **QĐ5.6:** When a confirmed result is validly corrected, the system must update standings, player statistics, and related reports while preserving access to change history.
- **QĐ5.7:** The system automatically calculates goalkeepers' clean sheets from officially confirmed results. A clean sheet is recorded when the club concedes no goals; the goalkeeper is identified from the match appearance list and credited with one clean sheet. Goalkeeper substitutions are not considered in the current scope. Valid corrections to official results must recalculate statistics. The Golden Glove is determined by goalkeepers' seasonal clean-sheet totals.

### QĐ6

Source: §1.2.1.1.6, p.11.

- **QĐ6.1:** Only the Organizing Committee / Season Manager or a validly authorized delegate may change competition regulations. Every change must be approved and identify its applicable season.
- **QĐ6.2:** The system allows seasonal player-registration regulations to be adjusted, including squad limits, homegrown criteria, U21 conditions, and registration deadlines, according to the season's rules.
- **QĐ6.3:** The system allows the number of clubs, competition format, and number of legs to be adjusted when the rules for a new season change. Adjustments must not distort schedules or results from previous seasons.
- **QĐ6.4:** Goal-type and card-type catalogs may be updated according to each season's regulations. Changes must not distort confirmed match events.
- **QĐ6.5:** Win/draw/loss points and the priority order of ranking criteria may be adjusted according to approved rules. Win points must exceed draw points, and draw points must exceed loss points.
- **QĐ6.6:** Every regulation change must be validated and record the person making it, effective time, and before/after values. New regulations take effect only from their approved effective time and must preserve previous seasons' historical data.
## Current managed media rules

Use the authoritative [media policy](design/media.md) for managed images and [integration gates](design/integrations.md) for external dependencies. Verification belongs to the [Progress Checker](progress-checker.md); source quality thresholds remain unchanged. This page does not repeat those policies.

## Current confirmed rules

The rules below are the authoritative current policy for this domain. The UC flows/source clauses above are read with these explicit refinements, not as a separate version. Approval evidence and interview-time notes are in the linked English ADR records; outstanding work is in [open decisions](open-decisions.md).

### D035 - Stable master identity with selective snapshots of official business information

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#d035-english-evidence).

- **Source:** O12; AT-04, PDF p.32; TH-05/TH-06, pp.13-14; master/seasonal object distinction in §1.3.4.1 pp.37-38; [D034](use-cases/administration.md#d034---separately-assigned-shared-master-record-management-permissions).

- **Decision:** Keep stable identities for clubs, stadiums and players across seasons. At official business-recording milestones, retain selective snapshots of the information needed to reproduce the corresponding historical records/reports. A master-record update does not automatically overwrite officially recorded historical information.

- **Official corrections:** Changes to official business data use the corresponding authorized process with a reason and history. Do not snapshot every field indiscriminately; the exact fields and capture milestones remain to be designed.

- **Boundary example:** A club renaming in a later season should not silently replace the name officially used in an earlier season's report, while its identity remains the same club. [D036](business.md#d036---correct-erroneous-master-data-with-separate-review-of-affected-business-records) below settles the general correction policy for originally incorrect master information, including birth-date errors.

### D036 - Correct erroneous master data with separate review of affected business records

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#d036-english-evidence).

- **Source:** O09/O12; UC07 pp.82-84, UC09 pp.88-90 and UC12 pp.97-99; QĐ4.5, PDF p.9; TH-06 and AT-03/AT-04, pp.14/32; [D034](use-cases/administration.md#d034---separately-assigned-shared-master-record-management-permissions)/[D035](business.md#d035---stable-master-identity-with-selective-snapshots-of-official-business-information).

- **Decision:** An authorized master-record manager may correct erroneous source information with a reason and supporting basis. Preserve before/after values, operator and time, and identify related records/operations needing review. Do not require prior approval of the entire downstream correction plan before correcting the master.

- **Historical boundary:** Keep snapshots and previously official decisions unchanged until corrected through their corresponding authorized business processes. A master correction must not automatically cancel registrations, alter official results or change statistics.

- **New business work:** Recheck affected eligibility using corrected information when processing new business operations; do not rely on outdated validation results. For example, correcting a birth date may require review of prior U21 registration without automatically rewriting its official historical decision.

### D058 - Stable business codes, duplicate review and temporal shirt-number uniqueness

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#d058-english-evidence).

- **Source:** O09/O12; UC05/UC07/UC09/UC10/UC12, BM1; [D035](business.md#d035---stable-master-identity-with-selective-snapshots-of-official-business-information)/[D055](use-cases/registration.md#d055---versioned-club-application-and-player-registration-workflows)-[D057](use-cases/registration.md#d057---independently-approved-correction-of-validated-registrations).

- **Identity:** Seasons, clubs, stadiums and players have unique, stable, non-reusable business codes within each entity group. Names, abbreviations and birth dates do not replace identity codes. Duplicate codes are rejected.

- **Suspected duplicate players:** Matching normalized full name, birth date and nationality triggers staff review, not automatic merging or a hard uniqueness rule. Reuse the existing profile for the same person; distinct people may have separate profiles after confirmation with a recorded reason.

- **Clubs/stadiums:** Matching names trigger review; a shared name does not automatically identify the same entity.

- **Shirt numbers:** Require an integer 1-99 when confirming registration validity. In the same club-season, confirmed registrations with overlapping playing-effective intervals cannot share a number, including U21 and future-start registrations. Reuse is allowed after the old interval ends. The 1-99 range is an explicit v2 choice, not a PDF rule.

- **History/scope:** Current name/number changes do not automatically rewrite recorded history. Suspected duplicate records are not automatically merged or their references reassigned. Automatic profile-merging tools are outside the first-version scope.

### D059 - Required registration data and official snapshot milestones

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#d059-english-evidence).

- **Source:** O04/O09/O12; BM1/BM4, UC05/UC07-UC12; [D032](use-cases/publication.md#d032---public-information-boundary-including-player-dates-of-birth)-[D036](business.md#d036---correct-erroneous-master-data-with-separate-review-of-affected-business-records)/[D054](use-cases/registration.md#d054---automatic-u21-assessment-and-evidence-based-staff-verification-of-homegrown-status)-[D058](business.md#d058---stable-business-codes-duplicate-review-and-temporal-shirt-number-uniqueness).

- **Required fields:** Season: code, name, start/end dates, with regulations managed separately. Club master: code, name, abbreviation. Stadium master: code, name. Player master: code, full name, birth date, nationality, position.

- **Club submission:** Require club, season, coach, home ground, representative name/phone/contact address and at least one proposed player, checked at preparation level. This does not require an already playing-effective registration before club approval.

- **Player confirmation:** Require player, club, season, shirt number, U21/homegrown classification results, playing-effective start and corresponding validation basis. Drafts may omit business fields; block progression at the milestone requiring completeness.

- **Homegrown evidence:** A positive finding requires qualifying-seasons/months branch, qualifying value, evidence summary and reference. Retain verifier/time/regulation version through the system. Upload functionality is not mandatory. Notes are optional; do not add personal identity papers.

- **Club snapshot:** At club-application approval preserve the approved version's club name/abbreviation, coach, home ground, representative details and proposed player list.

- **Player snapshot:** At validity confirmation preserve name, birth date, nationality, position, shirt number, classifications and regulation/verification basis. Approved corrections create a successor record while retaining the old one.

- **Seasonal lookup:** Use season-recorded information, including approved corrections, rather than automatically reading all latest master values. [D032](use-cases/publication.md#d032---public-information-boundary-including-player-dates-of-birth)/[D033](use-cases/publication.md#d033---internal-viewing-follows-business-responsibility) public/internal boundaries still apply.

- **Media exception:** [LOGO-01](design/media.md#logo-01---approved-logo-design) owns the approved logo-only exception to seasonal descriptive lookup. Portrait history remains unresolved.
