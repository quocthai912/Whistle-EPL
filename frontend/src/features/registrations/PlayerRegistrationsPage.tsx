import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { formatDisplayDate } from '../../shared/date-format';
import { HttpFailure, type FieldErrorDetail } from '../../shared/http/client';
import { useSession } from '../../shared/http/use-session';
import { AdminDrawer } from '../accounts/AdminDrawer';
import { AdminIcon } from '../accounts/AdminIcon';
import { DisplayOptions, ListFeedback, Pagination } from '../accounts/AdminLists';
import { AdminSelect } from '../accounts/AdminSelect';
import css from '../accounts/Administration.module.css';
import { useAdminList } from '../accounts/use-admin-list';
import { useDialogFeedback } from '../accounts/use-dialog-feedback';
import { useSearchTerm } from '../accounts/use-search-term';
import { WorkspaceDialog as Modal } from '../accounts/WorkspaceDialog';
import { actions } from '../audit/audit-filters';
import clubCss from '../clubs/ClubsPage.module.css';
import dialogCss from '../seasons/SeasonCreateForm.module.css';
import {
  formatSeasonInstant,
  type SeasonHistory,
  type SeasonHistoryMeta,
  type SeasonList,
} from '../seasons/season-model';
import pageCss from './ClubApplicationsPage.module.css';
import {
  PlayerRegistrationForm,
  type PlayerRegistrationReferences,
  type RegistrationInitialDraftValues,
} from './PlayerRegistrationForm';
import regPageCss from './PlayerRegistrationsPage.module.css';
import { RegistrationPlansPanel } from './RegistrationPlansPanel';

type RegistrationState = 'DRAFT' | 'RECEIVED' | 'NEEDS_SUPPLEMENTATION' | 'VALID' | 'CANCELLED';

type PlayingEffectivityStatus =
  'NOT_VALIDATED' | 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'CANCELLED_BEFORE_EFFECTIVITY' | 'REVOKED';

type FindingStatus = 'MET' | 'UNMET' | 'INSUFFICIENT_BASIS' | 'NOT_APPLICABLE';

type EligibilityCriterionFinding = {
  criterion: string;
  status: FindingStatus;
  reason: string;
  regulationVersionId: string | null;
};

type EligibilityAssessment = {
  mode: 'PRECHECK' | 'CONFIRMATION';
  eligibleForConfirmation: boolean;
  regulationVersionId: string | null;
  receiptRegulationVersionId: string | null;
  u21Finding: boolean | null;
  homegrownFinding: boolean | null;
  squadLimit: number | null;
  nonHomegrownLimit: number | null;
  criteria: EligibilityCriterionFinding[];
  blockingCriteria: EligibilityCriterionFinding[];
};

const stateLabels: Record<RegistrationState, string> = {
  DRAFT: 'Nháp',
  RECEIVED: 'Đã tiếp nhận',
  NEEDS_SUPPLEMENTATION: 'Cần bổ sung',
  VALID: 'Hợp lệ',
  CANCELLED: 'Đã hủy',
};

const playingStatusLabels: Record<PlayingEffectivityStatus, string> = {
  NOT_VALIDATED: 'Chưa xác nhận',
  UPCOMING: 'Chờ hiệu lực',
  ACTIVE: 'Đang hiệu lực',
  ENDED: 'Đã kết thúc',
  CANCELLED_BEFORE_EFFECTIVITY: 'Hủy trước hiệu lực',
  REVOKED: 'Đã thu hồi hiệu lực',
};

const exceptionStateLabels: Record<string, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Chờ phê duyệt',
  RETURNED: 'Đã trả lại',
  WITHDRAWN: 'Đã rút',
  REJECTED: 'Bị từ chối',
  APPROVED: 'Đã phê duyệt',
};

const criterionLabels: Record<string, string> = {
  EFFECTIVE_REGULATION: 'Quy định mùa giải đang có hiệu lực',
  CLUB_PARTICIPATION: 'Tư cách tham dự mùa giải của câu lạc bộ',
  RECEIPT_TIMING: 'Thời hạn tiếp nhận và ngoại lệ tiếp nhận',
  U21_CLASSIFICATION: 'Phân loại cầu thủ trẻ U21',
  HOMEGROWN_VERIFICATION: 'Xác minh điều kiện đào tạo nội địa',
  PLAYING_INTERVAL: 'Khoảng thời gian hiệu lực thi đấu',
  PLAYER_OVERLAP: 'Kiểm tra chồng lấn đăng ký cầu thủ trên toàn giải',
  SHIRT_NUMBER: 'Số áo đăng ký và trùng số áo trong câu lạc bộ',
  SQUAD_LIMIT: 'Giới hạn tổng số cầu thủ tính hạn mức',
  NON_HOMEGROWN_LIMIT: 'Giới hạn cầu thủ ngoài diện đào tạo nội địa',
};

const findingStatusLabels: Record<FindingStatus, string> = {
  MET: 'Đạt',
  UNMET: 'Chưa đạt',
  INSUFFICIENT_BASIS: 'Chưa đủ căn cứ',
  NOT_APPLICABLE: 'Không áp dụng',
};

const stateFilterOptions = [
  { value: 'ALL', label: 'Tất cả trạng thái hồ sơ' },
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'RECEIVED', label: 'Đã tiếp nhận' },
  { value: 'NEEDS_SUPPLEMENTATION', label: 'Cần bổ sung' },
  { value: 'VALID', label: 'Hợp lệ' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const playingFilterOptions = [
  { value: 'ALL', label: 'Tất cả hiệu lực thi đấu' },
  { value: 'NOT_VALIDATED', label: 'Chưa xác nhận' },
  { value: 'UPCOMING', label: 'Chờ hiệu lực' },
  { value: 'ACTIVE', label: 'Đang hiệu lực' },
  { value: 'ENDED', label: 'Đã kết thúc' },
  { value: 'CANCELLED_BEFORE_EFFECTIVITY', label: 'Hủy trước hiệu lực' },
];

type RegistrationSummary = {
  id: string;
  seasonId: string;
  revision: string;
  currentDraftVersionId: string | null;
  currentValidatedVersionId: string | null;
  updatedAt: string;
  playingEffectivityStatus: PlayingEffectivityStatus;
  club: {
    id: string;
    code: string;
    name: string;
    abbreviation: string;
    discontinuedAt: string | null;
    hasApprovedApplication: boolean;
  };
  player: {
    id: string;
    code: string;
    fullName: string;
    birthDate: string;
    nationalityCode: string;
    positionCode: string;
  };
  latestVersion: {
    id: string;
    versionNumber: number;
    revision: string;
    state: RegistrationState;
    shirtNumber: number | null;
    playingStart: string | null;
    playingEnd: string | null;
    u21Finding: boolean | null;
    homegrownFinding: boolean | null;
    nonHomegrownOptIn: boolean;
    receivedAt: string | null;
    receiptTimingStatus: 'ON_TIME' | 'LATE' | null;
    decidedAt: string | null;
    playingDisposition: string | null;
    hasApprovedException: boolean;
  } | null;
  currentValidatedVersion: {
    id: string;
    versionNumber: number;
    shirtNumber: number | null;
    playingStart: string | null;
    playingEnd: string | null;
    u21Finding: boolean | null;
    homegrownFinding: boolean | null;
    nonHomegrownOptIn: boolean;
    playingDisposition: string | null;
    decidedAt: string | null;
    decisionRegulationVersionId: string | null;
  } | null;
};

type RegistrationListResponse = {
  items: RegistrationSummary[];
  capabilities: { canManage: boolean; canDecideExceptions: boolean };
};

type ReceiptExceptionItem = {
  caseId: string;
  id: string;
  versionNumber: number;
  revision: string;
  state: string;
  reason: string | null;
  basis: string | null;
  preparedBy: string;
  preparer: { id: string; fullName: string; personnelCode: string };
  editorIds: string[];
  submittedAt: string | null;
  decidedAt: string | null;
  decidedBy: string | null;
  decider: { id: string; fullName: string; personnelCode: string } | null;
  decisionReason: string | null;
};

type RegistrationVersionDetail = {
  id: string;
  versionNumber: number;
  predecessorVersionId: string | null;
  revision: string;
  state: RegistrationState;
  playingEffectivityStatus: PlayingEffectivityStatus;
  preparedBy: string;
  preparer: { id: string; fullName: string; personnelCode: string };
  receivedAt: string | null;
  decidedAt: string | null;
  decidedBy: string | null;
  decider: { id: string; fullName: string; personnelCode: string } | null;
  decisionReason: string | null;
  shirtNumber: number | null;
  playingStart: string | null;
  playingEnd: string | null;
  u21Finding: boolean | null;
  homegrownFinding: boolean | null;
  nonHomegrownOptIn: boolean;
  evidenceBranch: 'SEASONS' | 'MONTHS' | null;
  qualifyingValue: number | null;
  evidenceSummary: string | null;
  evidenceReference: string | null;
  verifiedBy: string | null;
  verifier: { id: string; fullName: string; personnelCode: string } | null;
  verifiedAt: string | null;
  affiliatedAssociationBasis: boolean | null;
  receiptRegulationVersionId: string | null;
  receiptRegulationVersion: { id: string; versionNumber: number } | null;
  receiptTimingStatus: 'ON_TIME' | 'LATE' | null;
  receiptWindow: { id: string; opensAt: string; closesAt: string } | null;
  decisionRegulationVersionId: string | null;
  decisionRegulationVersion: { id: string; versionNumber: number } | null;
  officialSnapshot: {
    capturedAt?: string;
    club?: { code?: string; name?: string };
    player?: { code?: string; fullName?: string; birthDate?: string };
    registration?: {
      shirtNumber?: number | null;
      playingStart?: string | null;
      playingEnd?: string | null;
      u21Finding?: boolean | null;
      homegrownFinding?: boolean | null;
      nonHomegrownOptIn?: boolean;
    };
    basis?: {
      squadLimit?: number | null;
      nonHomegrownLimit?: number | null;
      receiptTimingStatus?: string | null;
    };
    criteria?: EligibilityCriterionFinding[];
  } | null;
  playingDisposition: string | null;
  notes: string | null;
  receiptExceptions: ReceiptExceptionItem[];
};

type RegistrationDetail = {
  id: string;
  seasonId: string;
  season: { id: string; code: string; name: string; state: 'OPEN' | 'CLOSED' };
  club: {
    id: string;
    code: string;
    name: string;
    abbreviation: string;
    discontinuedAt: string | null;
    hasApprovedApplication: boolean;
    acceptedApplicationVersionId: string | null;
  };
  player: {
    id: string;
    code: string;
    fullName: string;
    birthDate: string;
    nationalityCode: string;
    positionCode: string;
  };
  revision: string;
  currentDraftVersionId: string | null;
  currentValidatedVersionId: string | null;
  playingEffectivityStatus: PlayingEffectivityStatus;
  versions: RegistrationVersionDetail[];
  capabilities: { canManage: boolean; canDecideExceptions: boolean };
};

const seasonPath = (id: string) =>
  `/workspace/seasons/${encodeURIComponent(id)}/player-registrations`;

/** Strips internal specification codes so end users only read natural Vietnamese business copy. */
function cleanBusinessCopy(text: string): string {
  return text
    .replace(/\s*\(BM1\)/gi, '')
    .replace(/\s*\(D0\d{2}\)/gi, '')
    .replace(/\s*theo\s+D0\d{2}/gi, '')
    .replace(/\s*D0\d{2}\b/gi, '')
    .replace(/\s*theo\s+UC1[01]/gi, '')
    .replace(/\s*\(non-homegrown\)/gi, '')
    .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_m, y, mo, d) => `${d}/${mo}/${y}`)
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function statePillClass(state: RegistrationState): string {
  if (state === 'VALID') return `${pageCss.pill} ${pageCss.pillOk}`;
  if (state === 'RECEIVED') return `${pageCss.pill} ${pageCss.pillPending}`;
  if (state === 'NEEDS_SUPPLEMENTATION' || state === 'CANCELLED')
    return `${pageCss.pill} ${pageCss.pillLate}`;
  return pageCss.pill;
}

function playingPillClass(status: PlayingEffectivityStatus): string {
  if (status === 'ACTIVE') return `${pageCss.pill} ${pageCss.pillOk}`;
  if (status === 'UPCOMING') return `${pageCss.pill} ${pageCss.pillPending}`;
  if (status === 'CANCELLED_BEFORE_EFFECTIVITY' || status === 'REVOKED')
    return `${pageCss.pill} ${pageCss.pillLate}`;
  return pageCss.pill;
}

function findingPillClass(status: FindingStatus): string {
  if (status === 'MET') return `${pageCss.pill} ${pageCss.pillOk}`;
  if (status === 'UNMET') return `${pageCss.pill} ${pageCss.pillLate}`;
  if (status === 'INSUFFICIENT_BASIS') return `${pageCss.pill} ${regPageCss.pillWarn}`;
  return pageCss.pill;
}

function classificationBadge(version: {
  u21Finding: boolean | null;
  homegrownFinding: boolean | null;
  nonHomegrownOptIn: boolean;
}): { label: string; className: string } {
  if (version.u21Finding === true) {
    return { label: 'Cầu thủ trẻ U21', className: `${pageCss.pill} ${pageCss.pillPending}` };
  }
  if (version.homegrownFinding === true) {
    return { label: 'Đào tạo nội địa', className: `${pageCss.pill} ${pageCss.pillOk}` };
  }
  if (version.nonHomegrownOptIn || version.homegrownFinding === false) {
    return { label: 'Ngoài đào tạo nội địa', className: `${pageCss.pill} ${regPageCss.pillWarn}` };
  }
  return { label: 'Chưa kết luận', className: pageCss.pill };
}

function formatIntervalLabel(start: string | null, end: string | null): string {
  if (!start) return 'Chưa ấn định';
  return end
    ? `${formatSeasonInstant(start)} – trước ${formatSeasonInstant(end)}`
    : `Từ ${formatSeasonInstant(start)} (chưa ấn định kết thúc)`;
}

function buildInitialDraftValues(
  detail: RegistrationDetail,
  sourceVersion: RegistrationVersionDetail,
): RegistrationInitialDraftValues {
  return {
    caseId: detail.id,
    versionId: sourceVersion.id,
    versionNumber: sourceVersion.versionNumber,
    versionRevision: sourceVersion.revision,
    clubId: detail.club.id,
    playerId: detail.player.id,
    shirtNumber: sourceVersion.shirtNumber,
    playingStart: sourceVersion.playingStart,
    playingEnd: sourceVersion.playingEnd,
    nonHomegrownOptIn: sourceVersion.nonHomegrownOptIn,
    evidenceBranch: sourceVersion.evidenceBranch,
    qualifyingValue: sourceVersion.qualifyingValue,
    evidenceSummary: sourceVersion.evidenceSummary,
    evidenceReference: sourceVersion.evidenceReference,
    affiliatedAssociationBasis: sourceVersion.affiliatedAssociationBasis,
    notes: sourceVersion.notes,
  };
}

export function PlayerRegistrationsPage() {
  const { seasonId } = useParams();
  const navigate = useNavigate();
  const { session } = useSession();

  const allowedSeasonIds = useMemo(
    () =>
      new Set<string>([
        ...(session?.seasonManagerIds ?? []),
        ...(session?.seasonRoles
          ?.filter(
            ({ roleCode }) => roleCode === 'REGISTRATION_OFFICER' || roleCode === 'SEASON_MANAGER',
          )
          .map((entry) => entry.seasonId) ?? []),
      ]),
    [session],
  );

  const seasons = useAdminList<SeasonList>('/seasons?page=1&pageSize=100&sort=startDate:desc');
  const accessibleSeasons = useMemo(
    () => (seasons.data?.items ?? []).filter((item) => allowedSeasonIds.has(item.id)),
    [seasons.data, allowedSeasonIds],
  );
  const selectedSeason = accessibleSeasons.find((item) => item.id === seasonId);

  useEffect(() => {
    if (!seasonId && accessibleSeasons.length === 1) {
      navigate(seasonPath(accessibleSeasons[0].id), { replace: true });
    }
  }, [seasonId, accessibleSeasons, navigate]);

  if (!seasonId) {
    return (
      <div className={css.page}>
        <div className={css.pageHead}>
          <div>
            <h1>Đăng ký cầu thủ theo mùa</h1>
            <p>
              Chọn mùa giải được phân công để tiếp nhận, kiểm tra điều kiện và xác nhận đăng ký cầu
              thủ.
            </p>
          </div>
        </div>
        <section className={css.panel}>
          <ListFeedback
            loading={seasons.loading}
            error={seasons.error}
            empty={!seasons.loading && !seasons.error && accessibleSeasons.length === 0}
            onRetry={seasons.reload}
          />
          {accessibleSeasons.length > 0 && (
            <div className={css.tableWrap}>
              <table className={css.table}>
                <thead>
                  <tr>
                    <th>Mã mùa giải</th>
                    <th>Tên mùa giải</th>
                    <th>Trạng thái</th>
                    <th className={regPageCss.actionCell}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {accessibleSeasons.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.code}</strong>
                      </td>
                      <td>{item.name}</td>
                      <td>
                        <span
                          className={`${pageCss.pill} ${item.state === 'OPEN' ? pageCss.pillOk : ''}`}
                        >
                          {item.state === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
                        </span>
                      </td>
                      <td className={regPageCss.actionCell}>
                        <Link to={seasonPath(item.id)} className={css.primary}>
                          Mở danh sách
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className={css.page}>
      <div className={css.pageHead}>
        <div>
          <h1>Đăng ký cầu thủ theo mùa</h1>
          <p>
            Tiếp nhận hồ sơ, kiểm tra điều kiện hợp lệ theo quy định mùa giải và theo dõi hiệu lực
            thi đấu của từng cầu thủ.
          </p>
        </div>
        {accessibleSeasons.length > 0 && (
          <div style={{ minWidth: 260 }}>
            <AdminSelect
              label="Mùa giải"
              value={seasonId}
              options={accessibleSeasons.map((item) => ({
                value: item.id,
                label: `${item.name} (${item.code})`,
              }))}
              onChange={(nextId) => {
                if (nextId && nextId !== seasonId) navigate(seasonPath(nextId));
              }}
            />
          </div>
        )}
      </div>

      <SeasonPlayerRegistrationsWorkspace
        key={seasonId}
        seasonId={seasonId}
        seasonName={selectedSeason?.name}
      />
    </div>
  );
}

function SeasonPlayerRegistrationsWorkspace({
  seasonId,
  seasonName,
}: {
  seasonId: string;
  seasonName?: string;
}) {
  const [searchDraft, setSearchDraft] = useState('');
  const search = useSearchTerm(searchDraft);
  const [clubId, setClubId] = useState('ALL');
  const [state, setState] = useState('ALL');
  const [playingStatus, setPlayingStatus] = useState('ALL');
  const [sort, setSort] = useState('updatedAt:desc');
  const [pageSize, setPageSize] = useState('20');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string>();

  const references = useAdminList<PlayerRegistrationReferences>(
    `/seasons/${seasonId}/player-registrations/references`,
  );

  const params = new URLSearchParams({
    page: String(page),
    pageSize,
    sort,
    state,
    playingStatus,
    search,
    ...(clubId !== 'ALL' ? { clubId } : {}),
  });
  const list = useAdminList<RegistrationListResponse, SeasonHistoryMeta>(
    `/seasons/${seasonId}/player-registrations?${params}`,
  );

  const items = list.data?.items ?? [];
  const refData = references.data;
  const seasonOpen = refData?.season.state === 'OPEN';
  const effectiveReg = refData?.effectiveRegulation;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {references.error && (
        <ListFeedback loading={false} error={references.error} onRetry={references.reload} />
      )}

      {refData && (
        <div
          className={`${pageCss.banner} ${!seasonOpen || !effectiveReg ? pageCss.bannerWarn : ''}`}
          role="status"
        >
          {!seasonOpen ? (
            <span>
              <strong>Mùa giải {seasonName ?? refData.season.name} đã đóng:</strong> chỉ có thể tra
              cứu hồ sơ đăng ký đã lưu, không thể chỉnh sửa hoặc xác nhận mới.
            </span>
          ) : !effectiveReg ? (
            <span>
              <strong>Chưa có quy định mùa giải đang có hiệu lực:</strong> có thể chuẩn bị bản nháp
              và kiểm tra trước, nhưng chưa thể tiếp nhận hoặc xác nhận hợp lệ.
            </span>
          ) : (
            <>
              <span>
                <strong>Quy định đang áp dụng:</strong> Phiên bản {effectiveReg.versionNumber} · Đội
                hình tối đa <strong>{effectiveReg.squadLimit ?? '—'}</strong> · Ngoài đào tạo nội
                địa tối đa <strong>{effectiveReg.nonHomegrownLimit ?? '—'}</strong>
                {effectiveReg.u21Cutoff && (
                  <>
                    {' · '}Mốc U21: <strong>{formatDisplayDate(effectiveReg.u21Cutoff)}</strong>
                  </>
                )}
              </span>
              {effectiveReg.windows.length > 0 && (
                <span>
                  <strong>Khung tiếp nhận cầu thủ:</strong>{' '}
                  {effectiveReg.windows
                    .map(
                      (w) =>
                        `${formatSeasonInstant(w.opensAt)} – ${formatSeasonInstant(w.closesAt)}`,
                    )
                    .join('; ')}
                </span>
              )}
            </>
          )}
        </div>
      )}

      <section className={css.panel} aria-label="Danh sách đăng ký cầu thủ theo mùa">
        <div className={css.sectionHeader}>
          <div>
            <h2>Danh sách hồ sơ đăng ký cầu thủ</h2>
            <p>
              Theo dõi tách biệt trạng thái xử lý hồ sơ và trạng thái hiệu lực thi đấu của cầu thủ
              tại từng câu lạc bộ.
            </p>
          </div>
          {list.data?.capabilities.canManage && seasonOpen && (
            <button type="button" className={css.primary} onClick={() => setCreating(true)}>
              <AdminIcon name="plus" /> Tạo đăng ký cầu thủ
            </button>
          )}
        </div>

        <div className={css.filters}>
          <label className={css.search}>
            <span className={css.srOnly}>Tìm hồ sơ đăng ký cầu thủ</span>
            <AdminIcon name="search" />
            <input
              value={searchDraft}
              placeholder="Tìm theo mã, tên cầu thủ hoặc câu lạc bộ…"
              onChange={(event) => {
                setSearchDraft(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <AdminSelect
            label="Câu lạc bộ"
            hideLabel
            value={clubId}
            options={[
              { value: 'ALL', label: 'Tất cả câu lạc bộ' },
              ...(refData?.clubs ?? []).map((club) => ({
                value: club.id,
                label: `${club.name} (${club.code})`,
              })),
            ]}
            onChange={(value) => {
              setClubId(value);
              setPage(1);
            }}
          />
          <AdminSelect
            label="Trạng thái hồ sơ"
            hideLabel
            value={state}
            options={stateFilterOptions}
            onChange={(value) => {
              setState(value);
              setPage(1);
            }}
          />
          <AdminSelect
            label="Hiệu lực thi đấu"
            hideLabel
            value={playingStatus}
            options={playingFilterOptions}
            onChange={(value) => {
              setPlayingStatus(value);
              setPage(1);
            }}
          />
          <button
            type="button"
            className={css.refresh}
            aria-label="Làm mới danh sách đăng ký cầu thủ"
            onClick={() => {
              list.reload();
              references.reload();
            }}
          >
            <AdminIcon name="refresh" />
          </button>
        </div>

        <DisplayOptions
          sort={sort}
          pageSize={pageSize}
          sorts={[
            { value: 'updatedAt:desc', label: 'Cập nhật mới nhất' },
            { value: 'playerName:asc', label: 'Tên cầu thủ A–Z' },
            { value: 'playerName:desc', label: 'Tên cầu thủ Z–A' },
            { value: 'shirtNumber:asc', label: 'Số áo tăng dần' },
          ]}
          onSort={(value) => {
            setSort(value);
            setPage(1);
          }}
          onPageSize={(value) => {
            setPageSize(value);
            setPage(1);
          }}
        />

        <ListFeedback
          loading={list.loading}
          error={list.error}
          empty={!list.loading && !list.error && items.length === 0}
          onRetry={list.reload}
        />

        {items.length > 0 && (
          <div className={css.tableWrap}>
            <table className={css.table}>
              <thead>
                <tr>
                  <th>Cầu thủ</th>
                  <th>Câu lạc bộ</th>
                  <th>Số áo</th>
                  <th>Phân loại</th>
                  <th>Trạng thái hồ sơ</th>
                  <th>Hiệu lực thi đấu</th>
                  <th className={regPageCss.actionCell}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const latest = item.latestVersion;
                  const validated = item.currentValidatedVersion;
                  const badge = latest ? classificationBadge(latest) : null;
                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.player.fullName}</strong>
                        <span className={regPageCss.cellSub}>
                          {item.player.code} · {formatDisplayDate(item.player.birthDate)}
                        </span>
                      </td>
                      <td>
                        <strong>{item.club.name}</strong> ({item.club.code})
                        {item.club.discontinuedAt ? (
                          <span className={`${regPageCss.cellSub} ${regPageCss.cellSubDanger}`}>
                            Câu lạc bộ đã ngừng hoạt động
                          </span>
                        ) : item.club.hasApprovedApplication ? (
                          <span className={`${regPageCss.cellSub} ${regPageCss.cellSubOk}`}>
                            Hồ sơ tham dự đã phê duyệt
                          </span>
                        ) : (
                          <span className={`${regPageCss.cellSub} ${regPageCss.cellSubWarn}`}>
                            Hồ sơ tham dự chưa phê duyệt
                          </span>
                        )}
                      </td>
                      <td>
                        <strong>{latest?.shirtNumber ? `#${latest.shirtNumber}` : '—'}</strong>
                      </td>
                      <td>
                        {badge ? <span className={badge.className}>{badge.label}</span> : '—'}
                      </td>
                      <td>
                        {latest ? (
                          <div className={regPageCss.statusStack}>
                            <span className={statePillClass(latest.state)}>
                              {stateLabels[latest.state]}
                            </span>
                            <span className={regPageCss.cellSub}>
                              Phiên bản {latest.versionNumber}
                              {latest.receiptTimingStatus === 'ON_TIME' && ' · Đúng hạn'}
                              {latest.receiptTimingStatus === 'LATE' &&
                                (latest.hasApprovedException
                                  ? ' · Ngoài hạn (đã duyệt ngoại lệ)'
                                  : ' · Ngoài hạn')}
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <div className={regPageCss.statusStack}>
                          <span className={playingPillClass(item.playingEffectivityStatus)}>
                            {playingStatusLabels[item.playingEffectivityStatus]}
                          </span>
                          {validated?.playingStart && (
                            <span className={regPageCss.cellSub}>
                              {formatSeasonInstant(validated.playingStart)}
                              {validated.playingEnd
                                ? ` – ${formatSeasonInstant(validated.playingEnd)}`
                                : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={regPageCss.actionCell}>
                        <button
                          type="button"
                          onClick={() => setSelectedCaseId(item.id)}
                          aria-label={`Chi tiết đăng ký ${item.player.fullName}`}
                        >
                          <AdminIcon name="eye" /> Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {list.meta && <Pagination data={{ ...list.meta, items }} change={setPage} />}
      </section>

      {creating && refData && (
        <PlayerRegistrationForm
          seasonId={seasonId}
          references={refData}
          mode="create"
          onClose={() => setCreating(false)}
          onConflictReload={() => {
            setCreating(false);
            list.reload();
            references.reload();
          }}
          onSaved={(caseId) => {
            setCreating(false);
            setPage(1);
            list.reload();
            setSelectedCaseId(caseId);
          }}
        />
      )}

      {selectedCaseId && (
        <PlayerRegistrationDrawer
          caseId={selectedCaseId}
          seasonId={seasonId}
          references={refData ?? null}
          referencesError={references.error}
          onReloadReferences={references.reload}
          onClose={() => setSelectedCaseId(undefined)}
          onChange={() => {
            list.reload();
            references.reload();
          }}
        />
      )}
    </div>
  );
}

type PendingModalAction =
  | {
      kind: 'registration';
      action: 'receive' | 'return' | 'supplement' | 'cancel' | 'confirm-valid';
      version: RegistrationVersionDetail;
      requireReason: boolean;
      allowOptionalReason?: boolean;
      critical?: boolean;
      title: string;
      submitLabel: string;
      danger?: boolean;
    }
  | {
      kind: 'exception-propose';
      version: RegistrationVersionDetail;
    }
  | {
      kind: 'exception-action';
      action: 'submit' | 'withdraw' | 'return' | 'reject' | 'approve';
      exception: ReceiptExceptionItem;
      requireReason: boolean;
      critical?: boolean;
      title: string;
      submitLabel: string;
    };

function PlayerRegistrationDrawer({
  caseId,
  seasonId,
  references,
  referencesError,
  onReloadReferences,
  onClose,
  onChange,
}: {
  caseId: string;
  seasonId: string;
  references: PlayerRegistrationReferences | null;
  referencesError?: string;
  onReloadReferences: () => void;
  onClose: () => void;
  onChange: () => void;
}) {
  const { client, session } = useSession();
  const resource = useAdminList<RegistrationDetail>(`/player-registrations/${caseId}`);
  const detail = resource.error ? null : resource.data;

  const [selectedVersionId, setSelectedVersionId] = useState<string>();
  const [editingDraft, setEditingDraft] = useState<RegistrationInitialDraftValues>();
  const [modalAction, setModalAction] = useState<PendingModalAction>();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [plansRefreshToken, setPlansRefreshToken] = useState(0);

  const precheckSeqRef = useRef(0);
  const [precheckBusy, setPrecheckBusy] = useState(false);
  const [precheckError, setPrecheckError] = useState('');
  const [precheckResult, setPrecheckResult] = useState<{
    versionId: string;
    assessment: EligibilityAssessment;
  } | null>(null);

  function clearPrecheck() {
    precheckSeqRef.current += 1;
    setPrecheckBusy(false);
    setPrecheckResult(null);
    setPrecheckError('');
  }

  const activeVersion =
    detail?.versions.find((v) => v.id === selectedVersionId) ?? detail?.versions[0];
  const currentAccountId = session?.account.id;
  const seasonOpen = detail?.season.state === 'OPEN';
  const hasOpenSibling = detail?.versions.some(
    (v) => v.state === 'DRAFT' || v.state === 'RECEIVED',
  );

  const canTargetException =
    seasonOpen &&
    !!activeVersion?.receivedAt &&
    activeVersion.receiptTimingStatus === 'LATE' &&
    activeVersion.state === 'RECEIVED';
  const approvedException = activeVersion?.receiptExceptions.find((ex) => ex.state === 'APPROVED');
  const openException = activeVersion?.receiptExceptions.find(
    (ex) => ex.state === 'DRAFT' || ex.state === 'SUBMITTED',
  );

  const effectiveReg = references?.effectiveRegulation ?? null;
  const ruleChangedSinceReceipt = !!(
    activeVersion &&
    activeVersion.state === 'RECEIVED' &&
    activeVersion.receiptRegulationVersion &&
    effectiveReg &&
    activeVersion.receiptRegulationVersion.id !== effectiveReg.id
  );

  const versionNumberByRegId = useMemo(() => {
    const map = new Map<string, number>();
    if (effectiveReg) map.set(effectiveReg.id, effectiveReg.versionNumber);
    for (const v of detail?.versions ?? []) {
      if (v.receiptRegulationVersion) {
        map.set(v.receiptRegulationVersion.id, v.receiptRegulationVersion.versionNumber);
      }
      if (v.decisionRegulationVersion) {
        map.set(v.decisionRegulationVersion.id, v.decisionRegulationVersion.versionNumber);
      }
    }
    return map;
  }, [detail, effectiveReg]);

  function formatRuleBasisLabel(regVersionId: string | null): string {
    if (!regVersionId) return 'Chưa có quy định hiệu lực';
    const num = versionNumberByRegId.get(regVersionId);
    return num !== undefined ? `Quy định phiên bản ${num}` : 'Quy định hiện hành';
  }

  async function runPrecheck(version: RegistrationVersionDetail) {
    const seq = ++precheckSeqRef.current;
    setPrecheckBusy(true);
    setPrecheckResult(null);
    setPrecheckError('');
    try {
      const response = await client.request<EligibilityAssessment>(
        `/player-registrations/${caseId}/validate`,
        {
          method: 'POST',
          body: { versionId: version.id },
        },
      );
      if (precheckSeqRef.current !== seq) return;
      setPrecheckResult({ versionId: version.id, assessment: response.data });
    } catch (caught) {
      if (precheckSeqRef.current !== seq) return;
      if (caught instanceof HttpFailure) {
        setPrecheckError(cleanBusinessCopy(caught.message));
      } else {
        setPrecheckError('Không thể kiểm tra điều kiện đăng ký lúc này. Vui lòng thử lại.');
      }
    } finally {
      if (precheckSeqRef.current === seq) {
        setPrecheckBusy(false);
      }
    }
  }

  function handleVersionTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    versions: RegistrationVersionDetail[],
    currentIndex: number,
  ) {
    if (!versions.length) return;
    let nextIndex = -1;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % versions.length;
    else if (event.key === 'ArrowLeft')
      nextIndex = (currentIndex - 1 + versions.length) % versions.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = versions.length - 1;
    if (nextIndex >= 0) {
      event.preventDefault();
      const target = versions[nextIndex];
      setSelectedVersionId(target.id);
      document.getElementById(`reg-version-tab-${target.id}`)?.focus();
    }
  }

  const displayedPrecheck =
    activeVersion &&
    activeVersion.state !== 'VALID' &&
    precheckResult?.versionId === activeVersion.id
      ? precheckResult.assessment
      : null;
  const officialCriteria = activeVersion?.officialSnapshot?.criteria ?? null;
  const activeFindings = displayedPrecheck?.criteria ?? officialCriteria;

  return (
    <AdminDrawer
      width={820}
      title={
        detail
          ? `${detail.player.fullName} · ${detail.club.name} (${detail.club.code})`
          : 'Chi tiết đăng ký cầu thủ'
      }
      subtitle={
        detail
          ? `Mùa giải ${detail.season.name} · Mã cầu thủ: ${detail.player.code}`
          : 'Đang tải thông tin đăng ký'
      }
      icon={<AdminIcon name="shield" />}
      onClose={onClose}
    >
      <ListFeedback loading={resource.loading} error={resource.error} onRetry={resource.reload} />
      {referencesError && (
        <ListFeedback loading={false} error={referencesError} onRetry={onReloadReferences} />
      )}

      {detail && activeVersion && (
        <div className={css.details}>
          {/* Version Switcher */}
          <div className={pageCss.versionTabs} role="tablist" aria-label="Các phiên bản đăng ký">
            {detail.versions.map((v, idx) => (
              <button
                key={v.id}
                id={`reg-version-tab-${v.id}`}
                type="button"
                role="tab"
                aria-selected={v.id === activeVersion.id}
                aria-controls="reg-version-tabpanel"
                tabIndex={v.id === activeVersion.id ? 0 : -1}
                className={v.id === activeVersion.id ? pageCss.versionTabActive : undefined}
                onClick={() => setSelectedVersionId(v.id)}
                onKeyDown={(event) => handleVersionTabKeyDown(event, detail.versions, idx)}
              >
                Phiên bản {v.versionNumber} · {stateLabels[v.state]}
              </button>
            ))}
          </div>

          <div
            id="reg-version-tabpanel"
            role="tabpanel"
            tabIndex={0}
            aria-labelledby={`reg-version-tab-${activeVersion.id}`}
            style={{ display: 'grid', gap: 16 }}
          >
            {/* Status Badges */}
            <div className={css.actions}>
              <span className={statePillClass(activeVersion.state)}>
                Hồ sơ: {stateLabels[activeVersion.state]}
              </span>
              <span className={playingPillClass(activeVersion.playingEffectivityStatus)}>
                Hiệu lực thi đấu: {playingStatusLabels[activeVersion.playingEffectivityStatus]}
              </span>
              {activeVersion.receiptTimingStatus === 'ON_TIME' && activeVersion.receivedAt && (
                <span className={`${pageCss.pill} ${pageCss.pillOk}`}>
                  Tiếp nhận đúng hạn · {formatSeasonInstant(activeVersion.receivedAt)}
                </span>
              )}
              {activeVersion.receiptTimingStatus === 'LATE' && activeVersion.receivedAt && (
                <span className={`${pageCss.pill} ${pageCss.pillLate}`}>
                  Tiếp nhận ngoài hạn · {formatSeasonInstant(activeVersion.receivedAt)}
                </span>
              )}
              {detail.currentValidatedVersionId === activeVersion.id && (
                <span className={`${pageCss.pill} ${pageCss.pillApproved}`}>Hồ sơ chính thức</span>
              )}
            </div>

            {ruleChangedSinceReceipt && effectiveReg && activeVersion.receiptRegulationVersion && (
              <div className={`${pageCss.banner} ${pageCss.bannerWarn}`} role="status">
                <span>
                  <strong>Quy định mùa giải đã thay đổi sau khi tiếp nhận:</strong> Thời điểm tiếp
                  nhận giữ căn cứ theo{' '}
                  <strong>Phiên bản {activeVersion.receiptRegulationVersion.versionNumber}</strong>,
                  còn điều kiện hợp lệ khi xác nhận sẽ được đánh giá theo quy định đang có hiệu lực{' '}
                  <strong>Phiên bản {effectiveReg.versionNumber}</strong>.
                </span>
              </div>
            )}

            {/* Dual-status & Rule Basis Summary Strip */}
            <div className={regPageCss.summaryStrip}>
              <div className={regPageCss.summaryItem}>
                <span className={regPageCss.summaryLabel}>Trạng thái quy trình</span>
                <span className={regPageCss.summaryValue}>
                  {stateLabels[activeVersion.state]} (Phiên bản {activeVersion.versionNumber})
                </span>
              </div>
              <div className={regPageCss.summaryItem}>
                <span className={regPageCss.summaryLabel}>Hiệu lực thi đấu</span>
                <span className={regPageCss.summaryValue}>
                  {playingStatusLabels[activeVersion.playingEffectivityStatus]}
                </span>
                <span className={regPageCss.cellSub}>
                  {formatIntervalLabel(activeVersion.playingStart, activeVersion.playingEnd)}
                </span>
              </div>
              <div className={regPageCss.summaryItem}>
                <span className={regPageCss.summaryLabel}>Căn cứ quy định</span>
                <span className={regPageCss.summaryValue}>
                  {activeVersion.receiptRegulationVersion
                    ? `Tiếp nhận: Phiên bản ${activeVersion.receiptRegulationVersion.versionNumber}`
                    : 'Chưa tiếp nhận'}
                </span>
                <span className={regPageCss.cellSub}>
                  {activeVersion.decisionRegulationVersion
                    ? `Quyết định / xác minh: Phiên bản ${activeVersion.decisionRegulationVersion.versionNumber}`
                    : effectiveReg
                      ? `Hiện hành: Phiên bản ${effectiveReg.versionNumber}`
                      : 'Mùa giải chưa có quy định hiệu lực'}
                </span>
              </div>
            </div>

            {/* Fact Detail Grid */}
            <dl className={css.detailGrid}>
              <div>
                <dt>Cầu thủ</dt>
                <dd>
                  {detail.player.fullName} ({detail.player.code}) · Sinh ngày{' '}
                  {formatDisplayDate(detail.player.birthDate)}
                </dd>
              </div>
              <div>
                <dt>Câu lạc bộ</dt>
                <dd>
                  {detail.club.name} ({detail.club.code}) —{' '}
                  {detail.club.discontinuedAt
                    ? 'Đã ngừng hoạt động'
                    : detail.club.hasApprovedApplication
                      ? 'Hồ sơ tham dự đã phê duyệt'
                      : 'Hồ sơ tham dự chưa phê duyệt'}
                </dd>
              </div>
              <div>
                <dt>Số áo đăng ký</dt>
                <dd>{activeVersion.shirtNumber ? `#${activeVersion.shirtNumber}` : 'Chưa nhập'}</dd>
              </div>
              <div>
                <dt>Phân loại cầu thủ</dt>
                <dd>{classificationBadge(activeVersion).label}</dd>
              </div>
              <div>
                <dt>Người lập phiên bản</dt>
                <dd>
                  {activeVersion.preparer.fullName} ({activeVersion.preparer.personnelCode})
                </dd>
              </div>
              <div>
                <dt>Xử lý diện ngoài đào tạo nội địa</dt>
                <dd>{activeVersion.nonHomegrownOptIn ? 'Có chọn' : 'Không'}</dd>
              </div>
              {(activeVersion.evidenceBranch || activeVersion.evidenceSummary) && (
                <div className={clubCss.full}>
                  <dt>Thông tin xác minh đào tạo nội địa</dt>
                  <dd>
                    {activeVersion.evidenceBranch === 'SEASONS'
                      ? `Theo mùa giải (${activeVersion.qualifyingValue ?? '—'} mùa)`
                      : activeVersion.evidenceBranch === 'MONTHS'
                        ? `Theo tháng (${activeVersion.qualifyingValue ?? '—'} tháng)`
                        : 'Chưa chọn nhánh'}
                    {activeVersion.affiliatedAssociationBasis === true
                      ? ' · Đáp ứng liên đoàn Anh / Xứ Wales'
                      : activeVersion.affiliatedAssociationBasis === false
                        ? ' · Không đáp ứng liên đoàn Anh / Xứ Wales'
                        : ' · Chưa xác nhận liên đoàn'}
                    {activeVersion.evidenceSummary ? ` — ${activeVersion.evidenceSummary}` : ''}
                    {activeVersion.evidenceReference
                      ? ` (Mã tham chiếu: ${activeVersion.evidenceReference})`
                      : ''}
                    {activeVersion.verifier && activeVersion.verifiedAt
                      ? ` · Xác minh bởi ${activeVersion.verifier.fullName} lúc ${formatSeasonInstant(activeVersion.verifiedAt)}`
                      : ''}
                  </dd>
                </div>
              )}
              {activeVersion.notes && (
                <div className={clubCss.full}>
                  <dt>Ghi chú nội bộ</dt>
                  <dd>{activeVersion.notes}</dd>
                </div>
              )}
              {activeVersion.decisionReason && (
                <div className={clubCss.full}>
                  <dt>Lý do quyết định / trả bổ sung / hủy</dt>
                  <dd>
                    {activeVersion.decisionReason}
                    {activeVersion.decider && activeVersion.decidedAt
                      ? ` (${activeVersion.decider.fullName} · ${formatSeasonInstant(activeVersion.decidedAt)})`
                      : ''}
                  </dd>
                </div>
              )}
            </dl>

            {/* Explainable Eligibility Findings Section */}
            <section
              className={regPageCss.sectionBox}
              aria-label="Kết quả kiểm tra điều kiện đăng ký"
            >
              <div className={regPageCss.sectionBoxHeader}>
                <h3>Kết quả kiểm tra điều kiện đăng ký</h3>
                {displayedPrecheck ? (
                  <span
                    className={`${pageCss.pill} ${
                      displayedPrecheck.eligibleForConfirmation ? pageCss.pillOk : pageCss.pillLate
                    }`}
                  >
                    {displayedPrecheck.eligibleForConfirmation
                      ? 'Đủ điều kiện xác nhận'
                      : `Chưa đủ điều kiện (${displayedPrecheck.blockingCriteria.length} tiêu chí cần xử lý)`}
                  </span>
                ) : activeVersion.state === 'VALID' ? (
                  <span className={`${pageCss.pill} ${pageCss.pillOk}`}>
                    Đã xác nhận hợp lệ lúc {formatSeasonInstant(activeVersion.decidedAt!)}
                  </span>
                ) : (
                  <span className={pageCss.pill}>Chưa chạy kiểm tra</span>
                )}
              </div>

              {activeVersion.state !== 'VALID' && (
                <p className={pageCss.metaNote}>
                  Kết quả kiểm tra trước chỉ phục vụ đối chiếu điều kiện, không giữ chỗ hạn mức đội
                  hình và sẽ được kiểm tra lại đầy đủ khi xác nhận hợp lệ.
                </p>
              )}

              {precheckError && (
                <div className={css.error} role="alert">
                  <p style={{ margin: 0 }}>{precheckError}</p>
                  <div style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        resource.reload();
                        onReloadReferences();
                        setPrecheckError('');
                      }}
                    >
                      Tải lại dữ liệu mới nhất
                    </button>
                  </div>
                </div>
              )}

              {activeFindings && activeFindings.length > 0 ? (
                <ul className={regPageCss.findingsList}>
                  {activeFindings.map((finding) => (
                    <li key={finding.criterion} className={regPageCss.findingItem}>
                      <div>
                        <div className={regPageCss.findingTitle}>
                          {criterionLabels[finding.criterion] ?? finding.criterion}
                        </div>
                        <p
                          className={`${regPageCss.findingReason} ${
                            finding.status === 'UNMET'
                              ? regPageCss.findingReasonError
                              : finding.status === 'INSUFFICIENT_BASIS'
                                ? regPageCss.findingReasonWarn
                                : ''
                          }`}
                        >
                          {cleanBusinessCopy(finding.reason)}
                        </p>
                      </div>
                      <div className={regPageCss.findingBadges}>
                        <span className={findingPillClass(finding.status)}>
                          {findingStatusLabels[finding.status]}
                        </span>
                        <span className={regPageCss.basisTag}>
                          {formatRuleBasisLabel(finding.regulationVersionId)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={pageCss.metaNote}>
                  {detail.capabilities.canManage
                    ? 'Nhấn nút “Kiểm tra điều kiện” ở thanh thao tác bên dưới để xem chi tiết từng tiêu chí và lý do cụ thể.'
                    : 'Chưa có kết quả xác nhận chính thức được lưu cho phiên bản này.'}
                </p>
              )}
            </section>

            {/* Receipt Exception Section (when LATE or already has exception proposals) */}
            {(activeVersion.receiptTimingStatus === 'LATE' ||
              activeVersion.receiptExceptions.length > 0) && (
              <section className={regPageCss.sectionBox} aria-label="Ngoại lệ tiếp nhận">
                <div className={regPageCss.sectionBoxHeader}>
                  <h3>Ngoại lệ tiếp nhận ngoài hạn</h3>
                  {approvedException ? (
                    <span className={`${pageCss.pill} ${pageCss.pillOk}`}>
                      Đã phê duyệt ngoại lệ cho phiên bản này
                    </span>
                  ) : (
                    <span className={`${pageCss.pill} ${regPageCss.pillWarn}`}>
                      Chưa có ngoại lệ được phê duyệt
                    </span>
                  )}
                </div>

                {activeVersion.receiptExceptions.length === 0 ? (
                  <p className={pageCss.metaNote}>
                    Phiên bản này được tiếp nhận ngoài khung thời gian quy định. Ngoại lệ tiếp nhận
                    chỉ miễn điều kiện thời hạn cho đúng phiên bản này và không thay thế kiểm tra
                    điều kiện hợp lệ.
                  </p>
                ) : (
                  <ul className={regPageCss.findingsList}>
                    {activeVersion.receiptExceptions.map((ex) => {
                      const exIsSelf =
                        !!currentAccountId &&
                        (ex.preparedBy === currentAccountId ||
                          ex.editorIds.includes(currentAccountId));
                      return (
                        <li key={ex.id} className={regPageCss.findingItem}>
                          <div>
                            <div className={regPageCss.findingTitle}>
                              Đề xuất ngoại lệ lần {ex.versionNumber} ·{' '}
                              {exceptionStateLabels[ex.state] ?? ex.state}
                            </div>
                            <p className={regPageCss.findingReason}>
                              <strong>Lý do:</strong> {ex.reason ?? '—'} · <strong>Căn cứ:</strong>{' '}
                              {ex.basis ?? '—'}
                            </p>
                            {ex.decisionReason && (
                              <p className={regPageCss.findingReason}>
                                <strong>Phản hồi quyết định:</strong> {ex.decisionReason}
                                {ex.decider && ex.decidedAt
                                  ? ` (${ex.decider.fullName} · ${formatSeasonInstant(ex.decidedAt)})`
                                  : ''}
                              </p>
                            )}
                            {seasonOpen &&
                              ex.state === 'DRAFT' &&
                              detail.capabilities.canManage && (
                                <div className={css.actions} style={{ marginTop: 8 }}>
                                  <button
                                    type="button"
                                    className={css.primary}
                                    onClick={() =>
                                      setModalAction({
                                        kind: 'exception-action',
                                        action: 'submit',
                                        exception: ex,
                                        requireReason: false,
                                        title: 'Gửi đề xuất ngoại lệ tiếp nhận',
                                        submitLabel: 'Gửi đề xuất',
                                      })
                                    }
                                  >
                                    Gửi đề xuất ngoại lệ
                                  </button>
                                </div>
                              )}
                            {seasonOpen && ex.state === 'SUBMITTED' && (
                              <div className={css.actions} style={{ marginTop: 8 }}>
                                {detail.capabilities.canDecideExceptions && !exIsSelf && (
                                  <>
                                    {canTargetException && (
                                      <button
                                        type="button"
                                        className={css.primary}
                                        onClick={() =>
                                          setModalAction({
                                            kind: 'exception-action',
                                            action: 'approve',
                                            exception: ex,
                                            requireReason: true,
                                            critical: true,
                                            title: 'Phê duyệt ngoại lệ tiếp nhận',
                                            submitLabel: 'Phê duyệt ngoại lệ',
                                          })
                                        }
                                      >
                                        Phê duyệt ngoại lệ
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setModalAction({
                                          kind: 'exception-action',
                                          action: 'return',
                                          exception: ex,
                                          requireReason: true,
                                          title: 'Trả lại đề xuất ngoại lệ',
                                          submitLabel: 'Trả lại ngoại lệ',
                                        })
                                      }
                                    >
                                      Trả lại ngoại lệ
                                    </button>
                                    <button
                                      type="button"
                                      className={css.danger}
                                      onClick={() =>
                                        setModalAction({
                                          kind: 'exception-action',
                                          action: 'reject',
                                          exception: ex,
                                          requireReason: true,
                                          title: 'Từ chối đề xuất ngoại lệ',
                                          submitLabel: 'Từ chối ngoại lệ',
                                        })
                                      }
                                    >
                                      Từ chối ngoại lệ
                                    </button>
                                  </>
                                )}
                                {detail.capabilities.canDecideExceptions && exIsSelf && (
                                  <span className={pageCss.metaNote}>
                                    Người đề xuất ngoại lệ không thể tự phê duyệt.
                                  </span>
                                )}
                                {detail.capabilities.canManage && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setModalAction({
                                        kind: 'exception-action',
                                        action: 'withdraw',
                                        exception: ex,
                                        requireReason: false,
                                        title: 'Rút đề xuất ngoại lệ',
                                        submitLabel: 'Rút đề xuất',
                                      })
                                    }
                                  >
                                    Rút đề xuất
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          <span
                            className={`${pageCss.pill} ${
                              ex.state === 'APPROVED'
                                ? pageCss.pillOk
                                : ex.state === 'SUBMITTED'
                                  ? pageCss.pillPending
                                  : pageCss.pillLate
                            }`}
                          >
                            {exceptionStateLabels[ex.state] ?? ex.state}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {canTargetException &&
                  detail.capabilities.canManage &&
                  !approvedException &&
                  !openException && (
                    <div className={css.actions}>
                      <button
                        type="button"
                        onClick={() =>
                          setModalAction({ kind: 'exception-propose', version: activeVersion })
                        }
                      >
                        Đề xuất ngoại lệ tiếp nhận
                      </button>
                    </div>
                  )}
              </section>
            )}

            {/* Official Snapshot Section (when VALID) */}
            {activeVersion.state === 'VALID' && activeVersion.officialSnapshot && (
              <section className={regPageCss.sectionBox}>
                <details className={regPageCss.snapshotDetails}>
                  <summary>Bản chụp thông tin chính thức tại thời điểm xác nhận</summary>
                  <dl className={`${css.detailGrid} ${regPageCss.snapshotGrid}`}>
                    <div>
                      <dt>Thời điểm ghi nhận bản chụp</dt>
                      <dd>
                        {activeVersion.officialSnapshot.capturedAt
                          ? formatSeasonInstant(activeVersion.officialSnapshot.capturedAt)
                          : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt>Cầu thủ & Câu lạc bộ</dt>
                      <dd>
                        {activeVersion.officialSnapshot.player?.fullName ?? detail.player.fullName}{' '}
                        ({activeVersion.officialSnapshot.player?.code ?? detail.player.code}) ·{' '}
                        {activeVersion.officialSnapshot.club?.name ?? detail.club.name}
                      </dd>
                    </div>
                    <div>
                      <dt>Số áo & Khoảng hiệu lực</dt>
                      <dd>
                        #{activeVersion.officialSnapshot.registration?.shirtNumber ?? '—'} ·{' '}
                        {formatIntervalLabel(
                          activeVersion.officialSnapshot.registration?.playingStart ?? null,
                          activeVersion.officialSnapshot.registration?.playingEnd ?? null,
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Hạn mức quy định áp dụng</dt>
                      <dd>
                        Đội hình tối đa {activeVersion.officialSnapshot.basis?.squadLimit ?? '—'} ·
                        Ngoài đào tạo nội địa tối đa{' '}
                        {activeVersion.officialSnapshot.basis?.nonHomegrownLimit ?? '—'}
                      </dd>
                    </div>
                  </dl>
                </details>
              </section>
            )}

            {/* Playing Intervals, Transfers & Prospective Plans (when validated) */}
            {detail.currentValidatedVersionId && (
              <RegistrationPlansPanel
                key={`${caseId}-${plansRefreshToken}`}
                caseId={caseId}
                onChanged={() => {
                  clearPrecheck();
                  setSelectedVersionId(undefined);
                  resource.reload();
                  onChange();
                }}
              />
            )}

            {/* Bottom Action Toolbar — positioned below facts and findings per approved drawer pattern */}
            <div className={regPageCss.drawerFooterActions}>
              {seasonOpen && detail.capabilities.canManage && activeVersion.state === 'DRAFT' && (
                <>
                  <button
                    type="button"
                    disabled={!references || resource.loading}
                    onClick={() => setEditingDraft(buildInitialDraftValues(detail, activeVersion))}
                  >
                    Chỉnh sửa bản nháp
                  </button>
                  <button
                    type="button"
                    disabled={precheckBusy || resource.loading}
                    onClick={() => void runPrecheck(activeVersion)}
                  >
                    {precheckBusy ? 'Đang kiểm tra…' : 'Kiểm tra điều kiện'}
                  </button>
                  <button
                    type="button"
                    className={css.primary}
                    disabled={resource.loading}
                    onClick={() =>
                      setModalAction({
                        kind: 'registration',
                        action: 'receive',
                        version: activeVersion,
                        requireReason: false,
                        title: 'Ghi nhận tiếp nhận hồ sơ đăng ký',
                        submitLabel: 'Xác nhận tiếp nhận',
                      })
                    }
                  >
                    Ghi nhận tiếp nhận
                  </button>
                  <button
                    type="button"
                    className={css.danger}
                    disabled={resource.loading}
                    onClick={() =>
                      setModalAction({
                        kind: 'registration',
                        action: 'cancel',
                        version: activeVersion,
                        requireReason: true,
                        danger: true,
                        title: 'Hủy hồ sơ đăng ký trước xác nhận',
                        submitLabel: 'Xác nhận hủy',
                      })
                    }
                  >
                    Hủy hồ sơ
                  </button>
                </>
              )}

              {seasonOpen &&
                detail.capabilities.canManage &&
                activeVersion.state === 'RECEIVED' && (
                  <>
                    <button
                      type="button"
                      disabled={precheckBusy || resource.loading}
                      onClick={() => void runPrecheck(activeVersion)}
                    >
                      {precheckBusy ? 'Đang kiểm tra…' : 'Kiểm tra điều kiện'}
                    </button>
                    <button
                      type="button"
                      className={css.primary}
                      disabled={resource.loading}
                      onClick={() =>
                        setModalAction({
                          kind: 'registration',
                          action: 'confirm-valid',
                          version: activeVersion,
                          requireReason: false,
                          allowOptionalReason: true,
                          critical: true,
                          title: 'Xác nhận hợp lệ đăng ký cầu thủ',
                          submitLabel: 'Xác nhận hợp lệ',
                        })
                      }
                    >
                      Xác nhận hợp lệ
                    </button>
                    <button
                      type="button"
                      disabled={resource.loading}
                      onClick={() =>
                        setModalAction({
                          kind: 'registration',
                          action: 'return',
                          version: activeVersion,
                          requireReason: true,
                          title: 'Yêu cầu bổ sung hồ sơ đăng ký',
                          submitLabel: 'Yêu cầu bổ sung',
                        })
                      }
                    >
                      Yêu cầu bổ sung
                    </button>
                    <button
                      type="button"
                      className={css.danger}
                      disabled={resource.loading}
                      onClick={() =>
                        setModalAction({
                          kind: 'registration',
                          action: 'cancel',
                          version: activeVersion,
                          requireReason: true,
                          danger: true,
                          title: 'Hủy hồ sơ đăng ký trước xác nhận',
                          submitLabel: 'Xác nhận hủy',
                        })
                      }
                    >
                      Hủy hồ sơ
                    </button>
                  </>
                )}

              {seasonOpen &&
                detail.capabilities.canManage &&
                !detail.currentValidatedVersionId &&
                !hasOpenSibling &&
                (activeVersion.state === 'NEEDS_SUPPLEMENTATION' ||
                  activeVersion.state === 'CANCELLED') && (
                  <button
                    type="button"
                    className={css.primary}
                    disabled={resource.loading}
                    onClick={() =>
                      setModalAction({
                        kind: 'registration',
                        action: 'supplement',
                        version: activeVersion,
                        requireReason: false,
                        title: 'Tạo phiên bản bổ sung mới',
                        submitLabel: 'Tạo phiên bản bổ sung',
                      })
                    }
                  >
                    Tạo phiên bản bổ sung
                  </button>
                )}

              <button type="button" onClick={() => setHistoryOpen(true)}>
                Lịch sử thao tác
              </button>
            </div>
          </div>
        </div>
      )}

      {editingDraft && references && (
        <PlayerRegistrationForm
          seasonId={seasonId}
          references={references}
          mode="edit"
          initial={editingDraft}
          onClose={() => setEditingDraft(undefined)}
          onConflictReload={() => {
            setEditingDraft(undefined);
            resource.reload();
            onChange();
          }}
          onSaved={() => {
            setEditingDraft(undefined);
            clearPrecheck();
            resource.reload();
            onChange();
          }}
        />
      )}

      {modalAction && detail && (
        <RegistrationActionModal
          caseId={caseId}
          seasonId={seasonId}
          detail={detail}
          effectiveRegVersionNumber={effectiveReg?.versionNumber ?? null}
          action={modalAction}
          onClose={() => setModalAction(undefined)}
          onReload={() => {
            setModalAction(undefined);
            clearPrecheck();
            setPlansRefreshToken((prev) => prev + 1);
            resource.reload();
            onChange();
          }}
          onDone={(nextVersionId) => {
            setModalAction(undefined);
            clearPrecheck();
            if (nextVersionId) setSelectedVersionId(nextVersionId);
            setPlansRefreshToken((prev) => prev + 1);
            resource.reload();
            onChange();
          }}
        />
      )}

      {historyOpen && detail && (
        <RegistrationHistoryModal
          caseId={caseId}
          playerName={detail.player.fullName}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </AdminDrawer>
  );
}

function RegistrationActionModal({
  caseId,
  seasonId,
  detail,
  effectiveRegVersionNumber,
  action,
  onClose,
  onReload,
  onDone,
}: {
  caseId: string;
  seasonId: string;
  detail: RegistrationDetail;
  effectiveRegVersionNumber: number | null;
  action: PendingModalAction;
  onClose: () => void;
  onReload: () => void;
  onDone: (nextVersionId?: string) => void;
}) {
  const { client } = useSession();
  const formId = useId();
  const [reason, setReason] = useState('');
  const [basis, setBasis] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<readonly FieldErrorDetail[]>([]);
  const [reloadSuggested, setReloadSuggested] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const feedbackRef = useDialogFeedback(error);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (action.kind === 'exception-propose') {
      if (!reason.trim()) {
        setError('Vui lòng nhập lý do đề xuất ngoại lệ tiếp nhận.');
        return;
      }
      if (!basis.trim()) {
        setError('Vui lòng nhập căn cứ đề xuất ngoại lệ tiếp nhận.');
        return;
      }
    } else if (action.requireReason && !reason.trim()) {
      setError('Vui lòng nhập lý do thực hiện thao tác.');
      return;
    }

    setBusy(true);
    setError('');
    setErrorDetails([]);
    setReloadSuggested(false);
    try {
      if (action.kind === 'exception-propose') {
        await client.request(`/seasons/${seasonId}/receipt-exceptions`, {
          method: 'POST',
          body: {
            targetKind: 'PLAYER_REGISTRATION',
            targetVersionId: action.version.id,
            reason: reason.trim(),
            basis: basis.trim(),
            submitImmediately: true,
          },
        });
        onDone();
      } else if (action.kind === 'exception-action') {
        await client.request(`/receipt-exceptions/${action.exception.caseId}/${action.action}`, {
          method: 'POST',
          requestKey: action.critical ? idempotencyKey : undefined,
          body: {
            versionId: action.exception.id,
            expectedRevision: action.exception.revision,
            ...(reason.trim() ? { reason: reason.trim() } : {}),
          },
        });
        onDone();
      } else {
        const response = await client.request<{ versionId?: string }>(
          `/player-registrations/${caseId}/${action.action}`,
          {
            method: 'POST',
            requestKey: action.critical ? idempotencyKey : undefined,
            body: {
              versionId: action.version.id,
              expectedRevision: action.version.revision,
              ...(reason.trim() ? { reason: reason.trim() } : {}),
            },
          },
        );
        onDone(action.action === 'supplement' ? response.data.versionId : undefined);
      }
    } catch (caught) {
      if (caught instanceof HttpFailure) {
        setError(cleanBusinessCopy(caught.message));
        setErrorDetails(caught.details ?? []);
        if (caught.unknownOutcome) {
          setUncertain(true);
          setReloadSuggested(true);
        } else if (
          caught.code === 'REVISION_CONFLICT' ||
          caught.code === 'STATE_CONFLICT' ||
          caught.code === 'BASIS_CHANGED' ||
          caught.status === 503
        ) {
          setReloadSuggested(true);
        }
      } else {
        setError('Không thể xác nhận kết quả từ máy chủ. Vui lòng kiểm tra lại dữ liệu mới nhất.');
        setUncertain(true);
        setReloadSuggested(true);
      }
    } finally {
      setBusy(false);
    }
  }

  const title =
    action.kind === 'exception-propose' ? 'Đề xuất ngoại lệ tiếp nhận ngoài hạn' : action.title;
  const submitLabel =
    action.kind === 'exception-propose'
      ? busy
        ? 'Đang gửi…'
        : 'Gửi đề xuất ngoại lệ'
      : busy
        ? 'Đang xử lý…'
        : uncertain
          ? 'Kiểm tra / gửi lại cùng yêu cầu'
          : action.submitLabel;

  return (
    <Modal
      open
      title={title}
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
        id={formId}
        ref={feedbackRef}
        onSubmit={submit}
        className={`${css.form} ${dialogCss.form}`}
        noValidate
      >
        {error && (
          <div role="alert" className={css.error}>
            <p style={{ margin: 0 }}>{error}</p>
            {errorDetails.length > 0 && (
              <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
                {errorDetails.map((item, idx) => (
                  <li key={`${item.field}-${idx}`}>
                    <strong>{criterionLabels[item.field] ?? item.field}:</strong>{' '}
                    {cleanBusinessCopy(item.message ?? item.code)}
                  </li>
                ))}
              </ul>
            )}
            {reloadSuggested && (
              <div style={{ marginTop: 10 }}>
                <button type="button" onClick={onReload}>
                  Tải lại hồ sơ mới nhất
                </button>
              </div>
            )}
          </div>
        )}

        {action.kind === 'registration' && (
          <div className={regPageCss.evidenceSection}>
            <div>
              <strong>
                {detail.player.fullName} ({detail.player.code})
              </strong>{' '}
              · {detail.club.name} ({detail.club.code})
            </div>
            <div className={regPageCss.cellSub}>
              Phiên bản thao tác: <strong>Phiên bản {action.version.versionNumber}</strong> · Số áo:{' '}
              <strong>
                {action.version.shirtNumber ? `#${action.version.shirtNumber}` : 'Chưa nhập'}
              </strong>{' '}
              · Hiệu lực:{' '}
              <strong>
                {formatIntervalLabel(action.version.playingStart, action.version.playingEnd)}
              </strong>
            </div>
            {action.action === 'confirm-valid' && (
              <div className={regPageCss.cellSub}>
                Hệ thống sẽ đánh giá lại toàn bộ điều kiện theo{' '}
                <strong>
                  {effectiveRegVersionNumber !== null
                    ? `Quy định phiên bản ${effectiveRegVersionNumber}`
                    : 'quy định đang có hiệu lực'}
                </strong>
                , ghi nhận bản chụp thông tin chính thức và lưu lịch sử thao tác.
              </div>
            )}
          </div>
        )}

        {action.kind === 'exception-propose' ? (
          <>
            <p className={pageCss.metaNote}>
              Ngoại lệ tiếp nhận chỉ áp dụng cho{' '}
              <strong>Phiên bản {action.version.versionNumber}</strong> đã tiếp nhận ngoài hạn và
              cần Quản lý mùa giải phê duyệt độc lập.
            </p>
            <label>
              Lý do đề xuất ngoại lệ *
              <textarea
                rows={3}
                maxLength={2000}
                value={reason}
                disabled={busy || uncertain}
                placeholder="Trình bày rõ lý do nộp hồ sơ ngoài khung thời gian…"
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
            <label>
              Căn cứ đề xuất *
              <textarea
                rows={3}
                maxLength={2000}
                value={basis}
                disabled={busy || uncertain}
                placeholder="Số văn bản, công văn hoặc căn cứ tiếp nhận bổ sung…"
                onChange={(event) => setBasis(event.target.value)}
              />
            </label>
          </>
        ) : action.requireReason ||
          (action.kind === 'registration' && action.allowOptionalReason) ? (
          <label>
            {action.requireReason ? 'Lý do *' : 'Ghi chú quyết định (tùy chọn)'}
            <textarea
              rows={3}
              maxLength={2000}
              value={reason}
              disabled={busy || uncertain}
              placeholder={
                action.requireReason
                  ? 'Nhập lý do cụ thể…'
                  : 'Nhập ghi chú ngắn kèm quyết định xác nhận (nếu cần)…'
              }
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
        ) : (
          <p className={pageCss.metaNote}>
            Vui lòng xác nhận thực hiện thao tác trên đúng phiên bản đã chọn.
          </p>
        )}

        <div className={css.actions}>
          <button type="button" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button
            type="submit"
            className={action.kind === 'registration' && action.danger ? css.danger : css.primary}
            disabled={busy}
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function formatRegistrationHistoryChange(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): string {
  const parts: string[] = [];
  const versionNumber = after?.versionNumber ?? before?.versionNumber;
  if (typeof versionNumber === 'number') {
    parts.push(`Bản ghi lần ${versionNumber}`);
  }
  const beforeState = typeof before?.state === 'string' ? before.state : null;
  const afterState = typeof after?.state === 'string' ? after.state : null;
  const formatState = (code: string) =>
    stateLabels[code as RegistrationState] ??
    exceptionStateLabels[code as ReceiptExceptionItem['state']] ??
    code;
  if (beforeState && afterState && beforeState !== afterState) {
    parts.push(`Trạng thái: ${formatState(beforeState)} → ${formatState(afterState)}`);
  } else if (afterState) {
    parts.push(`Trạng thái: ${formatState(afterState)}`);
  }
  if (typeof after?.receiptTimingStatus === 'string') {
    parts.push(`Thời hạn: ${after.receiptTimingStatus === 'ON_TIME' ? 'Đúng hạn' : 'Ngoài hạn'}`);
  }
  const beforeShirt = before?.shirtNumber;
  const afterShirt = after?.shirtNumber;
  if (
    beforeShirt !== afterShirt &&
    (typeof beforeShirt === 'number' || typeof afterShirt === 'number')
  ) {
    parts.push(`Số áo: ${beforeShirt ?? '—'} → ${afterShirt ?? '—'}`);
  } else if (typeof afterShirt === 'number') {
    parts.push(`Số áo: #${afterShirt}`);
  }
  if (typeof after?.u21Finding === 'boolean') {
    parts.push(`U21: ${after.u21Finding ? 'Đạt' : 'Không đạt'}`);
  }
  if (typeof after?.homegrownFinding === 'boolean') {
    parts.push(`Đào tạo trong nước: ${after.homegrownFinding ? 'Đạt' : 'Không đạt'}`);
  }
  if (after?.role === 'SOURCE') {
    parts.push('Vai trò: Câu lạc bộ nguồn');
  } else if (after?.role === 'DESTINATION') {
    parts.push('Vai trò: Câu lạc bộ đích');
  }
  if (typeof after?.effectiveAt === 'string') {
    parts.push(`Mốc hiệu lực: ${formatSeasonInstant(after.effectiveAt)}`);
  }
  const beforeStart = typeof before?.playingStart === 'string' ? before.playingStart : null;
  const afterStart = typeof after?.playingStart === 'string' ? after.playingStart : null;
  const beforeEnd = typeof before?.playingEnd === 'string' ? before.playingEnd : null;
  const afterEnd = typeof after?.playingEnd === 'string' ? after.playingEnd : null;
  if (beforeStart !== afterStart || beforeEnd !== afterEnd) {
    if (afterStart) {
      parts.push(`Hiệu lực: ${formatIntervalLabel(afterStart, afterEnd)}`);
    }
  }
  const beforeDisp =
    typeof before?.playingDisposition === 'string' ? before.playingDisposition : null;
  const afterDisp = typeof after?.playingDisposition === 'string' ? after.playingDisposition : null;
  const formatDisp = (code: string) =>
    code === 'CANCELLED_BEFORE_EFFECTIVITY'
      ? 'Hủy trước hiệu lực'
      : code === 'ACTIVE'
        ? 'Đang hiệu lực'
        : code;
  if (beforeDisp && afterDisp && beforeDisp !== afterDisp) {
    parts.push(`Trạng thái kế hoạch: ${formatDisp(beforeDisp)} → ${formatDisp(afterDisp)}`);
  } else if (afterDisp && afterDisp === 'CANCELLED_BEFORE_EFFECTIVITY') {
    parts.push(`Trạng thái kế hoạch: ${formatDisp(afterDisp)}`);
  }
  return parts.length > 0 ? parts.join(' · ') : '—';
}

function RegistrationHistoryModal({
  caseId,
  playerName,
  onClose,
}: {
  caseId: string;
  playerName: string;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const history = useAdminList<SeasonHistory, SeasonHistoryMeta>(
    `/player-registrations/${caseId}/history?page=${page}&pageSize=20`,
  );
  const items = history.data?.items ?? [];

  return (
    <Modal
      open
      title={`Lịch sử thao tác · ${playerName}`}
      width={820}
      onCancel={onClose}
      footer={null}
    >
      <div className={css.details}>
        <ListFeedback
          loading={history.loading}
          error={history.error}
          empty={!history.loading && !history.error && items.length === 0}
          onRetry={history.reload}
        />
        {items.length > 0 && (
          <div className={css.tableWrap}>
            <table className={css.table}>
              <thead>
                <tr>
                  <th>Thời điểm</th>
                  <th>Thao tác</th>
                  <th>Thay đổi</th>
                  <th>Người thực hiện</th>
                  <th>Lý do</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{formatSeasonInstant(item.occurredAt)}</td>
                    <td>{actions[item.actionCode] ?? item.actionCode}</td>
                    <td>{formatRegistrationHistoryChange(item.before, item.after)}</td>
                    <td>{item.actorName ?? 'Hệ thống'}</td>
                    <td>{item.reason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {history.meta && <Pagination data={{ ...history.meta, items }} change={setPage} />}
        <div className={css.actions}>
          <button type="button" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
