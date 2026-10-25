# Whistle-EPL - Business glossary

One business context for the Premier League management system. Definitions follow the PDF; see [source conventions](sources.md). This glossary standardizes business meaning only; it does not define storage models.

## Competition and organization

**Premier League / EPL**: The English Premier League whose seasonal management is simulated by the system (§1.1 pp.4-5).

**Season**: An organizational unit with a code, name, dates, status, and data/regulations kept distinct from other seasons (§1.3.4.1 p.37).

**Organizing Committee / Season Manager**: The actor managing seasons, supervising business activities, and granting approvals within their authority (§2.1 p.53). “Competition Manager” in UC01 is source terminology, not a seventh actor.

**Club (CLB)**: A football organization with shared identifying information, linked to participation applications for individual seasons (§1.3.4.1 p.37; UC07 pp.82-84). “Team” is the label retained in source forms; use club in explanatory text.

**Stadium**: A match venue with managed information and usage status; multiple clubs may use it (p.37; QĐ2.5).

**Home ground**: The stadium registered in a club's seasonal application, used by default when the club is the home team unless the Organizing Committee approves a change (BM1, QĐ2.3).

## Profiles and registration

**Player / Player profile**: An individual and their basic identity record, distinct from registration for a particular club/season (UC09 pp.88-90).

**Club registration application**: A club's participation application for a season, including its representative, coach, home ground, and player list under BM1 (p.37; UC08 pp.85-88). _Avoid_: equating it with the club's master record.

**Seasonal player registration**: A player's registration for a club in a particular season, with a shirt number, registration category, status, and effective period (p.37; UC10 pp.91-94).

**Official squad list**: The player list subject to default limits of 25 players and 17 players who do not meet the homegrown criteria; eligible U21 players register outside the 25-player limit (QĐ1.2-1.4).

**Player meeting homegrown criteria (Home Grown Player)**: A player registered for at least three seasons or 36 months with clubs affiliated to the English or Welsh football associations during the prescribed age period, regardless of nationality (QĐ1.3). _Avoid_: using “English-nationality player” instead of the training criteria.

**U21**: A registration category determined by the season's date-of-birth cutoff; do not infer it from age on the current date (QĐ1.4).

**Active registration**: A playing registration effective during the period being examined; a player may have only one such registration at a time in the same competition (QĐ1.5).

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

## Aggregation and publication

**Standings (BXH)**: Seasonal club performance calculated from official results, including matches, wins, draws, losses, goals for, goals against, goal difference, points, and rank (BM5.1; QĐ5).

**BT / BB / HS**: BM5.1 source labels for goals for, goals against, and goal difference respectively; goal difference equals goals scored minus goals conceded (QĐ5.2).

**Top scorer**: The award for players with the highest valid seasonal goal total; players tied for the highest total share it, excluding own goals (QĐ5.4).

**Clean sheet**: An official match in which the club concedes no goals, credited to the goalkeeper identified from the appearance list; goalkeeper substitutions are not considered in the current scope (QĐ5.7).

**Golden Glove**: An award determined from goalkeepers' seasonal clean-sheet totals (QĐ5.7); the source has not settled how ties are handled.

**Season summary report**: BM5.3, confirmable only after all match results are available and necessary ranking decisions are resolved (QĐ5.5).

**Competition news and announcements**: Content managed by the Organizing Committee; only published content is publicly visible (UC24-UC25 pp.134-139).

**Season regulations**: Business conditions applicable to a season, with approval authority and effective dates (QĐ6; UC06).

**Change history / Activity log**: Traceability information identifying the person, time, action/object, and before/after content of important changes, accessible only with appropriate permissions (p.38; BM-06). The two source terms have related scopes but do not necessarily require a single technical mechanism.

## Context v2 additions

The source-based v1 definitions above are retained. The following business definitions come from the Team Leader's confirmed v2 decisions, not additional PDF clauses.

**Business delegation**: Authorization to perform a specified competition-management operation for a specified season within a defined validity period, distinct from assigning an entire business role ([D013](design/README.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation), confirmed 2026-10-25; O07/O08). The Season Manager proposes it and the System Administrator records grants/revocations ([D014](design/README.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations)); the recipient must have an active account and a business role in the target season ([D018](design/README.md#d018---delegation-recipients-must-already-hold-a-business-role-in-the-target-season)), within the approved role/operation matrix ([D019](design/README.md#d019---first-version-delegation-operation-and-recipient-role-matrix)).

**Direct business authority**: Authority held directly through a person's business role in the applicable season, rather than received through delegation; only this authority may support a delegation proposal ([D015](design/README.md#d015---single-level-delegation-based-on-direct-role-authority), confirmed 2026-10-25). Business delegation is single-level: its recipient cannot use the delegated authority to delegate onward.

**Personal internal account**: The single account assigned to one internal staff member across the system, carrying their applicable roles and seasonal assignments rather than being shared with others ([D031](design/README.md#d031---one-personal-internal-account-per-person), confirmed 2026-10-25).

**Public competition information**: Competition information approved for unauthenticated viewing within the seasonal/publication scope, including player dates of birth under the Team Leader's v2 decision ([D032](design/README.md#d032---public-information-boundary-including-player-dates-of-birth), confirmed 2026-10-25).

**Internal competition information**: Competition administration, application and personal information outside the approved public scope, accessible only with the applicable authority ([D032](design/README.md#d032---public-information-boundary-including-player-dates-of-birth)). Viewing follows the responsible role and season rather than login alone ([D033](design/README.md#d033---internal-viewing-follows-business-responsibility)).
