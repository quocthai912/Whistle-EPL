import { useState } from 'react';
import { AdminDrawer } from '../accounts/AdminDrawer';
import { AdminIcon } from '../accounts/AdminIcon';
import { ListFeedback, Pagination } from '../accounts/AdminLists';
import { AdminSelect } from '../accounts/AdminSelect';
import { useAdminList } from '../accounts/use-admin-list';
import { useSearchTerm } from '../accounts/use-search-term';
import css from '../accounts/Administration.module.css';
import type { SeasonHistoryMeta } from '../seasons/season-model';
import { MasterForm, MasterHistory } from '../masters/MasterForms';
import { MasterAvailability } from '../masters/MasterAvailability';
import { ClubLogo, ClubLogoActions, type LogoReference } from './ClubLogo';
import clubCss from './ClubsPage.module.css';

type Club = {
  id: string;
  code: string;
  name: string;
  abbreviation: string;
  discontinuedAt: string | null;
  logo: LogoReference | null;
};
type ClubDetail = Club & { revision: string; capabilities: { canEdit: boolean } };
type ClubList = { items: Club[]; capabilities: { canEdit: boolean } };
type ClubFormMode = { detail?: ClubDetail; correcting?: boolean };

const availabilityOptions = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang sử dụng' },
  { value: 'DISCONTINUED', label: 'Đã ngừng sử dụng' },
];

export function ClubsPage() {
  const [searchDraft, setSearchDraft] = useState('');
  const search = useSearchTerm(searchDraft);
  const [page, setPage] = useState(1);
  const [availability, setAvailability] = useState('ALL');
  const [selected, setSelected] = useState<Club>();
  const [creating, setCreating] = useState(false);
  const query = new URLSearchParams({ page: String(page), availability, search });
  const list = useAdminList<ClubList, SeasonHistoryMeta>(`/clubs?${query}`);
  const items = list.data?.items ?? [];

  return (
    <section className={css.panel} aria-label="Quản lý hồ sơ câu lạc bộ">
      <div className={css.sectionHeader}>
        <div>
          <h1>Quản lý hồ sơ câu lạc bộ</h1>
          <p>Tra cứu và cập nhật hồ sơ gốc của câu lạc bộ.</p>
        </div>
        {list.data?.capabilities.canEdit && (
          <button type="button" className={css.primary} onClick={() => setCreating(true)}>
            <AdminIcon name="plus" /> Thêm câu lạc bộ
          </button>
        )}
      </div>
      <div className={css.filters}>
        <label className={css.search}>
          <span className={css.srOnly}>Tìm câu lạc bộ</span>
          <AdminIcon name="search" />
          <input
            value={searchDraft}
            placeholder="Tìm theo mã, tên hoặc tên viết tắt…"
            onChange={(event) => {
              setSearchDraft(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <AdminSelect
          label="Trạng thái câu lạc bộ"
          value={availability}
          options={availabilityOptions}
          onChange={(value) => {
            setAvailability(value);
            setPage(1);
          }}
        />
        <button
          type="button"
          className={css.refresh}
          aria-label="Làm mới danh sách câu lạc bộ"
          onClick={list.reload}
        >
          <AdminIcon name="refresh" />
        </button>
      </div>
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
                <th scope="col">Logo</th>
                <th scope="col">Mã CLB</th>
                <th scope="col">Tên câu lạc bộ</th>
                <th scope="col">Tên viết tắt</th>
                <th scope="col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((club, index) => (
                <tr key={club.id}>
                  <td>
                    {((list.meta?.page ?? page) - 1) * (list.meta?.pageSize ?? 20) + index + 1}
                  </td>
                  <td>
                    <ClubLogo name={club.name} logo={club.logo} small />
                  </td>
                  <td>{club.code}</td>
                  <td>{club.name}</td>
                  <td>{club.abbreviation}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setSelected(club)}
                      aria-label={`Chi tiết ${club.name}`}
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
        <ClubProfile
          club={selected}
          onClose={() => setSelected(undefined)}
          onChange={list.reload}
        />
      )}
      {creating && (
        <MasterForm
          master="clubs"
          onClose={() => setCreating(false)}
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

function ClubProfile({
  club,
  onClose,
  onChange,
}: {
  club: Club;
  onClose: () => void;
  onChange: () => void;
}) {
  const resource = useAdminList<ClubDetail>(`/clubs/${club.id}`);
  const [history, setHistory] = useState(false);
  const [form, setForm] = useState<ClubFormMode>();
  const detail = resource.data;
  return (
    <AdminDrawer
      title={detail?.name ?? club.name}
      subtitle="Hồ sơ câu lạc bộ"
      icon={<AdminIcon name="shield" />}
      onClose={onClose}
    >
      <ListFeedback loading={resource.loading} error={resource.error} onRetry={resource.reload} />
      {detail && (
        <div className={css.details}>
          <div className={clubCss.hero}>
            <ClubLogo name={detail.name} logo={detail.logo} />
            {!resource.loading && detail.capabilities.canEdit && (
              <ClubLogoActions
                clubId={detail.id}
                revision={detail.revision}
                logo={detail.logo}
                onChange={() => {
                  resource.reload();
                  onChange();
                }}
              />
            )}
          </div>
          <dl className={css.detailGrid}>
            <div>
              <dt>Mã CLB</dt>
              <dd>{detail.code}</dd>
            </div>
            <div>
              <dt>Tên viết tắt</dt>
              <dd>{detail.abbreviation}</dd>
            </div>
            <div className={clubCss.full}>
              <dt>Tên câu lạc bộ</dt>
              <dd>{detail.name}</dd>
            </div>
          </dl>
          <p>Trạng thái sử dụng: {detail.discontinuedAt ? 'Đã ngừng sử dụng' : 'Đang sử dụng'}</p>
          <div className={css.actions}>
            {detail.capabilities.canEdit && (
              <>
                <button type="button" className={css.primary} onClick={() => setForm({ detail })}>
                  Chỉnh sửa
                </button>
                <button type="button" onClick={() => setForm({ detail, correcting: true })}>
                  Hiệu chỉnh thông tin
                </button>
                {!resource.loading && (
                  <MasterAvailability
                    master="clubs"
                    id={detail.id}
                    revision={detail.revision}
                    discontinued={!!detail.discontinuedAt}
                    onChange={() => {
                      resource.reload();
                      onChange();
                    }}
                  />
                )}
              </>
            )}
            <button type="button" aria-expanded={history} onClick={() => setHistory(!history)}>
              Lịch sử
            </button>
          </div>
          {history && <MasterHistory master="clubs" id={detail.id} key={detail.revision} />}
          {form && (
            <MasterForm
              master="clubs"
              correcting={form.correcting}
              detail={form.detail}
              onClose={() => setForm(undefined)}
              onSaved={() => {
                setForm(undefined);
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
