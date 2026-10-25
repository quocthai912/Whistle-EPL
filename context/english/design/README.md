# Design navigation and decision index

Package metadata/approval: [current Context](../README.md). Rules have one owner; this page only routes readers. D001-D066 remain confirmed with original approval/source/options/rationale in their English ADR evidence; no new business choice is made by reorganization.

## Read by topic

| Topic | Owner |
|---|---|
| Architecture, stack, time, final authorization | [Architecture](architecture.md) |
| Accounts, roles and shared-master permissions | [UC01-UC04](../use-cases/administration.md) |
| Action/season/time delegation | [Business delegation](access-control.md) |
| Master identity, corrections, required fields and snapshots | [Business rules](../business.md) |
| Regulation and registration workflows | [UC05-UC11](../use-cases/registration.md) |
| Schedule generation, intervals and publication | [UC12-UC15](../use-cases/scheduling.md) |
| Report, result, appearance and event rules | [UC16-UC20](../use-cases/results.md) |
| Public/internal viewing, ranks and awards | [UC21-UC25](../use-cases/publication.md) |
| Club/player media | [Media](media.md) |
| Media API gates and closed scope history | [Integration](integrations.md) |

## Confirmed decisions

| ID | Current rule owner | Approval/rationale |
|---|---|---|
| D001 | [Modular, layered monolithic backend](architecture.md#d001---modular-layered-monolithic-backend) | [0001](../../../docs/adr/0001-modular-layered-backend.md#d001-english-evidence) |
| D002 | [Approved technology stack and API style](architecture.md#d002---approved-technology-stack-and-api-style) | [0002](../../../docs/adr/0002-approved-technology-stack.md#d002-english-evidence) |
| D003 | [Season-scoped business permissions](../use-cases/administration.md#d003---season-scoped-business-permissions) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d003-english-evidence) |
| D004 | [Multiple business roles in the same season](../use-cases/administration.md#d004---multiple-business-roles-in-the-same-season) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d004-english-evidence) |
| D005 | [Separate preparation and approval responsibilities](../use-cases/administration.md#d005---separate-preparation-and-approval-responsibilities) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d005-english-evidence) |
| D006 | [System Administrator manages seasonal role assignments](../use-cases/administration.md#d006---system-administrator-manages-seasonal-role-assignments) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d006-english-evidence) |
| D007 | [Invalidate sessions after permission changes or account locking](../use-cases/administration.md#d007---invalidate-sessions-after-permission-changes-or-account-locking) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d007-english-evidence) |
| D008 | [First System Administrator bootstrap through a server CLI](../use-cases/administration.md#d008---first-system-administrator-bootstrap-through-a-server-cli) | [0004](../../../docs/adr/0004-first-administrator-cli-bootstrap.md#d008-english-evidence) |
| D009 | [Protect administrator access and prohibit self-locking](../use-cases/administration.md#d009---protect-administrator-access-and-prohibit-self-locking) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d009-english-evidence) |
| D010 | [Prohibit administrator self-granting of seasonal business permissions](../use-cases/administration.md#d010---prohibit-administrator-self-granting-of-seasonal-business-permissions) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d010-english-evidence) |
| D011 | [Emergency recovery CLI for existing administrators](../use-cases/administration.md#d011---emergency-recovery-cli-for-existing-administrators) | [0004](../../../docs/adr/0004-first-administrator-cli-bootstrap.md#d011-english-evidence) |
| D012 | [Season-wide Results Officer scope without per-match assignments](../use-cases/administration.md#d012---season-wide-results-officer-scope-without-per-match-assignments) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d012-english-evidence) |
| D013 | [Action-scoped, seasonal and time-bounded business delegation](access-control.md#d013---action-scoped-seasonal-and-time-bounded-business-delegation) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d013-english-evidence) |
| D014 | [Season Manager proposes delegation; System Administrator records grants/revocations](access-control.md#d014---season-manager-proposes-delegation-system-administrator-records-grantsrevocations) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d014-english-evidence) |
| D015 | [Single-level delegation based on direct role authority](access-control.md#d015---single-level-delegation-based-on-direct-role-authority) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d015-english-evidence) |
| D016 | [Recipient cannot propose or record their own delegation grant](access-control.md#d016---recipient-cannot-propose-or-record-their-own-delegation-grant) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d016-english-evidence) |
| D017 | [Three different people for a delegation grant](access-control.md#d017---three-different-people-for-a-delegation-grant) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d017-english-evidence) |
| D018 | [Delegation recipients must already hold a business role in the target season](access-control.md#d018---delegation-recipients-must-already-hold-a-business-role-in-the-target-season) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d018-english-evidence) |
| D019 | [First-version delegation operation and recipient-role matrix](access-control.md#d019---first-version-delegation-operation-and-recipient-role-matrix) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d019-english-evidence) |
| D020 | [Terminate delegation permanently when required eligibility is lost](access-control.md#d020---terminate-delegation-permanently-when-required-eligibility-is-lost) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d020-english-evidence) |
| D021 | [Direct administrative revocation of business delegation](access-control.md#d021---direct-administrative-revocation-of-business-delegation) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d021-english-evidence) |
| D022 | [Invalidate recipient sessions when delegation starts or ends](access-control.md#d022---invalidate-recipient-sessions-when-delegation-starts-or-ends) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d022-english-evidence) |
| D023 | [Explicit delegation start/end instants with an exclusive end](access-control.md#d023---explicit-delegation-startend-instants-with-an-exclusive-end) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d023-english-evidence) |
| D024 | [UTC instants and a single Vietnam display/input time zone](architecture.md#d024---utc-instants-and-a-single-vietnam-displayinput-time-zone) | [0006](../../../docs/adr/0006-utc-instants-and-vietnam-time-zone.md#d024-english-evidence) |
| D025 | [Finite delegation periods without a fixed numerical duration cap](access-control.md#d025---finite-delegation-periods-without-a-fixed-numerical-duration-cap) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d025-english-evidence) |
| D026 | [Delegation periods may extend beyond season start/end dates](access-control.md#d026---delegation-periods-may-extend-beyond-season-startend-dates) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d026-english-evidence) |
| D027 | [Reject overlapping delegation grants for the same recipient, operation and season](access-control.md#d027---reject-overlapping-delegation-grants-for-the-same-recipient-operation-and-season) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d027-english-evidence) |
| D028 | [Lock submitted delegation versions and grant exactly the submitted content](access-control.md#d028---lock-submitted-delegation-versions-and-grant-exactly-the-submitted-content) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d028-english-evidence) |
| D029 | [Separate delegation proposal and granted-authority lifecycles](access-control.md#d029---separate-delegation-proposal-and-granted-authority-lifecycles) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d029-english-evidence) |
| D030 | [Recheck current session and authority at the final decision point of writes](architecture.md#d030---recheck-current-session-and-authority-at-the-final-decision-point-of-writes) | [0007](../../../docs/adr/0007-final-authorization-check-for-writes.md#d030-english-evidence) |
| D031 | [One personal internal account per person](../use-cases/administration.md#d031---one-personal-internal-account-per-person) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d031-english-evidence) |
| D032 | [Public information boundary including player dates of birth](../use-cases/publication.md#d032---public-information-boundary-including-player-dates-of-birth) | [0008](../../../docs/adr/0008-public-information-and-player-birth-dates.md#d032-english-evidence) |
| D033 | [Internal viewing follows business responsibility](../use-cases/publication.md#d033---internal-viewing-follows-business-responsibility) | [0008](../../../docs/adr/0008-public-information-and-player-birth-dates.md#d033-english-evidence) |
| D034 | [Separately assigned shared master-record management permissions](../use-cases/administration.md#d034---separately-assigned-shared-master-record-management-permissions) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d034-english-evidence) |
| D035 | [Stable master identity with selective snapshots of official business information](../business.md#d035---stable-master-identity-with-selective-snapshots-of-official-business-information) | [0009](../../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#d035-english-evidence) |
| D036 | [Correct erroneous master data with separate review of affected business records](../business.md#d036---correct-erroneous-master-data-with-separate-review-of-affected-business-records) | [0009](../../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#d036-english-evidence) |
| D037 | [Prohibit administrator self-granting of shared master-management permissions](../use-cases/administration.md#d037---prohibit-administrator-self-granting-of-shared-master-management-permissions) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d037-english-evidence) |
| D038 | [End shared master-management permission after loss of the last corresponding role assignment](../use-cases/administration.md#d038---end-shared-master-management-permission-after-loss-of-the-last-corresponding-role-assignment) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d038-english-evidence) |
| D039 | [Invalidate sessions after shared master-management permission changes](../use-cases/administration.md#d039---invalidate-sessions-after-shared-master-management-permission-changes) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d039-english-evidence) |
| D040 | [Allow administrator self-reduction of business permissions](../use-cases/administration.md#d040---allow-administrator-self-reduction-of-business-permissions) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d040-english-evidence) |
| D041 | [Retain shared master-management assignments while an account is locked](../use-cases/administration.md#d041---retain-shared-master-management-assignments-while-an-account-is-locked) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d041-english-evidence) |
| D042 | [Immutable approved versions of seasonal regulations](../use-cases/registration.md#d042---immutable-approved-versions-of-seasonal-regulations) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d042-english-evidence) |
| D043 | [Immediate or future regulation effectivity without backdating](../use-cases/registration.md#d043---immediate-or-future-regulation-effectivity-without-backdating) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d043-english-evidence) |
| D044 | [Freeze competition structure after initial schedule approval](../use-cases/registration.md#d044---freeze-competition-structure-after-initial-schedule-approval) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d044-english-evidence) |
| D045 | [Freeze points and ranking priority after the first official result](../use-cases/registration.md#d045---freeze-points-and-ranking-priority-after-the-first-official-result) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d045-english-evidence) |
| D046 | [Preserve codes and meanings of referenced goal and card types](../use-cases/registration.md#d046---preserve-codes-and-meanings-of-referenced-goal-and-card-types) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d046-english-evidence) |
| D047 | [Bind match event catalogs to recorded actual kickoff](../use-cases/results.md#d047---bind-match-event-catalogs-to-recorded-actual-kickoff) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d047-english-evidence) |
| D048 | [Record actual kickoff in the report and confirm it with the official result](../use-cases/results.md#d048---record-actual-kickoff-in-the-report-and-confirm-it-with-the-official-result) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d048-english-evidence) |
| D049 | [Revalidate events when corrected kickoff changes the applicable catalog](../use-cases/results.md#d049---revalidate-events-when-corrected-kickoff-changes-the-applicable-catalog) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d049-english-evidence) |
| D050 | [At most one approved future regulation version per season](../use-cases/registration.md#d050---at-most-one-approved-future-regulation-version-per-season) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d050-english-evidence) |
| D051 | [Controlled cancellation, replacement and activation of waiting regulations](../use-cases/registration.md#d051---controlled-cancellation-replacement-and-activation-of-waiting-regulations) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d051-english-evidence) |
| D052 | [Compatible registration-rule changes and revalidation of pending records](../use-cases/registration.md#d052---compatible-registration-rule-changes-and-revalidation-of-pending-records) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d052-english-evidence) |
| D053 | [Registration windows, receipt deadlines and individual exceptions](../use-cases/registration.md#d053---registration-windows-receipt-deadlines-and-individual-exceptions) | [0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#d053-english-evidence) |
| D054 | [Automatic U21 assessment and evidence-based staff verification of homegrown status](../use-cases/registration.md#d054---automatic-u21-assessment-and-evidence-based-staff-verification-of-homegrown-status) | [0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#d054-english-evidence) |
| D055 | [Versioned club-application and player-registration workflows](../use-cases/registration.md#d055---versioned-club-application-and-player-registration-workflows) | [0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#d055-english-evidence) |
| D056 | [Playing-effective intervals and consistent club transfers](../use-cases/registration.md#d056---playing-effective-intervals-and-consistent-club-transfers) | [0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#d056-english-evidence) |
| D057 | [Independently approved correction of validated registrations](../use-cases/registration.md#d057---independently-approved-correction-of-validated-registrations) | [0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#d057-english-evidence) |
| D058 | [Stable business codes, duplicate review and temporal shirt-number uniqueness](../business.md#d058---stable-business-codes-duplicate-review-and-temporal-shirt-number-uniqueness) | [0009](../../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#d058-english-evidence) |
| D059 | [Required registration data and official snapshot milestones](../business.md#d059---required-registration-data-and-official-snapshot-milestones) | [0009](../../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#d059-english-evidence) |
| D060 | [Automatic fixture pairing with manually completed schedule drafts](../use-cases/scheduling.md#d060---automatic-fixture-pairing-with-manually-completed-schedule-drafts) | [0012](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md#d060-english-evidence) |
| D061 | [Seasonal planning intervals and system-wide schedule conflict checks](../use-cases/scheduling.md#d061---seasonal-planning-intervals-and-system-wide-schedule-conflict-checks) | [0012](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md#d061-english-evidence) |
| D062 | [Schedule approval publishes immediately and adjustments are versioned](../use-cases/scheduling.md#d062---schedule-approval-publishes-immediately-and-adjustments-are-versioned) | [0012](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md#d062-english-evidence) |
| D063 | [Separate match, report-version and official-result lifecycles](../use-cases/results.md#d063---separate-match-report-version-and-official-result-lifecycles) | [0013](../../../docs/adr/0013-match-report-and-official-result-lifecycles.md#d063-english-evidence) |
| D064 | [Kickoff-based appearance eligibility and report-defined goalkeepers](../use-cases/results.md#d064---kickoff-based-appearance-eligibility-and-report-defined-goalkeepers) | [0013](../../../docs/adr/0013-match-report-and-official-result-lifecycles.md#d064-english-evidence) |
| D065 | [Structured event minutes, score checks and referee-signature references](../use-cases/results.md#d065---structured-event-minutes-score-checks-and-referee-signature-references) | [0013](../../../docs/adr/0013-match-report-and-official-result-lifecycles.md#d065-english-evidence) |
| D066 | [Shared standings ranks and shared individual awards](../use-cases/publication.md#d066---shared-standings-ranks-and-shared-individual-awards) | [0014](../../../docs/adr/0014-shared-ranks-and-individual-awards.md#d066-english-evidence) |
| D067 | [Postponement approval and return](../use-cases/scheduling.md#d067---approved-postponement-and-return-through-uc14) | [0012](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md#q67---postponement-approval-and-allocation) |
| D068 | [Public season overview dashboard](../use-cases/publication.md#d068---public-season-overview-dashboard) | [0008](../../../docs/adr/0008-public-information-and-player-birth-dates.md#q68---shared-public-season-dashboard) |

## Other confirmed instructions

| ID | Owner | Evidence |
|---|---|---|
| LOGO-01 | [Approved logo policy](media.md#logo-01---approved-logo-design) | [ADR 0015](../../../docs/adr/0015-managed-club-logos-in-first-version.md) |
| INT-01 | [Acceptance before API research](integrations.md#int-01---acceptance-before-api-research-and-integration) | [ADR 0016](../../../docs/adr/0016-core-acceptance-before-external-integration.md) |
| POSTPONE-01 | [Match postponement](../use-cases/scheduling.md#postpone-01---first-version-match-postponement) | Scope confirmed; Q67 details governed by D067. |
| DASHBOARD-01 | [Season dashboard](../use-cases/publication.md#dashboard-01---season-overview-dashboard) | Scope and Q68 package confirmed; D068 owns details. |
| LS-01 | [First-version exclusion](integrations.md#v2-ext-01---live-match-tracking--live-score) | [ADR 0017](../../../docs/adr/0017-live-score-excluded-from-first-version.md); interview cancelled. |
| DOCS-01 | [Package maintenance](../README.md#current-package-maintenance) | Team Leader approved reorganization after LOGO-01, with this index kept here and open-decisions limited to unresolved work. |

## Resume checkpoint

Q67 and Q68 are confirmed: D067 owns postponement; D068 owns the shared public dashboard. Pause after Q68 at the Team Leader request. Q69 is not asked or answered. On resumption, prioritize remaining first-version decisions by dependencies, including portrait policy and ranking/playoff/season-summary work. LS-01 cancels Live Score interview/design/acceptance work. Media API research/selection remains after independent core acceptance. Whole-v2 approval is pending; no code, Specs, Tasks, Issues, API integration, commit or push is authorized.
