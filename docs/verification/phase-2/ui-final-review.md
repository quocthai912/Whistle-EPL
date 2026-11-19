# PHASE 1–2 final UI review — 2026-11-19

This follow-up is based on checkout `66f63dc3562f119f76eb535b3a46fe1187b74375`.
The changes are local and unpublished. The proposed final UI still requires the
user's visual approval; historical Phase acceptance and publication are unchanged.
The [first refinement](ui-review-refinement.md) remains a historical verification record.

## Audit before implementation

The second supplied review contains 350 images: 98 marked for correction and 252
marked good. All comments were read before implementation; all 98 image names,
including entries inheriting a shared issue without an individual comment, were
mapped to an owner in a local audit matrix. The implementation followed the
recorded grouping and layout decisions. Original comments remain only in ignored
local review inputs; this report uses neutral technical descriptions.

MH11/MH12/MH13/MH17 references supply visual vocabulary. Approved specifications
and Context own functionality. Accepted dropdowns, calendar controls, their effects
and DD/MM/YYYY presentation remain unchanged at their shared source files.

| Audit group | Images | Resolution |
|---|---:|---|
| Authentication/workspace | 15 | Purple informational states, recovery spacing, readable disabled login, an anchored logout recovery panel and the existing lion artwork. Access-denial wording distinguishes authentication from separately assigned feature permissions. |
| Delegations | 8 | Remove empty terminal command rows and reduce the gap before version history. Preserve the previously accepted grant/cancel permission conditions. |
| Audit filters | 1 | Remove duplicate draft-identifier prose; validation and actual applied query state remain intact. |
| Season lifecycle | 15 | Pair editor/submission facts, reserve wide rows for reasons, normalize label/content/action spacing and keep dialog feedback accessible. |
| Regulation workspace/dialogs | 42 | Use one complete reading/editing canvas with version navigation above it; align metadata tracks, use readable type, remove repeated effective status and standard catalog explanations, and normalize panel/history spacing. |
| Club/stadium and duplicate review | 16 | One edit entry with explicit update/source-correction mode; preserve correction reason, basis and impact review. Make immutable codes visibly disabled with an explanation. Put the optional creation logo first and normalize logo/action spacing. |
| Season validation | 1 | Prevent an unchanged picker blur from clearing the first date-order validation error. Keep paired date fields aligned when one has a multiline error, in creation and editing. |

## Shared design and safety of changes

Long dialogs use viewport-bounded scrolling and a pinned command row. Newly reported
errors/conflicts receive focus and scroll into view above that row through
`useDialogFeedback`. Critical requests retain their reviewed ID/revision,
idempotency key and uncertain-outcome recovery behavior.

Readable version numbers replace UUIDs in regulation confirmation and cancellation.
References outside the current list page load actual metadata; confirmation stays
blocked while identity cannot be verified. Personnel/profile/season business codes
remain readable. Internal audit identifiers are available in collapsed technical
sections, rather than titles or ordinary snapshots. Database IDs and request
contracts have not been changed.

Standard goal/card names do not repeat their own explanations. Custom catalog names
still display business classification when the name does not express it, preserving
D046 and the approval review surface. Source corrections continue to require D036
reason/basis and preserve official historical snapshots. No new permissions,
backend schema or unsupported mockup features have been introduced.

## Independent review

A dedicated independent reviewer inspected current source, supplied comments and
actual desktop/laptop captures over three implementation rounds and a final 26-group gallery pass. Ten findings were resolved:
metadata width, inter-panel spacing, remaining audit snapshot UUIDs, duplicate
full-page captures, SVG fragment selection, off-page version identification,
hidden dynamic feedback, custom catalog classification, clear technical-ID filter labels, and realistic fixture names. The reviewer reported
no remaining actionable implementation findings in the reviewed source/states.
This is not human visual acceptance or a claim of replaying every original image.

The final self-check also caught unequal date-field positions after a validation
message. Creation/editing date rows now align at the start; browser verification
measures the actual input coordinates and requires a difference of at most 1px.

The [source manifest](ui-final-review-source.json) pins the changed source/tests and
confirms the three accepted dropdown/date-control files have no diff from the baseline.

## Verification

- Frontend: 92/92 tests passed, including five new tests for unified editing,
  off-page version identity and catalog semantics. One existing localized-field
  JSDOM test now has a 15-second total budget after isolated measurement exceeded
  the default five seconds; all field-value/error assertions remain unchanged.
- Backend unit: 62/62 passed.
- Full existing Chrome/Edge regression: 64/64 passed on the final layout build; the subsequent technical-filter wording update passed its 2/2 Chrome/Edge audit regression.
- Focused real-browser visual scenarios: 10/10 passed; the final fixture-name/filter-label captures also passed 2/2.
- Root lint, typecheck, formatting, build/client-construction and diff checks:
  passed.
- Gallery viewer: 26 canonical groups, 65 state/section views and 130 distinct
  desktop/laptop PNGs; decoding, filters, view switching, zoom, note persistence
  and JSON export verified. Identical duplicate images are excluded.

The previous full-gallery image set remains untouched. The new local gallery is
`.verification/phase-1-phase-2-final-review/index.html`; each screen has one group,
with its related states and laptop view selected inside that group. The sample
code/name dictionary is included. The sanitized repair matrix maps the 98 input
images to the shared resolutions. Evidence scripts/logs are under
`.verification/ui-final-round/`, excluded from runtime and Git.

Browser work used synthetic data on isolated PostgreSQL databases and loopback
HTTPS, with the previously authorized localhost fixture certificate pinned to
browser processes. A future waiting state was restored only in the gallery
fixture; a temporary incomplete draft used for server-validation capture was
restored afterward. Recovery screenshots deliberately simulate network/conflict
failures and do not claim successful approval. The user's preview data was not reset.
No commit, push, Issue closure, Phase acceptance or deployment to port 443 was performed.

The isolated HTTPS applications and their PostgreSQL fixture container were stopped
after verification. The gallery is static and does not require these services.
