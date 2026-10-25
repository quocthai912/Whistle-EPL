# Whistle-EPL Context Package

**Current version:** v2 | **Status:** DRAFT - PARTIALLY CONFIRMED | **Whole-package approval:** PENDING

**Approved v1 milestone:** Team Leader, 2026-10-24; reviewed commit `adad61f2a0625d62538aa10ce0ec8b6a91defa53`, branch `docs/build-agent-context`. Retrieve with `git show adad61f2a0625d62538aa10ce0ec8b6a91defa53:context/english/README.md`.

One evolving package has equivalent English/Vietnamese views. Individual decisions are approved as recorded; unresolved design and whole-v2 approval remain pending. Documentation is not software implementation or acceptance.

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
| Technical/design topics or [D001](design/architecture.md#d001---modular-layered-monolithic-backend)-[D068](use-cases/publication.md#d068---public-season-overview-dashboard) | [Design navigation and index](design/README.md) |
| Media or future external APIs | [Media](design/media.md), [integration](design/integrations.md) |
| Quality, acceptance or Phase selection | [Quality](quality.md), [Progress Checker](progress-checker.md) |
| Unresolved work | [Open decisions](open-decisions.md) |
| Citations and approval evidence | [Sources](sources.md) |

## Authority and workflow

Direct Team Leader instructions govern the work. The unchanged PDF supplies source requirements; current owner documents mark approved refinements with stable decision IDs. Use source pages and [traceability](sources.md); report unapproved conflicts instead of inventing rules. Source actor/UC/BM/QĐ/quality codes remain stable.

After the required decisions are approved: Phase -> Specification -> Plan -> Tasks -> approved task Issues -> Implementation -> Testing and Acceptance. [Issue conventions](../../docs/agents/issue-tracker.md) apply before ticket work. PHASE 1-PHASE 10 are project Phases, distinct from Spec Kit task phases. Status/checkbox changes require actual evidence.

## Current package maintenance

DOCS-01, approved by the Team Leader on 2026-10-26 (Asia/Bangkok): versions are milestones of this one package, preserved in Git, not parallel document sets. Each rule has one owner. README files route readers and hold the existing decision index; GLOSSARY defines terms; English ADRs record decisions, rationale and approval/source evidence; open-decisions contains unresolved work only. Update the owner and all affected links/UC/Phase references together; do not maintain duplicate current policy.

Keep English/Vietnamese structures and meanings equivalent. Default agent entry is English; read Vietnamese when requested or resolving translation/business ambiguity. Preserve the PDF and Git history, including the v1 approval; never imply whole-v2 approval or software completion from individual confirmations. The latest reorganization authorization supersedes earlier instructions to freeze v1 working files.
