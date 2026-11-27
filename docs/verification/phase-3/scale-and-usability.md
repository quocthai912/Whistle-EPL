# PHASE 3 T027 — Scale lookup performance and usability verification

Execution dates: `2026-11-27` (browser scale/TT-02/TD-01 + quality gates) and `2026-11-28` (`00:00–00:16 Asia/Bangkok`, full post-review HQ-01 k6 re-execution and 3 negative fault probes). Source baseline: `bdff9c7` (`test/phase-3-performance-usability-and-acceptance`) plus the T027 verification assets, TT-02 responsive grid fix, and post-review refinements recorded below. All evidence in this report is isolated test-fixture execution on the final post-review scripts; operational season data, later-Phase public lookup benchmarks (PHASE 6), and the Team-Leader-confirmed open live 5-human-participant usability observation remain separate gates.

## 1. Environment and D097 reference baseline

| Component | Recorded version / configuration |
| --- | --- |
| Host hardware | 13th Gen Intel Core i7-13650HX (20 logical CPUs), 16,873,545,728 bytes RAM (~15.71 GiB), Windows x64 (`win32 10.0.26300`) |
| Disk capacity (SSD) | Physical NVMe SSD (512,110,190,592 bytes nominal); mounted volumes: `C:\` 254,918,258,688 bytes total (71,657,017,344 bytes / 66.74 GiB free) and `D:\` 254,802,915,328 bytes total (155,205,345,280 bytes / 144.55 GiB free) — sufficient for the 600-player dataset, 300+ managed portraits, and ≥7 retained backup sets |
| Runtime toolchain | Node `24.14.0`, pnpm `10.33.2`, PostgreSQL `17.11-bookworm`, Caddy `2.11.7`, Grafana k6 `1.6.1`, Sharp `0.35.5` |
| D097 server stack cgroups (API benchmark) | Exact `4.0 vCPU` / `8.0 GiB RAM` total across 3 isolated containers sharing one network namespace: `whistle-phase3-t027-pg` (`NanoCpus=2000000000`, `Memory=4294967296` = 2.0 vCPU / 4 GiB), `whistle-phase3-t027-backend` (`NanoCpus=1500000000`, `Memory=3221225472` = 1.5 vCPU / 3 GiB), `whistle-phase3-t027-caddy` (`NanoCpus=500000000`, `Memory=1073741824` = 0.5 vCPU / 1 GiB) |
| Transport & TLS | Local same-origin HTTPS (`https://localhost:8450` for k6; `https://localhost:8449` for real browsers) using a separate test copy of the existing trusted local test CA (`whistle-phase3-t026-caddy` -> `whistle-phase3-t027-*`). Normal TLS verification stayed enabled (`SSL_CERT_FILE` for k6, `ignoreHTTPSErrors: false` for Playwright); no TLS bypass or persistent OS trust-store edit was made. |
| Real browsers (UI benchmark & TT-02/TD-01) | Google Chrome `158.0.8127.38` and Microsoft Edge `158.0.4370.45` |
| Storage profile | `local` (`LocalMediaStore`, private backend-owned directory, UID `1000` / `chmod 700` inside Linux benchmark container; isolated `.verification/t027-browser/media` for host browser suite) |

## 2. Declared D090 / D097 full-season scale dataset

Both the API benchmark (`backend/scripts/prepare-phase3-lookup.cjs`) and the real browser suite (`tests/e2e/phase-3-scale-usability.spec.ts`) run against isolated, empty databases (`whistle_test_phase3_lookup` and `whistle_test_browser_t027`) with no operational database reuse:

- **Season**: 1 `OPEN` season `EPL-TEST-2026` (`2026-08-01` through `2027-05-31`).
- **Declared test-only regulation (D097)**: `squadLimit = 25`, `nonHomegrownLimit = 17`, `u21Cutoff = 2005-01-01`, `homegrown = 3 seasons / 36 months` (`[15, 21)`), `clubCount = 20`, `DOUBLE_ROUND_ROBIN` (`legs = 2`), `plannedMinutes = 120`, buffers `30/30`, points `3/1/0`, `Q/R = 4/3`, club intake `[2026-06-01 00:00, 2026-08-01 00:00)` and player intake `[2026-06-01 00:00, 2026-09-01 00:00)` + `[2027-01-01 00:00, 2027-02-01 00:00)` (Asia/Ho_Chi_Minh stored as UTC).
- **Scale composition (D090)**: **20 clubs**, **20 stadiums**, **20 approved BM1 club applications** (each with 30 proposed players and per-club D059 `officialSnapshot`), **600 Player Profiles**, and **600 valid seasonal player registrations** allocated as **30 valid registrations per club**: 8 homegrown (`SEASONS = 4`, verified D054 evidence) + 17 non-homegrown (`25` counted) + 5 qualifying U21 (`birthDate = 2006-04-20`, outside the 25-player limit).
- **Authorized media at hundreds-of-profiles scale**: **300 real managed static WebP portraits** generated synthetically via Sharp / production `normalizePlayerPortrait`, persisted in `LocalMediaStore` with SHA-256 checksums and `media_asset` records linked to `player.current_portrait_id`, alongside **300 players without portraits** exercising accessible fallback. Vietnamese diacritics (`Câu lạc bộ Đà Nẵng Scale`, `Nguyễn Hoàng Đà Nẵng 001`, `Trần Minh Quân Huế 002`, `Sân vận động Hòa Xuân 01`) are seeded across clubs, stadiums, players, and registrations.

## 3. API lookup benchmark — HQ-01 (separated from UI)

**Post-review execution provenance (`2026-11-28 00:00–00:16 Asia/Bangkok`)**: Following the two-axis independent review edits to `backend/scripts/prepare-phase3-lookup.cjs` (static sanitized `.catch`, removed unused manifest fields, per-club `coachName`) and `tests/performance/phase-3-lookups.js` (init search-term guards and `.ids.length === 1` search assertions), `whistle-phase3-t027-backend:latest` was rebuilt from `backend/Dockerfile`, the isolated `4.0 vCPU / 8.0 GiB RAM` stack was re-seeded from scratch, and the complete 1-minute warm-up + 10-minute measured benchmark plus all 3 negative fault probes were re-executed on the final scripts.

Workload: `tests/performance/phase-3-lookups.js` on `grafana/k6:1.6.1`, **20 concurrent virtual users**, **1-minute warm-up** (`warmup`, excluded from measured thresholds), 10-second transition, and **10-minute measured window** (`measured`), 250 ms think time, persistent session cookies (`noCookiesReset: true`), cycling through all **300 real managed WebP portraits** on disk and verifying `Content-Type: image/webp`, `Cache-Control: no-store`, exact byte length, and `RIFF....WEBP` binary header on every read.

- **Measured iterations**: **8,372** (total including warm-up: **9,169**, **0** interrupted)
- **Total HTTP requests**: **128,412** (`191.34 req/s`), **0** failed (`0.00%`)
- **Overall HTTP request duration**: mean `84.87 ms`, median `83.51 ms`, p90 `100.95 ms`, p95 `106.93 ms`, max `909.44 ms`
- **Data validity & paging completeness**: `phase3_lookup_success = 100.00% (8,372 / 8,372)`, `phase3_paging_complete = 100.00% (8,372 / 8,372)`

| In-scope lookup group | Requests per sample | Mean | Median | p90 | p95 | Max | Valid ≤ 2 s (HQ-01 ≥95%) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1. Player profile list & >20 pagination (`page=1` + `page=2` of 600, exact order) | 2 GET | 154.65 ms | 154 ms | 173 ms | 181 ms | 285 ms | **8,372 / 8,372 (100.00%)** |
| 2. Player Vietnamese diacritic search (`Đà Nẵng 001` across 600) | 1 GET | 79.37 ms | 79 ms | 91 ms | 96 ms | 165 ms | **8,372 / 8,372 (100.00%)** |
| 3. Player detail + managed WebP portrait delivery (`LocalMediaStore`, `no-store`, 300 files cycled) | 2 GET | 166.90 ms | 166 ms | 186 ms | 194 ms | 289 ms | **8,372 / 8,372 (100.00%)** |
| 4. Club participation applications BM1 (20-club list + Vietnamese search + detail) | 3 GET | 254.03 ms | 251 ms | 279 ms | 292 ms | 399 ms | **8,372 / 8,372 (100.00%)** |
| 5. Seasonal registrations >20 pagination (600-season p1+p2 & 30/club p1+p2) | 4 GET | 334.66 ms | 331 ms | 365 ms | 381 ms | 519 ms | **8,372 / 8,372 (100.00%)** |
| 6. Seasonal registrations Vietnamese search & detail | 2 GET | 192.63 ms | 191 ms | 213 ms | 223 ms | 325 ms | **8,372 / 8,372 (100.00%)** |

### Negative fault probes (re-executed on post-review scripts; excluded from measured totals)

Three fail-closed probes executed against the same isolated stack confirmed the final `tests/performance/phase-3-lookups.js` cannot emit a false pass:

| Probe | Injected fault | Observed exit code & outcome |
| --- | --- | --- |
| Probe 1 — Bad login | Wrong synthetic password in fixture | Exit `107`: aborted in `setup()` (`Synthetic Phase 3 lookup authentication failed.`) |
| Probe 2 — Malformed fixture | `totals.players = 599` | Exit `107`: rejected at init (`Use the declared 20-user, 20-club, 600-player isolated Phase 3 lookup fixture.`) |
| Probe 3 — Wrong page order | Swapped first two IDs in `playerPage1Ids` (exact UTF-8 fixture) | Exit `99`: crossed `p3_player_list_within_2s`, `phase3_lookup_success`, `phase3_paging_complete` (`0 / 1`) while the other 5 groups passed (`1 / 1`) |

## 4. Real browser UI, TT-02 viewports and portrait management at scale (separated from API)

Command: `pnpm exec playwright test tests/e2e/phase-3-scale-usability.spec.ts` against built `frontend/dist` + `backend/dist` + PostgreSQL `17.11` + `LocalMediaStore` over trusted HTTPS (`https://localhost:8449`).

**Final post-review result**: **8/8 passed** (`2.5m` total; 4 Chrome cases + 4 Edge cases, 0 retries, 0 skips).

### Diagnosed & resolved defects during execution and independent review

1. **TT-02 real product defect (`360 × 800` horizontal overflow)**: First full Chrome/Edge run passed `/workspace/players` at `360 × 800` but failed `document.documentElement.scrollWidth <= window.innerWidth` on `/workspace/seasons/:seasonId/club-applications` on both browsers. Root cause: `<div style={{ display: 'grid', gap: 16 }}>` inside `ClubApplicationsPage.tsx` and `PlayerRegistrationsPage.tsx` omitted `grid-template-columns: minmax(0, 1fr); min-width: 0;`, allowing wide tables to expand the grid track beyond the viewport. Fixed cleanly via `.workspaceStack` in `frontend/src/features/registrations/ClubApplicationsPage.module.css` and applied to both pages; frontend rebuilt and all 6/6 viewport cases subsequently passed on both browsers.
2. **Test harness & independent-review corrections**:
   - Replaced a malformed synthetic PNG fixture (`portraitFixtureB`) with a valid 16×16 static PNG; added explicit cell-visibility synchronization after debounced player search; updated TD-01 T3/T4 assertions to match the existing single-season auto-navigation on `PlayerRegistrationsPage.tsx` (`1` action instead of `2`).
   - Addressed Standards & Spec review findings: sanitized `prepare-phase3-lookup.cjs` `.catch` output so raw errors never leak DB URIs; added search-field init validation and `.ids.length === 1` checks in `phase-3-lookups.js`; upgraded portrait replacement in `phase-3-scale-usability.spec.ts` to assert non-vacuous `naturalWidth: 12 -> 16` AND `src` URL change; aligned per-club `officialSnapshot` `coachName`; recorded exact NVMe SSD capacities; documented `E2E_MEDIA_ROOT` and T027 entry points in `quickstart.md`. Re-ran all 8/8 Chrome & Edge cases after these fixes: **8/8 passed**.

### TT-02 viewport & portrait verification matrix (final post-review run — Chrome `158.0.8127.38` & Edge `158.0.4370.45`)

Every cell verified on both Chrome and Edge with zero horizontal page overflow (`scrollWidth <= innerWidth`), unobscured table action buttons within scroll bounds, exact >20 pagination without omission/duplication (`Trang 1 / 30` + `Trang 2 / 30` = 40 distinct rows on Players and Registrations; `Trang 1 / 2` [20] + `Trang 2 / 2` [10] = 30 distinct rows per club), exact Vietnamese diacritic search, real decoded WebP portraits (`>= 8` decoded `<img>` per 20-row page + accessible fallbacks), and live UI portrait upload (`12px`) -> viewport-bounds check -> replacement (`src` changed & `16px`) -> removal back to accessible fallback.

| Screen & operation | Chrome 360×800 | Chrome 768×1024 | Chrome 1366×768 | Edge 360×800 | Edge 768×1024 | Edge 1366×768 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Players: initial load (600, p1 + portraits) | 925 ms | 669 ms | 941 ms | 874 ms | 590 ms | 551 ms |
| Players: paginate to page 2 (`Trang 2 / 30`) | 214 ms | 143 ms | 250 ms | 130 ms | 149 ms | 162 ms |
| Players: Vietnamese search (`Đà Nẵng 001`) | 934 ms | 876 ms | 867 ms | 859 ms | 877 ms | 872 ms |
| Players: live portrait upload + decode render | 1,279 ms | 1,254 ms | 1,277 ms | 1,415 ms | 764 ms | 710 ms |
| Club Applications: load 20 approved BM1 | 752 ms | 712 ms | 1,089 ms | 821 ms | 860 ms | 820 ms |
| Club Applications: Vietnamese search (`Đà Nẵng Scale`) | 928 ms | 919 ms | 937 ms | 923 ms | 898 ms | 913 ms |
| Player Registrations: initial load (600, p1) | 851 ms | 740 ms | 1,080 ms | 738 ms | 877 ms | 804 ms |
| Player Registrations: paginate to page 2 (`Trang 2 / 30`) | 249 ms | 226 ms | 322 ms | 334 ms | 241 ms | 300 ms |
| Player Registrations: club filter + 30/club paging (p1+p2) | 1,003 ms | 930 ms | 1,008 ms | 1,081 ms | 810 ms | 922 ms |
| Player Registrations: Vietnamese search (`Đà Nẵng 001`) | 946 ms | 939 ms | 944 ms | 976 ms | 924 ms | 457 ms |

## 5. TD-01 usability navigation trials (5 representative personas × 4 authorized tasks)

> [!IMPORTANT]
> **Automated vs. Human-Trial Classification & Team Leader Decision (`2026-11-27`, Asia/Bangkok)**: Per Constitution V and explicit Team Leader confirmation on `2026-11-27 (Asia/Bangkok)` (**Option 2**: *"Chọn Phương án 2 (giữ làm đầu vào mở có xác nhận của Team Leader) ghi rõ bằng chứng trong tài liệu"*), the 40 raw trials below are **automated Playwright browser persona trials** executed with 5 distinct representative authorized accounts (`REGISTRATION_OFFICER`, `SEASON_MANAGER`, combined roles, and `PLAYER_MASTER`) on real Chrome and Edge. They verify structural navigation depth (`<= 3` actions), consistent Vietnamese labels, role-scoped menus, and real UI responsiveness (`<= 30 s`). They do **not** fabricate or substitute for live human-subject think-aloud observation; the **live 5-human-participant usability trial** is explicitly retained as a Team-Leader-confirmed open human-usability input rather than claimed complete.

### Task definitions (starting from `/internal` workspace home)

- **T1**: Open **Quản lý hồ sơ cầu thủ** (`/workspace/players`) and render 600-player paginated table (`1` navigation action).
- **T2**: Open **Hồ sơ tham dự câu lạc bộ** -> select `EPL-TEST-2026` -> render 20 approved club applications (`2` navigation actions).
- **T3**: Open **Đăng ký cầu thủ theo mùa** -> auto-open single assigned season -> render 600 paginated registrations (`1` navigation action).
- **T4**: Open **Đăng ký cầu thủ theo mùa** -> open registration detail drawer and inspect playing effectivity `Đang hiệu lực` (`2` navigation actions).

### Raw trial results — Google Chrome `158.0.8127.38` (`20 / 20 = 100.0%` within ≤30 s and ≤3 actions)

| Persona | Assigned scope | T1 (actions / ms) | T2 (actions / ms) | T3 (actions / ms) | T4 (actions / ms) | Result |
| --- | --- | --- | --- | --- | --- | --- |
| `sc3.td01.01` | `REGISTRATION_OFFICER` + `PLAYER_MASTER` | 1 / 980 ms | 2 / 1,187 ms | 1 / 1,024 ms | 2 / 1,820 ms | 4/4 PASS |
| `sc3.td01.02` | `SEASON_MANAGER` + `PLAYER_MASTER` | 1 / 1,159 ms | 2 / 1,313 ms | 1 / 1,487 ms | 2 / 1,558 ms | 4/4 PASS |
| `sc3.td01.03` | `REGISTRATION_OFFICER` + `SEASON_MANAGER` + `PLAYER_MASTER` | 1 / 1,180 ms | 2 / 1,363 ms | 1 / 1,318 ms | 2 / 1,645 ms | 4/4 PASS |
| `sc3.td01.04` | `REGISTRATION_OFFICER` + `PLAYER_MASTER` | 1 / 1,168 ms | 2 / 1,417 ms | 1 / 1,322 ms | 2 / 1,534 ms | 4/4 PASS |
| `sc3.td01.05` | `SEASON_MANAGER` + `PLAYER_MASTER` | 1 / 1,164 ms | 2 / 1,322 ms | 1 / 1,272 ms | 2 / 1,496 ms | 4/4 PASS |

### Raw trial results — Microsoft Edge `158.0.4370.45` (`20 / 20 = 100.0%` within ≤30 s and ≤3 actions)

| Persona | Assigned scope | T1 (actions / ms) | T2 (actions / ms) | T3 (actions / ms) | T4 (actions / ms) | Result |
| --- | --- | --- | --- | --- | --- | --- |
| `sc3.td01.01` | `REGISTRATION_OFFICER` + `PLAYER_MASTER` | 1 / 559 ms | 2 / 1,297 ms | 1 / 803 ms | 2 / 1,125 ms | 4/4 PASS |
| `sc3.td01.02` | `SEASON_MANAGER` + `PLAYER_MASTER` | 1 / 698 ms | 2 / 1,422 ms | 1 / 1,284 ms | 2 / 1,242 ms | 4/4 PASS |
| `sc3.td01.03` | `REGISTRATION_OFFICER` + `SEASON_MANAGER` + `PLAYER_MASTER` | 1 / 1,266 ms | 2 / 1,410 ms | 1 / 1,298 ms | 2 / 1,667 ms | 4/4 PASS |
| `sc3.td01.04` | `REGISTRATION_OFFICER` + `PLAYER_MASTER` | 1 / 695 ms | 2 / 1,404 ms | 1 / 1,317 ms | 2 / 1,515 ms | 4/4 PASS |
| `sc3.td01.05` | `SEASON_MANAGER` + `PLAYER_MASTER` | 1 / 1,075 ms | 2 / 1,368 ms | 1 / 1,306 ms | 2 / 1,158 ms | 4/4 PASS |

## 6. Post-edit candidate-revision quality gates

After the `.workspaceStack` CSS fix and post-review edits, the following candidate-revision gates passed on Windows (`Node 24.14.0`, `pnpm 10.33.2`):

- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm db:validate`, `pnpm verify:native`, `pnpm build` (including `verify:client`): **PASS**
- `pnpm --filter @whistle-epl/backend run test:unit`: **11/11 suites, 84/84 tests PASSED**
- `pnpm --filter @whistle-epl/frontend run test:unit`: **19/19 files, 111/111 tests PASSED**
- `pnpm exec playwright test tests/e2e/phase-3-scale-usability.spec.ts`: **8/8 passed** (Chrome + Edge)

## 7. Reproduction and scope boundaries

- **API load**: Build `whistle-phase3-t027-backend` from `backend/Dockerfile`, run PostgreSQL 17.11 (`2 vCPU / 4 GiB`), Backend (`1.5 vCPU / 3 GiB`), and Caddy 2.11.7 (`0.5 vCPU / 1 GiB`) with a dedicated empty `whistle_test_phase3_lookup` DB and private UID-1000 `MEDIA_ROOT`, run `node /app/backend/scripts/prepare-phase3-lookup.cjs`, then execute `grafana/k6:1.6.1 run /perf/phase-3-lookups.js` with `SSL_CERT_FILE` pointing to the isolated test CA root certificate and protected `PHASE3_FIXTURE`.
- **Browser UI & TD-01**: Run built backend + Caddy HTTPS against a dedicated migrated `whistle_test_browser_*` DB and isolated `E2E_MEDIA_ROOT`, then run `pnpm exec playwright test tests/e2e/phase-3-scale-usability.spec.ts`.
- **Retained later-owner scope**: Public lookup benchmarks (PHASE 6), 10-season / 3,800-match historical load (TH-05/HQ-03), full-season BM-07 recovery (PHASE 10), authorized production player portrait assets (O13), and live 5-human-participant usability observation remain with their respective owners.
