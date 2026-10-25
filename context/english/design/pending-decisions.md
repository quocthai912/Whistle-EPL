# Context v2 pending decision queue

This queue records deferred v2 work, separate from the [16 v1 open decisions](../open-decisions.md) and [confirmed v2 decisions](README.md#confirmed-decisions). A queued improvement is not an approved technical design, completed requirement or implementation commitment. English and [Vietnamese](../../vietnamese/design/pending-decisions.md) are equivalent views.

## V2-EXT-01 - Live Match Tracking / Live Score

- **Status:** PENDING_INTERVIEW. Requested by the Team Leader on 2026-10-25 (Asia/Bangkok), after Q36.
- **Intent:** Add Live Match Tracking / Live Score as a Context v2 improvement. Record the intent now; do not interview this group yet or decide its design.
- **Explicit user constraints:** Live scores obtained from an EPL API are reference data only. They do not replace Official Results and must not automatically update official standings or other official statistics. The existing official-result authority and confirmation/correction boundary remains distinct.
- **Scheduling instruction:** Continue the existing grill-with-docs foundation interview in its dependency order. Proactively introduce this group after the foundation decision groups are complete and before the v2 summary and proposal for whole-package approval. This is a required interview reminder, not a selection of implementation details.
- **Source relationship:** This is a new Team Leader-requested v2 improvement, related to the optional external integration branch under TT-05. It is not a requirement already present in Chapters 1-2 or a retroactive change to v1. No new Oxx, UC or project Phase is assigned at this point.
- **Unsettled design:** Provider/API identity and contracts, scope, internal-match mapping, freshness/update behavior, failures, UI/publication, security, persistence and operational/acceptance details all remain open. “EPL API” identifies the requested source category; it does not select a provider. No technology, deployment or refresh mechanism is selected.
- **Document boundary:** Do not edit approved Context v1 or the Chapter 1-2 report for this improvement. Keep the new queue and later design in the bilingual v2 supplement; create ADRs only when appropriate design decisions are actually confirmed.
- **Resume checkpoint:** Q36 has been confirmed; Q37 has not been asked. Do not switch to Live Score at Q37. Return to this queue before the package is summarized for approval.
