# PHASE 2 User Interaction Contract

**Status**: Feature design approved with the Plan on 2026-11-10 within existing D086/TD/TT conventions. No new UI framework,
public dashboard or application code is created. Vietnamese product labels and feedback;
English source documentation.

## Navigation and capability projection

Retain existing /admin/auth routes and add only the approved internal workspace routes:

| Route | Behavior | Authority/empty state |
|---|---|---|
| /workspace/seasons | Assigned-season list/search, explicit creation action, metadata details/edit, lifecycle requests/history | Creation capability exposes create only. No accessible seasons shows an empty list or explains scope, never unrelated internal data. |
| /workspace/seasons/{seasonId}/regulations | Current/waiting/previous/draft versions, full typed form, exact submitted review, effectivity/cancel-replace/history | Manager and valid delegated preparation capabilities determine actions; independent approval exclusions shown and server-enforced. |
| /workspace/clubs | Search/pagination, master details/correction/history, logo operations and discontinue/resume | Live shared Club grant for writes; permitted read responsibility for display. |
| /workspace/stadiums | Search/pagination, details/correction/history and discontinue/resume | Live shared Stadium grant; no schedule editor or match relocation here. |

Extend session-view/store/client projection with create/shared/seasonal/preparation capabilities
without treating client flags as authority. New permissions/session loss use existing epoch
and reauthentication handling. Do not gate all workspace routes on administrator status or
replace PHASE 1's working routes with a large navigation refactor.

## Forms and exact-version review

- Show required fields, normalization preview, formats and actionable bounded field errors.
  D092 values/lengths are shared with backend; valid input remains on validation failure.
- Season code is immutable after creation. Closed metadata is read-only with explanation
  and a link to the existing independent reopen request; no inline bypass switch.
- Regulation form has separate typed groups for eligibility, intake windows, structure/planning,
  event types and points/ranking/Q/R. Incomplete draft saving differs visibly from complete
  submission/approval. Date-only input never shifts through a timezone; instant input/display
  uses Asia/Ho_Chi_Minh with explicit approved versus actual-processing labels.
- Review identifies exact submitted version, differences/basis/affected objects and effectivity,
  not a changing latest draft. Confirmation dialog presents these values. Cancel/discard leaves
  saved state intact. Any preparer/editor is visibly ineligible for approval but cannot bypass
  that by navigating directly or sending a request.
- Returned/withdrawn revision creates a successor; previous content remains inspectable.
  Approved/waiting/current/blocked/superseded labels must not imply highest version is current.
- Future cancellation/replacement shows the exact target/replacement and cutoff. Passing the
  deadline or losing the basis requires refresh/new review, not auto-conversion to immediate.
- Closing dialog shows current blockers and summary basis; missing later readiness is honest
  blocked feedback, not an offer to fabricate a summary or start PHASE 7.
- CLOSE submission identifies the exact summary being reviewed; a changed current summary
  requires revised submission. Replacement review identifies both immutable request and
  replacement content and excludes all preparers/editors from either set.

## Masters and media

Management availability filter includes discontinued records/history; selectors for new use
show only currently active options. D099 confirmation requires reason and explains that
existing approved commitments are preserved and prior rejected work is not revived.
Same-name warning requires explicit distinct-entity acknowledgement/reason; duplicate codes
never gain a warning override. Master correction shows before/after and affected work without
claiming to apply its downstream correction automatically.

Club logo UI uploads bounded FormData through the existing session/CSRF client. Validate for
feedback locally and enforce everything again on server. Preserve displayed old logo until
successful change; use a consistent component with club-name alt text, fixed presentation
area, aspect ratio and missing/load-failure fallback. Reload/review an uncertain upload
outcome; do not silently send a fresh mutation with a new revision. Never store media secrets,
browser persistent credentials or remote storage URLs.

## Lists, errors and accessibility

Reuse established list/search/dialog/error primitives, extracting a genuinely shared typed
helper only where needed. Keep regulation content/forms feature-owned; do not force nested
versions/windows/catalogs into the administrative string-record dialog.

Lists over 20 records have totals and deterministic paging; search/filter changes reset page,
stale responses are discarded and controls support Loading/Empty/Error/retry states. Keyboard
focus, visible labels and errors remain available for main operations. Desktop administration
is primary; applicable lookup/media presentation is usable at 360x800, 768x1024, 1366x768,
with wide-table scroll contained and controls unobscured.

403/404 never leak another season's objects. 409 retains local entries and requests explicit
reload/review; 401 routes to existing session handling; 503 does not label old regulations
current or corrupt a logo. Success feedback requires an actual successful response/state.
Validate actual Chrome and Edge, not only bundled Chromium or mocked network journeys.
