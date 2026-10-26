# ADR 0017 - Exclude Live Score from the first version

Current package approval: [Q98 approved v2](../../context/README.md#q98---whole-package-approval). Earlier pending/open statements below are historical interview evidence; current rules remain in their linked owners.

**Status:** accepted. **Decision:** LS-01. **Authority:** Team Leader and members, communicated by the Team Leader on 2026-10-26 (Asia/Bangkok).

The group explicitly excludes Live Match Tracking / Live Score from the first version and cancels its current Context v2 interview, detailed design, integration planning and mandatory acceptance. V2-EXT-01 is closed as excluded, not unresolved. Reconsideration requires a new group decision; no Future Enhancements commitment is created.

The Team Leader reports that continuous updates require repeated API calls, surveyed free plans have limited requests/data with no verified stable free solution, and synchronization, match mapping, failures, latency and provider dependence impose disproportionate SE104 cost. This records the group's rationale without independently asserting current provider pricing or capabilities.

This supersedes the Live Score portions of INT-01/ADR 0016 and prior interview reminders. Retain their historical evidence in Git and ADRs. The media gate remains: independently build, test and accept club/logo/player-profile/image functionality before researching/trialling/selecting a media API. Highlightly remains the preferred trial candidate; API-FOOTBALL and football-data.org are reference candidates, with no approved supplier or integration.

Managed media, internal match postponement and an internal season overview dashboard remain first-version scope. Core functions operate without external football APIs. Existing report/result confirmation and statistical authority remain unchanged.

The authoritative current scope and candidate/acceptance gate are in [integration policy](../../context/design/integrations.md); dashboard and postponement policies are owned by existing UC documents. No new actor, UC, library, API integration or implementation is approved here.
