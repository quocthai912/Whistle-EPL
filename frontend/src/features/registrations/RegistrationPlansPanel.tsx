import { useMemo, useRef, useState, type FormEvent } from 'react';
import { DateTimePicker } from '../../shared/DatePickers';
import { HttpFailure, type FieldErrorDetail } from '../../shared/http/client';
import { useSession } from '../../shared/http/use-session';
import { ListFeedback } from '../accounts/AdminLists';
import { AdminSelect } from '../accounts/AdminSelect';
import css from '../accounts/Administration.module.css';
import { useAdminList } from '../accounts/use-admin-list';
import { useDialogFeedback } from '../accounts/use-dialog-feedback';
import { WorkspaceDialog as Modal } from '../accounts/WorkspaceDialog';
import { hcmInputToUtcInstant, utcInstantToHcmInput } from '../regulations/regulation-model';
import dialogCss from '../seasons/SeasonCreateForm.module.css';
import { formatSeasonInstant } from '../seasons/season-model';
import pageCss from './ClubApplicationsPage.module.css';
import regPageCss from './PlayerRegistrationsPage.module.css';
import planCss from './RegistrationPlansPanel.module.css';
import { resolvePreTransferEnd, type PlanTransferItem } from './registration-plans-model';

type PlayingEffectivityStatus =
  'NOT_VALIDATED' | 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'CANCELLED_BEFORE_EFFECTIVITY' | 'REVOKED';

export type PlanDependencyItem = {
  caseId: string | null;
  season: { id: string; code: string; name: string } | null;
  club: { id: string; code: string; name: string; abbreviation: string } | null;
  shirtNumber: number | null;
  playingStart: string | null;
  playingEnd: string | null;
  playingEffectivityStatus: PlayingEffectivityStatus | null;
  accessRestricted: boolean;
};

type AuthorizedTargetSeason = {
  id: string;
  code: string;
  name: string;
  hasEffectiveRegulation: boolean;
  effectiveRegulationVersionNumber: number | null;
  playerChangeWindows: { id: string; opensAt: string; closesAt: string }[];
  eligibleClubs: { id: string; code: string; name: string; abbreviation: string }[];
  receivedDestinationCandidates: {
    caseId: string;
    club: { id: string; code: string; name: string };
    versionId: string;
    versionNumber: number;
    revision: string;
    shirtNumber: number | null;
    playingStart: string | null;
    playingEnd: string | null;
    receiptTimingStatus: 'ON_TIME' | 'LATE' | null;
    hasApprovedException: boolean;
  }[];
};

export type RegistrationPlansResponse = {
  caseId: string;
  revision: string;
  serverNow: string;
  season: { id: string; code: string; name: string; state: 'OPEN' | 'CLOSED' };
  club: {
    id: string;
    code: string;
    name: string;
    abbreviation: string;
    discontinuedAt: string | null;
  };
  player: {
    id: string;
    code: string;
    fullName: string;
    birthDate: string;
    nationalityCode: string;
    positionCode: string;
  };
  playingEffectivityStatus: PlayingEffectivityStatus;
  currentValidatedVersion: {
    id: string;
    versionNumber: number;
    revision: string;
    state: string;
    shirtNumber: number | null;
    playingStart: string | null;
    playingEnd: string | null;
    playingDisposition: string | null;
    u21Finding: boolean | null;
    homegrownFinding: boolean | null;
    nonHomegrownOptIn: boolean;
    decisionReason: string | null;
    decidedAt: string | null;
    decider: { id: string; fullName: string; personnelCode: string } | null;
  } | null;
  activeTransferPlan: PlanTransferItem | null;
  transferHistory: PlanTransferItem[];
  dependencies: PlanDependencyItem[];
  authorizedTargetSeasons: AuthorizedTargetSeason[];
  capabilities: {
    seasonOpen: boolean;
    canManageSource: boolean;
    canTerminate: boolean;
    canTransfer: boolean;
    canPlanChange: boolean;
    canPlanCancel: boolean;
  };
};

type CurrentValidatedVersion = NonNullable<RegistrationPlansResponse['currentValidatedVersion']>;

type ActivePlanModal = 'transfer' | 'terminate' | 'plan-change' | 'plan-cancel';

type OpenModalState = {
  kind: ActivePlanModal;
  plans: RegistrationPlansResponse;
  current: CurrentValidatedVersion;
} | null;

function planRevisionKey(
  plans: RegistrationPlansResponse | null,
  current: CurrentValidatedVersion | null,
): string | null {
  if (!plans || !current) return null;
  return `${plans.revision}:${current.id}:${current.revision}:${plans.activeTransferPlan?.id ?? ''}`;
}

function formatTransferSideSummary(
  side: Pick<PlanTransferItem['oldSide'], 'accessRestricted' | 'club' | 'season'>,
): string {
  if (side.accessRestricted || !side.club || !side.season) {
    return 'Mùa giải ngoài phạm vi quyền';
  }
  return `${side.club.name} (${side.season.name})`;
}

const playingStatusLabels: Record<PlayingEffectivityStatus, string> = {
  NOT_VALIDATED: 'Chưa xác nhận',
  UPCOMING: 'Chờ hiệu lực',
  ACTIVE: 'Đang hiệu lực',
  ENDED: 'Đã kết thúc',
  CANCELLED_BEFORE_EFFECTIVITY: 'Hủy trước hiệu lực',
  REVOKED: 'Đã thu hồi hiệu lực',
};

const operationKindLabels: Record<PlanTransferItem['operationKind'], string> = {
  TRANSFER: 'Chuyển câu lạc bộ',
  PLAN_CHANGE: 'Điều chỉnh kế hoạch chuyển câu lạc bộ',
  PLAN_CANCEL: 'Hủy kế hoạch chuyển câu lạc bộ trước hiệu lực',
};

const conflictFieldLabels: Record<string, string> = {
  EFFECTIVE_REGULATION: 'Quy định mùa giải',
  CLUB_PARTICIPATION: 'Hồ sơ tham dự mùa giải',
  RECEIPT_TIMING: 'Khung thời gian tiếp nhận',
  RECEIPT_WINDOW: 'Khung thời gian tiếp nhận',
  DEPENDENT_PLAN: 'Kế hoạch phụ thuộc',
  U21_CLASSIFICATION: 'Phân loại cầu thủ trẻ U21',
  HOMEGROWN_VERIFICATION: 'Xác minh đào tạo nội địa',
  PLAYING_INTERVAL: 'Khoảng thời gian hiệu lực',
  PLAYER_OVERLAP: 'Chồng lấn đăng ký cầu thủ',
  SHIRT_NUMBER: 'Số áo đăng ký',
  SQUAD_LIMIT: 'Giới hạn đội hình',
  NON_HOMEGROWN_LIMIT: 'Giới hạn cầu thủ ngoài diện nội địa',
  effectiveAt: 'Thời điểm hiệu lực',
  playingStart: 'Bắt đầu hiệu lực thi đấu',
  playingEnd: 'Kết thúc hiệu lực thi đấu',
  shirtNumber: 'Số áo đăng ký',
  qualifyingValue: 'Thời gian đào tạo nội địa',
  destinationSeasonId: 'Mùa giải đích',
  destinationClubId: 'Câu lạc bộ đích',
  reason: 'Lý do thực hiện',
};

function cleanPlanMessage(text: string): string {
  return text
    .replace(/\s*\(BM1\)/gi, '')
    .replace(/\s*\(D0\d{2}\)/gi, '')
    .replace(/\s*theo\s+D0\d{2}/gi, '')
    .replace(/\s*D0\d{2}\b/gi, '')
    .replace(/\s*theo\s+UC1[0-2]/gi, '')
    .replace(/\s*\(non-homegrown\)/gi, '')
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z/g, (iso) =>
      formatSeasonInstant(iso),
    )
    .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_m, y, mo, d) => `${d}/${mo}/${y}`)
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function applyMutationError(
  caught: unknown,
  handlers: {
    setError: (msg: string) => void;
    setErrorDetails: (details: readonly FieldErrorDetail[]) => void;
    setReloadSuggested: (suggested: boolean) => void;
    setUncertain: (uncertain: boolean) => void;
  },
) {
  if (caught instanceof HttpFailure) {
    handlers.setError(cleanPlanMessage(caught.message));
    handlers.setErrorDetails(caught.details ?? []);
    if (caught.unknownOutcome) {
      handlers.setUncertain(true);
      handlers.setReloadSuggested(true);
    } else {
      handlers.setUncertain(false);
      handlers.setReloadSuggested(
        caught.code === 'REVISION_CONFLICT' ||
          caught.code === 'STATE_CONFLICT' ||
          caught.code === 'BASIS_CHANGED' ||
          caught.code === 'MASTER_DISCONTINUED',
      );
    }
  } else {
    handlers.setError(
      'Không thể xác nhận kết quả từ máy chủ. Vui lòng kiểm tra lại dữ liệu mới nhất.',
    );
    handlers.setErrorDetails([]);
    handlers.setUncertain(true);
    handlers.setReloadSuggested(true);
  }
}

function statusPillClass(status: PlayingEffectivityStatus): string {
  if (status === 'ACTIVE') return `${pageCss.pill} ${pageCss.pillOk}`;
  if (status === 'UPCOMING') return `${pageCss.pill} ${pageCss.pillPending}`;
  if (status === 'CANCELLED_BEFORE_EFFECTIVITY' || status === 'REVOKED') {
    return `${pageCss.pill} ${pageCss.pillLate}`;
  }
  return pageCss.pill;
}

function formatRange(start: string | null, end: string | null): string {
  if (!start) return 'Chưa ấn định';
  return end
    ? `${formatSeasonInstant(start)} → ${formatSeasonInstant(end)}`
    : `${formatSeasonInstant(start)} → Chưa ấn định`;
}

export function RegistrationPlansPanel({
  caseId,
  onChanged,
}: {
  caseId: string;
  onChanged: () => void;
}) {
  const resource = useAdminList<RegistrationPlansResponse>(`/player-registrations/${caseId}/plans`);
  const plans = resource.error ? null : (resource.data ?? null);
  const [openModal, setOpenModal] = useState<OpenModalState>(null);
  const [successNotice, setSuccessNotice] = useState('');

  const current = plans?.currentValidatedVersion ?? null;
  const activePlan = plans?.activeTransferPlan ?? null;
  const latestRevisionKey = planRevisionKey(plans, current);
  const openedRevisionKey = openModal ? planRevisionKey(openModal.plans, openModal.current) : null;
  const modalBasisChanged =
    openModal !== null && latestRevisionKey !== null && latestRevisionKey !== openedRevisionKey;

  function openPlanModal(kind: ActivePlanModal) {
    if (!plans || !current || resource.loading) return;
    setSuccessNotice('');
    setOpenModal({ kind, plans, current });
  }

  function handleMutationDone(modal: NonNullable<OpenModalState>, message: string) {
    setOpenModal((currentModal) => (currentModal === modal ? null : currentModal));
    setSuccessNotice(message);
    resource.reload();
    onChanged();
  }

  function handleModalReload() {
    setOpenModal(null);
    resource.reload();
    onChanged();
  }

  return (
    <section
      className={`${regPageCss.sectionBox} ${planCss.panelHighlight}`}
      aria-label="Khoảng hiệu lực thi đấu và kế hoạch chuyển câu lạc bộ"
    >
      <div className={regPageCss.sectionBoxHeader}>
        <h3>Khoảng hiệu lực thi đấu &amp; chuyển câu lạc bộ</h3>
        {plans && (
          <span
            className={
              activePlan
                ? `${pageCss.pill} ${pageCss.pillPending}`
                : statusPillClass(plans.playingEffectivityStatus)
            }
          >
            {activePlan
              ? `Chờ chuyển câu lạc bộ · ${formatSeasonInstant(activePlan.effectiveAt)}`
              : playingStatusLabels[plans.playingEffectivityStatus]}
          </span>
        )}
      </div>

      {successNotice && (
        <div className={css.notice} role="status">
          {successNotice}
        </div>
      )}

      <ListFeedback
        loading={resource.loading}
        error={resource.error ? cleanPlanMessage(resource.error) : undefined}
        onRetry={resource.reload}
      />

      {plans && current && (
        <>
          {/* Context banners: closed season, cross-season scope restriction, or discontinued source club */}
          {!plans.capabilities.seasonOpen && (
            <div className={`${pageCss.banner} ${pageCss.bannerWarn}`} role="status">
              <span>
                <strong>Mùa giải đã đóng:</strong> Chỉ hỗ trợ tra cứu lịch sử hiệu lực.
              </span>
            </div>
          )}

          {plans.capabilities.seasonOpen && !plans.capabilities.canManageSource && (
            <div className={`${pageCss.banner} ${pageCss.bannerWarn}`} role="status">
              <span>
                <strong>Chế độ chỉ xem:</strong> Thao tác chuyển câu lạc bộ hoặc chấm dứt hiệu lực
                yêu cầu vai trò Cán bộ đăng ký.
              </span>
            </div>
          )}

          {plans.capabilities.seasonOpen &&
            plans.capabilities.canManageSource &&
            activePlan &&
            !activePlan.canManageBothSides && (
              <div className={`${pageCss.banner} ${pageCss.bannerWarn}`} role="status">
                <span>
                  <strong>Giới hạn quyền liên mùa:</strong> Cần quyền Cán bộ đăng ký ở cả hai mùa
                  giải đang mở để điều chỉnh hoặc hủy kế hoạch này.
                </span>
              </div>
            )}

          {plans.capabilities.seasonOpen &&
            plans.capabilities.canManageSource &&
            plans.club.discontinuedAt &&
            !activePlan &&
            plans.capabilities.canTransfer && (
              <div className={pageCss.banner} role="status">
                <span>
                  <strong>Câu lạc bộ nguồn đã ngừng hoạt động:</strong> Có thể chuyển cầu thủ sang
                  câu lạc bộ đích đủ điều kiện.
                </span>
              </div>
            )}

          {/* 1. Current validated interval summary strip */}
          <div className={regPageCss.summaryStrip}>
            <div className={regPageCss.summaryItem}>
              <span className={regPageCss.summaryLabel}>Bắt đầu hiệu lực</span>
              <span className={regPageCss.summaryValue}>
                {current.playingStart ? formatSeasonInstant(current.playingStart) : 'Chưa ấn định'}
              </span>
            </div>
            <div className={regPageCss.summaryItem}>
              <span className={regPageCss.summaryLabel}>Kết thúc hiệu lực</span>
              <span className={regPageCss.summaryValue}>
                {current.playingEnd ? formatSeasonInstant(current.playingEnd) : 'Chưa ấn định'}
              </span>
            </div>
            <div className={regPageCss.summaryItem}>
              <span className={regPageCss.summaryLabel}>Số áo &amp; phiên bản</span>
              <span className={regPageCss.summaryValue}>
                {current.shirtNumber ? `#${current.shirtNumber}` : 'Chưa nhập'} · Phiên bản{' '}
                {current.versionNumber}
              </span>
            </div>
          </div>

          {/* 2. Active Paired Transfer Comparison Card */}
          {activePlan && (
            <div className={planCss.pairedCard} aria-label="Kế hoạch chuyển câu lạc bộ ghép cặp">
              <div className={planCss.pairedHeader}>
                <span className={planCss.pairedTitle}>Kế hoạch chuyển câu lạc bộ</span>
                <span
                  className={`${pageCss.pill} ${
                    activePlan.canManageBothSides ? pageCss.pillPending : regPageCss.pillWarn
                  }`}
                >
                  Hiệu lực: {formatSeasonInstant(activePlan.effectiveAt)}
                </span>
              </div>
              <div className={planCss.pairedGrid}>
                <div
                  className={`${planCss.sideBox} ${
                    activePlan.oldSide.accessRestricted || !activePlan.oldSide.afterVersion
                      ? planCss.sideBoxMuted
                      : ''
                  }`}
                >
                  <span className={planCss.sideRole}>
                    Câu lạc bộ nguồn
                    {activePlan.direction === 'OUTGOING' ? ' · Hiện tại' : ''}
                  </span>
                  <span className={planCss.sideClub}>
                    {activePlan.oldSide.accessRestricted || !activePlan.oldSide.club
                      ? 'Câu lạc bộ thuộc mùa giải ngoài phạm vi quyền'
                      : `${activePlan.oldSide.club.name} (${activePlan.oldSide.club.code})`}
                  </span>
                  <span className={planCss.sideMeta}>
                    {activePlan.oldSide.accessRestricted || !activePlan.oldSide.season
                      ? 'Ngoài phạm vi quyền'
                      : `${activePlan.oldSide.season.name}${
                          activePlan.oldSide.afterVersion
                            ? ` · #${activePlan.oldSide.afterVersion.shirtNumber ?? '—'}`
                            : ''
                        }`}
                  </span>
                  <div className={planCss.sideInterval}>
                    {activePlan.oldSide.afterVersion
                      ? formatRange(
                          activePlan.oldSide.afterVersion.playingStart,
                          activePlan.oldSide.afterVersion.playingEnd,
                        )
                      : `Kết thúc lúc ${formatSeasonInstant(activePlan.effectiveAt)}`}
                  </div>
                </div>

                <div className={planCss.arrowCol} aria-hidden="true">
                  →
                </div>

                <div
                  className={`${planCss.sideBox} ${planCss.sideBoxDest} ${
                    activePlan.newSide.accessRestricted || !activePlan.newSide.version
                      ? planCss.sideBoxMuted
                      : ''
                  }`}
                >
                  <span className={planCss.sideRole}>
                    Câu lạc bộ đích
                    {activePlan.direction === 'INCOMING' ? ' · Hiện tại' : ''}
                  </span>
                  <span className={planCss.sideClub}>
                    {activePlan.newSide.accessRestricted || !activePlan.newSide.club
                      ? 'Câu lạc bộ thuộc mùa giải ngoài phạm vi quyền'
                      : `${activePlan.newSide.club.name} (${activePlan.newSide.club.code})`}
                  </span>
                  <span className={planCss.sideMeta}>
                    {activePlan.newSide.accessRestricted || !activePlan.newSide.season
                      ? 'Ngoài phạm vi quyền'
                      : `${activePlan.newSide.season.name}${
                          activePlan.newSide.version
                            ? ` · #${activePlan.newSide.version.shirtNumber ?? '—'}`
                            : ''
                        }`}
                  </span>
                  <div className={planCss.sideInterval}>
                    {activePlan.newSide.version
                      ? formatRange(
                          activePlan.newSide.version.playingStart,
                          activePlan.newSide.version.playingEnd,
                        )
                      : `Bắt đầu lúc ${formatSeasonInstant(activePlan.effectiveAt)}`}
                  </div>
                </div>
              </div>
              <div className={regPageCss.cellSub}>
                <strong>Lý do:</strong> {activePlan.reason}
              </div>
            </div>
          )}

          {/* 3. Dependencies & Related Registrations (only when present) */}
          {plans.dependencies.length > 0 && (
            <div className={planCss.stackSection}>
              <div className={regPageCss.sectionBoxHeader}>
                <strong className={planCss.sectionSubtitle}>Hồ sơ đăng ký liên quan</strong>
                <span className={regPageCss.cellSub}>
                  {plans.dependencies.length} hồ sơ hợp lệ khác
                </span>
              </div>
              <ul className={regPageCss.findingsList}>
                {plans.dependencies.map((dep, idx) => {
                  const restricted = dep.accessRestricted || !dep.club || !dep.season;
                  return (
                    <li key={dep.caseId ?? `restricted-${idx}`} className={regPageCss.findingItem}>
                      <div>
                        <div className={regPageCss.findingTitle}>
                          {restricted
                            ? 'Hồ sơ đăng ký thuộc mùa giải ngoài phạm vi quyền'
                            : `${dep.club!.name} (${dep.club!.code}) · ${dep.season!.name}${
                                dep.shirtNumber ? ` · #${dep.shirtNumber}` : ''
                              }`}
                        </div>
                        <p className={regPageCss.findingReason}>
                          {restricted
                            ? 'Chi tiết ẩn theo phạm vi phân công.'
                            : formatRange(dep.playingStart, dep.playingEnd)}
                        </p>
                      </div>
                      <div className={regPageCss.findingBadges}>
                        {!restricted && dep.playingEffectivityStatus && (
                          <span className={statusPillClass(dep.playingEffectivityStatus)}>
                            {playingStatusLabels[dep.playingEffectivityStatus]}
                          </span>
                        )}
                        {restricted && (
                          <span className={regPageCss.basisTag}>Giới hạn phạm vi</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* 4. Action Bar (only rendered when at least one action is available) */}
          {(plans.capabilities.canTransfer ||
            plans.capabilities.canTerminate ||
            plans.capabilities.canPlanChange ||
            plans.capabilities.canPlanCancel) && (
            <div className={planCss.actionBar}>
              {plans.capabilities.canTransfer && (
                <button
                  type="button"
                  className={css.primary}
                  disabled={resource.loading}
                  onClick={() => openPlanModal('transfer')}
                >
                  {plans.club.discontinuedAt
                    ? 'Chuyển rời câu lạc bộ ngừng hoạt động'
                    : 'Chuyển câu lạc bộ'}
                </button>
              )}

              {plans.capabilities.canTerminate && (
                <button
                  type="button"
                  disabled={resource.loading}
                  onClick={() => openPlanModal('terminate')}
                >
                  Chấm dứt hiệu lực
                </button>
              )}

              {plans.capabilities.canPlanChange && (
                <button
                  type="button"
                  className={css.primary}
                  disabled={resource.loading}
                  onClick={() => openPlanModal('plan-change')}
                >
                  Điều chỉnh kế hoạch
                </button>
              )}

              {plans.capabilities.canPlanCancel && (
                <button
                  type="button"
                  className={css.danger}
                  disabled={resource.loading}
                  onClick={() => openPlanModal('plan-cancel')}
                >
                  Hủy kế hoạch trước hiệu lực
                </button>
              )}
            </div>
          )}

          {/* 5. Transfer & Plan History (collapsed by default; only shown when non-empty) */}
          {plans.transferHistory.length > 0 && (
            <details className={planCss.historyDetails}>
              <summary>
                Lịch sử chuyển nhượng &amp; kế hoạch ({plans.transferHistory.length} bản ghi)
              </summary>
              <ul className={planCss.historyList}>
                {plans.transferHistory.map((item) => (
                  <li key={item.id} className={planCss.historyItem}>
                    <div className={planCss.historyItemHeader}>
                      <span>{operationKindLabels[item.operationKind]}</span>
                      <span className={regPageCss.cellSub}>
                        {formatSeasonInstant(item.createdAt)}
                      </span>
                    </div>
                    <div className={planCss.sideMeta}>
                      {formatTransferSideSummary(item.oldSide)} →{' '}
                      {formatTransferSideSummary(item.newSide)} · Hiệu lực:{' '}
                      <strong>{formatSeasonInstant(item.effectiveAt)}</strong>
                      {item.operationKind === 'PLAN_CANCEL'
                        ? ' · Hủy trước hiệu lực'
                        : item.newSide.version?.shirtNumber
                          ? ` · #${item.newSide.version.shirtNumber}`
                          : ''}
                    </div>
                    <div className={regPageCss.cellSub}>
                      <strong>Lý do:</strong> {item.reason} · {item.actor.fullName}
                    </div>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      {/* Workflow Modals */}
      {openModal && openModal.kind === 'transfer' && (
        <TransferModal
          plans={openModal.plans}
          current={openModal.current}
          basisChanged={modalBasisChanged}
          onClose={() => setOpenModal(null)}
          onReload={handleModalReload}
          onDone={() =>
            handleMutationDone(openModal, 'Đã ghi nhận chuyển câu lạc bộ ghép cặp thành công.')
          }
        />
      )}

      {openModal && openModal.kind === 'terminate' && (
        <TerminateModal
          plans={openModal.plans}
          current={openModal.current}
          basisChanged={modalBasisChanged}
          onClose={() => setOpenModal(null)}
          onReload={handleModalReload}
          onDone={() =>
            handleMutationDone(openModal, 'Đã ghi nhận chấm dứt hiệu lực thi đấu thành công.')
          }
        />
      )}

      {openModal && openModal.kind === 'plan-change' && (
        <PlanChangeModal
          plans={openModal.plans}
          current={openModal.current}
          basisChanged={modalBasisChanged}
          isStandalone={
            !openModal.plans.activeTransferPlan &&
            !!openModal.current.playingStart &&
            openModal.plans.playingEffectivityStatus === 'UPCOMING'
          }
          onClose={() => setOpenModal(null)}
          onReload={handleModalReload}
          onDone={() =>
            handleMutationDone(
              openModal,
              openModal.plans.activeTransferPlan
                ? 'Đã cập nhật đồng bộ cả hai phía của kế hoạch chuyển câu lạc bộ.'
                : 'Đã cập nhật kế hoạch đăng ký tương lai thành công.',
            )
          }
        />
      )}

      {openModal && openModal.kind === 'plan-cancel' && (
        <PlanCancelModal
          plans={openModal.plans}
          current={openModal.current}
          basisChanged={modalBasisChanged}
          onClose={() => setOpenModal(null)}
          onReload={handleModalReload}
          onDone={() =>
            handleMutationDone(
              openModal,
              openModal.plans.activeTransferPlan
                ? 'Đã hủy kế hoạch chuyển câu lạc bộ trước hiệu lực và khôi phục hồ sơ nguồn.'
                : 'Đã chuyển kế hoạch đăng ký tương lai sang trạng thái Hủy trước hiệu lực.',
            )
          }
        />
      )}
    </section>
  );
}

function ModalErrorBanner({
  error,
  details,
  reloadSuggested,
  busy,
  onReload,
}: {
  error: string;
  details: readonly FieldErrorDetail[];
  reloadSuggested: boolean;
  busy: boolean;
  onReload: () => void;
}) {
  if (!error) return null;
  return (
    <div role="alert" className={css.error}>
      <p className={planCss.errorLead}>{error}</p>
      {details.length > 0 && (
        <ul className={planCss.errorList}>
          {details.map((item, idx) => {
            const label = Object.hasOwn(conflictFieldLabels, item.field)
              ? conflictFieldLabels[item.field]
              : null;
            const message = item.message
              ? cleanPlanMessage(item.message)
              : 'Thông tin chưa hợp lệ hoặc chưa đáp ứng điều kiện.';
            return (
              <li key={`${item.field}-${idx}`}>
                {label ? (
                  <>
                    <strong>{label}:</strong> {message}
                  </>
                ) : (
                  message
                )}
              </li>
            );
          })}
        </ul>
      )}
      {reloadSuggested && (
        <div className={planCss.errorActions}>
          <button type="button" onClick={onReload} disabled={busy}>
            Tải lại dữ liệu mới nhất
          </button>
        </div>
      )}
    </div>
  );
}

function TransferModal({
  plans,
  current,
  basisChanged = false,
  onClose,
  onReload,
  onDone,
}: {
  plans: RegistrationPlansResponse;
  current: CurrentValidatedVersion;
  basisChanged?: boolean;
  onClose: () => void;
  onReload: () => void;
  onDone: () => void;
}) {
  const { client } = useSession();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const lockedSubmitRef = useRef<{ endpoint: string; body: Record<string, unknown> } | null>(null);

  const allReceivedCandidates = useMemo(
    () =>
      plans.authorizedTargetSeasons.flatMap((season) =>
        season.receivedDestinationCandidates.map((cand) => ({
          ...cand,
          seasonId: season.id,
          seasonName: season.name,
        })),
      ),
    [plans.authorizedTargetSeasons],
  );

  const [destMode, setDestMode] = useState<'inline' | 'existing'>('inline');
  const [destSeasonId, setDestSeasonId] = useState(
    () =>
      plans.authorizedTargetSeasons.find((s) => s.id === plans.season.id)?.id ??
      plans.authorizedTargetSeasons[0]?.id ??
      '',
  );
  const selectedSeason = plans.authorizedTargetSeasons.find((s) => s.id === destSeasonId) ?? null;

  const [destClubId, setDestClubId] = useState(() => selectedSeason?.eligibleClubs[0]?.id ?? '');
  const [shirtNumber, setShirtNumber] = useState('');
  const [effectiveMode, setEffectiveMode] = useState<'SCHEDULED' | 'IMMEDIATE'>('SCHEDULED');
  const [effectiveAtInput, setEffectiveAtInput] = useState('');
  const [playingEndInput, setPlayingEndInput] = useState('');
  const [nonHomegrownOptIn, setNonHomegrownOptIn] = useState(() => current.nonHomegrownOptIn);
  const [evidenceBranch, setEvidenceBranch] = useState('');
  const [qualifyingValue, setQualifyingValue] = useState('');
  const [affiliatedBasis, setAffiliatedBasis] = useState('');
  const [evidenceSummary, setEvidenceSummary] = useState('');
  const [evidenceReference, setEvidenceReference] = useState('');
  const [selectedCandidateKey, setSelectedCandidateKey] = useState(
    () => allReceivedCandidates[0]?.versionId ?? '',
  );
  const [reason, setReason] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<readonly FieldErrorDetail[]>([]);
  const [reloadSuggested, setReloadSuggested] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const feedbackRef = useDialogFeedback(error);

  const selectedClub = selectedSeason?.eligibleClubs.find((c) => c.id === destClubId) ?? null;
  const selectedCandidate =
    allReceivedCandidates.find((c) => c.versionId === selectedCandidateKey) ?? null;

  const seasonOptions = plans.authorizedTargetSeasons.map((s) => ({
    value: s.id,
    label: s.hasEffectiveRegulation ? s.name : `${s.name} · Chưa có quy định`,
  }));

  const clubOptions = (selectedSeason?.eligibleClubs ?? []).map((c) => ({
    value: c.id,
    label: `${c.name} (${c.code})`,
  }));

  const candidateOptions = allReceivedCandidates.map((c) => ({
    value: c.versionId,
    label: `${c.club.name} (${c.seasonName}) · PB ${c.versionNumber} · #${c.shirtNumber ?? '—'}${c.receiptTimingStatus === 'LATE' ? (c.hasApprovedException ? ' · Ngoài hạn (đã duyệt)' : ' · Ngoài hạn') : ''}`,
  }));

  function setValidationError(message: string) {
    setError(message);
    setErrorDetails([]);
    setReloadSuggested(false);
  }

  function clearDefinitiveError() {
    if (!uncertain && (error || errorDetails.length > 0 || reloadSuggested)) {
      setError('');
      setErrorDetails([]);
      setReloadSuggested(false);
    }
  }

  function handleSeasonChange(nextSeasonId: string) {
    clearDefinitiveError();
    setDestSeasonId(nextSeasonId);
    const nextSeason = plans.authorizedTargetSeasons.find((s) => s.id === nextSeasonId);
    setDestClubId(nextSeason?.eligibleClubs[0]?.id ?? '');
  }

  const previewEffectiveIso = useMemo(() => {
    if (destMode === 'existing') return selectedCandidate?.playingStart ?? null;
    if (effectiveMode === 'IMMEDIATE') return null;
    return effectiveAtInput.trim() ? hcmInputToUtcInstant(effectiveAtInput.trim()) : null;
  }, [destMode, effectiveAtInput, effectiveMode, selectedCandidate]);

  const previewEndIso = useMemo(() => {
    if (destMode === 'existing') return selectedCandidate?.playingEnd ?? null;
    return playingEndInput.trim() ? hcmInputToUtcInstant(playingEndInput.trim()) : null;
  }, [destMode, playingEndInput, selectedCandidate]);

  const previewEffectiveLabel =
    destMode === 'inline' && effectiveMode === 'IMMEDIATE'
      ? 'Ngay khi ghi nhận'
      : previewEffectiveIso
        ? formatSeasonInstant(previewEffectiveIso)
        : 'Chưa chọn mốc hiệu lực';

  async function submit(event: FormEvent) {
    event.preventDefault();
    let requestToSend: { endpoint: string; body: Record<string, unknown> };

    if (uncertain && lockedSubmitRef.current) {
      requestToSend = lockedSubmitRef.current;
    } else {
      if (basisChanged) {
        setError(
          'Dữ liệu hồ sơ đã thay đổi sang phiên bản mới hơn. Vui lòng tải lại dữ liệu mới nhất trước khi gửi yêu cầu.',
        );
        setErrorDetails([]);
        setReloadSuggested(true);
        return;
      }
      if (!reason.trim()) {
        setValidationError('Vui lòng nhập lý do chuyển câu lạc bộ.');
        return;
      }

      const body: Record<string, unknown> = {
        oldVersionId: current.id,
        expectedRevision: current.revision,
        reason: reason.trim(),
      };

      if (destMode === 'existing') {
        if (!selectedCandidate) {
          setValidationError(
            'Chưa có phiên bản đích ở trạng thái Đã tiếp nhận để ghép chuyển câu lạc bộ.',
          );
          return;
        }
        if (!selectedCandidate.playingStart) {
          setValidationError('Phiên bản đích đã tiếp nhận chưa có mốc bắt đầu hiệu lực thi đấu.');
          return;
        }
        body.effectiveMode = 'SCHEDULED';
        body.effectiveAt = selectedCandidate.playingStart;
        body.destinationCaseId = selectedCandidate.caseId;
        body.destinationVersionId = selectedCandidate.versionId;
        body.destinationExpectedRevision = selectedCandidate.revision;
      } else {
        if (!destSeasonId || !destClubId) {
          setValidationError('Vui lòng chọn mùa giải đích và câu lạc bộ đích đủ điều kiện.');
          return;
        }
        const parsedShirt = Number(shirtNumber.trim());
        if (!Number.isInteger(parsedShirt) || parsedShirt < 1 || parsedShirt > 99) {
          setValidationError('Số áo đăng ký đích phải là số nguyên từ 1 đến 99.');
          return;
        }
        let effectiveUtc: string | undefined;
        if (effectiveMode === 'SCHEDULED') {
          if (!effectiveAtInput.trim()) {
            setValidationError('Vui lòng chọn thời điểm chuyển câu lạc bộ.');
            return;
          }
          const parsedEffective = hcmInputToUtcInstant(effectiveAtInput.trim());
          if (!parsedEffective) {
            setValidationError(
              'Thời điểm chuyển câu lạc bộ không đúng định dạng DD/MM/YYYY HH:mm.',
            );
            return;
          }
          effectiveUtc = parsedEffective;
        }
        let endUtc: string | undefined;
        if (playingEndInput.trim()) {
          const parsedEnd = hcmInputToUtcInstant(playingEndInput.trim());
          if (!parsedEnd) {
            setValidationError(
              'Thời điểm kết thúc đăng ký đích không đúng định dạng DD/MM/YYYY HH:mm.',
            );
            return;
          }
          endUtc = parsedEnd;
          if (effectiveUtc && new Date(endUtc).getTime() <= new Date(effectiveUtc).getTime()) {
            setValidationError(
              'Thời điểm kết thúc đăng ký đích phải lớn hơn thời điểm chuyển câu lạc bộ.',
            );
            return;
          }
        }

        body.effectiveMode = effectiveMode;
        if (effectiveUtc) body.effectiveAt = effectiveUtc;
        body.destinationSeasonId = destSeasonId;
        body.destinationClubId = destClubId;
        body.shirtNumber = parsedShirt;
        if (endUtc) body.playingEnd = endUtc;
        body.nonHomegrownOptIn = nonHomegrownOptIn;

        const hasEvidenceInput =
          !!evidenceBranch ||
          !!qualifyingValue.trim() ||
          !!affiliatedBasis ||
          !!evidenceSummary.trim() ||
          !!evidenceReference.trim();
        if (!nonHomegrownOptIn && hasEvidenceInput) {
          if (evidenceBranch === 'SEASONS' || evidenceBranch === 'MONTHS') {
            body.evidenceBranch = evidenceBranch;
          }
          if (qualifyingValue.trim()) {
            const parsedVal = Number(qualifyingValue.trim());
            if (!Number.isInteger(parsedVal) || parsedVal <= 0 || parsedVal > 1000) {
              setValidationError(
                'Giá trị thời gian đào tạo nội địa phải là số nguyên từ 1 đến 1000.',
              );
              return;
            }
            body.qualifyingValue = parsedVal;
          }
          if (affiliatedBasis === 'YES') body.affiliatedAssociationBasis = true;
          else if (affiliatedBasis === 'NO') body.affiliatedAssociationBasis = false;
          if (evidenceSummary.trim()) body.evidenceSummary = evidenceSummary.trim();
          if (evidenceReference.trim()) body.evidenceReference = evidenceReference.trim();
        }
      }

      requestToSend = {
        endpoint: `/player-registrations/${plans.caseId}/transfer`,
        body,
      };
      lockedSubmitRef.current = requestToSend;
      setError('');
      setErrorDetails([]);
      setReloadSuggested(false);
    }

    setBusy(true);
    try {
      await client.request(requestToSend.endpoint, {
        method: 'POST',
        requestKey: idempotencyKey,
        body: requestToSend.body,
      });
      onDone();
    } catch (caught) {
      if (caught instanceof HttpFailure && !caught.unknownOutcome) {
        lockedSubmitRef.current = null;
      }
      applyMutationError(caught, { setError, setErrorDetails, setReloadSuggested, setUncertain });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      title="Chuyển câu lạc bộ cho cầu thủ"
      width={740}
      className={pageCss.phase3Modal}
      closable={!busy}
      maskClosable={!busy}
      keyboard={!busy}
      onCancel={() => {
        if (!busy) onClose();
      }}
      footer={null}
    >
      <form
        ref={feedbackRef}
        onSubmit={submit}
        className={`${css.form} ${dialogCss.form}`}
        noValidate
      >
        <ModalErrorBanner
          error={error}
          details={errorDetails}
          reloadSuggested={reloadSuggested}
          busy={busy}
          onReload={onReload}
        />

        {!uncertain && basisChanged && (
          <div className={`${pageCss.banner} ${pageCss.bannerWarn}`} role="status">
            <span>
              <strong>Dữ liệu đã thay đổi:</strong> Vui lòng tải lại dữ liệu mới nhất trước khi
              tiếp tục.
            </span>
            <button type="button" onClick={onReload} disabled={busy}>
              Tải lại dữ liệu mới nhất
            </button>
          </div>
        )}

        {/* Live 2-side Before -> After Preview */}
        <div className={planCss.pairedCard}>
          <div className={planCss.pairedHeader}>
            <span className={planCss.pairedTitle}>Xem trước chuyển câu lạc bộ</span>
            <span className={`${pageCss.pill} ${pageCss.pillPending}`}>
              {previewEffectiveLabel}
            </span>
          </div>
          <div className={planCss.pairedGrid}>
            <div className={planCss.sideBox}>
              <span className={planCss.sideRole}>CLB nguồn · Chấm dứt</span>
              <span className={planCss.sideClub}>
                {plans.club.name} ({plans.club.code})
              </span>
              <span className={planCss.sideMeta}>
                {plans.season.name} · #{current.shirtNumber ?? '—'}
              </span>
              <div className={planCss.sideInterval}>
                {current.playingStart ? formatSeasonInstant(current.playingStart) : '—'} →{' '}
                {previewEffectiveLabel}
              </div>
            </div>
            <div className={planCss.arrowCol} aria-hidden="true">
              →
            </div>
            <div className={`${planCss.sideBox} ${planCss.sideBoxDest}`}>
              <span className={planCss.sideRole}>CLB đích · Bắt đầu</span>
              <span className={planCss.sideClub}>
                {destMode === 'existing'
                  ? selectedCandidate
                    ? selectedCandidate.club.name
                    : 'Chưa chọn hồ sơ đích'
                  : selectedClub
                    ? `${selectedClub.name} (${selectedClub.code})`
                    : 'Chưa chọn CLB đích'}
              </span>
              <span className={planCss.sideMeta}>
                {destMode === 'existing'
                  ? selectedCandidate
                    ? `${selectedCandidate.seasonName} · #${selectedCandidate.shirtNumber ?? '—'}`
                    : '—'
                  : `${selectedSeason?.name ?? '—'} · #${shirtNumber || '—'}`}
              </span>
              <div className={planCss.sideInterval}>
                {previewEffectiveLabel} →{' '}
                {previewEndIso ? formatSeasonInstant(previewEndIso) : 'Chưa ấn định'}
              </div>
            </div>
          </div>
        </div>

        {/* Clean segmented mode switch */}
        <div className={planCss.segmented} role="group" aria-label="Phương thức lập hồ sơ đích">
          <button
            type="button"
            aria-pressed={destMode === 'inline'}
            disabled={busy || uncertain}
            className={`${planCss.segButton} ${destMode === 'inline' ? planCss.segButtonActive : ''}`}
            onClick={() => {
              clearDefinitiveError();
              setDestMode('inline');
            }}
          >
            Tạo đăng ký đích mới
          </button>
          <button
            type="button"
            aria-pressed={destMode === 'existing'}
            disabled={busy || uncertain || allReceivedCandidates.length === 0}
            className={`${planCss.segButton} ${destMode === 'existing' ? planCss.segButtonActive : ''}`}
            onClick={() => {
              clearDefinitiveError();
              setDestMode('existing');
            }}
          >
            Ghép phiên bản đã tiếp nhận
            {allReceivedCandidates.length > 0 ? ` (${allReceivedCandidates.length})` : ''}
          </button>
        </div>

        {destMode === 'inline' ? (
          <>
            <div className={regPageCss.twoColRow}>
              <AdminSelect
                label="Mùa giải đích *"
                hideLabel={false}
                value={destSeasonId}
                options={seasonOptions}
                disabled={busy || uncertain}
                onChange={handleSeasonChange}
              />
              <AdminSelect
                label="Câu lạc bộ đích *"
                hideLabel={false}
                searchable
                value={destClubId}
                options={
                  clubOptions.length > 0
                    ? clubOptions
                    : [{ value: '', label: 'Chưa có câu lạc bộ đủ điều kiện', disabled: true }]
                }
                disabled={busy || uncertain || clubOptions.length === 0}
                onChange={(val) => {
                  clearDefinitiveError();
                  setDestClubId(val);
                }}
              />
            </div>

            <div className={regPageCss.twoColRow}>
              <label className={dialogCss.field}>
                Số áo tại câu lạc bộ đích (1–99) *
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={shirtNumber}
                  disabled={busy || uncertain}
                  placeholder="Ví dụ: 11"
                  onChange={(event) => {
                    clearDefinitiveError();
                    setShirtNumber(event.target.value);
                  }}
                />
              </label>
              <AdminSelect
                label="Chế độ hiệu lực chung *"
                hideLabel={false}
                value={effectiveMode}
                options={[
                  { value: 'SCHEDULED', label: 'Hẹn thời điểm tương lai' },
                  { value: 'IMMEDIATE', label: 'Hiệu lực ngay khi ghi nhận' },
                ]}
                disabled={busy || uncertain}
                onChange={(val) => {
                  clearDefinitiveError();
                  setEffectiveMode(val as 'SCHEDULED' | 'IMMEDIATE');
                }}
              />
            </div>

            <div className={regPageCss.twoColRow}>
              <div className={dialogCss.field}>
                <span className={regPageCss.checkboxLabelTitle}>
                  Thời điểm chuyển câu lạc bộ {effectiveMode === 'SCHEDULED' ? '*' : '(Tự động)'}
                </span>
                <DateTimePicker
                  label="Thời điểm chuyển câu lạc bộ"
                  value={effectiveAtInput}
                  disabled={busy || uncertain || effectiveMode === 'IMMEDIATE'}
                  required={effectiveMode === 'SCHEDULED'}
                  onChange={(val) => {
                    clearDefinitiveError();
                    setEffectiveAtInput(val);
                  }}
                />
              </div>
              <div className={dialogCss.field}>
                <span className={regPageCss.checkboxLabelTitle}>
                  Thời điểm kết thúc đăng ký đích (tùy chọn)
                </span>
                <DateTimePicker
                  label="Thời điểm kết thúc đăng ký đích"
                  value={playingEndInput}
                  disabled={busy || uncertain}
                  onChange={(val) => {
                    clearDefinitiveError();
                    setPlayingEndInput(val);
                  }}
                />
              </div>
            </div>

            <label className={regPageCss.checkboxCard}>
              <input
                type="checkbox"
                checked={nonHomegrownOptIn}
                disabled={busy || uncertain}
                onChange={(event) => {
                  clearDefinitiveError();
                  setNonHomegrownOptIn(event.target.checked);
                }}
              />
              <span>Xử lý hồ sơ đích theo diện ngoài đào tạo nội địa</span>
            </label>

            {!nonHomegrownOptIn && (
              <details className={planCss.evidenceDisclosure}>
                <summary>Minh chứng đào tạo nội địa cho hồ sơ đích (tùy chọn)</summary>
                <div className={planCss.evidenceDisclosureBody}>
                  <div className={regPageCss.evidenceGridThree}>
                    <AdminSelect
                      label="Nhánh tính thời gian"
                      hideLabel={false}
                      value={evidenceBranch}
                      options={[
                        { value: '', label: 'Chưa chọn' },
                        { value: 'SEASONS', label: 'Theo mùa giải' },
                        { value: 'MONTHS', label: 'Theo tháng' },
                      ]}
                      disabled={busy || uncertain}
                      onChange={(val) => {
                        clearDefinitiveError();
                        setEvidenceBranch(val);
                      }}
                    />
                    <label className={dialogCss.field}>
                      Số mùa / số tháng
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={qualifyingValue}
                        disabled={busy || uncertain}
                        onChange={(event) => {
                          clearDefinitiveError();
                          setQualifyingValue(event.target.value);
                        }}
                      />
                    </label>
                    <AdminSelect
                      label="Thuộc LĐBĐ Anh / Xứ Wales"
                      hideLabel={false}
                      value={affiliatedBasis}
                      options={[
                        { value: '', label: 'Chưa xác nhận' },
                        { value: 'YES', label: 'Đáp ứng' },
                        { value: 'NO', label: 'Không đáp ứng' },
                      ]}
                      disabled={busy || uncertain}
                      onChange={(val) => {
                        clearDefinitiveError();
                        setAffiliatedBasis(val);
                      }}
                    />
                  </div>
                  <div className={regPageCss.twoColRow}>
                    <label className={dialogCss.field}>
                      Tóm tắt minh chứng
                      <input
                        type="text"
                        maxLength={1000}
                        value={evidenceSummary}
                        disabled={busy || uncertain}
                        onChange={(event) => {
                          clearDefinitiveError();
                          setEvidenceSummary(event.target.value);
                        }}
                      />
                    </label>
                    <label className={dialogCss.field}>
                      Mã tham chiếu hồ sơ
                      <input
                        type="text"
                        maxLength={300}
                        value={evidenceReference}
                        disabled={busy || uncertain}
                        onChange={(event) => {
                          clearDefinitiveError();
                          setEvidenceReference(event.target.value);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </details>
            )}
          </>
        ) : (
          <div className={planCss.candidateStack}>
            <AdminSelect
              label="Phiên bản đích đã tiếp nhận *"
              hideLabel={false}
              value={selectedCandidateKey}
              options={candidateOptions}
              disabled={busy || uncertain}
              onChange={(val) => {
                clearDefinitiveError();
                setSelectedCandidateKey(val);
              }}
            />
          </div>
        )}

        <label>
          Lý do chuyển câu lạc bộ *
          <textarea
            className={planCss.compactReason}
            rows={2}
            maxLength={2000}
            value={reason}
            disabled={busy || uncertain}
            placeholder="Nhập lý do chuyển nhượng hoặc điều chuyển câu lạc bộ…"
            onChange={(event) => {
              clearDefinitiveError();
              setReason(event.target.value);
            }}
          />
        </label>

        <div className={css.actions}>
          <button type="button" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button
            type="submit"
            className={css.primary}
            disabled={busy || (!uncertain && basisChanged)}
          >
            {busy
              ? 'Đang xử lý…'
              : uncertain
                ? 'Kiểm tra / gửi lại cùng yêu cầu'
                : 'Xác nhận chuyển câu lạc bộ'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function TerminateModal({
  plans,
  current,
  basisChanged = false,
  onClose,
  onReload,
  onDone,
}: {
  plans: RegistrationPlansResponse;
  current: CurrentValidatedVersion;
  basisChanged?: boolean;
  onClose: () => void;
  onReload: () => void;
  onDone: () => void;
}) {
  const { client } = useSession();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const lockedSubmitRef = useRef<{ endpoint: string; body: Record<string, unknown> } | null>(null);

  const [effectiveMode, setEffectiveMode] = useState<'SCHEDULED' | 'IMMEDIATE'>('SCHEDULED');
  const [effectiveAtInput, setEffectiveAtInput] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<readonly FieldErrorDetail[]>([]);
  const [reloadSuggested, setReloadSuggested] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const feedbackRef = useDialogFeedback(error);

  function setValidationError(message: string) {
    setError(message);
    setErrorDetails([]);
    setReloadSuggested(false);
  }

  function clearDefinitiveError() {
    if (!uncertain && (error || errorDetails.length > 0 || reloadSuggested)) {
      setError('');
      setErrorDetails([]);
      setReloadSuggested(false);
    }
  }

  const previewEndLabel = useMemo(() => {
    if (effectiveMode === 'IMMEDIATE') return 'Ngay khi ghi nhận';
    const parsed = effectiveAtInput.trim() ? hcmInputToUtcInstant(effectiveAtInput.trim()) : null;
    return parsed ? formatSeasonInstant(parsed) : 'Chưa chọn mốc kết thúc';
  }, [effectiveAtInput, effectiveMode]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    let requestToSend: { endpoint: string; body: Record<string, unknown> };

    if (uncertain && lockedSubmitRef.current) {
      requestToSend = lockedSubmitRef.current;
    } else {
      if (basisChanged) {
        setError(
          'Dữ liệu hồ sơ đã thay đổi sang phiên bản mới hơn. Vui lòng tải lại dữ liệu mới nhất trước khi gửi yêu cầu.',
        );
        setErrorDetails([]);
        setReloadSuggested(true);
        return;
      }
      if (!reason.trim()) {
        setValidationError('Vui lòng nhập lý do chấm dứt hiệu lực thi đấu.');
        return;
      }
      let effectiveUtc: string | undefined;
      if (effectiveMode === 'SCHEDULED') {
        if (!effectiveAtInput.trim()) {
          setValidationError('Vui lòng chọn thời điểm chấm dứt hiệu lực.');
          return;
        }
        const parsed = hcmInputToUtcInstant(effectiveAtInput.trim());
        if (!parsed) {
          setValidationError('Thời điểm chấm dứt không đúng định dạng DD/MM/YYYY HH:mm.');
          return;
        }
        effectiveUtc = parsed;
      }

      requestToSend = {
        endpoint: `/player-registrations/${plans.caseId}/terminate`,
        body: {
          versionId: current.id,
          expectedRevision: current.revision,
          effectiveMode,
          ...(effectiveUtc ? { effectiveAt: effectiveUtc } : {}),
          reason: reason.trim(),
        },
      };
      lockedSubmitRef.current = requestToSend;
      setError('');
      setErrorDetails([]);
      setReloadSuggested(false);
    }

    setBusy(true);
    try {
      await client.request(requestToSend.endpoint, {
        method: 'POST',
        requestKey: idempotencyKey,
        body: requestToSend.body,
      });
      onDone();
    } catch (caught) {
      if (caught instanceof HttpFailure && !caught.unknownOutcome) {
        lockedSubmitRef.current = null;
      }
      applyMutationError(caught, { setError, setErrorDetails, setReloadSuggested, setUncertain });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      title="Chấm dứt hiệu lực thi đấu"
      width={600}
      className={pageCss.phase3Modal}
      closable={!busy}
      maskClosable={!busy}
      keyboard={!busy}
      onCancel={() => {
        if (!busy) onClose();
      }}
      footer={null}
    >
      <form
        ref={feedbackRef}
        onSubmit={submit}
        className={`${css.form} ${dialogCss.form}`}
        noValidate
      >
        <ModalErrorBanner
          error={error}
          details={errorDetails}
          reloadSuggested={reloadSuggested}
          busy={busy}
          onReload={onReload}
        />

        {!uncertain && basisChanged && (
          <div className={`${pageCss.banner} ${pageCss.bannerWarn}`} role="status">
            <span>
              <strong>Dữ liệu đã thay đổi:</strong> Vui lòng tải lại dữ liệu mới nhất trước khi
              tiếp tục.
            </span>
            <button type="button" onClick={onReload} disabled={busy}>
              Tải lại dữ liệu mới nhất
            </button>
          </div>
        )}

        <div className={pageCss.banner}>
          <span>
            <strong>Hiệu lực sau chấm dứt:</strong>{' '}
            {current.playingStart ? formatSeasonInstant(current.playingStart) : '—'} →{' '}
            <strong>{previewEndLabel}</strong>
          </span>
        </div>

        <div className={regPageCss.twoColRow}>
          <AdminSelect
            label="Chế độ chấm dứt *"
            hideLabel={false}
            value={effectiveMode}
            options={[
              { value: 'SCHEDULED', label: 'Hẹn thời điểm kết thúc' },
              { value: 'IMMEDIATE', label: 'Chấm dứt ngay khi ghi nhận' },
            ]}
            disabled={busy || uncertain}
            onChange={(val) => {
              clearDefinitiveError();
              setEffectiveMode(val as 'SCHEDULED' | 'IMMEDIATE');
            }}
          />
          <div className={dialogCss.field}>
            <span className={regPageCss.checkboxLabelTitle}>
              Thời điểm kết thúc {effectiveMode === 'SCHEDULED' ? '*' : '(Tự động)'}
            </span>
            <DateTimePicker
              label="Thời điểm kết thúc hiệu lực"
              value={effectiveAtInput}
              disabled={busy || uncertain || effectiveMode === 'IMMEDIATE'}
              required={effectiveMode === 'SCHEDULED'}
              onChange={(val) => {
                clearDefinitiveError();
                setEffectiveAtInput(val);
              }}
            />
          </div>
        </div>

        <label>
          Lý do chấm dứt hiệu lực *
          <textarea
            rows={3}
            maxLength={2000}
            value={reason}
            disabled={busy || uncertain}
            placeholder="Nhập lý do chấm dứt đăng ký thi đấu…"
            onChange={(event) => {
              clearDefinitiveError();
              setReason(event.target.value);
            }}
          />
        </label>

        <div className={css.actions}>
          <button type="button" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button
            type="submit"
            className={css.primary}
            disabled={busy || (!uncertain && basisChanged)}
          >
            {busy
              ? 'Đang xử lý…'
              : uncertain
                ? 'Kiểm tra / gửi lại cùng yêu cầu'
                : 'Xác nhận chấm dứt'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function PlanChangeModal({
  plans,
  current,
  isStandalone,
  basisChanged = false,
  onClose,
  onReload,
  onDone,
}: {
  plans: RegistrationPlansResponse;
  current: CurrentValidatedVersion;
  isStandalone: boolean;
  basisChanged?: boolean;
  onClose: () => void;
  onReload: () => void;
  onDone: () => void;
}) {
  const { client } = useSession();
  const [initialBasis] = useState(() => ({
    plans,
    current,
    revisionKey: planRevisionKey(plans, current),
  }));
  const liveRevisionKey = planRevisionKey(plans, current);
  const propBasisChanged =
    basisChanged ||
    (liveRevisionKey !== null &&
      initialBasis.revisionKey !== null &&
      liveRevisionKey !== initialBasis.revisionKey);

  const boundPlans = initialBasis.plans;
  const boundCurrent = initialBasis.current;
  const activePlan = boundPlans.activeTransferPlan;
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const lockedSubmitRef = useRef<{ endpoint: string; body: Record<string, unknown> } | null>(null);

  const initialStartIso = activePlan ? activePlan.effectiveAt : boundCurrent.playingStart;
  const initialEndIso = activePlan
    ? (activePlan.newSide.version?.playingEnd ?? null)
    : boundCurrent.playingEnd;
  const initialShirt = activePlan
    ? activePlan.newSide.version?.shirtNumber
    : boundCurrent.shirtNumber;

  const [playingStartInput, setPlayingStartInput] = useState(() =>
    initialStartIso ? utcInstantToHcmInput(initialStartIso) : '',
  );
  const [playingEndInput, setPlayingEndInput] = useState(() =>
    initialEndIso ? utcInstantToHcmInput(initialEndIso) : '',
  );
  const [shirtNumber, setShirtNumber] = useState(() =>
    initialShirt !== null && initialShirt !== undefined ? String(initialShirt) : '',
  );
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<readonly FieldErrorDetail[]>([]);
  const [reloadSuggested, setReloadSuggested] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const feedbackRef = useDialogFeedback(error);

  function setValidationError(message: string) {
    setError(message);
    setErrorDetails([]);
    setReloadSuggested(false);
  }

  function clearDefinitiveError() {
    if (!uncertain && (error || errorDetails.length > 0 || reloadSuggested)) {
      setError('');
      setErrorDetails([]);
      setReloadSuggested(false);
    }
  }

  const previewStartIso = useMemo(
    () => (playingStartInput.trim() ? hcmInputToUtcInstant(playingStartInput.trim()) : null),
    [playingStartInput],
  );
  const previewEndIso = useMemo(
    () => (playingEndInput.trim() ? hcmInputToUtcInstant(playingEndInput.trim()) : null),
    [playingEndInput],
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    let requestToSend: { endpoint: string; body: Record<string, unknown> };

    if (uncertain && lockedSubmitRef.current) {
      // Reuse the exact payload bound to this idempotencyKey on first submit regardless of background refreshes.
      requestToSend = lockedSubmitRef.current;
    } else {
      if (propBasisChanged) {
        setError(
          'Dữ liệu kế hoạch đã thay đổi sang phiên bản mới hơn. Vui lòng tải lại dữ liệu mới nhất trước khi gửi yêu cầu.',
        );
        setErrorDetails([]);
        setReloadSuggested(true);
        return;
      }
      if (!reason.trim()) {
        setValidationError('Vui lòng nhập lý do điều chỉnh kế hoạch tương lai.');
        return;
      }

      const body: Record<string, unknown> = {
        versionId: boundCurrent.id,
        expectedRevision: boundCurrent.revision,
        reason: reason.trim(),
        ...(activePlan ? { transferOperationId: activePlan.id } : {}),
      };

      if (!playingStartInput.trim()) {
        setValidationError('Vui lòng chọn mốc hiệu lực mới cho kế hoạch.');
        return;
      }
      const parsedStart = hcmInputToUtcInstant(playingStartInput.trim());
      if (!parsedStart) {
        setValidationError('Mốc hiệu lực mới không đúng định dạng DD/MM/YYYY HH:mm.');
        return;
      }
      body.playingStart = parsedStart;

      if (playingEndInput.trim()) {
        const parsedEnd = hcmInputToUtcInstant(playingEndInput.trim());
        if (!parsedEnd) {
          setValidationError('Thời điểm kết thúc mới không đúng định dạng DD/MM/YYYY HH:mm.');
          return;
        }
        if (new Date(parsedEnd).getTime() <= new Date(parsedStart).getTime()) {
          setValidationError('Thời điểm kết thúc mới phải lớn hơn thời điểm bắt đầu hiệu lực mới.');
          return;
        }
        body.playingEnd = parsedEnd;
      } else if (initialEndIso !== null) {
        body.playingEnd = null;
      }

      if (shirtNumber.trim()) {
        const parsed = Number(shirtNumber.trim());
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > 99) {
          setValidationError('Số áo phải là số nguyên từ 1 đến 99.');
          return;
        }
        body.shirtNumber = parsed;
      }

      requestToSend = {
        endpoint: `/player-registrations/${boundPlans.caseId}/plan-change`,
        body,
      };
      lockedSubmitRef.current = requestToSend;
      setError('');
      setErrorDetails([]);
      setReloadSuggested(false);
    }

    setBusy(true);
    try {
      await client.request(requestToSend.endpoint, {
        method: 'POST',
        requestKey: idempotencyKey,
        body: requestToSend.body,
      });
      onDone();
    } catch (caught) {
      if (caught instanceof HttpFailure && !caught.unknownOutcome) {
        lockedSubmitRef.current = null;
      }
      applyMutationError(caught, { setError, setErrorDetails, setReloadSuggested, setUncertain });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      title={
        isStandalone
          ? 'Điều chỉnh kế hoạch đăng ký tương lai'
          : 'Điều chỉnh kế hoạch chuyển câu lạc bộ tương lai'
      }
      width={680}
      className={pageCss.phase3Modal}
      closable={!busy}
      maskClosable={!busy}
      keyboard={!busy}
      onCancel={() => {
        if (!busy) onClose();
      }}
      footer={null}
    >
      <form
        ref={feedbackRef}
        onSubmit={submit}
        className={`${css.form} ${dialogCss.form}`}
        noValidate
      >
        <ModalErrorBanner
          error={error}
          details={errorDetails}
          reloadSuggested={reloadSuggested}
          busy={busy}
          onReload={onReload}
        />

        {!uncertain && propBasisChanged && (
          <div className={`${pageCss.banner} ${pageCss.bannerWarn}`} role="status">
            <span>
              <strong>Dữ liệu đã thay đổi:</strong> Kế hoạch vừa được cập nhật sang phiên bản mới
              hơn. Vui lòng tải lại dữ liệu trước khi tiếp tục thao tác.
            </span>
            <button type="button" onClick={onReload} disabled={busy}>
              Tải lại dữ liệu mới nhất
            </button>
          </div>
        )}

        {activePlan ? (
          <div className={planCss.pairedCard}>
            <div className={planCss.pairedHeader}>
              <span className={planCss.pairedTitle}>Đối chiếu trước → sau điều chỉnh</span>
              <span className={`${pageCss.pill} ${pageCss.pillPending}`}>
                Cập nhật đồng bộ 2 phía
              </span>
            </div>
            <div className={planCss.pairedGrid}>
              <div className={planCss.sideBox}>
                <span className={planCss.sideRole}>Câu lạc bộ nguồn</span>
                <span className={planCss.sideClub}>
                  {activePlan.oldSide.club
                    ? `${activePlan.oldSide.club.name} (${activePlan.oldSide.club.code})`
                    : 'Câu lạc bộ nguồn'}
                </span>
                <span className={planCss.sideMeta}>
                  Hiện tại:{' '}
                  {formatRange(
                    activePlan.oldSide.afterVersion?.playingStart ?? null,
                    activePlan.effectiveAt,
                  )}
                </span>
                <div className={planCss.sideInterval}>
                  Đề xuất:{' '}
                  {previewStartIso
                    ? formatRange(
                        activePlan.oldSide.afterVersion?.playingStart ?? null,
                        previewStartIso,
                      )
                    : 'Chưa chọn mốc mới'}
                </div>
              </div>
              <div className={planCss.arrowCol} aria-hidden="true">
                →
              </div>
              <div className={`${planCss.sideBox} ${planCss.sideBoxDest}`}>
                <span className={planCss.sideRole}>Câu lạc bộ đích</span>
                <span className={planCss.sideClub}>
                  {activePlan.newSide.club
                    ? `${activePlan.newSide.club.name} (${activePlan.newSide.club.code})`
                    : 'Câu lạc bộ đích'}
                </span>
                <span className={planCss.sideMeta}>
                  Hiện tại: {formatRange(activePlan.effectiveAt, initialEndIso)} · Số áo #
                  {activePlan.newSide.version?.shirtNumber ?? '—'}
                </span>
                <div className={planCss.sideInterval}>
                  Đề xuất:{' '}
                  {previewStartIso
                    ? formatRange(previewStartIso, previewEndIso)
                    : 'Chưa chọn mốc mới'}{' '}
                  · Số áo #{shirtNumber || '—'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={planCss.pairedCard}>
            <div className={planCss.pairedHeader}>
              <span className={planCss.pairedTitle}>Đối chiếu trước → sau điều chỉnh</span>
              <span className={`${pageCss.pill} ${pageCss.pillPending}`}>
                Cập nhật kế hoạch trước hiệu lực
              </span>
            </div>
            <div className={planCss.pairedGrid}>
              <div className={planCss.sideBox}>
                <span className={planCss.sideRole}>Kế hoạch hiện tại</span>
                <span className={planCss.sideClub}>
                  {boundPlans.club.name} ({boundPlans.club.code})
                </span>
                <span className={planCss.sideMeta}>
                  Mùa giải {boundPlans.season.name} · Số áo #{boundCurrent.shirtNumber ?? '—'}
                </span>
                <div className={planCss.sideInterval}>
                  {formatRange(boundCurrent.playingStart, boundCurrent.playingEnd)}
                </div>
              </div>
              <div className={planCss.arrowCol} aria-hidden="true">
                →
              </div>
              <div className={`${planCss.sideBox} ${planCss.sideBoxDest}`}>
                <span className={planCss.sideRole}>Kế hoạch đề xuất</span>
                <span className={planCss.sideClub}>
                  {boundPlans.club.name} ({boundPlans.club.code})
                </span>
                <span className={planCss.sideMeta}>
                  Mùa giải {boundPlans.season.name} · Số áo #{shirtNumber || '—'}
                </span>
                <div className={planCss.sideInterval}>
                  {previewStartIso
                    ? formatRange(previewStartIso, previewEndIso)
                    : 'Chưa chọn mốc mới'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={regPageCss.twoColRow}>
          <div className={dialogCss.field}>
            <span className={regPageCss.checkboxLabelTitle}>
              {activePlan
                ? 'Mốc hiệu lực chuyển câu lạc bộ mới *'
                : 'Thời điểm bắt đầu hiệu lực mới *'}
            </span>
            <DateTimePicker
              label="Mốc hiệu lực mới"
              value={playingStartInput}
              disabled={busy || uncertain}
              required
              onChange={(val) => {
                clearDefinitiveError();
                setPlayingStartInput(val);
              }}
            />
          </div>
          <label className={dialogCss.field}>
            {activePlan ? 'Số áo mới tại câu lạc bộ đích (1–99)' : 'Số áo đăng ký mới (1–99)'}
            <input
              type="number"
              min={1}
              max={99}
              value={shirtNumber}
              disabled={busy || uncertain}
              onChange={(event) => {
                clearDefinitiveError();
                setShirtNumber(event.target.value);
              }}
            />
          </label>
        </div>

        <div className={dialogCss.field}>
          <span className={regPageCss.checkboxLabelTitle}>
            {activePlan
              ? 'Thời điểm kết thúc mới tại câu lạc bộ đích (tùy chọn)'
              : 'Thời điểm kết thúc mới (tùy chọn)'}
          </span>
          <DateTimePicker
            label="Thời điểm kết thúc mới"
            value={playingEndInput}
            disabled={busy || uncertain}
            onChange={(val) => {
              clearDefinitiveError();
              setPlayingEndInput(val);
            }}
          />
        </div>

        <label>
          Lý do điều chỉnh kế hoạch *
          <textarea
            rows={3}
            maxLength={2000}
            value={reason}
            disabled={busy || uncertain}
            placeholder="Nhập lý do điều chỉnh mốc hiệu lực hoặc số áo…"
            onChange={(event) => {
              clearDefinitiveError();
              setReason(event.target.value);
            }}
          />
        </label>

        <div className={css.actions}>
          <button type="button" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button
            type="submit"
            className={css.primary}
            disabled={busy || (!uncertain && propBasisChanged)}
          >
            {busy
              ? 'Đang xử lý…'
              : uncertain
                ? 'Kiểm tra / gửi lại cùng yêu cầu'
                : 'Lưu điều chỉnh kế hoạch'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PlanCancelModal({
  plans,
  current,
  basisChanged = false,
  onClose,
  onReload,
  onDone,
}: {
  plans: RegistrationPlansResponse;
  current: CurrentValidatedVersion;
  basisChanged?: boolean;
  onClose: () => void;
  onReload: () => void;
  onDone: () => void;
}) {
  const { client } = useSession();
  const activePlan = plans.activeTransferPlan;
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const lockedSubmitRef = useRef<{ endpoint: string; body: Record<string, unknown> } | null>(null);

  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<readonly FieldErrorDetail[]>([]);
  const [reloadSuggested, setReloadSuggested] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const feedbackRef = useDialogFeedback(error);

  function setValidationError(message: string) {
    setError(message);
    setErrorDetails([]);
    setReloadSuggested(false);
  }

  function clearDefinitiveError() {
    if (!uncertain && (error || errorDetails.length > 0 || reloadSuggested)) {
      setError('');
      setErrorDetails([]);
      setReloadSuggested(false);
    }
  }

  const restoredEnd = resolvePreTransferEnd(activePlan, plans.transferHistory);

  async function submit(event: FormEvent) {
    event.preventDefault();
    let requestToSend: { endpoint: string; body: Record<string, unknown> };

    if (uncertain && lockedSubmitRef.current) {
      requestToSend = lockedSubmitRef.current;
    } else {
      if (basisChanged) {
        setError(
          'Dữ liệu kế hoạch đã thay đổi sang phiên bản mới hơn. Vui lòng tải lại dữ liệu mới nhất trước khi gửi yêu cầu.',
        );
        setErrorDetails([]);
        setReloadSuggested(true);
        return;
      }
      if (!reason.trim()) {
        setValidationError('Vui lòng nhập lý do hủy kế hoạch trước hiệu lực.');
        return;
      }

      requestToSend = {
        endpoint: `/player-registrations/${plans.caseId}/plan-cancel`,
        body: {
          versionId: current.id,
          expectedRevision: current.revision,
          ...(activePlan ? { transferOperationId: activePlan.id } : {}),
          reason: reason.trim(),
        },
      };
      lockedSubmitRef.current = requestToSend;
      setError('');
      setErrorDetails([]);
      setReloadSuggested(false);
    }

    setBusy(true);
    try {
      await client.request(requestToSend.endpoint, {
        method: 'POST',
        requestKey: idempotencyKey,
        body: requestToSend.body,
      });
      onDone();
    } catch (caught) {
      if (caught instanceof HttpFailure && !caught.unknownOutcome) {
        lockedSubmitRef.current = null;
      }
      applyMutationError(caught, { setError, setErrorDetails, setReloadSuggested, setUncertain });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      title={
        activePlan
          ? 'Hủy kế hoạch chuyển câu lạc bộ trước hiệu lực'
          : 'Hủy kế hoạch đăng ký trước hiệu lực'
      }
      width={600}
      className={pageCss.phase3Modal}
      closable={!busy}
      maskClosable={!busy}
      keyboard={!busy}
      onCancel={() => {
        if (!busy) onClose();
      }}
      footer={null}
    >
      <form
        ref={feedbackRef}
        onSubmit={submit}
        className={`${css.form} ${dialogCss.form}`}
        noValidate
      >
        <ModalErrorBanner
          error={error}
          details={errorDetails}
          reloadSuggested={reloadSuggested}
          busy={busy}
          onReload={onReload}
        />

        {!uncertain && basisChanged && (
          <div className={`${pageCss.banner} ${pageCss.bannerWarn}`} role="status">
            <span>
              <strong>Dữ liệu đã thay đổi:</strong> Kế hoạch vừa được cập nhật sang phiên bản mới
              hơn. Vui lòng tải lại dữ liệu trước khi tiếp tục thao tác.
            </span>
            <button type="button" onClick={onReload} disabled={busy}>
              Tải lại dữ liệu mới nhất
            </button>
          </div>
        )}

        <div className={planCss.dispositionBox}>
          <strong>Tác động khi hủy trước hiệu lực:</strong>
          <ul>
            {activePlan ? (
              <>
                <li>
                  Hồ sơ đích (<strong>{activePlan.newSide.club?.name ?? 'CLB đích'}</strong>): chuyển
                  sang <strong>Hủy trước hiệu lực</strong>.
                </li>
                <li>
                  Hồ sơ nguồn (<strong>{activePlan.oldSide.club?.name ?? 'CLB nguồn'}</strong>):
                  khôi phục mốc kết thúc →{' '}
                  <strong>
                    {restoredEnd.known
                      ? restoredEnd.endIso
                        ? formatSeasonInstant(restoredEnd.endIso)
                        : 'Chưa ấn định'
                      : 'theo phiên bản trước chuyển câu lạc bộ'}
                  </strong>
                  .
                </li>
              </>
            ) : (
              <li>
                Kế hoạch đăng ký tại <strong>{plans.club.name}</strong> chuyển sang trạng thái{' '}
                <strong>Hủy trước hiệu lực</strong>.
              </li>
            )}
          </ul>
        </div>

        <label>
          Lý do hủy kế hoạch trước hiệu lực *
          <textarea
            rows={3}
            maxLength={2000}
            value={reason}
            disabled={busy || uncertain}
            placeholder="Nhập lý do hủy kế hoạch trước ngày hiệu lực…"
            onChange={(event) => {
              clearDefinitiveError();
              setReason(event.target.value);
            }}
          />
        </label>

        <div className={css.actions}>
          <button type="button" disabled={busy} onClick={onClose}>
            Đóng
          </button>
          <button
            type="submit"
            className={`${css.danger} ${pageCss.dangerSolid}`}
            disabled={busy || (!uncertain && basisChanged)}
          >
            {busy
              ? 'Đang xử lý…'
              : uncertain
                ? 'Kiểm tra / gửi lại cùng yêu cầu'
                : 'Xác nhận hủy kế hoạch'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
