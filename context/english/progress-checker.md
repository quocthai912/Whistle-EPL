# Progress Checker - Phase development and acceptance

This is **Context v1's proposed scope decomposition, awaiting team leader approval**, not a Spec/Plan/Task. Source requirements are in [business](business.md), [quality](quality.md), and [UC navigation](README.md); the full matrix is in [sources.md](sources.md). PHASE 1–PHASE 10 are internal organizational codes absent from the PDF. All ten Phases are mandatory for the current scope; TT-05 external API integration is conditional and does not create a mandatory integration Phase.

## Status and evidence

| Status | Meaning |
|---|---|
| `NOT_STARTED` | Inventory evidence indicates implementation of the Phase scope has not started |
| `IN_PROGRESS` | Implementation is underway; identify completed scope and what remains unaccepted |
| `BLOCKED` | Identify the actual issue/dependency preventing work, responsible person, and release condition |
| `COMPLETED` | Real functionality exists, every Phase criterion passes, verification evidence is complete, and acceptance is recorded |
| `UNKNOWN` | Inspection/evidence is insufficient to determine status; do not infer not-started or complete |

Inventory dated 24/10/2026 (Asia/Bangkok), HEAD `a7631efc05061e221a2d7d4ea3da80aafc084615`, clean working tree before creating v1: `git status --short`, `git ls-files`, and `rg --files` found only agent guidance, skills, the `.specify` skeleton, LICENSE, and configuration; no application source, application manifest/build, or functional test suite. `.specify/memory/constitution.md` still contains placeholders. Accordingly PHASE 1–PHASE 10 are `NOT_STARTED` **in this checkout**. Other branches/checkouts were not inspected; this does not establish the entire team's status. Context files added in this work do not change implementation status.

Each Phase below lists **required evidence**, not existing implementation/test evidence. When updating status, add Specification, Plan, `tasks.md`, and Issue links; source revision or snapshot, date/environment/dataset, actual commands or scenarios and results, passed/unmet criteria, open defects, and acceptance reviewer. Do not prepopulate invented paths.

Creating Context/Specification/Plan/Tasks does not complete functionality. Closing all Issues is also insufficient. Set `COMPLETED` only after functionality and all criteria are verified with suitable evidence; do not invent test results or automatically complete successor Phases. If changes invalidate previous evidence, reassess and record observed status (or `UNKNOWN` when evidence is insufficient).

## Checklist and bilingual updates

- `[ ]` means completion has not been verified for that item; missing evidence does not prove the work was never performed.
- Use `[x]` only when identifiable evidence demonstrates that specific item is complete. Record its link/result in Verification Evidence; a checked preparation item does not prove implementation.
- Keep the five status meanings above. Preparation documents may be complete while implementation remains `NOT_STARTED`; do not derive status or a completion percentage from checkbox counts. A completed Phase requires all mandatory checklist items, all acceptance criteria, and valid evidence.
- The [English](progress-checker.md) and [Vietnamese](../vietnamese/progress-checker.md) documents are synchronized language views of one Phase ledger. Update item meaning/order/state, evidence, and Phase status together in the same change. Resolve discrepancies against actual evidence or report them; do not maintain independent progress.
- All items introduced in this migration remain unchecked because suitable completion evidence is absent. Existing Phase statuses are preserved; no software implementation progress is claimed. Project Phases are distinct from internal phases in Spec Kit `tasks.md`; this checklist does not duplicate the Task ledger.

## Phase selection and ordering

**G0 - Prerequisites outside implementation Phases:** the team leader approves Context v1, finalizes/approves the v2 decisions needed by the Phase (especially O12 for the foundation), and resolves open points affecting its Specification. G0 is a condition, not a software Phase completed by writing documents. No Phase is asserted ready for implementation until G0 is satisfied.

After G0, select a Phase with satisfied dependencies → Specification against approved Context → Plan using Spec Kit → Tasks and dependencies → Task approval → one GitHub Issue per Task under the [conventions](../../docs/agents/issue-tracker.md) → Implementation → Testing & Acceptance → `COMPLETED`. Begin dependent steps only with appropriate inputs; documenting a Phase with unresolved blockers does not release implementation.

| Phase | Owned scope | Acceptance dependencies | Implementation Status |
|---|---|---|---|
| PHASE 1 - Operational foundation and access administration | Web foundation, accounts/sessions/permissions, log recording/search | G0 | `NOT_STARTED` |
| PHASE 2 - Seasons, catalogs, and regulations | Seasons, club master records, stadiums, seasonal regulations | PHASE 1 | `NOT_STARTED` |
| PHASE 3 - Profiles and player registration | Player profiles, seasonal club applications, registration and validation | PHASE 1, PHASE 2 | `NOT_STARTED` |
| PHASE 4 - Schedule creation and adjustment | Double round-robin schedules, conflict checks, approval, adjustment | PHASE 2, PHASE 3 | `NOT_STARTED` |
| PHASE 5 - Official results and statistics | Match reports, results, confirmation/correction, automatic standings/statistics | PHASE 1, PHASE 2, PHASE 3, PHASE 4 | `NOT_STARTED` |
| PHASE 6 - Competition information lookup | BM4.1–4.4, schedules, matches, clubs/players, public standings/statistics | PHASE 2, PHASE 3, PHASE 4, PHASE 5 | `NOT_STARTED` |
| PHASE 7 - Reports and season summary | Preview/generate/export BM5.1–5.3 | PHASE 1, PHASE 2, PHASE 5 | `NOT_STARTED` |
| PHASE 8 - News and announcements | Manage/publish/view news | PHASE 1, PHASE 2; season association under O15 | `NOT_STARTED` |
| PHASE 9 - Data exchange import and export | Approved-format data import/export, without replacing UC22 | PHASE 1, PHASE 2 and the Phases owning data selected in O11 | `NOT_STARTED` |
| PHASE 10 - Integration, regression, and system acceptance | Integration, backup/recovery, quality, operations, handover | PHASE 1–PHASE 9 `COMPLETED` | `NOT_STARTED` |

Expected parallel work: after PHASE 2, PHASE 3 and PHASE 8 can be developed independently; PHASE 9 may handle data with approved contracts but is accepted only when all selected sources are available. After PHASE 5, PHASE 6 and PHASE 7 can run in parallel using official statistics owned by PHASE 5. PHASE 6's read-only functions may be prepared as individual sources become available, but the entire Phase cannot finish before PHASE 5. These are data/scope relationships, not service, API, repository, or member-assignment decisions. Parallel work still follows the approved Spec→Tasks workflow.

## PHASE 1 - Operational foundation and access administration

**Implementation Status:** `NOT_STARTED`.

**Scope:** Application foundation under CN-01–04; UC01–UC04; accounts/roles, sessions, server-side permissions and input validation; shared logging mechanism. Specific business events are added/accepted in the Phases that produce them; full-system backup/recovery belongs to PHASE 10.

**References:** §2.4.1.1–4 pp.67–76, §1.3.3 pp.35; BM-01–BM-06 pp.23–24; CN-01–CN-04 pp.26; TD-02/03, AT-02/04. [UC](use-cases/administration.md).

**Dependencies:** G0; decisions O08, O12–O14, and the data-classification part of O04.

**Deliverables:** A runnable application, account/role administration, sessions/permissions, log recording/search, and foundation-environment setup instructions.

### Progress Checklist

- [ ] The authentication, authorization, and logging Specification is written and approved.
- [ ] The foundation Implementation Plan is completed against approved decisions.
- [ ] Tasks and dependencies are approved, with one linked Issue per Task under the conventions.
- [ ] The foundation installs/starts from the instructions in a new environment.
- [ ] UC01–UC03, session management, and server-side permission checks work within scope.
- [ ] UC04 and permission/login/logout logs have real records with authorized access.
- [ ] Password, dangerous-input, unauthorized-access, save-failure, and BM-01 load tests meet the criteria.
- [ ] Administration/session functional and regression tests pass; Phase acceptance evidence is complete.

**Acceptance Criteria:** UC01–UC04 pass main/alternative/exception flows; lock/unlock and role assignment respect scope. BM-01 meets 100 attempts/20 concurrent users/95% within 3 seconds, inactivity timeout ≤30 minutes, and no reuse of old sessions. Check direct unauthorized access, dangerous input, password secrecy/no plaintext storage; real permission/login/logout logs exist, and lookup does not modify data. Check constraints and non-partial failed updates within administration. A fresh foundation installation runs from the instructions; business operations and module structure are further verified in subsequent Phases/PHASE 10.

**Verification Evidence:** Source revision plus UC/permission/session/input and authentication-load results; inspection of protected password data; sample audit records; new foundation-environment setup procedure and results. No such evidence exists in v1.

## PHASE 2 - Seasons, catalogs, and regulations

**Implementation Status:** `NOT_STARTED`.

**Scope:** UC05, UC06, UC07, UC12: seasons, club master records, stadiums, status/catalog management, and seasonal regulation sets/approval/effectivity. PHASE 3 owns participation applications and players, which are not duplicated here.

**References:** §1.3.4 pp.37–39; QĐ6.1–6.6 pp.11; TH-01–TH-06; AT-03/04; BM-02/04/06; CN-02/04; TD-02/03/04. [UC05–07](use-cases/registration.md), [UC12](use-cases/scheduling.md).

**Dependencies:** PHASE 1; O01/O02 (registration configuration), O05/O07/O08/O09/O10, and relevant O12 decisions.

**Deliverables:** Season/club/stadium management; regulations validated, approved, and applied at the correct effective time; catalogs preserving history.

### Progress Checklist

- [ ] The season, catalog, and regulations Specification is approved.
- [ ] The Implementation Plan is completed against settled effectivity/approval decisions.
- [ ] Tasks and dependencies are approved and linked to Issues under the conventions.
- [ ] UC05/UC07/UC12 manage seasons, club master records, and stadiums with valid constraints.
- [ ] UC06 validates, approves, and applies regulations at the correct effective time and records history.
- [ ] Configuration, points ordering, catalog discontinuation, and two-season preservation tests pass.
- [ ] Functional, save-failure/permission, and referenced-data regression tests pass.
- [ ] All in-scope Phase criteria and evidence are verified.

**Acceptance Criteria:** All flows/exceptions of the four UCs pass; reject missing fields/duplicate identifiers/unauthorized actions, preserving previous data on save failures. Pending regulations do not take effect automatically; record person/time/before–after/basis under UC06; win points > draw points > loss points. Registration, points/ranking, and catalog configuration can be changed under QĐ6/TH without changing business code where required. Changing catalogs/stadiums/clubs preserves used references; new seasons do not alter prior history. Unsupported format configurations cannot generate invalid schedules. Configuration use is further accepted in PHASE 3/PHASE 4/PHASE 5/PHASE 10.

**Verification Evidence:** CRUD/approval/effectivity/invalid-data scenarios, before/after history samples, two-season and referenced-data comparisons; configuration checks and regression as later Phases use it.

## PHASE 3 - Profiles and player registration

**Implementation Status:** `NOT_STARTED`.

**Scope:** UC08–UC11, including UC09 player master profiles, seasonal club applications, approval, registration lists, and explainable UC11 eligibility checks.

**References:** BM1, QĐ1.1–1.6 pp.6–7; §1.4.3.1 pp.42–43; §2.4.1.8–11 pp.85–97; TH-01/04/05/06; BM-02/04/05/06; TD-01–04; AT-01–04. [UC](use-cases/registration.md).

**Dependencies:** PHASE 1/PHASE 2; O01/O02/O04/O08/O09.

**Deliverables:** Player profiles, BM1 club participation applications, supplementation/review/approval/rejection flows, seasonal registration, and reasoned eligibility validation.

### Progress Checklist

- [ ] The profiles, registration, and approval-conditions Specification is approved.
- [ ] The seasonal-registration Implementation Plan is completed.
- [ ] Tasks and dependencies are approved and linked to Issues under the conventions.
- [ ] UC08/UC09 manage profiles and supplementation/review/approval/rejection with correct permissions.
- [ ] UC10/UC11 check 25/17 limits, homegrown criteria, U21, deadlines, and active registrations.
- [ ] Boundary, insufficient-basis, not-applicable, and conflicting-registration cases return correct results.
- [ ] BM1, permissions/personal data, history, and two-season cross-checks pass.
- [ ] Functional, regulation-integration, and regression/save-failure tests pass; acceptance evidence is complete.

**Acceptance Criteria:** All UC08–11 flows and exceptions pass. Validate default limits of 25 official-list players, at most 17 non-homegrown players, 3 seasons or 36 months within the approved age period, and U21 based on the seasonal cutoff outside the 25-player limit; do not infer from nationality. Block conflicting active registrations, out-of-window registrations without exceptions, and wrong-season/duplicate applications; missing data/regulations return insufficient basis without borrowing another season's rules. Failed eligibility does not become valid; not-applicable fields are not errors. Review/approval respects permissions/status and history; save failures do not leave partial approval. New-season configuration uses new rules while preserving previous seasons; pagination and data protection meet requirements.

**Verification Evidence:** Boundary-case matrix for squad limits/training/U21/deadlines/concurrent registrations; approval decisions/history; insufficient-basis and permission-scope cases; BM1 and two-season comparisons.

## PHASE 4 - Schedule creation and adjustment

**Implementation Status:** `NOT_STARTED`.

**Scope:** UC13–UC14: build/validate/submit/approve/publish schedules and change the date/time or stadium of matches not yet played. UC15 belongs to PHASE 6.

**References:** BM2, QĐ2.1–2.6 pp.7; §1.4.3.2 pp.44–45; §2.4.1.13–14 pp.100–106; TH-02/04/06; BM-02/04/06; TD-02/03; AT-01–04. [UC](use-cases/scheduling.md).

**Dependencies:** PHASE 2/PHASE 3 (and transitively PHASE 1); O03/O07/O08/O10.

**Deliverables:** Valid seasonal schedules, approval/publication, conflict checking, and adjustments with history/delegated authority.

### Progress Checklist

- [ ] The scheduling, conflicts, and approval/delegation Specification is approved.
- [ ] The schedule creation/adjustment Implementation Plan is completed.
- [ ] Tasks and dependencies are approved and linked to Issues under the conventions.
- [ ] UC13 creates a BM2 schedule with 20 clubs, 38 rounds/380 matches, and home/away legs.
- [ ] Time/shared-stadium, incomplete/invalid-schedule, and unsupported-configuration checks pass.
- [ ] Approval/publication and UC14 adjustments follow conditions, with reasons and before/after history.
- [ ] Cancellation, pending approval, played-match, concurrent-edit, and save-failure tests preserve the schedule.
- [ ] Functional, registration–schedule integration, and regression tests pass; acceptance evidence is complete.

**Acceptance Criteria:** The default has exactly 20 clubs with valid applications, 38 rounds/380 matches, 38 matches per club, and two reversed home/away legs per pair. All BM2 fields are present; use the registered home ground unless an approved change exists; no overlapping club matches/stadium usage, including shared stadiums, under approved intervals. Incorrect match/round/leg counts or unsupported configurations are explicitly rejected. Pending/draft schedules, where applicable, are not public; rejection returns them for correction. UC14 rejects played matches, unauthorized actions, conflicts/concurrent edits; pending approval preserves the previous schedule; cancellation/save failures preserve data; valid changes record person, time, reason, before/after values and update published schedules.

**Verification Evidence:** A 20-club dataset and whole-schedule checks; shared-stadium/overlap, incomplete/invalid schedule, approval/rejection, concurrent-edit, and history cases; evidence that publication exposes only permitted schedules.

## PHASE 5 - Official results and statistics

**Implementation Status:** `NOT_STARTED`.

**Scope:** UC16–UC20 share one acceptance boundary: match reports, unofficial results, confirmation, official-result corrections, and automatic standings/statistics. UC20 is not a points-entry screen; PHASE 7 aggregates/exports reports from these outputs.

**References:** BM3; QĐ3.1–3.6, QĐ5.1–5.7 pp.8–11; §1.4.3.3 pp.46–47; §2.4.1.16–20 pp.109–123; HQ-02, TH-03/05/06; BM-02/04/06; CN-02/04; TD-02/03; AT-01–04. [UC](use-cases/results.md).

**Dependencies:** PHASE 1–PHASE 4; O02/O05/O06/O07/O08/O09.

**Deliverables:** BM3 and validation, confirmation/correction with history, standings and goalscoring/clean-sheet statistics, and synchronized dependent data.

### Progress Checklist

- [ ] The BM3, confirmation/correction, and statistics Specification is approved.
- [ ] The result/dependent-data update Implementation Plan is completed.
- [ ] Tasks and dependencies are approved and linked to Issues under the conventions.
- [ ] UC16/UC17 record unofficial reports/results and validate players, goals/stoppage time/cards, and scores.
- [ ] UC18/UC19 confirm/correct with valid permissions, statuses, reasons, and history.
- [ ] UC20 automatically calculates standings, goals, and clean sheets under the regulations, matching manual calculations.
- [ ] Own-goal, repeated-confirmation, concurrent-edit, mid-process-failure, and two-season tests pass.
- [ ] HQ-02 measurements, dependent-data integration/regression tests, and all acceptance criteria pass with evidence.

**Acceptance Criteria:** All five UCs' flows/exceptions pass. Only validly scheduled matches; players belong to the two clubs and have valid registrations; A/B/C/D goals, regulation+stoppage-time minutes, and yellow/red cards belong to the match. Scores match goals; own goals count for the opponent, not individual scoring. Confirm only after completion; results are not official before UC18; UC17 cannot edit official results. UC18/19 automatically trigger UC20 to calculate matches/wins/draws/losses/BT/BB/HS/points/rank, goals, and clean sheets under effective regulations; defaults are 3–1–0, HS=BT−BB, and QĐ5.3 criteria. Shared top-scorer awards retain QĐ5.4; goalkeeper handling retains QĐ5.7 without adding substitutions. Repeated confirmations do not double-count; missing regulations are not borrowed from another season. Authorized/reasoned corrections save before/after history and recalculate every affected statistic/report; cancellation/conflict/save failures cause no partial updates. HQ-02: ≥95% of valid updates within 2 seconds.

**Verification Evidence:** Draft/official/corrected-result data covering all goal types/own goals/stoppage time/cards, ranking and goalkeeper cases after O05/O06 decisions; comparisons against manual calculations; repeated-confirmation, mid-process-failure, and concurrent-edit tests; history and HQ-02 measurements.

## PHASE 6 - Competition information lookup

**Implementation Status:** `NOT_STARTED`.

**Scope:** UC15, UC21, UC23, and BM4.1 general information; lookup of schedules, matches, clubs/players, and published statistics/standings. No new UC for BM4.1 and no ownership of statistics algorithms.

**References:** BM4.1–4.4, QĐ4.1–4.6 pp.8–9; §2.4.1.15 pp.106–108, §2.4.1.21 pp.123–126, §2.4.1.23 pp.130–133; HQ-01/03, TT-01/02/04/05, BM-05, TH-05, TD-01/04. [UC15](use-cases/scheduling.md), [UC21/23](use-cases/publication.md).

**Dependencies:** PHASE 2–PHASE 5; O04/O08/O09/O13.

**Deliverables:** Lookup/filtering by season/round/club/time/name as appropriate to each UC, general season information, and correct public-access scope.

### Progress Checklist

- [ ] The lookup, filters, and public-fields Specification is approved.
- [ ] The lookup Implementation Plan is completed.
- [ ] Tasks and dependencies are approved and linked to Issues under the conventions.
- [ ] BM4.1–4.4 and UC15/UC21/UC23 return correct data/filters, pagination, and seasonal scope.
- [ ] Draft results and personal data are not exposed without authorization; schedule/result changes are reflected.
- [ ] Chrome/Edge, the three TT-02 viewports, Vietnamese text, and empty/error flows pass.
- [ ] HQ-01/HQ-03 are measured with the prescribed load and one-season/≥10-season datasets, with evidence.
- [ ] Upstream-source integration, regression, and all Phase criteria are verified.

**Acceptance Criteria:** All BM4 fields within permitted scope; season data is independent and matches valid applications. Unconfirmed results do not expose scores; published match information remains viewable. Statistics/publication update consistently after corrections without distorting history; lookup does not modify business data. Default/no-result/insufficient-statistical-basis/query-error flows respond as specified. Prevent personal-field leakage under the approved matrix, including direct access. Lists >20 records paginate without omissions/duplicates; search/filter correctly. Chrome/Edge and the three TT-02 viewports pass; HQ-01/03 meet ≥95% within 2 seconds at prescribed load/datasets; core operation works without external APIs.

**Verification Evidence:** Filter/expected-result comparisons; public/internal/draft/official cases and updates from PHASE 4/PHASE 5; returned-field checks; browser/viewport screenshots or records; one-season and ≥10-season/3,800-match load logs; navigation trials contributing to final TD-01 validation.

## PHASE 7 - Reports and season summary

**Implementation Status:** `NOT_STARTED`.

**Scope:** UC22: generate, preview, and export BM5.1–BM5.3; check season-summary readiness. PHASE 5 owns source calculations; PHASE 9 owns general data exchange.

**References:** QĐ5.1–5.7, BM5.1–5.3 pp.9–11; §2.4.1.22 pp.127–130; HQ-04, TH-03/05/06, TT-04, BM-02/05/06, AT-03/04. [UC22](use-cases/publication.md).

**Dependencies:** PHASE 1/PHASE 2/PHASE 5; O05/O06/O07/O11/O13.

**Deliverables:** Three report types, matching previews/downloadable files, and season-summary confirmation conditions.

### Progress Checklist

- [ ] The three reports and season-summary conditions Specification is approved.
- [ ] The report preview/export Implementation Plan is completed.
- [ ] Tasks and dependencies are approved and linked to Issues under the conventions.
- [ ] UC22 previews and exports all BM5.1–BM5.3 fields from official data for the correct season.
- [ ] Ranking, awards, and complete-result prerequisites for summaries are verified against approved decisions.
- [ ] Missing-data/permission/inconsistency/export-failure cases do not return incorrect official reports.
- [ ] Reports update correctly after UC19; source/manual checks and HQ-04 measurements pass.
- [ ] Functional, statistics-integration, and regression tests pass; acceptance evidence is complete.

**Acceptance Criteria:** All BM5 fields, correct season, and official results; standings/goals reflect reporting time and regulations. Tied players share top scorer; Golden Glove derives from clean sheets; total competition goals are correct, with own goals retained in scores/competition totals. Confirm summaries only when all results and necessary ranking decisions are complete. Missing/inconsistent data or insufficient permissions are clearly reported, not exported as official; export failures do not return partial files as successful. Switching report type reaggregates. After UC19, related reports reflect new data and change traceability. Generate and export each report within ≤5 seconds using a complete season/380 matches, without distorting Vietnamese text or values.

**Verification Evidence:** Three reports compared against official sources/manual calculations, missing-result/ranking/shared-award cases after decisions, before/after correction and export-failure cases, actual exported files, and HQ-04 timing logs.

## PHASE 8 - News and announcements

**Implementation Status:** `NOT_STARTED`.

**Scope:** UC24–UC25: author/update/manage status/publish and view permitted public lists/details.

**References:** §2.2.5 pp.58; §2.4.1.24–25 pp.134–139, Hình 2.52–2.55; BM-02/04/05/06; TT-01/04; TD-02/04. [UC](use-cases/publication.md).

**Dependencies:** PHASE 1/PHASE 2; O08/O09/O15.

**Deliverables:** Organizing Committee news management/publication and Public Viewer news viewing.

### Progress Checklist

- [ ] The news, statuses, and publication-permissions Specification is approved.
- [ ] The news management/viewing Implementation Plan is completed.
- [ ] Tasks and dependencies are approved and linked to Issues under the conventions.
- [ ] UC24 saves/updates/publishes with correct permissions/statuses and records operations.
- [ ] UC25 displays only publicly permitted news and rechecks status when details are opened.
- [ ] Draft/publication/withdrawal tests under O15, empty lists, direct access, and query failures pass.
- [ ] Functional, permission/log integration, Vietnamese-text, and regression tests pass; acceptance evidence is complete.

**Acceptance Criteria:** All UC24–25 flows/exceptions pass; distinguish saving from publishing permissions and validate required fields. New/draft content is not public; authorized publication records the action. Reject unauthorized publication, preserving status. Details recheck status and do not expose content no longer permitted for publication; empty lists and query failures are reported. Statuses/withdrawal/season association follow O15 decisions without adding external notification channels.

**Verification Evidence:** Manage/publish/view permission matrix; draft/published/no-longer-public data, direct access, and logs; UC flow and Vietnamese-text results.

## PHASE 9 - Data exchange import and export

**Implementation Status:** `NOT_STARTED`.

**Scope:** TT-03, TT-04: file exchange for data types selected by the team leader; validation/normalization and business-data preservation, separate from UC22's three report exports. Do not invent UC codes for requirements without a separate UC.

**References:** §1.2.4.2 pp.17; TT-03/04 pp.19; BM-02/04/05; AT-01/02/04; BM/QĐ của dữ liệu được duyệt ở O11.

**Dependencies:** PHASE 1/PHASE 2 and the Phase owning selected data (PHASE 3, PHASE 4, or PHASE 5 when relevant); O04/O09/O11/O12. After O11, specify concrete dependencies before Specification.

**Deliverables:** Approved formats/templates, import/export, error feedback, and data comparisons.

### Progress Checklist

- [ ] The O11 data types, formats, and import/export policy Specification is approved.
- [ ] The validation, normalization, and data-preservation Implementation Plan is completed.
- [ ] Tasks and concrete dependencies are approved and linked to Issues under the conventions.
- [ ] Import/export in each selected format processes all ≥100 records and preserves 100% of compared fields.
- [ ] Invalid/duplicate/partially failed files follow the approved policy, permissions, and business constraints.
- [ ] Vietnamese text, date/time, scores, identifiers, relationships, and history are preserved.
- [ ] Functional, data-source integration, and regression tests pass; input/output files and evidence are complete.

**Acceptance Criteria:** For each selected format (CSV or XLSX), process all of at least 100 valid records and preserve 100% of compared fields, including Vietnamese text/date/time/scores/identifiers. Detect invalid structure, missing fields, invalid types/values, and business violations; do not introduce invalid data, leak information, or bypass approval/confirmation. Handle duplicates/partial errors according to the approved decision, preserving valid data, relationships, and seasonal history. Do not automatically add external API integration.

**Verification Evidence:** Actual input/output files for each selected format, ≥100-record datasets, field-by-field comparisons; invalid files and before/after data, permission, constraint, and corresponding workflow checks.

## PHASE 10 - Integration, regression, and system acceptance

**Implementation Status:** `NOT_STARTED`.

**Scope:** Integration, implementation of BM-07 backup/recovery, and acceptance of all Chapter 1–2 scope: 25 UCs, 37 QĐ clauses, 10 forms, and 34 quality requirements; a smoke test does not replace earlier Phase criteria. CN-03 and §1.5 testing/handover planning are checked here.

**References:** All rows of the [coverage matrix](sources.md); §1.4.4 pp.49; §1.5 pp.50–52; TH-01–06, HQ-01–04, TT-01–05, BM-01–07, CN-01–04, TD-01–04, AT-01–04.

**Dependencies:** PHASE 1–PHASE 9 are `COMPLETED`; relevant decisions are approved; O13 environment/datasets/test methodology and O14 operations are defined. External APIs are optional; explicitly record whether the TT-05 conditional branch is implemented.

**Deliverables:** A runnable integrated version; BM-07 automatic backup/retention/recovery; sample and scaled test data; requirement-based test/acceptance matrix; regression results; installation/operation/backup/recovery instructions; acceptance record.

### Progress Checklist

- [ ] The integration, operations, and final-acceptance Specification is approved.
- [ ] The integration/backup/recovery/testing Implementation Plan is completed.
- [ ] Tasks and dependencies are approved and linked to Issues under the conventions.
- [ ] PHASE 1–PHASE 9 have COMPLETED evidence still valid for the integrated version.
- [ ] End-to-end business flows, cross-function corrections, and regression tests pass.
- [ ] BM-07 demonstrates automatic backup per 24 hours, ≥7 separate backups, and full-season recovery within ≤30 minutes.
- [ ] All 34 quality requirements and load/dataset/browser/viewport/usability thresholds are verified.
- [ ] Core operation without external APIs and the TT-05 integration branch, if implemented, are verified.
- [ ] Fresh-installation/operations documentation, data, test reports, and the team leader's acceptance record are complete.

**Acceptance Criteria:** The season/regulations → approved registration → approved schedule → match report → confirmation → standings/statistics → lookup/report/summary chain works consistently. Valid corrections propagate across functions with traceability; invalid input/unauthorized actions/repeated confirmation/mid-process failure/concurrent editing do not corrupt data. Check all 34 requirements, preserving HQ/BM/TD/TT/TH thresholds in quality.md, particularly ≥10 seasons/3,800 matches, two browsers/three viewports, ≥100 import/export records, ≥10 unauthorized-access cases, navigation trials with 5 users ×4 attempts (≥80% within 30 seconds/≤3 actions), full-season backup/recovery, and fresh-environment setup. History/multiple seasons/controlled configuration changes do not cause incorrect retroactive alterations. Verify core operation without external APIs; implemented integration must satisfy TT-05 validation/confirmation. All mandatory criteria pass, acceptance-affecting issues are resolved, and the team leader confirms the outcome.

**Verification Evidence:** Integrated revision/snapshot, environment/datasets, per-criterion reports and real logs, end-to-end/regression/authorization/conflict/failure/load/recovery/compatibility/usability results, handover files, and team leader acceptance record. Mock tests or isolated screenshots do not replace evidence of real data updates and restoration.

Declare **the entire system complete** only when PHASE 1–PHASE 10 are all `COMPLETED` and final integration results remain valid for the delivered version. Context v1 contains no product test results.

