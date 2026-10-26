# Unresolved decisions

This register contains only unresolved work. O identifiers retain their source provenance; each row is OPEN for the remaining scope shown, not for already confirmed policy. Use the [decision index](design/README.md#confirmed-decisions) for [D001](design/architecture.md#d001---modular-layered-monolithic-backend)-[D091](business.md#d091---fixed-xlsx-templates-and-bounded-data-exchange) and the owning documents for current rules. Contract elaboration does not automatically require another business approval.

| ID | Source | Remaining work |
|---|---|---|
| O01 | QĐ1.3-1.4 p.6; UC11 p.95 | Concrete initial-season U21/qualifying-age configuration and detailed evidence field/format validation. |
| O02 | QĐ1.5-1.6 p.7; UC08/10/11 | Concrete calendars; exception/action codes and detailed registration-plan/correction fields, lifecycle/API/concurrency contracts. |
| O03 | QĐ2.4-2.5 p.7; UC13 p.101 | Initial-season planning-minute values and detailed temporal/schema/concurrency enforcement. |
| O04 | BM4.2-4.3 pp.8-9; BM-05 pp.21/23 | Exact UI/API/export field contracts, log/history payload filtering, public media delivery details and remaining media technical contracts. |
| O05 | QĐ5.3/5.5 p.10; BM5.3 | Concrete seasonal Q/R values and remaining summary/ranking-resolution/season-lifecycle field/validation/API/concurrency contracts. |
| O06 | QĐ5.7 p.11; UC20 p.122 | Exact aggregate fields/source markers/indexes, clean-sheet/award validation and recalculation/recovery/API/concurrency/report contracts. Storage/full-season recalculation follows D083. |
| O07 | QĐ6 p.11; UC06 pp.80-81 | Detailed baseline/conflict/activation lock and error mappings, precise lifecycle fields and remaining publication contracts. D089 settles periodic discovery, overdue processing, technical recovery and stale-basis blocking; D051 retains business-incompatible activation policy. |
| O08 | PDF pp.42-46/60; UC03/08/13/14/17-19 | Complete action matrix, precise account/password/reset/throttling field/error/concurrency contracts and remaining workflow contracts. Credential lifecycle and account history policy follow D081. |
| O09 | BM1-BM3; PDF pp.37-38; UC07-UC20 | Remaining type/length/normalization/position catalogs, business-code generation, duplicate-event handling, source-reference formats and exact snapshot/correction/API fields. |
| O10 | TH-02 p.13; UC13 pp.101-102 | Generation algorithm and regeneration/version/match-identity technical contracts. |
| O11 | TT-03 p.19; HQ-04 p.16; UC22 p.128 | Exact template-version metadata/error payloads, library/API/concurrency mappings and report layout. D091 settles template column sets, file/row/decompression limits, date/code/catalog handling, workbook safety, preview lifetime and export coverage; D078 retains scope/access/atomicity and image exclusion. |
| O12 | CN-01-CN-04 p.26; BM-03 p.23; TT-04 p.19 | Detailed module interfaces/dependencies and entity/field/index/constraint mappings, per-UC REST/DTO/session-schema/CSRF/password-hash-implementation/deployment/audit/transaction/error mappings under D085, including D084 guard/lock-order/receipt mappings. Session transport/storage/expiration are settled by D080. |
| O13 | HQ-01-04 p.16; TT-01 p.19; BM-01 p.23; TD-01 p.29 | Concrete deployment/browser/load/measurement parameters under the confirmed D087 Compose model, compatible tool versions under D086/D087 and concrete fixture manifests/seasonal test values and authorized media assets under D090. The minimum 600-profile full-season baseline and dataset separation are settled. Preserve original thresholds. |
| O14 | BM-06/BM-07 p.24; TH-06 p.14 | Exact deployment/backup paths and destinations, timer/catch-up/alert/cleanup configuration and provider-specific script/transfer/verification mappings under D087-D089/media policy, plus log retention. Coordinated backup sets, write maintenance, off-host Internet copies, restore/session invalidation and backup retention/verification policy are settled by D088; preserve 24 hours/7 backups/30 minutes. |
| O15 | UC24-25 pp.134-139; Figs.2.53-2.55 | Exact news field lengths, storage/version/API/error/concurrency and audit payload contracts. Business scope/publication/version rules are settled by D077. |
| O16 | Figs.2.27/2.28 p.97; 2.42/2.44/2.45/2.49/2.51 | Chapter 3 cross-check of UC11 as UC10 validation and inclusion of clean sheets/other source metrics; analysis diagrams are not approved APIs/schema. |

## Media, postponement and dashboard questions

- Exact media delivery, provider-specific storage/cleanup/backup implementation configuration, concrete D090 fixture contents and authorized asset sources remain open; portrait policy is settled by D069, storage options by D087 and coordinated backup/restore by D088.
- Media acquisition/provenance, API contracts and operational details remain open under INT-01. Highlightly is preferred; API-FOOTBALL and football-data.org are reference candidates. Provider research/selection waits for independent core acceptance.

## Resolution and updates

Keep only unresolved work here. Approved scope/history is indexed in [design navigation](design/README.md); LS-01 is closed and creates no interview, implementation or mandatory acceptance work. Preserve PDF/Git and evidence-based Phase status.
