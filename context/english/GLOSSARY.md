# Whistle-EPL - Business glossary

One business context and one glossary per language. Definitions describe domain meaning; normative rules and decision evidence are linked to their owners. [Sources](sources.md).

## Competition and organization

**Premier League / EPL**: The English Premier League whose seasonal management is simulated by the system (§1.1 pp.4-5).

**Season**: An organizational unit with a code, name, dates, status, and data/regulations kept distinct from other seasons (§1.3.4.1 p.37).

**Organizing Committee / Season Manager**: The actor managing seasons, supervising business activities, and granting approvals within their authority (§2.1 p.53). “Competition Manager” in UC01 is source terminology, not a seventh actor.

**Club (CLB)**: A football organization with shared identifying information, linked to participation applications for individual seasons (§1.3.4.1 p.37; UC07 pp.82-84). “Team” is the label retained in source forms; use club in explanatory text.

**Stadium**: A match venue with managed information and usage status; multiple clubs may use it (p.37; QĐ2.5).

**Home ground**: The stadium registered in a club's seasonal application, used by default when the club is the home team unless the Organizing Committee approves a change (BM1, QĐ2.3).

**Seasonal regulation version**: A distinct full set of regulations for one season whose approved content is retained unchanged as a business reference; changing approved content requires a newly approved version ([D042](use-cases/registration.md#d042---immutable-approved-versions-of-seasonal-regulations), confirmed 2026-10-25).

## Profiles and registration

**Player / Player profile**: An individual and their basic identity record, distinct from registration for a particular club/season (UC09 pp.88-90).

**Club registration application**: A club's participation application for a season, including its representative, coach, home ground, and player list under BM1 (p.37; UC08 pp.85-88). _Avoid_: equating it with the club's master record.

**Seasonal player registration**: A player's registration for a club in a particular season, with a shirt number, registration category, status, and effective period (p.37; UC10 pp.91-94).

**Official squad list**: The player list subject to default limits of 25 players and 17 players who do not meet the homegrown criteria; eligible U21 players register outside the 25-player limit (QĐ1.2-1.4).

**Player meeting homegrown criteria (Home Grown Player)**: A player satisfying the season’s qualifying training conditions, independent of nationality; source defaults are three seasons or 36 months in the prescribed age period with English/Welsh association clubs (QĐ1.3).

**U21**: A registration category determined by the season's date-of-birth cutoff; do not infer it from age on the current date (QĐ1.4).

**Active registration**: A playing registration effective during the period being examined; a player may have only one such registration at a time in the same competition (QĐ1.5).

**Validated-registration correction**: An independently approved correction of erroneous confirmed registration content, classification or playing intervals, distinct from initial validation and ordinary termination/transfer ([D057](use-cases/registration.md#d057---independently-approved-correction-of-validated-registrations), confirmed 2026-10-25).

**Playing-effective interval**: The period from a validated registration's start, inclusive, to its end, exclusive, which may remain unspecified until termination; confirmed intervals for the same player and competition must not overlap ([D056](use-cases/registration.md#d056---playing-effective-intervals-and-consistent-club-transfers), confirmed 2026-10-25).

**Validated player registration**: A registration confirmed as meeting applicable checks by a Registration Officer under UC10; this confirmation alone does not establish that its playing-effective period includes a particular instant ([D055](use-cases/registration.md#d055---versioned-club-application-and-player-registration-workflows), confirmed 2026-10-25).

**Homegrown verification basis**: The evidence and recorded staff assessment supporting a player's qualifying seasons or months under the season's homegrown conditions, distinct from nationality or U21 status ([D054](use-cases/registration.md#d054---automatic-u21-assessment-and-evidence-based-staff-verification-of-homegrown-status), confirmed 2026-10-25).

**Registration intake window**: A seasonal opening/closing interval for receipt of club applications or player registration/squad changes, maintained separately for those groups ([D053](use-cases/registration.md#d053---registration-windows-receipt-deadlines-and-individual-exceptions), confirmed 2026-10-25).

**Receipt-deadline exception**: An approved waiver of receipt timing for one specified application version, without waiving eligibility, squad limits or conflicting-registration rules ([D053](use-cases/registration.md#d053---registration-windows-receipt-deadlines-and-individual-exceptions)).

## Matches and results

**Match round**: A group of matches identified by season and round number (p.37).

**Match / Match schedule**: A match is associated with a season, round, home team, away team, date/time, stadium, and status; the schedule organizes matches according to the competition format (QĐ2; p.37).

**Match report**: BM3 data containing player appearances, goals, cards, and information supporting result validation; creating a match report does not make the result official (UC16 pp.109-112).

**Player appearance list**: Players participating in a match, belonging to its two clubs and having valid registrations, with their match positions and shirt numbers (QĐ3.2; p.37).

**Official result / Confirmed result**: A result confirmed by an authorized person after the match ends, used for public information and official statistics (UC18 pp.115-118). _Avoid_: treating a saved match report or UC17 as confirmation.

**Correction of a confirmed result**: A change to an official result with a valid basis, authority, reason, before/after history, and recalculation of dependent data (UC19 pp.118-121).

**Goal event**: An event identifying a player, club, type, and time including regulation/stoppage-time minutes; defaults are A ordinary, B penalty, C own goal, D direct free kick (QĐ3.3-3.4).

**Own goal**: Type C, credited to the opposing team's score and excluded from the player's individual goals tally (QĐ3.4; QĐ5.4).

**Card event**: A yellow or red card associated with a match, player, club, and time; it does not include a separate disciplinary/suspension system (QĐ3.5; pp.38-39).

**Match-event minute**: The main minute plus any separately recorded added time identifying when a goal/card occurred; first-half added time remains part of the first half rather than a second-half minute ([D065](use-cases/results.md#d065---structured-event-minutes-score-checks-and-referee-signature-references), confirmed 2026-10-25).

**Match report version**: A recorded revision within a match's single report case; a submitted revision is preserved unchanged while awaiting confirmation, independently of whether an earlier result remains official ([D063](use-cases/results.md#d063---separate-match-report-version-and-official-result-lifecycles), confirmed 2026-10-25).

**Planned match interval**: The half-open period from scheduled kickoff to planned end, used to check club scheduling conflicts under the season's planning duration ([D061](use-cases/scheduling.md#d061---seasonal-planning-intervals-and-system-wide-schedule-conflict-checks), confirmed 2026-10-25).

**Stadium occupancy interval**: The half-open planned match period extended by the season's preparation and release buffers, used to check stadium allocation conflicts ([D061](use-cases/scheduling.md#d061---seasonal-planning-intervals-and-system-wide-schedule-conflict-checks)).

**Actual kickoff**: The recorded instant when a match actually begins, distinct from its scheduled start and the time its report is entered; it determines the applicable goal/card catalog under [D047](use-cases/results.md#d047---bind-match-event-catalogs-to-recorded-actual-kickoff), confirmed 2026-10-25.

## Aggregation and publication

**Standings (BXH)**: Seasonal club performance calculated from official results, including matches, wins, draws, losses, goals for, goals against, goal difference, points, and rank (BM5.1; QĐ5).

**BT / BB / HS**: BM5.1 source labels for goals for, goals against, and goal difference respectively; goal difference equals goals scored minus goals conceded (QĐ5.2).

**Top scorer**: The award for players with the highest valid seasonal goal total; players tied for the highest total share it, excluding own goals (QĐ5.4).

**Clean sheet**: An official match in which the club concedes no goals, credited to the goalkeeper identified from the appearance list; goalkeeper substitutions are not considered in the current scope (QĐ5.7).

**Golden Glove**: The seasonal award for the highest positive goalkeeper clean-sheet total; equal highest totals share the award ([D066](use-cases/publication.md#d066---shared-standings-ranks-and-shared-individual-awards); QĐ5.7).

**Season summary report**: BM5.3, confirmable only after all match results are available and necessary ranking decisions are resolved (QĐ5.5).

**Competition news and announcements**: Content managed by the Organizing Committee; only published content is publicly visible (UC24-UC25 pp.134-139).

**Season regulations**: Business conditions applicable to a season, with approval authority and effective dates (QĐ6; UC06).

**Change history / Activity log**: Traceability information identifying the person, time, action/object, and before/after content of important changes, accessible only with appropriate permissions (p.38; BM-06). The two source terms have related scopes but do not necessarily require a single technical mechanism.

**Shared standings rank**: A sporting rank held jointly by clubs equal on all applicable main criteria, with subsequent ranks skipped according to group size; display order within the group does not break the tie ([D066](use-cases/publication.md#d066---shared-standings-ranks-and-shared-individual-awards), confirmed 2026-10-25).

## Authority and information scope

**Business delegation**: Authority for a specified business operation, season and validity period, distinct from assigning an entire role ([D013](design/access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation)).

**Direct business authority**: Authority held directly through the applicable seasonal role rather than received through delegation ([D015](design/access-control.md#d015---single-level-delegation-based-on-direct-role-authority)).

**Personal internal account**: The single account assigned to one internal staff member across the system, carrying their applicable roles and seasonal assignments rather than being shared with others ([D031](use-cases/administration.md#d031---one-personal-internal-account-per-person), confirmed 2026-10-25).

**Public competition information**: Competition information approved for unauthenticated viewing within the seasonal/publication scope, including player dates of birth under the Team Leader's v2 decision ([D032](use-cases/publication.md#d032---public-information-boundary-including-player-dates-of-birth), confirmed 2026-10-25).

**Internal competition information**: Competition administration, application and personal information outside the approved public scope, accessible only with the applicable authority ([D032](use-cases/publication.md#d032---public-information-boundary-including-player-dates-of-birth)). Viewing follows the responsible role and season rather than login alone ([D033](use-cases/publication.md#d033---internal-viewing-follows-business-responsibility)).

## Managed media

**Club logo**: The current visual identity managed with the shared club master, displayed consistently even in old-season views with fallback when unavailable; other historical club facts remain independently preserved ([LOGO-01](design/media.md#logo-01---approved-logo-design)).

**Player profile image / Portrait**: A managed image associated with a player profile, displayed alongside the applicable seasonal registration information with fallback; portrait-specific validation/history policy remains open ([media scope](design/media.md#player-image-scope-and-remaining-decisions)).

## Season presentation

**Postponed match**: A not-yet-started match recorded as unable to proceed under its published schedule, distinct from a started/interrupted or permanently cancelled match ([POSTPONE-01](use-cases/scheduling.md#postpone-01---first-version-match-postponement)).

**Season Overview Dashboard**: A shared public overview of a selected season, its official competition statistics and related navigation ([DASHBOARD-01](use-cases/publication.md#dashboard-01---season-overview-dashboard)).
