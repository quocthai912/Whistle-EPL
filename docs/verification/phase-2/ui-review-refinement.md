# PHASE 1–2 UI review refinement — 2026-11-19

This is a post-acceptance UI refinement of the current checkout. Implementation
is local and unpublished. Earlier Phase acceptance and publication records are
unchanged. Human visual approval of the revised UI remains separate from passing
automated checks.

## Review scope and authority

The supplied `Whistle-EPL-UI-REVIEW.json` contains 332 image reviews: 122 marked
bad and 210 marked good. Empty comments on bad images inherit their shared screen
or workflow problem; they are not treated as approvals. The local audit matrix
in `.verification/ui-redesign/audit.md` maps all 122 bad image names to owners.
The original reviewed gallery is retained unchanged.

The [source manifest](ui-review-refinement-source.json) pins 34 changed
source/test files to baseline `eb8aba985600dc7696593634460fb54c5c7507e3`, and records
the review JSON/ZIP checksums. The three protected dropdown/date-control source
files match that baseline byte for byte.

MH11, MH12, MH13 and MH17 archives were opened, including their HTML, screenshots
and design references. They supply visual references, while approved Context and
the Phase specifications own functionality. Stadium capacity, imports/exports
and other unsupported mockup features were not added. D035 immutable identifiers
and D036 reasoned corrections remain in force.

Accepted shared dropdowns, their popup effects, calendar inputs and DD/MM/YYYY
formatting remain the reference controls. No date storage or API format changed.

## Changes and design rationale

| Area | Change and reason |
|---|---|
| Regulation draft editor | An editable draft gets the full content width. Version cards move above it into a horizontally scrollable list, instead of permanently taking the left side of a long form. Existing version selection and dirty-change confirmation remain available. |
| Draft field layout | Section titles, instructions and fields occupy distinct rows. Labels and input values are larger, with consistent gutters. Paired labels/inputs share row tracks so a wrapped label does not displace only one input. |
| Repeated draft data | Each intake group occupies a full row; opening and closing dates occupy the following paired row. Catalog groups and repeated records have separate headings, spacing and aligned add/remove actions. Ranking rows use the available width. |
| Regulation reading | The current summary orders event catalogs third and eligibility fifth, with the latter using the wider lower area. Expanded catalog data is grouped, and disclosure indicators rotate. Version reading, actor names and history are more readable. |
| Regulation workflow | Change requests are padded, separated records. Confirmation dialogs use a shared portal-aware module for typography, inputs, spacing and actions. Long expanded previews use the dialog width and scroll within the viewport. |
| Seasons and lifecycle | Metadata editing opens in a centered dialog. Edit and lifecycle actions share a row; history filters sit closer to their tab. Proposal and decision reasons use the drawer width. Repeated season headings are removed, the selector is wider, and approved lifecycle records use green status badges. |
| Club/stadium profiles | Row actions align with their headers. Shared display options are available. Wider profile drawers keep the four commands together on desktop. Immutable codes are visibly disabled during editing; correction forms explain their distinct purpose and retain basis/impact review. |
| Club media | A shared accessible file field replaces the native file button presentation. File actions are centered under the logo. Creating a club optionally uploads its logo against the revision returned by creation; if upload fails, confirmed creation is retained and another creation POST is blocked. |
| PHASE 1 | The internal landing uses the established workspace shell, including the account without business permissions. Authentication artwork/callout alignment, advanced-filter label alignment, revision-review spacing and pending-delegation action layout are refined. |

The grouping and instruction placement follow the W3C guidance on
[grouping related controls](https://www.w3.org/WAI/tutorials/forms/grouping/) and
[associating instructions with fields](https://www.w3.org/WAI/tutorials/forms/instructions/).
Visual hierarchy and proximity were cross-checked against
[NN/g's visual design principles](https://www.nngroup.com/articles/principles-visual-design/).
These references guide presentation; they do not introduce business requirements.

## Verification

| Check | Result |
|---|---|
| Frontend unit suite | 87/87 passed; subsequent regulation/media focused checks also passed (15/15). |
| Backend unit suite | 62/62 passed. |
| PostgreSQL integration suite | 168/168 passed, 25 suites, with a newly created isolated database. |
| Existing Chrome/Edge regression | 62/62 passed. |
| Additional Chrome/Edge checks | 4/4 passed: optional creation logo upload, and repeated draft typography/paired-label alignment checks. This adds two new browser cases to the existing 62. |
| Focused desktop/laptop UI checks | 10/10 passed; the final draft-grid and long-preview adjustments were then checked again (4/4). Populated sections were inspected visually. |
| Quality gates | Root lint, typecheck, formatting and `git diff --check` passed. `pnpm build` and the Prisma client-construction verification passed. |

Commands: `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, frontend/backend
`test:unit`, backend `test:integration`, and Playwright's existing Phase 1–2
suite. Browser and integration commands require the isolated database and HTTPS
configuration documented in the Phase quickstarts. Local harnesses/results are
under `.verification/ui-redesign/`; they are not runtime assets or published
test credentials. Windows integration verification used normal host filesystem
permissions because the sandbox blocked temporary-file rename operations.

Tests use isolated PostgreSQL databases and loopback HTTPS. The gallery fixture
is separate from the regression database; the user's preview data is not reset.
The existing localhost fixture certificate is pinned to Chrome/Edge processes.
The synthetic activation-blocked gallery state was restored to its future
waiting state for cancellation-form inspection; this is fixture preparation,
not evidence of a real activation transition.

Focused internal screenshots cover desktop 1600×1000 and laptop 1366×768,
including populated draft sections, approval/rejection, long previews,
cancellation, selector errors, profiles, season editing and delegation layout.
They are QA evidence only. A replacement complete user gallery has not been
published, as requested.

The isolated verification servers and fixture database were stopped after the
checks. This checkout has not been deployed to the Docker preview on port 443.

No backend schema, approved rule, Phase status, Issue or remote publication was
changed by this refinement. Existing operational and later-Phase integration
gates remain open as recorded in the acceptance assessment.
