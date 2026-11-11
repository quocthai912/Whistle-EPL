# PHASE 3 Data Model

Use the [D095 registry dictionary](../../context/design/architecture.md#registry-and-registration-dictionary), approved typed version envelopes and same-case/exact-version constraints. The following maps them to PHASE 3 behavior. UUID identity, stable non-reusable codes, date-only birth date and UTC instants retain D024/D058/D082/D092.

| Record | Relationships and invariant |
| --- | --- |
| Player | Stable code, normalized name, birth date, approved nationality and position, revision and optional current portrait owned by this Player. Matching normalized name/date/nationality is a review signal. Keep club and shirt on seasonal versions. No Player lifecycle transition is in scope. |
| ClubApplication | Unique season and club. Accepted pointer belongs to the case. Club, season and home ground are typed references to existing owners. |
| ClubApplicationVersion / ProposedPlayerItem | Preserve predecessor, state, exact receipt and approval rule references, BM1 fields and ordered historical meaning of proposed membership. Submitted content is immutable. A version cannot repeat a Player in the proposed list. Accepted snapshot retains D059 fields. |
| D100 correction successor | Same case/version family with explicit approved baseline distinct from predecessor, bounded descriptive changes, evidence, reason and affected references. Carry the original receipt basis and separately record correction decision time. Keep editor membership and current-pointer check. |
| PlayerRegistration / RegistrationVersion | Multiple cases for distinct intervals are permitted for a player/club/season. Exact current validated pointer governs playing state. Version contains shirt, [start, end), U21/homegrown findings and verification evidence, receipt and decision rule refs, disposition and D059 snapshot. Prior versions remain addressable. |
| TransferOperation | Same player and competition. Bind old-before, old-after and new version with common instant and predecessor operation when changed. Changes/cancellation recheck both plans. Record a cancelled future playing disposition and restore the old prior end only if compatible. |
| ReceiptExceptionCase / Version | Exactly one immutable received target in the same season, with independent decision, reason and basis. Waiver applies solely to that target's receipt timing. |
| RegistrationCorrectionCase / Version | Bind exact current validated target and proposed successor, reason, evidence, before/after, affected references and required disposition. For FR-020 retain the affected half-open segments, exact effective rule references, findings and applicable disposition as decision evidence. Use typed exact-version references under D095. |
| MediaAsset / audit / command receipt | Use owned existing contracts. Media metadata and current reference are separate from content bytes. Audit uses safe action-specific fields. Command receipts bind exact canonical intent without private evidence or uploaded bytes in replay responses. |

## Lifecycles and validation

- Club: Draft → Received → Pending approval → Approved or Rejected. Return for supplementation and pre-approval cancellation retain prior versions. D100 is an independently decided successor of an approved version.
- Player registration: Draft → Received → Valid, with supplementation and pre-validity cancellation. Validated playing effectivity is separate from workflow status. Ordinary termination/transfer and prospective plan changes remain distinct from D057 error corrections. An independent manager may approve, return for supplementation or reject a submitted correction. Only approval changes the validated pointer. Return or rejection retains the submitted version and decision history.
- Receipt, approval and correction evidence point to exact versions. Enforce same-season/case integrity at references and recheck cross-record quota, shirt and player-overlap rules under shared locks. Reject destructive changes that break historical references.
- For FR-020 assess only affected portions. Partition at approved regulation effectivity and relevant playing composition boundaries, using half-open semantics. A failing segment requires an explicit D057 disposition. Preserve the original decision and exact references used by match records.
