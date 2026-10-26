# ADR 0014 - Shared ranks and individual awards

This ADR records decisions and rationale; authoritative current rules are owned by [D066](../../context/english/use-cases/publication.md#d066---shared-standings-ranks-and-shared-individual-awards). Historical open-point notes do not reopen subsequently confirmed policy.

**Status:** accepted. **Approver:** Team Leader. **Date:** 2026-10-25 (Asia/Bangkok). **Interview:** grouped Q66, option A; Context decision [D066](../../context/english/use-cases/publication.md#d066---shared-standings-ranks-and-shared-individual-awards).

During a season, clubs equal on all applicable main ranking criteria share competition ranks (1, 2, 2, 4). Stable club-code order within a tie is presentation only. Do not use head-to-head criteria reserved for season-end resolution during the season. At season end, flag unresolved ties affecting championship, qualification or relegation for the source's additional-criteria/playoff process; names/codes do not decide sporting outcomes.

Retain source shared top-scorer awards without extra assists/appearances/minutes criteria. Goalkeepers with the equal highest clean-sheet total share the Golden Glove. Require at least one valid personal goal or one clean sheet, respectively, to identify award recipients; otherwise show no recipient yet rather than awarding every zero total. Official-result corrections update ties/leaders; final awards go through season summary.

Using fewer goalkeeper appearances to break Golden Glove ties was considered, with otherwise identical club/top-scorer policy. The Team Leader chose transparent equal-achievement treatment without unsupported extra criteria, accepting shared awards and nonunique in-season ranks. Head-to-head/multi-club calculation was subsequently settled by D070 below. Qualification/relegation parameter design is subsequently confirmed by D072 below; concrete seasonal values and technical contracts remain open; D073 below settles summary confirmation/reconfirmation; D071 below settles playoff-based resolution recording.

See [Context v2 D066](../../context/english/use-cases/publication.md#d066---shared-standings-ranks-and-shared-individual-awards).

### D066 english evidence

Current policy owner: [D066](../../context/english/use-cases/publication.md#d066---shared-standings-ranks-and-shared-individual-awards). Historical interview metadata follows; earlier open-point notes are evidence of that interview round, not the current unresolved-work register.

- **Status:** CONFIRMED by Team Leader on 2026-10-25 (Asia/Bangkok).

- **Confirmation evidence:** In response to grouped Q66, the Team Leader selected option A: “Tôi chọn A.” (“I choose A.”).

- **Source:** O05/O06/O12; QĐ5.3-QĐ5.5/QĐ5.7, BM5.1-BM5.3; [D045](../../context/english/use-cases/registration.md#d045---freeze-points-and-ranking-priority-after-the-first-official-result)/[D064](../../context/english/use-cases/results.md#d064---kickoff-based-appearance-eligibility-and-report-defined-goalkeepers).

- **Alternatives/basis:** Shared Golden Glove versus fewer appearances as an additional tiebreaker, then a shared award if still tied. Both retained the proposed club-ranking/top-scorer policies. The Team Leader chose transparent equal-achievement treatment without extra unsupported criteria, accepting multiple Golden Glove recipients and nonunique in-season ranks.

- **Record:** [ADR 0014](0014-shared-ranks-and-individual-awards.md); [glossary](../../context/english/GLOSSARY.md#authority-and-information-scope).

- **Affected Phases:** PHASE 5 standings/statistics, PHASE 6 public lookup, PHASE 7 reports/summary and PHASE 10 tie/award verification. No Phase status changes.

- **Still open:** Concrete seasonal Q/R values and technical contracts. D074 in ADR 0010 settles season closure/reopening. D073 below settles summary confirmation/reconfirmation. D072 below settles qualification/relegation parameter design. D071 below settles playoff-based resolution recording. D070 below settles the head-to-head/multi-club calculation. [D066](../../context/english/use-cases/publication.md#d066---shared-standings-ranks-and-shared-individual-awards) does not settle those remaining season-end choices.

## Q70 - Fixed-group season-end head-to-head

**Status:** accepted. **Decision:** D070. The Team Leader selected Q70 option A ("Tôi chọn A."), confirming the fixed-group algorithm and common package. The authoritative rule is [D070](../../context/english/use-cases/publication.md#d070---fixed-group-season-end-head-to-head-calculation).

Choose head-to-head points followed by head-to-head away goals computed over the original tied group, rather than recursively recomputing criteria for subgroups after some clubs separate. The source specifies the criterion sequence but not the multi-club algorithm. Fixed groups simplify explanation and SE104 testing, accepting that matches against already-separated group members still affect comparisons of clubs remaining tied. Apply only for consequential season-end ties after all scheduled fixtures have Official Results; retain D066 shared ranks during the season. No extra sporting tiebreakers are selected, and unresolved stakes block finalization pending the playoff-based resolution subsequently decided in D071. D072 subsequently settles qualification/relegation parameter design; summary lifecycle is subsequently settled by D073.

## Q71 - Playoff-based ranking-resolution records

**Status:** accepted. **Decision:** D071. The Team Leader selected Q71 option A ("Tôi chọn A."), approving the full proposed package. The current owner is [D071](../../context/english/use-cases/publication.md#d071---approved-playoff-based-ranking-resolutions-within-uc22).

Record evidenced real-playoff ranking outcomes within UC22 instead of implementing detailed playoff fixtures, appearances and match events as a separate match type. This satisfies the source's necessary ranking-resolution step with a smaller SE104 scope, accepting that playoff match detail is not available like regular-season match detail. Independent Season Manager approval is mandatory and nondelegable; only approved outcomes apply, without altering regular-season points/goals/player aggregates. Submitted versions and corrections preserve history, and changed official-result bases require review and block affected finalization. No new UC, arbitrary manual standings editing, file-upload requirement or whole-v2 approval is introduced.

## Q72 - Seasonal qualification and relegation counts

**Status:** accepted. **Decision:** D072. The Team Leader selected Q72 option A ("Tôi chọn A."), approving the full proposed package. Current policy is owned by [D072](../../context/english/use-cases/registration.md#d072---seasonal-qualification-and-relegation-counts).

Choose a single generic top-Q qualification group and bottom-R relegation group rather than multiple named competition/rank-band groups. This keeps first-version configuration and consequential-tie detection simple, accepting no modeling of external cup/licensing/destination-competition rules. Q is explicit, including zero; the interview example Q = 4 is not a selected seasonal value. R defaults to three for twenty clubs; other supported club counts require explicit R. UC06 approves the parameters and freezes them at the first Official Result, explicitly extending the D045 milestone. This records approved configuration design, not concrete season setup; D073 subsequently settles season-summary lifecycle.

## Q73 - Versioned season-summary confirmation

**Status:** accepted. **Decision:** D073. The Team Leader selected Q73 option A ("Tôi chọn A."), approving the full common package. Current policy is owned by [D073](../../context/english/use-cases/publication.md#d073---versioned-season-summary-confirmation-and-reconfirmation).

Choose independent preparation/confirmation by two authorized Season Managers instead of one manager self-confirming; confirmation/reconfirmation is nondelegable. This adds a review step and staffing requirement for final season conclusions. One versioned case preserves immutable confirmed snapshots, official source bases and shared podium ranks rather than overwriting history or forcing distinct podium names. Full official-result/ranking readiness and no pending correction proposals are required at confirmation. Source changes mark the existing summary outdated/Needs reconfirmation and require a newly aggregated confirmed version, while pending proposals alone do not replace a still-valid summary. Summary confirmation does not itself close the season or remove UC19 correction capability; closure/reopening is governed separately by [D074](../../context/english/use-cases/registration.md#d074---independently-approved-season-closure-and-reopening).
