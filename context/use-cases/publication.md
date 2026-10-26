# Lookup, reports, and news: UC21-UC25

[Entry point](../README.md) · [Business/BM/QĐ](../business.md) · [Quality](../quality.md) · [Open decisions](../open-decisions.md)

Current UC flows retain source codes/pages and incorporate explicitly approved refinements. The authoritative rules for this domain are linked below; approval/source/rationale evidence is in English ADRs. These are Context documents, not generated feature Specifications. Analysis figures are not approved API/schema designs. See [sources](../sources.md).

## UC21

Current rules: [D032](publication.md#d032---public-information-boundary-including-player-dates-of-birth), [D033](publication.md#d033---internal-viewing-follows-business-responsibility).

**Look up match information**

Source: §2.4.1.21, pp.123-126 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows users to search match information by season, round, or club, including the pairing, time, stadium, and corresponding result. Information follows access rights; a score becomes public only after official confirmation.

**Description:**

Look up matches by season, round, or club; publish the score only after result confirmation.

**Actors:**

Public Viewer; Results Officer; Organizing Committee / Season Manager.

**Preconditions:**

The system has match data for the requested season.

**Postconditions:**

Display data matching search conditions without modifying business data.

**Main flow:**

1. The user opens match-information lookup.
2. The system requests a season or filter conditions.
3. The user enters conditions.
4. The system retrieves corresponding data.
5. The system checks publication status and access rights.
6. The system displays results.

**Alternative flow:**

No detailed conditions: display data within the default scope.

**Exceptions:**

1. No matching data: report no results.
2. Unconfirmed result: do not publish the score; published match information may still be shown.
3. Query failure: report that data cannot be loaded.

## UC22

Current ranking-resolution and summary rules: [D070](#d070---fixed-group-season-end-head-to-head-calculation), [D071](#d071---approved-playoff-based-ranking-resolutions-within-uc22), [D073](#d073---versioned-season-summary-confirmation-and-reconfirmation).

Current rules: [D066](publication.md#d066---shared-standings-ranks-and-shared-individual-awards).

**Generate and export competition reports**

Source: §2.4.1.22, pp.127-130 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows authorized users to generate reports from confirmed data and applicable seasonal regulations. The function must provide BM5.1, BM5.2, and BM5.3. It must not fabricate unsupported data or substitute draft results for official ones.

**Description:**

Aggregate, display, and export competition reports in required business forms.

**Actors:**

Organizing Committee / Season Manager.

**Preconditions:**

1. The user has report-generation permission.
2. The target season exists.
3. Necessary source data is accessible.

**Postconditions:**

Aggregate reports from valid sources, with preview and file export in supported formats.

**Main flow:**

1. The user opens report generation.
2. The system requests the season and report type.
3. The user selects a supported report type.
4. The system checks permissions and source-data completeness.
5. The system aggregates data using the relevant rules.
6. The system displays a preview.
7. The user confirms XLSX export under [D078](../business.md#d078---xlsx-create-only-import-and-controlled-export).
8. The system creates the report file and provides it for download.

**Alternative flow:**

1. Season-summary conditions are unmet: report missing data or conditions.
2. The user changes report type: aggregate again for the selected type.

**Exceptions:**

1. Insufficient permissions: deny report generation.
2. Inconsistent source data: do not export it as official data.
3. Aggregation/export failure: report the error and do not return an incomplete file as a successful report.

## UC23

Current rules: [D032](publication.md#d032---public-information-boundary-including-player-dates-of-birth), [D033](publication.md#d033---internal-viewing-follows-business-responsibility), [D066](publication.md#d066---shared-standings-ranks-and-shared-individual-awards).

**Look up club and player information and statistics**

Source: §2.4.1.23, pp.130-133 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows users to search club/player information and statistics by season and access scope. Statistics must be aggregated from valid business data, particularly confirmed results and related events.

**Description:**

Search and view club/player information and statistics by season and filters.

**Actors:**

Public Viewer; Registration Officer; Organizing Committee / Season Manager.

**Preconditions:**

Club/player data exists for the requested season; statistics are aggregated from valid sources.

**Postconditions:**

Display information/statistics according to search conditions and access rights.

**Main flow:**

1. The user selects club/player information or statistics lookup.
2. The system requests the season and filters.
3. The user enters or selects conditions.
4. The system retrieves club/player information and related official results when statistics must be aggregated.
5. The system aggregates information and calculates or retrieves supported statistics.
6. The system checks permitted access and publication scope.
7. The system displays appropriate information and statistics.

**Alternative flow:**

No detailed filters: display statistics within the default scope.

**Exceptions:**

1. No data: report no results.
2. Insufficient data for aggregation: report data limitations.
3. Query failure: report that statistics cannot be loaded.

## UC24

Current news policy: [D077](#d077---season-scoped-versioned-news-publication).

**Manage competition news and announcements**

Source: §2.4.1.24, pp.134-136 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows the Organizing Committee to create, update, and manage news/announcement statuses for the Premier League. Content may be saved as draft or published with appropriate authority; only published content is public.

**Description:**

Create, update, manage status, and publish competition news and announcements.

**Actors:**

Organizing Committee / Season Manager.

**Preconditions:**

The operator is logged in and has permission to manage competition news and announcements.

**Postconditions:**

Save content in an appropriate status; only published content is publicly visible.

**Main flow:**

1. The user opens competition news/announcement management.
2. The system displays existing announcements.
3. The user creates or updates content for the assigned season; editing published content prepares a successor draft under D077.
4. The system checks management permission and required information.
5. The user confirms saving.
6. The system saves content and reports the result.

**Alternative flow:**

1. List only: display announcements according to permissions.
2. The user publishes saved content: check publication permission, change status to published, and record the action.

**Exceptions:**

1. No management permission: reject.
2. Missing required content information: request correction.
3. No publication permission: reject publication and preserve content status.

## UC25

Current public version/visibility rules: [D077](#d077---season-scoped-versioned-news-publication).

**View competition news and announcements**

Source: §2.4.1.25, pp.136-139 (description, specification table, and analysis figures). See [PDF cross-check guidance](../sources.md#pdf).

**Business context:** Allows users to search and view news/announcement lists and content published by the Organizing Committee. Only published content is publicly visible.

**Description:**

Display published competition news/announcement lists and content.

**Actors:**

Public Viewer.

**Preconditions:**

The news/announcement viewing function is operational.

**Postconditions:**

The user can view content permitted for publication.

**Main flow:**

1. The user opens competition news and announcements.
2. The system displays published news and announcements.
3. The user selects an item to view.
4. The system checks that the requested content is the current permitted published version under D077.
5. The system displays the content.

**Alternative flow:**

No published news or announcements: display an empty-list state.

**Exceptions:**

1. Content is no longer permitted for publication: do not display it.
2. Query failure: report that data cannot be loaded.
## Current managed media behavior

Use [media policy](../design/media.md) for current logos, player portraits and fallback. These displays do not change the UC business authority or calculations.

## Current confirmed rules

The rules below are the authoritative current policy for this domain. The UC flows/source clauses above are read with these explicit refinements, not as a separate version. Approval evidence and interview-time notes are in the linked English ADR records; outstanding work is in [open decisions](../open-decisions.md).

### D032 - Public information boundary including player dates of birth

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0008-public-information-and-player-birth-dates.md#d032-english-evidence).

- **Source:** O04; BM4.1-BM4.4, PDF pp.8-9; QĐ4.1-QĐ4.6, p.9; BM-05 and §1.2.5.3, pp.21/23; UC15/UC21/UC23/UC25.

- **Decision:** Publish the seasonal lookup information in the table below, including the player's full calendar date of birth. Retain the other proposed A restrictions. The birth-date exception concerns players in the public seasonal lookup scope, not unrestricted access to all player/application records.

| Group | Public information |
|---|---|
| Season | Competition/season name, club count, round count, total matches, start/end dates |
| Participating club | Name, abbreviation, coach, home ground, valid registered-player count |
| Player in the season | Full name, date of birth, nationality, position, club, shirt number, registration category |
| Schedule/results | Published schedule: round, clubs, date/time and stadium; score only after official confirmation |
| Statistics | Standings, goalscorers and clean-sheet statistics from official results |
| News | Current published title/body/season/publication time under D077 |

- **Internal boundary:** Club representative information, contact details, training/homegrown evidence, application/review content, drafts, unconfirmed results, change reasons and system logs remain internal with appropriate access. Fields not approved for publication remain internal. Player date of birth is the explicit exception to Q32 A's original proposed internal list.

- **Source-default change:** V1 BM-05 records dates of birth as requiring appropriate authority. The Team Leader explicitly changes that default for player birth dates in v2. Preserve the source PDF and v1 approval in Git; future specifications/acceptance must trace this approved exception rather than claim public birth dates were already the v1 default. This does not make contact information or other internal data public.

- **Delivery boundary:** The backend must enforce the public scope consistently for public UI/API data and any files intended for public use. This does not itself authorize a public file-export feature. D033/D094 own internal/history access and D078/D091/D096 own controlled export/execution; public viewing alone does not grant bulk export.

### D033 - Internal viewing follows business responsibility

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0008-public-information-and-player-birth-dates.md#d033-english-evidence).

- **Source:** O04/O08; BM-02/BM-05/BM-06, PDF pp.23-24; UC03/UC04, registration/scheduling/results UCs; [D003](administration.md#d003---season-scoped-business-permissions)/[D004](administration.md#d004---multiple-business-roles-in-the-same-season)/[D019](../design/access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix)/[D032](publication.md#d032---public-information-boundary-including-player-dates-of-birth).

- **Decision:** Login and assignment to a season do not themselves authorize viewing all internal information. Apply the following responsibility-based viewing scope.

| Internal data group | Authorized role in the assigned season |
|---|---|
| Club participation applications, representative and contact information | Organizing Committee / Season Manager; Registration Officer |
| Player registration records and homegrown evidence | Organizing Committee / Season Manager; Registration Officer |
| Draft schedules and unapproved adjustment proposals | Organizing Committee / Season Manager; Scheduling Officer |
| Match reports, unofficial results and correction proposals | Organizing Committee / Season Manager; Results Officer |
| Proposed regulation changes | Organizing Committee / Season Manager; staff holding the corresponding delegation under [D019](../design/access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix) |
| Account administration and system-wide activity-log search | System Administrator under UC03/UC04 |

- **Multiple roles and delegation:** A person holding multiple roles may view according to the roles actually assigned in the season. Delegation adds only the data needed for its operation. A function needing eligibility checks may receive the result and necessary reasons without automatically receiving the whole underlying source record.

- **Administration and history:** System Administrators do not automatically gain every business-profile screen; business work requires the corresponding role. Object-specific history is viewed within the object's access scope; system-wide log search remains UC04. [D094 audit policy](administration.md#audit-access-and-retention---d094) defines filtered traceability access, protected business history and no first-version audit export; UC04 is not an implicit grant to every business screen or unrestricted log payload.

### D066 - Shared standings ranks and shared individual awards

**Confirmed policy.** [Approval, source and rationale](../../docs/adr/0014-shared-ranks-and-individual-awards.md#d066-english-evidence).

- **Source:** O05/O06/O12; QĐ5.3-QĐ5.5/QĐ5.7, BM5.1-BM5.3; [D045](registration.md#d045---freeze-points-and-ranking-priority-after-the-first-official-result)/[D064](results.md#d064---kickoff-based-appearance-eligibility-and-report-defined-goalkeepers).

- **In-season ranks:** Clubs equal on all applicable main ranking criteria share competition ranks, e.g. 1, 2, 2, 4. Do not use head-to-head criteria reserved for end-of-season resolution during the season. Use stable club-code order within a tied group only for presentation, without a sporting advantage or distinct rank.

- **Season-end stakes:** Mark unresolved tied groups affecting championship, qualification or relegation for the source's additional-criteria/playoff process. Do not resolve sporting outcomes by club name/code. Head-to-head calculation follows [D070](#d070---fixed-group-season-end-head-to-head-calculation); playoff-based resolution follows [D071](#d071---approved-playoff-based-ranking-resolutions-within-uc22). Qualification/relegation parameters follow [D072](registration.md#d072---seasonal-qualification-and-relegation-counts); season-summary lifecycle follows [D073](#d073---versioned-season-summary-confirmation-and-reconfirmation).

- **Individual awards:** Retain shared top-scorer awards under the source, without implicit assists/appearances/minutes tiebreakers. Goalkeepers tied for the highest clean-sheet total share the Golden Glove, without extra ratios, appearances or goals-conceded tiebreakers.

- **Positive achievement:** Identify top-scorer recipients only with at least one valid personal goal, and Golden Glove recipients only with at least one clean sheet. Otherwise show no recipient yet, not a shared award for all zero totals.

- **Recalculation/finalization:** Valid official-result corrections update tied groups and award leaders. Final awards are confirmed through season summary.

### D070 - Fixed-group season-end head-to-head calculation

**Status:** CONFIRMED by the Team Leader, Q70 option A and the common package. [Approval and rationale](../../docs/adr/0014-shared-ranks-and-individual-awards.md#q70---fixed-group-season-end-head-to-head).

- **Source and scope:** QĐ5.3/QĐ5.5, O05; D045/D066. Retain points, overall goal difference and overall goals scored as the main ranking criteria. Apply the additional head-to-head criteria only at season end where a remaining tie affects the championship, qualification or relegation. In-season shared ranks remain governed by D066.
- **Readiness and input:** Automatically calculate from the current season's Official Results only. Apply season-end resolution only after every fixture in the season schedule has an Official Result; an Ended or Postponed match without one does not satisfy readiness.
- **Fixed group:** Form the tied group after the three main criteria. For two or more clubs, use all official matches between members of that original group to calculate head-to-head points and head-to-head away goals. Keep that original group as the basis for both criteria even if some clubs separate after the first criterion; do not recursively recalculate for the remaining subgroup.
- **Order and values:** Compare head-to-head points first, using the approved seasonal win/draw/loss points, then goals scored while the club was the away team in those group matches. Do not add head-to-head goal difference, head-to-head total goals, fair play or name/code order as sporting criteria.
- **Unresolved stakes:** If the automatic criteria leave a consequential tie unresolved, mark it Pending ranking resolution/playoff and block finalization of the affected conclusion. Playoff recording, authority and application follow [D071](#d071---approved-playoff-based-ranking-resolutions-within-uc22). Qualification/relegation configuration follows [D072](registration.md#d072---seasonal-qualification-and-relegation-counts); season-summary lifecycle follows [D073](#d073---versioned-season-summary-confirmation-and-reconfirmation).
- **Interpretation:** Fixed-group handling explicitly fills the source's unspecified multi-club calculation detail; it does not claim that the original report defined this algorithm.

### D071 - Approved playoff-based ranking resolutions within UC22

**Status:** CONFIRMED by the Team Leader, Q71 option A and its full package. [Approval and rationale](../../docs/adr/0014-shared-ranks-and-individual-awards.md#q71---playoff-based-ranking-resolution-records).

- **Eligibility:** Open a ranking-resolution case only for a group still tied after D070 where important positions require resolution. This is not an arbitrary standings editor. The playoff takes place in reality; UC22 records its evidenced ranking outcome.
- **Record:** Retain season, affected club group and positions, resulting order, playoff-result summary, date played and original report/decision reference. A scanned attachment is not mandatory.
- **Authority:** One authorized Season Manager prepares/submits the proposal; a different authorized Season Manager approves it. The approver must not have prepared/edited that version. This approval is not delegable in the first version.
- **Validation:** The proposed order must cover exactly the group requiring resolution, with no duplicate/missing clubs or changes to established positions outside the group. Recheck authority and source-data validity at approval.
- **Effect:** Only an approved version resolves ranking and supports season summary. Keep regular-season points, goal difference, goals and player statistics unchanged; playoff outcomes are not added to those aggregates.
- **Versions/corrections:** Submitted content is immutable. Withdrawal/return and a new submitted version support changes. Correcting an approved resolution also requires independent preparation/approval and preserved history.
- **Changed basis:** If an official regular-season result correction changes the tied group or resolution basis, mark the resolution Needs review, stop applying it to finalize the affected conclusions and block season-summary confirmation until resolved. Retain history rather than silently treating the old resolution as current.
- **First-version boundary:** Reuse UC22 without a new UC. No detailed playoff scheduling, lineup or event management is required. D063/D065 remain the regular match/report scope; a resolution record does not create another regular-season fixture/result. Qualification/relegation configuration follows [D072](registration.md#d072---seasonal-qualification-and-relegation-counts); season-summary lifecycle follows [D073](#d073---versioned-season-summary-confirmation-and-reconfirmation).

### D073 - Versioned season-summary confirmation and reconfirmation

**Status:** CONFIRMED by the Team Leader, Q73 option A and its full common package. [Approval and rationale](../../docs/adr/0014-shared-ranks-and-individual-awards.md#q73---versioned-season-summary-confirmation).

- **Case and workflow:** One summary case per season contains historical versions, with Draft -> Pending confirmation -> Confirmed and at most one pending version. Submitted content is immutable; withdraw/return it before preparing and submitting a new version.
- **Authority:** One authorized Season Manager prepares/submits; a different authorized Season Manager confirms. A preparer/editor cannot confirm that version. Confirmation and reconfirmation are nondelegable in the first version.
- **Readiness:** Every regular-season scheduled match has an Official Result, consequential rankings are resolved under D070-D072, and no official-result or ranking-resolution correction proposal remains pending in the season. Recheck these conditions, current rights and source versions at confirmation.
- **Source snapshot:** Derive and retain BM5.3's rank/leading-club information, champion, R relegated clubs, shared top-scorer/Golden Glove recipients and total goals from system records, with regulation/result/resolution basis. No manual aggregate override is allowed. D066's positive-achievement rules still apply.
- **Shared podium ranks:** Present runner-up/third according to established ranks, including multiple clubs sharing a rank. A skipped rank, e.g. no rank 3 in 1, 2, 2, 4, is stated explicitly rather than forcing three distinct club names or adding a playoff solely for podium presentation.
- **Preservation/revision:** Do not directly edit/delete a confirmed version. Revising a summary creates a successor with a reason and history, under the same independent confirmation rules. A pending proposal does not replace an existing still-valid confirmed summary.
- **Changed official basis:** If a valid official source change alters summary content or basis, mark the current summary Needs reconfirmation. Preserve its snapshot for history and clearly label it outdated, rather than presenting it as the current confirmed summary. Reaggregate into a new version for preparation and confirmation; do not silently rewrite the confirmed snapshot.
- **Season boundary:** Confirming a summary does not itself close the season or prohibit UC19. Season closure/reopening follows [D074](registration.md#d074---independently-approved-season-closure-and-reopening), consistent with approved correction workflows.

### D077 - Season-scoped versioned news publication

**Status:** CONFIRMED by the Team Leader, Q77 option A and its full common package. [Approval and rationale](../../docs/adr/0008-public-information-and-player-birth-dates.md#q77---season-scoped-news-and-announcements).

- **Scope/content:** Every news/announcement item belongs to exactly one season. Require title and plain-text body with line breaks; retain creator/editor and timestamps. The first version requires no rich-text editor or attachments and introduces no season-independent news permission.
- **Lifecycle and authority:** Draft -> Published -> Withdrawn. The authorized Season Manager in the assigned season may prepare/edit drafts, publish and withdraw, including publishing their own preparation without an independent approval step. Publication/withdrawal remains nondelegable under D019. Apply current session/authority checks and audit.
- **Published revisions:** Editing public content prepares a successor draft rather than overwriting the published version. The existing published version stays visible until explicit publication of a replacement or withdrawal of the item. Preserve version history.
- **Withdrawal/republication:** Require a withdrawal reason and log. Republishing requires an explicit action on the chosen version, with no automatic restoration. Do not hard-delete previously published versions/history.
- **Visibility/order:** Public lists, details and D068 show only the current permitted published version, never drafts/withdrawn content. Public fields are title, body, season and the current version's publication time. Staff-account details, logs and withdrawal reasons remain internal. Order newest current-version publication first; D068's five-item preview follows this order.
- **Closed seasons:** Appropriately authorized managers may still publish/revise/withdraw seasonal news when the season is Closed. This exception does not reopen the season or change official regulations/results/statistics/summaries. D074 continues to gate those other writes.
- **Remaining contracts:** Title/body/reason length and text normalization follow [D092](../business.md#d092---shared-field-validation-identifiers-and-reference-catalogs); identifier/version/storage/API/error/concurrency and audit payload mappings remain technical elaboration without changing this policy.

## DASHBOARD-01 - Season Overview Dashboard

**Scope:** CONFIRMED mandatory first-version functionality by Team Leader instruction on 2026-10-26 (Asia/Bangkok). Existing UC15/UC21/UC23 and appropriate UC22 previews/UC24-UC25 supply the read-only overview; no new actor or UC is introduced.

The confirmed component/metric/layout contract is owned by [D068](#d068---public-season-overview-dashboard).

### D068 - Public season overview dashboard

**Confirmed policy:** Q68 option A and the entire proposed package, explicitly approved by the Team Leader. [Approval and rationale](../../docs/adr/0008-public-information-and-player-birth-dates.md#q68---shared-public-season-dashboard).

- **Audience:** Guests and signed-in users share a dashboard for the selected season, containing only public information under D032. Internal users may follow links to functions their permissions allow; drafts, pending requests and sensitive data remain in business screens. No separate internal work-queue dashboard is required by this decision.
- **Counters:** Show season name/status, approved participating club count, total fixtures in the published schedule, fixtures with Official Results and unplayed fixtures. Unplayed means Not started plus Postponed. Show the postponed count separately and explicitly as a subset of unplayed, not an additional disjoint total. Identify In progress and Ended without an Official Result separately; count neither as unplayed nor as an Official Result. Do not expose unconfirmed scores or internal approval details.
- **Schedule/results:** Show up to five upcoming Not started fixtures with approved schedules, ordered by scheduled time ascending. Give postponed fixtures a separate area stating that no replacement schedule is determined, following D067. Show five most recent Official Results, ordered by actual match time descending. Provide logos, appropriate status/time/venue/score fields and full-view navigation, respecting the public field boundary.
- **Standings/achievements:** Preview the first five clubs and scorer/clean-sheet leader lists under D066. Truncated previews disclose remaining entries and link to full lists; truncation must not suggest that omitted tied leaders lack the same rank/award. A preview is not final award confirmation.
- **Profiles/news:** Clearly link to club/player lists with search/filter there; do not load hundreds of profiles onto the dashboard. Show up to five latest published news/announcements, newest first. Unpublished drafts stay internal.
- **Layout:** Start with the season overview, then upcoming fixtures/recent results, standings/achievements, and profile navigation/news. Use a single column on mobile. This establishes the baseline arrangement; visual details remain for UI design without selecting a new framework/library.
- **Freshness/failure:** Load on page opening, season selection changes or an explicit refresh action; continuous updates are not required. Show successful-load time. Each block provides Loading, Empty, Error and retry independently; a failed block does not remove successful blocks or turn an error into zero/mock data. Preserve official-only statistics and external-API independence.

## Derived REST and DTO contract map

This table derives routes/input groups from approved D001-D085 and this document's owning UCs; it is a technical design draft, not controller/DTO code or a generated feature Specification. Routes are relative to /api/v1. Braced segments are path parameters, not unrestricted operations: every action is explicitly allowlisted. Unspecified field lengths, enum spellings and detailed per-role/error mappings remain in the open register.

| UC | Route/operation family | Input/output contract | Binding checks |
|---|---|---|---|
| UC21 | GET /public/seasons/{seasonId}/matches; GET /public/matches/{matchId} | Allowlisted season/round/club filters and public match fields; internal report views stay in the results module. | D032/D063; unofficial score/report data is not exposed. |
| UC22 | GET /seasons/{seasonId}/reports/{reportType}; GET /seasons/{seasonId}/reports/{reportType}/export; POST /seasons/{seasonId}/ranking-resolutions; POST /seasons/{seasonId}/summary-versions | reportType allowlists BM5.1-BM5.3. Ranking/summary cases use explicit version-scoped submit/approve/confirm/return/withdraw commands; resolution input covers exact affected clubs/order/playoff basis, summary values are server-derived. | D070-D073/D078; authorized XLSX output is binary; no aggregate override payload. |
| UC23 | GET /public/seasons/{seasonId}/clubs; GET /public/seasons/{seasonId}/players; GET /public/seasons/{seasonId}/standings; GET /public/seasons/{seasonId}/player-statistics; GET /public/seasons/{seasonId}/dashboard | Permitted filters/pagination and seasonal profile/statistical views; dashboard DTO has D068 counters, preview blocks and successful-load metadata. | D032/D066/D068/D069/D083; exact detail-route names can be elaborated without changing access/snapshot rules. |
| UC24 | GET/POST /seasons/{seasonId}/news; POST /news/{newsId}/versions; PATCH /news-versions/{versionId}; POST /news/{newsId}/{action} | title/bodyText, season, draft revision and chosen content version; explicit publish/withdraw actions, with required withdrawal reason. | D077; managers can self-publish within assigned season, including Closed seasons; no season-independent news. |
| UC25 | GET /public/seasons/{seasonId}/news; GET /public/news/{newsId} | Current permitted published version only: title/bodyText/season/publishedAt; newest current publication first. | D077; drafts, withdrawn history, staff-account details and internal reasons remain restricted. |

All mutations validate their operation-specific allowlist; editable aggregates use expectedRevision, approval targets identify submittedVersionId as appropriate, and critical commands carry Idempotency-Key under D084. JSON replies follow D085; file bytes are the documented exception. requestId identifies an HTTP attempt, not a business command. These names elaborate the approved contract without adding business permissions or exposing CLI bootstrap/recovery over HTTP.

## D096 execution authority and transaction matrix

Read this with the existing route/DTO map and [shared D096 contract](../design/architecture.md#d096---api-execution-synchronized-csrf-and-transaction-contracts). The rows derive existing rights, not new grants. Each handler binds its exact action/version/revision, field allowlist and safe response to these gates. R denotes a critical D084 receipt-bearing command; ordinary draft edits still use expectedRevision. System Administrator is not implicit business authority; Season Manager means the assigned-season role.

| UC | Authority and permitted action family | Final state/scope checks and atomic effects |
|---|---|---|
| UC21 | Public Viewer for published match/result lookup; internal report data uses owning results permissions | GET safe field projection. Explicit published match state and current Official Result only; no pending score/correction/reference leak. |
| UC22 | Assigned Season Manager for report/export and ranking/summary preparation; independent assigned Season Manager for ranking-resolution/summary approval | R for resolution approval/summary confirmation. Exact source revision and tied-group/official-result readiness, D070-D073 editor exclusion and nondelegability. BM5 XLSX under D078/D091; public lookup grants no internal bulk export. |
| UC23 | Public Viewer for permitted club/player/standings/statistical lookup; internal profile/history reads follow D033/D034 | GET field projection and D094 current media scope; D068 Dashboard reuses permitted official data and explicit Loading/Empty/Error. Date of birth remains the approved public exception, not full registration/evidence access. |
| UC24 | Assigned Season Manager prepares/publishes/revises/withdraws seasonal news | R for publication/withdrawal. D077 explicitly allows self-publication and Closed-season news work; no independent approver or delegation is added. Exact version/current-publication/audit updates remain atomic. |
| UC25 | Public Viewer reads current published news | GET current published version/title/body/season/publication time only. Draft/withdrawn/internal actor/reason/history content is excluded. |
