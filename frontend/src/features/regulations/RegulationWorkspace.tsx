import { AdminSelect } from '../accounts/AdminSelect';
import shared from '../accounts/Administration.module.css';
import { WorkspaceDialog as Modal } from '../accounts/WorkspaceDialog';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useSession } from '../../shared/http/use-session';
import { RegulationVersionsPage } from './RegulationVersionsPage';
import css from './RegulationVersionsPage.module.css';

type Season = { id: string; code: string; name: string; state: 'OPEN' | 'CLOSED' };
const seasonPath = (id: string) => `/workspace/seasons/${encodeURIComponent(id)}/regulations`;
const stateLabel = (state: Season['state']) => (state === 'OPEN' ? 'Đang mở' : 'Đã đóng');

export function RegulationWorkspace() {
  const { seasonId } = useParams();
  return <Workspace key={seasonId ?? 'list'} seasonId={seasonId} />;
}

function Workspace({ seasonId }: { seasonId?: string }) {
  const { client, epoch } = useSession();
  const navigate = useNavigate();
  const [result, setResult] = useState<{ items?: Season[]; error?: string }>();
  const [attempt, setAttempt] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [pendingPath, setPendingPath] = useState<string>();

  useEffect(() => {
    let active = true;
    void client
      .request<{ items: Season[] }>('/regulation-seasons')
      .then(({ data }) => {
        if (active) setResult({ items: data.items });
      })
      .catch((error: unknown) => {
        if (active)
          setResult({ error: error instanceof Error ? error.message : 'Không thể tải mùa giải.' });
      });
    return () => {
      active = false;
    };
  }, [attempt, client, epoch]);

  const items = result?.items ?? [];
  const selected = items.find((season) => season.id === seasonId);
  function changeSeason(id: string) {
    const path = id ? seasonPath(id) : '/workspace/seasons/regulations';
    if (dirty) setPendingPath(path);
    else void navigate(path);
  }

  return (
    <section className={css.page} aria-label="Quản lý quy định mùa giải">
      <header className={css.pageHeader}>
        <div>
          <h1 className={shared.pageTitle}>Quản lý quy định mùa giải</h1>
          <p>Thiết lập, xét duyệt và theo dõi các phiên bản quy định áp dụng cho từng mùa giải.</p>
        </div>
        <div className={css.seasonPicker}>
          <span className={css.seasonPickerLabel} aria-hidden="true">
            Mùa giải
          </span>
          <AdminSelect
            label="Mùa giải"
            className={css.seasonControl}
            value={selected?.id ?? ''}
            onChange={(value) => changeSeason(value)}

            options={[
              { value: '', label: 'Chọn mùa giải' },
              ...items.map((season) => ({
                value: season.id,
                label: season.name,
              })),
            ]}
          />
          {selected && (
            <span
              className={`${css.seasonState} ${selected.state === 'OPEN' ? css.open : css.closed}`}
            >
              {stateLabel(selected.state)}
            </span>
          )}
        </div>
      </header>

      {result?.error && (
        <div className={css.toolbar}>
          <p role="alert">{result.error}</p>
          <button
            type="button"
            onClick={() => {
              setResult(undefined);
              setAttempt((value) => value + 1);
            }}
          >
            Tải lại danh sách mùa giải
          </button>
        </div>
      )}
      {seasonId ? (
        <RegulationVersionsPage season={selected} onDirtyChange={setDirty} />
      ) : !result ? (
        <p role="status">Đang tải danh sách mùa giải…</p>
      ) : result.items?.length ? (
        <ul className={css.seasonChoices} aria-label="Danh sách mùa giải">
          {items.map((season) => (
            <li key={season.id}>
              <Link to={seasonPath(season.id)}>
                <strong>{season.name}</strong>
                <span>{season.code}</span>
              </Link>
              <span
                className={`${css.seasonState} ${season.state === 'OPEN' ? css.open : css.closed}`}
              >
                {stateLabel(season.state)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        !result.error && <p>Bạn chưa có mùa giải nào để xem quy định.</p>
      )}
      <Modal
        open={!!pendingPath}
        title="Bỏ thay đổi chưa lưu?"
        okText="Bỏ thay đổi và chuyển mùa giải"
        cancelText="Tiếp tục chỉnh sửa"
        onCancel={() => setPendingPath(undefined)}
        onOk={() => {
          if (pendingPath) void navigate(pendingPath);
        }}
      >
        <p>Các thay đổi chưa lưu trong bản nháp sẽ bị bỏ khi chuyển mùa giải.</p>
      </Modal>
    </section>
  );
}
