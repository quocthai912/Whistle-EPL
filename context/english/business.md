# Business requirements, forms, and regulations

Source: §1.2.1, Table 1.1, and §1.2.1.1 pp.6–11. The sections below retain PDF codes and do not add external EPL regulations. [Provenance](sources.md) · [Open decisions](open-decisions.md).

## Six business requirements

| Original no. | Requirement | Forms | Regulations | Related UCs | Owning Phase |
|---|---|---|---|---|---|
| 1 | Receive registration applications | BM1 | QĐ1 | UC08–UC11; data from UC07, UC09, UC12 | PHASE 3 |
| 2 | Create the match schedule | BM2 | QĐ2 | UC13–UC15 | PHASE 4; lookup in PHASE 6 |
| 3 | Record match results | BM3 | QĐ3 | UC16–UC20 | PHASE 5 |
| 4 | Look up competition information | BM4.1–BM4.4 | QĐ4 | UC15, UC21, UC23; season information in UC05 | PHASE 6 |
| 5 | Generate competition reports | BM5.1–BM5.3 | QĐ5 | UC20, UC22 | PHASE 5 calculates statistics; PHASE 7 generates/exports reports |
| 6 | Change regulations | No separate form in Table 1.1 | QĐ6 | UC06 | PHASE 2 |

Accounts/logs (PHASE 1), master data (PHASE 2), news (PHASE 8), data import/export (PHASE 9), and whole-system acceptance (PHASE 10) are traced to other sections of Chapters 1–2; they are not added as a seventh requirement in Table 1.1.

## Fields in the 10 forms

The columns and information below are business form content, not UI, schema, or API definitions. The forms do not fully mark required fields; do not assume every displayed field is mandatory or public. Cross-check BM-05 and open points O04/O09.

| Code and original form name translated | Pages | Information/columns to retain |
|---|---|---|
| BM1 - Team Profile | 6 | Representative: Full name, Phone number, Contact address. Team: Team name, Home ground, Coach. Registration list: No., Player, Date of birth, Playing position, Shirt number, Registration category, Notes |
| BM2 - Match Schedule | 7 | Match round, Season; No., Team 1 (Home), Team 2 (Away), Date - Time, Stadium |
| BM3 - Match Result | 7–8 | Season, Match round, Date - Time, Team 1 (Home), Team 2 (Away), Final score, Stadium. Appearance list: No., Player, Team, Position, Shirt number. Goals: No., Player, Team, Goal type, Time. Cards: No., Player, Team, Card type, Time. Referee's signature |
| BM4.1 - Competition Information Lookup | 8 | Competition name, Season, Number of participating clubs, Number of rounds, Total matches, Start - End dates |
| BM4.2 - Team Information Lookup | 8 | Season; No., Team name, Head coach, Home ground, Number of players, Representative |
| BM4.3 - Player Information Lookup | 9 | Season; No., Player, Date of birth, Registration category, Shirt number, Team name, Goals |
| BM4.4 - Schedule and Results Lookup | 9 | Season; Round, Home team, Away team, Date - Time, Stadium, Score |
| BM5.1 - Standings | 9–10 | Season, Date; Rank, Team, Matches, Wins, Draws, Losses, BT, BB, HS, Points |
| BM5.2 - Goalscorers List | 10 | Season, Date; No., Player name, Team name, Registration category, Total goals |
| BM5.3 - Season Summary | 10 | Season, Report date; Champion, Runner-up, Third place; relegated clubs table: No., Standings position, Club name (three rows in the form); Top scorer, Golden Glove, Total competition goals |

## Detailed regulations

The 37 clauses are transcribed from the PDF by group below. Default values follow the source; QĐ6 permits controlled seasonal changes, not automatic use of a different configuration.

### QĐ1

Source: §1.2.1.1.1, pp.6–7.

- **QĐ1.1:** Each participating club must have a registration application for each season, containing club information, its representative, and its player list.
- **QĐ1.2:** Each club may register at most 25 players on its official squad list, including at most 17 players who do not meet the homegrown criteria.
- **QĐ1.3:** A player meets the homegrown criteria if registered for at least three seasons or 36 months with clubs affiliated to the English or Welsh football associations during the prescribed age period, regardless of nationality.
- **QĐ1.4:** U21 players register outside the 25-player limit. U21 eligibility is determined by the date-of-birth cutoff for each season.
- **QĐ1.5:** A player may have only one active playing registration at a time within the same competition.
- **QĐ1.6:** Registration applications and player-list changes must comply with the season's registration deadlines and permitted exceptions.

### QĐ2

Source: §1.2.1.1.2, p.7.

- **QĐ2.1:** Each season has 20 participating clubs. Only clubs with valid registration applications may be included in the schedule.
- **QĐ2.2:** The competition uses a double round-robin format. Each club plays the other 19 clubs twice (one home and one away match), giving 38 matches per club and 380 matches across 38 rounds.
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

Source: §1.2.1.1.5, pp.10–11.

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
