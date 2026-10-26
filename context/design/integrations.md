# External media integration gates

**Current policy:** INT-01 retained for media and refined by LS-01, confirmed by the Team Leader on 2026-10-26 (Asia/Bangkok). No football/media-data provider is approved; no API integration is authorized in the Context stage.

The [D087 media storage amendment](media.md#environment-specific-media-storage) permits Supabase Storage as optional Internet file storage. It is separate from the data-acquisition providers/gate below and changes neither application authentication nor the prohibition on implementing integrations during this Context stage. Storage availability/fallback is verified for the selected deployment profile; references below to external outages concern football/media-data acquisition.

## INT-01 - Acceptance before API research and integration

1. Keep architecture extensible for external media data while core club, logo, player-profile and portrait operations remain independent.
2. Build, test and accept those core functions independently before researching, experimenting with and selecting an image-data API. External connectivity is not a core acceptance prerequisite.
3. Highlightly remains the preferred later trial candidate. API-FOOTBALL and football-data.org are reference candidates. These names come from the Team Leader's instruction, not current provider verification or approval.
4. Research/selection remain after independent core acceptance; no football/media-data provider, SDK or integration is selected now.
5. Stable operation during external outages, data/image usage rights, provenance, validation and authorized application remain required.
6. Future media supplementation does not authorize automated writes to fixtures, reports, Official Results, standings or statistics.

See [ADR 0016](../../docs/adr/0016-core-acceptance-before-external-integration.md) for the original gate and [ADR 0017](../../docs/adr/0017-live-score-excluded-from-first-version.md) for the superseding Live Score scope decision.

## V2-EXT-01 - Live Match Tracking / Live Score

**Status:** EXCLUDED_FROM_FIRST_VERSION. **Interview:** CANCELLED. **Decision:** LS-01, approved by the Team Leader and members, communicated on 2026-10-26.

Live Score was previously considered after Q36. The group has now removed its implementation, detailed design, mapping/provider/refresh questions, integration plan and mandatory acceptance from the current first-version scope. Do not continue interviewing or designing it in Context v2. This is not an automatic Future Enhancements commitment; reconsideration needs a new group decision.

The group's stated reasons are continuous API/request demands, no verified free option meeting stable continuous-update needs, and disproportionate synchronization, mapping, failure, latency and supplier-dependency complexity for SE104. These are the group's reported rationale, not a new external-provider investigation.

The exclusion does not remove external-media extensibility or independent managed media requirements. Historical discussions remain in Git/ADRs and do not create current pending work. [Postponement](../use-cases/scheduling.md#postpone-01---first-version-match-postponement) and the [dashboard](../use-cases/publication.md#dashboard-01---season-overview-dashboard) are internal first-version functions, not Live Score substitutes.

Mandatory media requirements remain in [media management](media.md).
