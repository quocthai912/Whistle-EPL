# Domain docs

## Layout

Single business context, with equivalent language views:

- Default agent glossary: [context/english/GLOSSARY.md](../../context/english/GLOSSARY.md).
- Human glossary: [context/vietnamese/GLOSSARY.md](../../context/vietnamese/GLOSSARY.md).
- Architecture decision records in docs/adr/.

## Before exploring

Read the English glossary and ADRs relevant to the area being explored.
Use the Vietnamese glossary only when requested or when checking a
translation or business ambiguity; do not load both languages by default.
Keep the two glossary versions semantically equivalent in the same change.
If they do not exist, proceed silently. The domain-modeling skill
creates them when terms or decisions are resolved.

## Vocabulary

Use the glossary's terms consistently in issues, proposals, and tests.
If a needed term is missing, reconsider the wording or note the gap
for domain-modeling.

## ADR conflicts

Explicitly identify any proposal that contradicts an existing ADR,
including the ADR reference and the reason to revisit it.

## Current rule ownership

Use [design navigation](../../context/english/design/README.md) to select the owning domain document. Each [D001](../../context/english/design/architecture.md#d001---modular-layered-monolithic-backend)-[D068](../../context/english/use-cases/publication.md#d068---public-season-overview-dashboard) rule has one owner; ADRs preserve decisions/rationale and approval evidence. README is navigation, GLOSSARY defines terms, and [open-decisions](../../context/english/open-decisions.md) contains unresolved work only. V1 is retrieved from Git history, not a parallel current document set.
