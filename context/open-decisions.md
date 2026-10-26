# Unresolved decisions

This register contains only unresolved work. O identifiers retain their source provenance; each row is OPEN for the remaining scope shown, not for already confirmed policy. Use the [decision index](design/README.md#confirmed-decisions) for [D001](design/architecture.md#d001---modular-layered-monolithic-backend)-[D097](design/architecture.md#d097---pnpm-toolchain-development-quality-and-reference-operations) and the owning documents for current rules. Contract elaboration does not automatically require another business approval.

## Actual inputs and unexecuted preparation

The following items remain open as operational inputs or concrete implementation/verification deliverables, not new unapproved replacements for settled business policy. Project-specific feature Specifications/Plans will elaborate approved contracts when separately authorized. Original O source identifiers remain traceable in sources/ADRs/owners; resolved design questions are not maintained as open decisions.

| ID | Source | Remaining input or evidence |
|---|---|---|
| O01 | QĐ1.3-1.4 p.6; UC11 p.95 | Real operational-season cutoff/qualifying-age values and evidence. D097 fixes the isolated test values only; operational values still need UC06 approval. |
| O02 | QĐ1.5-1.6 p.7; UC08/10/11 | Real operational intake calendars and individual case evidence. D053/D055/D056/D075/D096 settle receipt/lifecycle/execution; D097 supplies test windows. |
| O03 | QĐ2.4-2.5 p.7; UC13 p.101 | Real operational planning duration/buffers approved through UC06 before the D061 freeze. D097 fixes test values; no silent operational defaults. |
| O05 | QĐ5.3/5.5 p.10; BM5.3 | Real operational Q/R configuration/source basis and UC06 approval. D070-D074 settle ranking/summary/lifecycle; D097 fixes Q=4/R=3 for tests. |
| O08 | PDF pp.42-46/60; UC03/08/13/14/17-19 | Pin/check the selected local blocklist revision/checksum/license and actual credential-handoff runbook; implement/verify the approved D081/D096/D097 account/security contract. |
| O09 | BM1-BM3; PDF pp.37-38; UC07-UC20 | Physical SQL/Prisma and DTO implementations must preserve D092-D096 typed fields, snapshots, identity and scope. |
| O11 | TT-03 p.19; HQ-04 p.16; UC22 p.128 | Produce actual versioned XLSX template/report artifacts and executable bounded-parser/field-preservation verification using D078/D091/D097. Formats/limits/libraries/authority are selected; outputs are not implemented. |
| O12 | CN-01-CN-04 p.26; BM-03 p.23; TT-04 p.19 | PHASE 1 chooses and locks the exact Node-24-compatible pnpm/package/image versions and proves imports/native installation/build/lint/typecheck. Physical schema, transaction/guard/controller implementations and their tests remain unexecuted under D095-D097. |
| O13 | HQ-01-04 p.16; TT-01 p.19; BM-01 p.23; TD-01 p.29 | Record actual machine/browser/patch versions, fixture manifest/authorized assets and measured results. D090/D097 select scale, sample parameters, tools and measurement profile; they do not supply performance evidence. |
| O14 | BM-06/BM-07 p.24; TH-06 p.14 | Supply actual deployment domain/certificates/trusted proxy/credentials/off-host destination and provider configuration; implement/run restore/cleanup/timer drills under D087-D089/D094/D097. No provider/domain is implicitly purchased or selected. |
| O16 | Figs.2.27/2.28 p.97; 2.42/2.44/2.45/2.49/2.51 | Chapter 3 writers retain figure/page traceability using their original hash-checked PDF. Current design treats UC11 as UC10 validation and includes source clean sheets; original analysis figures are not implementation APIs/schema. The PDF is intentionally not in this checkout. |

## Later external-media gate

Authorized asset sources/usage rights, actual fixture contents and optional selected-storage runtime settings must be supplied before their acceptance checks. Football/media-data API provider research and selection remain intentionally deferred under INT-01 until independent core acceptance; Highlightly is preferred and API-FOOTBALL/football-data.org remain references, not approved providers. This later research is not a missing first-version core API dependency. LS-01 is closed/excluded and creates no future implementation commitment.

## Resolution and evidence

Use the [confirmed decision index](design/README.md#confirmed-decisions) and owning rules, rather than reopening earlier interview-time uncertainty. Record operator values, future approved changes and real implementation/acceptance evidence in their owning documents when available. Preserve PDF/Git provenance and Phase status; do not mark unexecuted work complete or treat package approval as authorization to create code/Specs/Tasks/Issues in this interview.
