# PHASE 2 internal Club lookup — T027

Execution date: 2026-11-18 (Asia/Bangkok). Source baseline:
`99c964f8b09b250af2e85582306fd8e5e4a7e5a5` plus the tested T025–T030 changes,
published in [d3023cc](https://github.com/quocthai912/Whistle-EPL/commit/d3023cccfba28cd7c0b2e6946ab9f1b051ee6c59).
The full workload completed successfully with exit code 0.

## Actual environment and workload

Node 24.14.0 and PostgreSQL 17.11 run in separate containers sharing an isolated
Docker network namespace. k6 1.6.1 uses HTTPS with the explicit test root, normal
TLS verification and localhost mapped to IPv4. This is a local test application,
not the deployment service. Synthetic credentials are in ignored protected files.

Host: Intel Core i7-13650HX, fourteen physical / twenty logical cores,
16,873,545,728 bytes RAM and NVMe SSD (512,110,190,592 bytes). Docker Desktop
reports twenty CPUs and 8,172,449,792 bytes memory. **D097 deviation:** these
containers are not capped to the exact 4-vCPU/8-GiB reference, and other isolated
verification jobs share the host. Results apply to this recorded profile; they
do not establish the exact reference-hardware or later public-lookup benchmark.

`backend/scripts/prepare-phase2-lookup.cjs` prepares an empty dedicated database
named `whistle_test_phase2_lookup`: one EPL-TEST-2026 season, twenty authorized
synthetic readers and twenty-five shared Club masters. Twenty rows form the
baseline; five extra rows force pagination. One name contains “Đà Nẵng”.

`tests/performance/phase-2-club-lookup.js` runs twenty concurrent users for a
one-minute warm-up followed by ten measured minutes (a ten-second transition
allows warm-up iterations to finish). Each iteration requests both 20-row list
pages, a Vietnamese search and one detail. It verifies the exact complete set of
25 IDs, stable totals, one matching search and the expected detail identity.
There is a 250-ms think time. List latency covers **both** page requests together;
search/detail each record their own request duration. Each group independently
requires at least 95% valid responses within two seconds. Success/paging must be
100%, and a separate counter requires nonzero measured samples. Readiness and an
authenticated fixture preflight fail before measurement if configuration is wrong.

## Reproduction and scope

Follow the protected fixture preparation and environment variables in the
[quickstart](../../../specs/002-phase-2-season-regulations/quickstart.md).
Keep `authentication.js` unchanged and run its separate regression; its result
is in [regression.md](regression.md). Do not expose fixture credentials or disable
certificate validation to run the workload.

The first unsuccessful attempts are excluded: malformed private environment,
localhost IPv6 resolution and per-iteration cookie resets were corrected. No
failure or zero-sample result counts toward acceptance. Browser/UI measurements
are separate in [browser.md](browser.md). This is SC-010's PHASE 2 internal-list
partial benchmark; PHASE 6 public lookup, 380 matches/600 players and later
10-season/3,800-match workloads remain open with their owning Phases.

## Original measured result — published in d3023cc

The completed run recorded 29,903 measured iterations, hence 29,903 samples in
each group. Exact paging and combined lookup validity were both 100%.
All three groups independently achieved 100% valid results within two seconds.

| Group | Mean | Median | p95 | Maximum | Valid within 2 seconds |
|---|---:|---:|---:|---:|---:|
| List (both pages together) | 74.71 ms | 65 ms | 153 ms | 607 ms | 29,903 / 29,903 |
| Vietnamese name search | 37.10 ms | 32.15 ms | 78.69 ms | 276.96 ms | 29,903 / 29,903 |
| Club detail | 38.61 ms | 33.93 ms | 80.34 ms | 282.58 ms | 29,903 / 29,903 |

Including warm-up, setup and authentication, k6 made 129,876 HTTP requests with
zero failed requests and completed 32,458 iterations. The group samples above
exclude warm-up. No API result is pooled with browser evidence.

## Review correction remeasurement — 2026-11-18

The uncommitted corrections based on `1b2e09b` require exact ordered page slices
and measure search/detail wall time immediately around each request, including
connection setup. The full twenty-user, one-minute warm-up and ten-minute
measurement passed with 31,618 measured iterations. Each group independently
returned 100% valid results within two seconds; both-page completeness was 100%.

| Group | Mean | Median | p95 | Maximum |
|---|---:|---:|---:|---:|
| Both list pages | 63.87 ms | 58 ms | 117 ms | 289 ms |
| Vietnamese search | 31.82 ms | 29 ms | 60 ms | 164 ms |
| Detail | 33.13 ms | 30 ms | 62 ms | 162 ms |

There were 138,532 total HTTP requests, zero failed requests and 34,622 total
iterations including conditioning. The same Docker Desktop host/profile deviation
recorded above applies (twenty CPUs and 8,172,445,696 bytes reported in this run).
Separate negative fault probes confirm malformed items,
wrong page order and login errors cannot produce a successful measured run;
those probes are not counted as benchmark samples. See [review corrections](review-fixes.md).
