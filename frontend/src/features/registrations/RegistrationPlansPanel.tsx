import { useMemo, useState, type FormEvent } from 'react';
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

type PlayingEffectivityStatus =
  'NOT_VALIDATED' | 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'CANCELLED_BEFORE_EFFECTIVITY' | 'REVOKED';

type PlanSideVersion = {
  id: string;
  versionNumber: number;
  shirtNumber: number | null;
  playingStart: string | null;
  playingEnd: string | null;
  playingDisposition: string | null;
};

type PlanTransferItem = {
  id: string;
  operationKind: 'TRANSFER' | 'PLAN_CHANGE' | 'PLAN_CANCEL';
  effectiveAt: string;
  reason: string;
  supersedesOperationId: string | null;
  isSuperseded: boolean;
  createdAt: string;
  actor: { id: string; fullName: string; personnelCode: string };
  direction: 'OUTGOING' | 'INCOMING';
  canManageBothSides: boolean;
  counterpartAccessRestricted: boolean;
  oldSide: {
    caseId: string | null;
    season: { id: string; code: string; name: string; state: 'OPEN' | 'CLOSED' };
    club: {
      id: string;
      code: string;
      name: string;
      abbreviation: string;
      discontinuedAt: string | null;
    };
    beforeVersion: PlanSideVersion | null;
    afterVersion: PlanSideVersion | null;
  };
  newSide: {
    caseId: string | null;
    season: { id: string; code: string; name: string; state: 'OPEN' | 'CLOSED' };
    club: {
      id: string;
      code: string;
      name: string;
      abbreviation: string;
      discontinuedAt: string | null;
    };
    version: PlanSideVersion | null;
  };
};

type PlanDependencyItem = {
  caseId: string | null;
  season: { id: string; code: string; name: string };
  club: { id: string; code: string; name: string; abbreviation: string };
  shirtNumber: number | null;
  playingStart: string;
  playingEnd: string | null;
  playingEffectivityStatus: PlayingEffectivityStatus;
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

type RegistrationPlansResponse = {
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

type ActivePlanModal = 'transfer' | 'terminate' | 'plan-change' | 'plan-cancel' | null;

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
    } else if (
      caught.code === 'REVISION_CONFLICT' ||
      caught.code === 'STATE_CONFLICT' ||
      caught.code === 'BASIS_CHANGED' ||
      caught.code === 'MASTER_DISCONTINUED'
    ) {
      handlers.setReloadSuggested(true);
    }
  } else {
    handlers.setError(
      'Không thể xác nhận kết quả từ máy chủ. Vui lòng kiểm tra lại dữ liệu mới nhất.',
    );
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

function resolvePreTransferEnd(
  activePlan: PlanTransferItem | null,
  history: readonly PlanTransferItem[],
): { known: boolean; endIso: string | null } {
  if (!activePlan) return { known: false, endIso: null };
  const byId = new Map(history.map((item) => [item.id, item]));
  let cursor: PlanTransferItem = activePlan;
  let guard = 0;
  while (cursor.supersedesOperationId && guard < 50) {
    guard += 1;
    const prev = byId.get(cursor.supersedesOperationId);
    if (!prev) break;
    cursor = prev;
  }
  if (!cursor.oldSide.beforeVersion) {
    return { known: false, endIso: null };
  }
  return { known: true, endIso: cursor.oldSide.beforeVersion.playingEnd };
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
  const [activeModal, setActiveModal] = useState<ActivePlanModal>(null);
  const [successNotice, setSuccessNotice] = useState('');

  const current = plans?.currentValidatedVersion ?? null;
  const activePlan = plans?.activeTransferPlan ?? null;
  const isProspectiveStandalone =
    !activePlan && !!current?.playingStart && plans?.playingEffectivityStatus === 'UPCOMING';

  function handleMutationDone(message: string) {
    setActiveModal(null);
    setSuccessNotice(message);
    resource.reload();
    onChanged();
  }

  function handleModalReload() {
    setActiveModal(null);
    resource.reload();
    onChanged();
  }

  return (
    <section
      className={`${regPageCss.sectionBox} ${planCss.panelHighlight}`}
      aria-label="Khoảng hiệu lực thi đấu và kế hoạch chuyển câu lạc bộ"
    >
      <div className={regPageCss.sectionBoxHeader}>
        <h3>Khoảng hiệu lực thi đấu &amp; kế hoạch chuyển câu lạc bộ</h3>
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
      <p className={planCss.panelSub}>
        Quản lý khoảng hiệu lực nửa mở [bắt đầu, kết thúc), chuyển câu lạc bộ cùng mốc hiệu lực và
        điều chỉnh hoặc hủy kế hoạch tương lai trước khi bắt đầu hiệu lực.
      </p>

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
                <strong>Chế độ chỉ xem:</strong> Mùa giải đã đóng nên không thể thực hiện chấm dứt,
                chuyển câu lạc bộ hay thay đổi kế hoạch mới. Toàn bộ lịch sử vẫn được giữ nguyên để
                tra cứu.
              </span>
            </div>
          )}

          {plans.capabilities.seasonOpen && !plans.capabilities.canManageSource && (
            <div className={`${pageCss.banner} ${pageCss.bannerWarn}`} role="status">
              <span>
                <strong>Chế độ chỉ xem:</strong> Tài khoản hiện tại chỉ có quyền tra cứu trong mùa
                giải này; thao tác chấm dứt, chuyển câu lạc bộ hoặc quản lý kế hoạch yêu cầu vai trò
                Cán bộ đăng ký.
              </span>
            </div>
          )}

          {plans.capabilities.seasonOpen &&
            plans.capabilities.canManageSource &&
            activePlan &&
            !activePlan.canManageBothSides && (
              <div className={`${pageCss.banner} ${pageCss.bannerWarn}`} role="status">
                <span>
                  <strong>Hạn chế phạm vi quyền liên mùa giải:</strong> Kế hoạch chuyển câu lạc bộ
                  này liên kết với một mùa giải ngoài phạm vi phân công hoặc đã đóng. Bạn cần quyền
                  Cán bộ đăng ký ở cả hai mùa giải đang mở để điều chỉnh hoặc hủy cặp chuyển câu lạc
                  bộ này.
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
                  <strong>Câu lạc bộ nguồn đã ngừng hoạt động:</strong> Hồ sơ hợp lệ trước đó vẫn
                  được bảo toàn. Bạn có thể chuyển cầu thủ sang câu lạc bộ đích đủ điều kiện mà
                  không cần tiếp nhận hay xác nhận lại hồ sơ nguồn.
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
              <span className={regPageCss.cellSub}>Tính từ mốc này trở đi</span>
            </div>
            <div className={regPageCss.summaryItem}>
              <span className={regPageCss.summaryLabel}>Kết thúc hiệu lực</span>
              <span className={regPageCss.summaryValue}>
                {current.playingEnd ? formatSeasonInstant(current.playingEnd) : 'Chưa ấn định'}
              </span>
              <span className={regPageCss.cellSub}>
                {plans.playingEffectivityStatus === 'CANCELLED_BEFORE_EFFECTIVITY'
                  ? 'Kế hoạch đã bị hủy trước khi bắt đầu hiệu lực'
                  : current.playingEnd
                    ? 'Hiệu lực kết thúc ngay trước mốc này'
                    : 'Hiệu lực đến khi chấm dứt hoặc chuyển câu lạc bộ'}
              </span>
            </div>
            <div className={regPageCss.summaryItem}>
              <span className={regPageCss.summaryLabel}>Số áo &amp; phiên bản chính thức</span>
              <span className={regPageCss.summaryValue}>
                {current.shirtNumber ? `#${current.shirtNumber}` : 'Chưa nhập'} · Phiên bản{' '}
                {current.versionNumber}
              </span>
              <span className={regPageCss.cellSub}>
                {plans.club.name} ({plans.club.code})
              </span>
            </div>
          </div>

          {/* 2. Active Paired Transfer Comparison Card */}
          {activePlan && (
            <div className={planCss.pairedCard} aria-label="Kế hoạch chuyển câu lạc bộ ghép cặp">
              <div className={planCss.pairedHeader}>
                <span className={planCss.pairedTitle}>
                  Kế hoạch chuyển câu lạc bộ ghép cặp đang chờ hiệu lực
                </span>
                <span
                  className={`${pageCss.pill} ${
                    activePlan.canManageBothSides ? pageCss.pillPending : regPageCss.pillWarn
                  }`}
                >
                  Mốc hiệu lực chung: {formatSeasonInstant(activePlan.effectiveAt)}
                </span>
              </div>
              <div className={planCss.pairedGrid}>
                <div
                  className={`${planCss.sideBox} ${
                    !activePlan.oldSide.afterVersion ? planCss.sideBoxMuted : ''
                  }`}
                >
                  <span className={planCss.sideRole}>
                    Câu lạc bộ nguồn
                    {activePlan.direction === 'OUTGOING' ? ' (Hồ sơ hiện tại)' : ''}
                  </span>
                  <span className={planCss.sideClub}>
                    {activePlan.oldSide.club.name} ({activePlan.oldSide.club.code})
                  </span>
                  <span className={planCss.sideMeta}>
                    Mùa giải {activePlan.oldSide.season.name}
                    {activePlan.oldSide.afterVersion
                      ? ` · Số áo #${activePlan.oldSide.afterVersion.shirtNumber ?? '—'} · Phiên bản ${activePlan.oldSide.afterVersion.versionNumber}`
                      : ' · Ngoài phạm vi xem chi tiết'}
                  </span>
                  <div className={planCss.sideInterval}>
                    {activePlan.oldSide.afterVersion
                      ? formatRange(
                          activePlan.oldSide.afterVersion.playingStart,
                          activePlan.oldSide.afterVersion.playingEnd,
                        )
                      : `Kết thúc tại mốc ${formatSeasonInstant(activePlan.effectiveAt)}`}
                  </div>
                </div>

                <div className={planCss.arrowCol} aria-hidden="true">
                  →
                </div>

                <div
                  className={`${planCss.sideBox} ${planCss.sideBoxDest} ${
                    !activePlan.newSide.version ? planCss.sideBoxMuted : ''
                  }`}
                >
                  <span className={planCss.sideRole}>
                    Câu lạc bộ đích
                    {activePlan.direction === 'INCOMING' ? ' (Hồ sơ hiện tại)' : ''}
                  </span>
                  <span className={planCss.sideClub}>
                    {activePlan.newSide.club.name} ({activePlan.newSide.club.code})
                  </span>
                  <span className={planCss.sideMeta}>
                    Mùa giải {activePlan.newSide.season.name}
                    {activePlan.newSide.version
                      ? ` · Số áo #${activePlan.newSide.version.shirtNumber ?? '—'} · Phiên bản ${activePlan.newSide.version.versionNumber}`
                      : ' · Ngoài phạm vi xem chi tiết'}
                  </span>
                  <div className={planCss.sideInterval}>
                    {activePlan.newSide.version
                      ? formatRange(
                          activePlan.newSide.version.playingStart,
                          activePlan.newSide.version.playingEnd,
                        )
                      : `Bắt đầu từ mốc ${formatSeasonInstant(activePlan.effectiveAt)}`}
                  </div>
                </div>
              </div>
              <div className={regPageCss.cellSub}>
                <strong>Lý do:</strong> {activePlan.reason} · Ghi nhận bởi{' '}
                {activePlan.actor.fullName} ({activePlan.actor.personnelCode}) lúc{' '}
                {formatSeasonInstant(activePlan.createdAt)}.
              </div>
            </div>
          )}

          {/* 3. Dependencies & Related Registrations */}
          <div className={planCss.stackSection}>
            <div className={regPageCss.sectionBoxHeader}>
              <strong className={planCss.sectionSubtitle}>
                Hồ sơ liên quan &amp; phụ thuộc của cầu thủ
              </strong>
              <span className={regPageCss.cellSub}>
                {plans.dependencies.length} hồ sơ hợp lệ khác
              </span>
            </div>
            {plans.dependencies.length === 0 ? (
              <div className={planCss.depEmpty}>
                Không có hồ sơ đăng ký hợp lệ nào khác của cầu thủ này cần đối chiếu phụ thuộc.
              </div>
            ) : (
              <ul className={regPageCss.findingsList}>
                {plans.dependencies.map((dep, idx) => (
                  <li
                    key={`${dep.season.id}-${dep.club.id}-${dep.playingStart}-${idx}`}
                    className={regPageCss.findingItem}
                  >
                    <div>
                      <div className={regPageCss.findingTitle}>
                        {dep.club.name} ({dep.club.code}) · Mùa giải {dep.season.name}
                        {!dep.accessRestricted && dep.shirtNumber
                          ? ` · Số áo #${dep.shirtNumber}`
                          : ''}
                      </div>
                      <p className={regPageCss.findingReason}>
                        {dep.accessRestricted
                          ? `Thuộc mùa giải ngoài phạm vi xem chi tiết · Bắt đầu từ ${formatSeasonInstant(dep.playingStart)}`
                          : `Hiệu lực thi đấu: ${formatRange(dep.playingStart, dep.playingEnd)}`}
                      </p>
                    </div>
                    <div className={regPageCss.findingBadges}>
                      <span className={statusPillClass(dep.playingEffectivityStatus)}>
                        {playingStatusLabels[dep.playingEffectivityStatus]}
                      </span>
                      {dep.accessRestricted && (
                        <span className={regPageCss.basisTag}>Giới hạn phạm vi</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 4. Action Bar */}
          <div className={planCss.actionBar}>
            {plans.capabilities.canTransfer && (
              <button
                type="button"
                className={css.primary}
                onClick={() => {
                  setSuccessNotice('');
                  setActiveModal('transfer');
                }}
              >
                {plans.club.discontinuedAt
                  ? 'Chuyển rời câu lạc bộ ngừng hoạt động'
                  : 'Chuyển câu lạc bộ'}
              </button>
            )}

            {plans.capabilities.canTerminate && (
              <button
                type="button"
                onClick={() => {
                  setSuccessNotice('');
                  setActiveModal('terminate');
                }}
              >
                Chấm dứt hiệu lực
              </button>
            )}

            {plans.capabilities.canPlanChange && (
              <button
                type="button"
                className={css.primary}
                onClick={() => {
                  setSuccessNotice('');
                  setActiveModal('plan-change');
                }}
              >
                Điều chỉnh kế hoạch
              </button>
            )}

            {plans.capabilities.canPlanCancel && (
              <button
                type="button"
                className={css.danger}
                onClick={() => {
                  setSuccessNotice('');
                  setActiveModal('plan-cancel');
                }}
              >
                Hủy kế hoạch trước hiệu lực
              </button>
            )}

            {!plans.capabilities.canTransfer &&
              !plans.capabilities.canTerminate &&
              !plans.capabilities.canPlanChange &&
              !plans.capabilities.canPlanCancel && (
                <span className={regPageCss.cellSub}>
                  {activePlan && !activePlan.canManageBothSides
                    ? 'Cần quyền Cán bộ đăng ký ở cả hai mùa giải đang mở để thay đổi hoặc hủy kế hoạch này.'
                    : 'Không có thao tác chuyển câu lạc bộ hoặc điều chỉnh kế hoạch khả dụng ở trạng thái hiện tại.'}
                </span>
              )}
          </div>

          {/* 5. Transfer & Plan History */}
          <details className={planCss.historyDetails} open={plans.transferHistory.length > 0}>
            <summary>
              Lịch sử chuyển nhượng &amp; thay đổi kế hoạch ({plans.transferHistory.length} bản ghi)
            </summary>
            <ul className={planCss.historyList}>
              {plans.transferHistory.length === 0 ? (
                <li className={regPageCss.cellSub}>
                  Chưa có thao tác chuyển câu lạc bộ hoặc thay đổi kế hoạch tương lai nào.
                </li>
              ) : (
                plans.transferHistory.map((item) => (
                  <li key={item.id} className={planCss.historyItem}>
                    <div className={planCss.historyItemHeader}>
                      <span>{operationKindLabels[item.operationKind]}</span>
                      <span className={regPageCss.cellSub}>
                        {formatSeasonInstant(item.createdAt)}
                      </span>
                    </div>
                    <div className={planCss.sideMeta}>
                      {item.oldSide.club.name} ({item.oldSide.season.name}) →{' '}
                      {item.newSide.club.name} ({item.newSide.season.name}) · Mốc hiệu lực chung:{' '}
                      <strong>{formatSeasonInstant(item.effectiveAt)}</strong>
                      {item.operationKind === 'PLAN_CANCEL'
                        ? ' · Hồ sơ đích: Hủy trước hiệu lực'
                        : item.newSide.version?.shirtNumber
                          ? ` · Số áo đích #${item.newSide.version.shirtNumber}`
                          : ''}
                    </div>
                    <div className={regPageCss.cellSub}>
                      <strong>Lý do:</strong> {item.reason} · <strong>Người thực hiện:</strong>{' '}
                      {item.actor.fullName} ({item.actor.personnelCode})
                    </div>
                  </li>
                ))
              )}
            </ul>
          </details>
        </>
      )}

      {/* Workflow Modals */}
      {plans && current && activeModal === 'transfer' && (
        <TransferModal
          plans={plans}
          current={current}
          onClose={() => setActiveModal(null)}
          onReload={handleModalReload}
          onDone={() => handleMutationDone('Đã ghi nhận chuyển câu lạc bộ ghép cặp thành công.')}
        />
      )}

      {plans && current && activeModal === 'terminate' && (
        <TerminateModal
          plans={plans}
          current={current}
          onClose={() => setActiveModal(null)}
          onReload={handleModalReload}
          onDone={() => handleMutationDone('Đã ghi nhận chấm dứt hiệu lực thi đấu thành công.')}
        />
      )}

      {plans && current && activeModal === 'plan-change' && (
        <PlanChangeModal
          plans={plans}
          current={current}
          isStandalone={isProspectiveStandalone}
          onClose={() => setActiveModal(null)}
          onReload={handleModalReload}
          onDone={() =>
            handleMutationDone(
              activePlan
                ? 'Đã cập nhật đồng bộ cả hai phía của kế hoạch chuyển câu lạc bộ.'
                : 'Đã cập nhật kế hoạch đăng ký tương lai thành công.',
            )
          }
        />
      )}

      {plans && current && activeModal === 'plan-cancel' && (
        <PlanCancelModal
          plans={plans}
          current={current}
          onClose={() => setActiveModal(null)}
          onReload={handleModalReload}
          onDone={() =>
            handleMutationDone(
              activePlan
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
  onReload,
}: {
  error: string;
  details: readonly FieldErrorDetail[];
  reloadSuggested: boolean;
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
          <button type="button" onClick={onReload}>
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
  onClose,
  onReload,
  onDone,
}: {
  plans: RegistrationPlansResponse;
  current: CurrentValidatedVersion;
  onClose: () => void;
  onReload: () => void;
  onDone: () => void;
}) {
  const { client } = useSession();
  const [idempotencyKey] = useState(() => crypto.randomUUID());

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
    label: `${s.name} (${s.code})${s.effectiveRegulationVersionNumber !== null ? ` · Quy định phiên bản ${s.effectiveRegulationVersionNumber}` : ' · Chưa có quy định hiệu lực'}`,
  }));

  const clubOptions = (selectedSeason?.eligibleClubs ?? []).map((c) => ({
    value: c.id,
    label: `${c.name} (${c.code}) — Đã duyệt hồ sơ tham dự`,
  }));

  const candidateOptions = allReceivedCandidates.map((c) => ({
    value: c.versionId,
    label: `${c.club.name} (${c.seasonName}) · Phiên bản ${c.versionNumber} · Số áo #${c.shirtNumber ?? '—'}${c.receiptTimingStatus === 'LATE' ? (c.hasApprovedException ? ' · Ngoài hạn (Đã duyệt ngoại lệ)' : ' · Ngoài hạn (Chưa có ngoại lệ)') : ' · Đúng hạn'}`,
  }));

  function handleSeasonChange(nextSeasonId: string) {
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
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do chuyển câu lạc bộ.');
      return;
    }

    const body: Record<string, unknown> = {
      oldVersionId: current.id,
      expectedRevision: current.revision,
      reason: reason.trim(),
    };

    if (destMode === 'existing') {
      if (!selectedCandidate) {
        setError('Chưa có phiên bản đích ở trạng thái Đã tiếp nhận để ghép chuyển câu lạc bộ.');
        return;
      }
      if (!selectedCandidate.playingStart) {
        setError('Phiên bản đích đã tiếp nhận chưa có mốc bắt đầu hiệu lực thi đấu.');
        return;
      }
      body.effectiveMode = 'SCHEDULED';
      body.effectiveAt = selectedCandidate.playingStart;
      body.destinationCaseId = selectedCandidate.caseId;
      body.destinationVersionId = selectedCandidate.versionId;
      body.destinationExpectedRevision = selectedCandidate.revision;
    } else {
      if (!destSeasonId || !destClubId) {
        setError('Vui lòng chọn mùa giải đích và câu lạc bộ đích đủ điều kiện.');
        return;
      }
      const parsedShirt = Number(shirtNumber.trim());
      if (!Number.isInteger(parsedShirt) || parsedShirt < 1 || parsedShirt > 99) {
        setError('Số áo đăng ký đích phải là số nguyên từ 1 đến 99.');
        return;
      }
      let effectiveUtc: string | undefined;
      if (effectiveMode === 'SCHEDULED') {
        if (!effectiveAtInput.trim()) {
          setError('Vui lòng chọn thời điểm chuyển câu lạc bộ.');
          return;
        }
        const parsedEffective = hcmInputToUtcInstant(effectiveAtInput.trim());
        if (!parsedEffective) {
          setError('Thời điểm chuyển câu lạc bộ không đúng định dạng DD/MM/YYYY HH:mm.');
          return;
        }
        effectiveUtc = parsedEffective;
      }
      let endUtc: string | undefined;
      if (playingEndInput.trim()) {
        const parsedEnd = hcmInputToUtcInstant(playingEndInput.trim());
        if (!parsedEnd) {
          setError('Thời điểm kết thúc đăng ký đích không đúng định dạng DD/MM/YYYY HH:mm.');
          return;
        }
        endUtc = parsedEnd;
        if (effectiveUtc && new Date(endUtc).getTime() <= new Date(effectiveUtc).getTime()) {
          setError('Thời điểm kết thúc đăng ký đích phải lớn hơn thời điểm chuyển câu lạc bộ.');
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
            setError('Giá trị thời gian đào tạo nội địa phải là số nguyên từ 1 đến 1000.');
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

    setBusy(true);
    setError('');
    setErrorDetails([]);
    setReloadSuggested(false);
    try {
      await client.request(`/player-registrations/${plans.caseId}/transfer`, {
        method: 'POST',
        requestKey: idempotencyKey,
        body,
      });
      onDone();
    } catch (caught) {
      applyMutationError(caught, { setError, setErrorDetails, setReloadSuggested, setUncertain });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      title="Chuyển câu lạc bộ cho cầu thủ"
      width={680}
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
          onReload={onReload}
        />

        {plans.club.discontinuedAt && (
          <div className={pageCss.banner}>
            <span>
              <strong>Câu lạc bộ nguồn đã ngừng hoạt động:</strong> Hệ thống sẽ chấm dứt hồ sơ nguồn
              mà không kiểm tra tiếp nhận lại câu lạc bộ cũ; chỉ hồ sơ đích chịu đầy đủ điều kiện
              xác nhận mới.
            </span>
          </div>
        )}

        {/* Live 2-side Before -> After Preview */}
        <div className={planCss.pairedCard}>
          <div className={planCss.pairedHeader}>
            <span className={planCss.pairedTitle}>
              Xem trước tác động hai phía cùng mốc hiệu lực
            </span>
            <span className={`${pageCss.pill} ${pageCss.pillPending}`}>
              {previewEffectiveLabel}
            </span>
          </div>
          <div className={planCss.pairedGrid}>
            <div className={planCss.sideBox}>
              <span className={planCss.sideRole}>Câu lạc bộ nguồn (Chấm dứt)</span>
              <span className={planCss.sideClub}>
                {plans.club.name} ({plans.club.code})
              </span>
              <span className={planCss.sideMeta}>
                Mùa giải {plans.season.name} · Số áo #{current.shirtNumber ?? '—'}
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
              <span className={planCss.sideRole}>Câu lạc bộ đích (Bắt đầu hiệu lực)</span>
              <span className={planCss.sideClub}>
                {destMode === 'existing'
                  ? selectedCandidate
                    ? selectedCandidate.club.name
                    : 'Chưa chọn hồ sơ đích'
                  : selectedClub
                    ? `${selectedClub.name} (${selectedClub.code})`
                    : 'Chưa chọn câu lạc bộ đích'}
              </span>
              <span className={planCss.sideMeta}>
                {destMode === 'existing'
                  ? selectedCandidate
                    ? `Mùa giải ${selectedCandidate.seasonName} · Số áo #${selectedCandidate.shirtNumber ?? '—'}`
                    : '—'
                  : `Mùa giải ${selectedSeason?.name ?? '—'} · Số áo #${shirtNumber || '—'}`}
              </span>
              <div className={planCss.sideInterval}>
                {previewEffectiveLabel} →{' '}
                {previewEndIso ? formatSeasonInstant(previewEndIso) : 'Chưa ấn định'}
              </div>
            </div>
          </div>
        </div>

        {/* Mode switch */}
        <div className={planCss.segmented} role="group" aria-label="Phương thức lập hồ sơ đích">
          <button
            type="button"
            aria-pressed={destMode === 'inline'}
            disabled={busy || uncertain}
            className={`${planCss.segButton} ${destMode === 'inline' ? planCss.segButtonActive : ''}`}
            onClick={() => setDestMode('inline')}
          >
            <span>Tạo đăng ký đích mới</span>
            <span className={planCss.segHint}>Áp dụng trong khung tiếp nhận đang mở</span>
          </button>
          <button
            type="button"
            aria-pressed={destMode === 'existing'}
            disabled={busy || uncertain || allReceivedCandidates.length === 0}
            className={`${planCss.segButton} ${destMode === 'existing' ? planCss.segButtonActive : ''}`}
            onClick={() => setDestMode('existing')}
          >
            <span>Ghép phiên bản đích đã tiếp nhận</span>
            <span className={planCss.segHint}>
              {allReceivedCandidates.length > 0
                ? `${allReceivedCandidates.length} phiên bản sẵn sàng (hỗ trợ ngoại lệ ngoài hạn)`
                : 'Chưa có phiên bản đích ở trạng thái Đã tiếp nhận'}
            </span>
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
                onChange={setDestClubId}
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
                  onChange={(event) => setShirtNumber(event.target.value)}
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
                onChange={(val) => setEffectiveMode(val as 'SCHEDULED' | 'IMMEDIATE')}
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
                  onChange={setEffectiveAtInput}
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
                  onChange={setPlayingEndInput}
                />
              </div>
            </div>

            <div className={regPageCss.checkboxField}>
              <label className={regPageCss.checkboxCard}>
                <input
                  type="checkbox"
                  checked={nonHomegrownOptIn}
                  disabled={busy || uncertain}
                  onChange={(event) => setNonHomegrownOptIn(event.target.checked)}
                />
                <span>Xử lý hồ sơ đích theo diện ngoài đào tạo nội địa</span>
              </label>
            </div>

            {!nonHomegrownOptIn && (
              <div className={regPageCss.evidenceSection}>
                <div className={regPageCss.evidenceHeader}>
                  <h3>Minh chứng đào tạo nội địa cho hồ sơ đích (tùy chọn nếu thuộc diện U21)</h3>
                </div>
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
                    onChange={setEvidenceBranch}
                  />
                  <label className={dialogCss.field}>
                    Số mùa / số tháng
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={qualifyingValue}
                      disabled={busy || uncertain}
                      onChange={(event) => setQualifyingValue(event.target.value)}
                    />
                  </label>
                  <AdminSelect
                    label="Thuộc liên đoàn Anh / Xứ Wales"
                    hideLabel={false}
                    value={affiliatedBasis}
                    options={[
                      { value: '', label: 'Chưa xác nhận' },
                      { value: 'YES', label: 'Đáp ứng' },
                      { value: 'NO', label: 'Không đáp ứng' },
                    ]}
                    disabled={busy || uncertain}
                    onChange={setAffiliatedBasis}
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
                      onChange={(event) => setEvidenceSummary(event.target.value)}
                    />
                  </label>
                  <label className={dialogCss.field}>
                    Mã tham chiếu hồ sơ
                    <input
                      type="text"
                      maxLength={300}
                      value={evidenceReference}
                      disabled={busy || uncertain}
                      onChange={(event) => setEvidenceReference(event.target.value)}
                    />
                  </label>
                </div>
              </div>
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
              onChange={setSelectedCandidateKey}
            />
            <p className={pageCss.metaNote}>
              Thời điểm chuyển câu lạc bộ sẽ tự động gắn khớp chính xác với mốc bắt đầu của phiên
              bản đích đã tiếp nhận.
            </p>
          </div>
        )}

        <label>
          Lý do chuyển câu lạc bộ *
          <textarea
            rows={3}
            maxLength={2000}
            value={reason}
            disabled={busy || uncertain}
            placeholder="Nhập lý do chuyển nhượng hoặc điều chuyển câu lạc bộ…"
            onChange={(event) => setReason(event.target.value)}
          />
        </label>

        <div className={css.actions}>
          <button type="button" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className={css.primary} disabled={busy}>
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
  onClose,
  onReload,
  onDone,
}: {
  plans: RegistrationPlansResponse;
  current: CurrentValidatedVersion;
  onClose: () => void;
  onReload: () => void;
  onDone: () => void;
}) {
  const { client } = useSession();
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const [effectiveMode, setEffectiveMode] = useState<'SCHEDULED' | 'IMMEDIATE'>('SCHEDULED');
  const [effectiveAtInput, setEffectiveAtInput] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<readonly FieldErrorDetail[]>([]);
  const [reloadSuggested, setReloadSuggested] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const feedbackRef = useDialogFeedback(error);

  const previewEndLabel = useMemo(() => {
    if (effectiveMode === 'IMMEDIATE') return 'Ngay khi ghi nhận';
    const parsed = effectiveAtInput.trim() ? hcmInputToUtcInstant(effectiveAtInput.trim()) : null;
    return parsed ? formatSeasonInstant(parsed) : 'Chưa chọn mốc kết thúc';
  }, [effectiveAtInput, effectiveMode]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do chấm dứt hiệu lực thi đấu.');
      return;
    }
    let effectiveUtc: string | undefined;
    if (effectiveMode === 'SCHEDULED') {
      if (!effectiveAtInput.trim()) {
        setError('Vui lòng chọn thời điểm chấm dứt hiệu lực.');
        return;
      }
      const parsed = hcmInputToUtcInstant(effectiveAtInput.trim());
      if (!parsed) {
        setError('Thời điểm chấm dứt không đúng định dạng DD/MM/YYYY HH:mm.');
        return;
      }
      effectiveUtc = parsed;
    }

    setBusy(true);
    setError('');
    setErrorDetails([]);
    setReloadSuggested(false);
    try {
      await client.request(`/player-registrations/${plans.caseId}/terminate`, {
        method: 'POST',
        requestKey: idempotencyKey,
        body: {
          versionId: current.id,
          expectedRevision: current.revision,
          effectiveMode,
          ...(effectiveUtc ? { effectiveAt: effectiveUtc } : {}),
          reason: reason.trim(),
        },
      });
      onDone();
    } catch (caught) {
      applyMutationError(caught, { setError, setErrorDetails, setReloadSuggested, setUncertain });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      title="Chấm dứt hiệu lực thi đấu"
      width={580}
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
          onReload={onReload}
        />

        <div className={pageCss.banner}>
          <span>
            <strong>Khoảng hiệu lực sau khi chấm dứt:</strong>{' '}
            {current.playingStart ? formatSeasonInstant(current.playingStart) : '—'} →{' '}
            <strong>{previewEndLabel}</strong>. Không được chấm dứt hồi tố trước thời điểm hệ thống
            ghi nhận.
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
            onChange={(val) => setEffectiveMode(val as 'SCHEDULED' | 'IMMEDIATE')}
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
              onChange={setEffectiveAtInput}
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
            onChange={(event) => setReason(event.target.value)}
          />
        </label>

        <div className={css.actions}>
          <button type="button" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className={css.primary} disabled={busy}>
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

function PlanChangeModal({
  plans,
  current,
  isStandalone,
  onClose,
  onReload,
  onDone,
}: {
  plans: RegistrationPlansResponse;
  current: CurrentValidatedVersion;
  isStandalone: boolean;
  onClose: () => void;
  onReload: () => void;
  onDone: () => void;
}) {
  const { client } = useSession();
  const activePlan = plans.activeTransferPlan;
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const initialStartIso = activePlan ? activePlan.effectiveAt : current.playingStart;
  const initialEndIso = activePlan
    ? (activePlan.newSide.version?.playingEnd ?? null)
    : current.playingEnd;
  const initialShirt = activePlan ? activePlan.newSide.version?.shirtNumber : current.shirtNumber;

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
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do điều chỉnh kế hoạch tương lai.');
      return;
    }

    const body: Record<string, unknown> = {
      versionId: current.id,
      expectedRevision: current.revision,
      reason: reason.trim(),
      ...(activePlan ? { transferOperationId: activePlan.id } : {}),
    };

    if (!playingStartInput.trim()) {
      setError('Vui lòng chọn mốc hiệu lực mới cho kế hoạch.');
      return;
    }
    const parsedStart = hcmInputToUtcInstant(playingStartInput.trim());
    if (!parsedStart) {
      setError('Mốc hiệu lực mới không đúng định dạng DD/MM/YYYY HH:mm.');
      return;
    }
    body.playingStart = parsedStart;

    if (playingEndInput.trim()) {
      const parsedEnd = hcmInputToUtcInstant(playingEndInput.trim());
      if (!parsedEnd) {
        setError('Thời điểm kết thúc mới không đúng định dạng DD/MM/YYYY HH:mm.');
        return;
      }
      if (new Date(parsedEnd).getTime() <= new Date(parsedStart).getTime()) {
        setError('Thời điểm kết thúc mới phải lớn hơn thời điểm bắt đầu hiệu lực mới.');
        return;
      }
      body.playingEnd = parsedEnd;
    } else if (initialEndIso !== null) {
      body.playingEnd = null;
    }

    if (shirtNumber.trim()) {
      const parsed = Number(shirtNumber.trim());
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 99) {
        setError('Số áo phải là số nguyên từ 1 đến 99.');
        return;
      }
      body.shirtNumber = parsed;
    }

    setBusy(true);
    setError('');
    setErrorDetails([]);
    setReloadSuggested(false);
    try {
      await client.request(`/player-registrations/${plans.caseId}/plan-change`, {
        method: 'POST',
        requestKey: idempotencyKey,
        body,
      });
      onDone();
    } catch (caught) {
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
      width={660}
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
          onReload={onReload}
        />

        <div className={`${pageCss.banner} ${pageCss.bannerWarn}`}>
          <span>
            <strong>Lưu ý điều kiện tiếp nhận:</strong> Điều chỉnh kế hoạch tương lai phải thực hiện
            trước thời điểm bắt đầu hiệu lực, nằm trong khung thời gian tiếp nhận thay đổi cầu thủ
            hiện hành và được kiểm tra lại toàn bộ điều kiện đội hình, số áo.
          </span>
        </div>

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
                  {activePlan.oldSide.club.name} ({activePlan.oldSide.club.code})
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
                  {activePlan.newSide.club.name} ({activePlan.newSide.club.code})
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
                  {plans.club.name} ({plans.club.code})
                </span>
                <span className={planCss.sideMeta}>
                  Mùa giải {plans.season.name} · Số áo #{current.shirtNumber ?? '—'}
                </span>
                <div className={planCss.sideInterval}>
                  {formatRange(current.playingStart, current.playingEnd)}
                </div>
              </div>
              <div className={planCss.arrowCol} aria-hidden="true">
                →
              </div>
              <div className={`${planCss.sideBox} ${planCss.sideBoxDest}`}>
                <span className={planCss.sideRole}>Kế hoạch đề xuất</span>
                <span className={planCss.sideClub}>
                  {plans.club.name} ({plans.club.code})
                </span>
                <span className={planCss.sideMeta}>
                  Mùa giải {plans.season.name} · Số áo #{shirtNumber || '—'}
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
              onChange={setPlayingStartInput}
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
              onChange={(event) => setShirtNumber(event.target.value)}
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
            onChange={setPlayingEndInput}
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
            onChange={(event) => setReason(event.target.value)}
          />
        </label>

        <div className={css.actions}>
          <button type="button" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className={css.primary} disabled={busy}>
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
  onClose,
  onReload,
  onDone,
}: {
  plans: RegistrationPlansResponse;
  current: CurrentValidatedVersion;
  onClose: () => void;
  onReload: () => void;
  onDone: () => void;
}) {
  const { client } = useSession();
  const activePlan = plans.activeTransferPlan;
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<readonly FieldErrorDetail[]>([]);
  const [reloadSuggested, setReloadSuggested] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const feedbackRef = useDialogFeedback(error);

  const restoredEnd = resolvePreTransferEnd(activePlan, plans.transferHistory);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do hủy kế hoạch trước hiệu lực.');
      return;
    }

    setBusy(true);
    setError('');
    setErrorDetails([]);
    setReloadSuggested(false);
    try {
      await client.request(`/player-registrations/${plans.caseId}/plan-cancel`, {
        method: 'POST',
        requestKey: idempotencyKey,
        body: {
          versionId: current.id,
          expectedRevision: current.revision,
          ...(activePlan ? { transferOperationId: activePlan.id } : {}),
          reason: reason.trim(),
        },
      });
      onDone();
    } catch (caught) {
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
          onReload={onReload}
        />

        <div className={planCss.dispositionBox}>
          <strong>Hậu quả khi xác nhận hủy kế hoạch trước hiệu lực:</strong>
          <ul>
            {activePlan ? (
              <>
                <li>
                  Hồ sơ đích tại <strong>{activePlan.newSide.club.name}</strong> chuyển trạng thái
                  hiệu lực sang <strong>Hủy trước hiệu lực</strong> (giữ nguyên lịch sử xác nhận
                  trước đó, không xóa bản ghi).
                </li>
                <li>
                  Hồ sơ nguồn tại <strong>{activePlan.oldSide.club.name}</strong> sẽ được{' '}
                  <strong>khôi phục thời điểm kết thúc trước chuyển câu lạc bộ</strong> (
                  <em>
                    {restoredEnd.known
                      ? restoredEnd.endIso
                        ? formatSeasonInstant(restoredEnd.endIso)
                        : 'Chưa ấn định'
                      : 'theo phiên bản trước chuyển câu lạc bộ'}
                  </em>
                  ) nếu không gây chồng lấn đăng ký, trùng số áo hoặc vượt hạn mức đội hình.
                </li>
                <li>
                  Nếu việc khôi phục xung đột với một hồ sơ khác, thao tác hủy sẽ bị từ chối toàn bộ
                  và kế hoạch hiện tại được bảo toàn, không tự động hủy hồ sơ phụ thuộc.
                </li>
              </>
            ) : (
              <li>
                Kế hoạch đăng ký tại <strong>{plans.club.name}</strong> sẽ chuyển sang trạng thái{' '}
                <strong>Hủy trước hiệu lực</strong> và vẫn lưu giữ toàn bộ lịch sử xác nhận trước
                đó.
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
            onChange={(event) => setReason(event.target.value)}
          />
        </label>

        <div className={css.actions}>
          <button type="button" disabled={busy} onClick={onClose}>
            Đóng
          </button>
          <button type="submit" className={`${css.danger} ${pageCss.dangerSolid}`} disabled={busy}>
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
