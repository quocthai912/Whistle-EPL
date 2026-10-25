# Quality requirements and constraints already in the report

Source: §1.2.2-1.2.8 pp.11-32. All 34 original requirement codes are retained. Descriptions/criteria below are presented concisely from the detailed tables; all numeric thresholds remain unchanged. Read with the [Progress Checker](progress-checker.md) for responsible Phases; approved design is indexed in [design navigation](design/README.md), with remaining choices in [open decisions](open-decisions.md). Cross-cutting requirements must be checked in functional Phases and regression-tested in PHASE 10.

## Evolution - TH (Table 1.2, details pp.13-14)

| Code | Requirement and verifiable criteria | Priority |
|---|---|---|
| TH-01 | Configure squad limits, homegrown criteria, U21 conditions, and registration deadlines by season without changing application-intake code. New-season configuration must validate against the new rules, reject invalid applications, and preserve prior-season registrations | High |
| TH-02 | Adjust club count, legs/format by season; the first version supports double round-robin. The default 20 clubs must produce exactly 38 rounds and 380 matches, each pair playing twice with home/away roles reversed, with conflict checks. Unsupported configurations/formats must be reported and invalid schedule creation rejected | Medium |
| TH-03 | Configure win/draw/loss points and ranking-priority order under approved rules. For a season eligible for adjustment, calculate standings using the valid new configuration without automatically changing another season's results | High |
| TH-04 | Add/update/discontinue clubs, stadiums, goal types, and card types; new activities use valid information while historical references to old information remain searchable | High |
| TH-05 | Independently manage applications, schedules, results, standings, and regulations across seasons without redesigning the entire system. Test at least 10 seasons, equivalent to 3,800 matches; updating one season must not change another; assess lookup against HQ-03 | High |
| TH-06 | Record before/after values, effective time, and person making important regulation/data changes. After valid corrections to regulations, schedules, or official results, authorized users must be able to inspect the content, person, and time; preserve history | High |

## Efficiency - HQ (Table 1.3, details p.16)

| Code | Requirement and verifiable criteria | Priority |
|---|---|---|
| HQ-01 | Club, player, schedule, result, and standings lookups: at least 95% of ordinary requests respond within 2 seconds, using one EPL season of data, 20 concurrent users, and a defined test environment | High |
| HQ-02 | Valid result confirmation/correction automatically updates statistics and reduces manual work. At least 95% of updates complete within 2 seconds; standings/statistics are accurate after processing, without contradictions or partial updates | High |
| HQ-03 | With at least 10 seasons/3,800 matches, at least 95% of seasonal historical lookups respond within 2 seconds under the same lookup load as HQ-01, while preserving accuracy | High |
| HQ-04 | Aggregating, generating, and exporting each report in a supported format takes no more than 5 seconds with a complete season/380 matches; content matches confirmed results/statistics | Medium |

Measure these targets in a defined environment and compare with the intended deployment environment (§1.2.3.1 p.14). Do not add a schedule-generation time limit that the report has not quantified.

## Compatibility - TT (Table 1.4, details pp.19-20)

| Code | Requirement and verifiable criteria | Priority |
|---|---|---|
| TT-01 | Login, applications, scheduling, results, lookup, reports, and regulations work correctly on both Google Chrome and Microsoft Edge, with consistent display/processing and no compatibility errors blocking operations | High |
| TT-02 | Administration prioritizes desktop use; lookup at 360 × 800, 768 × 1024, and 1366 × 768 pixels must display necessary content, support main operations, and leave interactive elements unobscured. Wide tables may scroll horizontally within the table | High |
| TT-03 | Select CSV or XLSX import/export formats in v2. For each supported format, process all records in a file containing at least 100 valid records and preserve 100% of compared field values. Detect/report invalid structure, missing fields, and invalid values without introducing incorrect business data | Medium |
| TT-04 | Use consistent character encoding (UTF-8 is an example); correctly store, search, display, and export Vietnamese text with diacritics. Preserve date/time, score, and identifier values/formats during exchange | High |
| TT-05 | Extensibility to receive/provide data through external APIs. Core functions remain operational without a connection. **If integration is implemented**, validate/normalize structure, handle invalid data, and retain business validation/confirmation steps. Building integration is not mandatory in the first product version | Low |

## Security - hyphenated BM codes (Table 1.5, details pp.23-24)

BM-01 is a security requirement; BM1 is a form. Preserve the spelling to distinguish the two code systems.

| Code | Requirement and verifiable criteria | Priority |
|---|---|---|
| BM-01 | Valid login is required for internal functions; logout/expiry invalidates the old session. Test at least 100 logins with 20 concurrent users; at least 95% of authentication requests respond within 3 seconds. Reject invalid credentials; sessions expire after no more than 30 minutes of inactivity | High |
| BM-02 | Permissions follow roles and responsibility scope, checked on the server. Unauthorized actions through UI, direct URLs, or API requests are rejected without changing data; hiding UI buttons is insufficient | High |
| BM-03 | Use a dedicated password-hashing algorithm; Argon2id and bcrypt are examples, not selected choices. Verify no original passwords are stored in the database; correctly accept/reject passwords; do not expose them through UI, responses, or logs | High |
| BM-04 | Server-side input validation rejects missing fields, invalid types/rules with messages. Use safe queries rather than directly concatenating input into SQL. SQL injection/dangerous-content tests must not modify the database without authorization or execute unintended code | High |
| BM-05 | Separate public information from application/contact/internal data; [D032](use-cases/publication.md#d032---public-information-boundary-including-player-dates-of-birth) explicitly permits player birth dates within approved seasonal public lookup; contacts and other internal fields remain restricted (source default §1.2.5.3 p.21). Store business/personal data centrally on the server, without public direct database access. At least 10 unauthorized-access cases through UI/API must all be rejected without sensitive data; public users see only published fields | High |
| BM-06 | Automatically log successful important operations: schedules, official results, regulations, permission changes. Include person, time, action, object, and changed data; before/after values must be searchable. Unauthorized users cannot edit/delete logs. Include reason/effective time when required by the business process (§1.2.5.4 p.21) | High |
| BM-07 | Automatically back up the database at least once per 24 hours; keep at least the 7 most recent backups in a separate access-restricted location. Simulate loss/corruption of a full season's data: restore a valid backup within 30 minutes, matching the backup time and preserving relational integrity | High |

Data transmission requires protection appropriate to the deployment environment (§1.2.5.3 p.21); the specific mechanism is not selected.

## Technology - CN (Table 1.6, details p.26)

| Code | Existing constraint and verifiable criteria | Priority |
|---|---|---|
| CN-01 | Client-Server web application with separate UI/server processing and a consistent language/library/tool selection suited to the environment. Install/start successfully in the defined environment; use core functions and communicate with the server through a browser without a separate application installation | High |
| CN-02 | A **relational** database, centralized under §1.2.6.1, with integrity constraints and transactions for seasons/clubs/players/matches/results. Reject relationship violations; failed result confirmation/correction must not persist partial updates | High |
| CN-03 | Version control, dependencies/configuration, and installation-configuration-startup instructions. On a new environment meeting prerequisites, following the instructions must successfully install, connect to the database, and start the system | High |
| CN-04 | Layered/modular organization with clear UI, business, and data-access responsibilities. Rule configuration and component extension must be tested to preserve related functionality without introducing existing-business-function failures | High |

These are existing constraints, not new design choices. Framework, database product, module model, ERD/schema, API, and specific environment await v2.

## Usability - TD (Table 1.7, details p.29)

| Code | Requirement and verifiable criteria | Priority |
|---|---|---|
| TD-01 | Navigate by application/schedule/result/lookup/report/regulation groups, using consistent labels/terms and appropriate roles. At least 20 trials with 5 representative users × 4 authorized tasks; at least 80% find the function within 30 seconds and no more than 3 navigation actions | High |
| TD-02 | Clearly display required fields, formats, and guidance. Missing/incorrectly formatted/rule-violating data: identify the field/condition, explain corrections, block invalid saves, and retain valid entered information | High |
| TD-03 | Schedule, official-result, and regulation changes require a confirmation dialog identifying content and affected objects. Cancel leaves saved data unchanged; confirmation executes only with permissions and conditions satisfied; allow unsaved edits to be discarded | High |
| TD-04 | Player/club name searches and season/related filters return the correct dataset. Lists exceeding 20 records provide clear pagination with no omitted/duplicate records across pages | High |

## Safety - AT (Table 1.8, details p.32)

| Code | Requirement and verifiable criteria | Priority |
|---|---|---|
| AT-01 | Validate applications/schedules/results before recording. Reject invalid data and preserve valid saved data. Repeated requests to confirm the same result must not double-count matches, points, or goals; count each match once except for valid corrections | High |
| AT-02 | Update related data consistently with conflict detection/handling. Simulated result-update failures leave no partial data/statistics; two users editing one record must not silently overwrite the earlier saved change, and must be notified to resolve the conflict | High |
| AT-03 | Schedule/official-result/regulation corrections respect status, conditions, authority, and season scope. Invalid changes are rejected with data preserved; valid changes leave results and statistics consistent | High |
| AT-04 | Preserve season-club-player-match-result relationships. Block deletion/changes that break historical references; support discontinuation/archiving. Discontinuing a club or adding a season must not distort previous applications/schedules/results/reports; history remains accurately searchable | High |
## Confirmed media and external-dependency constraints

Use the authoritative [media policy](design/media.md) for managed images and [integration gates](design/integrations.md) for external dependencies. Verification belongs to the [Progress Checker](progress-checker.md); source quality thresholds remain unchanged. This page does not repeat those policies.

## Postponement and dashboard verification

Verify [POSTPONE-01](use-cases/scheduling.md#postpone-01---first-version-match-postponement) and [DASHBOARD-01](use-cases/publication.md#dashboard-01---season-overview-dashboard) under their finalized contracts: authorized audited state changes, visible postponement without unapproved replacement times, no statistical side effects, real access-scoped dashboard data, official-only statistics, responsive media and explicit Loading/Empty/Error states. Preserve all source numeric thresholds; select no new UI library.

[LS-01](design/integrations.md#v2-ext-01---live-match-tracking--live-score) excludes Live Score implementation/design from first-version acceptance. Media management and independent operation remain mandatory; provider choice remains gated by core acceptance.
