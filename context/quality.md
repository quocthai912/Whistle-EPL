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
| TT-03 | Use XLSX for the first-version import/export scope selected in [D078](business.md#d078---xlsx-create-only-import-and-controlled-export). For each supported format, process all records in a file containing at least 100 valid records and preserve 100% of compared field values. Detect/report invalid structure, missing fields, and invalid values without introducing incorrect business data | Medium |
| TT-04 | Use consistent character encoding (UTF-8 is an example); correctly store, search, display, and export Vietnamese text with diacritics. Preserve date/time, score, and identifier values/formats during exchange | High |
| TT-05 | Extensibility to receive/provide data through external APIs. Core functions remain operational without a connection. **If integration is implemented**, validate/normalize structure, handle invalid data, and retain business validation/confirmation steps. Building integration is not mandatory in the first product version | Low |

## Security - hyphenated BM codes (Table 1.5, details pp.23-24)

BM-01 is a security requirement; BM1 is a form. Preserve the spelling to distinguish the two code systems.

| Code | Requirement and verifiable criteria | Priority |
|---|---|---|
| BM-01 | Valid login is required for internal functions; logout/expiry invalidates the old session. Test at least 100 logins with 20 concurrent users; at least 95% of authentication requests respond within 3 seconds. Reject invalid credentials; sessions expire after no more than 30 minutes of inactivity | High |
| BM-02 | Permissions follow roles and responsibility scope, checked on the server. Unauthorized actions through UI, direct URLs, or API requests are rejected without changing data; hiding UI buttons is insufficient | High |
| BM-03 | Use Argon2id under [D081](use-cases/administration.md#d081---password-hashing-and-managed-credential-lifecycle), explicitly refining the source's algorithm examples. Verify no original passwords are stored in the database; correctly accept/reject passwords; do not expose them through UI, responses, or logs | High |
| BM-04 | Server-side input validation rejects missing fields, invalid types/rules with messages. Use safe queries rather than directly concatenating input into SQL. SQL injection/dangerous-content tests must not modify the database without authorization or execute unintended code | High |
| BM-05 | Separate public information from application/contact/internal data; [D032](use-cases/publication.md#d032---public-information-boundary-including-player-dates-of-birth) explicitly permits player birth dates within approved seasonal public lookup; contacts and other internal fields remain restricted (source default §1.2.5.3 p.21). Store business/personal data centrally on the server, without public direct database access. At least 10 unauthorized-access cases through UI/API must all be rejected without sensitive data; public users see only published fields | High |
| BM-06 | Automatically log successful important operations: schedules, official results, regulations, permission changes. Include person, time, action, object, and changed data; before/after values must be searchable. Unauthorized users cannot edit/delete logs. Include reason/effective time when required by the business process (§1.2.5.4 p.21) | High |
| BM-07 | Automatically back up the database at least once per 24 hours; keep at least the 7 most recent backups in a separate access-restricted location. Simulate loss/corruption of a full season's data: restore a valid backup within 30 minutes, matching the backup time and preserving relational integrity | High |

Data transmission requires protection appropriate to the deployment environment (§1.2.5.3 p.21). Browser/API transport uses HTTPS under D080; D087/D096 define the transport contract; actual domain/certificate/trusted-proxy inputs remain deployment configuration.

## Technology - CN (Table 1.6, details p.26)

| Code | Existing constraint and verifiable criteria | Priority |
|---|---|---|
| CN-01 | Client-Server web application with separate UI/server processing and a consistent language/library/tool selection suited to the environment. Install/start successfully in the defined environment; use core functions and communicate with the server through a browser without a separate application installation | High |
| CN-02 | A **relational** database, centralized under §1.2.6.1, with integrity constraints and transactions for seasons/clubs/players/matches/results. Reject relationship violations; failed result confirmation/correction must not persist partial updates | High |
| CN-03 | Version control, dependencies/configuration, and installation-configuration-startup instructions. On a new environment meeting prerequisites, following the instructions must successfully install, connect to the database, and start the system | High |
| CN-04 | Layered/modular organization with clear UI, business, and data-access responsibilities. Rule configuration and component extension must be tested to preserve related functionality without introducing existing-business-function failures | High |

These remain source constraints, not software-completion evidence. Current selections are owned by D002/D079/D082/D085/D086/D095-D097. Physical implementation, exact pins/compatibility evidence and deployment inputs remain outstanding.

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

[LS-01](design/integrations.md#v2-ext-01---live-match-tracking--live-score) excludes Live Score implementation/design from first-version acceptance. Media management and independent operation remain mandatory; football/media-data provider choice remains gated by core acceptance.

## Deployment and selected-storage verification

Verify [D087](design/architecture.md#d087---docker-compose-reference-deployment) for repeatable Compose startup/migration/health checks, same-origin HTTPS and trusted local acceptance certificates, protected secrets, environment separation and data survival across container replacement. Verify [media storage](design/media.md#environment-specific-media-storage) for the selected profile: authorized upload/delivery, file validation, failed-replacement preservation, fallback and coordinated restoration of media content with PostgreSQL metadata. Optional remote storage does not require simultaneous local/remote copies or select a hosting platform. INT-01/TT-05's football/media-data acquisition gate remains unchanged; remote-storage availability is tested under its separate media contract. Preserve all original thresholds, including BM-06/BM-07; the backup/restore contract is settled by [D088](design/architecture.md#d088---coordinated-backup-sets-and-controlled-restore), with scheduling settled by D089 and provider-specific implementation configuration still open. These obligations are not acceptance evidence.

PHASE 1/PHASE 10 verify [D088](design/architecture.md#d088---coordinated-backup-sets-and-controlled-restore) complete coordinated backup sets, drained write maintenance, failure/non-overlap handling, protected retention and off-host Internet copies, same-set database/media restore, invalidated restored sessions and separate-environment recovery drills including corrupt/missing media. Measure against the unchanged BM-07 thresholds; these checks add no completion evidence.

PHASE 1/PHASE 2/PHASE 10 verify [D089](design/architecture.md#d089---periodic-jobs-and-overdue-regulation-activation) minute-based regulation discovery/startup catch-up, correct approved-time versus processing-time behavior, stale-basis blocking, business/technical failure separation, nonduplicating concurrent execution and maintenance coordination. PHASE 1/PHASE 10 verify expiry independent of cleanup and missed-backup handling. These checks preserve source thresholds and do not imply implementation.

### D090 - Reproducible acceptance datasets and season fixtures

**Status:** CONFIRMED by the Team Leader, Q90 option A and the entire proposed package ("Tôi chọn A."). [Approval and rationale](../docs/adr/0015-managed-club-logos-in-first-version.md#q90---acceptance-dataset-and-demonstration-boundary). This owns acceptance-data scope; it changes no source quality threshold or operational season regulation and is not acceptance evidence.

- **Full-season baseline:** Verify 20 participating clubs, 38 rounds, 380 matches and at least 600 Player Profiles. Include a scenario allocating 30 players per club, for example 25 within the squad limit plus 5 qualifying U21 players, satisfying the configured regulations. This fixture is not a new registration limit. Demonstrate actual managed logos for all 20 clubs and player-photo management/display at hundreds-of-profiles scale, retaining D069 fallback and optional-image behavior.
- **Purpose-separated datasets:** Maintain controlled business fixtures for valid/invalid cases, independent approval, transfers, schedule changes/postponement, official-result correction and historical preservation. Historical/performance fixtures contain at least 10 seasons and 3,800 matches with meaningful related records. Import/export fixtures contain at least 100 valid records for each supported template; club/stadium master test records need not all participate in the 20-club season. Demonstration data has documented provenance/usage rights and clearly identifies simulated information.
- **Season configuration:** Each fixture explicitly declares the U21 cutoff, qualifying homegrown training-age range, receipt windows, planned duration, venue buffers and Q/R. Retain source defaults where provided. Values not specified by the source are labelled test parameters, not silently adopted as official EPL regulations. No concrete missing seasonal value is selected by this decision. Operational input, submission and approval still follow the owning UCs; fixtures do not authorize production approval bypasses.
- **Real system path:** Frontend views read the backend/PostgreSQL and selected media storage, not hardcoded fixture mappings. Test fixture loading is an explicit test-environment tool, never an implicit operational startup action. End-to-end acceptance exercises actual UC workflows rather than relying only on preloaded terminal states. Test-data preparation does not implement or approve a production import path for regulations, permissions or Official Results.
- **Reproducibility and expected outcomes:** Record fixture version/configuration and expected standings, scorer/clean-sheet totals, reports and error outcomes. Provide a reset procedure for the test environment. Exclude sensitive personal data and real credentials from fixtures; media requires suitable provenance/usage rights. Controlled synthetic test data remains separate from actual operational information and is not represented as real Premier League facts.
- **Unchanged thresholds and evidence:** Preserve all approved timing, concurrent-load, browser, viewport and recovery criteria. Acceptance records identify hardware, software versions and the dataset measured. The 600-profile baseline is a required verification scale, not a maximum supported count or proof of performance. Concrete environment/tool versions, fixture manifests/season values and authorized assets remain to be prepared and recorded under this policy; no Phase status or whole-v2 approval changes.

PHASE 9/PHASE 10 verify [D091](business.md#d091---fixed-xlsx-templates-and-bounded-data-exchange) template/column/version errors, bounded synchronous import, file/row/decompressed limits, literal dates/codes, unsafe workbook rejection and preview account/content/expiry checks. PHASE 7/PHASE 9 verify complete authorized exports, literal cell safety and no report truncation; retain TT-03/HQ-04 thresholds.

PHASE 1-PHASE 3/PHASE 5/PHASE 8/PHASE 9/PHASE 10 verify [D092](business.md#d092---shared-field-validation-identifiers-and-reference-catalogs) shared UI/API/XLSX field rules, NFC/Unicode lengths, stable normalized code uniqueness, personnel identity/username handling and controlled nationality/13-position values. Preserve D064 separate match position/GK checks, draft milestone completeness, password handling, historical snapshots and original quality thresholds.

PHASE 4/PHASE 10 verify [D093](use-cases/scheduling.md#d093---deterministic-fixture-generation-and-stable-published-match-identity) reproducible circle generation and structural invariants for every supported club count, confirmed draft replacement with cleared manual values, preserved history and complete rollback on failure. PHASE 4/PHASE 5 verify atomic Match creation at initial approval and stable Match references through adjustments/postponement/reporting; source thresholds remain unchanged.

PHASE 1/PHASE 3/PHASE 6/PHASE 10 verify [D094](design/media.md#d094---backend-mediated-media-delivery-and-safe-cleanup) backend-only image delivery, optional Supabase private storage, per-request scope checks/no-store, fallback and daily backup-aware orphan cleanup after 24 hours unreferenced. Verify [audit policy](use-cases/administration.md#audit-access-and-retention---d094) transaction consistency, sensitive-payload filtering, current object-read authority, no audit export and business versus diagnostic retention. Original thresholds remain unchanged.

PHASE 1-PHASE 5/PHASE 7-PHASE 9/PHASE 10 verify [D095](design/architecture.md#d095---domain-specific-relational-tables-and-exact-version-references) scoped FK/version pointers, draft versus milestone completeness, protected deletion, current official-source projection consistency and nonmerged same-minute events in their owning UCs. [Detailed dictionary](design/architecture.md#detailed-relational-dictionary) supplies the design mapping; no schema implementation or acceptance is implied.

PHASE 1/PHASE 10 verify [D096](design/architecture.md#d096---api-execution-synchronized-csrf-and-transaction-contracts) random hashed sessions/protected cookies, prelogin/authenticated synchronizer CSRF and exact origin checks, UTF-8/no-normalization password handling, approved Argon2id baseline and persistent rolling throttling. Owning functional Phases verify their D096 UC matrices, field filtering, version/revision/receipt handling and ordered final authority checks; PHASE 5/PHASE 10 verify atomic official/statistical/review/audit effects. Preserve all 34 source thresholds and whole-package/Phase status.

## D097 test-season and measurement baseline

**Status:** CONFIRMED as part of Q97/D097, with the Team Leader's amended fixture code EPL-TEST-2026. [D097](design/architecture.md#d097---pnpm-toolchain-development-quality-and-reference-operations) owns technology/development/operations; this section owns fixture and measurement configuration. These are controlled test inputs, not actual EPL rules or operational-season approval.

| Fixture parameter | Approved test value |
|---|---|
| Code / dates | EPL-TEST-2026; 2026-08-01 through 2027-05-31 |
| Full-season scale | 20 clubs, 38 rounds, 380 matches, at least 600 Player Profiles under D090 |
| Squad / non-homegrown limit | 25 / 17, retaining source defaults |
| U21 | birthDate on/after 2005-01-01 |
| Homegrown | At least 3 seasons or 36 months, with test training-age range [15,21) |
| Planned duration | 120 minutes |
| Stadium preparation / release buffers | 30 / 30 minutes |
| Win / draw / loss points | 3 / 1 / 0 |
| Qualification / relegation Q/R | 4 / 3 |
| Club intake | [2026-06-01 00:00, 2026-08-01 00:00) |
| Player intake | [2026-06-01 00:00, 2026-09-01 00:00) and [2027-01-01 00:00, 2027-02-01 00:00) |

All intake endpoints above use Asia/Ho_Chi_Minh and D024 UTC storage; cutoff/birth dates remain date-only. The test homegrown age window includes the 15th birthday and excludes the 21st, as its [15,21) notation states; it is not imported as an official external-league rule. Use an isolated controlled test clock for temporal scenarios rather than a client API overriding trusted operational time. Real operational regulations still require UC06 input/approval; do not auto-seed these values as official, backdate receipts or bypass approval in production.

| Measurement item | Approved baseline and evidence |
|---|---|
| Reference server | 4 vCPU, 8 GiB RAM, SSD; record actual hardware/software/disk capacity sufficient for data and retained backup sets |
| Lookup load | 20 concurrent users; 1-minute warm-up followed by 10 minutes measured; report each lookup group so a fast group cannot hide a slow one |
| Historical data | At least 10 seasons/3,800 matches under TH-05/HQ-03 with D090 reproducibility and expected outputs |
| API versus UI | Measure separately; API success does not establish browser readiness/usability. Use actual backend/database/media paths rather than mock production data |
| Browser coverage | Actual Google Chrome and Microsoft Edge, with recorded versions; Playwright's bundled Chromium alone does not replace TT-01 |
| Regression coverage | All original source timing/report/browser/viewport/navigation/security/backup criteria, plus the approved domain contracts |

Retain the three TT-02 viewports, TD-01 representative-user trials, TT-03 valid-record/field-preservation requirements, HQ-01-HQ-04 and BM-01/BM-07 thresholds exactly. Source rows above remain unchanged. Backend integration verification uses PostgreSQL rather than a different in-memory database to assert locking/FK/transaction behavior. Execute boundary/race/failure cases and complete media/backup restore drills for the selected profile. Approved test tools are listed once in D097; selecting a runner, fixture or machine is not evidence of a passed test.

## Root source-quality verification contract

PHASE 1 must establish D097's root pnpm lint, pnpm typecheck and pnpm format commands for both frontend/backend. Owning Phases run the relevant source checks and meaningful tests as changes require; retain real outputs/revisions/environment in evidence. Formatting scopes exclude Context/ADR documents and generated artifacts. No command was installed or executed as a software check during this interview, and no Phase checkbox/status is completed by approving this contract.
