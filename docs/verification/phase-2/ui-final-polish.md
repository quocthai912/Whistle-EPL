# PHASE 1–2 final UI polish — 2026-11-19–20

This targeted follow-up starts at `eb6fbddec8545bbf8f84ef899213e797b738ee6c`.
The final review contained 65 variants: 61 accepted and four requiring adjustments.
The separately requested shared-form spacing correction also applies to dialogs
that were otherwise accepted. Original comments remain in ignored local inputs;
this report records only neutral technical findings and verification.

## Diagnosis and scope

The stadium edit reproduction measured left/right form insets of **25px/40px**
in both Chrome and Edge. A stable native scrollbar gutter reserved 15px on the
right only. A browser style probe confirmed that bilateral gutters removed the
asymmetry. `WorkspaceDialog` now reserves matching gutters for body, header and
footer, with consistent padding and viewport-bounded scrolling. The same
reproduction measures **40px/40px** after the change. The regression checks the
visible geometry and title alignment, rather than a specific CSS declaration.
Regulation action forms also lose their asymmetric inner padding.

The reusable correction-impact section now groups its heading, season selector
and feedback with explicit spacing. This applies to **both clubs and stadiums**,
including loading, empty, unavailable and returned-result states. Existing D036
reason/basis requirements, scope filtering and historical references are retained.

The other adjustments are limited to the reviewed presentation surfaces:

- Login with an uncertain outcome: group the introduction and its three feature
  cards together. Ordinary login and change-password layout rules are unchanged.
- Workspace home and access explanation: the Team Leader separately approved
  a generated design preview on 2026-11-20. Both now use a shared 720px compact
  card, a small brand/shield tile, a 24px heading, one explanatory paragraph and
  separated actions. The large lion artwork and duplicate assignment notice are
  removed. Feature visibility still derives from actual session permissions;
  there are no new business features or metrics.
- Change-password and return-to-workspace navigation: use the existing Whistle
  button vocabulary, with visible keyboard focus.

The [source manifest](ui-final-polish-source.json) pins the changed source/test
files. The shared dropdown, date picker and date-format owners have no diff from
the baseline. DD/MM/YYYY, dropdown effects, authorization, API contracts,
idempotency/recovery state and backend persistence remain unchanged.

## Verification

- Full real Chrome/Edge regression at the preceding polish milestone: **64/64 passed**, including the added club
  and stadium dialog-geometry assertions, authentication, administration,
  delegations, audit, season/regulation workflows, logos and D099 cycles.
- Focused visual/geometry scenarios: **8/8 passed** at PC 1600×1000 and laptop
  1366×768. They cover the reviewed surfaces, club/stadium create/edit/correction,
  season editing, lifecycle creation and short/expanded regulation confirmation.
- Extended confirmation scenarios: **4/4 passed**, covering approval conflict and
  uncertain recovery, waiting cancellation, discontinuation and duplicate review.
- Unchanged administration/season-creation geometry: **2/2 passed**.
- Affected-only gallery: **2/2 passed**; all 40 images decode at their declared
  PC/laptop dimensions and every selector opens the corresponding image.
- Backend unit: **62/62 passed**.
- Frontend unit: **92/92 passed in all 16 files** on the complete final run.
  Initial runs passed 90/92 with overall test timeouts; the failing cases varied. Isolated
  reproduction also exceeded 15 seconds for draft conflict/rebase and five
  seconds for the two date-validation cycles. Only these two overall budgets
  become 30 and 15 seconds respectively; assertions, interactions and individual
  wait conditions are unchanged.
- Root lint, typecheck, formatting, production build/client-construction and diff checks:
  passed. The two overall JSDOM budget adjustments leave all assertions and individual
  wait conditions intact.

Nine of ten sampled before/after accepted-screen PNGs are pixel-identical:
ordinary login, stadium list, season list and current rules in both browsers,
plus the laptop club list. The desktop club comparison includes previously
unloaded lazy logos and their row-height effect; it is not claimed as an exact
pixel match. The club list/row/logo component owners were not changed. This is a
targeted preservation check, not a claim to have replayed all 61 accepted variants.

An initial Windows sandbox attempt could not initialize Edge's temporary profile;
the complete passing browser regression used the installed browsers outside that
sandbox. The same loopback HTTPS certificate pin and isolated PostgreSQL target
were retained. The user's preview database was not reset. Synthetic gallery data
is separate from the regression database; uncertain/conflict captures simulate
failure and do not commit approval decisions.

## Affected-image delivery

The ignored local delivery is
`.verification/phase-1-phase-2-final-polish/index.html`: **20 affected states,
40 distinct PC/laptop PNGs**, grouped without duplicate images. Existing full
galleries are preserved. Unchanged-screen comparison images and original review
text are excluded from the delivery folder. The working scripts and logs remain
under `.verification/ui-polish/` and are not Git artifacts.

No independent sub-agent was used, as requested. This follow-up is local and
unpublished and does not replace historical Phase acceptance or close remaining
operational/later-Phase input gates.

## Approved welcome/access design follow-up — 2026-11-20

The Team Leader reviewed the raster mockup before authorizing implementation.
Only the home/access presentation and its expected localized test copy changed
from the preceding delivery. Header, sidebar, business screens, forms, shared
controls and permission predicates are retained.

- Complete frontend rerun after this design: **92/92 passed** in all 16 files.
- Focused real Chrome/Edge checks: **4/4 passed**, including 720px card symmetry,
  no protected account-list reads for an unassigned session, return navigation,
  password navigation and the assigned-session home branch.
- Root lint, formatting, typecheck and build/client-construction: passed.
- Existing affected authentication/administration/audit browser regression:
  **32/32 passed** in Chrome/Edge, with no skips or retries.

Four real PC/laptop images are available in the ignored local viewer
`.verification/workspace-approved/index.html`. The preceding gallery is kept as
its historical review record; its two welcome/access views are superseded by
these four captures. No backend/schema/permission change or new sub-agent review
is introduced by this approved follow-up.

### Final logo-only adjustment

Both message cards use the original Whistle-EPL PNG, replacing the access-card
shield. The lavender tile and multiply blending are removed, preserving the
original image colors. Layout and navigation remain as verified above. At the
Team Leader's request no further test run was made for this cosmetic adjustment.
Two fresh screenshots are saved locally as
`.verification/workspace-approved/images/logo-home.png` and `logo-access.png`.
The source manifest includes this final cosmetic state.
