# ADR 0016 - Accept independent core functionality before external integration

**Scope supersession, 2026-10-26:** [LS-01 / ADR 0017](0017-live-score-excluded-from-first-version.md) excludes Live Score from the first version and cancels its interview/design/acceptance work. Earlier mentions below are historical, not an active backlog or future implementation commitment. The independent-core acceptance gate remains for media APIs only.

This ADR records decisions and rationale; authoritative current rules are owned by [integration policy](../../context/english/design/integrations.md). Historical open-point notes do not reopen subsequently confirmed policy.

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Decision:** INT-01, explicit instruction after LOGO-01 approval.

Keep architecture extensible for future media supplementation and Live Score while operating core club/logo/player-profile/image functionality independently. Build, test and accept that core before researching, experimenting with and selecting an external API. No API is selected or integrated during the current Context stage. Highlightly is only the preferred later candidate.

External live scores/status/events are reference information: they do not automatically alter internal reports, Official Results, standings or statistics. Link external EPL data to internal matches only after verified correspondence. Respect data/image usage rights and retain stable core operation during API outages. Live Score implementation needs approved detailed requirements, API and scope.

The Team Leader chose independent core acceptance before provider research/integration rather than coupling first-version business acceptance to an external service. A pre-v2-approval integration interview may settle requirements and gates; it does not waive the post-core-acceptance provider-research gate. Detailed mapping, provider/API, contracts, licensing/provenance, refresh, failure and acceptance policies remain open. No provider library, adapter implementation or new mandatory Phase is selected.

See [integration register](../../context/english/design/integrations.md), [media policy](../../context/english/design/media.md) and [ADR 0015](0015-managed-club-logos-in-first-version.md).

## Q87 - Storage infrastructure clarification

[D087](../../context/english/design/architecture.md#d087---docker-compose-reference-deployment) subsequently permits optional Supabase Storage for Internet media files. This is a storage-location amendment recorded in [ADR 0015](0015-managed-club-logos-in-first-version.md#q87---environment-specific-media-storage-amendment), separate from this ADR's football/media-data acquisition gate. Core/media acceptance remains independent in the local profile; selected remote storage has its own authorization, failure/fallback and recovery verification. No football/media-data provider is approved or integrated by this amendment, and LS-01 remains unchanged.
