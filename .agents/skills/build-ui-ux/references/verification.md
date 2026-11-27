# Verification and delivery

Select evidence according to the actual change and current user instruction.
Read package scripts and test configuration when needed instead of copying commands,
test totals, database URLs or certificate details from an earlier session.

## Proportionate checks

| Change | Evidence to choose |
|---|---|
| Cosmetic logo/color/local spacing only | Inspect source and affected rendering. If the user says no tests, run none. Capture only the requested images. Do not start Docker, write tests or run a full suite solely because a logo changed. |
| Component/field/content change in an existing pattern | Relevant type/lint/build checks and focused interaction/validation tests as needed. Check affected callers when behavior or shared styles change. |
| Layout or workflow restructuring | Real-browser visual inspection plus relevant behavioral regression. Include long/invalid/conflict states and sibling screens affected by shared changes. Broaden only for actual shared scope or failures. |

Respect mandatory repository/CI checks and explicit requested suites; explain any
conflict with a requested lightweight scope rather than silently ignoring it.
Keep checks sequential when building assets would disrupt an active browser session.
Keep assertions intact when diagnosing a timeout. Change an overall test budget
only with measured justification and disclose it separately from product behavior.

## State coverage

For each changed surface, mark relevant states **inspected**, **tested**, **not
applicable**, or **not exercised with reason**. Select from:

- Normal populated, loading, empty, failed read and recovery.
- Creation/editing, invalid/required values, multiline errors, normalization,
  read-only/immutable fields and unsaved-change handling.
- Appropriate actors/scopes, unavailable actions and direct no-access navigation.
- Long names, long reasons, multiple rows, pagination and long dropdown options.
- Submission/confirmation, stale basis/revision, preserved input, uncertain outcome,
  exact-version recovery and session/permission loss, where the workflow supports them.

This is a coverage menu, not a demand to manufacture unsupported business states.
For shared fixes, list the callers actually inspected. Separate functional pass
counts from visual observations and simulated failures from completed operations.

## Visual self-review

For desktop evidence use both 1366×768 laptop and 1600×1000 PC when those layouts
are in scope. Preserve the repository's responsive behavior; mobile captures are
not part of a desktop-only delivery unless requested or needed to diagnose a regression.

Inspect real rendered images at readable scale. Check:

- Title/section/body hierarchy, inherited font, readable dense fields and hints.
- Balanced horizontal gutters and vertical group spacing; input baselines with errors.
- Button grouping, table action alignment, icon/logo size and original colors.
- No clipped controls, accidental horizontal page overflow, broken wrapping or
  footer overlapping feedback; long modal content remains reachable by scrolling.
- Dropdown hover/selected/focus, calendar display and validation, keyboard navigation.

Use DOM geometry to support subtle alignment checks (for example, paired input
tops or gutter differences within approximately 1px); still inspect the image.
Compare accepted surfaces when shared styles change. Stabilize fonts, images and
data before pixel comparison; identify lazy-loading/time/data differences rather
than claiming false matches. A mockup is design approval, not runtime verification.

## Fixtures and screenshots

Use existing isolated fixture tooling after checking its actual target and reset
guard. Preserve the user's preview/operational data and security configuration.
Do not assume an old localhost CA approval, port or credential applies to a new
environment. Use current authorized local configuration without committing secrets.

Use coherent sample data: MUN / Manchester United; OTF / Old Trafford; employee
names with realistic unique personnel codes; season codes/names and dates that
agree. Technical keys stay internal. Include enough data for the state being shown.

Save local screenshots, raw reviews and transient scripts under ignored
`.verification/`. A fresh clone must not need those files to use the skill.
For a full gallery, group by screen with related states/device variants; remove
identical duplicates. When a modal or form scrolls internally, capture both the top
view and the scrolled bottom (including final fields and footer actions) so lower
layout defects are never clipped out of review. A long page may need labeled sections,
not repeated full-page images scattered across unrelated groups. Show only
affected/requested captures for a focused change, and exactly the requested number
when specified. Inspect captures before handoff; do not turn a screenshot-only
request into a test run.

## Completion

Report the approved design implemented, changed component scope, actual checks and
visual coverage, and material limitations. Link affected images when requested.
Keep tracked evidence concise and neutral, with source revision and scope; preserve
historical results rather than reusing them as new passes. Honor existing acceptance
and operator gates. End review iterations when the scoped findings are resolved;
additional sub-agent reviews require the applicable task/skill authorization.

Examples of correct effort:

- Replace the access icon with the original logo, user requests two images/no tests:
  change the image/style, capture two fresh screens, deliver them inline; no suite.
- Add a PHASE 4 scheduling or match-report form: load its spec, map fields/permissions,
  inspect analogous registration/season forms, approve a preview for the new layout,
  implement with shared controls, inspect populated/invalid/long states (including
  scrolled modal bottoms) and verify its workflow.
- Fix one shared correction-impact layout: audit every caller first, fix the common
  owner, then check both club and stadium states rather than patching one screenshot.
