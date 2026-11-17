import { parseDisplayDate } from '../../shared/date-format';
import { AdminSelect } from '../accounts/AdminSelect';
import formCss from './SeasonCreateForm.module.css';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { AdminDrawer } from '../accounts/AdminDrawer';
import { DateOnlyPicker, DateTimePicker } from '../../shared/DatePickers';
import { AdminIcon } from '../accounts/AdminIcon';
import { ListFeedback, Pagination, StateBadge } from '../accounts/AdminLists';
import { formatVietnamTime } from '../accounts/administration-model';
import { useAdminList } from '../accounts/use-admin-list';
import { HttpFailure } from '../../shared/http/client';
import { useSession } from '../../shared/http/use-session';
import shared from '../accounts/Administration.module.css';
import type {
  SeasonDetailRecord,
  SeasonHistory,
  SeasonHistoryItem,
  SeasonHistoryMeta,
} from './season-model';
import {
  formatSeasonDate,
  formatSeasonInstant,
  normalizeSeasonText,
  regulationSeasonScope,
} from './season-model';
import css from './SeasonsPage.module.css';

type EditableFields = Pick<
  SeasonDetailRecord,
  'name' | 'competitionName' | 'startDate' | 'endDate'
>;
type EditableField = keyof EditableFields;
type FieldErrors = Partial<Record<EditableField, string>>;
type EditBaseline = { revision: string; values: EditableFields };

const editableFields: readonly EditableField[] = [
  'name',
  'competitionName',
  'startDate',
  'endDate',
];
const fieldLabels: Record<EditableField, string> = {
  name: 'Tên mùa giải',
  competitionName: 'Tên giải đấu',
  startDate: 'Ngày bắt đầu',
  endDate: 'Ngày kết thúc',
};
const historyFieldLabels: Record<string, string> = {
  code: 'Mã mùa giải',
  name: 'Tên mùa giải',
  competitionName: 'Tên giải đấu',
  startDate: 'Ngày bắt đầu',
  endDate: 'Ngày kết thúc',
  state: 'Trạng thái',
};

function valuesFrom(season: SeasonDetailRecord): EditableFields {
  return {
    name: season.name,
    competitionName: season.competitionName,
    startDate: season.startDate,
    endDate: season.endDate,
  };
}

function editableValueLabel(field: EditableField, value: string): string {
  if (field === 'startDate' || field === 'endDate') return formatSeasonDate(value);
  return value || '—';
}

function validCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return (
    date.getUTCFullYear() === Number(match[1]) &&
    date.getUTCMonth() === Number(match[2]) - 1 &&
    date.getUTCDate() === Number(match[3])
  );
}

function validate(values: EditableFields): { normalized: EditableFields; errors: FieldErrors } {
  const normalized: EditableFields = {
    name: normalizeSeasonText(values.name),
    competitionName: normalizeSeasonText(values.competitionName),
    startDate: values.startDate,
    endDate: values.endDate,
  };
  const errors: FieldErrors = {};
  for (const field of ['name', 'competitionName'] as const) {
    const length = [...normalized[field]].length;
    if (length < 1) errors[field] = `${fieldLabels[field]} là thông tin bắt buộc.`;
    else if (length > 200) errors[field] = `${fieldLabels[field]} không được vượt quá 200 ký tự.`;
  }
  if (!validCalendarDate(normalized.startDate))
    errors.startDate = 'Ngày bắt đầu phải là ngày hợp lệ theo định dạng DD/MM/YYYY.';
  if (!validCalendarDate(normalized.endDate))
    errors.endDate = 'Ngày kết thúc phải là ngày hợp lệ theo định dạng DD/MM/YYYY.';
  if (!errors.startDate && !errors.endDate && normalized.startDate > normalized.endDate)
    errors.endDate = 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.';
  return { normalized, errors };
}

function asFieldName(value: string): value is EditableField {
  return editableFields.includes(value as EditableField);
}

function actionLabel(actionCode: string): string {
  if (actionCode === 'SEASON_CREATED') return 'Tạo mùa giải';
  if (actionCode === 'SEASON_UPDATED' || actionCode === 'SEASON_METADATA_UPDATED')
    return 'Cập nhật thông tin mùa giải';
  return actionCode;
}

/** Loads one authorized season and keeps metadata editing separate from lifecycle requests. */
export function SeasonDetail({
  seasonId,
  onClose,
  onUpdated,
}: {
  seasonId: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { client, session } = useSession();
  const detail = useAdminList<SeasonDetailRecord>(`/seasons/${encodeURIComponent(seasonId)}`);
  const season = detail.error ? undefined : detail.data;
  const [tab, setTab] = useState<'details' | 'history'>('details');
  const [editing, setEditing] = useState(false);
  const [editBaseline, setEditBaseline] = useState<EditBaseline | null>(null);
  const [draft, setDraft] = useState<EditableFields | null>(null);
  const values = draft ??
    editBaseline?.values ?? {
      name: '',
      competitionName: '',
      startDate: '',
      endDate: '',
    };
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [reloadRequired, setReloadRequired] = useState(false);
  const [conflictReloadRequested, setConflictReloadRequested] = useState(false);
  const attemptedValues = draft ? validate(draft).normalized : undefined;
  const attemptedFields =
    attemptedValues && editBaseline
      ? editableFields.filter((field) => attemptedValues[field] !== editBaseline.values[field])
      : [];
  const conflictReviewReady =
    reloadRequired && conflictReloadRequested && !detail.loading && !detail.error && !!season;

  function startEditing(currentSeason: SeasonDetailRecord) {
    if (detail.loading || reloadRequired) return;
    const initialValues = valuesFrom(currentSeason);
    setEditBaseline({ revision: currentSeason.revision, values: initialValues });
    setDraft(initialValues);
    setErrors({});
    setFailure(undefined);
    setSuccess(undefined);
    setEditing(true);
  }

  function cancelEditing() {
    const freshReviewData = conflictReloadRequested && !detail.loading && !detail.error && !!season;
    setDraft(null);
    setEditBaseline(null);
    setErrors({});
    setFailure(undefined);
    setEditing(false);
    if (freshReviewData) {
      setReloadRequired(false);
      setConflictReloadRequested(false);
      setSuccess('Nội dung đã nhập đã được bỏ. Dữ liệu hiện tại đã được tải lại.');
    }
  }

  function change(field: EditableField, value: string) {
    setDraft((current) => ({ ...(current ?? editBaseline?.values ?? values), [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFailure(undefined);
    setSuccess(undefined);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || detail.loading || reloadRequired || !editBaseline) return;
    const result = validate(values);
    setErrors(result.errors);
    if (Object.keys(result.errors).length) return;

    const body: Record<string, string> = { expectedRevision: editBaseline.revision };
    for (const field of editableFields) {
      if (result.normalized[field] !== editBaseline.values[field])
        body[field] = result.normalized[field];
    }
    if (Object.keys(body).length === 1) {
      setEditing(false);
      setDraft(null);
      setEditBaseline(null);
      setSuccess('Thông tin mùa giải không có thay đổi.');
      return;
    }

    setBusy(true);
    setFailure(undefined);
    setSuccess(undefined);
    try {
      await client.request<{ id: string; revision: string }>(
        `/seasons/${encodeURIComponent(seasonId)}`,
        { method: 'PATCH', body },
      );
      setEditing(false);
      setDraft(null);
      setEditBaseline(null);
      setErrors({});
      setSuccess('Đã cập nhật thông tin mùa giải.');
      detail.reload();
      onUpdated();
    } catch (error) {
      const problem = error instanceof Error ? error : new Error('Không thể cập nhật mùa giải.');
      const nextErrors: FieldErrors = {};
      if (error instanceof HttpFailure) {
        for (const fieldError of error.details ?? [])
          if (asFieldName(fieldError.field) && fieldError.message)
            nextErrors[fieldError.field] = fieldError.message;
        if (error.status === 409 || error.unknownOutcome) setReloadRequired(true);
        if (error.code === 'STATE_CONFLICT')
          setFailure('Trạng thái mùa giải đã thay đổi. Tải lại thông tin trước khi tiếp tục.');
        else setFailure(Object.keys(nextErrors).length ? undefined : problem.message);
      } else {
        setReloadRequired(true);
        setFailure(problem.message);
      }
      setErrors(nextErrors);
    } finally {
      setBusy(false);
    }
  }

  function reloadAfterConflict() {
    setEditing(false);
    setErrors({});
    setFailure(undefined);
    setSuccess(undefined);
    setConflictReloadRequested(true);
    detail.reload();
  }

  function resumeReviewedChanges() {
    if (
      !reloadRequired ||
      !conflictReloadRequested ||
      detail.loading ||
      detail.error ||
      !season ||
      season.state !== 'OPEN' ||
      !season.capabilities.canEditMetadata ||
      !draft ||
      !editBaseline ||
      !attemptedValues
    )
      return;

    const latestValues = valuesFrom(season);
    const rebasedValues = { ...latestValues };
    for (const field of attemptedFields) rebasedValues[field] = attemptedValues[field];
    setDraft(rebasedValues);
    setEditBaseline({ revision: season.revision, values: latestValues });
    setReloadRequired(false);
    setConflictReloadRequested(false);
    setErrors({});
    setFailure(undefined);
    setSuccess(undefined);
    setEditing(true);
  }

  function continueWithCurrentValues() {
    if (
      !reloadRequired ||
      !conflictReloadRequested ||
      detail.loading ||
      detail.error ||
      !season ||
      draft
    )
      return;
    setReloadRequired(false);
    setConflictReloadRequested(false);
    setSuccess('Nội dung đã nhập đã được bỏ. Dữ liệu hiện tại đã được tải lại.');
  }

  return (
    <AdminDrawer
      title={season ? `Chi tiết mùa giải: ${season.name}` : 'Chi tiết mùa giải'}
      subtitle="Thông tin và lịch sử trong phạm vi được phân công"
      icon={<AdminIcon name="season" />}
      onClose={onClose}
    >
      {!season ? (
        <>
          <ListFeedback loading={detail.loading} error={detail.error} onRetry={detail.reload} />
          {reloadRequired && draft && (
            <div className={shared.notice} role="status">
              Nội dung đã nhập vẫn được giữ lại. Hãy thử tải lại để so sánh hoặc chủ động bỏ nội
              dung đó.
              <button type="button" onClick={cancelEditing}>
                Bỏ nội dung đã nhập
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {detail.loading && (
            <p className={shared.notice} role="status">
              Đang tải lại thông tin mùa giải…
            </p>
          )}
          <div className={shared.tabs} role="tablist" aria-label="Thông tin mùa giải">
            <button
              type="button"
              id="season-details-tab"
              role="tab"
              aria-selected={tab === 'details'}
              aria-controls="season-details-panel"
              onClick={() => setTab('details')}
            >
              Chi tiết
            </button>
            <button
              type="button"
              id="season-history-tab"
              role="tab"
              aria-selected={tab === 'history'}
              aria-controls="season-history-panel"
              onClick={() => setTab('history')}
            >
              Lịch sử
            </button>
          </div>
          {tab === 'details' ? (
            <div
              id="season-details-panel"
              className={shared.details}
              role="tabpanel"
              aria-labelledby="season-details-tab"
            >
              <dl className={shared.detailGrid}>
                <div>
                  <dt>Mã mùa giải</dt>
                  <dd className={shared.code}>{season.code}</dd>
                </div>
                <div>
                  <dt>Trạng thái</dt>
                  <dd>
                    <StateBadge state={season.state} />
                  </dd>
                </div>
                <div className={shared.fullWidth}>
                  <dt>Tên mùa giải</dt>
                  <dd>{season.name}</dd>
                </div>
                <div className={shared.fullWidth}>
                  <dt>Tên giải đấu</dt>
                  <dd>{season.competitionName}</dd>
                </div>
                <div>
                  <dt>Ngày bắt đầu</dt>
                  <dd>{formatSeasonDate(season.startDate)}</dd>
                </div>
                <div>
                  <dt>Ngày kết thúc</dt>
                  <dd>{formatSeasonDate(season.endDate)}</dd>
                </div>
              </dl>

              <section className={css.regulationSummary} aria-label="Tình trạng quy định mùa giải">
                <h3>Tình trạng quy định mùa giải</h3>
                {!editing && regulationSeasonScope(session).has(season.id) && (
                  <Link to={`/workspace/seasons/${season.id}/regulations`}>
                    Xem quy định mùa giải
                  </Link>
                )}
                <dl>
                  <div>
                    <dt>Phiên bản đang có hiệu lực</dt>
                    <dd>
                      {season.effectiveRegulation
                        ? `Phiên bản ${season.effectiveRegulation.versionNumber} · từ ${formatSeasonInstant(season.effectiveRegulation.activeFrom)}`
                        : 'Chưa có quy định hiệu lực.'}
                    </dd>
                  </div>
                  <div>
                    <dt>Phiên bản chờ hiệu lực</dt>
                    <dd>
                      {season.waitingRegulation
                        ? `Phiên bản ${season.waitingRegulation.versionNumber} · ${formatSeasonInstant(season.waitingRegulation.proposedEffectiveAt)}`
                        : 'Không có phiên bản chờ hiệu lực.'}
                    </dd>
                  </div>
                </dl>
              </section>

              {season.state === 'CLOSED' && (
                <p className={shared.notice} role="status">
                  Mùa giải đã đóng. Tên mùa giải, tên giải đấu và ngày chỉ có thể chỉnh sửa sau khi
                  được mở lại bằng phê duyệt độc lập.
                </p>
              )}
              {success && (
                <p className={shared.success} role="status">
                  {success}
                </p>
              )}
              {reloadRequired && (
                <section className={css.conflictReview} aria-label="Rà soát thay đổi sau xung đột">
                  <h3>Rà soát thay đổi sau xung đột</h3>
                  {!conflictReloadRequested && (
                    <>
                      <p>
                        Dữ liệu đã thay đổi hoặc kết quả chưa xác định. Nội dung đã nhập được giữ
                        lại; tải dữ liệu mới để so sánh trước khi tiếp tục.
                      </p>
                      <div className={css.drawerActions}>
                        <button
                          type="button"
                          disabled={detail.loading}
                          onClick={reloadAfterConflict}
                        >
                          Tải lại và so sánh thay đổi
                        </button>
                      </div>
                    </>
                  )}
                  {conflictReloadRequested && detail.loading && draft && attemptedValues && (
                    <div className={css.conflictComparison}>
                      <p role="status">Đang tải dữ liệu mới; nội dung đã nhập được giữ lại.</p>
                      <dl>
                        {attemptedFields.map((field) => (
                          <div key={field}>
                            <dt>{fieldLabels[field]}</dt>
                            <dd>Đã nhập: {editableValueLabel(field, attemptedValues[field])}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                  {conflictReviewReady && draft && editBaseline && attemptedValues && (
                    <>
                      <p>
                        Đã nhập theo phiên bản {editBaseline.revision}; dữ liệu mới là phiên bản{' '}
                        {season.revision}. So sánh các trường bạn đã thay đổi trước khi tiếp tục.
                      </p>
                      <div
                        className={css.conflictComparison}
                        role="region"
                        aria-label="So sánh thay đổi đã nhập"
                      >
                        <dl>
                          {attemptedFields.map((field) => (
                            <div key={field}>
                              <dt>{fieldLabels[field]}</dt>
                              <dd>
                                <span>Hiện tại: {editableValueLabel(field, season[field])}</span>
                                <span>
                                  Đã nhập: {editableValueLabel(field, attemptedValues[field])}
                                </span>
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                      <div className={css.drawerActions}>
                        {season.state === 'OPEN' && season.capabilities.canEditMetadata ? (
                          <button type="button" onClick={resumeReviewedChanges}>
                            Tiếp tục với thay đổi đã xem xét
                          </button>
                        ) : (
                          <p className={shared.notice} role="status">
                            Mùa giải không còn cho phép sửa thông tin. Nội dung đã nhập chưa được áp
                            dụng.
                          </p>
                        )}
                        <button type="button" onClick={cancelEditing}>
                          Bỏ nội dung đã nhập
                        </button>
                      </div>
                    </>
                  )}
                  {conflictReviewReady && !draft && (
                    <>
                      <p>
                        Nội dung đã nhập đã được bỏ. Kiểm tra dữ liệu hiện tại trước khi tiếp tục.
                      </p>
                      <button type="button" onClick={continueWithCurrentValues}>
                        Tiếp tục bằng dữ liệu hiện tại
                      </button>
                    </>
                  )}
                </section>
              )}
              {!editing &&
                !reloadRequired &&
                season.capabilities.canEditMetadata &&
                season.state === 'OPEN' && (
                  <div className={css.drawerActions}>
                    <button
                      type="button"
                      disabled={detail.loading}
                      onClick={() => startEditing(season)}
                    >
                      Chỉnh sửa thông tin mùa giải
                    </button>
                  </div>
                )}
              {editing && (
                <form className={css.editForm} noValidate onSubmit={(event) => void save(event)}>
                  <h3>Chỉnh sửa thông tin mùa giải</h3>
                  <p className={shared.notice}>
                    Mã mùa giải không thể thay đổi. Nhập hoặc chọn ngày theo định dạng DD/MM/YYYY.
                  </p>
                  {(['name', 'competitionName'] as const).map((field) => (
                    <label className={formCss.field} key={field} htmlFor={`season-edit-${field}`}>
                      <span>{fieldLabels[field]} *</span>
                      <input
                        id={`season-edit-${field}`}
                        value={values[field]}
                        disabled={busy || reloadRequired || detail.loading}
                        aria-invalid={!!errors[field]}
                        aria-describedby={errors[field] ? `season-edit-${field}-error` : undefined}
                        onChange={(event) => change(field, event.target.value)}
                      />
                      {normalizeSeasonText(values[field]) && (
                        <span className={css.preview}>
                          Giá trị chuẩn hóa: {normalizeSeasonText(values[field])}
                        </span>
                      )}
                      {errors[field] && (
                        <span
                          className={css.fieldError}
                          id={`season-edit-${field}-error`}
                          role="alert"
                        >
                          {errors[field]}
                        </span>
                      )}
                    </label>
                  ))}
                  <div className={css.dateFields}>
                    {(['startDate', 'endDate'] as const).map((field) => (
                      <label key={field} htmlFor={`season-edit-${field}`}>
                        <span>{fieldLabels[field]} *</span>
                        <DateOnlyPicker
                          id={`season-edit-${field}`}
                          initialDate={values[field]}
                          required
                          disabled={busy || reloadRequired || detail.loading}
                          invalid={!!errors[field]}
                          describedBy={errors[field] ? `season-edit-${field}-error` : undefined}
                          onDateTextChange={(text) => change(field, parseDisplayDate(text))}
                        />
                        {errors[field] && (
                          <span
                            className={css.fieldError}
                            id={`season-edit-${field}-error`}
                            role="alert"
                          >
                            {errors[field]}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                  {failure && (
                    <p className={shared.error} role="alert">
                      {failure}
                    </p>
                  )}
                  <div className={css.drawerActions}>
                    <button type="button" disabled={busy} onClick={cancelEditing}>
                      {reloadRequired ? 'Bỏ nội dung đã nhập' : 'Hủy'}
                    </button>
                    <button
                      className={shared.primary}
                      type="submit"
                      disabled={busy || detail.loading || reloadRequired}
                    >
                      {busy ? 'Đang lưu…' : 'Lưu thông tin'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div
              id="season-history-panel"
              className={shared.details}
              role="tabpanel"
              aria-labelledby="season-history-tab"
            >
              <SeasonHistoryTab seasonId={season.id} />
            </div>
          )}
        </>
      )}
    </AdminDrawer>
  );
}

function SeasonHistoryTab({ seasonId }: { seasonId: string }) {
  const [page, setPage] = useState(1);
  const [draftFilters, setDraftFilters] = useState({
    actionCode: '',
    occurredFrom: '',
    occurredBefore: '',
  });
  const [filters, setFilters] = useState(draftFilters);
  const [filterError, setFilterError] = useState(false);
  const pageSize = 20;
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (filters.actionCode) query.set('actionCode', filters.actionCode);
  const occurredFrom = utcInstant(filters.occurredFrom);
  const occurredBefore = utcInstant(filters.occurredBefore);
  if (occurredFrom) query.set('occurredFrom', occurredFrom);
  if (occurredBefore) query.set('occurredBefore', occurredBefore);
  const history = useAdminList<SeasonHistory, SeasonHistoryMeta>(
    `/seasons/${encodeURIComponent(seasonId)}/history?${query.toString()}`,
  );
  const data = history.error ? undefined : history.data;
  const paginationData = data
    ? {
        items: data.items,
        ...(history.meta ?? { page, pageSize, total: data.items.length }),
      }
    : undefined;

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = [draftFilters.occurredFrom, draftFilters.occurredBefore].some(
      (value) => value !== '' && !utcInstant(value),
    );
    setFilterError(invalid);
    if (invalid) return;
    setFilters(draftFilters);
    setPage(1);
  }

  return (
    <>
      <form className={css.historyFilters} onSubmit={applyFilters}>
        <AdminSelect
          hideLabel={false}
          label="Loại thao tác"
          value={draftFilters.actionCode}
          onChange={(value) => setDraftFilters((current) => ({ ...current, actionCode: value }))}

          options={[
            { value: '', label: 'Tất cả thao tác' },
            { value: 'SEASON_CREATED', label: 'Tạo mùa giải' },
            { value: 'SEASON_UPDATED', label: 'Cập nhật mùa giải' },
          ]}
        />
        <label>
          <span>Từ thời điểm</span>
          <DateTimePicker
            label="Từ thời điểm"
            value={draftFilters.occurredFrom}
            onChange={(value) =>
              setDraftFilters((current) => ({ ...current, occurredFrom: value }))
            }
          />
        </label>
        <label>
          <span>Đến trước thời điểm</span>
          <DateTimePicker
            label="Đến trước thời điểm"
            value={draftFilters.occurredBefore}
            onChange={(value) =>
              setDraftFilters((current) => ({ ...current, occurredBefore: value }))
            }
          />
        </label>
        <button type="submit">Áp dụng bộ lọc</button>
        {filterError && (
          <p className={css.fieldError} role="alert">
            Nhập thời điểm hợp lệ theo dạng DD/MM/YYYY HH:mm.
          </p>
        )}
      </form>
      <ListFeedback
        loading={history.loading}
        error={history.error}
        empty={!!data && data.items.length === 0}
        onRetry={history.reload}
      />
      {!!data?.items.length && (
        <div className={css.historyList}>
          {data.items.map((item) => (
            <HistoryItem key={item.id} item={item} />
          ))}
        </div>
      )}
      {paginationData && paginationData.total > paginationData.pageSize && (
        <Pagination data={paginationData} change={setPage} />
      )}
    </>
  );
}

function HistoryItem({ item }: { item: SeasonHistoryItem }) {
  const actor = item.actorName ?? item.operatorIdentity ?? 'Tài khoản được phân quyền';
  const before = historyEntries(item.before);
  const after = historyEntries(item.after);
  return (
    <article className={css.historyItem}>
      <div className={css.historyHeading}>
        <strong>{actionLabel(item.actionCode)}</strong>
        <time dateTime={item.occurredAt}>{formatVietnamTime(item.occurredAt)}</time>
      </div>
      <p className={css.historyMeta}>
        {actor} · {item.outcome === 'SUCCESS' ? 'Thành công' : 'Không thành công'}
      </p>
      {item.reason && <p className={css.historyReason}>Lý do: {item.reason}</p>}
      {(before.length > 0 || after.length > 0) && (
        <div className={css.historyChanges}>
          <HistorySnapshot title="Trước thay đổi" values={before} />
          <HistorySnapshot title="Sau thay đổi" values={after} />
        </div>
      )}
      {!before.length && !after.length && (
        <p className={css.historyMeta}>Không có nội dung thay đổi được phép hiển thị.</p>
      )}
    </article>
  );
}

function historyEntries(value: Record<string, unknown> | null) {
  return Object.entries(value ?? {}).filter(([key]) => key in historyFieldLabels);
}

function utcInstant(value: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(value)) return undefined;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? new Date(time).toISOString() : undefined;
}

function HistorySnapshot({ title, values }: { title: string; values: [string, unknown][] }) {
  return (
    <section>
      <h4>{title}</h4>
      {values.length ? (
        <dl>
          {values.map(([key, value]) => (
            <div key={key}>
              <dt>{historyFieldLabels[key]}</dt>
              <dd>{historyValue(key, value)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className={css.historyMeta}>Không có dữ liệu được ghi nhận.</p>
      )}
    </section>
  );
}

function historyValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (field === 'startDate' || field === 'endDate') return formatSeasonDate(String(value));
  if (field === 'state')
    return value === 'OPEN' ? 'Đang mở' : value === 'CLOSED' ? 'Đã đóng' : String(value);
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  return 'Không có dữ liệu được phép hiển thị.';
}
