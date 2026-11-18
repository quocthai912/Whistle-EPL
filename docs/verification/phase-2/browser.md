# PHASE 2 real browser verification — T026

Execution date: 2026-11-18 (Asia/Bangkok). Source identity and final results:
[regression.md](regression.md). The actual Windows browsers report Chrome
157.0.8103.79 and Edge 157.0.4341.60. HTTPS validation uses a certificate pinned
only to these test processes; no global browser TLS bypass is used.

## Coverage

The registered root suite discovers 62 cases, 31 per browser, including all
inherited authentication, administration and audit files and both Club/Stadium
availability files. No browser journey substitutes mocked network responses for
the business API. Deliberately intercepted connection failures remain confined
to the existing error/recovery scenarios.

New master-list journeys each seed 25 distinct records and exercise
360x800, 768x1024 and 1366x768. They search using a unique code prefix, read both
pages, compare the complete identity set without omission/duplication, check
document width, open the form, enter Vietnamese text and cancel. Existing
journeys verify the shared font/input/dropdown system, MH11/MH13/MH17 actions,
logo upload/fallback, D099 confirmations/history, exact regulation decisions,
creation-only access, read-only Closed metadata, season selection and date inputs.
Loading, empty/error/retry, retained values, session loss and revision conflict
also retain their frontend and inherited browser coverage.

## Corrections during execution

The first run passed 59/62. One new pagination test read the previous unfiltered
page while the search was pending; it now waits for twenty matching-prefix
records before collecting identities. Two logo journeys exposed missing media
configuration in the local harness. The harness now sets `MEDIA_ROOT` to its
dedicated directory and `MEDIA_STORAGE_PROFILE=local`. These were fixture/harness
defects; no UI behavior or security guard was weakened.

Run `pnpm test:e2e` with explicit `E2E_BASE_URL`, a separate migrated
`E2E_TEST_DATABASE_URL` named `whistle_test_browser_*`, and
`E2E_RESET_ACK=RESET_ISOLATED_TEST_DATABASE`. Configure protected local media and
a trusted test certificate before starting the actual application. Traces,
screenshots and videos remain disabled to avoid credential-bearing diagnostics.
Final rerun result is recorded in [regression.md](regression.md).

The full rerun passed 62/62 with no skips, retries or unexpected failures. After
adding an explicit check that the final row action fits inside the table scroll
container, all six affected viewport/browser cases passed again (6/6).
The final Spec review then required uploaded media at those same viewports.
Each viewport journey now opens a real profile, checks fallback, uploads and
decodes a real logo, verifies image/file-picker/remove-button bounds, removes the
logo and checks fallback again. All eight affected cases passed (8/8), including
both MH13 cases sharing the same image fixture. A duplicate close-button locator
was corrected to select the footer action before the passing run.
