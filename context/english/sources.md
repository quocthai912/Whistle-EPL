# Sources, traceability and approval history

Current owner documents incorporate approved refinements. The v1 review/migration notes below are historical evidence, not a claim that current files are unchanged source transcriptions. Current decisions are indexed in [design navigation](design/README.md); open-decisions contains unresolved work only.

## PDF

Business source: `[SE104] - Báo Cáo Đồ Án - Nhóm 11.pdf`, Group 11, SE104.R13, report edition dated October 2026. All of Chapter 1 (pp.4-52) and Chapter 2 (pp.53-139) were read; pages 1-3 contain the cover/reviewer comments/contents. The PDF has 139 pages; printed labels match physical page numbers, counted from 1. `p.N`/`pp.N` in this Context always refer to those numbers; `§` identifies a report section rather than a Markdown section.

- SHA-256: `fc5252b97031fda2a710f8ab0e560b87e73c9098cb55de4b8d7a1a9dc5dccb79`.
- At the team leader's request, **the PDF is not included in the repository**. Members use their own copies and check the name/hash/page labels before following citations.

Text was extracted with pypdf and cross-checked with pdfplumber to handle layout spacing; pages containing forms and all Figures 1.1-1.6 and 2.1-2.55 were rendered/viewed. Very small sequence-diagram messages are not treated as APIs/implementation contracts; when writing Chapter 3, open the original figures at a suitable zoom and address discrepancies in the decision register. UC tables and clauses retain their complete content; removing headers/footers and joining wrapped lines are presentation changes.

## Organizational reference

Read through the GitHub connector on 24/10/2026 from [slop-loop](https://github.com/pminhtaiii/slop-loop/tree/development), branch `development`:

| Document read | Observed Git blob SHA | Applied principle |
|---|---|---|
| [AGENTS.md](https://github.com/pminhtaiii/slop-loop/blob/development/AGENTS.md) | `c1661be1cbdcf2df12f16d0b42ef8326ba9ddc44` | Point to Context before starting work |
| [context/README.md](https://github.com/pminhtaiii/slop-loop/blob/development/context/README.md) | `6993913ad4359014db016a3849b7ffd8dcdbb80c` | Task-triggered loading table and content ownership |
| [GLOSSARY.md](https://github.com/pminhtaiii/slop-loop/blob/development/GLOSSARY.md) | `ce4b7c535654599dd731895f328a28fc0b648c5e` | Centralized definitions distinguishing related terms |
| [docs/agents/domain.md](https://github.com/pminhtaiii/slop-loop/blob/development/docs/agents/domain.md), [ADR directory](https://github.com/pminhtaiii/slop-loop/tree/development/docs/adr), and [ADR 0001](https://github.com/pminhtaiii/slop-loop/blob/development/docs/adr/0001-uc03-scope-and-completion.md) | domain: `4032de016c1e91119d33d477633e2b8f265f4195`; ADR 0001: `efd2019cae07e7d3be38d79bc9072a4877bd5045` | One root glossary; ADRs in docs/adr only for accepted decisions, not open ideas recorded as decisions |
| [context/progress_checker.md](https://github.com/pminhtaiii/slop-loop/blob/development/context/progress_checker.md) | `882983646f4f099dc5f8cc776355f7817be9a003` | Separate targets from observations; date/revision/scope and real evidence support status |

This is a file-level snapshot of what was read, not a single-commit snapshot of the whole repository; the branch can continue to change. slop-loop's runtime/stack/domain, separate status set, paired-ticket workflow, multi-agent coordination, and automation scripts are not imported. Whistle-EPL uses the five statuses and Phase lifecycle requested by the team leader.

## Chapter 1 traceability matrix

| Source scope | Owning Context document | Phase / coverage |
|---|---|---|
| §1.1 pp.4-5: rationale, objectives, scope | [Project overview](project-overview.md) | Boundaries for every Phase; educational/background content does not automatically become new functionality |
| §1.2.1/Table 1.1 p.6: 6 business requirements | [Business](business.md) | Six requirements mapped to UC/BM/QĐ/Phase |
| BM1 p.6; QĐ1.1-1.6 pp.6-7 | [Business](business.md#qđ1), UC08-11 | PHASE 3; configuration in PHASE 2 |
| BM2/QĐ2.1-2.6 p.7 | [Business](business.md#qđ2), UC13-15 | PHASE 4; lookup in PHASE 6 |
| BM3 pp.7-8; QĐ3.1-3.6 p.8 | [Business](business.md#qđ3), UC16-20 | PHASE 5 |
| BM4.1-4.2 p.8, BM4.3-4.4/QĐ4.1-4.6 p.9 | [Business](business.md#qđ4), UC15/21/23 | PHASE 6; season/club/registration sources in PHASE 2/PHASE 3 |
| BM5.1 pp.9-10, BM5.2-5.3 p.10; QĐ5.1-5.7 pp.10-11 | [Business](business.md#qđ5), UC20/22 | PHASE 5 statistics, PHASE 7 reports |
| QĐ6.1-6.6 p.11 | [Business](business.md#qđ6), UC06 | PHASE 2; configuration use and regression in PHASE 3-PHASE 7/PHASE 10 |
| §1.2.2-8 pp.11-32: 34 quality codes | [Quality](quality.md) | Per-code matrix below; PHASE 10 verifies the whole |
| §1.3.1-3 pp.33-35; §2.1 p.53: model and 6 roles | [Project overview](project-overview.md), [glossary](GLOSSARY.md) | PHASE 1 permissions and checks in each Phase |
| §1.3.4 pp.36-39: 17 main objects and relationships | [Project overview](project-overview.md), glossary, detailed BM/UC | PHASE 2-PHASE 7; accounts/audit in PHASE 1; relationship preservation in PHASE 10 |
| §1.4 pp.39-49: processes, Figures 1.1-1.6 | [Project overview](project-overview.md), UCs, Progress Checker | PHASE 3 registration, PHASE 4 schedules, PHASE 5 results, PHASE 10 end-to-end flows |
| §1.5 pp.50-52: Modified Waterfall/10 weeks/change tracking | [Project overview](project-overview.md), [README](README.md), [Progress Checker](progress-checker.md) | Preserve the source plan; its 5 planning stages are not 5 functional Phases or evidence of progress |

## Matrix of 25 Use Cases and analysis figures

Each UC links to a record with complete actors, preconditions/postconditions, and flows. “Phase” indicates behavior ownership, not one Phase per UC. «include» relationships and conditional behavior appear in project-overview/open decisions.

| UC | Specification / reading group | Source §2.4.1 | Pages (including description and figures) | Figures | Phase |
|---|---|---|---|---|---|
| UC01 | [Log in](use-cases/administration.md#uc01) | 1 | 67-69 | 2.7-2.8 | PHASE 1 |
| UC02 | [Log out](use-cases/administration.md#uc02) | 2 | 69-71 | 2.9-2.10 | PHASE 1 |
| UC03 | [Manage accounts and roles](use-cases/administration.md#uc03) | 3 | 72-74 | 2.11-2.12 | PHASE 1 |
| UC04 | [Search activity logs](use-cases/administration.md#uc04) | 4 | 75-76 | 2.13-2.14 | PHASE 1 |
| UC05 | [Manage seasons](use-cases/registration.md#uc05) | 5 | 77-78 | 2.15-2.16 | PHASE 2 |
| UC06 | [Manage season regulations](use-cases/registration.md#uc06) | 6 | 79-82 | 2.17-2.18 | PHASE 2 |
| UC07 | [Manage clubs](use-cases/registration.md#uc07) | 7 | 82-84 | 2.19-2.20 | PHASE 2 |
| UC08 | [Manage club registration applications](use-cases/registration.md#uc08) | 8 | 85-88 | 2.21-2.22 | PHASE 3 |
| UC09 | [Manage player profiles](use-cases/registration.md#uc09) | 9 | 88-90 | 2.23-2.24 | PHASE 3 |
| UC10 | [Manage player registrations](use-cases/registration.md#uc10) | 10 | 91-94 | 2.25-2.26 | PHASE 3 |
| UC11 | [Check player registration eligibility](use-cases/registration.md#uc11) | 11 | 94-97 | 2.27-2.28 | PHASE 3 |
| UC12 | [Manage stadiums](use-cases/scheduling.md#uc12) | 12 | 97-99 | 2.29-2.30 | PHASE 2 |
| UC13 | [Create the match schedule](use-cases/scheduling.md#uc13) | 13 | 100-103 | 2.31-2.32 | PHASE 4 |
| UC14 | [Adjust the match schedule](use-cases/scheduling.md#uc14) | 14 | 103-106 | 2.33-2.34 | PHASE 4 |
| UC15 | [Look up the match schedule](use-cases/scheduling.md#uc15) | 15 | 106-108 | 2.35-2.36 | PHASE 6 |
| UC16 | [Create a match report](use-cases/results.md#uc16) | 16 | 109-112 | 2.37-2.38 | PHASE 5 |
| UC17 | [Update a match result](use-cases/results.md#uc17) | 17 | 112-114 | 2.39-2.40 | PHASE 5 |
| UC18 | [Confirm a match result](use-cases/results.md#uc18) | 18 | 115-118 | 2.41-2.42 | PHASE 5 |
| UC19 | [Correct a confirmed match result](use-cases/results.md#uc19) | 19 | 118-121 | 2.43-2.44 | PHASE 5 |
| UC20 | [Update standings and statistics](use-cases/results.md#uc20) | 20 | 121-123 | 2.45 (no separate sequence diagram) | PHASE 5 |
| UC21 | [Look up match information](use-cases/publication.md#uc21) | 21 | 123-126 | 2.46-2.47 | PHASE 6 |
| UC22 | [Generate and export competition reports](use-cases/publication.md#uc22) | 22 | 127-130 | 2.48-2.49 | PHASE 7 |
| UC23 | [Look up club and player information and statistics](use-cases/publication.md#uc23) | 23 | 130-133 | 2.50-2.51 | PHASE 6 |
| UC24 | [Manage competition news and announcements](use-cases/publication.md#uc24) | 24 | 134-136 | 2.52-2.53 | PHASE 8 |
| UC25 | [View competition news and announcements](use-cases/publication.md#uc25) | 25 | 136-139 | 2.54-2.55 | PHASE 8 |

§2.2 pp.54-58 lists UC01-UC25, actors, and complexity; §2.3 pp.59-66 contains Figure 2.1 overview, 2.2 schedules/results, 2.3 registration, 2.4 seasons/regulations, 2.5 reports/lookup, and 2.6 accounts/permissions. Decomposition figures contain subfunction names without separate codes; Context retains the original 25 codes. Complexity under Tables 2.2-2.6: UC02/12/15/21/25 low; UC06/10/11/13/14/16/18/19/20/22 high; all other UCs medium. Complexity is neither priority nor implementation evidence.

## Quality → Phase matrix

The Phases listed first build the relevant behavior; PHASE 10 verifies all requirements at the end without removing functional-Phase responsibilities. Each code below refers to the complete content and thresholds in [quality.md](quality.md).

| Original code | Detailed-table page | Responsible / verifying Phases |
|---|---|---|
| TH-01 | 13 | PHASE 2/PHASE 3; PHASE 10 final cross-check |
| TH-02 | 13 | PHASE 2/PHASE 4; PHASE 10 final cross-check |
| TH-03 | 13 | PHASE 2/PHASE 5/PHASE 7; PHASE 10 final cross-check |
| TH-04 | 13 | PHASE 2/PHASE 3/PHASE 4; PHASE 10 final cross-check |
| TH-05 | 13 | PHASE 2-PHASE 7/PHASE 10; PHASE 10 final cross-check |
| TH-06 | 14 | PHASE 1-PHASE 5/PHASE 10; PHASE 10 final cross-check |
| HQ-01 | 16 | PHASE 6; PHASE 10 final cross-check |
| HQ-02 | 16 | PHASE 5; PHASE 10 final cross-check |
| HQ-03 | 16 | PHASE 6/PHASE 10; PHASE 10 final cross-check |
| HQ-04 | 16 | PHASE 7; PHASE 10 final cross-check |
| TT-01 | 19 | PHASE 1-PHASE 9/PHASE 10; PHASE 10 final cross-check |
| TT-02 | 19 | PHASE 6; PHASE 10 final cross-check |
| TT-03 | 19 | PHASE 9; PHASE 10 final cross-check |
| TT-04 | 19 | PHASE 1-PHASE 9/PHASE 10; PHASE 10 final cross-check |
| TT-05 | 20 | PHASE 6/PHASE 10; external integration only if approved; PHASE 10 final cross-check |
| BM-01 | 23 | PHASE 1; PHASE 10 final cross-check |
| BM-02 | 23 | PHASE 1 and each internal-function Phase; PHASE 10 final cross-check |
| BM-03 | 23 | PHASE 1; PHASE 10 final cross-check |
| BM-04 | 23 | PHASE 1 and every input-receiving Phase; PHASE 10 final cross-check |
| BM-05 | 23 | PHASE 1/PHASE 3/PHASE 6/PHASE 7/PHASE 8/PHASE 9; PHASE 10 final cross-check |
| BM-06 | 24 | PHASE 1 records/searches; PHASE 2-PHASE 5/PHASE 8 produce events; PHASE 10 final cross-check |
| BM-07 | 24 | PHASE 10 implements the mechanism and verifies a full season; PHASE 10 final cross-check |
| CN-01 | 26 | PHASE 1/PHASE 10; PHASE 10 final cross-check |
| CN-02 | 26 | PHASE 1-PHASE 5/PHASE 9/PHASE 10; PHASE 10 final cross-check |
| CN-03 | 26 | PHASE 1/PHASE 10; PHASE 10 final cross-check |
| CN-04 | 26 | PHASE 1 and every business-extension Phase/PHASE 10; PHASE 10 final cross-check |
| TD-01 | 29 | Phases with UI, PHASE 10 tests 5 users/20 trials; PHASE 10 final cross-check |
| TD-02 | 29 | All forms in PHASE 1-PHASE 5/PHASE 8/PHASE 9; PHASE 10 final cross-check |
| TD-03 | 29 | PHASE 1-PHASE 5 and important changes/PHASE 10; PHASE 10 final cross-check |
| TD-04 | 29 | PHASE 1-PHASE 4/PHASE 6/PHASE 8, PHASE 9 if lists are displayed; PHASE 10 final cross-check |
| AT-01 | 32 | PHASE 3/PHASE 4/PHASE 5/PHASE 9; PHASE 10 final cross-check |
| AT-02 | 32 | PHASE 1-PHASE 5/PHASE 9; PHASE 10 final cross-check |
| AT-03 | 32 | PHASE 2/PHASE 4/PHASE 5; PHASE 10 final cross-check |
| AT-04 | 32 | PHASE 2-PHASE 5/PHASE 9/PHASE 10; PHASE 10 final cross-check |

Total coverage: **6/6** Table 1.1 business requirement rows; **10/10** forms; **37/37** QĐ clauses (6+6+6+6+7+6); **25/25** UCs; **34/34** quality codes (TH 6, HQ 4, TT 5, BM 7, CN 4, TD 4, AT 4); **6/6** actors. TT-05 is covered through independent-operation conditions and the integration branch if implemented, not a claim of approved external connections. These are documentation coverage figures, not functional completion rates.

## Check results and limitations

V1 was checked by reading Chapters 1-2, comparing specification tables to their Markdown transcriptions, and mechanically checking links/IDs/coverage. This report concerns documentation only, not Verification Evidence for Phase completion. Conflicts/missing details are centralized in [open-decisions.md](open-decisions.md); no data is fabricated and no technical option is selected.

Mechanical checks of v1 before migration, dated 24/10/2026: 14 package/guidance Markdown files were checked; 134 internal links/fragments resolved at handover. There was one record per UC01-UC25, each with seven fields: description/actors/preconditions/postconditions/main/alternative/exception flows; the previous check compared these 175 fields with extracted text but did not detect table labels displaced by reading order. During bilingual migration, PDF table cells were checked to restore correct titles, actors, conditions, and flows while preserving content. The old result does not prove correct cell grouping. There were 37 distinct clause codes, 34 distinct quality codes, and 10 Phases with all eight required components. `git diff --check` passed; Context contained no PDF, script, Spec/Plan/Tasks, or new functional code. Existing GitHub Issues/SDD and domain guidance was retained.

Product behavior, application tests, performance, security, compatibility, and recovery remain unverified because this checkout has no implementation. Other branches/checkouts and remote Issues were not inspected, and the tracker was not changed. No claim is made that real-world EPL facts outside the PDF remain current. At that pre-approval inspection, Context awaited team leader review/approval, including Phase decomposition and v2 decisions.

## Bilingual migration checks

Migration dated 24/10/2026: each language has 13 corresponding files, including GLOSSARY in its language directory; standardized internal filenames are `project-overview.md` and `progress-checker.md`. Project Phase IDs now use `PHASE 1`-`PHASE 10`, preserving order/scope/dependencies. The `context/progress_checker.md` path in the slop-loop source table above is the reference repository's historical filename; it is preserved to avoid corrupting the external citation.

Translations were checked section by section, table cell by table cell, and flow by flow, using the glossary for consistent terms and checking business codes/page references/numeric thresholds/conditions/open points. All 25 UCs retain 175 specification fields, matching step counts/order and branches; restoring correct table-cell grouping only corrects the presentation issue described above. Both sets retain 37 QĐ clauses, 10 forms, 34 quality codes, and 16 open points. The repository has no ADRs to translate; no new decisions were created.

Both Progress Checkers have the same 10 Phases and 79 checkboxes in matching order/meaning, all `[ ]`; each Phase remains `NOT_STARTED` according to the recorded inventory evidence, not because boxes are unchecked. Each Phase separates Specification/Plan/Tasks preparation from its specific functional, testing, and acceptance groups. The two views form one Phase ledger and future updates must synchronize evidence. The checklist does not replace `tasks.md` or GitHub Issues.

Structure, reference codes, tables/lists, statuses, and internal links were checked across 26 Context files plus AGENTS/domain/issue-tracker; no broken internal links were found. Pre-migration v1 check records above remain historical and their old link count does not describe the bilingual package. Translation content was reviewed; mechanical checks alone do not prove semantic equivalence. At migration handover, final review/approval remained with the team leader; the 16 open business/design points were not resolved during migration. Product behavior and external-source connections were not verified during this translation/restructuring work.

## Official v1 approval

**Version:** `v1` | **Status:** `APPROVED` | **Approved by:** Team Leader | **Approval Date:** `2026-10-24`

**Reviewed Commit:** `adad61f2a0625d62538aa10ce0ec8b6a91defa53` | **Branch:** `docs/build-agent-context`

The team leader approved the business-requirements foundation, document structure, traceability, and Phase decomposition after Final Deep Review. This approval does not approve Context v2 or unsettled technology, architecture, ERD, database schema, or API choices. All 16 Open Decisions remain OPEN; Phase statuses and checkboxes are unchanged. It does not establish software implementation or acceptance.

The team leader accepted the residual local-path risk in Git History and explicitly requested no further action on it. This acceptance does not require history rewriting or additional remediation. Earlier check and migration records above describe their historical dates; they are not the current approval status.

## Scope-change provenance - 2026-10-26

The Team Leader explicitly added first-version match postponement and season dashboard after the original specification and communicated the group's decision LS-01 to exclude Live Score. These are direct approved scope instructions, not retroactive PDF requirements or independent verification of API plans. Source PDF/history remain unchanged. See [ADR 0017](../../docs/adr/0017-live-score-excluded-from-first-version.md) and the [current scope index](design/README.md).
