# ADR 0009 - Stable master identities and selective official-business snapshots

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q35, option A; Context decision D035.

AT-04 (PDF p.32), TH-05/TH-06 (pp.13-14) and the master/seasonal distinction in section 1.3.4.1 (pp.37-38) require master changes not to distort earlier applications, schedules, results or reports. Keep stable identities for clubs, stadiums and players across seasons. At official business-recording milestones, retain selective snapshots needed to reproduce the corresponding historical records/reports. Updating a master must not automatically overwrite officially recorded historical information.

Versioning every master change and linking business records to versions was considered. The Team Leader chose stable identities and selective snapshots for simpler reproduction of official historical context, accepting selective duplication and explicit field/milestone design. A later club renaming should not silently replace the historical official name, while the club retains its identity. Corrections of official business data still require the corresponding authorized process, reason and history.

Exact snapshot fields/milestones/schema, regulation-version/report-regeneration relationships, API/display choices and consistency/concurrency remain open. D036 below settles the general correction policy for originally incorrect master information. This does not select identifier types, storage structures or full temporal-versioning technology. See [Context v2 D035](../../context/english/design/README.md#d035---stable-master-identity-with-selective-snapshots-of-official-business-information).

## Correction of erroneous master data and separate impact review

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q36, option A; Context decision D036.

An authorized master-record manager may correct originally incorrect information with a reason and supporting basis. Record before/after values, operator and time, and identify affected business records/operations for review. Preserve historical snapshots and official decisions until corrected through their corresponding authorized business processes. A master correction must not automatically cancel registrations, alter official results or change statistics.

New business work must recheck affected eligibility using corrected information instead of outdated validation results. Prior approval of the whole downstream correction plan was considered; the Team Leader instead chose timely correction of current master data with separate impact review, accepting a period with related records awaiting review. Impact mappings, basis format, review ownership/states, treatment of no-longer-eligible registrations, historical correction/public display, snapshot details and transaction/concurrency remain open. No upload mechanism, automatic disciplinary action or new workflow-state code is selected. See [Context v2 D036](../../context/english/design/README.md#d036---correct-erroneous-master-data-with-separate-review-of-affected-business-records).
