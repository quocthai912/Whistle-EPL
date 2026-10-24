# Project overview and business model

Sources: PDF §1.1 pp.4-5; §1.3 pp.33-39; §1.4 pp.39-49; §1.5 pp.50-52; §2.1 p.53. See [sources.md](sources.md) for citation conventions.

Whistle-EPL simulates seasonal English Premier League management: centralized data, support for organization, monitoring, lookup, consistent updates, and traceability of important changes. The software supports business activities rather than replacing all real-world football administration. The learning objective is to apply software engineering processes from investigation to design and implementation, understand Client-Server architecture, and handle concurrent requests (§1.1.2).

## Scope

Includes season and regulation management; clubs, stadiums, player profiles, club registration applications, and seasonal player registrations; schedule creation and adjustment; match reports, scores, player appearances, goals, yellow/red cards; result confirmation and correction; automatic standings, goalscoring, and clean-sheet aggregation; lookup and report generation/export; accounts, authorization, logs, backup/recovery. News/announcements are in scope under UC24-UC25 (§2.2.5 p.58 and §2.4.1.24-25 pp.134-139), although they are not a separate row in Table 1.1.

Currently out of scope: complex financial/commercial management, online ticket sales, advanced broadcasting/VAR integration (§1.1.2.2 p.5); disciplinary decisions, accumulated cards, and playing suspensions (§1.3.4.3 p.39); goalkeeper substitutions in clean-sheet calculations (QĐ5.7 p.11). External football API integration is a conditional extension, not mandatory (TT-05 p.20). Formats other than double round-robin are future extensions; unsupported configurations must be explicitly rejected (TH-02 p.13).

## Six actors

| Official actor | Responsibilities under §1.3.3 p.35 and §2.1 p.53 |
|---|---|
| System Administrator | Create/update/lock/unlock accounts, roles, and permissions; configuration/catalogs and incident handling within assigned responsibilities; authorized log lookup |
| Organizing Committee / Season Manager | Seasons, participating clubs, regulations, supervision of registration/schedules/results; approval and confirmation within permissions; generate/view/export reports |
| Registration Officer | Receive/update/review club and player records; validate eligibility; submit eligible applications for approval |
| Scheduling Officer | Stadiums, rounds, fixtures, times; conflict checks; authorized adjustments to matches not yet played and their history |
| Results Officer | Match reports, scores, appearance lists, goals, cards; validate/submit for confirmation; edit unconfirmed data; correct official results if authorized |
| Public Viewer | Read-only public information: seasons, clubs, players, schedules, official results, standings, statistics, published news |

A club representative supplies BM1 information but is not established as an actor who approves their own application (UC08 p.85). UC20 is internal processing called by UC18/UC19; UC11 is validation through UC10, not an additional system actor or a screen for arbitrary points updates.

## Business objects and relationships

§1.3.4.1 pp.37-38 and Figure 1.2 p.38 identify: Season, Season Regulations, Club, Stadium, Player, Club Registration Application, Seasonal Player Registration, Match Round, Match, Match Report and Result, Player Appearance List, Goal Event, Card Event, Standings, Competition Report, User Account, Change History. News/announcements are added in UC24-UC25 and Figures 2.53/2.55. These are business concepts, not database tables.

Clubs and players have separate identity records; participation applications and player registrations belong to a club/season and have their own statuses and effective periods. A seasonal club application includes the representative, coach, and home ground. Multiple clubs may use a stadium (QĐ2.5). A season organizes rounds and matches; a match references two clubs and a stadium; its report associates the match, appearances, and events. Official results produce statistics/standings; reports aggregate that data. History identifies the person making a change and the affected object. Detailed information to manage appears in the BM, UC, and object table on pp.37-38; this does not imply keys, column types, or technical cardinalities.

The business information required by the table in §1.3.4.1, beyond fields listed in the [forms](business.md), is retained below so information appearing only in the object table is not lost. These are business attributes, not database design.

| Object | Additional information under pp.37-38 |
|---|---|
| Season | Code, name, start/end dates, status |
| Season regulations | Applicable season, registration conditions, format, points rules, ranking criteria, effective date/time, approval status |
| Club | Code, name, abbreviation, contact information, active status |
| Stadium | Code, name, location, clubs using it, active status |
| Player | Code, full name, date of birth, nationality, playing position, necessary profile information |
| Club registration application | Season, club, representative, coach, home ground, registration date, application status |
| Seasonal player registration | Player, club, season, shirt number, registration category, homegrown information, effective period, status |
| Match round | Code, season, round number, organizational status |
| Match | Code, season, round, home/away teams, date/time, stadium, status |
| Match report and result | Match, score, confirmation status, referee information, updater, confirmation time |
| Appearance list | Match, player, club, playing position, shirt number |
| Goal event | Match, player, club, type, scoring time |
| Card event | Match, player, club, yellow/red type, card time |
| Standings | Season, club, matches/wins/draws/losses, goals for/against, goal difference, points, rank |
| Competition report | Season, report type, aggregation time, confirmation status, related statistics |
| User account | Code, username, protected authentication information, role, status |
| Change history | Record code, person, time, action, affected object, before/after values |

## Processing sequence and dependencies

Season + effective regulations → club/player records → registration validation and approval → valid schedule, approval/publication → match report/unofficial result → confirmation after the match ends → automatic standings/statistics update → lookup and reporting → season summary/archive only after all results and ranking decisions are complete. Invalid applications return for supplementation; conflicting schedules return for adjustment; invalid reports return for correction before confirmation (§1.4.2-3 pp.41-47).

UC10 «include» UC11 (Figure 2.3 pp.61-62); UC18 and UC19 «include» UC20 (Figure 2.2 p.60). Schedule adjustment requires approval/delegation; “Request authorization” in the figure has no independent UC code in the 25-UC list. Authorization includes role management in the UC03 decomposition (Figure 2.6 p.66). Authentication, permissions, input validation, history, and seasonal separation apply throughout.

UC14 retains the current schedule while approval is pending. UC19 preserves before/after result history and recalculates statistics/reports; official results are not edited through UC17. Draft/pending results must not be used as public results. Missing effective regulations must be reported as insufficient basis, not replaced with another season's rules.

## Plan in the report

§1.5 selects Modified Waterfall for a three-member team, with an estimated 10 weeks: investigation in week 1; analysis/specification of 25 UCs in week 2; design in weeks 3-5; implementation/integration in weeks 6-8; testing/acceptance in weeks 9-10. Earlier stages may be revisited following review of errors/changes; progress is monitored weekly and outputs reviewed at handover milestones. This is the report's plan, not observed progress or newly assigned calendar deadlines. Business Phases in the [Progress Checker](progress-checker.md) partition implementation scope within that process; they neither replace its five stages nor assign members/deadlines automatically.
