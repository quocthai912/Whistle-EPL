import { useId, useMemo, useState, type FormEvent } from 'react';
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
import corrCss from './OfficialCorrectionsPanel.module.css';
import regPageCss from './PlayerRegistrationsPage.module.css';

export type ClubApplicationBaselineFacts = {
  versionId: string;
  versionNumber: number;
  receivedAt: string | null;
  coachName: string | null;
  homeStadiumId: string | null;
  homeStadiumName: string | null;
  representativeName: string | null;
  representativePhone: string | null;
  contactAddress: string | null;
  notes: string | null;
};

export type PlayerRegistrationBaselineFacts = {
  versionId: string;
  versionNumber: number;
  receivedAt: string | null;
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
  affiliatedAssociationBasis: boolean | null;
  playingDisposition: string | null;
  notes: string | null;
};

type DeclaredReferenceItem = {
  kind: 'PLAYER_REGISTRATION' | 'SCHEDULED_MATCH' | 'OFFICIAL_RESULT' | 'OTHER';
  referenceId: string | null;
  note: string;
};

type ClubCorrectionItem = {
  id: string;
  versionNumber: number;
  versionKind: string;
  predecessorVersionId: string | null;
  baseAcceptedVersionId: string | null;
  revision: string;
  state: string;
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
  homeStadium: { id: string; code: string; name: string; location: string | null } | null;
  representativeName: string | null;
  representativePhone: string | null;
  contactAddress: string | null;
  notes: string | null;
  correctionReason: string | null;
  correctionEvidence: string | null;
  affectedReferences: {
    declared?: DeclaredReferenceItem[];
    discoveredRegistrationIds?: string[];
    venueReviewRequired?: boolean;
  } | null;
};

type ClubCorrectionsResponse = {
  caseId: string;
  seasonId: string;
  seasonState: 'OPEN' | 'CLOSED';
  currentAcceptedVersionId: string | null;
  items: ClubCorrectionItem[];
  capabilities: { canPrepare: boolean; canApprove: boolean };
};

export type CorrectionDisposition = 'RETAIN_VALID' | 'END_EFFECTIVITY' | 'RECORD_ERRONEOUS';

type RegistrationCorrectionSegmentItem = {
  id?: string;
  segmentOrder: number;
  segmentStart: string;
  segmentEnd: string | null;
  regulationVersionId: string;
  regulationVersionNumber: number;
  outcome: 'MET' | 'UNMET' | 'INSUFFICIENT_BASIS';
  requiredDisposition: CorrectionDisposition | null;
  findings: {
    u21Finding?: boolean | null;
    homegrownFinding?: boolean | null;
    squadLimit?: number | null;
    nonHomegrownLimit?: number | null;
    criteria?: {
      criterion: string;
      status: string;
      reason: string;
    }[];
    blockingCriteria?: {
      criterion: string;
      status: string;
      reason: string;
    }[];
  } | null;
};

type RegistrationCorrectionSummarySnapshot = {
  versionId?: string;
  versionNumber?: number;
  shirtNumber?: number | null;
  playingStart?: string | null;
  playingEnd?: string | null;
  playerBirthDate?: string | null;
  u21Finding?: boolean | null;
  homegrownFinding?: boolean | null;
  nonHomegrownOptIn?: boolean;
  evidenceBranch?: 'SEASONS' | 'MONTHS' | null;
  qualifyingValue?: number | null;
  evidenceSummary?: string | null;
  evidenceReference?: string | null;
  affiliatedAssociationBasis?: boolean | null;
  playingDisposition?: string | null;
  notes?: string | null;
};

type RegistrationCorrectionItem = {
  id: string;
  correctionCaseId: string;
  versionNumber: number;
  predecessorVersionId: string | null;
  revision: string;
  state: string;
  preparedBy: string;
  preparer: { id: string; fullName: string; personnelCode: string };
  editorIds: string[];
  submittedAt: string | null;
  decidedAt: string | null;
  decidedBy: string | null;
  decider: { id: string; fullName: string; personnelCode: string } | null;
  decisionReason: string | null;
  targetVersionId: string;
  proposedVersionId: string;
  reason: string | null;
  basis: string | null;
  disposition: CorrectionDisposition | null;
  beforeSummary: RegistrationCorrectionSummarySnapshot | null;
  afterSummary: RegistrationCorrectionSummarySnapshot | null;
  affectedReferences: {
    declared?: DeclaredReferenceItem[];
    uc19MatchReviewRequired?: boolean;
  } | null;
  segments: RegistrationCorrectionSegmentItem[];
};

type RegistrationCorrectionsResponse = {
  caseId: string;
  seasonId: string;
  seasonState: 'OPEN' | 'CLOSED';
  currentValidatedVersionId: string | null;
  pendingSourceCorrection: {
    required: boolean;
    snapshotBirthDate: string | null;
    currentPlayerBirthDate: string;
  };
  items: RegistrationCorrectionItem[];
  capabilities: { canPrepare: boolean; canApprove: boolean };
};

const correctionStateLabels: Record<string, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Chờ phê duyệt',
  PENDING_APPROVAL: 'Chờ phê duyệt',
  RETURNED: 'Cần bổ sung',
  NEEDS_SUPPLEMENTATION: 'Cần bổ sung',
  REJECTED: 'Bị từ chối',
  WITHDRAWN: 'Đã rút',
  CANCELLED: 'Đã hủy',
  APPROVED: 'Đã phê duyệt',
};

const dispositionLabels: Record<CorrectionDisposition, string> = {
  RETAIN_VALID: 'Giữ hiệu lực hợp lệ',
  END_EFFECTIVITY: 'Chấm dứt hiệu lực theo đính chính',
  RECORD_ERRONEOUS: 'Thu hồi hiệu lực do quyết định sai sót',
};

const dispositionOptions = [
  { value: 'RETAIN_VALID', label: 'Giữ hiệu lực hợp lệ' },
  { value: 'END_EFFECTIVITY', label: 'Chấm dứt hiệu lực theo đính chính' },
  { value: 'RECORD_ERRONEOUS', label: 'Thu hồi hiệu lực do quyết định sai sót' },
];

function statePillClass(state: string): string {
  if (state === 'APPROVED') return `${pageCss.pill} ${pageCss.pillOk}`;
  if (state === 'SUBMITTED' || state === 'PENDING_APPROVAL') {
    return `${pageCss.pill} ${pageCss.pillPending}`;
  }
  if (state === 'REJECTED' || state === 'RETURNED' || state === 'NEEDS_SUPPLEMENTATION') {
    return `${pageCss.pill} ${pageCss.pillLate}`;
  }
  return pageCss.pill;
}

function cleanUserFacingText(text: string): string {
  return text
    .replace(/\s*\(BM1\)/gi, '')
    .replace(/\bBM1\b/gi, 'hồ sơ tham dự')
    .replace(/\s*\(D\d{3}\)/gi, '')
    .replace(/\s*theo\s+D\d{3}/gi, '')
    .replace(/\bD\d{3}\b/gi, '')
    .replace(/\s*theo\s+FR-\d{3}/gi, '')
    .replace(/\bFR-\d{3}\b/gi, '')
    .replace(/\s*cho\s+UC\d{2}/gi, '')
    .replace(/\s*theo\s+UC\d{2}/gi, '')
    .replace(/\bUC\d{2}\b/gi, '')
    .replace(/\s*\(non-homegrown\)/gi, '')
    .replace(/\[bắt đầu, kết thúc\)/g, 'từ lúc bắt đầu đến lúc kết thúc')
    .replace(/\bR(\d+)\b/g, 'Quy định phiên bản $1')
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z/g, (iso) =>
      formatSeasonInstant(iso),
    )
    .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_m, y, mo, d) => `${d}/${mo}/${y}`)
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function formatDateVi(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : isoDate;
}

function formatIntervalSummary(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start) return 'Chưa ấn định';
  return end
    ? `${formatSeasonInstant(start)} → ${formatSeasonInstant(end)}`
    : `Từ ${formatSeasonInstant(start)} (Chưa ấn định kết thúc)`;
}

function formatSegmentRange(start: string, end: string | null): string {
  return end
    ? `${formatSeasonInstant(start)} – ${formatSeasonInstant(end)}`
    : `Từ ${formatSeasonInstant(start)} trở đi`;
}

function formatClassificationLabel(summary: RegistrationCorrectionSummarySnapshot | null): string {
  if (!summary) return '—';
  if (summary.u21Finding === true) return 'Cầu thủ trẻ U21';
  if (summary.homegrownFinding === true) return 'Đào tạo nội địa';
  if (summary.nonHomegrownOptIn || summary.homegrownFinding === false) {
    return 'Ngoài đào tạo nội địa';
  }
  return 'Chưa phân loại';
}

function formatPlayingDispositionLabel(disposition: string | null | undefined): string {
  if (disposition === 'RECORDED_ERRONEOUS') return 'Thu hồi hiệu lực do quyết định sai sót';
  if (disposition === 'ENDED_BY_CORRECTION') return 'Chấm dứt hiệu lực theo đính chính';
  if (disposition === 'CANCELLED_BEFORE_EFFECTIVITY') return 'Hủy trước hiệu lực';
  return 'Giữ hiệu lực hợp lệ';
}

export type OfficialCorrectionsPanelProps =
  | {
      mode: 'club-application';
      caseId: string;
      clubName: string;
      seasonName: string;
      baseline: ClubApplicationBaselineFacts | null;
      stadiums: { id: string; code: string; name: string; discontinuedAt: string | null }[];
      onChanged: () => void;
    }
  | {
      mode: 'player-registration';
      caseId: string;
      playerName: string;
      clubName: string;
      seasonName: string;
      baseline: PlayerRegistrationBaselineFacts | null;
      onChanged: () => void;
    };

export function OfficialCorrectionsPanel(props: OfficialCorrectionsPanelProps) {
  if (props.mode === 'club-application') {
    return <ClubApplicationCorrectionsSection {...props} />;
  }
  return <PlayerRegistrationCorrectionsSection {...props} />;
}

/* ============================================================================
   1. CLUB APPLICATION DESCRIPTIVE CORRECTIONS
   ============================================================================ */

type ClubDecisionAction = {
  action: 'submit' | 'approve' | 'return' | 'reject' | 'withdraw' | 'cancel';
  item: ClubCorrectionItem;
  title: string;
  submitLabel: string;
  requireReason: boolean;
  critical?: boolean;
  danger?: boolean;
};

function ClubApplicationCorrectionsSection({
  caseId,
  clubName,
  seasonName,
  baseline,
  stadiums,
  onChanged,
}: Extract<OfficialCorrectionsPanelProps, { mode: 'club-application' }>) {
  const { session } = useSession();
  const resource = useAdminList<ClubCorrectionsResponse>(
    `/club-applications/${caseId}/corrections`,
  );
  const data = resource.error ? null : (resource.data ?? null);
  const [selectedId, setSelectedId] = useState<string>();
  const [editorMode, setEditorMode] = useState<
    { kind: 'create' } | { kind: 'edit'; item: ClubCorrectionItem } | null
  >(null);
  const [decisionModal, setDecisionModal] = useState<ClubDecisionAction | null>(null);

  const items = data?.items ?? [];
  const activeItem = items.find((i) => i.id === selectedId) ?? items[0] ?? null;
  const seasonOpen = data?.seasonState === 'OPEN';
  const currentAccountId = session?.account.id;
  const hasOpenProposal = items.some(
    (i) => i.state === 'DRAFT' || i.state === 'PENDING_APPROVAL' || i.state === 'RECEIVED',
  );

  const stadiumNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of stadiums) {
      map.set(s.id, s.name);
    }
    return map;
  }, [stadiums]);

  const isFormerEditor = !!(
    activeItem &&
    currentAccountId &&
    (activeItem.preparedBy === currentAccountId || activeItem.editorIds.includes(currentAccountId))
  );

  const diffRows = useMemo(() => {
    if (!activeItem || !baseline) return [];
    const rows: { label: string; before: string; after: string }[] = [];
    if ((baseline.coachName ?? '') !== (activeItem.coachName ?? '')) {
      rows.push({
        label: 'Huấn luyện viên trưởng',
        before: baseline.coachName ?? 'Chưa nhập',
        after: activeItem.coachName ?? 'Chưa nhập',
      });
    }
    if ((baseline.homeStadiumId ?? '') !== (activeItem.homeStadiumId ?? '')) {
      rows.push({
        label: 'Sân nhà đăng ký',
        before:
          baseline.homeStadiumName ??
          (baseline.homeStadiumId
            ? (stadiumNameById.get(baseline.homeStadiumId) ?? 'Đã chọn')
            : 'Chưa chọn'),
        after:
          activeItem.homeStadium?.name ??
          (activeItem.homeStadiumId
            ? (stadiumNameById.get(activeItem.homeStadiumId) ?? 'Đã chọn')
            : 'Chưa chọn'),
      });
    }
    if ((baseline.representativeName ?? '') !== (activeItem.representativeName ?? '')) {
      rows.push({
        label: 'Người đại diện',
        before: baseline.representativeName ?? 'Chưa nhập',
        after: activeItem.representativeName ?? 'Chưa nhập',
      });
    }
    if ((baseline.representativePhone ?? '') !== (activeItem.representativePhone ?? '')) {
      rows.push({
        label: 'Số điện thoại đại diện',
        before: baseline.representativePhone ?? 'Chưa nhập',
        after: activeItem.representativePhone ?? 'Chưa nhập',
      });
    }
    if ((baseline.contactAddress ?? '') !== (activeItem.contactAddress ?? '')) {
      rows.push({
        label: 'Địa chỉ liên hệ',
        before: baseline.contactAddress ?? 'Chưa nhập',
        after: activeItem.contactAddress ?? 'Chưa nhập',
      });
    }
    if ((baseline.notes ?? '') !== (activeItem.notes ?? '')) {
      rows.push({
        label: 'Ghi chú',
        before: baseline.notes ?? 'Không có',
        after: activeItem.notes ?? 'Không có',
      });
    }
    return rows;
  }, [activeItem, baseline, stadiumNameById]);

  const officialVersionNumber = baseline?.versionNumber ?? 1;

  return (
    <section
      className={`${regPageCss.sectionBox} ${corrCss.panelHighlight}`}
      aria-label="Đính chính thông tin hồ sơ tham dự"
    >
      <div className={regPageCss.sectionBoxHeader}>
        <div>
          <h3>Đính chính thông tin hồ sơ tham dự</h3>
          <p className={corrCss.panelSub}>
            Đính chính sai sót ghi chép ban đầu ở phần thông tin chung; giữ nguyên thời điểm tiếp
            nhận gốc và danh sách cầu thủ dự kiến.
          </p>
        </div>
        {activeItem ? (
          <span className={statePillClass(activeItem.state)}>
            Phiên bản {activeItem.versionNumber} ·{' '}
            {correctionStateLabels[activeItem.state] ?? activeItem.state}
          </span>
        ) : baseline ? (
          <span className={`${pageCss.pill} ${pageCss.pillOk}`}>
            Nội dung chính thức: Phiên bản {officialVersionNumber}
          </span>
        ) : null}
      </div>

      <ListFeedback loading={resource.loading} error={resource.error} onRetry={resource.reload} />

      {data && !seasonOpen && (
        <div className={`${corrCss.banner} ${corrCss.bannerErr}`} role="status">
          <strong>Mùa giải đã đóng:</strong> Chỉ có thể tra cứu lịch sử, không thể tạo hoặc phê
          duyệt đính chính mới.
        </div>
      )}

      {activeItem && activeItem.state === 'NEEDS_SUPPLEMENTATION' && (
        <div className={`${corrCss.banner} ${corrCss.bannerWarn}`} role="status">
          <strong>Đã trả lại để bổ sung:</strong>{' '}
          {cleanUserFacingText(activeItem.decisionReason ?? 'Cần bổ sung căn cứ đính chính.')}{' '}
          <strong>Phiên bản {officialVersionNumber} vẫn là hồ sơ chính thức hiện hành.</strong>
        </div>
      )}

      {activeItem && activeItem.state === 'REJECTED' && (
        <div className={`${corrCss.banner} ${corrCss.bannerErr}`} role="status">
          <strong>Đã từ chối đề xuất:</strong>{' '}
          {cleanUserFacingText(activeItem.decisionReason ?? 'Chưa đủ căn cứ phê duyệt.')}{' '}
          <strong>Phiên bản {officialVersionNumber} vẫn là hồ sơ chính thức hiện hành.</strong>
        </div>
      )}

      {activeItem && activeItem.state === 'APPROVED' && (
        <div className={`${corrCss.banner} ${corrCss.bannerOk}`} role="status">
          <strong>Đã phê duyệt đính chính:</strong> Hồ sơ chính thức đã chuyển sang{' '}
          <strong>Phiên bản {activeItem.versionNumber}</strong>; lịch sử phiên bản trước vẫn được
          lưu giữ.
        </div>
      )}

      {activeItem ? (
        <div className={corrCss.proposalCard}>
          <div className={corrCss.proposalHeader}>
            <div>
              <strong>Phiên bản đính chính {activeItem.versionNumber}</strong> · Người lập:{' '}
              {activeItem.preparer.fullName}
              {baseline?.receivedAt
                ? ` · Tiếp nhận gốc: ${formatSeasonInstant(baseline.receivedAt)}`
                : ''}
            </div>
            {activeItem.affectedReferences?.venueReviewRequired && (
              <span className={`${pageCss.pill} ${pageCss.pillLate}`}>Có cập nhật sân nhà</span>
            )}
          </div>

          {diffRows.length > 0 && (
            <div className={corrCss.diffTableWrap}>
              <table className={corrCss.diffTable} aria-label="Đối chiếu thông tin hồ sơ tham dự">
                <thead>
                  <tr>
                    <th className={corrCss.diffFieldCol}>Thông tin thay đổi</th>
                    <th className={corrCss.diffBeforeCol}>
                      Trước đính chính (Phiên bản {officialVersionNumber})
                    </th>
                    <th className={corrCss.diffAfterCol}>
                      Sau đính chính (Phiên bản {activeItem.versionNumber})
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {diffRows.map((row) => (
                    <tr key={row.label}>
                      <td className={corrCss.diffFieldCol}>{row.label}</td>
                      <td className={corrCss.diffBeforeCol}>{row.before}</td>
                      <td className={corrCss.diffAfterCol}>{row.after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className={corrCss.reasonGrid}>
            <div>
              <span className={corrCss.reasonLabel}>Lý do:</span>
              <strong>{cleanUserFacingText(activeItem.correctionReason ?? '—')}</strong>
            </div>
            <div>
              <span className={corrCss.reasonLabel}>Căn cứ:</span>
              <strong>{cleanUserFacingText(activeItem.correctionEvidence ?? '—')}</strong>
            </div>
          </div>

          {((activeItem.affectedReferences?.declared?.length ?? 0) > 0 ||
            (activeItem.affectedReferences?.discoveredRegistrationIds?.length ?? 0) > 0) && (
            <div className={corrCss.referenceBar}>
              <div>
                <strong>Hồ sơ liên quan cần rà soát:</strong>{' '}
                {(activeItem.affectedReferences?.declared ?? []).length > 0
                  ? (activeItem.affectedReferences?.declared ?? [])
                      .map((r) => cleanUserFacingText(r.note))
                      .join('; ')
                  : 'Các trận đấu sân nhà liên quan'}
              </div>
              <span className={pageCss.metaNote}>
                {(activeItem.affectedReferences?.discoveredRegistrationIds ?? []).length} đăng ký
                cầu thủ hiện hữu được giữ nguyên
              </span>
            </div>
          )}

          <div className={corrCss.actionBar}>
            <span className={pageCss.metaNote}>
              {activeItem.state === 'APPROVED'
                ? `Phiên bản ${activeItem.versionNumber} đang là hồ sơ chính thức hiện hành.`
                : `Phiên bản ${officialVersionNumber} vẫn là hồ sơ chính thức hiện hành.`}
            </span>
            <div className={corrCss.actionButtons}>
              {seasonOpen && data?.capabilities.canPrepare && activeItem.state === 'DRAFT' && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditorMode({ kind: 'edit', item: activeItem })}
                  >
                    Chỉnh sửa nháp
                  </button>
                  <button
                    type="button"
                    className={css.primary}
                    onClick={() =>
                      setDecisionModal({
                        action: 'submit',
                        item: activeItem,
                        title: 'Trình phê duyệt đề xuất đính chính',
                        submitLabel: 'Trình phê duyệt',
                        requireReason: false,
                      })
                    }
                  >
                    Trình phê duyệt
                  </button>
                  <button
                    type="button"
                    className={css.danger}
                    onClick={() =>
                      setDecisionModal({
                        action: 'cancel',
                        item: activeItem,
                        title: 'Hủy đề xuất đính chính',
                        submitLabel: 'Xác nhận hủy',
                        requireReason: true,
                        danger: true,
                      })
                    }
                  >
                    Hủy đề xuất
                  </button>
                </>
              )}

              {seasonOpen && activeItem.state === 'PENDING_APPROVAL' && (
                <>
                  {data?.capabilities.canApprove && !isFormerEditor && (
                    <>
                      <button
                        type="button"
                        className={css.primary}
                        onClick={() =>
                          setDecisionModal({
                            action: 'approve',
                            item: activeItem,
                            title: 'Phê duyệt đề xuất đính chính hồ sơ tham dự',
                            submitLabel: 'Phê duyệt',
                            requireReason: true,
                            critical: true,
                          })
                        }
                      >
                        Phê duyệt
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDecisionModal({
                            action: 'return',
                            item: activeItem,
                            title: 'Trả lại đề xuất đính chính để bổ sung',
                            submitLabel: 'Trả lại bổ sung',
                            requireReason: true,
                          })
                        }
                      >
                        Trả lại bổ sung
                      </button>
                      <button
                        type="button"
                        className={pageCss.dangerSolid}
                        onClick={() =>
                          setDecisionModal({
                            action: 'reject',
                            item: activeItem,
                            title: 'Từ chối đề xuất đính chính hồ sơ tham dự',
                            submitLabel: 'Từ chối',
                            requireReason: true,
                            danger: true,
                          })
                        }
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                  {data?.capabilities.canApprove && isFormerEditor && (
                    <span className={pageCss.metaNote} role="status">
                      Người từng soạn thảo hoặc chỉnh sửa đề xuất này không thể tự phê duyệt.
                    </span>
                  )}
                  {data?.capabilities.canPrepare && (
                    <button
                      type="button"
                      onClick={() =>
                        setDecisionModal({
                          action: 'withdraw',
                          item: activeItem,
                          title: 'Rút đề xuất đính chính',
                          submitLabel: 'Rút đề xuất',
                          requireReason: false,
                        })
                      }
                    >
                      Rút đề xuất
                    </button>
                  )}
                </>
              )}

              {seasonOpen && data?.capabilities.canPrepare && baseline && !hasOpenProposal && (
                <button
                  type="button"
                  className={
                    activeItem.state === 'NEEDS_SUPPLEMENTATION' || activeItem.state === 'REJECTED'
                      ? css.primary
                      : undefined
                  }
                  onClick={() => setEditorMode({ kind: 'create' })}
                >
                  {activeItem.state === 'NEEDS_SUPPLEMENTATION' || activeItem.state === 'REJECTED'
                    ? 'Tạo phiên bản bổ sung mới'
                    : 'Đề xuất đính chính mới'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={corrCss.emptyState}>
          <span>
            Chưa có đề xuất đính chính nào. Hồ sơ chính thức hiện hành là{' '}
            <strong>Phiên bản {officialVersionNumber}</strong>.
          </span>
          {seasonOpen && data?.capabilities.canPrepare && baseline && (
            <button
              type="button"
              className={css.primary}
              onClick={() => setEditorMode({ kind: 'create' })}
            >
              Đề xuất đính chính hồ sơ
            </button>
          )}
        </div>
      )}

      {items.length > 0 && (
        <details className={corrCss.historyDetails}>
          <summary>Lịch sử các lần đính chính ({items.length} bản ghi)</summary>
          <ul className={corrCss.historyList}>
            {items.map((item) => (
              <li key={item.id} className={corrCss.historyItem}>
                <div>
                  <strong>Phiên bản đính chính {item.versionNumber}</strong> ·{' '}
                  {item.preparer.fullName}
                  {item.decidedAt ? ` · ${formatSeasonInstant(item.decidedAt)}` : ''}
                </div>
                <div className={corrCss.actionButtons}>
                  <span className={statePillClass(item.state)}>
                    {correctionStateLabels[item.state] ?? item.state}
                  </span>
                  {item.id !== activeItem?.id && (
                    <button type="button" onClick={() => setSelectedId(item.id)}>
                      Xem
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}

      {editorMode && baseline && (
        <ClubCorrectionProposalModal
          caseId={caseId}
          clubName={clubName}
          seasonName={seasonName}
          baseline={baseline}
          stadiums={stadiums}
          editItem={editorMode.kind === 'edit' ? editorMode.item : undefined}
          onClose={() => setEditorMode(null)}
          onSaved={(savedVersionId) => {
            setEditorMode(null);
            if (savedVersionId) setSelectedId(savedVersionId);
            resource.reload();
            onChanged();
          }}
        />
      )}

      {decisionModal && (
        <ClubCorrectionDecisionModal
          caseId={caseId}
          officialVersionNumber={officialVersionNumber}
          baseAcceptedVersionId={
            decisionModal.item.baseAcceptedVersionId ?? baseline?.versionId ?? null
          }
          spec={decisionModal}
          onClose={() => setDecisionModal(null)}
          onCompleted={() => {
            setDecisionModal(null);
            resource.reload();
            onChanged();
          }}
        />
      )}
    </section>
  );
}

function ClubCorrectionProposalModal({
  caseId,
  clubName,
  seasonName,
  baseline,
  stadiums,
  editItem,
  onClose,
  onSaved,
}: {
  caseId: string;
  clubName: string;
  seasonName: string;
  baseline: ClubApplicationBaselineFacts;
  stadiums: { id: string; code: string; name: string; discontinuedAt: string | null }[];
  editItem?: ClubCorrectionItem;
  onClose: () => void;
  onSaved: (versionId?: string) => void;
}) {
  const { client } = useSession();
  const formId = useId();
  const [coachName, setCoachName] = useState(editItem?.coachName ?? baseline.coachName ?? '');
  const [homeStadiumId, setHomeStadiumId] = useState(
    editItem?.homeStadiumId ?? baseline.homeStadiumId ?? '',
  );
  const [representativeName, setRepresentativeName] = useState(
    editItem?.representativeName ?? baseline.representativeName ?? '',
  );
  const [representativePhone, setRepresentativePhone] = useState(
    editItem?.representativePhone ?? baseline.representativePhone ?? '',
  );
  const [contactAddress, setContactAddress] = useState(
    editItem?.contactAddress ?? baseline.contactAddress ?? '',
  );
  const notes = editItem?.notes ?? baseline.notes ?? '';
  const [correctionReason, setCorrectionReason] = useState(editItem?.correctionReason ?? '');
  const [correctionEvidence, setCorrectionEvidence] = useState(editItem?.correctionEvidence ?? '');
  const [relatedNote, setRelatedNote] = useState(
    editItem?.affectedReferences?.declared?.[0]?.note ?? '',
  );
  const [submitImmediately, setSubmitImmediately] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const feedbackRef = useDialogFeedback(error);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!correctionReason.trim() || !correctionEvidence.trim()) {
      setError('Vui lòng nhập đầy đủ lý do đính chính và căn cứ chứng minh sai sót ban đầu.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const affectedReferences = relatedNote.trim()
        ? [{ kind: 'SCHEDULED_MATCH' as const, note: relatedNote.trim() }]
        : [];
      let versionId = editItem?.id;
      let revision = editItem?.revision ?? '1';

      if (editItem) {
        const updated = await client.request<{ versionId: string; revision: string }>(
          `/club-applications/${caseId}/corrections/${editItem.id}`,
          {
            method: 'PATCH',
            body: {
              expectedRevision: editItem.revision,
              coachName: coachName.trim(),
              homeStadiumId,
              representativeName: representativeName.trim(),
              representativePhone: representativePhone.trim(),
              contactAddress: contactAddress.trim(),
              notes: notes.trim() || null,
              correctionReason: correctionReason.trim(),
              correctionEvidence: correctionEvidence.trim(),
              affectedReferences,
            },
          },
        );
        versionId = updated.data.versionId;
        revision = updated.data.revision;
      } else {
        const created = await client.request<{ versionId: string; revision: string }>(
          `/club-applications/${caseId}/corrections`,
          {
            method: 'POST',
            body: {
              baseAcceptedVersionId: baseline.versionId,
              coachName: coachName.trim(),
              homeStadiumId,
              representativeName: representativeName.trim(),
              representativePhone: representativePhone.trim(),
              contactAddress: contactAddress.trim(),
              notes: notes.trim() || null,
              correctionReason: correctionReason.trim(),
              correctionEvidence: correctionEvidence.trim(),
              affectedReferences,
            },
          },
        );
        versionId = created.data.versionId;
        revision = created.data.revision;
      }

      if (submitImmediately && versionId) {
        await client.request(`/club-applications/${caseId}/corrections/${versionId}/submit`, {
          method: 'POST',
          body: { expectedRevision: revision },
        });
      }
      onSaved(versionId);
    } catch (caught) {
      if (caught instanceof HttpFailure) {
        setError(cleanUserFacingText(caught.message));
      } else {
        setError('Không thể lưu đề xuất đính chính lúc này. Vui lòng thử lại.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      title={
        editItem
          ? `Chỉnh sửa đề xuất đính chính (Phiên bản ${editItem.versionNumber})`
          : 'Tạo đề xuất đính chính hồ sơ tham dự'
      }
      width={620}
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
        onSubmit={(e) => void handleSubmit(e)}
        className={`${css.form} ${dialogCss.form}`}
        noValidate
      >
        {error && (
          <div role="alert" className={css.error}>
            {error}
          </div>
        )}

        <p className={pageCss.metaNote}>
          {clubName} · Mùa giải {seasonName} · Đối chiếu với{' '}
          <strong>Phiên bản chính thức {baseline.versionNumber}</strong>
        </p>

        <div className={corrCss.formGrid2}>
          <label>
            Huấn luyện viên trưởng *
            <input
              value={coachName}
              disabled={busy}
              maxLength={200}
              onChange={(e) => setCoachName(e.target.value)}
            />
          </label>
          <AdminSelect
            label="Sân nhà đăng ký *"
            hideLabel={false}
            searchable
            value={homeStadiumId}
            options={stadiums.map((s) => ({
              value: s.id,
              label: `${s.name} (${s.code})${s.discontinuedAt ? ' · Đã ngừng sử dụng' : ''}`,
            }))}
            onChange={setHomeStadiumId}
          />
        </div>

        <div className={corrCss.formGrid2}>
          <label>
            Người đại diện *
            <input
              value={representativeName}
              disabled={busy}
              maxLength={200}
              onChange={(e) => setRepresentativeName(e.target.value)}
            />
          </label>
          <label>
            Số điện thoại đại diện *
            <input
              value={representativePhone}
              disabled={busy}
              maxLength={32}
              onChange={(e) => setRepresentativePhone(e.target.value)}
            />
          </label>
        </div>

        <label>
          Địa chỉ liên hệ *
          <input
            value={contactAddress}
            disabled={busy}
            maxLength={500}
            onChange={(e) => setContactAddress(e.target.value)}
          />
        </label>

        <label>
          Lý do đính chính *
          <textarea
            rows={2}
            value={correctionReason}
            disabled={busy}
            maxLength={2000}
            placeholder="Mô tả rõ thông tin bị ghi sai so với hồ sơ gốc…"
            onChange={(e) => setCorrectionReason(e.target.value)}
          />
        </label>

        <label>
          Căn cứ / tài liệu chứng minh *
          <textarea
            rows={2}
            value={correctionEvidence}
            disabled={busy}
            maxLength={2000}
            placeholder="Số hiệu công văn, biên bản hoặc tài liệu gốc đính kèm…"
            onChange={(e) => setCorrectionEvidence(e.target.value)}
          />
        </label>

        <label>
          Hồ sơ / lịch thi đấu liên quan cần rà soát (tùy chọn)
          <input
            value={relatedNote}
            disabled={busy}
            maxLength={500}
            placeholder="Ví dụ: Lịch thi đấu các trận sân nhà lượt đi…"
            onChange={(e) => setRelatedNote(e.target.value)}
          />
        </label>

        <div className={css.actions}>
          <button type="button" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button type="submit" disabled={busy} onClick={() => setSubmitImmediately(false)}>
            Lưu nháp
          </button>
          <button
            type="submit"
            className={css.primary}
            disabled={busy}
            onClick={() => setSubmitImmediately(true)}
          >
            {busy ? 'Đang xử lý…' : 'Trình phê duyệt'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ClubCorrectionDecisionModal({
  caseId,
  officialVersionNumber,
  baseAcceptedVersionId,
  spec,
  onClose,
  onCompleted,
}: {
  caseId: string;
  officialVersionNumber: number;
  baseAcceptedVersionId: string | null;
  spec: ClubDecisionAction;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const { client } = useSession();
  const formId = useId();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const feedbackRef = useDialogFeedback(error);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (spec.requireReason && !reason.trim()) {
      setError('Vui lòng nhập ý kiến quyết định trước khi xác nhận.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await client.request(
        `/club-applications/${caseId}/corrections/${spec.item.id}/${spec.action}`,
        {
          method: 'POST',
          requestKey: spec.critical ? idempotencyKey : undefined,
          body: {
            expectedRevision: spec.item.revision,
            ...(spec.action === 'approve' && baseAcceptedVersionId
              ? { baseAcceptedVersionId }
              : {}),
            ...(reason.trim() ? { reason: reason.trim() } : {}),
          },
        },
      );
      onCompleted();
    } catch (caught) {
      if (caught instanceof HttpFailure) {
        setError(cleanUserFacingText(caught.message));
      } else {
        setError('Không thể thực hiện thao tác lúc này. Vui lòng thử lại.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      title={spec.title}
      width={560}
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
        onSubmit={(e) => void submit(e)}
        className={`${css.form} ${dialogCss.form}`}
        noValidate
      >
        {error && (
          <div role="alert" className={css.error}>
            {error}
          </div>
        )}

        <p className={pageCss.metaNote}>
          {spec.action === 'approve'
            ? `Sau khi phê duyệt, Phiên bản ${spec.item.versionNumber} sẽ trở thành hồ sơ chính thức hiện hành và giữ nguyên lịch sử Phiên bản ${officialVersionNumber}.`
            : `Phiên bản ${officialVersionNumber} vẫn giữ nguyên là hồ sơ chính thức hiện hành sau thao tác này.`}
        </p>

        {spec.requireReason && (
          <label>
            Ý kiến quyết định *
            <textarea
              rows={3}
              value={reason}
              disabled={busy}
              maxLength={2000}
              placeholder="Nhập lý do hoặc ý kiến xét duyệt…"
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
        )}

        <div className={css.actions}>
          <button type="button" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className={spec.danger ? css.danger : css.primary} disabled={busy}>
            {busy ? 'Đang xử lý…' : spec.submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ============================================================================
   2. PLAYER REGISTRATION HISTORICAL CORRECTIONS
   ============================================================================ */

type RegistrationDecisionAction = {
  action: 'submit' | 'approve' | 'return' | 'reject' | 'withdraw' | 'cancel';
  item: RegistrationCorrectionItem;
  title: string;
  submitLabel: string;
  requireReason: boolean;
  critical?: boolean;
  danger?: boolean;
};

function PlayerRegistrationCorrectionsSection({
  caseId,
  playerName,
  clubName,
  seasonName,
  baseline,
  onChanged,
}: Extract<OfficialCorrectionsPanelProps, { mode: 'player-registration' }>) {
  const { session } = useSession();
  const resource = useAdminList<RegistrationCorrectionsResponse>(
    `/player-registrations/${caseId}/corrections`,
  );
  const data = resource.error ? null : (resource.data ?? null);
  const [selectedId, setSelectedId] = useState<string>();
  const [editorMode, setEditorMode] = useState<
    { kind: 'create' } | { kind: 'edit'; item: RegistrationCorrectionItem } | null
  >(null);
  const [decisionModal, setDecisionModal] = useState<RegistrationDecisionAction | null>(null);

  const items = data?.items ?? [];
  const activeItem = items.find((i) => i.id === selectedId) ?? items[0] ?? null;
  const seasonOpen = data?.seasonState === 'OPEN';
  const currentAccountId = session?.account.id;
  const hasOpenProposal = items.some((i) => i.state === 'DRAFT' || i.state === 'SUBMITTED');

  const isFormerEditor = !!(
    activeItem &&
    currentAccountId &&
    (activeItem.preparedBy === currentAccountId || activeItem.editorIds.includes(currentAccountId))
  );

  const officialVersionNumber = baseline?.versionNumber ?? 1;
  const beforeVerNum = activeItem?.beforeSummary?.versionNumber ?? officialVersionNumber;
  const afterVerNum = activeItem?.afterSummary?.versionNumber ?? officialVersionNumber + 1;

  const diffRows = useMemo(() => {
    if (!activeItem) return [];
    const before = activeItem.beforeSummary;
    const after = activeItem.afterSummary;
    const rows: { label: string; before: string; after: string }[] = [];

    if (
      before?.playerBirthDate &&
      after?.playerBirthDate &&
      before.playerBirthDate !== after.playerBirthDate
    ) {
      rows.push({
        label: 'Ngày sinh áp dụng',
        before: formatDateVi(before.playerBirthDate),
        after: formatDateVi(after.playerBirthDate),
      });
    }
    if (before?.shirtNumber !== after?.shirtNumber) {
      rows.push({
        label: 'Số áo đăng ký',
        before: before?.shirtNumber ? `#${before.shirtNumber}` : '—',
        after: after?.shirtNumber ? `#${after.shirtNumber}` : '—',
      });
    }
    const beforeClass = formatClassificationLabel(before);
    const afterClass = formatClassificationLabel(after);
    if (beforeClass !== afterClass) {
      rows.push({
        label: 'Phân loại cầu thủ',
        before: beforeClass,
        after: afterClass,
      });
    }
    const beforeInterval = formatIntervalSummary(before?.playingStart, before?.playingEnd);
    const afterInterval = formatIntervalSummary(after?.playingStart, after?.playingEnd);
    if (beforeInterval !== afterInterval) {
      rows.push({
        label: 'Khoảng hiệu lực',
        before: beforeInterval,
        after: afterInterval,
      });
    }
    const beforeDisp = formatPlayingDispositionLabel(before?.playingDisposition);
    const afterDisp = formatPlayingDispositionLabel(after?.playingDisposition);
    if (beforeDisp !== afterDisp) {
      rows.push({
        label: 'Tình trạng hiệu lực',
        before: beforeDisp,
        after: afterDisp,
      });
    }
    if ((before?.notes ?? '') !== (after?.notes ?? '')) {
      rows.push({
        label: 'Ghi chú',
        before: before?.notes ?? 'Không có',
        after: after?.notes ?? 'Không có',
      });
    }
    return rows;
  }, [activeItem]);

  return (
    <section
      className={`${regPageCss.sectionBox} ${corrCss.panelHighlight}`}
      aria-label="Đính chính hồ sơ đăng ký"
    >
      <div className={regPageCss.sectionBoxHeader}>
        <div>
          <h3>Đính chính hồ sơ đăng ký</h3>
          <p className={corrCss.panelSub}>
            Đối chiếu và kiểm tra điều kiện theo từng giai đoạn quy định lịch sử bị ảnh hưởng; chỉ
            cập nhật hồ sơ chính thức sau khi Quản lý mùa giải phê duyệt độc lập.
          </p>
        </div>
        {activeItem ? (
          <span className={statePillClass(activeItem.state)}>
            Đề xuất lần {activeItem.versionNumber} ·{' '}
            {correctionStateLabels[activeItem.state] ?? activeItem.state}
          </span>
        ) : baseline ? (
          <span className={`${pageCss.pill} ${pageCss.pillOk}`}>
            Hồ sơ chính thức: Phiên bản {officialVersionNumber}
          </span>
        ) : null}
      </div>

      <ListFeedback loading={resource.loading} error={resource.error} onRetry={resource.reload} />

      {data?.pendingSourceCorrection?.required && (
        <div className={`${corrCss.banner} ${corrCss.bannerWarn}`} role="status">
          <strong>
            Hồ sơ cầu thủ vừa cập nhật ngày sinh (
            {formatDateVi(data.pendingSourceCorrection.currentPlayerBirthDate)}):
          </strong>{' '}
          Khác với thông tin lúc xác nhận Phiên bản {officialVersionNumber} (
          {formatDateVi(data.pendingSourceCorrection.snapshotBirthDate)}). Phiên bản{' '}
          {officialVersionNumber} vẫn giữ hiệu lực cho đến khi đính chính được phê duyệt.
        </div>
      )}

      {data && !seasonOpen && (
        <div className={`${corrCss.banner} ${corrCss.bannerErr}`} role="status">
          <strong>Mùa giải đã đóng:</strong> Chỉ có thể tra cứu lịch sử, không thể trình duyệt hoặc
          phê duyệt đính chính mới.
        </div>
      )}

      {activeItem && activeItem.state === 'RETURNED' && (
        <div className={`${corrCss.banner} ${corrCss.bannerWarn}`} role="status">
          <strong>Đã trả lại để bổ sung:</strong>{' '}
          {cleanUserFacingText(activeItem.decisionReason ?? 'Cần bổ sung căn cứ đính chính.')}{' '}
          <strong>Phiên bản {officialVersionNumber} vẫn là hồ sơ chính thức.</strong>
        </div>
      )}

      {activeItem && activeItem.state === 'REJECTED' && (
        <div className={`${corrCss.banner} ${corrCss.bannerErr}`} role="status">
          <strong>Đã từ chối đề xuất:</strong>{' '}
          {cleanUserFacingText(activeItem.decisionReason ?? 'Tài liệu chưa đủ căn cứ xác thực.')}{' '}
          <strong>Phiên bản {officialVersionNumber} vẫn là hồ sơ chính thức.</strong>
        </div>
      )}

      {activeItem && activeItem.state === 'APPROVED' && (
        <div className={`${corrCss.banner} ${corrCss.bannerOk}`} role="status">
          <strong>Đã phê duyệt đính chính:</strong> Hồ sơ chính thức đã chuyển sang{' '}
          <strong>Phiên bản {afterVerNum}</strong>; lịch sử Phiên bản {beforeVerNum} vẫn được lưu
          giữ.
        </div>
      )}

      {activeItem ? (
        <div className={corrCss.proposalCard}>
          <div className={corrCss.proposalHeader}>
            <div>
              <strong>Đề xuất lần {activeItem.versionNumber}</strong> · Người lập:{' '}
              {activeItem.preparer.fullName}
              {activeItem.submittedAt ? ` · ${formatSeasonInstant(activeItem.submittedAt)}` : ''}
            </div>
            {activeItem.disposition && (
              <span
                className={`${pageCss.pill} ${
                  activeItem.disposition === 'RETAIN_VALID' ? pageCss.pillOk : pageCss.pillLate
                }`}
              >
                Xử lý: {dispositionLabels[activeItem.disposition] ?? activeItem.disposition}
              </span>
            )}
          </div>

          {diffRows.length > 0 && (
            <div className={corrCss.diffTableWrap}>
              <table className={corrCss.diffTable} aria-label="Đối chiếu nội dung đính chính">
                <thead>
                  <tr>
                    <th className={corrCss.diffFieldCol}>Thông tin thay đổi</th>
                    <th className={corrCss.diffBeforeCol}>
                      Trước đính chính (Phiên bản {beforeVerNum})
                    </th>
                    <th className={corrCss.diffAfterCol}>
                      Sau đính chính (Phiên bản {afterVerNum})
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {diffRows.map((row) => (
                    <tr key={row.label}>
                      <td className={corrCss.diffFieldCol}>{row.label}</td>
                      <td className={corrCss.diffBeforeCol}>{row.before}</td>
                      <td className={corrCss.diffAfterCol}>{row.after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className={corrCss.reasonGrid}>
            <div>
              <span className={corrCss.reasonLabel}>Lý do:</span>
              <strong>{cleanUserFacingText(activeItem.reason ?? '—')}</strong>
            </div>
            <div>
              <span className={corrCss.reasonLabel}>Căn cứ:</span>
              <strong>{cleanUserFacingText(activeItem.basis ?? '—')}</strong>
            </div>
          </div>

          {activeItem.segments.length > 0 && (
            <div className={corrCss.segmentSection}>
              <div className={corrCss.segmentHeading}>
                Kết quả kiểm tra theo giai đoạn quy định ({activeItem.segments.length} giai đoạn)
              </div>
              <div className={corrCss.segmentBox}>
                {activeItem.segments.map((seg) => {
                  const blocking = seg.findings?.blockingCriteria?.[0];
                  return (
                    <div
                      key={seg.segmentOrder}
                      className={`${corrCss.segmentRow} ${
                        seg.outcome !== 'MET' ? corrCss.segmentRowFail : ''
                      }`}
                    >
                      <div className={corrCss.segmentMain}>
                        <div>
                          <strong>{formatSegmentRange(seg.segmentStart, seg.segmentEnd)}</strong>
                          {seg.outcome === 'MET' ? (
                            <span className={corrCss.segmentSub}>
                              {' '}
                              · Quy định phiên bản {seg.regulationVersionNumber}
                              {seg.findings?.squadLimit
                                ? ` (Giới hạn đội hình ${seg.findings.squadLimit} · Ngoài nội địa ${seg.findings.nonHomegrownLimit ?? '—'})`
                                : ''}
                            </span>
                          ) : (
                            <span className={corrCss.segmentFailText}>
                              {' '}
                              · Quy định phiên bản {seg.regulationVersionNumber}:{' '}
                              {cleanUserFacingText(
                                blocking?.reason ?? 'Chưa đáp ứng điều kiện hợp lệ',
                              )}
                            </span>
                          )}
                        </div>
                        {seg.outcome !== 'MET' && activeItem.disposition && (
                          <div className={corrCss.segmentDispositionNote}>
                            Phương án xử lý đã chọn:{' '}
                            <strong>
                              {dispositionLabels[activeItem.disposition] ?? activeItem.disposition}
                            </strong>
                          </div>
                        )}
                      </div>
                      <span
                        className={`${pageCss.pill} ${
                          seg.outcome === 'MET'
                            ? pageCss.pillOk
                            : seg.outcome === 'UNMET'
                              ? pageCss.pillLate
                              : pageCss.pillPending
                        }`}
                      >
                        {seg.outcome === 'MET'
                          ? 'Đạt'
                          : seg.outcome === 'UNMET'
                            ? 'Chưa đạt'
                            : 'Chưa đủ căn cứ'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(activeItem.affectedReferences?.declared?.length ?? 0) > 0 && (
            <div className={corrCss.referenceBar}>
              <div>
                <strong>Trận đấu liên quan cần rà soát riêng:</strong>{' '}
                {(activeItem.affectedReferences?.declared ?? [])
                  .map((r) => cleanUserFacingText(r.note))
                  .join('; ')}
              </div>
              <span className={pageCss.metaNote}>Không tự động thay đổi kết quả đã công bố</span>
            </div>
          )}

          <div className={corrCss.actionBar}>
            <span className={pageCss.metaNote}>
              {activeItem.state === 'APPROVED'
                ? `Phiên bản ${afterVerNum} đang là hồ sơ chính thức hiện hành.`
                : `Phiên bản ${officialVersionNumber} vẫn là hồ sơ chính thức hiện hành.`}
            </span>
            <div className={corrCss.actionButtons}>
              {seasonOpen && data?.capabilities.canPrepare && activeItem.state === 'DRAFT' && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditorMode({ kind: 'edit', item: activeItem })}
                  >
                    Chỉnh sửa nháp
                  </button>
                  <button
                    type="button"
                    className={css.primary}
                    onClick={() =>
                      setDecisionModal({
                        action: 'submit',
                        item: activeItem,
                        title: 'Trình phê duyệt đề xuất đính chính',
                        submitLabel: 'Trình phê duyệt',
                        requireReason: false,
                      })
                    }
                  >
                    Trình phê duyệt
                  </button>
                  <button
                    type="button"
                    className={css.danger}
                    onClick={() =>
                      setDecisionModal({
                        action: 'cancel',
                        item: activeItem,
                        title: 'Hủy đề xuất đính chính',
                        submitLabel: 'Xác nhận hủy',
                        requireReason: true,
                        danger: true,
                      })
                    }
                  >
                    Hủy đề xuất
                  </button>
                </>
              )}

              {seasonOpen && activeItem.state === 'SUBMITTED' && (
                <>
                  {data?.capabilities.canApprove && !isFormerEditor && (
                    <>
                      <button
                        type="button"
                        className={css.primary}
                        onClick={() =>
                          setDecisionModal({
                            action: 'approve',
                            item: activeItem,
                            title: 'Phê duyệt đề xuất đính chính đăng ký cầu thủ',
                            submitLabel: 'Phê duyệt',
                            requireReason: true,
                            critical: true,
                          })
                        }
                      >
                        Phê duyệt
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDecisionModal({
                            action: 'return',
                            item: activeItem,
                            title: 'Trả lại đề xuất đính chính để bổ sung',
                            submitLabel: 'Trả lại bổ sung',
                            requireReason: true,
                          })
                        }
                      >
                        Trả lại bổ sung
                      </button>
                      <button
                        type="button"
                        className={pageCss.dangerSolid}
                        onClick={() =>
                          setDecisionModal({
                            action: 'reject',
                            item: activeItem,
                            title: 'Từ chối đề xuất đính chính đăng ký cầu thủ',
                            submitLabel: 'Từ chối',
                            requireReason: true,
                            danger: true,
                          })
                        }
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                  {data?.capabilities.canApprove && isFormerEditor && (
                    <span className={pageCss.metaNote} role="status">
                      Người từng soạn thảo hoặc chỉnh sửa đề xuất này không thể tự phê duyệt.
                    </span>
                  )}
                  {data?.capabilities.canPrepare && (
                    <button
                      type="button"
                      onClick={() =>
                        setDecisionModal({
                          action: 'withdraw',
                          item: activeItem,
                          title: 'Rút đề xuất đính chính',
                          submitLabel: 'Rút đề xuất',
                          requireReason: false,
                        })
                      }
                    >
                      Rút đề xuất
                    </button>
                  )}
                </>
              )}

              {seasonOpen && data?.capabilities.canPrepare && baseline && !hasOpenProposal && (
                <button
                  type="button"
                  className={
                    activeItem.state === 'RETURNED' || activeItem.state === 'REJECTED'
                      ? css.primary
                      : undefined
                  }
                  onClick={() => setEditorMode({ kind: 'create' })}
                >
                  {activeItem.state === 'RETURNED' || activeItem.state === 'REJECTED'
                    ? 'Tạo phiên bản bổ sung mới'
                    : 'Đề xuất đính chính mới'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={corrCss.emptyState}>
          <span>
            Chưa có đề xuất đính chính nào. Hồ sơ chính thức hiện hành là{' '}
            <strong>Phiên bản {officialVersionNumber}</strong>.
          </span>
          {seasonOpen && data?.capabilities.canPrepare && baseline && (
            <button
              type="button"
              className={css.primary}
              onClick={() => setEditorMode({ kind: 'create' })}
            >
              Đề xuất đính chính đăng ký
            </button>
          )}
        </div>
      )}

      {items.length > 0 && (
        <details className={corrCss.historyDetails}>
          <summary>Lịch sử các lần đính chính ({items.length} bản ghi)</summary>
          <ul className={corrCss.historyList}>
            {items.map((item) => (
              <li key={item.id} className={corrCss.historyItem}>
                <div>
                  <strong>
                    Đề xuất lần {item.versionNumber} (Phiên bản{' '}
                    {item.beforeSummary?.versionNumber ?? officialVersionNumber} → Phiên bản{' '}
                    {item.afterSummary?.versionNumber ?? officialVersionNumber + 1})
                  </strong>{' '}
                  · {item.preparer.fullName}
                  {item.decidedAt ? ` · ${formatSeasonInstant(item.decidedAt)}` : ''}
                </div>
                <div className={corrCss.actionButtons}>
                  <span className={statePillClass(item.state)}>
                    {correctionStateLabels[item.state] ?? item.state}
                  </span>
                  {item.id !== activeItem?.id && (
                    <button type="button" onClick={() => setSelectedId(item.id)}>
                      Xem
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}

      {editorMode && baseline && (
        <RegistrationCorrectionProposalModal
          caseId={caseId}
          playerName={playerName}
          clubName={clubName}
          seasonName={seasonName}
          baseline={baseline}
          editItem={editorMode.kind === 'edit' ? editorMode.item : undefined}
          onClose={() => setEditorMode(null)}
          onSaved={(savedVersionId) => {
            setEditorMode(null);
            if (savedVersionId) setSelectedId(savedVersionId);
            resource.reload();
            onChanged();
          }}
        />
      )}

      {decisionModal && (
        <RegistrationCorrectionDecisionModal
          caseId={caseId}
          officialVersionNumber={officialVersionNumber}
          spec={decisionModal}
          onClose={() => setDecisionModal(null)}
          onCompleted={() => {
            setDecisionModal(null);
            resource.reload();
            onChanged();
          }}
        />
      )}
    </section>
  );
}

function RegistrationCorrectionProposalModal({
  caseId,
  playerName,
  clubName,
  seasonName,
  baseline,
  editItem,
  onClose,
  onSaved,
}: {
  caseId: string;
  playerName: string;
  clubName: string;
  seasonName: string;
  baseline: PlayerRegistrationBaselineFacts;
  editItem?: RegistrationCorrectionItem;
  onClose: () => void;
  onSaved: (versionId?: string) => void;
}) {
  const { client } = useSession();
  const formId = useId();
  const initialSummary = editItem?.afterSummary ?? baseline;
  const [shirtNumber, setShirtNumber] = useState(
    String(initialSummary.shirtNumber ?? baseline.shirtNumber ?? ''),
  );
  const [disposition, setDisposition] = useState<CorrectionDisposition>(
    editItem?.disposition ?? 'RETAIN_VALID',
  );
  const [playingStartInput, setPlayingStartInput] = useState(
    utcInstantToHcmInput(initialSummary.playingStart ?? baseline.playingStart ?? ''),
  );
  const [playingEndInput, setPlayingEndInput] = useState(
    utcInstantToHcmInput(initialSummary.playingEnd ?? baseline.playingEnd ?? ''),
  );
  const [nonHomegrownOptIn, setNonHomegrownOptIn] = useState(
    initialSummary.nonHomegrownOptIn ?? baseline.nonHomegrownOptIn,
  );
  const [reason, setReason] = useState(editItem?.reason ?? '');
  const [basis, setBasis] = useState(editItem?.basis ?? '');
  const [relatedMatchNote, setRelatedMatchNote] = useState(
    editItem?.affectedReferences?.declared?.[0]?.note ?? '',
  );
  const [submitImmediately, setSubmitImmediately] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const feedbackRef = useDialogFeedback(error);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;

    const parsedShirt = Number(shirtNumber.trim());
    if (!Number.isInteger(parsedShirt) || parsedShirt < 1 || parsedShirt > 99) {
      setError('Số áo đăng ký phải là số nguyên từ 1 đến 99.');
      return;
    }
    const startUtc = hcmInputToUtcInstant(playingStartInput);
    if (!startUtc) {
      setError('Vui lòng chọn thời điểm bắt đầu hiệu lực hợp lệ.');
      return;
    }
    const endUtc = playingEndInput.trim() ? hcmInputToUtcInstant(playingEndInput) : null;
    if (playingEndInput.trim() && !endUtc) {
      setError('Thời điểm kết thúc hiệu lực không đúng định dạng.');
      return;
    }
    if (!reason.trim() || !basis.trim()) {
      setError('Vui lòng nhập đầy đủ lý do đính chính và căn cứ chứng minh.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const affectedReferences = relatedMatchNote.trim()
        ? [{ kind: 'OFFICIAL_RESULT' as const, note: relatedMatchNote.trim() }]
        : [];
      let corrVersionId = editItem?.id;
      let revision = editItem?.revision ?? '1';

      if (editItem) {
        const updated = await client.request<{
          correctionVersionId: string;
          revision: string;
        }>(`/player-registrations/${caseId}/corrections/${editItem.id}`, {
          method: 'PATCH',
          body: {
            expectedRevision: editItem.revision,
            shirtNumber: parsedShirt,
            playingStart: startUtc,
            playingEnd: endUtc,
            nonHomegrownOptIn,
            disposition,
            reason: reason.trim(),
            basis: basis.trim(),
            affectedReferences,
          },
        });
        corrVersionId = updated.data.correctionVersionId;
        revision = updated.data.revision;
      } else {
        const created = await client.request<{
          correctionVersionId: string;
          revision: string;
        }>(`/player-registrations/${caseId}/corrections`, {
          method: 'POST',
          body: {
            targetVersionId: baseline.versionId,
            shirtNumber: parsedShirt,
            playingStart: startUtc,
            playingEnd: endUtc,
            nonHomegrownOptIn,
            disposition,
            reason: reason.trim(),
            basis: basis.trim(),
            affectedReferences,
          },
        });
        corrVersionId = created.data.correctionVersionId;
        revision = created.data.revision;
      }

      if (submitImmediately && corrVersionId) {
        await client.request(
          `/player-registrations/${caseId}/corrections/${corrVersionId}/submit`,
          {
            method: 'POST',
            body: { expectedRevision: revision },
          },
        );
      }
      onSaved(corrVersionId);
    } catch (caught) {
      if (caught instanceof HttpFailure) {
        setError(cleanUserFacingText(caught.message));
      } else {
        setError('Không thể lưu đề xuất đính chính lúc này. Vui lòng thử lại.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      title={
        editItem
          ? `Chỉnh sửa đề xuất đính chính (Đề xuất lần ${editItem.versionNumber})`
          : 'Tạo đề xuất đính chính đăng ký cầu thủ'
      }
      width={620}
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
        onSubmit={(e) => void handleSubmit(e)}
        className={`${css.form} ${dialogCss.form}`}
        noValidate
      >
        {error && (
          <div role="alert" className={css.error}>
            {error}
          </div>
        )}

        <p className={pageCss.metaNote}>
          {playerName} · {clubName} · Mùa giải {seasonName} · Đối chiếu{' '}
          <strong>Phiên bản chính thức {baseline.versionNumber}</strong>
        </p>

        <div className={corrCss.formGrid2}>
          <label>
            Số áo đăng ký *
            <input
              type="number"
              min={1}
              max={99}
              value={shirtNumber}
              disabled={busy}
              onChange={(e) => setShirtNumber(e.target.value)}
            />
          </label>
          <AdminSelect
            label="Phương án xử lý hiệu lực *"
            hideLabel={false}
            value={disposition}
            options={dispositionOptions}
            onChange={(val) => setDisposition(val as CorrectionDisposition)}
          />
        </div>

        <div className={corrCss.formGrid2}>
          <div>
            <span>Bắt đầu hiệu lực *</span>
            <DateTimePicker
              label="Bắt đầu hiệu lực"
              value={playingStartInput}
              disabled={busy}
              required
              onChange={setPlayingStartInput}
            />
          </div>
          <div>
            <span>Kết thúc hiệu lực</span>
            <DateTimePicker
              label="Kết thúc hiệu lực"
              value={playingEndInput}
              disabled={busy}
              onChange={setPlayingEndInput}
            />
          </div>
        </div>

        <label className={regPageCss.checkboxRow}>
          <input
            type="checkbox"
            checked={nonHomegrownOptIn}
            disabled={busy}
            onChange={(e) => setNonHomegrownOptIn(e.target.checked)}
          />
          <span>Xử lý theo diện ngoài đào tạo nội địa (nếu không thuộc diện U21)</span>
        </label>

        <label>
          Lý do đính chính *
          <textarea
            rows={2}
            value={reason}
            disabled={busy}
            maxLength={2000}
            placeholder="Trình bày nội dung sai sót cần đính chính…"
            onChange={(e) => setReason(e.target.value)}
          />
        </label>

        <label>
          Căn cứ / tài liệu chứng minh *
          <textarea
            rows={2}
            value={basis}
            disabled={busy}
            maxLength={2000}
            placeholder="Quyết định, biên bản hoặc tài liệu gốc chứng minh…"
            onChange={(e) => setBasis(e.target.value)}
          />
        </label>

        <label>
          Trận đấu liên quan cần rà soát riêng (tùy chọn)
          <input
            value={relatedMatchNote}
            disabled={busy}
            maxLength={500}
            placeholder="Ví dụ: Vòng 4 (05/09/2026)…"
            onChange={(e) => setRelatedMatchNote(e.target.value)}
          />
        </label>

        <div className={css.actions}>
          <button type="button" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button type="submit" disabled={busy} onClick={() => setSubmitImmediately(false)}>
            Lưu nháp
          </button>
          <button
            type="submit"
            className={css.primary}
            disabled={busy}
            onClick={() => setSubmitImmediately(true)}
          >
            {busy ? 'Đang xử lý…' : 'Trình phê duyệt'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function RegistrationCorrectionDecisionModal({
  caseId,
  officialVersionNumber,
  spec,
  onClose,
  onCompleted,
}: {
  caseId: string;
  officialVersionNumber: number;
  spec: RegistrationDecisionAction;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const { client } = useSession();
  const formId = useId();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<readonly FieldErrorDetail[]>([]);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const feedbackRef = useDialogFeedback(error);

  const afterVerNum = spec.item.afterSummary?.versionNumber ?? officialVersionNumber + 1;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (spec.requireReason && !reason.trim()) {
      setError('Vui lòng nhập ý kiến quyết định trước khi xác nhận.');
      return;
    }

    setBusy(true);
    setError('');
    setErrorDetails([]);
    try {
      await client.request(
        `/player-registrations/${caseId}/corrections/${spec.item.id}/${spec.action}`,
        {
          method: 'POST',
          requestKey: spec.critical ? idempotencyKey : undefined,
          body: {
            expectedRevision: spec.item.revision,
            ...(spec.action === 'approve'
              ? {
                  targetVersionId: spec.item.targetVersionId,
                  ...(spec.item.disposition ? { disposition: spec.item.disposition } : {}),
                }
              : {}),
            ...(reason.trim() ? { reason: reason.trim() } : {}),
          },
        },
      );
      onCompleted();
    } catch (caught) {
      if (caught instanceof HttpFailure) {
        setError(cleanUserFacingText(caught.message));
        setErrorDetails(caught.details ?? []);
      } else {
        setError('Không thể thực hiện thao tác lúc này. Vui lòng thử lại.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      title={spec.title}
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
        id={formId}
        ref={feedbackRef}
        onSubmit={(e) => void submit(e)}
        className={`${css.form} ${dialogCss.form}`}
        noValidate
      >
        {error && (
          <div role="alert" className={css.error}>
            <p style={{ margin: 0 }}>{error}</p>
            {errorDetails.length > 0 && (
              <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
                {errorDetails.map((d, idx) => (
                  <li key={`${d.field}-${idx}`}>{cleanUserFacingText(d.message ?? d.code)}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {spec.item.segments.length > 0 && (
          <div className={corrCss.banner}>
            {spec.item.segments.map((seg) => (
              <div key={seg.segmentOrder}>
                •{' '}
                <strong>
                  Giai đoạn {formatSegmentRange(seg.segmentStart, seg.segmentEnd)} (Quy định phiên
                  bản {seg.regulationVersionNumber}):
                </strong>{' '}
                {seg.outcome === 'MET'
                  ? 'Đạt điều kiện'
                  : cleanUserFacingText(
                      seg.findings?.blockingCriteria?.[0]?.reason ?? 'Chưa đạt điều kiện',
                    )}
              </div>
            ))}
            {spec.item.disposition && (
              <div>
                • <strong>Phương án xử lý:</strong>{' '}
                {dispositionLabels[spec.item.disposition] ?? spec.item.disposition}
              </div>
            )}
          </div>
        )}

        <p className={pageCss.metaNote}>
          {spec.action === 'approve'
            ? `Sau khi phê duyệt, Phiên bản ${afterVerNum} sẽ trở thành hồ sơ chính thức hiện hành và giữ nguyên lịch sử Phiên bản ${officialVersionNumber}.`
            : `Phiên bản ${officialVersionNumber} vẫn giữ nguyên là hồ sơ chính thức hiện hành sau thao tác này.`}
        </p>

        {spec.requireReason && (
          <label>
            Ý kiến quyết định *
            <textarea
              rows={3}
              value={reason}
              disabled={busy}
              maxLength={2000}
              placeholder="Nhập lý do hoặc ý kiến xét duyệt…"
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
        )}

        <div className={css.actions}>
          <button type="button" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className={spec.danger ? css.danger : css.primary} disabled={busy}>
            {busy ? 'Đang xử lý…' : spec.submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
