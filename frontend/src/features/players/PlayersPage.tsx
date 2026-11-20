import { useState } from 'react';
import { formatDisplayDate } from '../../shared/date-format';
import { useSession } from '../../shared/http/use-session';
import { AdminDrawer } from '../accounts/AdminDrawer';
import { AdminIcon } from '../accounts/AdminIcon';
import { DisplayOptions, ListFeedback, Pagination } from '../accounts/AdminLists';
import { AdminSelect } from '../accounts/AdminSelect';
import css from '../accounts/Administration.module.css';
import { useAdminList } from '../accounts/use-admin-list';
import { useSearchTerm } from '../accounts/use-search-term';
import { actions } from '../audit/audit-filters';
import clubCss from '../clubs/ClubsPage.module.css';
import reviewCss from '../masters/MasterForms.module.css';
import {
  formatSeasonInstant,
  type SeasonHistory,
  type SeasonHistoryMeta,
  type SeasonList,
} from '../seasons/season-model';
import { PlayerForm, type PlayerCatalogs, type PlayerDetail } from './PlayerForm';
import { PlayerPortrait, PlayerPortraitActions, type PortraitReference } from './PlayerPortrait';
import playerCss from './PlayersPage.module.css';

type PlayerListItem = {
  id: string;
  code: string;
  fullName: string;
  birthDate: string;
  nationalityCode: string;
  nationalityLabel: string;
  positionCode: string;
  positionLabel: string;
  revision: string;
  portrait: PortraitReference | null;
};

type PlayerListResponse = {
  items: PlayerListItem[];
  capabilities: { canEdit: boolean };
};

type PlayerImpactResponse = {
  status: 'KNOWN';
  affected: {
    kind: 'CLUB_APPLICATION' | 'PLAYER_REGISTRATION';
    id: string;
    clubCode: string;
    clubName: string;
    latestVersionNumber: number | null;
    state: string | null;
  }[];
};

const historyFieldLabels: Record<string, string> = {
  code: 'Mã cầu thủ',
  fullName: 'Họ và tên',
  birthDate: 'Ngày sinh',
  nationalityCode: 'Mã quốc tịch',
  positionCode: 'Vị trí thi đấu',
  correctionBasis: 'Căn cứ hiệu chỉnh',
  duplicateReviewReason: 'Lý do xác nhận không trùng',
};

function formatHistoryValue(field: string, value: unknown): string {
  if (typeof value !== 'string') return '—';
  if (field === 'birthDate') return formatDisplayDate(value) || value;
  return value;
}

export function PlayersPage() {
  const [searchDraft, setSearchDraft] = useState('');
  const search = useSearchTerm(searchDraft);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('fullName:asc');
  const [pageSize, setPageSize] = useState('20');
  const [positionCode, setPositionCode] = useState('');
  const [nationalityCode, setNationalityCode] = useState('');
  const [selected, setSelected] = useState<PlayerListItem>();
  const [creating, setCreating] = useState(false);

  const catalogsQuery = useAdminList<PlayerCatalogs>('/players/catalogs');
  const catalogs: PlayerCatalogs = catalogsQuery.data ?? { positions: [], nationalities: [] };

  const params = new URLSearchParams({ page: String(page), pageSize, sort, search });
  if (positionCode) params.set('positionCode', positionCode);
  if (nationalityCode) params.set('nationalityCode', nationalityCode);

  const list = useAdminList<PlayerListResponse, SeasonHistoryMeta>(`/players?${params}`);
  const items = list.data?.items ?? [];

  return (
    <section className={css.panel} aria-label="Quản lý hồ sơ cầu thủ">
      <div className={css.sectionHeader}>
        <div>
          <h1>Quản lý hồ sơ cầu thủ</h1>
          <p>Tra cứu, cập nhật hồ sơ gốc và quản lý ảnh chân dung cầu thủ.</p>
        </div>
        {list.data?.capabilities.canEdit && (
          <button type="button" className={css.primary} onClick={() => setCreating(true)}>
            <AdminIcon name="plus" /> Thêm cầu thủ
          </button>
        )}
      </div>

      <div className={css.filters}>
        <label className={css.search}>
          <span className={css.srOnly}>Tìm cầu thủ</span>
          <AdminIcon name="search" />
          <input
            value={searchDraft}
            placeholder="Tìm theo mã, họ tên, quốc tịch hoặc vị trí…"
            onChange={(event) => {
              setSearchDraft(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <AdminSelect
          label="Vị trí thi đấu"
          value={positionCode}
          options={[
            { value: '', label: 'Tất cả vị trí' },
            ...catalogs.positions.map((pos) => ({
              value: pos.code,
              label: `${pos.code} · ${pos.vietnameseLabel}`,
            })),
          ]}
          onChange={(value) => {
            setPositionCode(value);
            setPage(1);
          }}
        />
        <AdminSelect
          label="Quốc tịch"
          searchable
          value={nationalityCode}
          options={[
            { value: '', label: 'Tất cả quốc tịch' },
            ...catalogs.nationalities.map((nat) => ({
              value: nat.code,
              label: `${nat.vietnameseLabel} (${nat.code})`,
            })),
          ]}
          onChange={(value) => {
            setNationalityCode(value);
            setPage(1);
          }}
        />
        <button
          type="button"
          className={css.refresh}
          aria-label="Làm mới danh sách cầu thủ"
          onClick={list.reload}
        >
          <AdminIcon name="refresh" />
        </button>
      </div>

      <DisplayOptions
        sort={sort}
        pageSize={pageSize}
        sorts={[
          { value: 'fullName:asc', label: 'Họ tên A–Z' },
          { value: 'fullName:desc', label: 'Họ tên Z–A' },
          { value: 'code:asc', label: 'Mã A–Z' },
          { value: 'birthDate:desc', label: 'Ngày sinh mới nhất' },
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
                <th scope="col">Ảnh</th>
                <th scope="col">Mã cầu thủ</th>
                <th scope="col">Họ và tên</th>
                <th scope="col">Ngày sinh</th>
                <th scope="col">Quốc tịch</th>
                <th scope="col">Vị trí</th>
                <th scope="col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((player, index) => (
                <tr key={player.id}>
                  <td>
                    {((list.meta?.page ?? page) - 1) * (list.meta?.pageSize ?? 20) + index + 1}
                  </td>
                  <td>
                    <PlayerPortrait name={player.fullName} portrait={player.portrait} small />
                  </td>
                  <td>{player.code}</td>
                  <td>{player.fullName}</td>
                  <td>{formatDisplayDate(player.birthDate)}</td>
                  <td>{player.nationalityLabel}</td>
                  <td>
                    {player.positionCode} · {player.positionLabel}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setSelected(player)}
                      aria-label={`Chi tiết ${player.fullName}`}
                    >
                      <AdminIcon name="eye" /> Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {list.meta && <Pagination data={{ ...list.meta, items }} change={setPage} />}

      {selected && (
        <PlayerProfileDrawer
          player={selected}
          catalogs={catalogs}
          onClose={() => setSelected(undefined)}
          onChange={list.reload}
        />
      )}

      {creating && (
        <PlayerForm
          catalogs={catalogs}
          onClose={() => {
            setCreating(false);
            list.reload();
          }}
          onSaved={() => {
            setCreating(false);
            setPage(1);
            list.reload();
          }}
        />
      )}
    </section>
  );
}

function PlayerProfileDrawer({
  player,
  catalogs,
  onClose,
  onChange,
}: {
  player: PlayerListItem;
  catalogs: PlayerCatalogs;
  onClose: () => void;
  onChange: () => void;
}) {
  const resource = useAdminList<PlayerDetail>(`/players/${player.id}`);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [impactOpen, setImpactOpen] = useState(false);
  const [formMode, setFormMode] = useState<{ detail: PlayerDetail; correcting: boolean }>();
  const detail = resource.data;

  return (
    <AdminDrawer
      width={760}
      title={detail?.fullName ?? player.fullName}
      subtitle="Hồ sơ cầu thủ"
      icon={<AdminIcon name="user" />}
      onClose={onClose}
    >
      <ListFeedback loading={resource.loading} error={resource.error} onRetry={resource.reload} />
      {detail && (
        <div className={css.details}>
          <div className={clubCss.hero}>
            <PlayerPortrait name={detail.fullName} portrait={detail.portrait} />
            {!resource.loading && detail.capabilities.canEdit && (
              <PlayerPortraitActions
                playerId={detail.id}
                revision={detail.revision}
                portrait={detail.portrait}
                onChange={() => {
                  resource.reload();
                  onChange();
                }}
              />
            )}
          </div>

          <dl className={css.detailGrid}>
            <div>
              <dt>Mã cầu thủ</dt>
              <dd>{detail.code}</dd>
            </div>
            <div>
              <dt>Ngày sinh</dt>
              <dd>{formatDisplayDate(detail.birthDate)}</dd>
            </div>
            <div>
              <dt>Quốc tịch</dt>
              <dd>
                {detail.nationality.vietnameseLabel} ({detail.nationality.code})
              </dd>
            </div>
            <div>
              <dt>Vị trí thi đấu</dt>
              <dd>
                {detail.position.code} · {detail.position.vietnameseLabel}
              </dd>
            </div>
            <div className={clubCss.full}>
              <dt>Họ và tên</dt>
              <dd>{detail.fullName}</dd>
            </div>
          </dl>

          <div
            className={
              !resource.loading && !resource.error && detail.capabilities.canEdit
                ? `${css.profileActions} ${playerCss.actionsGrid}`
                : `${css.actions} ${css.profileActions}`
            }
          >
            {!resource.loading && !resource.error && detail.capabilities.canEdit && (
              <>
                <button
                  type="button"
                  className={css.primary}
                  onClick={() => setFormMode({ detail, correcting: false })}
                >
                  Cập nhật thông tin
                </button>
                <button type="button" onClick={() => setFormMode({ detail, correcting: true })}>
                  Hiệu chỉnh thông tin sai sót
                </button>
                <button
                  type="button"
                  aria-expanded={impactOpen}
                  onClick={() => setImpactOpen(!impactOpen)}
                >
                  Nghiệp vụ cần rà soát
                </button>
              </>
            )}
            <button
              type="button"
              aria-expanded={historyOpen}
              onClick={() => setHistoryOpen(!historyOpen)}
            >
              Lịch sử
            </button>
          </div>

          {impactOpen && detail.capabilities.canEdit && (
            <PlayerCorrectionImpact playerId={detail.id} />
          )}

          {historyOpen && <PlayerHistory playerId={detail.id} key={detail.revision} />}

          {formMode && (
            <PlayerForm
              catalogs={catalogs}
              detail={formMode.detail}
              correcting={formMode.correcting}
              onRevisionConflict={() => {
                setFormMode(undefined);
                resource.reload();
                onChange();
              }}
              onClose={() => setFormMode(undefined)}
              onSaved={() => {
                setFormMode(undefined);
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

function PlayerCorrectionImpact({ playerId }: { playerId: string }) {
  const { session } = useSession();
  const [seasonId, setSeasonId] = useState('');
  const seasons = useAdminList<SeasonList, SeasonHistoryMeta>('/seasons?page=1&pageSize=100');
  const eligible = (seasons.data?.items ?? []).filter(
    (season) =>
      session?.seasonRoles?.some(
        (assignment) =>
          assignment.seasonId === season.id &&
          (assignment.roleCode === 'REGISTRATION_OFFICER' ||
            assignment.roleCode === 'SEASON_MANAGER'),
      ) || session?.seasonManagerIds?.includes(season.id),
  );
  const selected = eligible.find((s) => s.id === seasonId) ?? eligible[0];

  return (
    <section
      className={`${reviewCss.review} ${reviewCss.impactReview}`}
      aria-label="Nghiệp vụ cần rà soát"
    >
      <strong>Nghiệp vụ cần rà soát theo mùa giải</strong>
      <ListFeedback
        loading={seasons.loading}
        error={seasons.error}
        empty={eligible.length === 0}
        onRetry={seasons.reload}
      />
      {selected && (
        <>
          <AdminSelect
            label="Mùa giải cần rà soát"
            hideLabel={false}
            value={selected.id}
            options={eligible.map((s) => ({ value: s.id, label: s.name }))}
            onChange={setSeasonId}
          />
          <PlayerImpactResults
            path={`/players/${playerId}/correction-impact?seasonId=${selected.id}`}
          />
        </>
      )}
    </section>
  );
}

function PlayerImpactResults({ path }: { path: string }) {
  const result = useAdminList<PlayerImpactResponse>(path);
  const kindLabels = {
    CLUB_APPLICATION: 'Hồ sơ tham dự câu lạc bộ',
    PLAYER_REGISTRATION: 'Hồ sơ đăng ký cầu thủ',
  };
  return (
    <>
      <ListFeedback loading={result.loading} error={result.error} onRetry={result.reload} />
      {result.data?.status === 'KNOWN' &&
        (result.data.affected.length ? (
          <ul>
            {result.data.affected.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                {kindLabels[item.kind]} · {item.clubName} ({item.clubCode})
                {item.latestVersionNumber ? ` · Phiên bản ${item.latestVersionNumber}` : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p>Không phát hiện hồ sơ liên quan cần rà soát trong mùa giải này.</p>
        ))}
    </>
  );
}

function PlayerHistory({ playerId }: { playerId: string }) {
  const [page, setPage] = useState(1);
  const list = useAdminList<SeasonHistory, SeasonHistoryMeta>(
    `/players/${playerId}/history?page=${page}`,
  );
  const items = list.data?.items ?? [];

  return (
    <section aria-label="Lịch sử thay đổi hồ sơ cầu thủ">
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
            const fields = Object.keys({ ...(item.before ?? {}), ...(item.after ?? {}) });
            return (
              <article key={item.id}>
                <p>
                  <strong>{actions[item.actionCode] ?? item.actionCode}</strong> ·{' '}
                  {formatSeasonInstant(item.occurredAt)}
                </p>
                {item.actorName && <p>Người thực hiện: {item.actorName}</p>}
                {item.reason && <p>Lý do: {item.reason}</p>}
                {fields.length > 0 && (
                  <dl className={css.detailGrid}>
                    {fields.map((field) => (
                      <div key={field}>
                        <dt>{historyFieldLabels[field] ?? field}</dt>
                        <dd>
                          {item.before && Object.hasOwn(item.before, field)
                            ? `${formatHistoryValue(field, item.before[field])} → ${formatHistoryValue(field, item.after?.[field])}`
                            : formatHistoryValue(field, item.after?.[field])}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
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
