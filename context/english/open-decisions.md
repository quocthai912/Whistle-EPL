# Unresolved decisions

This register contains only unresolved work. O identifiers retain their source provenance; each row is OPEN for the remaining scope shown, not for already confirmed policy. Use the [decision index](design/README.md#confirmed-decisions) for [D001](design/architecture.md#d001---modular-layered-monolithic-backend)-[D068](use-cases/publication.md#d068---public-season-overview-dashboard) and the owning documents for current rules. Contract elaboration does not automatically require another business approval.

| ID | Source | Remaining work |
|---|---|---|
| O01 | QĐ1.3-1.4 p.6; UC11 p.95 | Concrete initial-season U21/qualifying-age configuration and detailed evidence field/format validation. |
| O02 | QĐ1.5-1.6 p.7; UC08/10/11 | Concrete calendars; exception/action codes; editing/cancelling future registration plans, quota checks across planned intervals, season closure and detailed correction contracts. |
| O03 | QĐ2.4-2.5 p.7; UC13 p.101 | Initial-season planning-minute values and detailed temporal/schema/concurrency enforcement. |
| O04 | BM4.2-4.3 pp.8-9; BM-05 pp.21/23 | Exact UI/API/export field contracts, log/history payload filtering, portrait-specific visibility/history and public media delivery details. |
| O05 | QĐ5.3/5.5 p.10; BM5.3 | Head-to-head and multi-club tie calculation, qualification/relegation parameters, playoff recording/resolution, season-summary approval and reopening. |
| O06 | QĐ5.7 p.11; UC20 p.122 | Detailed clean-sheet/award aggregation, correction and report contracts. |
| O07 | QĐ6 p.11; UC06 pp.80-81 | Initial effective-version absence, baseline/conflict checks, technical activation failure/retry handling, precise lifecycle/time contracts and remaining regulation publication details. |
| O08 | PDF pp.42-46/60; UC03/08/13/14/17-19 | Complete action matrix, first-season creation authority, remaining account lifecycle/password behavior, precise workflow/error codes and pending-work/concurrency contracts. |
| O09 | BM1-BM3; PDF pp.37-38; UC07-UC20 | Remaining type/length/normalization/position catalogs, business-code generation, duplicate-event handling, source-reference formats and exact snapshot/correction/API fields. |
| O10 | TH-02 p.13; UC13 pp.101-102 | Generation algorithm and regeneration/version/match-identity technical contracts. |
| O11 | TT-03 p.19; HQ-04 p.16; UC22 p.128 | Datasets, CSV/XLSX selection, report formats, templates/columns, permissions, duplicate/error/partial-import policy and exported-image inclusion. |
| O12 | CN-01-CN-04 p.26; BM-03 p.23; TT-04 p.19 | Module seams/dependencies, ERD/schema/key types, detailed REST/auth/session/password-hash/encoding/transport/audit/transaction/error contracts. |
| O13 | HQ-01-04 p.16; TT-01 p.19; BM-01 p.23; TD-01 p.29 | Deployment/browser/load/measurement environment and representative datasets, including exact hundreds-of-player count and authorized media fixtures. Preserve original thresholds. |
| O14 | BM-06/BM-07 p.24; TH-06 p.14 | Durable storage/deployment paths, metadata-plus-file backup/restore mechanics, access, verification and log/media retention/cleanup. Preserve 24 hours/7 backups/30 minutes. |
| O15 | UC24-25 pp.134-139; Figs.2.53-2.55 | News fields/statuses, withdrawal, seasonal/general association and publish permissions. Managed club/player media does not authorize news attachments, email, push or comments. |
| O16 | Figs.2.27/2.28 p.97; 2.42/2.44/2.45/2.49/2.51 | Chapter 3 cross-check of UC11 as UC10 validation and inclusion of clean sheets/other source metrics; analysis diagrams are not approved APIs/schema. |

## Media, postponement and dashboard questions

- Portrait-specific format/byte/pixel limits, action/retention/history policy and media delivery contracts remain open.
- Media acquisition/provenance, API contracts and operational details remain open under INT-01. Highlightly is preferred; API-FOOTBALL and football-data.org are reference candidates. Provider research/selection waits for independent core acceptance.

## Resolution and updates

Keep only unresolved work here. Approved scope/history is indexed in [design navigation](design/README.md); LS-01 is closed and creates no interview, implementation or mandatory acceptance work. Preserve PDF/Git and evidence-based Phase status.
