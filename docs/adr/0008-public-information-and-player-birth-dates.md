# ADR 0008 - Public information boundary including player dates of birth

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q32, modified option A; Context decision D032.

O04 highlights the tension between lookup forms BM4.2/BM4.3 (PDF pp.8-9) and BM-05/section 1.2.5.3 (pp.21/23). The Team Leader selected Q32 option A with the explicit addition that players' full dates of birth are public. Public seasonal lookup therefore includes season information, participating club name/abbreviation/coach/home ground/valid player count, player name/birth date/nationality/position/club/shirt number/registration category, published schedules, confirmed scores, official standings/goalscorers/clean-sheet statistics and published news. Detailed fields are listed in [D032](../../context/english/design/README.md#d032---public-information-boundary-including-player-dates-of-birth).

Representative information, contacts, training/homegrown evidence, application/review content, drafts, unconfirmed results, change reasons and system logs remain internal with appropriate access. Unapproved fields remain internal. The approved exception covers birth dates within public seasonal player lookup, not access to all underlying profiles/applications. Q32's alternative of publishing representative names was not selected.

V1 BM-05 records birth dates as requiring appropriate authority. This is an explicit Team Leader-approved v2 change to that source-derived default, not an assertion that v1 already authorized public birth dates. Preserve v1's source transcription and approval; subsequent specifications and acceptance must trace the exception while retaining other protection requirements and thresholds. Backend public UI/API data and any files intended for public use must follow the same scope. No public-export feature is implicitly approved. D033 below settles responsibility-based internal viewing; field/API/export schemas, log payloads, news fields, publication defaults and lookup eligibility details remain open.

## Responsibility-based internal viewing

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q33, option A; Context decision D033.

| Internal group | Authorized role in the assigned season |
|---|---|
| Club participation applications, representatives and contacts | Season Manager; Registration Officer |
| Player registration records and homegrown evidence | Season Manager; Registration Officer |
| Draft schedules and unapproved adjustments | Season Manager; Scheduling Officer |
| Match reports, unofficial results and correction proposals | Season Manager; Results Officer |
| Proposed regulation changes | Season Manager; staff with corresponding D019 delegation |
| Account administration and system-wide log search | System Administrator under UC03/UC04 |

Multiple roles contribute only their assigned seasonal viewing scopes. Delegation adds data necessary for its operation. Eligibility-dependent functions can receive the check result and necessary reasons without receiving all source records. System administrators do not automatically receive every business-profile screen. Object history follows object access scope; UC04 remains the system-wide log-search function, with detailed payload fields still to be decided.

Allowing every seasonal business role to view all internal data was considered. The Team Leader chose responsibility-based data access with server-side UI/API checks. Shared master-record management, detailed fields/API/export schemas, log/history payload filtering and remaining read/write action permissions remain open. D032's public player-birth-date exception is retained. See [Context v2 D033](../../context/english/design/README.md#d033---internal-viewing-follows-business-responsibility).
