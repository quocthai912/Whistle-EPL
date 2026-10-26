# Domain docs

## Layout

Single business context, documented only in English:

- Project glossary: [context/GLOSSARY.md](../../context/GLOSSARY.md).
- Architecture decision records in docs/adr/.

## Before exploring

Read only the English Context documents, glossary and ADRs relevant to the
area being explored. The [English Context](../../context/README.md)
is the sole current package; follow Progressive Disclosure and Single Source of Truth.
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

Use [design navigation](../../context/design/README.md) to select the owning domain document. Each [D001](../../context/design/architecture.md#d001---modular-layered-monolithic-backend)-[D097](../../context/design/architecture.md#d097---pnpm-toolchain-development-quality-and-reference-operations) rule has one owner; ADRs preserve decisions/rationale and approval evidence. README is navigation, GLOSSARY defines terms, and [open-decisions](../../context/open-decisions.md) contains unresolved work only. V1 is retrieved from Git history, not a parallel current document set.
