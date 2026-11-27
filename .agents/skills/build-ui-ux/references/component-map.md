# Component ownership and audited baseline

Audited on 2026-11-27 against repository HEAD
`23ce0c231239fdfea56ffa035c4d3d79d1d9ab01`. The audit covers the current Phase 1–3
surfaces—authentication, administration, delegation, audit, season/lifecycle,
regulation, club, stadium, club applications, player profiles, player registrations,
transfers/plans and official corrections—and their shared HTTP/control contracts.
Future Phases still require their own specification and design decisions.

Paths below are owning sources, not permission to edit them for every task.
Re-read current owners when they change; this map is not a frozen second theme.

## Shared sources to reuse

| Surface or concern | Owner and use |
|---|---|
| Theme, Vietnamese locale, Select state colors | [App.tsx](../../../../frontend/src/app/App.tsx). Local Be Vietnam Pro fonts are imported by [main.tsx](../../../../frontend/src/main.tsx). |
| Workspace shell, permission-based navigation, welcome/access cards | [AdministrationLayout.tsx](../../../../frontend/src/features/accounts/AdministrationLayout.tsx), [Administration.module.css](../../../../frontend/src/features/accounts/Administration.module.css). Extend existing navigation with actual session capabilities. |
| Dropdowns | [AdminSelect.tsx](../../../../frontend/src/features/accounts/AdminSelect.tsx). Retain focus, opening, selected/hover states and constrained popup width. Use its label/hideLabel contract. |
| Date and date/time input | [DatePickers.tsx](../../../../frontend/src/shared/DatePickers.tsx), [date-format.ts](../../../../frontend/src/shared/date-format.ts). Use DateOnlyPicker/DateTimePicker and their actual props; read the conversion boundary before wiring values. |
| Lists, states, pagination and display preferences | [AdminLists.tsx](../../../../frontend/src/features/accounts/AdminLists.tsx), [use-admin-list.ts](../../../../frontend/src/features/accounts/use-admin-list.ts), [use-search-term.ts](../../../../frontend/src/features/accounts/use-search-term.ts). Keep server filtering/counts and applied query state. |
| Detail drawer | [AdminDrawer.tsx](../../../../frontend/src/features/accounts/AdminDrawer.tsx). Shared heading, scroll body and close footer; select a width that fits the content. |
| Scrollable workflow modal | [WorkspaceDialog.tsx](../../../../frontend/src/features/accounts/WorkspaceDialog.tsx), [its CSS](../../../../frontend/src/features/accounts/WorkspaceDialog.module.css). Preserve bounded height, bilateral gutters, title alignment and pinned command row. |
| Existing administration command forms | [AdminDialog.tsx](../../../../frontend/src/features/accounts/AdminDialog.tsx). Preserve basis refresh and command contracts; its established layout need not be migrated during unrelated work. |
| Dynamic modal feedback | [use-dialog-feedback.ts](../../../../frontend/src/features/accounts/use-dialog-feedback.ts). Newly reported feedback must be focusable and scroll above pinned actions. |
| Local icons and brand assets | [AdminIcon.tsx](../../../../frontend/src/features/accounts/AdminIcon.tsx), [original logo](../../../../frontend/public/images/Whistle-EPL-Logo.png). Reuse vectors; logo images retain original colors and contain proportions. |
| Request errors, session loss and uncertain outcomes | [client.ts](../../../../frontend/src/shared/http/client.ts), [session store](../../../../frontend/src/shared/http/session-store.ts), [use-auth-command.ts](../../../../frontend/src/features/auth/use-auth-command.ts). Retain the shared request/session seam. |

## Choose a feature analogue

| New work resembles | Inspect these sources and the matching CSS module |
|---|---|
| Login/password/session recovery | [AuthLayout](../../../../frontend/src/features/auth/AuthLayout.tsx), [LoginPage](../../../../frontend/src/features/auth/LoginPage.tsx), [ChangePasswordPage](../../../../frontend/src/features/auth/ChangePasswordPage.tsx), [LogoutButton](../../../../frontend/src/features/auth/LogoutButton.tsx). Preserve accepted ordinary/recovery layouts separately. |
| Accounts and permission assignment | [AccountsPage](../../../../frontend/src/features/accounts/AccountsPage.tsx), [GrantsPanel](../../../../frontend/src/features/accounts/GrantsPanel.tsx). Detail sections and capabilities determine actions. |
| Proposal/version/independent decision | [DelegationsPage](../../../../frontend/src/features/accounts/DelegationsPage.tsx), [SeasonLifecycleReview](../../../../frontend/src/features/seasons/SeasonLifecycleReview.tsx). Similar statuses do not imply identical actor permissions. |
| Table and detail/history navigation | [SeasonsPage](../../../../frontend/src/features/seasons/SeasonsPage.tsx), [SeasonDetail](../../../../frontend/src/features/seasons/SeasonDetail.tsx). Keep the shared selected season when navigating into its regulations. |
| Creation, normalization and date errors | [SeasonCreateForm](../../../../frontend/src/features/seasons/SeasonCreateForm.tsx), [its CSS](../../../../frontend/src/features/seasons/SeasonCreateForm.module.css). Date rows align at the start even with multiline feedback. |
| Dense editor, dynamic rows, version navigation | [RegulationDraftForm](../../../../frontend/src/features/regulations/RegulationDraftForm.tsx), [RegulationVersionsPage](../../../../frontend/src/features/regulations/RegulationVersionsPage.tsx), [final CSS rules](../../../../frontend/src/features/regulations/RegulationVersionsPage.module.css). Version navigation is above the complete editing canvas. |
| Saved content comparison and approval | [RegulationReview](../../../../frontend/src/features/regulations/RegulationReview.tsx), [use-regulation-review-content](../../../../frontend/src/features/regulations/use-regulation-review-content.ts), [RegulationChangeReview](../../../../frontend/src/features/regulations/RegulationChangeReview.tsx). Resolve off-page metadata; confirm exact saved versions. |
| Season selector/list | [RegulationWorkspace](../../../../frontend/src/features/regulations/RegulationWorkspace.tsx). Select by readable season name; no UUID in the ordinary choice. |
| Master profiles and corrections | [MasterForms](../../../../frontend/src/features/masters/MasterForms.tsx), [its CSS](../../../../frontend/src/features/masters/MasterForms.module.css), [MasterAvailability](../../../../frontend/src/features/masters/MasterAvailability.tsx). Codes visibly immutable after creation; shared correction-impact spacing covers clubs and stadiums. |
| Club identity and media | [ClubsPage](../../../../frontend/src/features/clubs/ClubsPage.tsx), [ClubLogo](../../../../frontend/src/features/clubs/ClubLogo.tsx), [LogoFileField](../../../../frontend/src/features/clubs/LogoFileField.tsx). Reuse localized upload, validation and accessible preview rather than raw browser file chrome. |
| Stadium lists and profiles | [StadiumsPage](../../../../frontend/src/features/stadiums/StadiumsPage.tsx). Read current approved field scope; a mockup does not authorize extra statistics/fields. |
| Activity/history labels | [audit-filters](../../../../frontend/src/features/audit/audit-filters.ts), [AuditPage](../../../../frontend/src/features/audit/AuditPage.tsx), [season-model](../../../../frontend/src/features/seasons/season-model.ts). Map new Phase events/fields to Vietnamese in all relevant history surfaces. |
| Player master profiles and portraits | [PlayersPage](../../../../frontend/src/features/players/PlayersPage.tsx), [PlayerForm](../../../../frontend/src/features/players/PlayerForm.tsx), [PlayerPortrait](../../../../frontend/src/features/players/PlayerPortrait.tsx), [its CSS](../../../../frontend/src/features/players/PlayersPage.module.css). Reuse portrait upload/fallback, duplicate-suspect confirmation and impact review patterns. |
| Season-scoped applications, registrations and exceptions | [ClubApplicationsPage](../../../../frontend/src/features/registrations/ClubApplicationsPage.tsx), [ClubApplicationForm](../../../../frontend/src/features/registrations/ClubApplicationForm.tsx), [PlayerRegistrationsPage](../../../../frontend/src/features/registrations/PlayerRegistrationsPage.tsx), [PlayerRegistrationForm](../../../../frontend/src/features/registrations/PlayerRegistrationForm.tsx) and their CSS modules. Reuse the unified season picker/header, concise status tables, `phase3Modal` spacing/DateTimePicker fixes, structured 2-column exception cards and non-overflowing history table modal. |
| Paired transitions and future plans | [RegistrationPlansPanel](../../../../frontend/src/features/registrations/RegistrationPlansPanel.tsx), [its CSS](../../../../frontend/src/features/registrations/RegistrationPlansPanel.module.css). Reuse side-by-side comparison cards, pill mode tabs, collapsible history and balanced full-width action grids. |
| Official record corrections and multi-stage diffs | [OfficialCorrectionsPanel](../../../../frontend/src/features/registrations/OfficialCorrectionsPanel.tsx), [its CSS](../../../../frontend/src/features/registrations/OfficialCorrectionsPanel.module.css). Reuse 3-column before/after diff tables, structured regulation-period decision rows and 2-column correction forms. |

## Stable conventions versus contextual values

Read current CSS before choosing values. These are observed approved examples,
not universal dimensions for every future screen:

| Context | Baseline |
|---|---|
| Shared theme | Primary #552cb6; hover #452196; focus #8663d8; text #17213b; border #e3e7f2; secondary text #65718a. |
| Main titles and ordinary controls | Existing list titles about 22px; control radius 8px, primary controls about 40–44px tall. Compact table actions intentionally differ. |
| Dense regulation reading/editing | Final `.detailPanel`/`.draftForm` rules use 15px content, 17px section headings, 24px section padding and 20–24px group spacing. Do not copy superseded smaller declarations earlier in the file. |
| Dialogs | Shared body uses 24px padding with native bilateral scrollbar gutters; total measured inset is platform-dependent. Check symmetry, not an assumed 40px everywhere. |
| Welcome/access | Final `.messagePanel`: max 720px, 32px padding, 24px title; original logo on white in both cards. This compact message layout is not a template for dense forms. |

The [final polish record](../../../../docs/verification/phase-2/ui-final-polish.md)
and [preceding review record](../../../../docs/verification/phase-2/ui-final-review.md)
explain the accepted changes. Their counts are historical evidence, never results
for a new implementation. Local `.verification` galleries are optional comparison
material; the skill must work from a fresh clone without them or Downloads ZIPs.
