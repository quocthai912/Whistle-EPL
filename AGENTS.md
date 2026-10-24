## Agent skills

### Default Agent Context (Codex and Antigravity)

Before business analysis, planning, implementation, or acceptance work,
start at [context/english/README.md](context/english/README.md). Load only
English documents relevant to the selected Phase or Use Case. Use its source hierarchy,
PDF traceability, and open-decision register; keep unresolved decisions open.
For Phase selection and evidence-based completion, use
[context/english/progress-checker.md](context/english/progress-checker.md).
Read Vietnamese context only when requested by the user or when resolving
a translation issue or business ambiguity against the source; do not load
both language sets automatically. Project Phase IDs use `PHASE 1`, etc.;
these are distinct from the internal phases of Spec Kit `tasks.md`.
Context Package `v1` is `APPROVED` by Team Leader on `2026-10-24`.
Reviewed Commit: `adad61f2a0625d62538aa10ce0ec8b6a91defa53`;
Branch: `docs/build-agent-context`. Approval covers the business-requirements foundation,
document structure, traceability, and Phase decomposition only. It satisfies
only the v1 approval condition in G0; v2 decisions and implementation
dependencies remain required. It does not approve Context v2, authorize
unsettled technical choices, resolve Open Decisions, or establish software
implementation or acceptance. Preserve Phase statuses and checkboxes.

### Human Documentation and bilingual maintenance

[context/vietnamese/README.md](context/vietnamese/README.md) is the human
entry point. Keep both language sets semantically equivalent in the same
change, including Phase checklist items, evidence, and status. They are two
language views of one Phase ledger, not independent progress sources.
The approved Vietnamese PDF remains authoritative for business requirements.
Report unresolved translation or business conflicts rather than choosing
a version without evidence. Consult the glossary in the selected language.

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
