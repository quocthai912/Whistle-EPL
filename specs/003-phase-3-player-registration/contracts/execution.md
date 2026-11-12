# PHASE 3 Execution and Dependency Contract

Use [D084/D096](../../../context/design/architecture.md#d096---api-execution-synchronized-csrf-and-transaction-contracts), the [registration matrix](../../../context/use-cases/registration.md#d096-execution-authority-and-transaction-matrix) and the [approved PHASE 2 execution contract](../../002-phase-2-season-regulations/contracts/execution.md). Verify the concrete interfaces against the accepted PHASE 2 revision at the Plan execution gate.

## Command boundary

1. Admit persistent work through maintenance coordination. Check origin, current session and synchronized CSRF where applicable. Bind the requested action, normalized fields, target scope and exact intent. Read current permissions and use server time.
2. Discover the full lock set before mutation. Follow D096 order: maintenance, applicable system guards, account/session/security, all affected seasons, players, clubs, stadiums, case/version and receipt. Sort IDs within each group. Club-season quota/shirt checks share Club/Season guards and cross-season overlap shares the Player guard. D099 new-use checks share the exact Club/Stadium lock with discontinuation. Do not acquire a newly discovered earlier lock out of order.
3. Recheck permission, effective time, revisions and referenced state after waits. Resolve authorized same-intent replay before new-execution business-state checks. Under season locks, resolve due regulations through their owner in the caller transaction for dependent writes. Recheck current authority and applicable facts at final recording. Reads and UC11 prechecks use the read-only rule basis and never activate rules or reserve capacity. An unknown correct basis yields the shared temporary-unavailable response.
4. Commit business changes, official pointers, review references, audit and any command outcome together. A failed later write rolls back a due activation attempted in the same unit. Unknown commit status requires same-key resolution before re-execution. At most three total attempts for known rolled-back transient failures or lock-set restart. No automatic retries for authority, revision or rule failures.

| Command family | Bound intent and receipt policy |
| --- | --- |
| Draft/edit and noncritical actions | Expected revision and operation-specific fields. Version/state transitions use exact submitted/received IDs where applicable. |
| UC08 decision, D053 exception approval and D100 approval | Actor/action/key and target case/version. Include exact submitted version, expected revision and canonical decision inputs. D053 binds the exact received target. D100 binds the exact approved baseline and the submitted successor. |
| UC10 validity, transfer and plan disposition | Exact reviewed version, current affected versions/revisions, normalized decision inputs, effective instant/mode and exact paired operation when applicable. A transfer cannot leave one side recorded. |
| D057 decision | Exact proposal, currently official baseline, proposed successor and expected revision. Require independent authority for approval, return for supplementation or rejection. Only approval can change the official pointer. Return and rejection record the decision and preserve the official pointer and submitted history. Reassess the required affected facts at final approval. If an approved historical version or submitted basis changed, require review rather than replacing the submitted basis silently. |

For D057, approval uses the critical-command receipt. Return and rejection bind the exact submitted version and record their own outcome under the normal revision and audit rules. Receipt behavior uses D084's 24-hour retention and current access checks. Return only bounded authorized acknowledgements. Enforce immutable submitted editor history and independent approval, including former editors. Audit searchable permitted before/after values, operator, reason and decision/effectivity instants where applicable. Scope business history using current object-read rights.

## Eligibility and historical correction

Use the intake calendar version effective at successful server receipt and the effective decision-time rule version for pending eligibility. Resolve due rule state from PHASE 2. For D056 transfers check authority over both sides. End the source interval under applicable termination rules and apply full intake/eligibility confirmation gates to the destination. Validate all affected intervals, record reason/history and commit both sides together. An approved registration can end under its owning checks even if its club has discontinued. Apply D054 with explicit findings and independent U21/homegrown attributes. Evaluate each affected roster composition boundary, including future registrations, with same-club shirt and competition-wide player checks. Prechecks return scoped reasons. Invalid or insufficient findings block the dependent decision, except where the approved criterion explicitly permits another treatment.

FR-020 uses effective version intervals from the accepted rule history (activeFrom/activeUntil), independent of the time the activation job processed the change. Intersect affected historical periods with version and composition boundaries. Retain the exact segment findings and bases. A failing segment requires explicit D057 disposition. Preserve original receipt/confirmation evidence and flag affected match references for their owning review. Missing required historical basis blocks approval.

## PHASE 2 integration

| Contract | PHASE 3 use or contribution |
| --- | --- |
| Season state and due rules | Consume same-season lifecycle, effective initial rules, applicable time-resolved calendars, rule history and actual due processing. Current state/rules must be known for dependent work. No synthesized default. |
| Club/Stadium availability | Consume approved master identity and availability for new use. Validate again under the same lock as discontinuation. Existing authorized historical references and approved commitments retain their owning checks. |
| RegistrationCompatibilityFacts | Supply actual current/future validated compositions and classifications with exact version references under the caller transaction. PHASE 2 owns compatibility decisions and known business activation-blocked outcomes. |
| SeasonClosingReadiness | Supply pending registration/application work, unresolved future plans and exact playing interval ends. At the closing instant an end at or before that instant satisfies the interval boundary, while a later or unspecified end blocks readiness. PHASE 2 owns closure and other readiness sources. |
| MasterImpactReader | Supply scoped registration/application references for affected records. Master edits cannot silently revise official versions. |
| PublicMediaScope | Supply registration basis for approved public eligibility. Unavailable or insufficient public basis denies public access. Authorized internal reads are separately checked. |

Preserve the PHASE 2 status union and required lock discovery. VERIFIED_NOT_INTRODUCED is available only while the owner source and writers are verified absent. After introduction, unknown or partial providers cannot be treated as empty. Use the same caller-owned transaction and owning services. Isolated fixtures may exercise gate behavior without becoming an operational provider.
