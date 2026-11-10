# PHASE 2 Verification Strategy

**Status**: Required future verification, not executed results. Normative thresholds remain
in [quality](../../context/quality.md) and [D097](../../context/quality.md#d097-test-season-and-measurement-baseline).
Apply D098 fast/deep separation and the Constitution's risk-based testing rule. Required tests
are developed alongside implementation unless a later approved Task explicitly requires test-first.
No extra coverage percentage or universal TDD is introduced.

## Requirement coverage and evidence groups

| Group | Spec requirements/outcomes | Required proof and owner |
|---|---|---|
| V01 Season shell/access | FR-001-FR-005; US1; SC-001/002/005/008 | Real create without prior role, no implicit access, independent staffing; invalid/duplicate/stale updates; Closed metadata denial through UI/direct request and closure race. PHASE 2. |
| V02 Full regulation decisions | FR-006-FR-016; US2; SC-001/003/004 | Incomplete drafts, exact immutable submission/successors, all-editor exclusion, complete scalar/child validation, catalog interpretation, freeze/compatibility cases with declared source facts. PHASE 2; later owners confirm actual consumption. |
| V03 Effectivity | FR-017-FR-023; US3; SC-003/004/009 | Immediate/future/exact deadline; one waiting/current; atomic cancel/replace; late approval; business blocked vs technical failure; startup/catch-up/request/job race and maintenance. PHASE 2. |
| V04 Masters/corrections | FR-024-FR-026; US4/US5; SC-001/002/005/009 | Required fields/code normalization, accent/case name warning and review, correction basis/impact projection, intact references/snapshots, cross-season reuse. PHASE 2; owning later correction flows remain later. |
| V05 D099 | FR-027-FR-029; US6; SC-002/006/009 | Same-identity discontinue/resume cycles, reasons/atomic audit, no revived outcomes, new-use race vs approved commitment. PHASE 2 tests guard ports; later owners test actual new commitments. |
| V06 Media/recovery | FR-030-FR-034; US4; SC-005/007/009 | Actual 20-club logos, byte/type/decode/animation/dimension boundaries, owner/read access/current reference/no-store, failed switch/storage, orphans/cleanup/backup races, same-set restoration. PHASE 2 available-data allocation. |
| V07 Lifecycle | FR-035-FR-038; US7; SC-008/009 | Typed persisted summary fixture, independent approval, exact readiness basis, pending/future/open intervals, concurrent prerequisite changes, no role/logout side effects, reopen preserves freezes/summary. PHASE 2; operational readiness still needs later sources. |
| V08 Shared security/atomicity | FR-039-FR-042; all stories; SC-002/003/005/009 | At least 10 unauthorized cases, CSRF/origin/session/revocation and scope; independent committed-state checks after induced failures; receipts/replay/unknown outcome; per-object audit payload redaction/history. PHASE 2 plus inherited regression. |
| V09 UX/lookup | FR-043-FR-045; all stories; SC-001/010/011 | Vietnamese valid-entry preservation/field errors, confirmation/cancel, Loading/Empty/Error, paging >20, actual Chrome/Edge, three viewports and measured club lookup. PHASE 2. |
| V10 Evidence/regression | FR-046-FR-048; SC-012 | Root checks on both required OS lanes, full existing PHASE 1 regression plus new suites; reproducible fixtures/clocks/races, reviewer report and open input/defect classification. PHASE 2 acceptance. |

All 48 FRs and 12 SCs are covered. A row is an allocation, not a completed test or replacement
for final Task mapping. A failed mandatory case prevents its acceptance group from passing.

## Concrete planned suites and execution registration

These paths are implementation targets, not existing files unless explicitly described as
an inherited seam. Tasks will allocate their creation after Plan review.

- backend/tests/unit/phase-2-validation.spec.ts: D092 values/lengths, scalar/child constraints,
  Unicode, dates, ranking/catalog allowlists and state transition rejection.
- backend/tests/unit/phase-2-ports.spec.ts: known/verified-absent/unavailable source semantics,
  no test adapter in operational composition, partial-schema/writer mismatch fails closed.
- backend/tests/unit/media-validation.spec.ts: real image buffers, metadata versus full decode,
  size/dimension/frame limits, normalized output and safe opaque paths.
- backend/tests/integration/phase-2-seasons.spec.ts: V01/V07, migrations and typed summary FK.
- backend/tests/integration/phase-2-regulations.spec.ts: V02/V03 with real PostgreSQL locks,
  exact version/pointers, waiting-slot constraints, controlled time and final authority.
- backend/tests/integration/phase-2-masters.spec.ts: V04/V05, concurrent code/review/availability,
  explicit historical preservation and new-use port synchronization.
- backend/tests/integration/phase-2-media.spec.ts: V06, actual protected files/reference/audit,
  authorized bytes, failed switch and cleanup/retained-set coordination.
- backend/tests/integration/phase-2-security.spec.ts: V08 receipt/action schemas, creation replay,
  per-object history and >=10 unauthorized cases. Keep transaction-foundation.spec.ts and
  existing account/grant/delegation/audit tests active, not only a new filtered suite.
- frontend/tests/phase-2-forms.spec.tsx and phase-2-http.spec.tsx: typed forms/normalization,
  multipart CSRF/session epochs/field details, conflict/session-loss/unknown outcomes.
- tests/e2e/phase-2-seasons.spec.ts, phase-2-regulations.spec.ts and phase-2-masters.spec.ts:
  actual UI/API/database/media journeys in existing Chrome/Edge projects. Extend
  playwright.config.ts testMatch and guarded global-setup rather than leaving tests undiscovered.
- tests/performance/phase-2-club-lookup.js: explicit isolated HTTPS target, synthetic accounts/
  declared cookies, 20 concurrent users, 1-minute warm-up plus 10 minutes measured. Measure
  >=95% club lookups <=2 seconds per group; record server 4-vCPU/8-GiB/SSD baseline or actual
  deviation. This measures the internal master list as SC-010's partial PHASE 2 benchmark;
  it does not establish HQ-01 public lookup acceptance in PHASE 6, which requires D097's
  20-club/380-match/at-least-600-player-profile baseline. Do not average fast groups into slow
  ones. Existing authentication.js remains.
- ops/backup/tests/test_set_format.py and test_schedule.py (existing): preserve foundation
  tests and add v2 nonempty media/incomplete/corrupt/traversal/wrong-scope/schema cases.
  Extend actual isolated available-data recovery drill and maintenance release verification.

Backend integration suites are discovered by existing Jest integration glob; unit files by
the current unit glob. Frontend test commands retain existing discovery. Current root source
format scope excludes Markdown; validate these design docs through links/IDs/diff checks,
not claims that source formatter passed them.

## Isolation, fixtures and trusted time

Extend backend/tests/fixtures with phase-2-fixtures.ts, phase-2-evidence.ts and media asset
manifest helpers, preserving isolated-target.guard.ts and explicit reset acknowledgement.
No fixture path is imported by production startup or exposed through HTTP. Use separate
localhost whistle_test_* targets, NODE_ENV=test, protected credentials and media/backup roots;
browser target remains separate from general integration target. Refuse a shared/operational
target, undeclared reset or mismatched storage root. Never log target secrets or password DOM.

D097 fixture values: EPL-TEST-2026, 2026-08-01..2027-05-31, 20 clubs, 25/17 limits,
cutoff 2005-01-01, homegrown 3 seasons OR 36 months and [15,21) age range, planned 120 minutes,
30/30 buffers, 3/1/0 points, Q=4/R=3 and the approved separate intake windows. Use the owner
table for exact window instants, not hand-copied operational defaults. A second declared
season tests isolation/shared masters. Never use today's date to invalidate historical test
windows: controlled time is injected only through existing isolated test composition.

Where core references exist, fixtures use real typed rows/FKs. Summary evidence uses the
actual schema-only targets; source snapshots are valid bounded fixture data. Other later-port
facts may be explicitly simulated to test guards, bound to real season/version identities;
label them as simulations and do not claim actual scheduling/registration/statistics happened.
Production unavailable providers must never bind these simulated implementations.

## Race and failure protocol

Use existing deterministic barriers/TestClock and a separate pg connection observing committed
state, not sleeps as proof. Cover:

1. Authority revocation/expiry while an operation waits; no stale session at final write.
2. Two code creations, approvals, replacements and effective-basis resolutions; correct winners,
   safe losers, no duplicate receipt/history and replay before stale checks.
3. Activation crossing cancellation deadline and a new freeze/protected plan basis. Failure
   remains business-blocked only for actual incompatibility; technical failure rolls back.
   Replacement approval must exclude the union of request/replacement editors, including an
   approver who edited only replacement content. A different latest draft cannot be approved.
4. Closing while readiness/metadata requests compete. Known source changes require re-review;
   a newly confirmed summary after CLOSE submission must cause BASIS_CHANGED without silently
   replacing summaryVersionId. Pending reopen never admits a metadata edit.
5. Master discontinuation versus new-use writer under the same resource lock. Existing approved
   work stays intact; resume never revives old rejected/cancelled work.
6. Failure after staged file storage, after reference SQL and during required audit; verify old
   logo or complete new state, then bounded orphan accounting/cleanup.
7. Cleanup versus backup/reference replacement, and interruption between database/media restore.
   Incomplete sets and partial recovery never release maintenance or count as successful backup.

## Fast, deep and final acceptance

Fast mandatory lanes retain lockfile install, generated-client/native checks, schema/migration,
lint/typecheck/source-format/build, relevant unit and real PostgreSQL integration suites on
required Ubuntu/Windows coverage under D098. New failures cannot be bypassed because prior
PHASE 1 passed. Deep tier exercises actual Chrome/Edge, lookup load and filesystem/operations
drills on the approved host; do not pretend hosted fast CI supplies that evidence.

Final report target: docs/verification/phase-2/acceptance.md plus per-group evidence as needed.
Record source revision, actual commands/versions/machine/profile, input asset provenance,
fixtures/reset/clock, per-case results, independent state comparisons, measured lookup
distributions, defects, deferred production inputs and reviewer. Evidence files are created
when execution occurs, not prefilled with invented passes by this Plan.

Full D090 600-player, 10-season/3,800-match, TD-01 5-users x 4-trials, XLSX >=100-record,
integrated reporting and complete BM-07 recovery remain with owning later Phases. PHASE 2
retains applicable current targets and its contribution; this allocation waives none of them.
