# PHASE 2 documentation audit and PHASE 3 reconciliation

**Baseline:** Clean `docs/phase-3-architecture-and-specification` at `69617826653c194fe25d30e1d9d314980e7e87ab`, matching its remote. Local and remote `development` were `3e9c615fff04c10af8a1d22bff82e0a89729d0be`, the merge base. The working branch was four commits ahead and zero behind. Retain this branch to preserve the full PHASE 3 package and unrelated committed UI work.

**Status:** Post-approval amendment published at [4f2c893](https://github.com/quocthai912/Whistle-EPL/commit/4f2c89373ec3d33af7d44c75cfae207a07969e63). Original approvals and pinned Issue source revisions remain historical evidence. PHASE 2 and PHASE 3 remain NOT_STARTED. The reconciliation below records documentation and tracker evidence only.

## Audit findings

| ID | Assessment and risk | Correction and governing source |
| --- | --- | --- |
| A | Confirmed wording conflict. FR-008 could be read as retaining the effective pointer even after immediate approval. FR-017, the existing data model and T012 already describe the proper transition. | Clarify FR-008 to preserve immutable content and historical interval while allowing the valid immediate transition. D042/D043. No change to T012 acceptance. |
| B | Confirmed test gap. T013 could allow a GET to trigger an automatic mutation, although the REST and execution contracts already prohibit it. A read just after a due instant could activate rules or create audit history. | Separate GET from due-work writers in FR-022, Plan and T013. Verify committed state before and after a due GET and a separately admitted writer. D089 and the approved read-only REST contract. |
| C | Confirmed boundary gap. An active interval with a finite end later than closing could be mistaken for a completed interval. An approval waiting for locks could use superseded readiness. | State the exact final close instant in FR-036, contracts and T024. Verify before/equal/after, unspecified end, unresolved future plans, pending requests and readiness races. D074/D024/D096. |
| D | Partly resolved. T027 and the validation guide already specify 20 concurrent users, one-minute warm-up, ten-minute measurement and the 95%/2-second per-group threshold. Mixing API timings with browser evidence could still misstate results. | Make separate API/UI evidence and workload reporting explicit across SC-010, Plan, T027, verification and quickstart. D097. PHASE 6 retains public HQ-01 acceptance. |
| E | Confirmed pre-existing publication drift. Issue #85 pins the initial T014 text, which describes replacement as required. The current T014 already distinguishes standalone CANCEL from REPLACE. The former wording could block cancellation with no replacement. | Keep current T014 unchanged. Reconcile Issue #85 separately against D051 and the existing T014 text. |
| F | Confirmed ledger drift. The initial PHASE 2 publication note still describes sources as awaiting publication. All 30 Issue bodies now identify the published source revision. | Add current evidence in the Phase ledger. Preserve the initial milestone text and the published source pins. |

The review covered UC05 and UC06 lifecycle, rule preparation, decisions and effectivity; UC07 and UC12 master identity, duplicate review, correction and availability; logo authorization, recovery, and inherited security/transaction and verification controls. Current Context and relevant ADRs remain the policy owners. PDF page references rely on the approved Context transcription because the original PDF is outside this checkout.

## Phase 3 impact

| PHASE 2 change | PHASE 3 effect and classification | Local and remote disposition |
| --- | --- | --- |
| A / immediate transition | No requirement change. FR-013, FR-020 and execution already distinguish receipt/decision/historical effective bases. T001 needs the accepted upstream revision. | Plan points to this audit. Keep FR-020 and all PHASE 3 Issue criteria/pins. |
| B / read-only basis | Traceability only. Existing PHASE 3 execution contract already makes UC11 precheck read-only and rolls due processing into dependent writes under the caller transaction. | T001 can use the upstream T013 evidence. T024 retains integrated execution. No PHASE 3 Issue amendment. |
| C / closing boundary | Verification allocation only. FR-026, execution and T024 already distinguish before/equal/after and unspecified end. | Verification now distinguishes PHASE 2 isolated guard evidence from PHASE 3 real registration facts. T001 still requires accepted PHASE 2. No PHASE 3 Issue amendment. |
| D / D097 | No change. PHASE 3 SC-006/T027 already separate API/UI and specify the timing method in their own lookup scope. | Keep PHASE 3 thresholds, Task and Issue pins. No duplication of PHASE 6 acceptance. |
| E / T014 cancellation | No change. PHASE 3 consumes accepted exact effectivity history and does not own cancellation/replacement of regulation versions. | Reconcile only Issue #85. |
| F / publication record | At audit baseline, PHASE 3 was pinned to `428b4ed` with 51 body links and native dependencies pending. Subsequent authorized reconciliation verified all 51 native relationships. | The [PHASE 3 Task ledger](../003-phase-3-player-registration/tasks.md) records the result. Issue identities and original pins were preserved. |

Season Open/Closed restrictions, Club/Stadium availability and history, D052/D075 protected registration facts, D100 BM1 corrections, D056/D057 and FR-020, caller-owned locking/audit, and the logo-to-portrait recovery seam keep their approved semantics. A change in any accepted PHASE 2 interface remains subject to the PHASE 3 T001 comparison before execution.

## Proposed GitHub reconciliation

**Outcome:** The Team Leader authorized the four Issue updates after publication. Read-back confirmed #84, #85, #95 and #98 contain the criteria below and separate amendment links pinned to [4f2c893](https://github.com/quocthai912/Whistle-EPL/commit/4f2c89373ec3d33af7d44c75cfae207a07969e63). Original approval pins, canonical IDs, titles, states, labels and dependencies were preserved.

The approved reconciliation below preserves the original pinned approval links and hashes. A separately labelled amendment link identifies the verified amendment commit on each affected PHASE 2 Issue. PHASE 3 Issues #103–#130 retain their historical `428b4ed` pins.

- [#84 / T013](https://github.com/quocthai912/Whistle-EPL/issues/84): Replace “without treating GET as a caller-selected activation command” with “without invoking due processing from GET”. Append: GET may only recheck persisted state with bounded read-only retries and returns 503 if the current basis is unresolved. With the job paused at a due boundary, verify GET leaves version state, current pointer, activation audit/history and receipts unchanged. Process due work separately, then verify GET returns the correct basis without an additional business write.
- [#85 / T014](https://github.com/quocthai912/Whistle-EPL/issues/85): Replace the first criterion with “Exact same-season waiting target and required reason. CANCEL requires no replacement and an independent approver outside the request's preparers/editors. REPLACE requires an exact immutable same-season SUBMITTED replacement, an independent approver outside the union of request/replacement preparers/editors and a one-waiting-slot swap. Both actions require atomic receipt/audit.” Add “successful CANCEL without a replacement” to the existing test criterion.
- [#95 / T024](https://github.com/quocthai912/Whistle-EPL/issues/95): Append: At final close, a finite playing end before or equal to the trusted closing instant satisfies the interval check. A later or unspecified end or unresolved future plan blocks closure. Use typed isolated readiness facts for these cases and test facts changing after submission and while approval waits. A blocked close leaves the season and registrations unchanged and records no successful CLOSE audit or receipt.
- [#98 / T027](https://github.com/quocthai912/Whistle-EPL/issues/98): Append: Record the actual environment and endpoint/group mix, fixture/workload and sample counts. Keep per-group API timings separate from applicable browser/UI evidence and use neither as evidence of PHASE 6 public lookup acceptance.
