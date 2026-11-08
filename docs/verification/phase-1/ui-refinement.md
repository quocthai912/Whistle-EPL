# Administration and authentication UI refinement

The Team Leader requested a complete visual and interaction review on 2026-11-07
(Asia/Bangkok). References are the supplied MH08, MH09 and MH10 ZIP HTML and twelve
screenshots. Archive content was inspected as design reference data. The local
logo and background remain the artwork sources. This record describes the current
working tree on `refactor/phase-1-ui-refinement` and supplements the historical
PHASE 1 acceptance evidence.

Local preview readiness was verified on 2026-11-08 (Asia/Bangkok). PostgreSQL,
backend and web were running, and `/login` and `/api/v1/ready` returned HTTP 200.
The temporary test containers, databases, network, CA trust and credential-bearing
profiles were removed after verification.

| Reference area | Delivered behavior | Executed verification |
|---|---|---|
| Shared administration frame | Purple navigation, artwork header, readable typography, sticky desktop sidebar/header, white content cards and footer | Desktop/tablet/mobile visual checks and navigation/access E2E |
| MH08 list and creation | Personnel/name/username search, live-role and status filters, refresh, advanced sorting, pagination, creation and cancellation | Real account creation, literal-search/role-filter integration, Chrome/Edge search and dropdown checks |
| MH08 account drawer | Four tabs, profile metadata, real last successful login, edit, lock/unlock and temporary password reset | Chrome/Edge profile actions and conflict recovery |
| MH08 seasonal roles | Season selector, four role cards, assignment and revocation, self-expansion guards | Chrome/Edge assignment/revocation and current-account safeguards |
| MH08 shared permissions | Separate club/player/stadium cards, eligibility, explicit grant/revoke, automatic-loss explanation | Real stadium grant/revoke, backend authority checks and disabled self-grant checks |
| MH08 system permissions | Separate administrator and season-creation cards | Real administrator and season-creation grant/revoke, self-administrator revocation disabled |
| MH09 proposals | Separate proposal tab, proposer/recipient search, season/status/operation menus, details, processing controls and version history | Manager draft/submission, independent administrator grant, operation filter, search and details E2E |
| MH09 granted authority | Recipient/operation search, season/status/recipient menus, detail drawer and reasoned revocation confirmation | Real grant search and recipient filtering, revoke E2E and PostgreSQL query checks |
| MH10 list | Actor/account-target/operator search, date/action filters, optional identifier/object/sort/page-size filters, refresh and pagination | Name search, no-match/reset, stable pages, half-open time bounds and access E2E/integration |
| MH10 details | Right drawer, metadata, reason and before/after cards, literal text rendering | Read-only/XSS/redaction checks and responsive drawer E2E |
| Dropdown interaction | Shared custom menus for pages, drawers and command forms, selected/hover states, rotating chevrons, focus, keyboard navigation, Escape and outside dismissal | Real mouse/keyboard interaction in Chrome/Edge and open-menu captures |
| MH06/MH07 | More visible navy/purple artwork in both left panels, adjusted crop, larger text and coherent form typography | Authentication E2E and separate visual checks at all three review widths |

Search executes on the server before pagination and counting. Query extensions,
limits and projections are documented in the [REST contract](../../../specs/001-phase-1-operational-foundation/contracts/rest.md#administration-design-alignment-search-extension).
Season options include their code when it differs from the display name, and
recipient choices include personnel codes to distinguish people with matching names.
The four drawer tabs become a two-column layout on narrow screens. Long usernames
use ellipsis in the table and remain available in account details.

Verification used PostgreSQL 17 in two explicitly isolated databases,
`whistle_test_ui20261107b` and `whistle_test_browser_ui20261107b`, with synthetic
fixtures. Chrome 156.0.8078.81 and Edge 157.0.4341.42 accessed trusted loopback HTTPS
at port 55444. The manual-preview database was separate from fixture resets.

The executed checks passed as follows.

- Backend unit tests passed 15 cases. The sandbox initially blocked Supertest
  loopback connections, and the same suite passed with local-socket access.
- Frontend unit tests passed 24 cases. The focused audit-query test also passed
  after correcting premature identifier validation found by CodeRabbit.
- The three selected PostgreSQL integration files passed 21 cases. The delegation
  file additionally passed 15 cases after adding grant-search assertions.
- The complete existing Chrome/Edge suite passed 30 cases. Two additional
  Chrome/Edge cases passed the full account-profile/permission action walkthrough.
- A separate real-backend Chrome visual check passed all five pages at
  1440, 768 and 360 pixels without document horizontal overflow. It also verified
  outside dismissal of the Vietnamese calendar before changing viewport size.
- Build, lint, type checking, formatting and whitespace checks passed.

Open-menu, drawer, authentication and final viewport captures are local ignored
artifacts under `.verification/ui-review/`. They contain synthetic test data.
CodeRabbit reviewed the tracked changes and new components. Its identifier-input
finding was verified and fixed, with a regression assertion that partial UUID
typing produces neither validation feedback nor a request before explicit submission.

The current Context documents own the security constraints and PHASE 1 acceptance history.

## Typography and header follow-up — 2026-11-08

The Team Leader requested a slight reduction in text size across all five pages,
fully visible desktop authentication footers and a clearer administration header
crop. Body text now uses 14px, administration headings use 22px, and supporting
controls/table text use a balanced 12–13.5px scale. Authentication cards use less
padding and tighter information strips, with an additional desktop layout for
windows at most 740px tall. The artwork header uses a bounded image layer with the
lower crop of the source image, fading into the navy/purple account area.

A read-only browser harness against the rebuilt preview frontend passed 40
page/viewport checks across Chrome and Edge using mocked API responses and
synthetic account/list metadata. All five pages fit horizontally at 1536 × 734,
1366 × 650, 1440 × 900 and 360 × 800. Both authentication footers were fully inside
the viewport at all three desktop sizes. Account drawers were also inspected.
Captures and the harness report are under `.verification/ui-review/type-scale/`.
The existing authentication E2E test now asserts footer visibility at 1536 × 734
and 1366 × 650 for both authentication pages. This follow-up used the browser
layout harness for those assertions. The earlier real-backend functional results
above retain their original execution scope.

## Audit completeness and full regression — 2026-11-08

The Team Leader requested removal of account revision numbers from routine
confirmations and a review of necessary before/after changes across all
implemented PHASE 1 actions. Account confirmations now describe the person,
state and rights without the technical revision; optimistic concurrency and
explicit review of fresh data remain in place. Delegation proposal versions
remain business history and are not removed.

Account name changes, lock/unlock and administrator recovery already recorded
their previous/resulting fields. The follow-up adds both sides for system and
seasonal roles, shared and Create Season rights (including prerequisite-loss
termination), reset/change-password requirements, delegation content edits,
proposal decisions and grant lifecycle boundaries. Immediate delegation start
uses granted-to-active; a timed start uses scheduled-to-active. Draft edits
capture the original content before the same version row is updated, and returned
edits preserve the original version before creating its successor. The
[REST audit field catalog](../../../specs/001-phase-1-operational-foundation/contracts/rest.md#phase-1-audit-change-summaries)
owns the technical mapping under D094.

The audit drawer translates role/right/state codes and displays both comparison
sides. Creation explains that the object did not exist; login/logout explain
that no business-data comparison applies. Historical rows are not rewritten or
reconstructed from current state. Missing historical sides are identified as not
recorded, and unavailable/unauthorized payloads retain their existing redaction.
No credential, hash, CSRF token or session identifier is added to audit payloads.

Regression ran against the local working tree based on `7eefe18`, with Node
24.14.0, pnpm 10.33.2 and PostgreSQL 17.11. Integration and browser suites used
separate newly migrated disposable databases, not the manual-preview database.

| Verification | Observed result |
| --- | --- |
| Backend unit suite | 15/15 passed across five suites. |
| Frontend unit suite | 30/30 passed across seven files, including six audit presentation/legacy-history cases and revision-conflict recovery. |
| Entire PostgreSQL integration suite | 90/90 passed across 17 suites, including new real-event before/after assertions, automatic right loss, password change, immediate/timed boundaries, revocation, rollback, authorization and redaction. |
| Entire Chrome/Edge E2E suite | 32/32 passed over trusted local HTTPS. New assertions cover account confirmation copy and actual before/after role-grant details. Existing viewport, footer, session, delegation, audit and recovery paths also passed. |
| Backup manifest/scheduler Python suite | 5/5 passed in an isolated Python 3.12 Linux container with a read-only source mount. |
| k6 authentication regression | Baseline: 100/100 accepted and below three seconds at 20 VUs. Negative workload: all six attempts observed, five 401 responses followed by 429, expected-denial rate 100%. |
| Source/toolchain checks | Build, lint, typecheck, formatting, Prisma validation, native/client compatibility and `git diff --check` passed. |
| Manual preview | Backend/web rebuilt without resetting data; `/login` and `/api/v1/ready` returned 200. |

The initial new UI test configuration lacked its session provider; it was fixed
before the passing rerun. Initial E2E attempts failed because the new disposable
CA had not yet completed trust installation. Trust was installed and the full
suite reran successfully with certificate verification enabled. Expected injected
storage failures are part of passing rollback tests. JSDOM pseudo-element,
bundle-size and pg concurrency deprecation warnings remain non-failing diagnostics.

Ignored local reports are `.verification/ui-review/audit-{integration,e2e}.log`,
`audit-{backend,frontend}-units.log`, `audit-checks.log` and the k6 JSON/log files.
The browser JSON report is `.verification/browser-results/report.json`.
Visual inspection of the new two-column drawer used the real E2E captures.

This is a post-acceptance regression of implemented PHASE 1 functionality, not
new acceptance of future Phases or a rerun of hosted CI, clean-install and
backup/restore drills. Historical acceptance evidence remains separately dated.
The load rerun is a local regression, not a replacement for the recorded BM-01
acceptance resource profile. No acceptance-blocking regression was observed in
the executed scope. PHASE 1 remains `COMPLETED`; later Phases add their own audit
actions and evidence when implemented. Only authorized humans may merge PRs.
