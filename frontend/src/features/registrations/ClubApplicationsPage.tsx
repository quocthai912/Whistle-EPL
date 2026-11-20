import { useId, useState, type FormEvent } from 'react';
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

export function ClubApplicationsPage() {
  const { seasonId } = useParams();
  const { session } = useSession();
  const navigate = useNavigate();
  const seasonsQuery = useAdminList<SeasonList, SeasonHistoryMeta>('/seasons?page=1&pageSize=100');

  const allowedSeasonIds = new Set<string>([
    ...(session?.seasonManagerIds ?? []),
    ...(session?.seasonRoles
      ?.filter(
        (role) => role.roleCode === 'REGISTRATION_OFFICER' || role.roleCode === 'SEASON_MANAGER',
      )
      .map((role) => role.seasonId) ?? []),
  ]);
  const seasons = (seasonsQuery.data?.items ?? []).filter((s) => allowedSeasonIds.has(s.id));
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

      {seasonId ? (
        <SeasonClubApplicationsList key={seasonId} seasonId={seasonId} />
      ) : !seasonsQuery.loading && seasons.length > 0 ? (
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
        !seasonsQuery.error && <p>Bạn chưa được phân công mùa giải nào để quản lý hồ sơ tham dự.</p>
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
    <div style={{ display: 'grid', gap: 16 }}>
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
          onSaved={(caseId) => {
            setCreating(false);
            setPage(1);
            list.reload();
            setSelectedCaseId(caseId);
          }}
        />
      )}

      {selectedCaseId && refData && (
        <ClubApplicationDrawer
          caseId={selectedCaseId}
          seasonId={seasonId}
          references={refData}
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
  onClose,
  onChange,
}: {
  caseId: string;
  seasonId: string;
  references: ClubApplicationReferences;
  onClose: () => void;
  onChange: () => void;
}) {
  const { session } = useSession();
  const resource = useAdminList<ClubApplicationDetail>(`/club-applications/${caseId}`);
  const detail = resource.data;
  const [selectedVersionId, setSelectedVersionId] = useState<string>();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editMode, setEditMode] = useState<'edit' | 'new-round'>();
  const [modalAction, setModalAction] = useState<PendingActionModal>();

  const activeVersion =
    detail?.versions.find((v) => v.id === selectedVersionId) ?? detail?.versions[0];
  const currentAccountId = session?.account.id;
  const seasonOpen = detail?.season.state === 'OPEN';

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

  const initialForForm: InitialDraftValues | undefined =
    detail && activeVersion
      ? {
          caseId: detail.id,
          versionId: activeVersion.id,
          versionRevision: activeVersion.revision,
          clubId: detail.club.id,
          coachName: activeVersion.coachName ?? '',
          homeStadiumId: activeVersion.homeStadiumId ?? '',
          representativeName: activeVersion.representativeName ?? '',
          representativePhone: activeVersion.representativePhone ?? '',
          contactAddress: activeVersion.contactAddress ?? '',
          notes: activeVersion.notes ?? '',
          proposedPlayers: activeVersion.proposedPlayers.map((p) => ({
            playerId: p.playerId,
            shirtNumber: p.shirtNumber,
            notes: p.notes,
          })),
        }
      : undefined;

  return (
    <AdminDrawer
      width={820}
      title={detail ? `${detail.club.name} (${detail.club.code})` : 'Hồ sơ tham dự câu lạc bộ'}
      subtitle={detail ? `Mùa giải ${detail.season.name}` : 'Chi tiết hồ sơ'}
      icon={<AdminIcon name="application" />}
      onClose={onClose}
    >
      <ListFeedback loading={resource.loading} error={resource.error} onRetry={resource.reload} />

      {detail && activeVersion && (
        <div className={css.details}>
          {/* Version switcher */}
          <div className={pageCss.versionTabs} role="tablist" aria-label="Các phiên bản hồ sơ">
            {detail.versions.map((v) => (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={v.id === activeVersion.id}
                className={v.id === activeVersion.id ? pageCss.versionTabActive : undefined}
                onClick={() => setSelectedVersionId(v.id)}
              >
                Phiên bản {v.versionNumber} · {stateLabels[v.state]}
              </button>
            ))}
          </div>

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
              <span className={`${pageCss.pill} ${pageCss.pillApproved}`}>Nội dung chính thức</span>
            )}
          </div>

          <dl className={css.detailGrid}>
            <div>
              <dt>Huấn luyện viên trưởng</dt>
              <dd>{activeVersion.coachName ?? 'Chưa nhập'}</dd>
            </div>
            <div>
              <dt>Sân nhà đăng ký</dt>
              <dd>
                {activeVersion.homeStadium
                  ? `${activeVersion.homeStadium.name} (${activeVersion.homeStadium.code})${activeVersion.homeStadium.discontinuedAt ? ' · Đã ngừng sử dụng' : ''}`
                  : 'Chưa chọn'}
              </dd>
            </div>
            <div>
              <dt>Người đại diện</dt>
              <dd>{activeVersion.representativeName ?? 'Chưa nhập'}</dd>
            </div>
            <div>
              <dt>Số điện thoại đại diện</dt>
              <dd>{activeVersion.representativePhone ?? 'Chưa nhập'}</dd>
            </div>
            <div className={clubCss.full}>
              <dt>Địa chỉ liên hệ</dt>
              <dd>{activeVersion.contactAddress ?? 'Chưa nhập'}</dd>
            </div>
            {activeVersion.notes && (
              <div className={clubCss.full}>
                <dt>Ghi chú</dt>
                <dd>{activeVersion.notes}</dd>
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
            <strong>Danh sách cầu thủ dự kiến ({activeVersion.proposedPlayers.length})</strong>
            {activeVersion.proposedPlayers.length === 0 ? (
              <p className={pageCss.metaNote} style={{ marginTop: 8 }}>
                Chưa có cầu thủ dự kiến nào trong phiên bản này.
              </p>
            ) : (
              <ul>
                {activeVersion.proposedPlayers.map((item) => (
                  <li key={item.id}>
                    <strong>
                      {item.positionOrder}. {item.player.fullName}
                    </strong>{' '}
                    ({item.player.code} · {item.player.positionCode})
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
                Ngoại lệ tiếp nhận ngoài hạn (gắn riêng cho Phiên bản {activeVersion.versionNumber})
              </strong>
              {approvedException ? (
                <p style={{ marginTop: 8 }}>
                  Đã phê duyệt ngoại lệ tiếp nhận bởi {approvedException.decider?.fullName}
                  {approvedException.decidedAt
                    ? ` lúc ${formatSeasonInstant(approvedException.decidedAt)}`
                    : ''}
                  . Có thể tiếp tục trình phê duyệt phiên bản này.
                </p>
              ) : (
                <p className={pageCss.metaNote} style={{ marginTop: 8 }}>
                  Phiên bản này được tiếp nhận ngoài khung thời gian quy định. Cần có ngoại lệ tiếp
                  nhận được quản lý mùa giải độc lập phê duyệt cho đúng phiên bản này trước khi
                  trình duyệt.
                </p>
              )}

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
                          </div>
                        )}
                        {seasonOpen && ex.state === 'SUBMITTED' && (
                          <div className={css.actions} style={{ marginTop: 8 }}>
                            {detail.capabilities.canApprove && !exIsSelf && (
                              <>
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
                            {detail.capabilities.canApprove && exIsSelf && (
                              <span className={pageCss.metaNote}>
                                Người đề xuất ngoại lệ không thể tự phê duyệt.
                              </span>
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

              {seasonOpen &&
                detail.capabilities.canPrepare &&
                !approvedException &&
                !openException &&
                (activeVersion.state === 'RECEIVED' ||
                  activeVersion.state === 'PENDING_APPROVAL') && (
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

          {/* Action Toolbar */}
          <div className={`${css.actions} ${css.profileActions} ${pageCss.drawerActionsRow}`}>
            {seasonOpen && detail.capabilities.canPrepare && activeVersion.state === 'DRAFT' && (
              <>
                <button type="button" onClick={() => setEditMode('edit')}>
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

            {seasonOpen && detail.capabilities.canPrepare && activeVersion.state === 'RECEIVED' && (
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

            {seasonOpen && activeVersion.state === 'PENDING_APPROVAL' && (
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
                {detail.capabilities.canApprove && isFormerEditor && (
                  <p className={pageCss.metaNote} role="status">
                    Nhân sự từng soạn thảo hoặc chỉnh sửa phiên bản này không thể tự phê duyệt.
                  </p>
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

            {detail.capabilities.canStartNewRound && (
              <button
                type="button"
                className={css.primary}
                onClick={() => setEditMode('new-round')}
              >
                Tạo phiên bản bổ sung mới
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

          {historyOpen && <ClubApplicationHistory caseId={detail.id} key={detail.revision} />}

          {editMode && initialForForm && (
            <ClubApplicationForm
              seasonId={seasonId}
              references={references}
              mode={editMode}
              initial={initialForForm}
              onClose={() => setEditMode(undefined)}
              onConflictReload={() => {
                setEditMode(undefined);
                resource.reload();
                onChange();
              }}
              onSaved={() => {
                setEditMode(undefined);
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
    <Modal open title={title} onCancel={onClose} footer={null}>
      <form ref={feedbackRef} id={formId} className={css.form} onSubmit={(e) => void submit(e)}>
        {error && (
          <p role="alert" className={css.error}>
            {error}
          </p>
        )}

        {actionSpec.kind === 'exception-propose' ? (
          <>
            <p className={pageCss.metaNote}>
              Ngoại lệ tiếp nhận chỉ áp dụng cho Phiên bản {actionSpec.version.versionNumber}. Nếu
              bổ sung thành phiên bản mới, cần đánh giá lại thời hạn tiếp nhận.
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
              <p className={pageCss.metaNote}>
                Hệ thống sẽ ghi nhận thời điểm tiếp nhận theo giờ máy chủ và đối chiếu khung thời
                gian của quy định đang có hiệu lực. Nội dung sau khi tiếp nhận không thể chỉnh sửa
                trực tiếp.
              </p>
            )}
            {actionSpec.kind === 'application' && actionSpec.action === 'submit' && (
              <p className={pageCss.metaNote}>
                Hệ thống sẽ kiểm tra đầy đủ các trường bắt buộc, danh sách cầu thủ dự kiến và điều
                kiện thời hạn tiếp nhận trước khi chuyển sang Chờ phê duyệt.
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
