import { Modal } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useParams } from 'react-router';
import { HttpFailure } from '../../shared/http/client';
import { useSession } from '../../shared/http/use-session';
import { formatSeasonInstant } from '../seasons/season-model';
import { ListFeedback } from '../accounts/AdminLists';
import { useAdminList } from '../accounts/use-admin-list';
import { RegulationDraftForm } from './RegulationDraftForm';
import {
  regulationStateLabels,
  type RegulationState,
  type RegulationContent,
  type RegulationOverviewSummary,
  type RegulationPageMeta,
  type RegulationVersionDetail,
  type RegulationVersionHistory,
  type RegulationVersionHistoryItem,
  type RegulationVersionSummary,
  type RegulationVersionsData,
} from './regulation-model';
import css from './RegulationVersionsPage.module.css';
import { RegulationActionPreview, RegulationReadView, RegulationReview } from './RegulationReview';
import { RegulationChangeReview } from './RegulationChangeReview';
import { useRegulationReviewContent } from './use-regulation-review-content';

type RegulationAction = 'submit' | 'withdraw' | 'return' | 'reject' | 'approve';

const actionLabels: Record<RegulationAction, string> = {
  submit: 'Gửi thẩm định',
  withdraw: 'Rút phiên bản',
  return: 'Trả lại để bổ sung',
  reject: 'Từ chối phiên bản',
  approve: 'Phê duyệt phiên bản',
};

type RegulationActionReview = {
  dialogKey: number;
  requestKey?: string;
  action: RegulationAction;
  versionId: string;
  versionNumber: number;
  revision: string;
  state: RegulationState;
  content: RegulationContent;
  seasonId: string;
  seasonCode: string;
  seasonName: string;
  sessionEpoch: number;
  accountId: string | null;
  currentBasis: RegulationOverviewSummary | null;
};

type ActionConflictReview =
  | { status: 'required' | 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      latest: RegulationVersionDetail;
      currentBasis: RegulationOverviewSummary | null;
    };

const actionFieldLabels: Record<string, string> = {
  input: 'Nội dung quy định',
  effectiveMode: 'Chế độ hiệu lực',
  proposedEffectiveAt: 'Thời điểm đề xuất hiệu lực',
  squadLimit: 'Giới hạn đội hình',
  nonHomegrownLimit: 'Giới hạn cầu thủ không thuộc diện đào tạo',
  homegrownSeasons: 'Số mùa đào tạo',
  homegrownMonths: 'Số tháng đào tạo',
  homegrownAgeStart: 'Tuổi bắt đầu đào tạo',
  homegrownAgeEnd: 'Tuổi kết thúc đào tạo',
  u21Cutoff: 'Ngày sinh giới hạn U21',
  clubCount: 'Số câu lạc bộ',
  formatCode: 'Thể thức',
  legs: 'Số lượt thi đấu',
  plannedMinutes: 'Thời lượng thi đấu dự kiến',
  preparationMinutes: 'Thời gian chuẩn bị',
  releaseMinutes: 'Thời gian nghỉ sau trận',
  winPoints: 'Điểm thắng',
  drawPoints: 'Điểm hòa',
  lossPoints: 'Điểm thua',
  qualificationCount: 'Số suất tham dự (Q)',
  relegationCount: 'Số suất xuống hạng (R)',
  registrationWindows: 'Các đợt tiếp nhận',
  rankingPriority: 'Thứ tự xếp hạng',
  goalTypes: 'Danh mục loại bàn thắng',
  cardTypes: 'Danh mục loại thẻ',
};

function normalizeActionReason(value: string): string {
  return value.normalize('NFC').trim().replace(/\r\n?/g, '\n');
}

function actionFieldLabel(field: string): string {
  const base = /^([A-Za-z]+)/.exec(field)?.[1] ?? 'input';
  const nested =
    /\.(intakeKind|opensAt|closesAt|position|criterionCode|code|name|isOwnGoal|enabled|meaning)$/.exec(
      field,
    )?.[1];
  const nestedLabels: Record<string, string> = {
    intakeKind: 'nhóm tiếp nhận',
    opensAt: 'thời điểm mở',
    closesAt: 'thời điểm đóng',
    position: 'vị trí',
    criterionCode: 'tiêu chí',
    code: 'mã',
    name: 'tên',
    isOwnGoal: 'phân loại bàn phản lưới',
    enabled: 'trạng thái cho phép chọn',
    meaning: 'ý nghĩa thẻ',
  };
  const label = actionFieldLabels[base] ?? 'Dữ liệu quy định';
  return nested ? `${label} · ${nestedLabels[nested]}` : label;
}

function defaultSelection(items: readonly RegulationVersionSummary[]): string | undefined {
  return (
    items.find((item) => item.isCurrentDraft)?.id ??
    items.find((item) => item.isCurrentEffective)?.id ??
    items[0]?.id
  );
}

export function RegulationVersionsPage({
  season,
  onDirtyChange,
}: {
  season?: { code: string; name: string };
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { seasonId } = useParams();
  const { client, session, epoch } = useSession();
  const [attempt, setAttempt] = useState(0);
  const [tab, setTab] = useState<'current' | 'versions'>();
  const [createError, setCreateError] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionUnknown, setActionUnknown] = useState(false);
  const [basisReviewed, setBasisReviewed] = useState(false);
  const [actionReview, setActionReview] = useState<RegulationActionReview | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionError, setActionError] = useState<string>();
  const [actionFieldErrors, setActionFieldErrors] = useState<{ field: string; message: string }[]>(
    [],
  );
  const [actionConflict, setActionConflict] = useState<ActionConflictReview | null>(null);
  const actionDialogSequence = useRef(0);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [versionsPage, setVersionsPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string>();
  const [detailResult, setDetailResult] = useState<{
    key: string;
    data?: RegulationVersionDetail;
    error?: string;
  }>();
  const [detailAttempt, setDetailAttempt] = useState(0);
  const [notice, setNotice] = useState<string>();
  const [formDirty, setFormDirty] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<string>();

  const listPath = useMemo(
    () =>
      `/seasons/${encodeURIComponent(seasonId ?? '')}/regulation-versions?page=${versionsPage}&pageSize=20&sort=versionNumber:desc`,
    [seasonId, versionsPage],
  );
  const list = useSeasonVersions(listPath, attempt);
  const effectiveSelectedId = useMemo(() => {
    if (!list.data) return selectedId;
    if (selectedId && list.data.items.some((item) => item.id === selectedId)) return selectedId;
    return defaultSelection(list.data.items);
  }, [list.data, selectedId]);
  const detailRequestKey = `${effectiveSelectedId ?? ''}:${detailAttempt}`;
  const matchingDetail = detailResult?.key === detailRequestKey ? detailResult : undefined;
  const detail = matchingDetail?.data;
  const detailError = matchingDetail?.error;
  const detailLoading = !!effectiveSelectedId && !matchingDetail;
  const currentEffective = list.data?.overview.currentEffective;
  const activeTab = tab ?? (!currentEffective && list.data?.items.length ? 'versions' : 'current');
  const currentRead = useRegulationReviewContent(
    activeTab === 'current' && detail?.id !== currentEffective?.id
      ? currentEffective?.id
      : undefined,
  );
  const currentContent =
    detail?.id === currentEffective?.id ? detail?.content : currentRead?.detail?.content;

  const dismissAction = useCallback(() => {
    actionDialogSequence.current += 1;
    setActionReview(null);
    setActionReason('');
    setActionError(undefined);
    setActionFieldErrors([]);
    setActionConflict(null);
    setActionUnknown(false);
  }, []);

  const onFormDirtyChange = useCallback(
    (dirty: boolean) => {
      setFormDirty(dirty);
      onDirtyChange(dirty);
    },
    [onDirtyChange],
  );

  function requestSelection(versionId: string) {
    if (actionUnknown) return;
    if (versionId === effectiveSelectedId) return;
    if (actionReview && versionId !== actionReview.versionId) dismissAction();
    if (formDirty) setPendingSelection(versionId);
    else setSelectedId(versionId);
  }

  function leaveDraftAndSelect() {
    if (pendingSelection) setSelectedId(pendingSelection);
    setPendingSelection(undefined);
    setFormDirty(false);
  }

  useEffect(() => {
    if (!effectiveSelectedId) return;
    let active = true;
    void client
      .request<RegulationVersionDetail>(
        `/regulation-versions/${encodeURIComponent(effectiveSelectedId)}`,
      )
      .then(({ data }) => {
        if (active) setDetailResult({ key: detailRequestKey, data });
      })
      .catch((error: unknown) => {
        if (active)
          setDetailResult({
            key: detailRequestKey,
            error: error instanceof Error ? error.message : 'Không thể tải phiên bản quy định.',
          });
      });
    return () => {
      active = false;
    };
  }, [client, effectiveSelectedId, detailAttempt, detailRequestKey]);

  async function createDraft() {
    if (!seasonId || creating) return;
    setCreating(true);
    setCreateError(undefined);
    setNotice(undefined);
    try {
      const { data } = await client.request<{ id: string; revision: string }>(
        `/seasons/${encodeURIComponent(seasonId)}/regulation-versions`,
        { method: 'POST', body: {} },
      );
      setVersionsPage(1);
      setSelectedId(data.id);
      setAttempt((value) => value + 1);
      setNotice('Đã tạo bản nháp trống. Hãy nhập nội dung cần thiết rồi lưu bản nháp.');
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Không thể tạo bản nháp.');
      if (error instanceof HttpFailure && error.status === 409) setAttempt((value) => value + 1);
    } finally {
      setCreating(false);
    }
  }

  async function createSuccessor(predecessor: RegulationVersionDetail) {
    if (!seasonId || creating) return;
    setCreating(true);
    setCreateError(undefined);
    setNotice(undefined);
    try {
      const { data } = await client.request<{ id: string; revision: string }>(
        `/seasons/${encodeURIComponent(seasonId)}/regulation-versions`,
        { method: 'POST', body: { predecessorVersionId: predecessor.id } },
      );
      setVersionsPage(1);
      setSelectedId(data.id);
      setAttempt((value) => value + 1);
      setDetailAttempt((value) => value + 1);
      setHistoryRefresh((value) => value + 1);
      setNotice(
        `Đã tạo phiên bản kế tiếp từ Phiên bản ${predecessor.versionNumber}. Nội dung phiên bản trước được giữ nguyên.`,
      );
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Không thể tạo phiên bản kế tiếp.');
    } finally {
      setCreating(false);
    }
  }

  const cutoff = list.data?.overview.waiting?.proposedEffectiveAt;
  useEffect(() => {
    if (!cutoff) return;
    const remaining = Date.parse(cutoff) - Date.now();
    if (!Number.isFinite(remaining)) return;
    const timer = window.setTimeout(
      () => {
        setAttempt((value) => value + 1);
        setDetailAttempt((value) => value + 1);
      },
      Math.min(Math.max(remaining, 1000), 2_147_483_647),
    );
    return () => window.clearTimeout(timer);
  }, [cutoff, attempt]);

  if (!seasonId)
    return (
      <section className={css.page}>
        <h1>Quản lý quy định mùa giải</h1>
        <p role="alert">Thiếu mã mùa giải trong đường dẫn.</p>
      </section>
    );

  const versions = list.data?.items ?? [];
  const waiting = list.data?.overview.waiting;
  const selectedSummary = versions.find((item) => item.id === effectiveSelectedId);
  const canCreateDraft = !!list.data?.capabilities.canCreateDraft;
  const visibleDetail = !list.error && detail?.id === effectiveSelectedId ? detail : undefined;

  function openAction(action: RegulationAction) {
    if (!visibleDetail || actionBusy) return;
    setActionReview({
      dialogKey: ++actionDialogSequence.current,
      requestKey: action === 'approve' ? crypto.randomUUID() : undefined,
      action,
      versionId: visibleDetail.id,
      versionNumber: visibleDetail.versionNumber,
      revision: visibleDetail.revision,
      state: visibleDetail.state,
      content: structuredClone(visibleDetail.content),
      seasonId: seasonId ?? '',
      seasonCode: season?.code ?? seasonId ?? '',
      seasonName: season?.name ?? '',
      sessionEpoch: epoch,
      accountId: session?.account.id ?? null,
      currentBasis: currentEffective ?? null,
    });
    setBasisReviewed(!currentEffective);
    setActionReason('');
    setActionError(undefined);
    setActionFieldErrors([]);
    setActionConflict(null);
  }

  async function confirmAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !actionReview ||
      actionBusy ||
      actionConflict ||
      (actionReview.action === 'approve' && !basisReviewed)
    )
      return;
    const normalizedReason = normalizeActionReason(actionReason);
    if (!normalizedReason) {
      setActionError('Nhập lý do trước khi xác nhận thao tác.');
      return;
    }
    if (Array.from(normalizedReason).length > 2000) {
      setActionError('Lý do không được vượt quá 2.000 ký tự.');
      return;
    }

    const review = actionReview;
    setActionBusy(true);
    setActionError(undefined);
    setActionFieldErrors([]);
    setActionReason(normalizedReason);
    const body =
      review.action === 'return' || review.action === 'reject' || review.action === 'approve'
        ? {
            expectedRevision: review.revision,
            submittedVersionId: review.versionId,
            reason: normalizedReason,
            ...(review.action === 'approve'
              ? { expectedCurrentVersionId: review.currentBasis?.id ?? null }
              : {}),
          }
        : { expectedRevision: review.revision, reason: normalizedReason };
    try {
      await client.request(
        `/regulation-versions/${encodeURIComponent(review.versionId)}/${review.action}`,
        { method: 'POST', body, requestKey: review.requestKey },
      );
      if (actionDialogSequence.current !== review.dialogKey) return;
      dismissAction();
      setNotice(`Đã ${actionSuccessPhrase(review.action)} Phiên bản ${review.versionNumber}.`);
      setSelectedId(review.versionId);
      setAttempt((value) => value + 1);
      setDetailAttempt((value) => value + 1);
      setHistoryRefresh((value) => value + 1);
    } catch (error) {
      if (actionDialogSequence.current !== review.dialogKey) return;
      const uncertain =
        review.action === 'approve' && error instanceof HttpFailure && error.unknownOutcome;
      setActionUnknown(uncertain);
      if (uncertain) {
        setActionError('Chưa rõ kết quả phê duyệt. Gửi lại đúng nội dung đã xác nhận để kiểm tra.');
      } else if (error instanceof HttpFailure && error.status === 409) {
        setActionConflict({ status: 'required' });
        setActionFieldErrors([]);
        setActionError(error.message);
      } else if (error instanceof HttpFailure && error.details?.length) {
        setActionFieldErrors(
          error.details.map((detail) => ({
            field: actionFieldLabel(detail.field),
            message: detail.message ?? 'Vui lòng kiểm tra dữ liệu.',
          })),
        );
        setActionError(error.message);
      } else {
        setActionError(error instanceof Error ? error.message : 'Không thể hoàn tất thao tác.');
      }
    } finally {
      setActionBusy(false);
    }
  }

  async function refreshActionConflict() {
    const review = actionReview;
    if (!review || actionBusy || actionConflict?.status === 'loading') return;
    const dialogKey = review.dialogKey;
    setActionConflict({ status: 'loading' });
    try {
      const [{ data: latest }, basis] = await Promise.all([
        client.request<RegulationVersionDetail>(
          `/regulation-versions/${encodeURIComponent(review.versionId)}`,
        ),
        review.action === 'approve' ? client.request<RegulationVersionsData>(listPath) : null,
      ]);
      if (actionDialogSequence.current !== dialogKey || latest.id !== review.versionId) return;
      setActionConflict({
        status: 'ready',
        latest,
        currentBasis: basis?.data.overview.currentEffective ?? null,
      });
    } catch (error) {
      if (actionDialogSequence.current !== dialogKey) return;
      setActionConflict({
        status: 'error',
        message: error instanceof Error ? error.message : 'Không thể tải phiên bản mới nhất.',
      });
    }
  }

  function adoptRefreshedActionVersion() {
    if (!actionReview || actionConflict?.status !== 'ready') return;
    if (!canRunAction(actionConflict.latest, actionReview.action)) return;
    const latest = actionConflict.latest;
    const currentBasis = actionConflict.currentBasis;
    setBasisReviewed(!currentBasis);
    setActionReview((current) =>
      current?.dialogKey === actionReview.dialogKey
        ? {
            ...current,
            requestKey: current.action === 'approve' ? crypto.randomUUID() : undefined,
            versionNumber: latest.versionNumber,
            revision: latest.revision,
            state: latest.state,
            content: structuredClone(latest.content),
            currentBasis,
          }
        : current,
    );
    setActionConflict(null);
    setActionError(undefined);
    setActionFieldErrors([]);
  }

  return (
    <div className={css.workspaceBody}>
      <div
        className={css.ruleTabs}
        role="tablist"
        aria-label="Nội dung quy định"
        onKeyDown={(event) => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const next =
            event.key === 'Home'
              ? 'current'
              : event.key === 'End'
                ? 'versions'
                : activeTab === 'current'
                  ? 'versions'
                  : 'current';
          setTab(next);
          event.currentTarget.querySelector<HTMLButtonElement>(`#regulation-tab-${next}`)?.focus();
        }}
      >
        <button
          type="button"
          role="tab"
          id="regulation-tab-current"
          aria-controls="regulation-panel-current"
          aria-selected={activeTab === 'current'}
          tabIndex={activeTab === 'current' ? 0 : -1}
          onClick={() => setTab('current')}
        >
          Quy định hiện hành
        </button>
        <button
          type="button"
          role="tab"
          id="regulation-tab-versions"
          aria-controls="regulation-panel-versions"
          aria-selected={activeTab === 'versions'}
          tabIndex={activeTab === 'versions' ? 0 : -1}
          onClick={() => setTab('versions')}
        >
          Phiên bản và phê duyệt
        </button>
      </div>
      {notice && (
        <p className={css.formSuccess} role="status">
          {notice}
        </p>
      )}
      {createError && (
        <p className={css.formError} role="alert">
          {createError}
        </p>
      )}

      <div
        id="regulation-panel-current"
        role="tabpanel"
        aria-labelledby="regulation-tab-current"
        hidden={activeTab !== 'current'}
      >
        <section className={css.currentPane} aria-label="Quy định đang hiệu lực">
          <div className={css.effectiveBanner}>
            <div>
              <span>Mã phiên bản áp dụng</span>
              <strong>
                {currentEffective ? `Phiên bản ${currentEffective.versionNumber}` : '—'}
              </strong>
            </div>
            <div>
              <span>Ngày bắt đầu hiệu lực</span>
              <strong>
                {currentEffective ? formatSeasonInstant(currentEffective.activeFrom) : '—'}
              </strong>
            </div>
            <div>
              <span>Trạng thái</span>
              <strong className={currentEffective ? `${css.seasonState} ${css.open}` : undefined}>
                {currentEffective
                  ? 'Đang có hiệu lực'
                  : list.loading
                    ? 'Đang tải…'
                    : list.error
                      ? 'Chưa xác định được quy định hiệu lực'
                      : 'Chưa có quy định hiệu lực'}
              </strong>
            </div>
            {canCreateDraft && !visibleDetail?.capabilities.canCreateSuccessor && (
              <button
                className={css.primary}
                type="button"
                disabled={creating}
                onClick={() => {
                  setTab('versions');
                  void createDraft();
                }}
              >
                {creating
                  ? 'Đang tạo…'
                  : currentEffective
                    ? 'Tạo đề xuất thay đổi'
                    : 'Tạo bản nháp quy định'}
              </button>
            )}
          </div>
          {list.error && (
            <ListFeedback
              loading={list.loading}
              error={list.error}
              onRetry={() => setAttempt((value) => value + 1)}
            />
          )}
          {currentEffective &&
            (currentContent ? (
              <>
                <h2 className={css.officialHeading}>5 nhóm quy định kỹ thuật chính thức</h2>
                <RegulationReadView content={currentContent} summary />
              </>
            ) : currentRead?.error ? (
              <p role="alert">{currentRead.error}</p>
            ) : (
              <p role="status">Đang tải nội dung đang áp dụng…</p>
            ))}
        </section>
      </div>

      <div
        id="regulation-panel-versions"
        role="tabpanel"
        aria-labelledby="regulation-tab-versions"
        hidden={activeTab !== 'versions'}
      >
        <div className={css.versionsToolbar}>
          <div>
            <strong>{list.meta ? `${list.meta.total} phiên bản` : 'Danh sách phiên bản'}</strong>
            <small>
              {waiting
                ? `Phiên bản ${waiting.versionNumber} chờ hiệu lực từ ${formatSeasonInstant(waiting.proposedEffectiveAt)}`
                : 'Chưa có phiên bản chờ'}
            </small>
          </div>
          {canCreateDraft && !visibleDetail?.capabilities.canCreateSuccessor && (
            <button
              className={css.primary}
              type="button"
              disabled={creating}
              onClick={() => void createDraft()}
            >
              {creating ? 'Đang tạo…' : 'Tạo bản nháp quy định'}
            </button>
          )}
        </div>
        {seasonId && list.data?.capabilities.canManageChanges !== undefined && (
          <RegulationChangeReview
            key={`${seasonId}:${epoch}`}
            seasonId={seasonId}
            waitingId={waiting?.id}
            canManage={list.data.capabilities.canManageChanges}
            versions={list.data.items}
            onChanged={() => {
              setAttempt((value) => value + 1);
              setDetailAttempt((value) => value + 1);
              setHistoryRefresh((value) => value + 1);
            }}
          />
        )}

        <div className={css.contentGrid}>
          <aside className={css.versionPanel} aria-label="Danh sách phiên bản">
            <div className={css.panelHeading}>
              <div>
                <h2>Phiên bản</h2>
                <p>Trạng thái phản ánh dữ liệu đã lưu.</p>
              </div>
              <button
                type="button"
                aria-label="Làm mới danh sách phiên bản"
                onClick={() => setAttempt((value) => value + 1)}
              >
                Làm mới
              </button>
            </div>
            <ListFeedback
              loading={list.loading}
              error={list.error}
              empty={!!list.data && versions.length === 0}
              onRetry={() => setAttempt((value) => value + 1)}
            />
            {versions.length > 0 && (
              <div className={css.versionList}>
                {versions.map((version) => (
                  <button
                    type="button"
                    key={version.id}
                    className={`${css.versionItem} ${effectiveSelectedId === version.id ? css.selectedVersion : ''}`}
                    aria-current={effectiveSelectedId === version.id ? 'true' : undefined}
                    onClick={() => {
                      setNotice(undefined);
                      requestSelection(version.id);
                    }}
                  >
                    <span className={css.versionTitle}>Phiên bản {version.versionNumber}</span>
                    <span className={`${css.stateBadge} ${stateClass(version.state)}`}>
                      {regulationStateLabels[version.state]}
                    </span>
                    <span className={css.versionMeta}>
                      {version.preparedBy.fullName} ·{' '}
                      {version.effectiveMode === 'SCHEDULED'
                        ? 'Có lịch hiệu lực'
                        : version.effectiveMode === 'IMMEDIATE'
                          ? 'Đề xuất hiệu lực ngay'
                          : 'Chưa chọn cách hiệu lực'}
                    </span>
                    {version.isCurrentEffective && (
                      <span className={css.pointerBadge}>Đang hiệu lực</span>
                    )}
                    {version.isCurrentDraft && (
                      <span className={css.pointerBadge}>Bản nháp hiện tại</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {list.meta && (
              <p className={css.listMeta}>
                Hiển thị {versions.length} trong {list.meta.total} phiên bản · Trang{' '}
                {list.meta.page}.
              </p>
            )}
            {list.meta && list.meta.total > list.meta.pageSize && (
              <div className={css.versionPagination} aria-label="Phân trang phiên bản">
                <button
                  type="button"
                  disabled={list.loading || formDirty || list.meta.page <= 1}
                  onClick={() => setVersionsPage((page) => Math.max(1, page - 1))}
                >
                  Phiên bản mới hơn
                </button>
                <span>
                  Trang {list.meta.page} / {Math.ceil(list.meta.total / list.meta.pageSize)}
                </span>
                <button
                  type="button"
                  disabled={
                    list.loading ||
                    formDirty ||
                    list.meta.page * list.meta.pageSize >= list.meta.total
                  }
                  onClick={() => setVersionsPage((page) => page + 1)}
                >
                  Phiên bản cũ hơn
                </button>
                {formDirty && <small>Lưu hoặc bỏ thay đổi trước khi chuyển trang.</small>}
              </div>
            )}
            {!canCreateDraft && !versions.some((item) => item.isCurrentDraft) && (
              <p className={css.scopeNote}>Không có quyền tạo bản nháp ở trạng thái hiện tại.</p>
            )}
          </aside>

          <section className={css.detailPanel} aria-label="Chi tiết phiên bản quy định">
            {!effectiveSelectedId ? (
              <EmptyRegulationDetail
                canCreateDraft={canCreateDraft}
                onCreate={() => void createDraft()}
              />
            ) : detailLoading && !visibleDetail ? (
              <p role="status" className={css.loading}>
                Đang tải phiên bản…
              </p>
            ) : detailError ? (
              <div className={css.errorPanel}>
                <p role="alert">{detailError}</p>
                <button type="button" onClick={() => setDetailAttempt((value) => value + 1)}>
                  Thử tải lại
                </button>
              </div>
            ) : visibleDetail ? (
              <>
                <div className={css.detailHeading}>
                  <div>
                    <p className={css.eyebrow}>
                      {selectedSummary?.isCurrentEffective
                        ? 'ĐANG HIỆU LỰC'
                        : visibleDetail.capabilities.canEditDraft
                          ? 'BẢN NHÁP CÓ THỂ SỬA'
                          : 'CHI TIẾT PHIÊN BẢN'}
                    </p>
                    <h2>Phiên bản {visibleDetail.versionNumber}</h2>
                    <p>
                      {regulationStateLabels[visibleDetail.state]} · Chuẩn bị bởi{' '}
                      {visibleDetail.preparedBy.fullName}
                    </p>
                  </div>
                  <div className={css.dateMetadata}>
                    {visibleDetail.approvedAt && (
                      <span>
                        <small>Thời điểm phê duyệt</small>
                        <strong>{formatSeasonInstant(visibleDetail.approvedAt)}</strong>
                      </span>
                    )}
                    {visibleDetail.activeFrom && (
                      <span>
                        <small>Hiệu lực từ</small>
                        <strong>{formatSeasonInstant(visibleDetail.activeFrom)}</strong>
                      </span>
                    )}
                    {visibleDetail.activationProcessedAt && (
                      <span>
                        <small>Thời điểm xử lý kích hoạt</small>
                        <strong>{formatSeasonInstant(visibleDetail.activationProcessedAt)}</strong>
                      </span>
                    )}
                    {visibleDetail.activeUntil && (
                      <span>
                        <small>Hiệu lực đến</small>
                        <strong>{formatSeasonInstant(visibleDetail.activeUntil)}</strong>
                      </span>
                    )}
                  </div>
                </div>
                <RegulationVersionWorkflow
                  detail={visibleDetail}
                  seasonCode={season?.code}
                  busy={creating}
                  disabled={formDirty}
                  onAction={openAction}
                  onCreateSuccessor={() => void createSuccessor(visibleDetail)}
                />
                {selectedSummary?.capabilities.canEditDraft &&
                visibleDetail.capabilities.canEditDraft ? (
                  <RegulationDraftForm
                    key={`${visibleDetail.id}:${visibleDetail.revision}`}
                    detail={visibleDetail}
                    canEdit
                    onDirtyChange={onFormDirtyChange}
                    onSaved={() => {
                      setNotice(
                        'Đã lưu bản nháp. Nội dung chưa được gửi thẩm định và chưa có hiệu lực.',
                      );
                      setAttempt((value) => value + 1);
                      setDetailAttempt((value) => value + 1);
                    }}
                  />
                ) : (
                  <RegulationReadView content={visibleDetail.content} />
                )}
                <RegulationVersionHistory
                  key={`${visibleDetail.id}:${historyRefresh}`}
                  versionId={visibleDetail.id}
                />
              </>
            ) : (
              <p role="status" className={css.loading}>
                Đang tải phiên bản…
              </p>
            )}
          </section>
        </div>
      </div>
      {pendingSelection && (
        <div className={css.modalBackdrop}>
          <section
            className={css.confirmDialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="discard-draft-title"
          >
            <h3 id="discard-draft-title">Bỏ thay đổi chưa lưu?</h3>
            <p>
              Thay đổi bản nháp hiện tại chưa được lưu. Rời khỏi biểu mẫu sẽ bỏ các thay đổi này;
              bản nháp đã lưu vẫn được giữ nguyên.
            </p>
            <div className={css.toolbar}>
              <button type="button" onClick={() => setPendingSelection(undefined)}>
                Tiếp tục chỉnh sửa
              </button>
              <button type="button" className={css.primary} onClick={leaveDraftAndSelect}>
                Rời khỏi và bỏ thay đổi
              </button>
            </div>
          </section>
        </div>
      )}
      {actionReview &&
        actionReview.versionId === effectiveSelectedId &&
        actionReview.seasonId === seasonId &&
        actionReview.sessionEpoch === epoch &&
        actionReview.accountId === (session?.account.id ?? null) && (
          <Modal
            open
            centered
            width={680}
            title={`Xác nhận ${actionLabels[actionReview.action].toLowerCase()}`}
            onCancel={actionBusy || actionUnknown ? undefined : dismissAction}
            footer={null}
            closable={!actionBusy && !actionUnknown}
            mask={{ closable: false }}
            keyboard={!actionBusy && !actionUnknown}
          >
            <form className={css.actionForm} onSubmit={(event) => void confirmAction(event)}>
              <p>
                Xác nhận {actionLabels[actionReview.action].toLowerCase()} đúng phiên bản và nội
                dung bên dưới.
              </p>
              <dl className={css.actionTarget}>
                <div>
                  <dt>Mùa giải</dt>
                  <dd>
                    {actionReview.seasonCode}
                    {actionReview.seasonName ? ` · ${actionReview.seasonName}` : ''}
                  </dd>
                </div>
                <div>
                  <dt>Phiên bản</dt>
                  <dd>
                    {actionReview.versionNumber} · {actionReview.versionId}
                  </dd>
                </div>
                <div>
                  <dt>Lần sửa đã tải</dt>
                  <dd>{actionReview.revision}</dd>
                </div>
                <div>
                  <dt>Trạng thái đã tải</dt>
                  <dd>{regulationStateLabels[actionReview.state]}</dd>
                </div>
              </dl>
              {actionReview.action === 'approve' && (
                <RegulationReview
                  key={actionReview.requestKey}
                  content={actionReview.content}
                  currentBasis={actionReview.currentBasis}
                  labelFor={actionFieldLabel}
                  onReady={setBasisReviewed}
                />
              )}
              <RegulationActionPreview
                content={actionReview.content}
                heading="Nội dung đã lưu đang xác nhận"
              />
              {actionConflict && (
                <section className={css.actionConflict} aria-label="Kiểm tra phiên bản mới">
                  <h3>Phiên bản đã thay đổi</h3>
                  {actionConflict.status === 'required' && (
                    <>
                      <p>
                        Lần xác nhận trước không được áp dụng. Tải đúng phiên bản này để xem lại
                        trạng thái, lần sửa và nội dung mới trước khi gửi lại.
                      </p>
                      <button type="button" onClick={() => void refreshActionConflict()}>
                        Tải lại phiên bản để xem thay đổi
                      </button>
                    </>
                  )}
                  {actionConflict.status === 'loading' && (
                    <p role="status">Đang tải đúng phiên bản {actionReview.versionNumber}…</p>
                  )}
                  {actionConflict.status === 'error' && (
                    <>
                      <p role="alert">{actionConflict.message}</p>
                      <button type="button" onClick={() => void refreshActionConflict()}>
                        Thử tải lại phiên bản
                      </button>
                    </>
                  )}
                  {actionConflict.status === 'ready' && (
                    <>
                      <p>
                        Bản mới: lần sửa {actionConflict.latest.revision} ·{' '}
                        {regulationStateLabels[actionConflict.latest.state]}.
                      </p>
                      <RegulationActionPreview
                        content={actionConflict.latest.content}
                        heading="Nội dung mới nhất đã lưu"
                      />
                      {canRunAction(actionConflict.latest, actionReview.action) ? (
                        <button type="button" onClick={adoptRefreshedActionVersion}>
                          Dùng nội dung mới để xem lại xác nhận
                        </button>
                      ) : (
                        <p role="status">
                          Trạng thái hiện tại không cho phép thao tác này. Hủy xác nhận để tiếp tục.
                        </p>
                      )}
                    </>
                  )}
                </section>
              )}
              <label className={css.actionReason}>
                <span>Lý do bắt buộc</span>
                <textarea
                  aria-label="Lý do"
                  value={actionReason}
                  disabled={actionBusy || actionUnknown}
                  rows={4}
                  onChange={(event) => {
                    setActionReason(event.target.value);
                    setActionError(undefined);
                    setActionFieldErrors([]);
                  }}
                />
                <small>
                  {Array.from(normalizeActionReason(actionReason)).length}/2.000 ký tự sau chuẩn hóa
                </small>
              </label>
              {actionError && (
                <p className={css.formError} role="alert">
                  {actionError}
                </p>
              )}
              {actionFieldErrors.length > 0 && (
                <ul className={css.actionFieldErrors} aria-label="Chi tiết lỗi nội dung">
                  {actionFieldErrors.map((item, index) => (
                    <li key={`${item.field}-${index}`}>
                      <strong>{item.field}:</strong> {item.message}
                    </li>
                  ))}
                </ul>
              )}
              <div className={css.toolbar}>
                <button
                  type="button"
                  disabled={actionBusy || actionUnknown}
                  onClick={dismissAction}
                >
                  Hủy
                </button>
                <button
                  className={css.primary}
                  type="submit"
                  disabled={
                    actionBusy ||
                    !!actionConflict ||
                    (actionReview.action === 'approve' && !basisReviewed) ||
                    !normalizeActionReason(actionReason) ||
                    Array.from(normalizeActionReason(actionReason)).length > 2000
                  }
                >
                  {actionBusy
                    ? 'Đang xử lý…'
                    : actionUnknown
                      ? 'Kiểm tra kết quả phê duyệt'
                      : `Xác nhận ${actionLabels[actionReview.action].toLowerCase()}`}
                </button>
              </div>
            </form>
          </Modal>
        )}
    </div>
  );
}

function useSeasonVersions(path: string, attempt: number) {
  const { client } = useSession();
  const [result, setResult] = useState<{
    path: string;
    attempt: number;
    data?: RegulationVersionsData;
    meta?: RegulationPageMeta;
    error?: string;
  }>();
  useEffect(() => {
    let active = true;
    void client
      .request<RegulationVersionsData>(path)
      .then(({ data, meta }) => {
        if (active)
          setResult({ path, attempt, data, meta: meta as RegulationPageMeta | undefined });
      })
      .catch((error: unknown) => {
        if (active)
          setResult({
            path,
            attempt,
            error: error instanceof Error ? error.message : 'Không thể tải phiên bản.',
          });
      });
    return () => {
      active = false;
    };
  }, [client, path, attempt]);
  const matches = result?.path === path && result.attempt === attempt;
  return {
    data: matches ? result?.data : undefined,
    meta: matches ? result?.meta : undefined,
    error: matches ? result?.error : undefined,
    loading: !matches,
  };
}

function canRunAction(detail: RegulationVersionDetail, action: RegulationAction): boolean {
  switch (action) {
    case 'submit':
      return detail.capabilities.canSubmit;
    case 'withdraw':
      return detail.capabilities.canWithdraw;
    case 'return':
      return detail.capabilities.canReturn;
    case 'reject':
      return detail.capabilities.canReject;
    case 'approve':
      return detail.capabilities.canApprove === true;
  }
}

function RegulationVersionWorkflow({
  detail,
  seasonCode,
  busy,
  disabled,
  onAction,
  onCreateSuccessor,
}: {
  detail: RegulationVersionDetail;
  seasonCode?: string;
  busy: boolean;
  disabled: boolean;
  onAction: (action: RegulationAction) => void;
  onCreateSuccessor: () => void;
}) {
  const capabilities = detail.capabilities;
  return (
    <section className={css.workflowPanel} aria-label="Trạng thái và quyền thao tác">
      <dl className={css.workflowFacts}>
        <div>
          <dt>Người chuẩn bị</dt>
          <dd>{detail.preparedBy.fullName}</dd>
        </div>
        <div>
          <dt>Người đã chỉnh sửa</dt>
          <dd>
            {detail.editors.length ? (
              <ul>
                {detail.editors.map((editor) => (
                  <li key={editor.accountId}>
                    {editor.fullName || 'Không rõ tên'} · lần đầu{' '}
                    {formatSeasonInstant(editor.firstEditedAt)}
                  </li>
                ))}
              </ul>
            ) : (
              'Chưa có lượt chỉnh sửa được ghi nhận.'
            )}
          </dd>
        </div>
        {detail.submittedAt && (
          <div>
            <dt>Đã gửi thẩm định lúc</dt>
            <dd>{formatSeasonInstant(detail.submittedAt)}</dd>
          </div>
        )}
        {detail.decidedAt && (
          <div>
            <dt>Quyết định lúc</dt>
            <dd>
              {formatSeasonInstant(detail.decidedAt)}
              {detail.decidedBy ? ` · ${detail.decidedBy.fullName}` : ''}
            </dd>
          </div>
        )}
        {detail.decisionReason && (
          <div>
            <dt>Lý do quyết định</dt>
            <dd>{detail.decisionReason}</dd>
          </div>
        )}
      </dl>
      <div className={css.workflowActions}>
        {capabilities.canSubmit && (
          <button type="button" disabled={busy || disabled} onClick={() => onAction('submit')}>
            Gửi thẩm định
          </button>
        )}
        {capabilities.canWithdraw && (
          <button type="button" disabled={busy} onClick={() => onAction('withdraw')}>
            Rút phiên bản
          </button>
        )}
        {capabilities.canReturn && (
          <button type="button" disabled={busy} onClick={() => onAction('return')}>
            Trả lại để bổ sung
          </button>
        )}
        {capabilities.canReject && (
          <button type="button" disabled={busy} onClick={() => onAction('reject')}>
            Từ chối phiên bản
          </button>
        )}
        {capabilities.canApprove && (
          <button
            type="button"
            className={css.primary}
            disabled={busy}
            onClick={() => onAction('approve')}
          >
            Phê duyệt phiên bản
          </button>
        )}
        {capabilities.canCreateSuccessor && (
          <button
            type="button"
            className={css.primary}
            disabled={busy || disabled}
            onClick={onCreateSuccessor}
          >
            {busy ? 'Đang tạo…' : 'Tạo phiên bản kế tiếp để chỉnh sửa'}
          </button>
        )}
      </div>
      {disabled && capabilities.canSubmit && (
        <p className={css.workflowNote}>
          Lưu các thay đổi hiện tại trước khi gửi đúng nội dung này.
        </p>
      )}
      {capabilities.approvalExcluded && (
        <p className={css.workflowNote}>
          Phiên bản cần người quản lý chưa tham gia chuẩn bị hoặc chỉnh sửa phê duyệt.
        </p>
      )}
      {detail.predecessorVersionId && (
        <p className={css.workflowNote}>
          Phiên bản kế tiếp của {seasonCode ?? 'mùa giải'} · phiên bản trước{' '}
          {detail.predecessorVersionId}.
        </p>
      )}
    </section>
  );
}

function RegulationVersionHistory({ versionId }: { versionId: string }) {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const path = `/regulation-versions/${encodeURIComponent(versionId)}/history?page=${page}&pageSize=${pageSize}`;
  const history = useAdminList<RegulationVersionHistory, RegulationPageMeta>(path);
  const data = history.error ? undefined : history.data;
  const meta = history.meta;

  return (
    <section className={css.versionHistory} aria-label="Lịch sử thao tác của phiên bản">
      <div className={css.historyHeading}>
        <h3>Lịch sử thao tác của phiên bản</h3>
        <p>Chỉ hiển thị sự kiện thuộc đúng phiên bản này.</p>
      </div>
      <ListFeedback
        loading={history.loading}
        error={history.error}
        empty={!!data && data.items.length === 0}
        onRetry={history.reload}
      />
      {!!data?.items.length && (
        <div className={css.historyEvents}>
          {data.items.map((item) => (
            <RegulationHistoryEvent key={item.id} item={item} />
          ))}
        </div>
      )}
      {meta && meta.total > meta.pageSize && (
        <div className={css.historyPagination} aria-label="Phân trang lịch sử phiên bản">
          <button
            type="button"
            disabled={history.loading || meta.page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Mới hơn
          </button>
          <span>
            Trang {meta.page} / {Math.ceil(meta.total / meta.pageSize)} · {meta.total} sự kiện
          </span>
          <button
            type="button"
            disabled={history.loading || meta.page * meta.pageSize >= meta.total}
            onClick={() => setPage((current) => current + 1)}
          >
            Cũ hơn
          </button>
        </div>
      )}
    </section>
  );
}

function RegulationHistoryEvent({ item }: { item: RegulationVersionHistoryItem }) {
  const actor =
    item.actorName ?? item.operatorIdentity ?? item.actorId ?? 'Tài khoản được phân quyền';
  return (
    <article className={css.historyEvent}>
      <div>
        <strong>{regulationHistoryActionLabel(item.actionCode)}</strong>
        <time dateTime={item.occurredAt}>{formatSeasonInstant(item.occurredAt)}</time>
      </div>
      <p>
        {actor} · {item.outcome === 'SUCCESS' ? 'Thành công' : 'Không thành công'}
      </p>
      {item.reason && <p>Lý do: {item.reason}</p>}
      {(historyTransitionFact(item.before) || historyTransitionFact(item.after)) && (
        <dl className={css.historyTransition} aria-label="Chuyển trạng thái và lần sửa">
          {historyTransitionFact(item.before) && (
            <div>
              <dt>Trước</dt>
              <dd>{historyTransitionFact(item.before)}</dd>
            </div>
          )}
          {historyTransitionFact(item.after) && (
            <div>
              <dt>Sau</dt>
              <dd>{historyTransitionFact(item.after)}</dd>
            </div>
          )}
        </dl>
      )}
    </article>
  );
}

function historyTransitionFact(value: Record<string, unknown> | null): string | undefined {
  if (!value) return undefined;
  const facts: string[] = [];
  if (typeof value.state === 'string' && value.state in regulationStateLabels)
    facts.push(regulationStateLabels[value.state as RegulationState]);
  if (typeof value.revision === 'string' && /^[0-9]+$/.test(value.revision))
    facts.push(`lần sửa ${value.revision}`);
  return facts.length ? facts.join(' · ') : undefined;
}

function regulationHistoryActionLabel(actionCode: string): string {
  const labels: Record<string, string> = {
    REGULATION_DRAFT_CREATED: 'Tạo bản nháp',
    REGULATION_DRAFT_UPDATED: 'Cập nhật bản nháp',
    REGULATION_SUBMITTED: 'Gửi thẩm định',
    REGULATION_WITHDRAWN: 'Rút phiên bản',
    REGULATION_RETURNED: 'Trả lại để bổ sung',
    REGULATION_REJECTED: 'Từ chối phiên bản',
    REGULATION_APPROVED: 'Phê duyệt phiên bản',
    REGULATION_ACTIVATED: 'Bắt đầu hiệu lực',
    REGULATION_ACTIVATION_BLOCKED: 'Kích hoạt bị chặn',
  };
  return labels[actionCode] ?? actionCode;
}

function actionSuccessPhrase(action: RegulationAction): string {
  const phrases: Record<RegulationAction, string> = {
    submit: 'gửi thẩm định',
    withdraw: 'rút',
    return: 'trả lại',
    reject: 'từ chối',
    approve: 'phê duyệt',
  };
  return phrases[action];
}

function EmptyRegulationDetail({
  canCreateDraft,
  onCreate,
}: {
  canCreateDraft: boolean;
  onCreate: () => void;
}) {
  return (
    <div className={css.emptyDetail}>
      <div className={css.emptyIcon}>R</div>
      <h2>Chưa có phiên bản quy định</h2>
      <p>
        Chỉ nội dung đã lưu mới xuất hiện tại đây. Không có bộ quy tắc mẫu hoặc ngày hiệu lực được
        tự tạo.
      </p>
      {canCreateDraft && (
        <button type="button" className={css.primary} onClick={onCreate}>
          Tạo bản nháp trống
        </button>
      )}
    </div>
  );
}

function stateClass(state: RegulationVersionSummary['state']): string {
  if (state === 'EFFECTIVE') return css.stateGood;
  if (state === 'DRAFT' || state === 'RETURNED' || state === 'WITHDRAWN') return css.stateDraft;
  if (state === 'ACTIVATION_BLOCKED' || state === 'REJECTED' || state === 'CANCELLED')
    return css.stateBlocked;
  return css.stateWaiting;
}
