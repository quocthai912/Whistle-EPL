# Whistle-EPL Context Package

**Current version:** v2 | **Status:** APPROVED | **Whole-package approval:** Q98, Team Leader, 2026-10-26 (Asia/Bangkok)

**Documentation verification:** COMPLETE after relocation, three independent reviews and final integrity checks. This is not software implementation or acceptance.

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
