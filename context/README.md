# Whistle-EPL Context Package

**Current version:** v2 | **Status:** APPROVED | **Whole-package approval:** Q98, Team Leader, 2026-10-26 (Asia/Bangkok)

**Approved extension:** D098 and PHASE 1 preparation clarifications, Q99-Q103 and final shared-understanding approval, Team Leader, 2026-10-28 (Asia/Bangkok). See [the extension record](#phase-1-preparation-approval---q99-q103); Q98 is not retroactive approval of this extension.

**Q98 documentation verification:** COMPLETE after relocation, three independent reviews and final integrity checks at that milestone. This is not software implementation or acceptance.

**Current implementation snapshot (2026-10-29):** PHASE 1 is `IN_PROGRESS`. T001–T014 are published on `feat/phase-1-core-foundation` at `892f172f9ec539d5789a31a2f8046480afe15772`; T015–T022 are implemented, verified and published at [`7ac09e6`](https://github.com/quocthai912/Whistle-EPL/commit/7ac09e6cec9fb434248c82db142ab04695961823) on `feat/phase-1-operations-recovery` (review base `30506e3`). The live remote ref and all 68 manifest entries match the published commit. See [operator evidence](../docs/verification/phase-1/operator-foundation.md). T023–T026 are implemented, verified and published at [`5cfa666`](https://github.com/quocthai912/Whistle-EPL/commit/5cfa666a7550c9b1d06cc21926dba7e2f27c1a26) on `feat/phase-1-authentication-backend` (review base `7e28810`); the live remote ref and all 28 authentication manifest entries match that commit (see [authentication evidence](../docs/verification/phase-1/authentication.md)); T027–T048 and Phase acceptance remain pending. The [Progress Checker](progress-checker.md#phase-1-execution-evidence---2026-10-29) owns statuses, checkboxes and evidence. Historical approvals remain unchanged; this is not a new Context version or Phase acceptance.

**Approved v1 milestone:** Team Leader, 2026-10-24; reviewed commit `adad61f2a0625d62538aa10ce0ec8b6a91defa53`, branch `docs/build-agent-context`. Retrieve with `git show adad61f2a0625d62538aa10ce0ec8b6a91defa53` and the historical commit tree.

One evolving, English-only Context Package is maintained in this directory for humans and agents. Q98 formally approves the complete v2 requirements/design baseline, D001-D097, all 25 Use Cases and the 253-key nationality reference catalog. Documentation is not software implementation or acceptance.

## Load by task

| Task | Read |
|---|---|
| Purpose, actors and object relationships | [Overview](project-overview.md) |
| Terms | [Glossary](GLOSSARY.md) |
| Rules, source forms and shared identity/fields | [Business](business.md) |
| Accounts, roles and shared permissions | [UC01-UC04](use-cases/administration.md) |
| Regulations, club/player profiles and registration | [UC05-UC11](use-cases/registration.md) |
| Stadiums, generation and adjustments | [UC12-UC15](use-cases/scheduling.md) |
| Reports, appearances, events and official results | [UC16-UC20](use-cases/results.md) |
| Public/internal lookup, ranks, reports and news | [UC21-UC25](use-cases/publication.md) |
| Technical/design topics or [D001](design/architecture.md#d001---modular-layered-monolithic-backend)-[D097](design/architecture.md#d097---pnpm-toolchain-development-quality-and-reference-operations) | [Design navigation and index](design/README.md) |
| Media or future external APIs | [Media](design/media.md), [integration](design/integrations.md) |
| Quality, acceptance or Phase selection | [Quality](quality.md), [Progress Checker](progress-checker.md) |
| CI/merge policy or PHASE 1 preparation readiness | [D098](design/architecture.md#d098---required-ci-and-protected-integration-branches), [readiness](progress-checker.md#phase-1-specification-readiness-and-foundation-verification) |
| Unresolved work | [Open decisions](open-decisions.md) |
| Citations and approval evidence | [Sources](sources.md) |

## Authority and workflow

Direct Team Leader instructions govern the work. The unchanged PDF supplies source requirements; current owner documents mark approved refinements with stable decision IDs. Use source pages and [traceability](sources.md); report unapproved conflicts instead of inventing rules. Source actor/UC/BM/QĐ/quality codes remain stable.

After the required decisions are approved: Phase -> Specification -> Plan -> Tasks -> approved task Issues -> Implementation -> Testing and Acceptance. [Issue conventions](../docs/agents/issue-tracker.md) apply before ticket work. PHASE 1-PHASE 10 are project Phases, distinct from Spec Kit task phases. Status/checkbox changes require actual evidence.

## Current package maintenance

DOCS-01, approved by the Team Leader on 2026-10-26 (Asia/Bangkok): versions are milestones of this one package, preserved in Git, not parallel document sets. Each rule has one owner. README files route readers and hold the existing decision index; GLOSSARY defines terms; English ADRs record decisions, rationale and approval/source evidence; open-decisions contains unresolved work only. Update the owner and all affected links/UC/Phase references together; do not maintain duplicate current policy.

The Team Leader approved English-only documentation on 2026-10-26 (Asia/Bangkok). This directory is the sole current Context Package; load only the English documents needed for the task, following Progressive Disclosure and Single Source of Truth. Earlier translations remain in Git history, without a parallel current copy or synchronization requirement. This organization change preserves all approved business/design decisions, source traceability and Phase evidence/statuses. Preserve the original Vietnamese PDF and Git history, including the v1 approval; distinguish the explicit Q98 whole-package approval from earlier individual confirmations and from software completion. The latest documentation policy supersedes earlier translation-maintenance requirements; the reorganization authorization permits current owner documents to evolve beyond the v1 Git milestone.

## Q98 - Whole-package approval

**Status:** APPROVED. **Approver:** Team Leader. **Date:** 2026-10-26 (Asia/Bangkok). **Evidence:** The Team Leader explicitly approved Q98 option A, the entire Whistle-EPL Context Package v2, D001-D097, all 25 Use Cases and the 253-key nationality catalog, then authorized flattening this directory and independent three-agent verification. Q98 is the package-approval record, not a new business/technology decision added to D001-D097.

This is the approved requirements/design baseline for Chapter 3 and subsequent separately authorized Phase -> Specification -> Plan -> Tasks -> Implementation work. It includes the indexed scope instructions, architecture/ERDs/data dictionary, authority/API/transaction/security/media rules and D097 development/test/operation baseline. Version milestones and the unchanged original PDF remain preserved through Git/source traceability; no commit or history rewrite is performed by this approval update.

Approval does not establish installed dependencies, compatible locked packages, a passing build, software testing/acceptance, official operational-season values or completed Phase work. All PHASE 1-PHASE 10 implementation statuses and 79 checkboxes remain unchanged. Deployment inputs and unexecuted verification remain in open-decisions. This interview does not authorize code, generated Specs/Tasks, Issues, starting a Phase or commit/push.

The Team Leader authorized the same English-only package to live directly under context/ with its existing relative domain structure; there is no parallel language/version package.

## PHASE 1 preparation approval - Q99-Q103

**Status:** APPROVED. **Approver:** Team Leader. **Date:** 2026-10-28 (Asia/Bangkok). Q99-Q103 and the final shared-understanding confirmation approve the [D098 CI/branch policy](design/architecture.md#d098---required-ci-and-protected-integration-branches) and [foundation verification allocation/readiness](progress-checker.md#phase-1-specification-readiness-and-foundation-verification). [ADR 0025](../docs/adr/0025-required-ci-and-protected-branches.md#approval-evidence) preserves the actual confirmations, amendments, alternatives and rationale.

This is an extension of one evolving package, not a new version copy or a change to Q98's historical scope. D001-D097, source thresholds, Phase implementation statuses and checkboxes are preserved. No new business glossary term or umbrella PHASE 1 ADR is introduced.

The Team Leader accepted the final summary and expressly required that no Specs be created. Authorization covers the minimal English decision-document updates only. It does not authorize Specifications, Plans, Tasks, Issues, application/database/CI workflow implementation, GitHub branch-settings changes, commit or push. Constitution ratification was handled through the separate governance approval below. Requirements readiness does not establish a passing build, configured protection or software acceptance.

## Constitution v1.0.0 ratification

**Status:** RATIFIED. **Approver:** Team Leader. **Date:** 2026-10-28 (Asia/Bangkok). After Q104A (risk-based testing), Q105C (agent review permitted, no mandatory human-review merge gate), Q106A (Team Leader amendment authority) and review clarifications for approved CLI/fixture controls and the dynamic decision index, the Team Leader explicitly stated: "tôi chính thức phê duyệt bản hiến chương này". [The Constitution](../.specify/memory/constitution.md) owns the adopted governance; this record establishes separate approval provenance, not a new architecture decision or retroactive Q98 approval.

The Constitution placeholder/ratification blocker is resolved. Future Plans must still execute their own Constitution Check. No Specs, Plans, Tasks, Issues, workflows or application artifacts are created by this approval; Phase implementation statuses, checkboxes, source thresholds and GitHub settings remain unchanged. Commit/push is not authorized by requesting a suggested commit message.
