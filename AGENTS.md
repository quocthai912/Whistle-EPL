## Agent skills

### Default Agent Context (Codex and Antigravity)

Before business analysis, planning, implementation, or acceptance work,
start at [context/english/README.md](context/english/README.md). Load only
English documents relevant to the selected Phase or Use Case. Use its source hierarchy,
PDF traceability, and open-decision register; keep unresolved decisions open.
For Phase selection and evidence-based completion, use
[context/english/progress-checker.md](context/english/progress-checker.md).
English Context is the sole current Context Package for humans and agents.
Project Phase IDs use `PHASE 1`, etc.;
these are distinct from the internal phases of Spec Kit `tasks.md`.
The current Context Package is v2 under development, with individually confirmed decisions and whole-package approval pending. Versions are milestones of one evolving package; update the owning English documents and preserve approval history in Git. Context Package `v1` was `APPROVED` by Team Leader on `2026-10-24`.
Reviewed Commit: `adad61f2a0625d62538aa10ce0ec8b6a91defa53`;
Branch: `docs/build-agent-context`. Approval covers the business-requirements foundation,
document structure, traceability, and Phase decomposition only. It satisfies
only the v1 approval condition in G0; v2 decisions and implementation
dependencies remain required. It does not approve Context v2, authorize
unsettled technical choices, resolve Open Decisions, or establish software
implementation or acceptance. Preserve Phase statuses and checkboxes.

### Documentation maintenance

Maintain the current Context Package only in [context/english/](context/english/README.md),
following its source hierarchy, Progressive Disclosure and Single Source of Truth.
Preserve Phase checklist items, evidence and statuses. The original approved
Vietnamese PDF remains authoritative for source business requirements; Git
preserves earlier Context milestones and approval evidence. Report unresolved
source/business conflicts rather than choosing without evidence. Consult the
[English glossary](context/english/GLOSSARY.md).

### Issue tracker

Issues are tracked in GitHub Issues. Before reading or publishing tickets,
read `docs/agents/issue-tracker.md`.

Follow Specification-Driven Development:
Specifications → Tasks → Implementation.
Create one GitHub Issue per approved Task, referencing its Task and
Specification. Keep Issues consistent with tasks.md.

### Domain docs

Single-context layout. Before exploring the codebase,
read `docs/agents/domain.md`.

For current rule ownership and the [D001](context/english/design/architecture.md#d001---modular-layered-monolithic-backend)-[D096](context/english/design/architecture.md#d096---api-execution-synchronized-csrf-and-transaction-contracts) index, use [design navigation](context/english/design/README.md). README routes readers, the single-language glossary defines terms, English ADRs retain rationale/approval evidence, and open-decisions contains only unresolved work. Load the selected owner rather than all decision records. Versions are Git milestones; do not maintain parallel version copies.
