---
name: close-issues
description: After implementation has been pushed, verify publication, synchronize related Context/specification/evidence files, and complete existing Task Issues with checked Acceptance Criteria, completed labels and verified closure.
---

# Close Issues

Reconcile published implementation, its documentation and the existing GitHub
Task Issues. Use this workflow when the user asks to close completed Tasks after
a push, or to synchronize their publication and completion records.

Invoking this skill to complete identified Tasks authorizes the associated Issue
body, evidence-comment, label and closure updates. If the request only asks for
advice or a preview, prepare that result without mutating GitHub. This workflow
does not authorize commit/push, PR merge, starting another Phase or granting
human Phase acceptance.

## 1. Establish scope and authority

- Start at [context/README.md](../../../context/README.md), then read
  [domain guidance](../../../docs/agents/domain.md), the selected Phase ledger
  and relevant owning documents. Before ticket access, read
  [issue-tracker.md](../../../docs/agents/issue-tracker.md) and use its `gh` CLI
  workflow from the repository.
- Resolve the requested feature, Task IDs and canonical Issues from its actual
  `tasks.md`. Reuse its one-Issue-per-Task mapping. Check both the Task ID and
  specification path in each Issue; numbers or the current branch alone do not
  establish scope. If a prerequisite script resolves another feature, use the
  explicitly selected feature instead and correct only relevant local state.
- Inspect the working tree and preserve existing edits. Obtain the current Issue
  bodies, labels, states and completion comments. Ask only for scope or authority
  that cannot be established from the user's request and repository evidence.

Ready when every selected Task maps unambiguously to an existing Issue and the
requested external updates are authorized. Leave unrelated Issues untouched.

## 2. Verify the pushed implementation and completion evidence

- Identify the full implementation commit SHA(s), repository and remote ref.
  Verify publication using the live remote ref or GitHub commit/ref API. When
  the ref has advanced, establish ancestry and identify the commit containing
  the claimed implementation. A local commit, tracking ref or statement that
  work was pushed is not sufficient verification by itself. Publication on a
  feature branch does not imply merge or deployment.
- Match the claimed tested sources to the published tree, using existing source
  manifests/checksums when available. Retain the original review base and test
  provenance; record the published commit separately. If implementation is
  missing remotely or differs from tested sources, leave affected Issues open
  and identify the exact gap. Do not push or implement a fix as part of closure.
- Map **each Acceptance Criterion** to actual implementation, tests, review and
  applicable human approvals. Read the full criteria, including continuations.
  Existing valid evidence can be reused; rerun relevant checks only for a
  material mismatch or missing evidence. Local results and hosted CI are
  separate claims. Preserve declared fixture/hardware limitations and later
  operational/integration gates.

Ready when each criterion has a supported outcome. Check only satisfied criteria;
an unmet criterion keeps its Issue open and ineligible for the `completed` label.
Continue independent, fully supported Tasks and report the remaining gaps.

## 3. Prepare all related documentation updates

Build the affected-document set from the selected Task/specification, Context
navigation, Phase ledger and verification references. Search those owners and
their cross-references for stale completion or publication statements.

- Update **all relevant current owners**: `context/README.md`,
  `context/progress-checker.md`, owning Context documents or input registers,
  the feature's `tasks.md`, and applicable acceptance/verification reports,
  source-manifest metadata and operational/quickstart guides. Edit only documents
  whose claims actually change; creating duplicate Context policy is unnecessary.
- Replace current claims such as “uncommitted”, “not pushed”, “awaiting publication”
  or obsolete Task totals with the verified SHA, remote ref, date and evidence.
  Preserve historical milestones and original approval/source pins. Distinguish
  the published implementation from the new, still-uncommitted synchronization
  edits made by this workflow.
- Mark Task and Phase checklist items only where their evidence warrants it.
  Close completed Tasks without inferring whole-Phase acceptance. Set a Phase to
  `COMPLETED` only when its applicable criteria and separately required human
  acceptance are actually recorded; retain remaining inputs and later-Phase
  statuses. Reuse an existing explicit approval rather than asking again.
- Keep durable, redacted evidence in tracked `docs/verification/`. Put raw logs,
  temporary Issue payloads and credentials in ignored `.verification/`; omit
  secrets from tracked files, comments and tool output.

Prepare concrete edits before external updates. Record tracker synchronization
as pending until the corresponding GitHub read-back succeeds.

## 4. Complete eligible Issues

For each eligible Issue, read its current body immediately before editing and
preserve its title, criteria wording, source links, unrelated checkboxes/labels,
assignees and native dependency relationships.

1. Check every verified Acceptance Criteria box within the actual acceptance
   section. Preserve text and list structure; do not weaken criteria to close it.
2. Add `completed` and remove `ready-for-agent`, preserving other labels. Reuse
   the existing label; if absent, create it only under the repository's convention
   and the user's authorization, otherwise report that specific blocker.
3. Add a concise completion comment with Task identity, pinned implementation
   commit, per-Task evidence links/results and any accepted scope limitations.
   Record human Phase approval only when it exists. Use temporary files and
   `--body-file` for multiline Issue bodies and comments.
4. Close the Issue with reason `completed` using the configured tracker workflow.

Before retrying a mutation with an uncertain response, read GitHub to determine
whether it succeeded. On reruns, apply only missing updates and reuse an equivalent
completion comment for the same Task/commit. Avoid duplicate comments or repeated
closure. On an authentication, permission or persistent API failure, stop the
dependent actions, preserve completed work and report the affected Issues and
reason instead of claiming success or repeatedly retrying.

## 5. Read back, finalize and hand off

- Fetch each selected Issue again. Verify the Task identity, checked/unchecked
  criterion counts, preserved acceptance text, `CLOSED` state, `COMPLETED` reason,
  presence of `completed`, absence of `ready-for-agent`, and the evidence comment.
  Do not report a remotely blocked or partial update as completed.
- Finalize documentation with the **observed** tracker outcome. Reconcile Task
  totals, Phase status and publication statements across every affected owner;
  retain accurate partial-failure notes where needed.
- Validate changed links, source-manifest integrity and `git diff --check`.
  Review the final diff for unrelated edits and search the affected scope again
  for stale current publication/completion claims. Documentation-only changes
  need no full application regression rerun.
- Report the published SHA, Issues completed, criterion count, label changes,
  documents synchronized and any remaining blockers. State that synchronization
  edits are local until separately committed/pushed. Supply Git commands if the
  user asks; do not execute a commit or push without authorization.

Done when every selected Task has either verified remote completion and consistent
local records, or an explicit evidence/publication/access blocker with its Issue
left in the accurately reported state.
