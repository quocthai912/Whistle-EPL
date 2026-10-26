# ADR 0018 - XLSX create-only data exchange

Current package approval: [Q98 approved v2](../../context/README.md#q98---whole-package-approval). Earlier pending/open statements below are historical interview evidence; current rules remain in their linked owners.

**Status:** accepted. **Decision:** D078. The Team Leader selected Q78 option A ("Tôi chọn A."), approving the full common package. Authoritative policy is owned by [D078](../../context/business.md#d078---xlsx-create-only-import-and-controlled-export).

Choose XLSX as the single first-version exchange/report format rather than CSV, accepting a later spreadsheet-library choice in exchange for spreadsheet-oriented entry and multi-section report presentation. Limit imports to new club/stadium/player masters, without overwriting existing business codes or bypassing seasonal approvals. Preview then final revalidation and complete-file atomicity favor consistency over partial success, with D058 suspected-person warnings still reviewable under their approved rules.

Export permitted master fields and UC22 reports without embedded images or automatic external image downloads. This establishes no CSV/PDF requirement, library, integration or implementation. PHASE 9 dependencies resolve to PHASE 1/PHASE 2/PHASE 3/PHASE 4 for the selected master datasets; PHASE 7 continues to own UC22 exports. Quality thresholds, Phase statuses and checkboxes remain unchanged; exact technical/template/security contracts remain open.

## Q91 - Fixed templates and bounded processing

**Status:** accepted. **Decision:** D091. **Approver:** Team Leader. The Team Leader answered "Tôi chọn A." to Q91, approving the whole proposed package. [D091](../../context/business.md#d091---fixed-xlsx-templates-and-bounded-data-exchange) owns the detailed file/preview contract; D078's create-only scope, authority and atomicity remain unchanged.

Choose fixed versioned club/stadium/player templates and synchronous bounded processing rather than arbitrary interactive column mapping. This simplifies SE104 user guidance, validation and testing at the cost of template compliance and splitting large inputs. The approved package includes the D059 required-field column sets, order-independent exact headers, 5 MiB/1,000-data-row/50 MiB-decompressed limits, literal business codes and YYYY-MM-DD dates, catalog validation, rejection of unsafe workbook content, a 30-minute account/dataset/content-bound preview, temporary-upload cleanup and complete authorized exports with safe cell types. The import cap does not truncate reports. No XLSX library or new catalog values are selected; exact metadata/library/API/error/lock mappings and report layout remain elaboration. Original TT-03/HQ-04 thresholds and whole-v2/Phase approval status remain unchanged. Earlier open template/limit notes describe prior rounds, not the now-settled scope.

## Q97 - Selected XLSX implementation tools

The Team Leader approved [D097](../../context/design/architecture.md#d097---pnpm-toolchain-development-quality-and-reference-operations), selecting ExcelJS with yauzl/fast-xml-parser bounded ZIP/XML preflight. This settles the library choice left open in D078/D091 while preserving create-only scope, atomicity, templates, security/size limits and authorized export behavior. Exact versions and executable security/value-preservation checks remain PHASE 1/owning-Phase evidence; selecting a library does not prove those checks pass.
