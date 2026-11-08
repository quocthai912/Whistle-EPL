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

## List display preferences — 2026-11-08

The Team Leader requested page-size control for accounts and display preferences
for both delegation lists. A shared expandable display-options group now provides
sorting and 20/50/100 rows per page using the existing dropdown component. Account
sort choices are preserved; proposals offer newest/oldest creation order, while
grants offer grant-date order and earliest start/end. These choices use existing
server allowlists and pagination without backend changes.

Changing sort or page size resets the active list to page 1 while preserving its
search and filters. Proposal and grant display preferences are independent and
remain selected when switching tabs. Refresh restores the active list's default
sort and 20-row size. Preferences belong to the current mounted page, not persistent
browser storage. The controls wrap at narrow widths and retain visible labels.

A read-only browser harness against the rebuilt preview frontend passed all three
lists in Chrome and Edge, including 12 desktop/mobile viewport checks at 1440 × 900
and 360 × 800. Mocked API responses verified the outgoing pagination/sort queries,
page reset, retained search, independent tab preferences, refresh defaults and
dropdown opening/Escape behavior. Reports and captures are under
`.verification/ui-review/display-options/`; the ignored harness is
`.verification/ui-review/display-options.cjs`. This is browser UI verification with
mocked responses, not a new PostgreSQL/E2E acceptance run.

The frontend regression exposed pre-existing short waits in asynchronous audit UI
tests: the default one-second element wait and five-second whole-test deadline
could expire while loading/rendering the administration route. These waits were
made explicit (five seconds for elements, fifteen seconds for the affected tests),
without removing assertions or changing application performance requirements.

The final frontend run passed all 30 unit tests across seven files. Frontend build,
lint, type checking, formatting and `git diff --check` also passed. Only the web
preview was rebuilt; the existing backend/database and user data were preserved.

## Administration header artwork — 2026-11-08

The Team Leader selected the original artwork for the shared administration
header, initially as JPEG and now as `frontend/public/images/Whistle-EPL-Background.svg`
under the application-wide vector update below. It covers the full header width with the selected option B (right/28%, 120% image width), showing the cyan
curves on the left and purple arcs on the right. A light darkening gradient keeps
branding and account actions readable. This supersedes the bounded crop and the
alternate `Whistle-EPL-Background-Header.jpg` trials described in earlier local
captures. Authentication composition and styling retain their previous settings;
their image format is updated under the vector update below.

At the JPEG milestone, the web preview was rebuilt with the original image. A read-only harness
with mocked API data passed 40 page/viewport checks across Chrome and Edge, at
1536 × 734, 1366 × 650, 1440 × 900 and 360 × 800. Computed-style assertions confirmed
the original image on accounts, delegations, audit, login and change-password.
Desktop/mobile captures were inspected for full coverage, crop and readability.
Those JPEG milestone captures/reports are under `.verification/ui-review/header-original/`;
earlier alternate-artwork trials remain under `header-art/` and `header-art-v2/`. The frontend
image build, CSS formatting and whitespace checks passed; no application logic,
backend or database change was needed.

## Standalone vector background — 2026-11-08

The Team Leader requested an SVG reconstruction of the existing 520 × 254 JPEG.
`frontend/public/images/Whistle-EPL-Background.svg` reconstructs the colored
serrated curves as ten closed vector contours with smoothed curved segments and
preserved corners. Its cyan-to-magenta gradient is fitted to the source colors
over a clean navy background. The SVG contains paths and a gradient only, with
no embedded raster, scripts or external references. It is approximately 16 KB.

The asset retains the source aspect ratio and was rendered at 2080 × 1016 and
4160 × 2032 for visual inspection. Chrome and Edge also decoded the standalone
SVG and rendered it at 2× pixel density. Preview artifacts and the reconstruction
report are under `.verification/ui-review/svg-background/`. The reconstruction
follows the available low-resolution source; it does not claim the original
designer's exact vector control points. The asset was first delivered separately
for review; the Team Leader then authorized its application throughout the UI.

## Application-wide SVG background — 2026-11-08

All four artwork URL references now use `Whistle-EPL-Background.svg`: the shared
administration header, the login/change-password information panel and both
normal and hover/active authentication submit-button backgrounds. Existing crop,
cover sizing, opacity, gradients and interaction styles are retained. No source
CSS reference to the JPEG remains.

The web preview was rebuilt successfully, including TypeScript validation. The
SVG endpoint returned 200 with `image/svg+xml`, and the login page returned 200.
A read-only harness with mocked API responses passed 40 page/viewport checks
across Chrome and Edge at 1536 × 734, 1366 × 650, 1440 × 900 and 360 × 800. It
asserted SVG use on all five pages, successful browser image decoding and SVG
backgrounds on both authentication submit buttons before and after hover. Desktop
captures of the authentication panel and administration header were visually
inspected for sharper edges and legibility. Current reports/captures are under
`.verification/ui-review/svg-background/app/`. CSS formatting and whitespace
checks passed. This visual-only update did not change application logic or data;
the earlier functional regression evidence retains its recorded scope.

## Selected header crop and account password entry — 2026-11-08

After reviewing three preview-only crops, the Team Leader initially selected A: the upper
image region at center/12%, with cover sizing and the existing overlay. This
replaces the previous lower crop in the shared accounts/delegations/audit header.
Authentication-page artwork and styling were not changed in this follow-up.

The administration header no longer contains a password-change link. In account
details, the currently signed-in account now offers **Đổi mật khẩu**, closes the
drawer and navigates to the existing self-service `/change-password` form. That
form still requires the current and new passwords under D081. A different account
continues to offer **Đặt lại mật khẩu**, opening the administrator's temporary
credential dialog. No backend authorization, credential or audit contract changed;
the existing change-password entry on `/internal` remains available.

A read-only browser harness with mocked API responses passed 40 page/viewport
checks across Chrome and Edge, including crop A on all three administration
pages and no password-change link in their headers. It also checked own-account
navigation, current-password input, drawer cleanup and the distinct other-account
reset dialog. Reports and captures are under
`.verification/ui-review/header-account-actions/`. The web preview was rebuilt
and `/login` returned 200. These are UI checks rather than a new backend acceptance
run; the previously recorded authentication behavior retains its own evidence.

The final frontend suite passed 32/32 tests across seven files, including new
own-account and other-account password-entry regressions. The unit tests check
routing and form semantics; actual dialog visibility is covered by the browser
harness because JSDOM has no modal layout engine. Frontend build, lint, type
checking, formatting and whitespace checks also passed. No source changes to
the authentication screens were made in this follow-up.

### Final header selection B

The Team Leader subsequently selected B from the same comparison. The shared
administration header now uses the SVG at 120% image width, aligned right/28%,
without repeating; the overlay keeps its original full-header size. This replaces
A while preserving the account password-entry changes above. Authentication
artwork and styling remain unchanged. The rebuilt web preview returned 200, and
40 Chrome/Edge page/viewport checks passed with explicit assertions for the 120%
size and 28% position on accounts, delegations and audit. The harness also retained
the own/other-account password-entry checks. Captures and reports are under
`.verification/ui-review/header-crop-b/`. Frontend build/type validation, CSS
formatting and whitespace checks passed; this crop-only follow-up did not rerun
the unit/backend suites or alter their previously recorded evidence.

## CodeRabbit PR follow-up — 2026-11-08

All supplied inline findings and test nitpicks were verified against the current
code and remained valid; none was skipped. Review text was treated as untrusted
data. The follow-up makes the following corrections without changing business
authority or database schema:

| Finding | Correction and regression evidence |
| --- | --- |
| Recipient options load grant history before client-side distinct | Query accounts through `receivedGrants.some(scope)`, selecting only person metadata and ordering by name/ID. Each recipient is returned once by the database. A real HTTP test creates repeated grants and a different manager's grant, then verifies unique ordered options, caller scope and independence from one-row pagination. |
| Operation-label search normalizes whitespace differently | Apply `businessText(..., 'name', false)` before Vietnamese lowercasing. A PostgreSQL HTTP assertion uses repeated spaces and a tab in the displayed operation label. |
| New debounced searches can inherit an old page | Bind account/proposal/grant pagination to the committed term and reset it before querying a new term. Three routed tests choose another page during the debounce interval and require the committed search to request only page 1. |
| Grant drawer keeps an obsolete status/revision | Reconcile the selected grant with completed refreshed results, or close it if absent. A routed test refreshes active to expired, checks revocation disappears, then removes the grant and checks the drawer closes. |
| Automatic audit filters consume unfinished identifiers | Reuse submitted actor/object IDs when applying another automatic filter. A routed test edits both drafts, changes page size, verifies prior IDs remain applied, and confirms explicit invalid submission still fails validation. |
| Audit pages remain clickable during debounce | Disable previous/next while draft and committed search differ; restore ordinary bounds after commit. The regression checks both pending controls and re-enabled next-page navigation. |

The role-filter integration fixture now interleaves matching/nonmatching accounts
and asserts the total and exact rows across two filtered pages. Last-login
metadata is checked after two logins one minute apart, with an explicit null for
an account that never logged in. Account-lock UI assertions are scoped to their
respective before/after cards, including negative assertions against swapped
labels. A temporary mutation probe swapped only the fixture's state sides and
confirmed that the expected before-state assertion failed; the probe was removed.
The browser role-filter journey now checks an unassigned role produces no rows,
then restores the matching scheduling role.

JSDoc was added to undocumented named production functions in the PR's changed
TypeScript/TSX files, including safe audit payload/query helpers, credential and
delegation operations, and list/filter handlers. A TypeScript AST audit against
the local `origin/development...HEAD` production-file inventory found no remaining
undocumented named declarations/methods/arrow helpers in that scope. The hosted
CodeRabbit Docstring Coverage check must still recalculate when this commit is
pushed; a local AST audit is not a hosted-check result.

The six new routed UI regressions were first run against the old code and failed
on the reported symptoms. After correction, the final results were:

| Check | Result |
| --- | --- |
| Backend unit | 15/15 passed, five suites. |
| Frontend unit | 38/38 passed, eight files. |
| PostgreSQL integration | 91/91 passed, 17 suites, on a newly migrated isolated database. |
| Trusted-HTTPS Chrome/Edge E2E | 32/32 passed on a separate isolated browser database. |
| Audit state-swap mutation probe | Rejected specifically by the scoped before-state assertion. |
| Quality | Root build, lint, typecheck, formatting and whitespace checks passed. |
| CodeRabbit CLI Local | `coderabbit review --agent --uncommitted --include-untracked` completed on the final code/test snapshot with zero findings across 22 reviewed files. |

Initial runs exposed a new fixture missing the recipient's role in the selected
season; the fixture was corrected through the authorized role-assignment route.
The existing JSDOM cancellation journey took about 5.9 seconds to render its
steps, beyond its old five-second whole-test deadline; multi-step UI test budgets
were adjusted without removing assertions or changing application latency targets.
The E2E dropdown helper now dismisses an already-selected option with Escape,
avoiding a redundant selection/close race while still clicking genuinely new
values. The final complete reruns passed. Temporary diagnostic instrumentation
and the failed animation-disabled experiment were removed.

Ignored evidence is under `.verification/ui-review/`: `review-list-state-red.log`,
`review-frontend-final.log`, `review-integration-final.log`, `review-e2e-final.log`,
`review-audit-swap.log`, `review-final-checks.log` and
`coderabbit-review-complete.jsonl`. PHASE 1 acceptance/status and the earlier
install/load/recovery/hosted-CI evidence remain unchanged. No commit, push or PR
merge was performed; only authorized humans may merge PRs.

### Audit filter follow-up — 2026-11-08

The subsequent PR findings were reproduced against the current code. Audit
requests now use the applied query without overriding an explicitly submitted
search with the previous debounced term. Settled typing updates that query only
when it matches the current draft and differs from the applied search, including
submission followed by restoring the previous text before the debounce expires.
Automatic filters preserve submitted actor/object identifiers and pending edits.
Pending identifier fields explicitly identify themselves as unapplied and display
the identifier currently used by the results; submitting validates and applies
the draft. Before/after assertions now scope all recorded grant values to their
corresponding summary, including negative assertions for the opposite side.

Local CodeRabbit found two additional valid issues during iteration: discarding
unfinished identifier edits on automatic refresh, and failing to restore an
already-settled search after an immediate submission. Both were fixed with
regression coverage. Subsequent ordinary/deep/scoped CLI runs completed with no
new findings but reported that no fresh detailed file review was performed;
those responses are not evidence of a fresh clean review. No finding was
dismissed merely to clear the report. Logs are retained under the ignored
`.verification/ui-review/audit-followup-*.log` and
`.verification/ui-review/coderabbit-audit-followup*.jsonl` paths.

This follow-up does not change PHASE 1 acceptance, scope or merge authority.

The final targeted run passed all 14 audit/list-state tests, including pending
identifier feedback, atomic search/actor submission, restoring a settled term,
reset during debounce, and scoped historical grant summaries. Frontend lint,
TypeScript/build, formatting and whitespace checks passed. Backend/database and
browser suites were not rerun for this frontend-only follow-up; their earlier
results above remain historical evidence rather than new executions.
The complete frontend suite also passed 39/39 tests across eight files
(`audit-followup-final-unit.log`); the subsequent settled-search adjustment was
covered by the final 14/14 targeted rerun (`audit-followup-settled.log`).

### Audit request assertion follow-up — 2026-11-08

All three subsequent test-review findings were valid. The audit regression now
captures request-count boundaries before submission, restoration and reset,
then inspects only subsequent audit-log requests. After search settlement every
post-submit request must use the new term, including requests without an actor
filter. The restore sequence must contain the submitted term followed by the
restored term. The page stays mounted for 350 ms after reset (beyond the 300 ms
debounce), and every post-reset request must omit search. Each request group is
required to be nonempty, directly or through its ordered term assertions.

All seven tests in `administration-list-state.spec.tsx` passed. Frontend lint,
typecheck, formatting and whitespace checks passed. CodeRabbit CLI Local
`review --agent --uncommitted --include-untracked` completed a fresh review of
the changed test file with zero findings. Ignored logs:
`.verification/ui-review/audit-request-window-tests.log` and
`.verification/ui-review/coderabbit-audit-request-window.jsonl`.
Application code and PHASE 1 acceptance/status remain unchanged.

### Expanded administration header artwork — option D, 2026-11-08

The user selected option D from the expanded-artwork preview. The shared
administration header now uses `Whistle-EPL-Background-Header.svg`, derived from
the existing artwork with `preserveAspectRatio="none"`, centered at `100% 180px`.
This intentionally compresses the artwork vertically to show more of its curves
inside the existing 64 px desktop header. The original SVG and authentication
styles remain unchanged. This selection supersedes the earlier crop selections.

Frontend build, formatting and whitespace checks passed. Mocked-API browser
checks passed all 40 page/viewport combinations across Chrome and Edge for
accounts, delegations, audit, login and password change at 1536, 1366, 1440 and
360 px widths. Checks verified the new administration artwork and positioning,
the original authentication artwork, no horizontal page overflow, authentication
footers and the own-account password-change interaction. Screenshots and results
are retained under ignored `.verification/ui-review/header-d/`; the build log is
`.verification/ui-review/header-d-build.log`. No production data was accessed or
changed; PHASE 1 acceptance/status is unchanged.
