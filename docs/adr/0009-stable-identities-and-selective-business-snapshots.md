# ADR 0009 - Stable master identities and selective official-business snapshots

Current package approval: [Q98 approved v2](../../context/README.md#q98---whole-package-approval). Earlier pending/open statements below are historical interview evidence; current rules remain in their linked owners.

**Scope supersession, 2026-10-26:** [LS-01 / ADR 0017](0017-live-score-excluded-from-first-version.md) excludes Live Score from the first version and cancels its interview/design/acceptance work. Earlier mentions below are historical, not an active backlog or future implementation commitment. The independent-core acceptance gate remains for media APIs only.

This ADR records decisions and rationale; authoritative current rules are owned by [D035](../../context/business.md#d035---stable-master-identity-with-selective-snapshots-of-official-business-information), [D036](../../context/business.md#d036---correct-erroneous-master-data-with-separate-review-of-affected-business-records), [D058](../../context/business.md#d058---stable-business-codes-duplicate-review-and-temporal-shirt-number-uniqueness), [D059](../../context/business.md#d059---required-registration-data-and-official-snapshot-milestones). Historical open-point notes do not reopen subsequently confirmed policy.

## Registration snapshot fields and seasonal lookup

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q59, option A; Context decision [D059](../../context/business.md#d059---required-registration-data-and-official-snapshot-milestones).

At club-application approval preserve the approved version's club name/abbreviation, coach, home ground, representative details and proposed player list. At player-registration validity confirmation preserve name, birth date, nationality, position, shirt number, classifications and regulation/verification basis. Approved corrections create successor records while retaining old ones. Seasonal lookup uses season-recorded information including approved corrections, rather than automatically taking latest master descriptions; public/internal scope remains [D032](../../context/use-cases/publication.md#d032---public-information-boundary-including-player-dates-of-birth)/[D033](../../context/use-cases/publication.md#d033---internal-viewing-follows-business-responsibility).

Snapshots limited to references/conclusions with current descriptive lookup were considered. The Team Leader chose historical reproduction and stable seasonal views, accepting selective duplication and distinction from current master views. At Q59, exact schema/references, schedule/report snapshots and concurrency remained open; D082/D084/D095/D096 subsequently define their design contracts. Physical schema/API implementation and verification remain work. Required fields are recorded in [ADR 0011](0011-registration-windows-and-receipt-exceptions.md#required-fields-at-registration-milestones). See [Context v2 D059](../../context/business.md#d059---required-registration-data-and-official-snapshot-milestones).

## Business codes and suspected duplicates

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q58, option A; Context decision [D058](../../context/business.md#d058---stable-business-codes-duplicate-review-and-temporal-shirt-number-uniqueness).

Seasons, clubs, stadiums and players use unique, stable, non-reusable business codes within each entity group; names, abbreviations and birth dates do not replace codes. Reject code duplication. Matching normalized player name, birth date and nationality triggers staff review: reuse the old profile for the same person, or allow a distinct person's profile after confirmation with a recorded reason. Matching club/stadium names likewise require review rather than automatic identity equivalence. Do not automatically merge suspected duplicates or reassign references; automatic merging tools are outside first-version scope. Current name/number changes do not overwrite recorded history.

A hard player name/birth-date/nationality uniqueness constraint was considered. The Team Leader chose support for distinct people sharing attributes and avoided collecting additional identity papers solely for duplicate resolution, accepting staff verification and residual duplication risk. At Q58, code generation/format, database key types, normalization, detailed review UI and technical constraints remained open. D082/D084/D092/D095/D096 subsequently settle identifier, validation, relational and concurrency contracts; detailed UI, physical schema/API implementation and verification remain work. Shirt-number rules are recorded in [ADR 0011](0011-registration-windows-and-receipt-exceptions.md#shirt-number-constraints). See [Context v2 D058](../../context/business.md#d058---stable-business-codes-duplicate-review-and-temporal-shirt-number-uniqueness).

[D057](../../context/use-cases/registration.md#d057---independently-approved-correction-of-validated-registrations) subsequently settles registration-impact review ownership and independently approved correction in [ADR 0011](0011-registration-windows-and-receipt-exceptions.md#correction-of-validated-registrations). [D036](../../context/business.md#d036---correct-erroneous-master-data-with-separate-review-of-affected-business-records)'s master-correction policy remains unchanged; D059 and D095 subsequently define snapshot fields and historical record references. Detailed impact UI and physical schema/API implementation remain work.

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q35, option A; Context decision [D035](../../context/business.md#d035---stable-master-identity-with-selective-snapshots-of-official-business-information).

AT-04 (PDF p.32), TH-05/TH-06 (pp.13-14) and the master/seasonal distinction in section 1.3.4.1 (pp.37-38) require master changes not to distort earlier applications, schedules, results or reports. Keep stable identities for clubs, stadiums and players across seasons. At official business-recording milestones, retain selective snapshots needed to reproduce the corresponding historical records/reports. Updating a master must not automatically overwrite officially recorded historical information.

Versioning every master change and linking business records to versions was considered. The Team Leader chose stable identities and selective snapshots for simpler reproduction of official historical context, accepting selective duplication and explicit field/milestone design. A later club renaming should not silently replace the historical official name, while the club retains its identity. Corrections of official business data still require the corresponding authorized process, reason and history.

At Q35, exact snapshot fields/milestones/schema, regulation-version/report-regeneration relationships, API/display choices and consistency/concurrency remained open. D059/D082/D083/D084/D092/D095/D096 subsequently define these design contracts; physical schema/API implementation and verification remain work. [D036](../../context/business.md#d036---correct-erroneous-master-data-with-separate-review-of-affected-business-records) below settles the general correction policy for originally incorrect master information. This does not select identifier types, storage structures or full temporal-versioning technology. See [Context v2 D035](../../context/business.md#d035---stable-master-identity-with-selective-snapshots-of-official-business-information).

## Correction of erroneous master data and separate impact review

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** Q36, option A; Context decision [D036](../../context/business.md#d036---correct-erroneous-master-data-with-separate-review-of-affected-business-records).

An authorized master-record manager may correct originally incorrect information with a reason and supporting basis. Record before/after values, operator and time, and identify affected business records/operations for review. Preserve historical snapshots and official decisions until corrected through their corresponding authorized business processes. A master correction must not automatically cancel registrations, alter official results or change statistics.

New business work must recheck affected eligibility using corrected information instead of outdated validation results. Prior approval of the whole downstream correction plan was considered; the Team Leader instead chose timely correction of current master data with separate impact review, accepting a period with related records awaiting review. At Q36, impact mappings, basis format, review ownership/states, treatment of no-longer-eligible registrations, historical correction/public display, snapshot details and transaction/concurrency remained open. Subsequent D057/D059/D084/D092/D095/D096 define the approved correction, field, snapshot and transaction contracts; detailed UI, physical schema/API implementation and verification remain work. No upload mechanism, automatic disciplinary action or new workflow-state code is selected. See [Context v2 D036](../../context/business.md#d036---correct-erroneous-master-data-with-separate-review-of-affected-business-records).

### D035 english evidence

Current policy owner: [D035](../../context/business.md#d035---stable-master-identity-with-selective-snapshots-of-official-business-information). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to Q35, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O12; AT-04, PDF p.32; TH-05/TH-06, pp.13-14; master/seasonal object distinction in §1.3.4.1 pp.37-38; [D034](../../context/use-cases/administration.md#d034---separately-assigned-shared-master-record-management-permissions).

- **Alternatives/basis:** Stable master identities plus selective business snapshots versus versioning every master-record change and referencing the relevant master version. The Team Leader chose simpler reproduction of official historical context, accepting selective duplication and the need to define snapshot fields/milestones.

- **Record:** [ADR 0009](0009-stable-identities-and-selective-business-snapshots.md).

- **Affected Phases:** PHASE 2 club/stadium masters, PHASE 3 player/registration data, PHASE 4 schedules, PHASE 5 official results, PHASE 6/PHASE 7 historical lookup/reports and PHASE 10 integrity verification. No Phase status changes.

- **Historical Q35 open items:** Snapshot field sets/milestones/schema, detailed impact/review workflows under [D036](../../context/business.md#d036---correct-erroneous-master-data-with-separate-review-of-affected-business-records), relationship to regulation versions and report regeneration, API/display choices and consistency/concurrency mechanisms. No identifier type, storage structure or full temporal-versioning technology is selected.

### D036 english evidence

Current policy owner: [D036](../../context/business.md#d036---correct-erroneous-master-data-with-separate-review-of-affected-business-records). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** The Team Leader explicitly finalized Q36 option A before requesting a break and queuing Live Match Tracking / Live Score for later interview.

- **Source:** O09/O12; UC07 pp.82-84, UC09 pp.88-90 and UC12 pp.97-99; QĐ4.5, PDF p.9; TH-06 and AT-03/AT-04, pp.14/32; [D034](../../context/use-cases/administration.md#d034---separately-assigned-shared-master-record-management-permissions)/[D035](../../context/business.md#d035---stable-master-identity-with-selective-snapshots-of-official-business-information).

- **Alternatives/basis:** Correct the master with traceability and separately review affected business records versus block an impactful master correction until a correction plan is approved. The Team Leader chose timely correction of current information while preserving official history, accepting a period in which related records await review.

- **Record:** [ADR 0009](0009-stable-identities-and-selective-business-snapshots.md#correction-of-erroneous-master-data-and-separate-impact-review).

- **Affected Phases:** PHASE 2 masters/regulations, PHASE 3 profiles/registration, PHASE 4 schedules, PHASE 5 official results, PHASE 6/PHASE 7 lookup/reports and PHASE 10 integration/integrity verification. No Phase status changes.

- **Historical Q36 open items:** Impacted field/record mapping, supporting-basis format, review ownership/states, handling of registrations no longer eligible, historical correction/public display rules, snapshot details and transaction/concurrency contracts. No upload mechanism, automatic disciplinary action or new workflow-state code is selected.

### D058 english evidence

Current policy owner: [D058](../../context/business.md#d058---stable-business-codes-duplicate-review-and-temporal-shirt-number-uniqueness). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to grouped Q58, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”), confirming the proposed policy package.

- **Source:** O09/O12; UC05/UC07/UC09/UC10/UC12, BM1; [D035](../../context/business.md#d035---stable-master-identity-with-selective-snapshots-of-official-business-information)/[D055](../../context/use-cases/registration.md#d055---versioned-club-application-and-player-registration-workflows)-[D057](../../context/use-cases/registration.md#d057---independently-approved-correction-of-validated-registrations).

- **Alternatives/basis:** Stable codes plus reviewable duplicate warnings versus hard-blocking identical player name/birth-date/nationality tuples; both used the same code/shirt rules. The Team Leader chose support for genuinely distinct people sharing attributes without collecting extra identity papers solely for duplicate resolution, accepting staff verification and residual duplicate risk.

- **Record:** [ADR 0009](0009-stable-identities-and-selective-business-snapshots.md#business-codes-and-suspected-duplicates); [ADR 0011](0011-registration-windows-and-receipt-exceptions.md#shirt-number-constraints).

- **Affected Phases:** PHASE 2 identities/masters, PHASE 3 registrations, PHASE 5 appearance/history integration and PHASE 10 duplicate/concurrency verification. No Phase status changes.

- **Historical Q58 open items:** Code generation/format and database key types, normalization rules, detailed fields and duplicate-review UI, historical snapshot contracts and technical concurrency enforcement.

### D059 english evidence

Current policy owner: [D059](../../context/business.md#d059---required-registration-data-and-official-snapshot-milestones). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to grouped Q59, the Team Leader selected option A: “Tôi chọn phương án A.” (“I choose option A.”), confirming the fields and snapshot package.

- **Source:** O04/O09/O12; BM1/BM4, UC05/UC07-UC12; [D032](../../context/use-cases/publication.md#d032---public-information-boundary-including-player-dates-of-birth)-[D036](../../context/business.md#d036---correct-erroneous-master-data-with-separate-review-of-affected-business-records)/[D054](../../context/use-cases/registration.md#d054---automatic-u21-assessment-and-evidence-based-staff-verification-of-homegrown-status)-[D058](../../context/business.md#d058---stable-business-codes-duplicate-review-and-temporal-shirt-number-uniqueness).

- **Alternatives/basis:** Milestone completeness and descriptive snapshots versus the same required fields with snapshots limited to references/conclusions and current descriptive lookup. The Team Leader chose reproduction of approved records and stable seasonal views, accepting selective duplication and separation of current versus season-recorded information.

- **Record:** [ADR 0009](0009-stable-identities-and-selective-business-snapshots.md#registration-snapshot-fields-and-seasonal-lookup); [ADR 0011](0011-registration-windows-and-receipt-exceptions.md#required-fields-at-registration-milestones).

- **Affected Phases:** PHASE 2 master/season fields, PHASE 3 intake/snapshots, PHASE 6 seasonal lookup and PHASE 10 validation/history verification. No Phase status changes.

- **Historical Q59 open items:** Detailed types/lengths/formats and normalization, position/nationality representations, exact snapshot schema/record references, schedule/report snapshot contracts and implementation-level concurrency. No upload technology or identity-document collection is selected.

## Q92 - Shared fields and reference catalogs

**Status:** accepted. **Decision:** D092. **Approver:** Team Leader. The Team Leader explicitly approved Q92 option A and the entire common package, with the sole adjustment replacing the proposed GK/DF/MF/FW catalog with GK, LB, CB, RB, CDM, CM, CAM, LW, LM, RW, RM, ST, CF. [D092](../../context/business.md#d092---shared-field-validation-identifiers-and-reference-catalogs) is the current owner of the shared field/catalog contract.

Choose common backend-authoritative validation, explicitly supplied business codes and controlled catalogs rather than generated codes and user-maintained catalog CRUD. This reduces first-version configuration and inconsistent manual/API/XLSX behavior, accepting prescribed formats and reference-data preparation. The approved package covers NFC and code-point limits, name/multiline handling, per-group field limits, uppercase stable codes, the amended 13 positions for separately recorded profile/report positions, controlled nationality labels/codes, verified personnel identity fields, username format, phone/birth-date validation and D058 warning-based duplicate review. D031 and the D008 CLI receive personnel-code/full-name inputs without weakening bootstrap safety. Only GK denotes the D064 goalkeeper. No new nationality standard, identity-document requirement, HR integration, broad-position mapping, password transformation or silent historical rewrite is approved. At Q92, the complete nationality list and physical/API/error mappings awaited elaboration and package review. D095/D096 subsequently define relational and execution contracts, and Q98 approves the complete package including the 253-key nationality catalog. Only physical schema/API implementation, exact mappings within those contracts and verification remain work.
