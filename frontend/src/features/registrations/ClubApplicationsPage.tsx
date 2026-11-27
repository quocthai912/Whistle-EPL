import { useEffect, useId, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { HttpFailure } from '../../shared/http/client';
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
import reviewCss from '../masters/MasterForms.module.css';
import regCss from '../regulations/RegulationVersionsPage.module.css';
import {
  formatSeasonInstant,
  type SeasonHistory,
  type SeasonHistoryMeta,
  type SeasonList,
} from '../seasons/season-model';
import {
  ClubApplicationForm,
  type ClubApplicationReferences,
  type InitialDraftValues,
} from './ClubApplicationForm';
import pageCss from './ClubApplicationsPage.module.css';
import { OfficialCorrectionsPanel } from './OfficialCorrectionsPanel';

type ApplicationState =
  | 'DRAFT'
  | 'RECEIVED'
  | 'PENDING_APPROVAL'
  | 'NEEDS_SUPPLEMENTATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'CANCELLED';

const stateLabels: Record<ApplicationState, string> = {
  DRAFT: 'Nháp',
  RECEIVED: 'Đã tiếp nhận',
  PENDING_APPROVAL: 'Chờ phê duyệt',
  NEEDS_SUPPLEMENTATION: 'Cần bổ sung',
  APPROVED: 'Đã phê duyệt',
  REJECTED: 'Bị từ chối',
  WITHDRAWN: 'Đã rút',
  CANCELLED: 'Đã hủy',
};

const exceptionStateLabels: Record<string, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Chờ phê duyệt',
  RETURNED: 'Đã trả lại',
  WITHDRAWN: 'Đã rút',
  REJECTED: 'Bị từ chối',
  APPROVED: 'Đã phê duyệt',
};

const stateFilterOptions = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'RECEIVED', label: 'Đã tiếp nhận' },
  { value: 'PENDING_APPROVAL', label: 'Chờ phê duyệt' },
  { value: 'NEEDS_SUPPLEMENTATION', label: 'Cần bổ sung' },
  { value: 'APPROVED', label: 'Đã phê duyệt' },
  { value: 'REJECTED', label: 'Bị từ chối' },
  { value: 'WITHDRAWN', label: 'Đã rút' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

type ClubApplicationSummary = {
  id: string;
  seasonId: string;
  revision: string;
  currentDraftVersionId: string | null;
  currentAcceptedVersionId: string | null;
  updatedAt: string;
  club: {
    id: string;
    code: string;
    name: string;
    abbreviation: string;
    discontinuedAt: string | null;
  };
  latestVersion: {
    id: string;
    versionNumber: number;
    revision: string;
    state: ApplicationState;
    coachName: string | null;
    representativeName: string | null;
    homeStadium: { id: string; code: string; name: string; discontinuedAt: string | null } | null;
    receivedAt: string | null;
    receiptTimingStatus: 'ON_TIME' | 'LATE' | null;
    submittedAt: string | null;
    decidedAt: string | null;
    proposedPlayerCount: number;
    hasApprovedException: boolean;
  } | null;
};

type ClubApplicationListResponse = {
  items: ClubApplicationSummary[];
  capabilities: { canPrepare: boolean; canApprove: boolean };
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

type ClubApplicationVersionDetail = {
  id: string;
  versionNumber: number;
  versionKind: string;
  revision: string;
  state: ApplicationState;
  preparedBy: string;
  preparer: { id: string; fullName: string; personnelCode: string };
  editorIds: string[];
  receivedAt: string | null;
  submittedAt: string | null;
  decidedAt: string | null;
  decidedBy: string | null;
  decider: { id: string; fullName: string; personnelCode: string } | null;
  decisionReason: string | null;
  coachName: string | null;
  homeStadiumId: string | null;
  homeStadium: {
    id: string;
    code: string;
    name: string;
    location: string | null;
    discontinuedAt: string | null;
  } | null;
  representativeName: string | null;
  representativePhone: string | null;
  contactAddress: string | null;
  notes: string | null;
  receiptRegulationVersionId: string | null;
  receiptTimingStatus: 'ON_TIME' | 'LATE' | null;
  receiptWindow: { id: string; opensAt: string; closesAt: string } | null;
  approvalRegulationVersionId: string | null;
  officialSnapshot: Record<string, unknown> | null;
  proposedPlayers: {
    id: string;
    playerId: string;
    positionOrder: number;
    shirtNumber: number | null;
    notes: string | null;
    player: {
      id: string;
      code: string;
      fullName: string;
      birthDate: string;
      nationalityCode: string;
      positionCode: string;
    };
  }[];
  receiptExceptions: ReceiptExceptionItem[];
};

type ClubApplicationDetail = {
  id: string;
  seasonId: string;
  season: { id: string; code: string; name: string; state: 'OPEN' | 'CLOSED' };
  club: {
    id: string;
    code: string;
    name: string;
    abbreviation: string;
    discontinuedAt: string | null;
  };
  revision: string;
  currentDraftVersionId: string | null;
  currentAcceptedVersionId: string | null;
  versions: ClubApplicationVersionDetail[];
  capabilities: { canPrepare: boolean; canApprove: boolean; canStartNewRound: boolean };
};

const seasonPath = (id: string) => `/workspace/seasons/${encodeURIComponent(id)}/club-applications`;

function statePillClass(state: ApplicationState): string {
  if (state === 'APPROVED') return `${pageCss.pill} ${pageCss.pillOk}`;
  if (state === 'PENDING_APPROVAL') return `${pageCss.pill} ${pageCss.pillPending}`;
  if (state === 'REJECTED' || state === 'NEEDS_SUPPLEMENTATION')
    return `${pageCss.pill} ${pageCss.pillLate}`;
  return pageCss.pill;
}

function missingSubmissionFields(version: ClubApplicationVersionDetail): string[] {
  const missing: string[] = [];
  if (!version.coachName) missing.push('Huấn luyện viên trưởng');
  if (!version.homeStadiumId) missing.push('Sân nhà đăng ký');
  if (!version.representativeName) missing.push('Người đại diện');
  if (!version.representativePhone) missing.push('Số điện thoại đại diện');
  if (!version.contactAddress) missing.push('Địa chỉ liên hệ');
  if (!version.proposedPlayers.length)
    missing.push('Danh sách cầu thủ dự kiến (ít nhất 1 cầu thủ)');
  return missing;
}

function buildInitialDraftValues(
  detail: ClubApplicationDetail,
  sourceVersion: ClubApplicationVersionDetail,
): InitialDraftValues {
  return {
    caseId: detail.id,
    versionId: sourceVersion.id,
    versionNumber: sourceVersion.versionNumber,
    versionRevision: sourceVersion.revision,
    clubId: detail.club.id,
    coachName: sourceVersion.coachName ?? '',
    homeStadiumId: sourceVersion.homeStadiumId ?? '',
    representativeName: sourceVersion.representativeName ?? '',
    representativePhone: sourceVersion.representativePhone ?? '',
    contactAddress: sourceVersion.contactAddress ?? '',
    notes: sourceVersion.notes ?? '',
    proposedPlayers: sourceVersion.proposedPlayers.map((p) => ({
      playerId: p.playerId,
      shirtNumber: p.shirtNumber,
      notes: p.notes,
    })),
  };
}

type DisplayedProposedPlayer = {
  key: string;
  positionOrder: number;
  fullName: string;
  code: string;
  positionCode: string;
  shirtNumber: number | null;
  notes: string | null;
};

function resolveDisplayedVersionFacts(
  detail: ClubApplicationDetail,
  version: ClubApplicationVersionDetail,
) {
  const snap =
    version.state === 'APPROVED' &&
    version.officialSnapshot &&
    typeof version.officialSnapshot === 'object'
      ? version.officialSnapshot
      : null;

  const snapClub =
    snap?.club && typeof snap.club === 'object'
      ? (snap.club as { code?: unknown; name?: unknown })
      : null;
  const clubName = typeof snapClub?.name === 'string' ? snapClub.name : detail.club.name;
  const clubCode = typeof snapClub?.code === 'string' ? snapClub.code : detail.club.code;

  const snapStadium =
    snap?.homeStadium && typeof snap.homeStadium === 'object'
      ? (snap.homeStadium as { code?: unknown; name?: unknown })
      : null;
  const homeStadiumLabel =
    snapStadium && typeof snapStadium.name === 'string' && typeof snapStadium.code === 'string'
      ? `${snapStadium.name} (${snapStadium.code})${version.homeStadium?.discontinuedAt ? ' · Đã ngừng sử dụng' : ''}`
      : version.homeStadium
        ? `${version.homeStadium.name} (${version.homeStadium.code})${version.homeStadium.discontinuedAt ? ' · Đã ngừng sử dụng' : ''}`
        : 'Chưa chọn';

  const coachName =
    snap && typeof snap.coachName === 'string' ? snap.coachName : (version.coachName ?? null);
  const representativeName =
    snap && typeof snap.representativeName === 'string'
      ? snap.representativeName
      : (version.representativeName ?? null);
  const representativePhone =
    snap && typeof snap.representativePhone === 'string'
      ? snap.representativePhone
      : (version.representativePhone ?? null);
  const contactAddress =
    snap && typeof snap.contactAddress === 'string'
      ? snap.contactAddress
      : (version.contactAddress ?? null);
  const notes = snap && typeof snap.notes === 'string' ? snap.notes : (version.notes ?? null);

  let proposedPlayers: DisplayedProposedPlayer[];
  if (snap && Array.isArray(snap.proposedPlayers)) {
    proposedPlayers = snap.proposedPlayers.map((raw, idx) => {
      const entry = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
      return {
        key: `snap-${idx}-${String(entry.playerId ?? idx)}`,
        positionOrder: typeof entry.positionOrder === 'number' ? entry.positionOrder : idx + 1,
        fullName: typeof entry.fullName === 'string' ? entry.fullName : '—',
        code: typeof entry.code === 'string' ? entry.code : '—',
        positionCode: typeof entry.positionCode === 'string' ? entry.positionCode : '—',
        shirtNumber: typeof entry.shirtNumber === 'number' ? entry.shirtNumber : null,
        notes: typeof entry.notes === 'string' ? entry.notes : null,
      };
    });
  } else {
    proposedPlayers = version.proposedPlayers.map((item) => ({
      key: item.id,
      positionOrder: item.positionOrder,
      fullName: item.player.fullName,
      code: item.player.code,
      positionCode: item.player.positionCode,
      shirtNumber: item.shirtNumber,
      notes: item.notes,
    }));
  }

  return {
    clubName,
    clubCode,
    homeStadiumLabel,
    homeStadiumName:
      typeof snapStadium?.name === 'string'
        ? snapStadium.name
        : (version.homeStadium?.name ?? null),
    coachName,
    representativeName,
    representativePhone,
    contactAddress,
    notes,
    proposedPlayers,
  };
}

export function ClubApplicationsPage() {
  const { seasonId } = useParams();
  const { session, client } = useSession();
  const navigate = useNavigate();
  const seasonsQuery = useAdminList<SeasonList, SeasonHistoryMeta>('/seasons?page=1&pageSize=100');
  const totalSeasons = seasonsQuery.meta?.total ?? 0;
  const seasonPageSize = seasonsQuery.meta?.pageSize ?? 100;
  const extraSeasonQuery = useMemo(
    () => ({
      client,
      pageSize: seasonPageSize,
      pages: Array.from(
        {
          length: seasonsQuery.data ? Math.max(0, Math.ceil(totalSeasons / seasonPageSize) - 1) : 0,
        },
        (_, index) => index + 2,
      ),
    }),
    [client, seasonPageSize, seasonsQuery.data, totalSeasons],
  );
  type PageResult = { items: SeasonList['items'] } | { error: string; retry: () => void };
  const [extraSeasonResults, setExtraSeasonResults] = useState<{
    query: typeof extraSeasonQuery;
    pages: Partial<Record<number, PageResult>>;
  }>();

  useEffect(() => {
    let active = true;
    function setPage(page: number, result?: PageResult) {
      if (active) {
        setExtraSeasonResults((previous) => ({
          query: extraSeasonQuery,
          pages: {
            ...(previous?.query === extraSeasonQuery ? previous.pages : {}),
            [page]: result,
          },
        }));
      }
    }
    async function loadPage(page: number) {
      try {
        const { data } = await extraSeasonQuery.client.request<SeasonList>(
          `/seasons?page=${page}&pageSize=${extraSeasonQuery.pageSize}`,
        );
        setPage(page, { items: data.items });
      } catch {
        setPage(page, {
          error: `Không thể tải danh sách mùa giải (trang ${page}).`,
          retry: () => {
            if (!active) return;
            setPage(page);
            void loadPage(page);
          },
        });
      }
    }
    for (const page of extraSeasonQuery.pages) void loadPage(page);
    return () => {
      active = false;
    };
  }, [extraSeasonQuery]);

  const extraPages = extraSeasonQuery.pages.map((page) => ({
    page,
    result:
      extraSeasonResults?.query === extraSeasonQuery ? extraSeasonResults.pages[page] : undefined,
  }));
  const allExtraPagesLoaded = extraPages.every(({ result }) => result && 'items' in result);

  const allowedSeasonIds = new Set<string>([
    ...(session?.seasonManagerIds ?? []),
    ...(session?.seasonRoles
      ?.filter(
        (role) => role.roleCode === 'REGISTRATION_OFFICER' || role.roleCode === 'SEASON_MANAGER',
      )
      .map((role) => role.seasonId) ?? []),
  ]);
  const allSeasons = [
    ...(seasonsQuery.data?.items ?? []),
    ...extraPages.flatMap(({ result }) => (result && 'items' in result ? result.items : [])),
  ];
  const seenSeasonIds = new Set<string>();
  const seasons = allSeasons.filter((s) => {
    if (!allowedSeasonIds.has(s.id) || seenSeasonIds.has(s.id)) return false;
    seenSeasonIds.add(s.id);
    return true;
  });
  const selectedSeason = seasons.find((s) => s.id === seasonId);

  return (
    <section className={regCss.page} aria-label="Hồ sơ đăng ký tham dự câu lạc bộ">
      <header className={regCss.pageHeader}>
        <div>
          <h1 className={css.pageTitle}>Hồ sơ đăng ký tham dự câu lạc bộ</h1>
          <p>
            Tiếp nhận, rà soát, xử lý bổ sung và phê duyệt hồ sơ tham dự giải đấu của các câu lạc bộ
            theo mùa giải.
          </p>
        </div>
        <div className={regCss.seasonPicker}>
          <span className={regCss.seasonPickerLabel} aria-hidden="true">
            Mùa giải
          </span>
          <AdminSelect
            label="Mùa giải"
            className={regCss.seasonControl}
            value={selectedSeason?.id ?? ''}
            onChange={(value) =>
              void navigate(value ? seasonPath(value) : '/workspace/seasons/club-applications')
            }
            options={[
              { value: '', label: 'Chọn mùa giải' },
              ...seasons.map((season) => ({ value: season.id, label: season.name })),
            ]}
          />
          {selectedSeason && (
            <span
              className={`${regCss.seasonState} ${selectedSeason.state === 'OPEN' ? regCss.open : regCss.closed}`}
            >
              {selectedSeason.state === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
            </span>
          )}
        </div>
      </header>

      <ListFeedback
        loading={seasonsQuery.loading}
        error={seasonsQuery.error}
        onRetry={seasonsQuery.reload}
      />

      {extraPages.map(({ page, result }) =>
        result && 'items' in result ? null : (
          <ListFeedback
            key={page}
            loading={!result}
            error={result?.error}
            onRetry={result?.retry ?? seasonsQuery.reload}
          />
        ),
      )}

      {seasonId ? (
        <SeasonClubApplicationsList key={seasonId} seasonId={seasonId} />
      ) : seasons.length > 0 ? (
        <ul className={regCss.seasonChoices} aria-label="Danh sách mùa giải">
          {seasons.map((season) => (
            <li key={season.id}>
              <Link to={seasonPath(season.id)}>
                <strong>{season.name}</strong>
                <span>{season.code}</span>
              </Link>
              <span
                className={`${regCss.seasonState} ${season.state === 'OPEN' ? regCss.open : regCss.closed}`}
              >
                {season.state === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        !seasonsQuery.loading &&
        !seasonsQuery.error &&
        allExtraPagesLoaded && <p>Bạn chưa được phân công mùa giải nào để quản lý hồ sơ tham dự.</p>
      )}
    </section>
  );
}

function SeasonClubApplicationsList({ seasonId }: { seasonId: string }) {
  const [searchDraft, setSearchDraft] = useState('');
  const search = useSearchTerm(searchDraft);
  const [state, setState] = useState('ALL');
  const [clubId, setClubId] = useState('ALL');
  const [sort, setSort] = useState('updatedAt:desc');
  const [pageSize, setPageSize] = useState('20');
  const [page, setPage] = useState(1);
  const [selectedCaseId, setSelectedCaseId] = useState<string>();
  const [creating, setCreating] = useState(false);

  const references = useAdminList<ClubApplicationReferences>(
    `/seasons/${seasonId}/club-applications/references`,
  );
  const params = new URLSearchParams({
    page: String(page),
    pageSize,
    sort,
    state,
    search,
    ...(clubId !== 'ALL' ? { clubId } : {}),
  });
  const list = useAdminList<ClubApplicationListResponse, SeasonHistoryMeta>(
    `/seasons/${seasonId}/club-applications?${params}`,
  );
  const items = list.data?.items ?? [];
  const refData = references.data;
  const seasonOpen = refData?.season.state === 'OPEN';

  return (
    <div className={pageCss.workspaceStack}>
      {references.error && (
        <ListFeedback loading={false} error={references.error} onRetry={references.reload} />
      )}
      {refData && (
        <div
          className={`${pageCss.banner} ${seasonOpen && !refData.effectiveRegulation ? pageCss.bannerWarn : ''}`}
          role="status"
        >
          {!seasonOpen ? (
            <span>
              <strong>Mùa giải đã đóng:</strong> chỉ có thể tra cứu hồ sơ đã lưu, không thể chỉnh
              sửa hoặc phê duyệt mới.
            </span>
          ) : !refData.effectiveRegulation ? (
            <span>
              <strong>Chưa có quy định đang có hiệu lực:</strong> có thể chuẩn bị bản nháp, nhưng
              chưa thể ghi nhận tiếp nhận hoặc phê duyệt hồ sơ.
            </span>
          ) : (
            <span>
              <strong>Quy định đang áp dụng:</strong> Phiên bản{' '}
              {refData.effectiveRegulation.versionNumber}
              {refData.effectiveRegulation.windows.length > 0 && (
                <>
                  {' · '}
                  <strong>Thời gian tiếp nhận hồ sơ:</strong>{' '}
                  {refData.effectiveRegulation.windows
                    .map(
                      (w) =>
                        `${formatSeasonInstant(w.opensAt)} – ${formatSeasonInstant(w.closesAt)}`,
                    )
                    .join('; ')}
                </>
              )}
            </span>
          )}
        </div>
      )}

      <section className={css.panel} aria-label="Danh sách hồ sơ tham dự câu lạc bộ">
        <div className={css.sectionHeader}>
          <div>
            <h2>Danh sách hồ sơ tham dự</h2>
            <p>
              Mỗi câu lạc bộ có một hồ sơ tham dự duy nhất cho mỗi mùa giải, lưu đủ mọi phiên bản xử
              lý.
            </p>
          </div>
          {list.data?.capabilities.canPrepare && seasonOpen && (
            <button type="button" className={css.primary} onClick={() => setCreating(true)}>
              <AdminIcon name="plus" /> Tạo hồ sơ tham dự
            </button>
          )}
        </div>

        <div className={css.filters}>
          <label className={css.search}>
            <span className={css.srOnly}>Tìm hồ sơ tham dự</span>
            <AdminIcon name="search" />
            <input
              value={searchDraft}
              placeholder="Tìm theo mã CLB, tên CLB, HLV trưởng hoặc người đại diện…"
              onChange={(event) => {
                setSearchDraft(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <AdminSelect
            label="Câu lạc bộ"
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
            value={state}
            options={stateFilterOptions}
            onChange={(value) => {
              setState(value);
              setPage(1);
            }}
          />
          <button
            type="button"
            className={css.refresh}
            aria-label="Làm mới danh sách hồ sơ tham dự"
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
            { value: 'clubName:asc', label: 'Tên câu lạc bộ A–Z' },
            { value: 'clubName:desc', label: 'Tên câu lạc bộ Z–A' },
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
          empty={!items.length}
          onRetry={list.reload}
        />

        {!!items.length && (
          <div className={css.scroll}>
            <table className={css.table}>
              <thead>
                <tr>
                  <th scope="col">STT</th>
                  <th scope="col">Câu lạc bộ</th>
                  <th scope="col">Phiên bản</th>
                  <th scope="col">HLV trưởng &amp; Sân nhà</th>
                  <th scope="col">Thời hạn tiếp nhận</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const latest = item.latestVersion;
                  return (
                    <tr key={item.id}>
                      <td>
                        {((list.meta?.page ?? page) - 1) * (list.meta?.pageSize ?? 20) + index + 1}
                      </td>
                      <td>
                        <strong>{item.club.name}</strong>
                        <div className={pageCss.metaNote}>
                          {item.club.code} · {latest?.proposedPlayerCount ?? 0} cầu thủ dự kiến
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {latest ? `Phiên bản ${latest.versionNumber}` : '—'}
                      </td>
                      <td>
                        <div>{latest?.coachName ?? 'Chưa nhập'}</div>
                        <div className={pageCss.metaNote}>
                          {latest?.homeStadium?.name ?? 'Chưa chọn sân nhà'}
                        </div>
                      </td>
                      <td>
                        {latest?.receiptTimingStatus === 'ON_TIME' ? (
                          <span className={`${pageCss.pill} ${pageCss.pillOk}`}>Đúng hạn</span>
                        ) : latest?.receiptTimingStatus === 'LATE' ? (
                          <div>
                            <span className={`${pageCss.pill} ${pageCss.pillLate}`}>Ngoài hạn</span>
                            {latest.hasApprovedException && (
                              <div className={pageCss.metaNote}>Đã duyệt ngoại lệ</div>
                            )}
                          </div>
                        ) : (
                          <span className={pageCss.metaNote}>Chưa tiếp nhận</span>
                        )}
                      </td>
                      <td>
                        {latest ? (
                          <span className={statePillClass(latest.state)}>
                            {stateLabels[latest.state]}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => setSelectedCaseId(item.id)}
                          aria-label={`Chi tiết hồ sơ ${item.club.name}`}
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
        <ClubApplicationForm
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
        <ClubApplicationDrawer
          caseId={selectedCaseId}
          seasonId={seasonId}
          references={refData ?? null}
          referencesError={references.error}
          onReloadReferences={references.reload}
          onClose={() => setSelectedCaseId(undefined)}
          onChange={list.reload}
        />
      )}
    </div>
  );
}

type PendingActionModal =
  | {
      kind: 'application';
      action: 'receive' | 'submit' | 'approve' | 'return' | 'reject' | 'withdraw' | 'cancel';
      version: ClubApplicationVersionDetail;
      requireReason: boolean;
      title: string;
      submitLabel: string;
      critical?: boolean;
    }
  | {
      kind: 'exception-propose';
      version: ClubApplicationVersionDetail;
    }
  | {
      kind: 'exception-action';
      action: 'submit' | 'withdraw' | 'return' | 'reject' | 'approve';
      exception: ReceiptExceptionItem;
      requireReason: boolean;
      title: string;
      submitLabel: string;
      critical?: boolean;
    };

function ClubApplicationDrawer({
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
  references: ClubApplicationReferences | null;
  referencesError?: string;
  onReloadReferences: () => void;
  onClose: () => void;
  onChange: () => void;
}) {
  const { session } = useSession();
  const resource = useAdminList<ClubApplicationDetail>(`/club-applications/${caseId}`);
  const detail = resource.data;
  const [selectedVersionId, setSelectedVersionId] = useState<string>();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editDraftState, setEditDraftState] = useState<{
    mode: 'edit' | 'new-round';
    initial: InitialDraftValues;
  }>();
  const [modalAction, setModalAction] = useState<PendingActionModal>();

  const activeVersion =
    detail?.versions.find((v) => v.id === selectedVersionId) ?? detail?.versions[0];
  const latestVersion = detail?.versions[0];
  const acceptedVersion =
    detail?.versions.find((v) => v.id === detail.currentAcceptedVersionId) ?? null;
  const currentAccountId = session?.account.id;
  const seasonOpen = detail?.season.state === 'OPEN';
  const isInitialVersion = activeVersion?.versionKind !== 'CORRECTION';
  const canTargetException =
    seasonOpen &&
    !!activeVersion?.receivedAt &&
    activeVersion.receiptTimingStatus === 'LATE' &&
    (activeVersion.state === 'RECEIVED' || activeVersion.state === 'PENDING_APPROVAL');

  const isFormerEditor = !!(
    activeVersion &&
    currentAccountId &&
    (activeVersion.preparedBy === currentAccountId ||
      activeVersion.editorIds.includes(currentAccountId))
  );

  const approvedException = activeVersion?.receiptExceptions.find((ex) => ex.state === 'APPROVED');
  const openException = activeVersion?.receiptExceptions.find(
    (ex) => ex.state === 'DRAFT' || ex.state === 'SUBMITTED',
  );
  const displayedFacts =
    detail && activeVersion ? resolveDisplayedVersionFacts(detail, activeVersion) : null;
  const missingD059Fields = activeVersion ? missingSubmissionFields(activeVersion) : [];

  function handleVersionTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    versions: ClubApplicationVersionDetail[],
    currentIndex: number,
  ) {
    if (!versions.length) return;
    let nextIndex = -1;
    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % versions.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + versions.length) % versions.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = versions.length - 1;
    }
    if (nextIndex >= 0) {
      event.preventDefault();
      const target = versions[nextIndex];
      setSelectedVersionId(target.id);
      document.getElementById(`version-tab-${target.id}`)?.focus();
    }
  }

  return (
    <AdminDrawer
      width={820}
      title={
        displayedFacts
          ? `${displayedFacts.clubName} (${displayedFacts.clubCode})`
          : detail
            ? `${detail.club.name} (${detail.club.code})`
            : 'Hồ sơ tham dự câu lạc bộ'
      }
      subtitle={detail ? `Mùa giải ${detail.season.name}` : 'Chi tiết hồ sơ'}
      icon={<AdminIcon name="application" />}
      onClose={onClose}
    >
      <ListFeedback loading={resource.loading} error={resource.error} onRetry={resource.reload} />
      {referencesError && (
        <ListFeedback loading={false} error={referencesError} onRetry={onReloadReferences} />
      )}

      {detail && activeVersion && displayedFacts && (
        <div className={css.details}>
          {/* Version switcher */}
          <div className={pageCss.versionTabs} role="tablist" aria-label="Các phiên bản hồ sơ">
            {detail.versions.map((v, idx) => (
              <button
                key={v.id}
                id={`version-tab-${v.id}`}
                type="button"
                role="tab"
                aria-selected={v.id === activeVersion.id}
                aria-controls="version-tabpanel"
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
            id="version-tabpanel"
            role="tabpanel"
            tabIndex={0}
            aria-labelledby={`version-tab-${activeVersion.id}`}
            style={{ display: 'grid', gap: 16 }}
          >
            <div className={css.actions}>
              <span className={statePillClass(activeVersion.state)}>
                {stateLabels[activeVersion.state]}
              </span>
              {activeVersion.receiptTimingStatus === 'ON_TIME' && (
                <span className={`${pageCss.pill} ${pageCss.pillOk}`}>
                  Tiếp nhận đúng hạn · {formatSeasonInstant(activeVersion.receivedAt!)}
                </span>
              )}
              {activeVersion.receiptTimingStatus === 'LATE' && (
                <span className={`${pageCss.pill} ${pageCss.pillLate}`}>
                  Tiếp nhận ngoài hạn · {formatSeasonInstant(activeVersion.receivedAt!)}
                </span>
              )}
              {detail.currentAcceptedVersionId === activeVersion.id && (
                <span className={`${pageCss.pill} ${pageCss.pillApproved}`}>
                  Nội dung chính thức
                </span>
              )}
            </div>

            {activeVersion.state === 'RECEIVED' && missingD059Fields.length > 0 && (
              <p className={pageCss.metaNote} role="status">
                Phiên bản đã tiếp nhận còn thiếu thông tin bắt buộc để trình duyệt:{' '}
                {missingD059Fields.join(', ')}. Hãy chọn &ldquo;Yêu cầu bổ sung&rdquo; để tạo phiên
                bản bổ sung mới.
              </p>
            )}

            <dl className={css.detailGrid}>
              <div>
                <dt>Huấn luyện viên trưởng</dt>
                <dd>{displayedFacts.coachName ?? 'Chưa nhập'}</dd>
              </div>
              <div>
                <dt>Sân nhà đăng ký</dt>
                <dd>{displayedFacts.homeStadiumLabel}</dd>
              </div>
              <div>
                <dt>Người đại diện</dt>
                <dd>{displayedFacts.representativeName ?? 'Chưa nhập'}</dd>
              </div>
              <div>
                <dt>Số điện thoại đại diện</dt>
                <dd>{displayedFacts.representativePhone ?? 'Chưa nhập'}</dd>
              </div>
              <div className={clubCss.full}>
                <dt>Địa chỉ liên hệ</dt>
                <dd>{displayedFacts.contactAddress ?? 'Chưa nhập'}</dd>
              </div>
              {displayedFacts.notes && (
                <div className={clubCss.full}>
                  <dt>Ghi chú</dt>
                  <dd>{displayedFacts.notes}</dd>
                </div>
              )}
              <div>
                <dt>Người soạn thảo</dt>
                <dd>{activeVersion.preparer.fullName}</dd>
              </div>
              {activeVersion.decider && (
                <div>
                  <dt>Người xử lý quyết định</dt>
                  <dd>
                    {activeVersion.decider.fullName}
                    {activeVersion.decidedAt
                      ? ` · ${formatSeasonInstant(activeVersion.decidedAt)}`
                      : ''}
                  </dd>
                </div>
              )}
              {activeVersion.decisionReason && (
                <div className={clubCss.full}>
                  <dt>Lý do quyết định</dt>
                  <dd>{activeVersion.decisionReason}</dd>
                </div>
              )}
            </dl>

            {/* Proposed Players */}
            <section className={reviewCss.review} aria-label="Danh sách cầu thủ dự kiến">
              <strong>Danh sách cầu thủ dự kiến ({displayedFacts.proposedPlayers.length})</strong>
              {displayedFacts.proposedPlayers.length === 0 ? (
                <p className={pageCss.metaNote} style={{ marginTop: 8 }}>
                  Chưa có cầu thủ dự kiến nào trong phiên bản này.
                </p>
              ) : (
                <ul>
                  {displayedFacts.proposedPlayers.map((item) => (
                    <li key={item.key}>
                      <strong>
                        {item.positionOrder}. {item.fullName}
                      </strong>{' '}
                      ({item.code} · {item.positionCode})
                      {item.shirtNumber ? ` · Số áo dự kiến: ${item.shirtNumber}` : ''}
                      {item.notes ? ` · ${item.notes}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Late Receipt Exception Section */}
            {activeVersion.receiptTimingStatus === 'LATE' && (
              <section className={reviewCss.review} aria-label="Ngoại lệ tiếp nhận ngoài hạn">
                <strong>
                  Ngoại lệ tiếp nhận ngoài hạn (gắn riêng cho Phiên bản{' '}
                  {activeVersion.versionNumber})
                </strong>
                {approvedException ? (
                  <p style={{ marginTop: 8 }}>
                    Đã phê duyệt ngoại lệ tiếp nhận bởi {approvedException.decider?.fullName}
                    {approvedException.decidedAt
                      ? ` lúc ${formatSeasonInstant(approvedException.decidedAt)}`
                      : ''}
                    .{canTargetException && ' Có thể tiếp tục trình phê duyệt phiên bản này.'}
                  </p>
                ) : canTargetException ? (
                  <p className={pageCss.metaNote} style={{ marginTop: 8 }}>
                    Phiên bản này được tiếp nhận ngoài khung thời gian và cần ngoại lệ được phê
                    duyệt trước khi trình duyệt.
                  </p>
                ) : null}

                {activeVersion.receiptExceptions.length > 0 && (
                  <ul>
                    {activeVersion.receiptExceptions.map((ex) => {
                      const exIsSelf =
                        !!currentAccountId &&
                        (ex.preparedBy === currentAccountId ||
                          ex.editorIds.includes(currentAccountId));
                      return (
                        <li key={ex.id}>
                          <div>
                            <strong>Đề xuất lần {ex.versionNumber}</strong> ·{' '}
                            {exceptionStateLabels[ex.state] ?? ex.state}
                          </div>
                          {ex.reason && <div>Lý do: {ex.reason}</div>}
                          {ex.basis && <div>Căn cứ: {ex.basis}</div>}
                          {ex.decisionReason && <div>Ý kiến xử lý: {ex.decisionReason}</div>}
                          {seasonOpen && ex.state === 'DRAFT' && detail.capabilities.canPrepare && (
                            <div className={css.actions} style={{ marginTop: 8 }}>
                              {canTargetException && (
                                <button
                                  type="button"
                                  className={css.primary}
                                  onClick={() =>
                                    setModalAction({
                                      kind: 'exception-action',
                                      action: 'submit',
                                      exception: ex,
                                      requireReason: false,
                                      title: 'Gửi duyệt ngoại lệ tiếp nhận',
                                      submitLabel: 'Gửi duyệt ngoại lệ',
                                    })
                                  }
                                >
                                  Gửi duyệt ngoại lệ
                                </button>
                              )}
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
                            </div>
                          )}
                          {seasonOpen && ex.state === 'SUBMITTED' && (
                            <div className={css.actions} style={{ marginTop: 8 }}>
                              {detail.capabilities.canApprove && !exIsSelf && (
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
                              {detail.capabilities.canPrepare && (
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
                        </li>
                      );
                    })}
                  </ul>
                )}

                {canTargetException &&
                  detail.capabilities.canPrepare &&
                  !approvedException &&
                  !openException && (
                    <div className={css.actions} style={{ marginTop: 10 }}>
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

            {/* Official Descriptive Corrections Panel */}
            {(detail.currentAcceptedVersionId ||
              detail.versions.some((v) => v.versionKind === 'CORRECTION')) && (
              <OfficialCorrectionsPanel
                mode="club-application"
                caseId={detail.id}
                clubName={detail.club.name}
                seasonName={detail.season.name}
                baseline={
                  acceptedVersion
                    ? {
                        versionId: acceptedVersion.id,
                        versionNumber: acceptedVersion.versionNumber,
                        receivedAt: acceptedVersion.receivedAt,
                        coachName: acceptedVersion.coachName,
                        homeStadiumId: acceptedVersion.homeStadiumId,
                        homeStadiumName: resolveDisplayedVersionFacts(detail, acceptedVersion)
                          .homeStadiumName,
                        representativeName: acceptedVersion.representativeName,
                        representativePhone: acceptedVersion.representativePhone,
                        contactAddress: acceptedVersion.contactAddress,
                        notes: acceptedVersion.notes,
                      }
                    : null
                }
                versions={detail.versions.map((v) => ({
                  versionId: v.id,
                  versionNumber: v.versionNumber,
                  receivedAt: v.receivedAt,
                  coachName: v.coachName,
                  homeStadiumId: v.homeStadiumId,
                  homeStadiumName: resolveDisplayedVersionFacts(detail, v).homeStadiumName,
                  representativeName: v.representativeName,
                  representativePhone: v.representativePhone,
                  contactAddress: v.contactAddress,
                  notes: v.notes,
                }))}
                stadiums={references?.stadiums ?? []}
                onChanged={() => {
                  setSelectedVersionId(undefined);
                  resource.reload();
                  onChange();
                }}
              />
            )}

            {/* Action Toolbar */}
            <div className={`${css.actions} ${css.profileActions} ${pageCss.drawerActionsRow}`}>
              {seasonOpen &&
                isInitialVersion &&
                detail.capabilities.canPrepare &&
                activeVersion.state === 'DRAFT' && (
                  <>
                    <button
                      type="button"
                      disabled={!references}
                      onClick={() =>
                        setEditDraftState({
                          mode: 'edit',
                          initial: buildInitialDraftValues(detail, activeVersion),
                        })
                      }
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      type="button"
                      className={css.primary}
                      onClick={() =>
                        setModalAction({
                          kind: 'application',
                          action: 'receive',
                          version: activeVersion,
                          requireReason: false,
                          title: 'Ghi nhận tiếp nhận hồ sơ',
                          submitLabel: 'Xác nhận tiếp nhận',
                        })
                      }
                    >
                      Ghi nhận tiếp nhận
                    </button>
                    <button
                      type="button"
                      className={css.danger}
                      onClick={() =>
                        setModalAction({
                          kind: 'application',
                          action: 'cancel',
                          version: activeVersion,
                          requireReason: true,
                          title: 'Hủy vòng hồ sơ tham dự',
                          submitLabel: 'Xác nhận hủy',
                        })
                      }
                    >
                      Hủy vòng
                    </button>
                  </>
                )}

              {seasonOpen &&
                detail.capabilities.canPrepare &&
                activeVersion.state === 'RECEIVED' && (
                  <>
                    <button
                      type="button"
                      className={css.primary}
                      onClick={() =>
                        setModalAction({
                          kind: 'application',
                          action: 'submit',
                          version: activeVersion,
                          requireReason: false,
                          title: 'Trình phê duyệt hồ sơ tham dự',
                          submitLabel: 'Trình phê duyệt',
                        })
                      }
                    >
                      Trình phê duyệt
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setModalAction({
                          kind: 'application',
                          action: 'return',
                          version: activeVersion,
                          requireReason: true,
                          title: 'Yêu cầu bổ sung hồ sơ',
                          submitLabel: 'Yêu cầu bổ sung',
                        })
                      }
                    >
                      Yêu cầu bổ sung
                    </button>
                    <button
                      type="button"
                      className={css.danger}
                      onClick={() =>
                        setModalAction({
                          kind: 'application',
                          action: 'cancel',
                          version: activeVersion,
                          requireReason: true,
                          title: 'Hủy vòng hồ sơ tham dự',
                          submitLabel: 'Xác nhận hủy',
                        })
                      }
                    >
                      Hủy vòng
                    </button>
                  </>
                )}

              {seasonOpen && isInitialVersion && activeVersion.state === 'PENDING_APPROVAL' && (
                <>
                  {detail.capabilities.canApprove && !isFormerEditor && (
                    <>
                      <button
                        type="button"
                        className={css.primary}
                        onClick={() =>
                          setModalAction({
                            kind: 'application',
                            action: 'approve',
                            version: activeVersion,
                            requireReason: true,
                            critical: true,
                            title: 'Phê duyệt hồ sơ tham dự câu lạc bộ',
                            submitLabel: 'Phê duyệt hồ sơ',
                          })
                        }
                      >
                        Phê duyệt hồ sơ
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setModalAction({
                            kind: 'application',
                            action: 'return',
                            version: activeVersion,
                            requireReason: true,
                            title: 'Trả lại hồ sơ để bổ sung',
                            submitLabel: 'Trả lại bổ sung',
                          })
                        }
                      >
                        Trả lại bổ sung
                      </button>
                      <button
                        type="button"
                        className={pageCss.dangerSolid}
                        onClick={() =>
                          setModalAction({
                            kind: 'application',
                            action: 'reject',
                            version: activeVersion,
                            requireReason: true,
                            title: 'Từ chối hồ sơ tham dự',
                            submitLabel: 'Từ chối hồ sơ',
                          })
                        }
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                  {detail.capabilities.canPrepare && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setModalAction({
                            kind: 'application',
                            action: 'withdraw',
                            version: activeVersion,
                            requireReason: false,
                            title: 'Rút hồ sơ đang chờ phê duyệt',
                            submitLabel: 'Rút hồ sơ',
                          })
                        }
                      >
                        Rút hồ sơ
                      </button>
                      <button
                        type="button"
                        className={css.danger}
                        onClick={() =>
                          setModalAction({
                            kind: 'application',
                            action: 'cancel',
                            version: activeVersion,
                            requireReason: true,
                            title: 'Hủy vòng hồ sơ tham dự',
                            submitLabel: 'Xác nhận hủy',
                          })
                        }
                      >
                        Hủy vòng
                      </button>
                    </>
                  )}
                </>
              )}

              {detail.capabilities.canStartNewRound && latestVersion && (
                <button
                  type="button"
                  className={css.primary}
                  disabled={!references}
                  onClick={() =>
                    setEditDraftState({
                      mode: 'new-round',
                      initial: buildInitialDraftValues(detail, latestVersion),
                    })
                  }
                >
                  Tạo phiên bản bổ sung mới
                </button>
              )}

              {seasonOpen &&
                detail.capabilities.canPrepare &&
                activeVersion.state === 'NEEDS_SUPPLEMENTATION' &&
                !detail.currentAcceptedVersionId && (
                  <button
                    type="button"
                    className={css.danger}
                    onClick={() =>
                      setModalAction({
                        kind: 'application',
                        action: 'cancel',
                        version: activeVersion,
                        requireReason: true,
                        title: 'Hủy vòng hồ sơ tham dự',
                        submitLabel: 'Xác nhận hủy',
                      })
                    }
                  >
                    Hủy vòng
                  </button>
                )}

              <button
                type="button"
                aria-expanded={historyOpen}
                onClick={() => setHistoryOpen(!historyOpen)}
              >
                Lịch sử
              </button>
            </div>
          </div>

          {historyOpen && <ClubApplicationHistory caseId={detail.id} key={detail.revision} />}

          {editDraftState && references && (
            <ClubApplicationForm
              seasonId={seasonId}
              references={references}
              mode={editDraftState.mode}
              initial={editDraftState.initial}
              onClose={() => setEditDraftState(undefined)}
              onConflictReload={() => {
                setEditDraftState(undefined);
                resource.reload();
                onChange();
              }}
              onSaved={() => {
                setEditDraftState(undefined);
                setSelectedVersionId(undefined);
                resource.reload();
                onChange();
              }}
            />
          )}

          {modalAction && (
            <WorkflowActionModal
              caseId={detail.id}
              seasonId={seasonId}
              actionSpec={modalAction}
              onClose={() => setModalAction(undefined)}
              onReload={() => {
                setModalAction(undefined);
                resource.reload();
                onChange();
              }}
              onCompleted={() => {
                setModalAction(undefined);
                resource.reload();
                onChange();
              }}
            />
          )}
        </div>
      )}
    </AdminDrawer>
  );
}

function WorkflowActionModal({
  caseId,
  seasonId,
  actionSpec,
  onClose,
  onReload,
  onCompleted,
}: {
  caseId: string;
  seasonId: string;
  actionSpec: PendingActionModal;
  onClose: () => void;
  onReload: () => void;
  onCompleted: () => void;
}) {
  const { client } = useSession();
  const formId = useId();
  const [reason, setReason] = useState('');
  const [basis, setBasis] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reloadRequired, setReloadRequired] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const feedbackRef = useDialogFeedback(error);

  const title =
    actionSpec.kind === 'exception-propose'
      ? 'Đề xuất ngoại lệ tiếp nhận ngoài hạn'
      : actionSpec.title;
  const submitLabel =
    actionSpec.kind === 'exception-propose' ? 'Gửi đề xuất ngoại lệ' : actionSpec.submitLabel;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || reloadRequired) return;

    if (actionSpec.kind === 'exception-propose') {
      if (!reason.trim() || !basis.trim()) {
        setError('Vui lòng nhập đầy đủ lý do và căn cứ đề xuất ngoại lệ.');
        return;
      }
    } else if (actionSpec.requireReason && !reason.trim()) {
      setError('Vui lòng nhập lý do thực hiện thao tác này.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      if (actionSpec.kind === 'exception-propose') {
        await client.request(`/seasons/${seasonId}/receipt-exceptions`, {
          method: 'POST',
          body: {
            targetKind: 'CLUB_APPLICATION',
            targetVersionId: actionSpec.version.id,
            reason: reason.trim(),
            basis: basis.trim(),
            submitImmediately: true,
          },
        });
      } else if (actionSpec.kind === 'exception-action') {
        await client.request(
          `/receipt-exceptions/${actionSpec.exception.caseId}/${actionSpec.action}`,
          {
            method: 'POST',
            requestKey: actionSpec.critical ? idempotencyKey : undefined,
            body: {
              versionId: actionSpec.exception.id,
              expectedRevision: actionSpec.exception.revision,
              ...(reason.trim() ? { reason: reason.trim() } : {}),
            },
          },
        );
      } else {
        await client.request(`/club-applications/${caseId}/${actionSpec.action}`, {
          method: 'POST',
          requestKey: actionSpec.critical ? idempotencyKey : undefined,
          body: {
            versionId: actionSpec.version.id,
            expectedRevision: actionSpec.version.revision,
            ...(reason.trim() ? { reason: reason.trim() } : {}),
          },
        });
      }
      onCompleted();
    } catch (failure) {
      if (
        failure instanceof HttpFailure &&
        (failure.unknownOutcome || failure.code === 'REVISION_CONFLICT')
      ) {
        setReloadRequired(true);
        setError(
          'Hồ sơ đã thay đổi hoặc kết quả xử lý chưa xác định. Vui lòng tải lại để kiểm tra.',
        );
      } else {
        setError(failure instanceof Error ? failure.message : 'Không thể thực hiện thao tác.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      title={title}
      className={pageCss.phase3Modal}
      closable={!busy}
      maskClosable={!busy}
      keyboard={!busy}
      onCancel={() => {
        if (!busy) onClose();
      }}
      footer={null}
    >
      <form ref={feedbackRef} id={formId} className={css.form} onSubmit={(e) => void submit(e)}>
        {error && (
          <p role="alert" className={css.error}>
            {error}
          </p>
        )}

        {actionSpec.kind === 'exception-propose' ? (
          <>
            <p className={pageCss.confirmBody}>
              Đề xuất ngoại lệ tiếp nhận cho{' '}
              <strong>Phiên bản {actionSpec.version.versionNumber}</strong>.
            </p>
            <label>
              <span>Lý do đề xuất ngoại lệ</span>
              <textarea
                rows={3}
                value={reason}
                disabled={busy}
                maxLength={2000}
                placeholder="Trình bày lý do tiếp nhận ngoài hạn"
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
            <label>
              <span>Căn cứ xác nhận</span>
              <textarea
                rows={3}
                value={basis}
                disabled={busy}
                maxLength={2000}
                placeholder="Số công văn, biên bản hoặc tài liệu làm căn cứ"
                onChange={(event) => setBasis(event.target.value)}
              />
            </label>
          </>
        ) : (
          <>
            {actionSpec.kind === 'application' && actionSpec.action === 'receive' && (
              <p className={pageCss.confirmBody}>
                Xác nhận tiếp nhận hồ sơ theo thời điểm hiện tại. Sau khi tiếp nhận, nội dung phiên
                bản sẽ được khóa.
              </p>
            )}
            {actionSpec.kind === 'application' && actionSpec.action === 'submit' && (
              <p className={pageCss.confirmBody}>
                Xác nhận trình phê duyệt phiên bản hồ sơ này cho Quản lý mùa giải.
              </p>
            )}
            {(actionSpec.requireReason || actionSpec.action === 'withdraw') && (
              <label>
                <span>
                  {actionSpec.requireReason ? 'Lý do (bắt buộc)' : 'Lý do (không bắt buộc)'}
                </span>
                <textarea
                  rows={3}
                  value={reason}
                  disabled={busy}
                  maxLength={2000}
                  placeholder="Nhập lý do xử lý"
                  onChange={(event) => setReason(event.target.value)}
                />
              </label>
            )}
          </>
        )}

        <div className={css.actions}>
          <button type="button" onClick={onClose} disabled={busy}>
            Hủy
          </button>
          {reloadRequired ? (
            <button type="button" className={css.primary} data-primary onClick={onReload}>
              Tải lại hồ sơ
            </button>
          ) : (
            <button
              type="submit"
              className={
                actionSpec.kind === 'application' && actionSpec.action === 'reject'
                  ? pageCss.dangerSolid
                  : css.primary
              }
              disabled={busy}
            >
              {busy ? 'Đang xử lý…' : submitLabel}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}

function formatApplicationHistoryChange(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): string | null {
  const parts: string[] = [];
  const versionNumber = after?.versionNumber ?? before?.versionNumber;
  if (typeof versionNumber === 'number') {
    parts.push(`Phiên bản ${versionNumber}`);
  }
  const beforeState = typeof before?.state === 'string' ? before.state : null;
  const afterState = typeof after?.state === 'string' ? after.state : null;
  if (beforeState && afterState && beforeState !== afterState) {
    const bLabel =
      stateLabels[beforeState as ApplicationState] ??
      exceptionStateLabels[beforeState as keyof typeof exceptionStateLabels] ??
      beforeState;
    const aLabel =
      stateLabels[afterState as ApplicationState] ??
      exceptionStateLabels[afterState as keyof typeof exceptionStateLabels] ??
      afterState;
    parts.push(`Trạng thái: ${bLabel} → ${aLabel}`);
  } else if (afterState) {
    const aLabel =
      stateLabels[afterState as ApplicationState] ??
      exceptionStateLabels[afterState as keyof typeof exceptionStateLabels] ??
      afterState;
    parts.push(`Trạng thái: ${aLabel}`);
  }
  if (typeof after?.receiptTimingStatus === 'string') {
    parts.push(`Thời hạn: ${after.receiptTimingStatus === 'ON_TIME' ? 'Đúng hạn' : 'Ngoài hạn'}`);
  }
  return parts.length ? parts.join(' · ') : null;
}

function ClubApplicationHistory({ caseId }: { caseId: string }) {
  const [page, setPage] = useState(1);
  const list = useAdminList<SeasonHistory, SeasonHistoryMeta>(
    `/club-applications/${caseId}/history?page=${page}`,
  );
  const items = list.data?.items ?? [];

  return (
    <section aria-label="Lịch sử thay đổi hồ sơ tham dự">
      <h3 style={{ margin: '0 0 12px' }}>Lịch sử thay đổi</h3>
      <ListFeedback
        loading={list.loading}
        error={list.error}
        empty={!items.length}
        onRetry={list.reload}
      />
      {items.length > 0 && (
        <div className={reviewCss.history}>
          {items.map((item) => {
            const summary = formatApplicationHistoryChange(item.before, item.after);
            return (
              <article key={item.id}>
                <p>
                  <strong>{actions[item.actionCode] ?? item.actionCode}</strong> ·{' '}
                  {formatSeasonInstant(item.occurredAt)}
                </p>
                {item.actorName && <p>Người thực hiện: {item.actorName}</p>}
                {summary && <p>Chi tiết: {summary}</p>}
                {item.reason && <p>Lý do: {item.reason}</p>}
              </article>
            );
          })}
        </div>
      )}
      {list.meta && list.meta.total > list.meta.pageSize && (
        <Pagination data={{ ...list.meta, items }} change={setPage} />
      )}
    </section>
  );
}
