# Authentication UI and browser verification — T027–T028

**Date:** 2026-11-04 (Asia/Bangkok). **Scope:** T027–T028 / Issues #32–#33.
**Review base:** `91ff5820ad77ef75bb75aa1576df32ab53edeb10`. Execution used the
uncommitted working tree; no publication, integration merge or PHASE 1 acceptance is claimed.
The [source manifest](authentication-ui-source-sha256.txt) identifies the tested source
with LF-normalized text and raw image bytes. Codex executed the checks and two independent
reviewer agents reviewed Standards and Spec; both report zero remaining actionable findings.
Issues [#32](https://github.com/quocthai912/Whistle-EPL/issues/32) and
[#33](https://github.com/quocthai912/Whistle-EPL/issues/33) were read back as CLOSED with the
`completed` label and explicit local-only evidence. The source manifest has 30 entries.

**Subsequent visual refinement (2026-11-04):** At the Team Leader's request, password
visibility and logout controls now use purple hover/focus styling; the change-password
submit button retains the local Whistle-EPL background image in default/hover/active states;
logout includes an inline vector icon inheriting the text color. Password-change success
now has an explicit success tone (green text, pale-green background and green border),
while expiry/permission warnings retain their existing warning tone.
The Team Leader subsequently requested matching introduction panels: both auth pages now
share the password-change panel's 24px brand/heading, 14px introduction, 16px strip titles,
13px strip descriptions, 48px logo, 32px padding, 1080px card and responsive breakpoints.
Chrome comparisons at 1440px, 900px and 390px verify matching computed typography, spacing
and panel widths with no horizontal overflow. The original 30-entry
manifest and 22-scenario report retain their original tested snapshot. The five refined
files are recorded in [the refinement manifest](authentication-ui-polish-source-sha256.txt).
Frontend lint, targeted Prettier checks and the production Docker frontend build pass.
A separate Chrome check verifies all password-toggle hovers, the submit image at rest and
hover, the logout SVG/color, and green success versus unchanged amber permission feedback.
Its session replies are mocked in a fresh browser context;
it does not repeat or claim the original real-backend acceptance suite. Only the running
manual-preview web container was rebuilt/replaced; existing accounts, database and backend
were preserved.

## Delivered behavior

MH06 and MH07 are implemented from the supplied `Whistle-EPL_MH06.zip` and
`Whistle-EPL_MH07.zip` HTML designs. Their contents were treated as visual reference,
not authority to run embedded scripts or alter business rules. The local logo/background
under `frontend/public/images` are used. Be Vietnam Pro is bundled locally through the
exact `@fontsource/be-vietnam-pro@5.2.8` dependency; no remote font/image/CDN runtime is required.
The 1040px login and 1080px password-change cards retain the navy brand panel, three
information strips, labels, password visibility controls and footer. Mobile layout is
verified at 390×844; desktop captures are 1440×900.

T027 provides login, mandatory/voluntary personal password change, restricted/full routing,
logout and Vietnamese validation/session-loss notices. The existing HTTP module remains
the sole Fetch owner. The server's flat current-account projection is selected into the
in-memory session view. Account changes clear keyed view state, session memory and CSRF.
Passwords are cleared after submission or validation failure, and are never placed in
browser storage, URLs or recovery drafts. Native browser required-field popups are replaced
by Vietnamese guidance. Ant Design controls use CSS Modules to preserve the supplied design.

One auth-command module handles submission guards, safe failures and uncertain outcomes.
Lost writes are never replayed automatically; the user must resolve the current session
through a read before another submission. Rejected CSRF is forgotten; only a subsequent
explicit submit bootstraps fresh protection. Both the contract code `CSRF_INVALID` and the
existing backend code `CSRF_REJECTED` are supported. The first authenticated write validates
the session before CSRF bootstrap so expiry/revocation retains its approved feedback.
Focus/visibility revalidation performs no periodic keepalive or automatic write.

The public route and permitted internal landing remain foundation shells. They do not
claim later season/account/delegation/audit workflows exist. User-supplied artwork describes
those future business areas without granting access to them.

## Actual environment and results

Windows x64, Windows NT `10.0.26300`; Node `24.14.0`, pnpm `10.33.2`.
Playwright `1.64.1` uses the installed **Google Chrome 156.0.8078.81** and
**Microsoft Edge 156.0.4314.58** channels, with no bundled-Chromium substitution.
`ignoreHTTPSErrors` is false. Caddy `2.11.7` serves the production frontend and proxies
the unchanged production backend in an internal Docker network. Only
`127.0.0.1:55444` exposes browser HTTPS; the backend has no published port.
PostgreSQL `17.11` runs in Docker. Browser data uses `whistle_test_browser` on the
loopback-only test PostgreSQL listener `127.0.0.1:55439`; regression integration uses the
separate `whistle_test_auth` database. Six committed migrations were freshly deployed to
the browser database. Every browser run explicitly resets its dedicated database, requires
`NODE_ENV=test` and `E2E_RESET_ACK=RESET_ISOLATED_TEST_DATABASE`, and creates random synthetic
accounts. Reset rejects an operational/nonlocal/shared-integration target.

| Check | Executed result |
|---|---|
| `pnpm lint` | PASS, including browser source/config |
| `pnpm typecheck` | PASS, including browser source/config |
| `pnpm format:check` | PASS |
| `pnpm build` | PASS; existing Vite advisory reports a 502.92kB minified entry chunk |
| `pnpm test` | 15 backend + 16 frontend tests PASS |
| `pnpm test:integration` | 55 tests / 9 suites PASS on real PG17 |
| `pnpm test:e2e` | 22 PASS: 11 scenarios on each installed browser |
| `pnpm verify:commands` | 10 injected-failure propagation probes PASS |

The [browser report](authentication-ui-browser-results.json) records actual results and
versions. [MH06](authentication-ui-mh06.png) and [MH07](authentication-ui-mh07.png) are
credential-free Chrome captures visually inspected by Codex against the supplied HTML.
Browser scenarios cover expired prelogin recovery, offline unknown outcome, Vietnamese
empty-field feedback in an English browser, responsive geometry, restricted direct access,
Unicode/whitespace password change, invalidation of every session, ordinary logout retaining
an independent session, shared-tab CSRF/cookie flags, idle/absolute expiry, revision-based
revocation, account locking, generic credential failure and incorrect current password.
Time/revocation/lock states are explicitly prepared by guarded test-process fixtures;
this does not claim elapsed 30-minute/8-hour waiting or future account-administration flows.

Trace/video/automatic screenshots are disabled. Playwright failure DOM copy prompts are
disabled because those snapshots can include password input values. Only explicit blank-form
captures are retained. Passwords/cookies/CSRF are not logged by the test runner.

## Test-first and corrections

The Team Leader confirmed the React/HTTP and real HTTPS browser seams, and the review base,
before tests were authored. The initial temporary-login test failed because the shell had
no login fields, then passed after implementation. The full-session restoration test
exposed the actual flat backend projection. A lost-response test failed until explicit
outcome resolution was provided. Real Chrome/Edge exposed native Fetch's receiver binding,
which was fixed by wrapping the default Fetch function. Ant Design field state required
remounting secret inputs to reliably clear values. The final expired-prelogin browser test
exposed the backend's `CSRF_REJECTED` code and passed after safe mapping/invalidation.

Initial browser attempts failed certificate trust; Windows CA installation was explicitly
confirmed by the user before the successful HTTPS runs. A host backend bind was rejected
by automatic approval review; the completed run used an internal Docker backend instead.
Sandbox Supertest connections initially failed EACCES; rerunning outside the sandbox passed.
Checkout CRLF initially failed the existing LF formatter policy. The `.gitattributes`
LF default now matches that policy while preserving vendored-corpus `-text` rules and
operational script rules. Normalizing unchanged source bytes creates no semantic diff.

## Reproduction

Install the locked dependencies and the actual Chrome/Edge applications. Build the source,
deploy the existing migrations to a **dedicated** local `whistle_test_browser` (or suffixed)
database, and serve `frontend/dist` under trusted same-origin local HTTPS. A private Docker
backend can be built with `docker build -t whistle-browser-backend:test -f backend/Dockerfile .`.
Keep its database URL and other runtime configuration in an ignored protected env file;
set `AUTH_ORIGIN` to the exact HTTPS origin and expose no backend port. The committed
`tests/e2e/Caddyfile` targets Docker DNS `whistle-browser-backend:3000`; mount the frontend
build at `/srv`, attach Caddy/backend/PostgreSQL to the private network, and bind only the
Caddy HTTPS port to loopback. Trust only this test CA before execution and remove its trust
afterward. The executed backend/Caddy images are pinned by the existing Dockerfiles and
operation baseline; no production profile or data was reset.

Set `NODE_ENV=test`, `E2E_BASE_URL=https://localhost:55444`, an explicit protected
`E2E_TEST_DATABASE_URL`, and `E2E_RESET_ACK=RESET_ISOLATED_TEST_DATABASE`; run `pnpm test:e2e`.
This command intentionally erases only the designated browser fixture database. It refuses
to run without the explicit reset acknowledgment. Never point it at an operational target.

## Scoped convergence and remaining scope

Convergence assessed T027–T028 against their 14 distinct FR references, four SC references,
US2's eight acceptance scenarios, the five auth endpoint/browser transport contracts,
five relevant plan decisions and all five constitution principles. Zero missing, partial,
contradicting or unrequested findings remain in this selected scope; no convergence tasks
were appended. T029–T048 remain existing pending work, not duplicate convergence tasks.
No extension hooks are registered (`.specify/extensions.yml` is absent).
After verification, the test CA was removed from the Windows user trust store, test
backend/Caddy containers and their private network/PKI volume were removed, the protected
temporary backend env file was deleted, and the existing PostgreSQL test container was
returned to its initial stopped state. Source changes remain uncommitted and unstaged.
PHASE 1 remains IN_PROGRESS. Team Leader acceptance, publication, CI/protection, BM-01 load,
future administration/audit screens, full clean-host and operational drills remain separate.
