## Agent skills

### Default Agent Context (Codex and Antigravity)

Before business analysis, planning, implementation, or acceptance work,
start at [context/README.md](context/README.md). Load only
English documents relevant to the selected Phase or Use Case. Use its source hierarchy,
PDF traceability, and open-decision register; keep unresolved decisions open.
For Phase selection and evidence-based completion, use
[context/progress-checker.md](context/progress-checker.md).
English Context is the sole current Context Package for humans and agents.
Project Phase IDs use `PHASE 1`, etc.;
these are distinct from the internal phases of Spec Kit `tasks.md`.
The current Context Package is v2, APPROVED by the Team Leader through Q98 on 2026-10-26, including D001-D097, 25 Use Cases and the 253-key nationality catalog. Versions are milestones of one evolving package; update the owning English documents and preserve approval history in Git. Context Package `v1` was `APPROVED` by Team Leader on `2026-10-24`.
Reviewed Commit: `adad61f2a0625d62538aa10ce0ec8b6a91defa53`;
Branch: `docs/build-agent-context`. Approval covers the business-requirements foundation,
document structure, traceability, and Phase decomposition only. The v1 approval alone satisfies only its historical G0 document condition. Q98 separately records v2 document approval. Neither approval establishes software implementation/acceptance or waives Phase-specific dependencies, remaining operator inputs and required evidence. Preserve Phase statuses and checkboxes.

### Documentation maintenance

Maintain the current Context Package only in [context/](context/README.md),
following its source hierarchy, Progressive Disclosure and Single Source of Truth.
Preserve Phase checklist items, evidence and statuses. The original approved
Vietnamese PDF remains authoritative for source business requirements; Git
preserves earlier Context milestones and approval evidence. Report unresolved
source/business conflicts rather than choosing without evidence. Consult the
[English glossary](context/GLOSSARY.md).

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

For current rule ownership and the [D001](context/design/architecture.md#d001---modular-layered-monolithic-backend)-[D097](context/design/architecture.md#d097---pnpm-toolchain-development-quality-and-reference-operations) index, use [design navigation](context/design/README.md). README routes readers, the single-language glossary defines terms, English ADRs retain rationale/approval evidence, and open-decisions contains only unresolved work. Load the selected owner rather than all decision records. Versions are Git milestones; do not maintain parallel version copies.
