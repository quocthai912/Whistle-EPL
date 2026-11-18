# PHASE 2 final regression — T029

Date: 2026-11-18 (Asia/Bangkok). Reviewed source baseline:
`99c964f8b09b250af2e85582306fd8e5e4a7e5a5`, plus the T025–T030 working changes.
The work is not yet committed/pushed. Local Ubuntu execution does not claim a
GitHub-hosted CI result for an unpublished tree.

## Actual execution

| Entry point | Environment | Result |
|---|---|---|
| `pnpm install --frozen-lockfile` | Windows; Ubuntu 24.04 image build | Passed, unchanged lockfile |
| `pnpm verify:native`, `pnpm db:validate` | Windows and Ubuntu 24.04 | Passed |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | Windows and Ubuntu 24.04 | Passed; final file-only follow-up after test fixture formatting |
| `pnpm test:unit` / workspace unit commands | Windows and Ubuntu 24.04 | Backend 61/61; frontend 85/85 |
| `pnpm build` including `verify:client` | Windows and Ubuntu 24.04 | Passed |
| `pnpm db:migrate`, `pnpm db:status` | New isolated Ubuntu/PostgreSQL target | All twelve migrations applied; schema up to date |
| `pnpm test:integration` | Windows/PostgreSQL 17.11 | Final complete run: 25 suites, 168/168 |
| `pnpm test:integration` | Ubuntu 24.04/PostgreSQL 17.11 | 25 suites, 168/168 |
| `pnpm test:e2e` | Windows Chrome / Edge | 62/62, 31 per browser; [browser evidence](browser.md) |
| `python3 -m unittest discover -s ops/backup/tests` | Ubuntu 24.04 | 12/12 |
| Operator recovery script | Debian 12/PostgreSQL 17.11 | Passed; [recovery evidence](recovery.md) |
| Club lookup workload | k6 1.6.1 / isolated HTTPS | 29,903 measured iterations; all three groups 100% valid within two seconds; [lookup evidence](lookup.md) |
| Existing `authentication.js`, unchanged | k6 1.6.1 / isolated HTTPS | 100/100 accepted, all within 3 seconds; p95 548.63 ms. Negative run 6/6 expected responses |
| `pnpm verify:commands` | Windows; Ubuntu 24.04 | 10/10 on each OS, including real failure propagation from both full unit suites |

Windows and Linux use Node 24.14.0 and pnpm 10.33.2. The Ubuntu container is
24.04 with the repository's pinned Node distribution and frozen dependencies.
Linux operator commands separately use PostgreSQL 17.11 clients and Python 3.11.2;
Ubuntu Python is 3.12. No required CI job, matrix, threshold or guard was removed.
The suite globs continue discovering all inherited tests and both new availability
browser files. Local test servers are separate from application data.

`verify:commands` retains all ten deliberately failing root-command probes. Its
subprocess budget is now ten minutes because the real complete Windows frontend
suite exceeded the previous three-minute budget. Assertions still require a real
nonzero exit and the injected filename; a timeout never counts as a pass.
The first complete Windows frontend probe took 519.53 seconds and correctly
reported the injected failure while all 85 real frontend tests passed. The full
ten-probe run passed in 892.26 seconds on Windows and 180.53 seconds on Ubuntu.
All temporary probes were removed by their `finally` blocks.

The final review identified missing three-viewport uploaded-media coverage.
The three viewport journeys now upload/decode/remove real logos, inspect fallback
and check file/button/image bounds. All eight affected browser cases passed
(six viewport cases plus the shared-fixture MH13 cases). The final file-only
ESLint, E2E TypeScript, formatting and diff checks passed after this correction.

## Diagnosed execution failures

- Docker was stopped on resumption; it was started before database verification.
- A malformed private environment file initially prevented the load server from
  starting. Separate lines and an authenticated preflight now prevent false evidence.
- The first load run discarded cookies between iterations; the workload now keeps
  its session cookie and checks actual jar state rather than a stale boolean.
- Browser media configuration and a search synchronization issue were corrected;
  the complete 62-case rerun passed without retries.
- Twenty extra test files exposed content surviving a database-only fixture reset.
  Both fixture stores are now reset together before independent cases.
- The first Ubuntu integration launch correctly refused identical application/test
  URLs. Removing the application URL before the test run preserved the safety guard;
  the full rerun passed 168 cases.
- An authentication-load attempt used an IP not present in the certificate SAN.
  Correct localhost/DNS configuration passed with TLS verification active.

Expected failure-injection logs and existing JSDOM pseudo-element/pg deprecation
warnings do not indicate unexpected test failures. Build retains the existing
bundle-size advisory; dependencies were not upgraded to suppress warnings.
