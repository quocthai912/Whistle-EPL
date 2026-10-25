# ADR 0007 - Final in-transaction authorization check for internal writes

This ADR records decisions and rationale; authoritative current rules are owned by [D030](../../context/english/design/architecture.md#d030---recheck-current-session-and-authority-at-the-final-decision-point-of-writes). Historical open-point notes do not reopen subsequently confirmed policy.

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q30, option A; Context decision [D030](../../context/english/design/architecture.md#d030---recheck-current-session-and-authority-at-the-final-decision-point-of-writes).

O07/O08/O12 leave in-flight authority changes unresolved. Under BM-01/BM-02, CN-02 and AT-02/AT-03 (PDF pp.23/26/32), internal writes must check permission on request receipt and recheck the current session, authority and validity period at a final decision point inside the transaction before successfully recording the change. A request authorized at entry must fail if authority or session validity is lost before that final point. For authority expiring at 12:00, a final check at 12:00:01 fails even if the request arrived at 11:59:59.

Failure rolls back that business transaction without partial business data, statistics or workflow-state changes. Concurrent revocation and writes require consistent ordering so stale checks cannot write past a revocation already in effect. Previously valid completed operations are retained. Entry-only authorization was considered; the Team Leader chose final current-authority validation, accepting additional coordination between authorization, transactions and concurrent access changes.

Exact enforcement/serialization point, transaction/isolation/locking mechanism, authoritative permission/time reads, error contracts, retries and pending work remain open. This is a behavioral decision, not a selection of isolation level or locking technology. See [Context v2 D030](../../context/english/design/architecture.md#d030---recheck-current-session-and-authority-at-the-final-decision-point-of-writes).

### D030 english evidence

Current policy owner: [D030](../../context/english/design/architecture.md#d030---recheck-current-session-and-authority-at-the-final-decision-point-of-writes). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** The Team Leader explicitly confirmed Q30 option A: “Tôi xác nhận phương án A.” (“I confirm option A.”).

- **Source:** O07/O08/O12; BM-01/BM-02 and CN-02, PDF pp.23/26; AT-02/AT-03, p.32; [D007](../../context/english/use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking)/[D020](../../context/english/design/access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost)-[D023](../../context/english/design/access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end).

- **Alternatives/basis:** Final in-transaction revalidation versus permission only at request entry. The Team Leader chose current authority at the final decision point, accepting coordination between authorization, transactions and concurrent permission changes.

- **Record:** [ADR 0007](0007-final-authorization-check-for-writes.md).

- **Affected Phases:** PHASE 1 shared session/authorization foundation, PHASE 2-PHASE 9 internal writes and PHASE 10 failure/concurrency verification. No Phase status changes.

- **Still open:** Exact enforcement/serialization point, transaction/isolation/locking mechanism, authoritative time/permission reads, error contracts, retries and pending-work behavior. [D030](../../context/english/design/architecture.md#d030---recheck-current-session-and-authority-at-the-final-decision-point-of-writes) selects the behavioral policy, not database isolation, lock types or other implementation technology.
