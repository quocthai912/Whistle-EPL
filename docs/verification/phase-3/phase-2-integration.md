# PHASE 3 T024 — PHASE 2 integration

Candidate: base `ff25957ecad03fbbd064f30ea5edee0585569fa2` plus the working changes recorded in this delivery. Execution: 2026-11-25 (Asia/Bangkok), Windows, Node 24.14.0, pnpm 10.33.2, real PostgreSQL 17.11 in `whistle-phase3-pg17`, isolated `whistle_test_integration`. No operational/demo database is used.

The approved T001 baseline remains `d3023cccfba28cd7c0b2e6946ab9f1b051ee6c59`; the current source includes the published T001–T023 implementation. See [dependency reconciliation](dependency-baseline.md). Test-only accounts, catalog values and initial seasons are guarded D090 fixtures. Official rules, Players, BM1 approvals, registration confirmations, corrections and transfers in the new workflow driver use their real HTTP owners.

Command: `pnpm --filter @whistle-epl/backend run test:integration -- tests/integration/phase-3-phase-2-contracts.spec.ts` with the explicitly selected isolated test environment. Result: **12/12 passed** at the initial T024 checkpoint; final regression results are recorded in [security and regression](security-and-regression.md).

| Obligation | Executed evidence |
| --- | --- |
| Shared locks / caller transaction | Live T004 providers discover their own lock set and read within `DatabaseService.write`; no replacement provider or later sporting facts are supplied. |
| Missing basis | Red test observed `KNOWN` for missing/wrong-season candidate rules. The provider now refuses that basis; both cases return `UNAVAILABLE` through the actual PHASE 2 port. |
| Scoped impact / public media | Real Player/BM1/registration references appear only in their season. Public eligibility contribution identifies the official version; absent later public owner keeps composite scope unavailable and anonymous bytes concealed. |
| D074 inputs | Actual confirmed interval ends before/equal/after the closing instant and unspecified ends remain exact. Future plans and received work contribute blockers; cancellation removes their live effects. No summary/result evidence is fabricated: the real lifecycle remains `SUMMARY_REQUIRED`. |
| Compatibility / due activation | Current and future compositions block incompatible reduced quotas. Failed confirmation rolls due activation and its pointer back; a successful dependent receipt then commits activation. Independent connection verifies committed state. |
| Story outputs | D100 changes the official BM1 basis; D057 supplies a corrected registration; a real paired transfer preserves prior immutable versions. Pending corrections appear in closing inputs. |
| D099 | An external club lock queues discontinuation before confirmation. Both waiters are observed in PostgreSQL; after release, discontinuation commits and the new confirmation fails. Existing commitments remain; resumption leaves cancelled work cancelled and preserves the full rejected D100 successor and its decision history. |

This verifies registration contributions and accepted PHASE 2 behavior. Whole-season closure still requires the later summary/result owners. T027 scale/usability and T028 human acceptance are outside this delivery.
