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
