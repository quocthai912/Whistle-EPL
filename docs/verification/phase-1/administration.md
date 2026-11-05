# PHASE 1 administration verification

**Execution date** 2026-11-05 (Asia/Bangkok)  
**Scope** US3, T029–T037  
**Source** Local working tree based on `8f6715384bd4bb3989844c1b7f3e4eef52324815`. The 45 changed application, migration, test and browser configuration files had manifest SHA-256 `57d7e2d87f12a527217ffd9c6f0de65972e1e14a2ec7af0298e20a43b0559d82`. Each manifest line contains the lowercase SHA-256 of the UTF-8 file with LF line endings, two spaces and its repository-relative path. The lines follow sorted paths and end in LF.

## Environment and execution

Windows x64, Node 24.14.0, pnpm 10.33.2 and PostgreSQL 17.11. PostgreSQL listened on loopback. Integration and browser execution used separate disposable databases. HTTP integration tests used synthetic identities, two real Season references, controlled clocks where timing mattered and independent connections for committed-state observations. Browser execution served the production frontend and real Nest routes on trusted localhost HTTPS.

| Check | Observed result |
| --- | --- |
| Prisma migration deployment and physical schema | All seven migrations applied on a fresh browser database. The PostgreSQL suite replayed committed migrations and checked schema drift. |
| Backend unit and frontend tests | 15 backend and 18 frontend passed. Backend HTTP unit tests used loopback access. |
| PostgreSQL HTTP and regression suites | 80 passed across 14 suites. The test injected audit failures, controlled account locks and dropped a committed HTTP response before acknowledgement. |
| Google Chrome 156.0.8078.81 and Microsoft Edge 156.0.4314.58 | 28 passed over trusted HTTPS, including three administration cases and eleven authentication cases per browser. |
| Quality | Lint, formatting, backend/frontend/E2E type checks, workspace build, Prisma client construction and `git diff --check` passed. |

## Task evidence

| Task | Observed coverage |
| --- | --- |
| T029 | Account identity normalization, duplicate personnel code and separate equal-name accounts. Two administrators attempted mutual lock. Independent observations verified the surviving administrator and shared-right prerequisite behavior across two seasons. The initial permission test failed with 404 before the grant routes existed. |
| T030 | Creation, profile editing, lock/unlock, temporary credential restrictions, exact body allowlists, safe account lists and stale revision recovery exercised over HTTP or the browser. |
| T031 | Separate seasonal assignments and shared permissions, Create Season self-grant denial and loss of the last shared-right prerequisite. |
| T032 | All twelve D019 operation/role combinations, three-person separation with dual-role actors, submitted-version matching, overlap and adjacency, and controlled boundary timing. |
| T033 | Draft, submit, return and successor version through HTTP. Browser grant and revoke preserved the proposal's Granted outcome. |
| T034 | Both boundaries processed after downtime in chronological order. Existing sessions ended at immediate activation and fresh logins survived catch-up. A scheduled grant terminated after the proposer was locked and did not revive after unlock. |
| T035 | Protected Vietnamese account and delegation pages built from MH08 and MH09, using local Whistle-EPL artwork. Frontend and browser tests verified direct navigation, confirmation cancellation, explicit stale-edit review and both management workflows. Desktop screenshots were captured and inspected. The accounts page passed a 390 px viewport overflow check. |
| T036 | Required audit failure rolled back account state, session revocation and receipt. Authority was rechecked after an observed database lock wait. Matching replay recovered a committed result after transport loss, changed intent conflicted, and competing overlap grants produced one grant. |
| T037 | Both browsers completed real account creation and seasonal assignment, cancellation and stale-edit review, unauthorized navigation, and direct-manager submission followed by independent administrator grant and revocation. |

Independent Standards and Spec reviews identified guard scope, immediate invalidation, draft recipient scope, receipt normalization, normalized field limits, audit effective time and conflict basis issues. The fixes were applied and checked in the final runs. Scoped convergence found no remaining implementation task for T029–T037.

The execution records local US3 evidence. Integration-branch publication, CI, US4 audit lookup, load testing, clean-host acceptance and PHASE 1 acceptance are tracked separately.
