# ADR 0007 - Final in-transaction authorization check for internal writes

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q30, option A; Context decision D030.

O07/O08/O12 leave in-flight authority changes unresolved. Under BM-01/BM-02, CN-02 and AT-02/AT-03 (PDF pp.23/26/32), internal writes must check permission on request receipt and recheck the current session, authority and validity period at a final decision point inside the transaction before successfully recording the change. A request authorized at entry must fail if authority or session validity is lost before that final point. For authority expiring at 12:00, a final check at 12:00:01 fails even if the request arrived at 11:59:59.

Failure rolls back that business transaction without partial business data, statistics or workflow-state changes. Concurrent revocation and writes require consistent ordering so stale checks cannot write past a revocation already in effect. Previously valid completed operations are retained. Entry-only authorization was considered; the Team Leader chose final current-authority validation, accepting additional coordination between authorization, transactions and concurrent access changes.

Exact enforcement/serialization point, transaction/isolation/locking mechanism, authoritative permission/time reads, error contracts, retries and pending work remain open. This is a behavioral decision, not a selection of isolation level or locking technology. See [Context v2 D030](../../context/english/design/README.md#d030---recheck-current-session-and-authority-at-the-final-decision-point-of-writes).
