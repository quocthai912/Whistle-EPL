# Issue tracker: GitHub

Track work in GitHub Issues for quocthai912/Whistle-EPL.
Use the gh CLI from this repository.

## Specification-Driven Development

Follow this workflow:
Specifications → Tasks → Implementation.

- Specifications define requirements and functional scope.
- Tasks break Specifications into concrete implementation work.
- Each Task corresponds to one GitHub Issue for assignment,
  progress tracking, coordination, and completion.
- Each Issue must reference the corresponding Task by its identifier
  and tasks.md path, and link to the corresponding Specification.
- tasks.md is the source of truth for the Task list and dependencies.
  GitHub Issues track and coordinate execution.
- Keep tasks.md and GitHub Issues consistent: record the Issue link
  against its Task, reflect Task dependencies in Issues, and reconcile
  completion status in both places when work is completed or reopened.
- Create Issues only after the Tasks have been defined and approved.
  Do not create Issues during repository configuration.

## Conventions

- Create: gh issue create --title "..." --body-file <file>
- Read: gh issue view <number> --json number,title,body,labels,comments
- List: gh issue list --state open --json number,title,body,labels
- Comment: gh issue comment <number> --body-file <file>
- Label: gh issue edit <number> --add-label "..."
- Remove label: gh issue edit <number> --remove-label "..."
- Close: gh issue close <number> --comment "..."

For multiline content, write the exact text to a temporary file
and pass it with --body-file.

When a skill says "publish to the issue tracker", create the GitHub Issue
for the corresponding approved Task. If Tasks have not yet been defined
and approved, complete those steps first. Reuse an existing Issue for
the Task rather than creating a duplicate.

When it says "fetch the relevant ticket", read the GitHub Issue.

## Pull requests as a triage surface

**PRs as a request surface: no.**
