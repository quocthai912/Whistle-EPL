# Whistle-EPL Constitution

**Status:** RATIFIED by the Team Leader on 2026-10-28 (Asia/Bangkok).

This document governs the development process. The current
[English Context Package](../../context/README.md) owns requirements and approved design.
Q104A, Q105C and Q106A confirm the test discipline, review policy and amendment authority.
The ratified text incorporates the Team Leader's CLI/fixture and decision-index comments.
Final approval was explicit: "tôi chính thức phê duyệt bản hiến chương này".

## Core Principles

### I. Authoritative Sources and Traceability

Contributors and agents MUST begin with context/README.md and load the English documents
relevant to the selected project Phase or Use Case.

Direct Team Leader instructions govern the work. The original Vietnamese PDF supplies
authoritative source business requirements; approved refinements remain in their current
Context owners and approval records. Conflicts MUST be reported with evidence rather than
silently resolved.

Specifications MUST retain applicable UC, business/quality and decision references.
Terminology MUST follow the [business glossary](../../context/GLOSSARY.md).
[Source traceability and approval history](../../context/sources.md) MUST retain actual
approval scope and dates; Q98 does not retroactively approve subsequent decisions.

### II. Specification-Driven Development and Controlled Scope

Work MUST follow the approved lifecycle: Phase selection and G0/dependency assessment;
approved Specification; reviewed Plan; approved Tasks; linked Task Issues; Implementation;
Testing and Acceptance.

Tasks.md owns task definitions and dependencies. Each approved Task MUST have one
corresponding GitHub Issue under [the conventions](../../docs/agents/issue-tracker.md).
Issues and tasks MUST remain consistent.

Project PHASE 1-PHASE 10 MUST remain distinct from internal Spec Kit phases. Documents,
templates, hooks and automation MUST NOT expand authorized scope. Missing configuration
or execution evidence MUST NOT automatically be treated as an unresolved architecture
decision. Apply the owning [Phase ledger](../../context/progress-checker.md) and
[unresolved-work register](../../context/open-decisions.md) at the appropriate step.

### III. Owned Modules and Approved Architecture

Plans and implementation MUST preserve approved module/data ownership, layered
responsibilities and transaction coordination.

The current approved-decision index in
[context/design/README.md](../../context/design/README.md#confirmed-decisions) identifies
the applicable decisions and their owners. Apply that maintained index, including later
approved additions, rather than a fixed decision-number range. Adding an approved decision
does not by itself require a constitution amendment.

[D097](../../context/design/architecture.md#d097---pnpm-toolchain-development-quality-and-reference-operations)
currently owns the selected stack, pnpm toolchain and operation baseline;
[D098](../../context/design/architecture.md#d098---required-ci-and-protected-integration-branches)
currently owns CI and integration-branch protection. This constitution MUST NOT duplicate
or silently replace their detailed policies.

Architecture or selected primary-library/major changes require impact review and Team
Leader approval. Current rules MUST have one owner; ADRs retain consequential decisions
and rationale, the glossary defines business terms, and open-decisions records unresolved
work. Preserve historical approvals and source provenance.

### IV. Server-Enforced Security and Atomic Changes

Authorization, session validity, scope, state, input validation and safe response
projection MUST be enforced on the server under the rules applicable to each execution
path. UI visibility is not an authorization boundary.

Applicable mutations MUST recheck authority at the final write decision point and
preserve approved revision, idempotency and concurrency rules. Related changes, required
audit and session invalidation MUST commit consistently. Failures MUST NOT leave partial
business state.

Administrative CLI commands and scheduled jobs MUST follow their approved execution-specific
controls; they MUST NOT be forced through browser-session requirements that do not apply.
[D008 bootstrap and D011 recovery](../../docs/adr/0004-first-administrator-cli-bootstrap.md)
use their approved server-operator, secure-input, target-account, concurrency, audit and
credential/session safeguards. They do not require an existing authenticated browser session
as a prerequisite for repairing or initializing administrator access. This does not expose
those operations as public APIs or authorize bypassing their own safeguards.

Isolated test-data preparation is permitted under
[D090](../../context/quality.md#d090---reproducible-acceptance-datasets-and-season-fixtures)
and D097. Explicit fixture tools may prepare controlled states without replaying every
operational approval step. They MUST enforce test-environment isolation and MUST NOT
become operational startup seeds, production approval bypasses or evidence that omitted
Use Case flows passed. Acceptance scenarios requiring real workflows MUST exercise them.

Credentials and security tokens MUST remain protected under their approved storage,
transport, response and logging contracts. Ordinary operational paths MUST NOT claim
test-fixture or recovery privileges.

### V. Risk-Based Verification and Evidence-Based Acceptance

Specifications and Plans MUST define applicable verification before implementation.
Test-first work is mandatory where the approved Specification or Plan requires it;
otherwise tests may be developed alongside implementation.

Required security, authorization, transaction and regression verification MUST NOT be
omitted because a generic template describes tests as optional. There is no universal
TDD mandate or newly imposed coverage percentage.

Verification MUST follow the current approved test/CI owners and unchanged source
[quality requirements](../../context/quality.md). Test data MUST be isolated and reproducible,
without real credentials or sensitive personal data. Test values MUST NOT become
operational defaults or approval bypasses.

Phase completion requires actual functionality, acceptance criteria and Verification
Evidence. Documentation approval, green CI or closed Issues alone MUST NOT establish
completion.

## Architecture and Documentation Constraints

The English Context Package remains the sole current requirements/design package.
This constitution governs the development process; it does not replace business,
architecture or acceptance owners.

Contributors MUST preserve source traceability, approval history, project Phase statuses
and checkboxes. Current project documents MUST be written in English while preserving
source terminology and approved product-language requirements.

PHASE 1 MUST retain its approved
[foundation/full-system verification allocation](../../context/progress-checker.md#phase-1-specification-readiness-and-foundation-verification).
Later season, registration, scheduling, result and reporting business MUST remain in
its owning Phases.

Generic template examples are scaffolding. They MUST NOT introduce unapproved architecture,
mandatory TDD, optionalization of required tests, extra permissions or new acceptance
thresholds.

## Development Workflow and Quality Gates

- Specification review MUST establish scope, source traceability, testable requirements,
  acceptance criteria and explicitly classified blockers.
- The Plan Constitution Check MUST assess all five principles before Spec Kit's internal
  Phase 0 research and again after internal Phase 1 design. Each principle requires a
  compliance explanation, an evidenced non-applicable case or a specific blocker.
- Tasks MUST trace to the approved Specification/Plan, declare dependencies and include
  applicable required verification.
- Merge checks MUST follow the current approved CI/branch policy. Review MAY use a
  Reviewer Agent; human review MAY supplement it when needed. No mandatory human reviewer
  count or human-approval merge gate is introduced by this constitution.
- Agent review MUST NOT replace required CI, Team Leader approval of requirements/architecture,
  Task approval or Phase acceptance evidence.
- Acceptance MUST follow the Phase ledger and quality owners. Evidence MUST identify
  revision, actual environment/versions, fixtures, commands/scenarios, outcomes, defects
  and the acceptance reviewer.

Future CI or deployment requirements MUST be assessed at their applicable stage.
A planned check is not an executed result; approval of this constitution does not prove
that scripts, workflows or branch rules exist.

## Governance

The Team Leader ratifies this constitution and approves amendments. Members may propose
changes with their rationale, affected rules, impact on Specifications/Plans/Tasks/checks
and necessary transition work.

An amendment MUST receive explicit approval before application. Changing this constitution
MUST NOT silently amend business or architecture decisions; affected owner documents and
approvals must be handled through their corresponding workflow.

Use semantic versioning: MAJOR for incompatible principle removals or redefinitions;
MINOR for new principles or materially expanded obligations; PATCH for clarifications
preserving meaning. Preserve the original ratification date and record actual amendment
dates. Adding an approved ADR alone is not a governance version change.

Contributors and reviewers MUST assess applicable compliance. A complexity justification,
agent recommendation or template instruction does not authorize an exception. Conflicts
require explicit resolution by the Team Leader; no implicit exception permits bypassing
approved security, source requirements or required CI.

Initial adoption of version 1.0.0 was explicitly approved by the Team Leader on 2026-10-28.
Ratification supplies the governance baseline; every future Plan MUST still perform its
own Constitution Check. It does not authorize creating Specs or implementation artifacts,
establish a passed Plan check or change project Phase implementation statuses.

**Version**: 1.0.0 | **Ratified**: 2026-10-28 | **Last Amended**: 2026-10-28
