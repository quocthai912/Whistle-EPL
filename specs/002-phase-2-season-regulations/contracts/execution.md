# PHASE 2 Execution and Module Contracts

**Status**: Design contract approved with the Plan on 2026-11-10 under D030/D079/D084/D089/D095/D096; no implementation code.
Application use cases own transactions. Collaborating modules accept the same context and
never independently commit a related business decision.

## Operation pipeline and locks

Business execution requires an explicit authority callback; it cannot inherit the
AdministrationExecution administrator default. Resolve the candidate session, apply existing
Origin/CSRF mutation checks and session-boundary resolution, enter maintenance admission,
discover the complete resource set and acquire static typed locks in D096 order:

1. Maintenance admission.
2. Only needed system/code-creation guards; no blanket global exclusive business lock.
3. Account/session/security state in deterministic key order.
4. All affected Seasons by ID.
5. Players only when a known dependency provider supplies actual affected players.
6. Clubs by ID.
7. Stadiums by ID.
8. Typed cases/versions/media rows in deterministic type/ID order.
9. Command receipt scope.

Add explicit allowlisted kinds for each regulation/change/lifecycle case/version and Club/
Stadium; preserve delegation lock kinds. Never accept a table/column name from a request.
If rereading dependencies discovers an uncovered earlier resource, raise the existing
LockSetChanged and restart the full transaction, at most three total known-rollback attempts.
No business, permission or stale-revision error is automatically retried.

After waiting, use trusted current time and live session/authority. Check replay, then
exact version/revision/state, due regulations, protected facts and action-specific gates.
Recheck authority/time/state immediately before related writes and required audit. Caller
rollback preserves all business pointers/children/history. File side effects are handled as
immutable staged content with recoverable orphan cleanup, not pretend SQL rollback.

Season creation has no row to lock: lock account/security and an allowlisted code-creation
guard when needed, then receipt; SQL UNIQUE(code) is the final protection against a different
actor concurrently creating the same code. Do not invent a pre-existing season revision.

## Command receipts

Extend the existing action registry with SEASON_CREATED, REGULATION_APPROVED,
REGULATION_CHANGE_APPROVED and SEASON_LIFECYCLE_APPROVED. Actions may be more specific in
implementation only if all existing canonical intent semantics remain explicit and tested.
There is no unrestricted action string or arbitrary recursive payload.

| Action | Server-bound target | Canonical intent | Bounded outcome |
|---|---|---|---|
| SEASON_CREATED | Fixed creation scope SeasonCollection, not a caller-generated entity ID | Normalized code/name/competitionName/dates; no expectedRevision | New UUID v4 id/revision generated once inside the receipt transaction |
| REGULATION_APPROVED | Exact version ID | expectedRevision, submittedVersionId, effectivity mode/instant and immutable content/basis reference | id/revision, optional relatedId |
| REGULATION_CHANGE_APPROVED | Exact request ID | expectedRevision, submittedVersionId, action, waitingVersionId, replacementVersionId?, reason | id/revision, optional relatedId |
| SEASON_LIFECYCLE_APPROVED | Exact request ID | expectedRevision, submittedVersionId, action, reason and submitted readiness basis reference | id/revision, optional relatedId |

Digest canonicalization covers action, target scope and the entire allowlisted normalized
intent. Exact submitted content is immutable; references bind its content version/revision,
not merely a latest pointer. Actor/action/key uniqueness and 24-hour retention stay unchanged.
Current scope is checked before replay; revision/current-state gates are evaluated only for
a new execution. Unknown commit outcome requires same-key receipt resolution before retry,
not a newly generated command. A creation replay must not require a seasonal role the
creator was never granted. Never store credentials or uploaded bytes in receipt payloads.

## Typed dependency ports

Each port accepts caller TransactionContext plus season/resource IDs and exact candidate
version, supplies its required lock set before mutation and returns an explicit basis. No
independent transaction, remote HTTP, duplicated sporting fact table or generic workflow engine.

| Port | Owner and required facts | Absence/failure behavior |
|---|---|---|
| RegistrationCompatibilityFacts | Registry & Registration: approved/current/future interval compositions and classifications affected by proposed limits/eligibility | Verified source not introduced means no protected records; unknown/partial/unavailable source blocks dependent approval/activation. No invented quota algorithm or waiver. |
| ScheduleFreezeFacts | Scheduling: first initial approval and frozen structure/duration/buffers | Verified no source yet permits pre-milestone regulation changes; known milestones are irreversible under current scope. |
| OfficialResultFreezeFacts | Match Results/Statistics: first official result and frozen points/priority/Q/R | Same verified-absence rule; result corrections/reopen do not unlock. |
| ReferencedCatalogUsage | Results: every referenced type including draft reports and historical exact versions | Protect code/meaning even if currently disabled; unknown source never means unused. |
| MasterImpactReader | Existing registration/scheduling/result/read sources for changed master | Return permitted affected record references, never silently rewrite them. |
| PublicMediaScope | Public Queries/registration basis: current D032 public eligibility | Missing/unavailable means not public; current authenticated profile-read path remains separately checked. |
| SeasonClosingReadiness | Existing summary source plus registration/scheduling/result/request owners | Require current confirmed summary, no review flag, valid current basis, no other unresolved requests/waiting effects, ended intervals and no unresolved future plans. Never return ready on absent summary/provider error. |

Status union: KNOWN with actual source revision/facts; VERIFIED_NOT_INTRODUCED only when the
source relations are absent and owning runtime writers/routes are not installed; UNAVAILABLE
with safe internal cause otherwise. Startup catalog assertions plus static module registration
validate the absence claim. Once any owning source is introduced, its missing/partial adapter
must fail closed. There is no user-editable flag to assert empty business data.

Schema-only summary targets are present, so summary reading is KNOWN but normally empty;
this blocks production closure. A reporting readiness provider must also verify current
source basis before a real operational closure can succeed. No fake current summary is created.

Fixture-only adapters require existing isolated-target guards, real typed persistence for
core referenced IDs and explicit test composition. Simulated later-port facts are labelled
guard simulations. They can prove PHASE 2 guard behavior, not that later registration,
results or summary confirmation worked. No production module imports a test adapter.

## Due regulation processing

Startup, every-minute job and trusted operator invocation share the same owning service.
Candidate discovery is non-authoritative; each candidate enters admitted execution, locks its
season/full dependent resource set and rereads state/time. Already processed/cancelled rows
are no-ops, not duplicate activation events. Scheduled approved time remains the basis of
activeFrom; processing instant is recorded separately.

Known business conflict produces terminal ACTIVATION_BLOCKED, reason/audit and slot release
in one transaction. Technical/provider unavailability rolls back; diagnostic run outcome is
recorded outside the rolled-back business unit without fabricating a successful transition.
Later scheduled recovery is separate from bounded request retries. Logs must redact secrets
and obey existing 30-day diagnostic retention.

Mutation callers holding the season lock invoke the resolver in the same transaction before
depending on current rules. If the later mutation fails, its activation changes roll back too;
timer/request recovery can process them again without claiming a prior successful activation.
Read orchestration follows [REST read-only basis checks](rest.md#read-time-effective-basis-checks)
without invoking due-work processing or recording activation/ACTIVATION_BLOCKED. An unavailable
correct basis returns 503, never old-current data as if fresh.

## Exact approval bases

CLOSE submission binds a real current confirmed summaryVersionId and derives its readiness
basis from that immutable version's basisStatisticsRevision/sourceSnapshot. Do not copy a
second authoritative summary or use an unvalidated UUID. Approval rechecks that exact pointer,
current source revision/review status and every closing prerequisite; a changed basis returns
BASIS_CHANGED for successor/resubmission, never a silent replacement of submitted content.

REPLACE approves both the request and replacement regulation. Validate the union of both
preparer/editor sets; an approver who edited only the replacement must still be rejected.
The replacement is exact same-season SUBMITTED content, not an editable current draft.

## Scoped history

Audit append remains required in the owning transaction. Extend action/object allowlists for
Season, RegulationVersion/ChangeRequest, SeasonLifecycleRequest, Club, Stadium and MediaAsset.
Bound scalar before/after fields, semantic version references, reason and effectivity; retain
full structured immutable content in typed version tables. Technical SYSTEM activation and
cleanup events use their approved execution context, not an invented account.

Object history reads use current source authority; UC04 general admin search remains metadata
only unless the viewer also has current object-read access. Updating history projections must
not widen payload access, drop PHASE 1 fields, expose file locations or add history deletion.

## D099 and Closed metadata final checks

New-use writers and master discontinuation share the owning Club/Stadium lock; later new-use
writers must acquire that same lock before committing a reference. Existing approved work
keeps references and owning UC gates; availability alone does not cancel its sporting state.
Resumption clears the marker and records a new audit transition without restoring old outcomes.

Season metadata edits acquire the season lock and require OPEN at final write; independent
reopening must already be committed. Closure, regulation decisions and new seasonal business
use the same season synchronization so an earlier screen state cannot bypass Closed gates.
