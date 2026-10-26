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

- **Media exceptions:** [LOGO-01](design/media.md#logo-01---approved-logo-design) owns the current-logo exception; [D069](design/media.md#d069---managed-player-portraits-with-current-image-display) owns the separately approved current-portrait exception to seasonal descriptive lookup. Other snapshot rules remain unchanged.

### D078 - XLSX create-only import and controlled export

**Status:** CONFIRMED by the Team Leader, Q78 option A and its full common package. [Approval and rationale](../../docs/adr/0018-xlsx-create-only-data-exchange.md).

- **Format:** XLSX is the selected first-version format for master-data import/export and UC22 BM5.1-BM5.3 report exports. CSV/PDF support and a spreadsheet library are not selected by this decision.
- **Import scope:** Create new club, stadium and player masters from a separate template for each group, under its existing shared-management authority. Do not automatically create playing registrations or approve club participation.
- **Duplicates/updates:** Duplicate business codes within the file or already present in the system are errors; existing records are updated through their corresponding UCs, not overwritten by import. D058 suspected-person duplicates remain reviewable warnings, not automatic merges/new hard uniqueness rules; continuation requires confirmation and reason.
- **Preview/commit:** Parse/validate before writing and present data/errors by row and column. Explicit confirmation rechecks current permission/session and data; preview reserves no capacity and guarantees no later commit.
- **Atomicity:** Commit the complete valid file or none. Errors or final conflicts create no partial records; correct the file and retry. Retain required warning acknowledgements and history.
- **Export/access:** Export master lists under corresponding management authority and the three reports through UC22. Enforce permitted fields on the server; public-page access does not automatically grant bulk internal export.
- **Media boundary:** Exchange structured values, without embedded club/player images or image paths that trigger external downloads. Managed media remains UC07/UC09 scope; this does not add an external API integration.
- **Business/quality preservation:** Do not import permissions, approved regulations, Official Results, statistics or summaries to bypass existing workflows. Preserve Vietnamese text, dates/times and business codes. Retain TT-03's at-least-100-valid-record and 100%-field-preservation criteria and HQ-04's report-generation/export threshold. Template/file/value/preview-lifetime contracts follow D091 below; exact library/API/error/concurrency mappings and remaining report layout remain technical elaboration.

### D091 - Fixed XLSX templates and bounded data exchange

**Status:** CONFIRMED by the Team Leader, Q91 option A and the entire proposed package ("Tôi chọn A."). [Approval and rationale](../../docs/adr/0018-xlsx-create-only-data-exchange.md#q91---fixed-templates-and-bounded-processing). D078 retains ownership of create-only scope, access, warning handling, preview/final revalidation and complete-file atomicity; this decision owns template/file/value/preview-lifetime details.

| Import template | Required data columns |
|---|---|
| Clubs | code, name, abbreviation |
| Stadiums | code, name |
| Players | code, fullName, birthDate, nationality, position |

- **Template contract:** Publish three versioned templates with Vietnamese instructions and one designated data sheet per template. Validate the exact column-name set, independently of column order; missing, extra or duplicated columns are errors. These columns reuse D059 master requirements, not seasonal club membership, shirt number, U21/homegrown findings, permissions or images. Exact template-version metadata representation is derived implementation detail.
- **Input limits:** Accept .xlsx only, at most 5 MiB (5,242,880 bytes) and 1,000 data rows excluding the header. Ignore wholly empty rows; reject a file with no data. Check actual workbook structure rather than trusting extension/MIME. Bound total decompressed content at 50 MiB (52,428,800 bytes), stopping when exceeded. These limits are explicitly approved project choices, not original PDF thresholds. Process bounded imports synchronously; larger inputs must be split.
- **Value contract:** Treat business codes as strings preserving leading zeros and enforce D058 duplicate rules. birthDate is an unambiguous YYYY-MM-DD text value, without inferred day/month order or timezone conversion. Nationality and position must match system-published catalogs described with the template; do not create catalog entries from typos. Apply the same validation/normalization as manual entry and preserve Vietnamese diacritics. The shared field constraints and controlled positions are now owned by [D092](#d092---shared-field-validation-identifiers-and-reference-catalogs); the concrete nationality reference list remains detailed-data-dictionary work.
- **Workbook safety:** Reject formulas in data cells, macros, external data links and unsupported embedded content. Do not evaluate workbook content, fetch URLs or download images. Export user-originated values as appropriate literal cell types rather than executable formulas. This selects no XLSX library; implementation must demonstrably enforce the approved limits and safety contract.
- **Preview lifetime:** Bind preview to its creating account, dataset and specific uploaded content for 30 minutes. Show errors by row/column and required D078 suspected-duplicate warnings/acknowledgements. Expiry or a changed file requires a new preview. Commit rechecks current session, permission, values and conflicts; preview grants no capacity or authorization reservation. Do not retain source uploads as long-lived business documents; clean temporary files after processing/expiry while retaining required operation traceability.
- **Export:** Export the complete authorized filtered dataset, not only the visible page. Master exports include a create-template-compatible column subset; reimport of existing codes remains an error under D078. BM5 reports use their separately approved fields/layout. The 1,000-row limit applies only to master import and must not silently truncate reports or exports.
- **Verification:** Cover exact/wrong template versions/columns, reordered columns, empty/oversized/decompression-limit inputs, unsafe workbook content, leading-zero codes, date/catalog errors, expired/other-account previews, changed permissions/concurrent duplicates and whole-file rollback. Preserve D090 minimum-100-record fixtures, original TT-03/HQ-04 thresholds and all Phase/whole-package statuses. No import/export implementation is authorized by this documentation approval.

### D092 - Shared field validation, identifiers and reference catalogs

**Status:** CONFIRMED by the Team Leader, Q92 option A and the entire proposed common package, with one explicit amendment: replace the proposed four-position catalog with the 13 codes below. [Approval and rationale](../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#q92---shared-fields-and-reference-catalogs). The numerical/format limits here are approved project choices, not original PDF requirements. D058/D059 retain identity, required-milestone and historical-snapshot ownership.

- **Text normalization:** Use Unicode NFC for business text and preserve Vietnamese diacritics and display-name capitalization. For single-line names, trim and collapse repeated whitespace without removing valid punctuation or accents. Preserve multiline text layout/line breaks instead of applying name-style whitespace collapsing. Count Unicode code points after normalization; reject excess rather than silently truncate. This does not transform passwords or change D081's credential contract.

| Field group | Approved length |
|---|---|
| Season/club/stadium/player business codes and internal personnel code | 1-32 characters |
| Season/club/stadium names; player/personnel/coach/representative full names | 1-200 characters |
| Club abbreviation | 1-20 characters |
| Contact address or stadium location | At most 500 characters |
| Notes, reasons and evidence summaries | At most 2,000 characters |
| Document/evidence/referee-signature reference | At most 500 characters |
| News title | 1-200 characters |
| Plain-text news body | 1-20,000 characters |

Requiredness remains governed by D059 and the owning UC milestone: drafts may omit fields not yet required. A required reason must contain non-whitespace content; optional notes do not become mandatory merely because they have a length limit.

- **Business-code input:** Authorized users explicitly supply codes; accept ASCII Latin letters, digits, underscore and hyphen, beginning with a letter or digit. Normalize newly entered codes to uppercase, show the normalized value before confirmation and preserve leading zeros. Uniqueness is per entity group after normalization, so ars and ARS are one code. Do not generate codes from names/record counts, recycle codes or silently rename existing records. D082 UUID technical keys remain separate and relationships do not substitute editable input codes for those keys.
- **Position catalog:** The complete first-version list is GK, LB, CB, RB, CDM, CM, CAM, LW, LM, RW, RM, ST, CF. Use the same controlled catalog for player-profile and report match-position values, while recording them separately as required by D064. Only GK identifies the report goalkeeper; D064's exactly-one-goalkeeper-per-team rule remains unchanged. No automatic mapping to broad DF/MF/FW categories or new lineup/substitution rules is authorized. Historical official snapshots retain their approved treatment.
- **Nationality catalog:** Use stable reference codes and display labels, prepared with a versioned catalog covering needed nationalities including England, Scotland, Wales and Northern Ireland. Do not create entries from import typos or add a first-version catalog CRUD feature. Nationality is not homegrown evidence. The concrete full reference list is to be included in the detailed data dictionary for checking before whole-package approval; no external code standard or provider is silently selected.
- **Personnel identity:** An internal account has a unique stable internal personnel code and full name in addition to username. Administrators verify the real person before issuing a code/account under D031. Equal names do not establish identity, and different usernames do not prove different people. Initial D008 administrator CLI input also includes full name/personnel code, retaining its password/bootstrap safety rules. No identity-document collection or HR integration is introduced.
- **Username:** Require 3-50 lowercase ASCII Latin letters/digits/dot/underscore/hyphen, starting with a letter or digit; login comparison is case-insensitive. Existing session/password/account-lifecycle rules remain in force.
- **Dates and contact:** birthDate must be a valid calendar date not later than the current date in D024's display/input timezone; no unapproved minimum/maximum player age is added. Store representative phone numbers as strings of at most 32 characters with 7-15 digits and only digits, plus, space, parentheses or hyphen. Phone is not a unique identifier.
- **Suspected duplicates and shared enforcement:** Compare names after NFC/whitespace normalization and case-insensitive matching, retaining accent distinctions. D058 suspected duplicates remain review warnings, not automatic merges or new name/birthDate/nationality uniqueness constraints. UI, API and XLSX apply the same rules, with backend enforcement authoritative. Exact schema/check/error mappings and the concrete nationality reference list remain technical elaboration.

Technical reference: [Unicode Normalization Forms](https://www.unicode.org/reports/tr15/) defines NFC. No new normalization library, application implementation, Phase completion or whole-v2 approval is selected.
