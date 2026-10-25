# ADR 0009 - Stable master identities and selective official-business snapshots

## Registration snapshot fields and seasonal lookup

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q59, option A; Context decision D059.

At club-application approval preserve the approved version's club name/abbreviation, coach, home ground, representative details and proposed player list. At player-registration validity confirmation preserve name, birth date, nationality, position, shirt number, classifications and regulation/verification basis. Approved corrections create successor records while retaining old ones. Seasonal lookup uses season-recorded information including approved corrections, rather than automatically taking latest master descriptions; public/internal scope remains D032/D033.

Snapshots limited to references/conclusions with current descriptive lookup were considered. The Team Leader chose historical reproduction and stable seasonal views, accepting selective duplication and distinction from current master views. Exact schema/references, schedule/report snapshots and concurrency remain open. Required fields are recorded in [ADR 0011](0011-registration-windows-and-receipt-exceptions.md#required-fields-at-registration-milestones). See [Context v2 D059](../../context/english/design/README.md#d059---required-registration-data-and-official-snapshot-milestones).

## Business codes and suspected duplicates

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q58, option A; Context decision D058.

Seasons, clubs, stadiums and players use unique, stable, non-reusable business codes within each entity group; names, abbreviations and birth dates do not replace codes. Reject code duplication. Matching normalized player name, birth date and nationality triggers staff review: reuse the old profile for the same person, or allow a distinct person's profile after confirmation with a recorded reason. Matching club/stadium names likewise require review rather than automatic identity equivalence. Do not automatically merge suspected duplicates or reassign references; automatic merging tools are outside first-version scope. Current name/number changes do not overwrite recorded history.

A hard player name/birth-date/nationality uniqueness constraint was considered. The Team Leader chose support for distinct people sharing attributes and avoided collecting additional identity papers solely for duplicate resolution, accepting staff verification and residual duplication risk. Code generation/format, database key types, normalization, detailed review UI and technical constraints remain open. Shirt-number rules are recorded in [ADR 0011](0011-registration-windows-and-receipt-exceptions.md#shirt-number-constraints). See [Context v2 D058](../../context/english/design/README.md#d058---stable-business-codes-duplicate-review-and-temporal-shirt-number-uniqueness).

D057 subsequently settles registration-impact review ownership and independently approved correction in [ADR 0011](0011-registration-windows-and-receipt-exceptions.md#correction-of-validated-registrations). D036's master-correction policy remains unchanged; detailed impact fields and historical display remain open.

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q35, option A; Context decision D035.

AT-04 (PDF p.32), TH-05/TH-06 (pp.13-14) and the master/seasonal distinction in section 1.3.4.1 (pp.37-38) require master changes not to distort earlier applications, schedules, results or reports. Keep stable identities for clubs, stadiums and players across seasons. At official business-recording milestones, retain selective snapshots needed to reproduce the corresponding historical records/reports. Updating a master must not automatically overwrite officially recorded historical information.

Versioning every master change and linking business records to versions was considered. The Team Leader chose stable identities and selective snapshots for simpler reproduction of official historical context, accepting selective duplication and explicit field/milestone design. A later club renaming should not silently replace the historical official name, while the club retains its identity. Corrections of official business data still require the corresponding authorized process, reason and history.

Exact snapshot fields/milestones/schema, regulation-version/report-regeneration relationships, API/display choices and consistency/concurrency remain open. D036 below settles the general correction policy for originally incorrect master information. This does not select identifier types, storage structures or full temporal-versioning technology. See [Context v2 D035](../../context/english/design/README.md#d035---stable-master-identity-with-selective-snapshots-of-official-business-information).

## Correction of erroneous master data and separate impact review

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q36, option A; Context decision D036.

An authorized master-record manager may correct originally incorrect information with a reason and supporting basis. Record before/after values, operator and time, and identify affected business records/operations for review. Preserve historical snapshots and official decisions until corrected through their corresponding authorized business processes. A master correction must not automatically cancel registrations, alter official results or change statistics.

New business work must recheck affected eligibility using corrected information instead of outdated validation results. Prior approval of the whole downstream correction plan was considered; the Team Leader instead chose timely correction of current master data with separate impact review, accepting a period with related records awaiting review. Impact mappings, basis format, review ownership/states, treatment of no-longer-eligible registrations, historical correction/public display, snapshot details and transaction/concurrency remain open. No upload mechanism, automatic disciplinary action or new workflow-state code is selected. See [Context v2 D036](../../context/english/design/README.md#d036---correct-erroneous-master-data-with-separate-review-of-affected-business-records).
