# ADR 0008 - Public information boundary including player dates of birth

Current package approval: [Q98 approved v2](../../context/README.md#q98---whole-package-approval). Earlier pending/open statements below are historical interview evidence; current rules remain in their linked owners.

This ADR records decisions and rationale; authoritative current rules are owned by [D032](../../context/use-cases/publication.md#d032---public-information-boundary-including-player-dates-of-birth), [D033](../../context/use-cases/publication.md#d033---internal-viewing-follows-business-responsibility). Historical open-point notes do not reopen subsequently confirmed policy.

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q32, modified option A; Context decision [D032](../../context/use-cases/publication.md#d032---public-information-boundary-including-player-dates-of-birth).

O04 highlights the tension between lookup forms BM4.2/BM4.3 (PDF pp.8-9) and BM-05/section 1.2.5.3 (pp.21/23). The Team Leader selected Q32 option A with the explicit addition that players' full dates of birth are public. Public seasonal lookup therefore includes season information, participating club name/abbreviation/coach/home ground/valid player count, player name/birth date/nationality/position/club/shirt number/registration category, published schedules, confirmed scores, official standings/goalscorers/clean-sheet statistics and published news. Detailed fields are listed in [D032](../../context/use-cases/publication.md#d032---public-information-boundary-including-player-dates-of-birth).

Representative information, contacts, training/homegrown evidence, application/review content, drafts, unconfirmed results, change reasons and system logs remain internal with appropriate access. Unapproved fields remain internal. The approved exception covers birth dates within public seasonal player lookup, not access to all underlying profiles/applications. Q32's alternative of publishing representative names was not selected.

V1 BM-05 records birth dates as requiring appropriate authority. This is an explicit Team Leader-approved v2 change to that source-derived default, not an assertion that v1 already authorized public birth dates. Preserve v1's source transcription and approval; subsequent specifications and acceptance must trace the exception while retaining other protection requirements and thresholds. Backend public UI/API data and any files intended for public use must follow the same scope. No public-export feature is implicitly approved. [D033](../../context/use-cases/publication.md#d033---internal-viewing-follows-business-responsibility) below settles responsibility-based internal viewing; field/API/export schemas, log payloads, news fields, publication defaults and lookup eligibility details remain open.

## Responsibility-based internal viewing

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q33, option A; Context decision [D033](../../context/use-cases/publication.md#d033---internal-viewing-follows-business-responsibility).

| Internal group | Authorized role in the assigned season |
|---|---|
| Club participation applications, representatives and contacts | Season Manager; Registration Officer |
| Player registration records and homegrown evidence | Season Manager; Registration Officer |
| Draft schedules and unapproved adjustments | Season Manager; Scheduling Officer |
| Match reports, unofficial results and correction proposals | Season Manager; Results Officer |
| Proposed regulation changes | Season Manager; staff with corresponding [D019](../../context/design/access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix) delegation |
| Account administration and system-wide log search | System Administrator under UC03/UC04 |

Multiple roles contribute only their assigned seasonal viewing scopes. Delegation adds data necessary for its operation. Eligibility-dependent functions can receive the check result and necessary reasons without receiving all source records. System administrators do not automatically receive every business-profile screen. Object history follows object access scope; UC04 remains the system-wide log-search function, with detailed payload fields still to be decided.

Allowing every seasonal business role to view all internal data was considered. The Team Leader chose responsibility-based data access with server-side UI/API checks. Shared master-record management, detailed fields/API/export schemas, log/history payload filtering and remaining read/write action permissions remain open. [D032](../../context/use-cases/publication.md#d032---public-information-boundary-including-player-dates-of-birth)'s public player-birth-date exception is retained. See [Context v2 D033](../../context/use-cases/publication.md#d033---internal-viewing-follows-business-responsibility).

### D032 english evidence

Current policy owner: [D032](../../context/use-cases/publication.md#d032---public-information-boundary-including-player-dates-of-birth). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q32, the Team Leader selected option A with the explicit addition that player dates of birth are public information.

- **Source:** O04; BM4.1-BM4.4, PDF pp.8-9; QĐ4.1-QĐ4.6, p.9; BM-05 and §1.2.5.3, pp.21/23; UC15/UC21/UC23/UC25.

- **Alternatives/basis:** Q32 A kept representative information and birth dates internal; B would additionally publish representative names. The Team Leader instead approved modified A with player birth dates public while representative information stays internal. No other exception was approved.

- **Record:** [ADR 0008](0008-public-information-and-player-birth-dates.md).

- **Affected Phases:** PHASE 1 data-access boundaries, PHASE 3 profiles/registration, PHASE 6 public lookup, PHASE 7/PHASE 9 file scopes, PHASE 8 publication and PHASE 10 verification. No Phase status changes.

- **Follow-up:** [D033](../../context/use-cases/publication.md#d033---internal-viewing-follows-business-responsibility) settles the internal viewing groups by responsibility. Field-level API/export schemas, log payloads, detailed news fields, publication defaults and public lookup eligibility details remain open. O04 is only partially settled.

### D033 english evidence

Current policy owner: [D033](../../context/use-cases/publication.md#d033---internal-viewing-follows-business-responsibility). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q33, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), including the matrix and accompanying limits.

- **Source:** O04/O08; BM-02/BM-05/BM-06, PDF pp.23-24; UC03/UC04, registration/scheduling/results UCs; [D003](../../context/use-cases/administration.md#d003---season-scoped-business-permissions)/[D004](../../context/use-cases/administration.md#d004---multiple-business-roles-in-the-same-season)/[D019](../../context/design/access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix)/[D032](../../context/use-cases/publication.md#d032---public-information-boundary-including-player-dates-of-birth).

- **Alternatives/basis:** Responsibility-based viewing versus all business roles seeing all internal seasonal data while writes/approvals remain separate. The Team Leader chose data scope aligned with responsibilities and server-side UI/API checks.

- **Record:** [ADR 0008](0008-public-information-and-player-birth-dates.md#responsibility-based-internal-viewing).

- **Affected Phases:** PHASE 1 authorization/log access, PHASE 2-PHASE 5 business records, PHASE 6 lookup, PHASE 7-PHASE 9 internal output and PHASE 10 access verification. No Phase status changes.

- **Follow-up:** [D034](../../context/use-cases/administration.md#d034---separately-assigned-shared-master-record-management-permissions) settles separate shared-master management permissions. Detailed field/API/export schemas, log/history payload filtering and remaining read/write action matrices stay open. Existing [D032](../../context/use-cases/publication.md#d032---public-information-boundary-including-player-dates-of-birth) public player birth dates remain public.

## Q68 - Shared public season dashboard

**Status:** accepted. **Decision:** D068 / DASHBOARD-01. **Approval evidence:** The Team Leader explicitly approved option A and the entire proposed package: "Tôi chọn A cùng toàn bộ gói trên." The current owner is [D068](../../context/use-cases/publication.md#d068---public-season-overview-dashboard).

Choose one public season overview for guests and signed-in users, retaining internal work in authorized business screens, rather than adding a separate internal work-queue dashboard. This reduces first-version authorization/UI/testing scope while preserving operational links. The approved package defines state-aware counters, official-only results/statistics, schedule/result/standings/leader/news previews, profile navigation, responsive baseline layout, explicit refresh and per-block loading/empty/error/retry behavior. Continuous updates and external football APIs are unnecessary. Final visual details and implementation contracts do not imply a new UI library or whole-package approval.

## Q77 - Season-scoped news and announcements

**Status:** accepted. **Decision:** D077. The Team Leader selected Q77 option A ("Tôi chọn A."), approving the full common package. Current policy is owned by [D077](../../context/use-cases/publication.md#d077---season-scoped-versioned-news-publication).

Choose mandatory season association instead of adding season-independent news and a global publication permission. This reuses seasonal Manager authority and public lookup/Dashboard scope, accepting no general unscoped news in the first version. Managers may publish their own preparation; publication/withdrawal remains nondelegable. Use plain text and versioned publication, retaining the current public version while a replacement is draft, requiring explicit withdrawal/republication, and preserving previously published history. Authorized news management remains possible in Closed seasons without reopening or changing sporting records. Exact technical contracts remain open; no rich-text/image-upload library, new UC or whole-v2 approval is selected.
