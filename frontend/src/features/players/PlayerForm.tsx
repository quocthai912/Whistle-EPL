import { useId, useState, type FormEvent } from 'react';
import { DateOnlyPicker } from '../../shared/DatePickers';
import { formatDisplayDate, parseDisplayDate } from '../../shared/date-format';
import { HttpFailure, type MasterNameCandidate } from '../../shared/http/client';
import { useSession } from '../../shared/http/use-session';
import { AdminSelect } from '../accounts/AdminSelect';
import css from '../accounts/Administration.module.css';
import { useDialogFeedback } from '../accounts/use-dialog-feedback';
import { WorkspaceDialog as Modal } from '../accounts/WorkspaceDialog';
import reviewCss from '../masters/MasterForms.module.css';
import dialogCss from '../seasons/SeasonCreateForm.module.css';

export type CatalogItem = {
  code: string;
  displayName: string;
  vietnameseLabel: string;
};

export type PlayerCatalogs = {
  positions: CatalogItem[];
  nationalities: CatalogItem[];
};

export type PlayerDetail = {
  id: string;
  code: string;
  fullName: string;
  birthDate: string;
  nationalityCode: string;
  nationality: CatalogItem;
  positionCode: string;
  position: CatalogItem;
  revision: string;
  portrait: { id: string; url: string; width: number; height: number } | null;
  capabilities: { canEdit: boolean };
};

function normalizeCodePreview(raw: string): string {
  return raw.trim().toUpperCase();
}

export function PlayerForm({
  catalogs,
  detail,
  correcting = false,
  onClose,
  onSaved,
  onRevisionConflict,
}: {
  catalogs: PlayerCatalogs;
  detail?: PlayerDetail;
  correcting?: boolean;
  onClose: () => void;
  onSaved: () => void;
  onRevisionConflict?: () => void;
}) {
  const { client } = useSession();
  const formId = useId();
  const [code, setCode] = useState(detail?.code ?? '');
  const [fullName, setFullName] = useState(detail?.fullName ?? '');
  const [birthDateText, setBirthDateText] = useState(
    detail ? formatDisplayDate(detail.birthDate) : '',
  );
  const [nationalityCode, setNationalityCode] = useState(detail?.nationalityCode ?? '');
  const [positionCode, setPositionCode] = useState(detail?.positionCode ?? '');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionBasis, setCorrectionBasis] = useState('');
  const [candidates, setCandidates] = useState<readonly MasterNameCandidate[]>();
  const [acknowledged, setAcknowledged] = useState(false);
  const [duplicateReason, setDuplicateReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reloadRequired, setReloadRequired] = useState(false);
  const feedbackRef = useDialogFeedback(error);

  const normalizedCode = normalizeCodePreview(code);
  const isEdit = !!detail;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || reloadRequired) return;

    const birthIso = parseDisplayDate(birthDateText);
    if (!isEdit && !/^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/.test(normalizedCode)) {
      setError(
        'Mã cầu thủ dài 1–32 ký tự, bắt đầu bằng chữ hoặc số và chỉ gồm chữ Latin, số, gạch dưới hoặc gạch ngang.',
      );
      return;
    }
    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên cầu thủ.');
      return;
    }
    if (!birthIso) {
      setError('Vui lòng nhập ngày sinh hợp lệ theo định dạng DD/MM/YYYY.');
      return;
    }
    if (!nationalityCode) {
      setError('Vui lòng chọn quốc tịch.');
      return;
    }
    if (!positionCode) {
      setError('Vui lòng chọn vị trí thi đấu.');
      return;
    }
    if (correcting && (!correctionReason.trim() || !correctionBasis.trim())) {
      setError('Vui lòng nhập đầy đủ lý do và căn cứ hiệu chỉnh.');
      return;
    }
    if (candidates && (!acknowledged || !duplicateReason.trim())) {
      setError('Vui lòng xác nhận đây là cầu thủ khác và nhập lý do xác nhận.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const duplicateReview = candidates
        ? {
            acknowledged: true as const,
            candidateIds: candidates.map((c) => c.id),
            reason: duplicateReason.trim(),
          }
        : undefined;

      if (isEdit && detail) {
        const body: Record<string, unknown> = {
          expectedRevision: detail.revision,
          fullName: fullName.trim(),
          birthDate: birthIso,
          nationalityCode,
          positionCode,
          ...(correcting
            ? {
                correctionReason: correctionReason.trim(),
                correctionBasis: correctionBasis.trim(),
              }
            : {}),
          ...(duplicateReview ? { duplicateReview } : {}),
        };
        await client.request(`/players/${detail.id}`, { method: 'PATCH', body });
      } else {
        const body: Record<string, unknown> = {
          code: normalizedCode,
          fullName: fullName.trim(),
          birthDate: birthIso,
          nationalityCode,
          positionCode,
          ...(duplicateReview ? { duplicateReview } : {}),
        };
        await client.request('/players', { method: 'POST', body });
      }
      onSaved();
    } catch (failure) {
      if (failure instanceof HttpFailure && failure.candidates?.length) {
        setCandidates(failure.candidates);
        setAcknowledged(false);
        setError(
          'Phát hiện hồ sơ cầu thủ trùng họ tên, ngày sinh và quốc tịch. Vui lòng kiểm tra trước khi tiếp tục.',
        );
      } else if (
        failure instanceof HttpFailure &&
        (failure.unknownOutcome || failure.code === 'REVISION_CONFLICT')
      ) {
        setReloadRequired(true);
        setError('Hồ sơ đã thay đổi từ một phiên làm việc khác. Vui lòng tải lại trước khi lưu.');
      } else {
        setError(failure instanceof Error ? failure.message : 'Không thể lưu hồ sơ cầu thủ.');
      }
    } finally {
      setBusy(false);
    }
  }

  const title = !isEdit
    ? 'Thêm hồ sơ cầu thủ'
    : correcting
      ? 'Hiệu chỉnh thông tin sai sót'
      : 'Cập nhật hồ sơ cầu thủ';

  return (
    <Modal
      open
      title={title}
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
        id={formId}
        className={`${css.form} ${dialogCss.form}`}
        onSubmit={(e) => void submit(e)}
      >
        {error && (
          <p role="alert" className={css.error}>
            {error}
          </p>
        )}

        <label>
          <span>Mã cầu thủ</span>
          <input
            value={code}
            disabled={isEdit || busy}
            maxLength={32}
            placeholder="Ví dụ: 007_PL"
            onChange={(event) => {
              setCode(event.target.value);
              setCandidates(undefined);
            }}
          />
          {isEdit ? (
            <small>Mã hồ sơ không thể thay đổi sau khi tạo.</small>
          ) : (
            normalizedCode && <small>Mã lưu trữ chuẩn hóa: {normalizedCode}</small>
          )}
        </label>

        <label>
          <span>Họ và tên</span>
          <input
            value={fullName}
            disabled={busy}
            maxLength={200}
            placeholder="Nhập họ và tên cầu thủ"
            onChange={(event) => {
              setFullName(event.target.value);
              setCandidates(undefined);
            }}
          />
        </label>

        <label>
          <span>Ngày sinh (DD/MM/YYYY)</span>
          <DateOnlyPicker
            label="Ngày sinh"
            initialDate={detail?.birthDate ?? null}
            disabled={busy}
            required
            onDateTextChange={(text) => {
              setBirthDateText(text);
              setCandidates(undefined);
            }}
          />
        </label>

        <AdminSelect
          label="Quốc tịch"
          hideLabel={false}
          searchable
          required
          disabled={busy}
          value={nationalityCode}
          options={[
            { value: '', label: 'Chọn quốc tịch' },
            ...catalogs.nationalities.map((nat) => ({
              value: nat.code,
              label: `${nat.vietnameseLabel} (${nat.code})`,
            })),
          ]}
          onChange={(value) => {
            setNationalityCode(value);
            setCandidates(undefined);
          }}
        />

        <AdminSelect
          label="Vị trí thi đấu"
          hideLabel={false}
          required
          disabled={busy}
          value={positionCode}
          options={[
            { value: '', label: 'Chọn vị trí thi đấu' },
            ...catalogs.positions.map((pos) => ({
              value: pos.code,
              label: `${pos.code} · ${pos.vietnameseLabel}`,
            })),
          ]}
          onChange={setPositionCode}
        />

        {correcting && (
          <div className={reviewCss.review}>
            <strong>Thông tin hiệu chỉnh</strong>
            <p>
              Hiệu chỉnh hồ sơ gốc không tự động ghi đè các hồ sơ tham dự hoặc đăng ký đã được phê
              duyệt trước đó.
            </p>
            <label>
              <span>Lý do hiệu chỉnh</span>
              <textarea
                rows={2}
                value={correctionReason}
                disabled={busy}
                maxLength={2000}
                placeholder="Mô tả sai sót cần hiệu chỉnh"
                onChange={(event) => setCorrectionReason(event.target.value)}
              />
            </label>
            <label>
              <span>Căn cứ hiệu chỉnh</span>
              <textarea
                rows={2}
                value={correctionBasis}
                disabled={busy}
                maxLength={2000}
                placeholder="Văn bản hoặc tài liệu đối chiếu"
                onChange={(event) => setCorrectionBasis(event.target.value)}
              />
            </label>
          </div>
        )}

        {candidates && candidates.length > 0 && (
          <div
            className={reviewCss.review}
            role="region"
            aria-label="Cảnh báo nghi ngờ trùng hồ sơ"
            style={{ display: 'grid', gap: 12, padding: 16 }}
          >
            <strong>Cảnh báo nghi ngờ trùng hồ sơ</strong>
            <p style={{ margin: 0, lineHeight: 1.55 }}>
              Hệ thống đã có hồ sơ trùng họ tên, ngày sinh và quốc tịch:
            </p>
            <ul style={{ margin: 0 }}>
              {candidates.map((candidate) => (
                <li key={candidate.id}>
                  <strong>{candidate.code}</strong> — {candidate.name}
                </li>
              ))}
            </ul>
            <label
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
                fontWeight: 400,
                lineHeight: 1.5,
              }}
            >
              <input
                type="checkbox"
                checked={acknowledged}
                disabled={busy}
                style={{
                  width: 18,
                  height: 18,
                  minHeight: 18,
                  padding: 0,
                  marginTop: 3,
                  flex: '0 0 auto',
                  accentColor: '#552cb6',
                }}
                onChange={(event) => setAcknowledged(event.target.checked)}
              />
              <span>Tôi đã kiểm tra và xác nhận đây là cầu thủ khác, không gộp hồ sơ.</span>
            </label>
            <label>
              <span>Lý do xác nhận</span>
              <textarea
                rows={2}
                value={duplicateReason}
                disabled={busy}
                maxLength={2000}
                placeholder="Nêu căn cứ xác nhận hai cầu thủ khác nhau"
                onChange={(event) => setDuplicateReason(event.target.value)}
              />
            </label>
          </div>
        )}

        <div className={css.actions}>
          <button type="button" onClick={onClose} disabled={busy}>
            Hủy
          </button>
          {reloadRequired ? (
            <button
              type="button"
              className={css.primary}
              data-primary
              onClick={onRevisionConflict ?? onSaved}
            >
              {onRevisionConflict ? 'Tải lại hồ sơ' : 'Tải lại danh sách'}
            </button>
          ) : (
            <button type="submit" className={css.primary} disabled={busy}>
              {busy
                ? 'Đang lưu…'
                : !isEdit
                  ? 'Tạo hồ sơ'
                  : correcting
                    ? 'Lưu hiệu chỉnh'
                    : 'Lưu thay đổi'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
