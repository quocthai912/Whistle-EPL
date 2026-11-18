# PHASE 2 review corrections — 2026-11-18

Source: `1b2e09b` plus the current uncommitted corrections. This is a follow-up
to the published T025–T030 evidence; the original source manifest remains tied
to `d3023cc` and is not rewritten to imply these corrections were published.

## Supplied PR findings

All 21 supplied findings were verified against the current code and addressed.

| Area | Corrected behavior | Validation |
|---|---|---|
| `close-issues` | Compare the live remote tree and freshly read criteria with verified snapshots; recheck before completion/closure and detect final publication conflicts. Reconcile changed criteria, comments and stale labels; preserve Issue notes through supported conditional writes or a coordinated edit window. | Skill validator and repository-reference checks; no live Issue mutations were needed for this correction. |
| Lookup seed | Exclusive output reservation before the transaction; normalized/decoded endpoint comparison with explicit ports and no connection-query overrides. Clean up only owned incomplete output, including close/write failures, and retain a complete file only after file/database shutdown succeeds. | Real CLI/PostgreSQL probes: existing output unchanged and no seed; three equivalent URLs refused; ambiguous PGPORT/override settings refused; transaction rollback; post-commit output/close failures; successful twenty-user/twenty-five-Club seed. |
| Recovery seed | Carry the actual previous discontinuation instant into each audit event. Persist exact lifecycle request/version identities and a protected synthetic credential for the login check. Explain fresh disposable-target/output requirements after failure. | Actual Linux backup/restore drill. |
| Security | PostgreSQL-derived expired-session clock; separate percent and underscore decoys; rejected identity PATCH preserves the stored name/revision. Guard refuses encoded operational database aliases and ambiguous connection overrides. | Full PostgreSQL suite: 25 suites / 168 cases; final focused security/isolation checks: 25/25. Pinned pg parsing independently confirms decoded names and query host/port precedence without opening a connection. |
| Recovery drill | Fail on root-inspection errors; require fresh scheduler state before changes and before daily invocation; inspect restored name at the interruption checkpoint; verify every Club/asset and lifecycle identity against the original manifest; prove actual login plus authenticated session after release. | Final Linux drill passed with twenty logos, two seasons, sixty Club audit events, two lifecycle drafts, interruption/resumption, seven retained sets and daily scheduling. Built-in Node HTTP/fetch needs production dependencies only. Backup/scheduler regression: 12/12. |
| Browser | Assert exactly five records on page two; explain the isolated application and runner's distinct environment roles. | All six affected Chrome/Edge viewport cases passed. |
| Load | Match ordered twenty-ID/five-ID page slices; retain total/uniqueness checks; malformed measured responses fail metrics and login/unexpected errors abort explicitly. All three latency groups measure wall time around the request(s). | Full twenty-VU, one-minute warm-up/ten-minute measurement: 31,618 measured iterations, all groups 100% valid within two seconds. Three separate fault probes fail with exits 99/99/108 for missing items, wrong order and authentication. |
| Guide | Reflect implemented PHASE 2 drills and existing acceptance; retain separate PHASE 3 authorization. Document protected diagnostics, preserved operational URL, separate application/runner terminals and explicit reset/retry steps. | Link checks and inspection against package commands, Playwright setup and operator target binding. |

The fresh-login probe uses the real application on an ephemeral loopback HTTP
listener. The CSRF cookie/token is sent to login; login sets the session cookie;
GET `/api/v1/auth/session` requires that session cookie and returns a flat account
projection. Actual 200 responses, `changeRequired=false` and the restored account
ID were checked. Browser HTTPS verification remains separate.

## CodeRabbit CLI local review

CLI version 0.8.0; command `coderabbit review --agent --uncommitted --base-commit 1b2e09b`.
An initial WebSocket setup failure was retried successfully. Three completed
reviews emitted 16, 11 and 7 records respectively; these counts are reported as
returned, rather than claiming an empty automated review.

- First completed review: fourteen valid refinements addressed. Two verification
  prompts retained the specified behavior: warm-up is conditioning and contributes
  no accepted measurement samples; the requested elapsed-time latency includes
  connection setup rather than reverting to `Response.timings.duration`.
- Second completed review: nine refinements addressed. Two prompts required no
  change: the acceptance report already records explicit Team Leader approval
  with open operational/later-Phase gates; Club code is unique, while shared
  abbreviation is allowed, and both distinct-name decoys actually return 201.
- Third completed review: four remaining workflow clarifications addressed
  (late reconciliation, stale labels from this run, conditional/coordinated
  Issue-body edits and criterion rechecks after drift). Three verification prompts
  required no code change: actual auth response/cookie contracts passed; the drill
  exports its readable fixture and uses an already-built backend; `common.sh`
  calls `verify-target.cjs isolated`, which rejects URL overrides and compares
  actual Node/libpq server/database identities before fixture or session writes.

No supplied or local-review finding remains unresolved after this disposition.
Raw CLI output and injected-failure artifacts stay in ignored `.verification/`.

## Final checks and scope

Backend build, root lint/typecheck/format checks, E2E TypeScript and skill validation
passed. The full database regression includes inherited PHASE 1 suites; the
latest focused guard check also passed after aligning its override URL with the
pinned driver's actual resolution. No application feature, sporting rule,
dependency pin, required CI gate or Phase acceptance was changed by these fixes.

## Tested correction sources

SHA-256 hashes normalize CRLF to LF and pin the changed sources for this local
verification. The published baseline manifest is preserved separately.

| Source | SHA-256 |
|---|---|
| `.agents/skills/close-issues/SKILL.md` | `bbc13146e88703b5841255a407ecf761f5c28b15ccf34edf3521800ca9712395` |
| `backend/scripts/prepare-phase2-lookup.cjs` | `ac84ec229363d667efe02acb43544dd9ad54dbdda21cb9f3a3cb97d554565d56` |
| `backend/scripts/prepare-phase2-recovery.cjs` | `150357c5b0cb43eb5759ad174488fd47b70584f91efa2427929d91fa15ee4b92` |
| `backend/tests/fixtures/isolated-target.guard.ts` | `c00ac5e12a61f66b6e5af779b80eed7e52495218421e268f678014c79e5a886a` |
| `backend/tests/integration/fixture-isolation.spec.ts` | `b13d8b090a9f56e75d458fbc3d11f0b3e1941e711c32fecbdb34e0ffb94bc71a` |
| `backend/tests/integration/phase-2-security.spec.ts` | `7f8e8d399c7a3e506e626d983bd97d737553fca94877da86d0092ad68730c164` |
| `ops/backup/tests/phase-2-recovery.sh` | `d8a3d2ddf831bc9957d52f46d5aca34b8f3c9319f2711841695e189b5ed134a8` |
| `tests/e2e/phase-2-masters.spec.ts` | `01367a8a3890328bd1c0de1efdf8867a7ddedf727ba219534d02e8f286db7b6e` |
| `tests/performance/phase-2-club-lookup.js` | `7a4ebaf111b3eaf992ddcb78a0abba87e60c2de99994fbd64be5468da9ed9d6c` |
