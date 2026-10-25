# ADR 0006 - UTC instants and a single Vietnam input/display time zone

This ADR records decisions and rationale; authoritative current rules are owned by [D024](../../context/english/design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone). Historical open-point notes do not reopen subsequently confirmed policy.

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q24, option A; Context decision [D024](../../context/english/design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone).

O03/O12 leave time-zone handling open, with cross-cutting effects on scheduling, registration deadlines, regulation/delegation effectivity and audit history. The Team Leader confirmed storing and comparing exact instants using UTC, with system-wide time entry and display in Asia/Ho_Chi_Minh. Clearly label that zone and do not automatically switch to device time zones. Dates without time components, including birth dates and U21 birth-date cutoffs, retain their calendar-date values without time-zone conversion.

Europe/London and per-device display were considered. A single Vietnam display/input time zone was chosen for straightforward local operation, demonstrations and verification, accepting a difference from local stadium time in England. This is a v2 design decision, not a PDF time-zone default. Database types, API serialization, precision, libraries, activation/expiry/session mechanisms and concrete seasonal dates remain open. [D023](../../context/english/design/access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end)'s interval rule continues to apply to delegation and is not automatically imposed on other business intervals. See [Context v2 D024](../../context/english/design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone).

### D024 english evidence

Current policy owner: [D024](../../context/english/design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q24, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O03/O12 and cross-cutting O07/O08; TT-04, PDF p.19; time-related scheduling/registration/regulation/delegation requirements. This is an explicitly confirmed v2 design policy, not a time zone specified by the PDF.

- **Alternatives/basis:** Vietnam input/display time, Europe/London input/display time, or each user's device time zone. The Team Leader selected a single Vietnam time zone for straightforward local operation, demonstrations and verification, accepting that displayed times differ from local stadium time in England.

- **Record:** [ADR 0006](0006-utc-instants-and-vietnam-time-zone.md).

- **Affected Phases:** PHASE 1 shared time handling; PHASE 2-PHASE 9 time/date inputs, processing and output; PHASE 10 integration/boundary verification. No Phase status changes.

- **Still open:** Database column types, API serialization, time precision, time libraries, activation/expiry/session mechanisms, scheduling intervals, concrete seasonal dates and business-specific boundary rules. The delegation interval boundary remains as confirmed in [D023](../../context/english/design/access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end); [D024](../../context/english/design/architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone) does not extend that interval rule to every other business interval.
