import { useId, useState, type FormEvent } from 'react';
import { formatDisplayDate } from '../../shared/date-format';
import { DateTimePicker } from '../../shared/DatePickers';
import { HttpFailure, type FieldErrorDetail } from '../../shared/http/client';
import { useSession } from '../../shared/http/use-session';
import { AdminSelect } from '../accounts/AdminSelect';
import css from '../accounts/Administration.module.css';
import { useDialogFeedback } from '../accounts/use-dialog-feedback';
import { WorkspaceDialog as Modal } from '../accounts/WorkspaceDialog';
import { hcmInputToUtcInstant, utcInstantToHcmInput } from '../regulations/regulation-model';
import dialogCss from '../seasons/SeasonCreateForm.module.css';
import pageCss from './ClubApplicationsPage.module.css';
import regPageCss from './PlayerRegistrationsPage.module.css';

export type ReferenceRegistrationClub = {
  id: string;
  code: string;
  name: string;
  abbreviation: string;
  discontinuedAt: string | null;
  hasApprovedApplication: boolean;
  acceptedApplicationVersionId: string | null;
};

export type ReferenceRegistrationPlayer = {
  id: string;
  code: string;
  fullName: string;
  birthDate: string;
  nationalityCode: string;
  positionCode: string;
};

export type EffectiveRegistrationRegulation = {
  id: string;
  versionNumber: number;
  activeFrom: string | null;
  squadLimit: number | null;
  nonHomegrownLimit: number | null;
  homegrownSeasons: number | null;
  homegrownMonths: number | null;
  homegrownAgeStart: number | null;
  homegrownAgeEnd: number | null;
  u21Cutoff: string | null;
  windows: { id: string; intakeKind: string; opensAt: string; closesAt: string }[];
};

export type PlayerRegistrationReferences = {
  season: { id: string; code: string; name: string; state: 'OPEN' | 'CLOSED' };
  effectiveRegulation: EffectiveRegistrationRegulation | null;
  clubs: ReferenceRegistrationClub[];
  players: ReferenceRegistrationPlayer[];
  capabilities: { canManage: boolean; canDecideExceptions: boolean };
};

export type RegistrationInitialDraftValues = {
  caseId: string;
  versionId: string;
  versionNumber: number;
  versionRevision: string;
  clubId: string;
  playerId: string;
  shirtNumber: number | null;
  playingStart: string | null;
  playingEnd: string | null;
  nonHomegrownOptIn: boolean;
  evidenceBranch: 'SEASONS' | 'MONTHS' | null;
  qualifyingValue: number | null;
  evidenceSummary: string | null;
  evidenceReference: string | null;
  affiliatedAssociationBasis: boolean | null;
  notes: string | null;
};

function clubOptionLabel(club: ReferenceRegistrationClub): string {
  const status = club.discontinuedAt
    ? ' — Đã ngừng hoạt động'
    : club.hasApprovedApplication
      ? ' — Đã duyệt hồ sơ tham dự'
      : ' — Chưa duyệt hồ sơ tham dự';
  return `${club.name} (${club.code})${status}`;
}

export function PlayerRegistrationForm({
  seasonId,
  references,
  mode,
  initial,
  onClose,
  onSaved,
  onConflictReload,
}: {
  seasonId: string;
  references: PlayerRegistrationReferences;
  mode: 'create' | 'edit';
  initial?: RegistrationInitialDraftValues;
  onClose: () => void;
  onSaved: (caseId: string) => void;
  onConflictReload?: () => void;
}) {
  const { client } = useSession();
  const formId = useId();
  const [frozenInitial] = useState(() => initial);

  const [clubId, setClubId] = useState(frozenInitial?.clubId ?? '');
  const [playerId, setPlayerId] = useState(frozenInitial?.playerId ?? '');
  const [shirtNumber, setShirtNumber] = useState(
    frozenInitial?.shirtNumber !== null && frozenInitial?.shirtNumber !== undefined
      ? String(frozenInitial.shirtNumber)
      : '',
  );
  const [playingStart, setPlayingStart] = useState(
    frozenInitial?.playingStart ? utcInstantToHcmInput(frozenInitial.playingStart) : '',
  );
  const [playingEnd, setPlayingEnd] = useState(
    frozenInitial?.playingEnd ? utcInstantToHcmInput(frozenInitial.playingEnd) : '',
  );
  const [nonHomegrownOptIn, setNonHomegrownOptIn] = useState(
    frozenInitial?.nonHomegrownOptIn ?? false,
  );
  const [evidenceBranch, setEvidenceBranch] = useState<string>(frozenInitial?.evidenceBranch ?? '');
  const [qualifyingValue, setQualifyingValue] = useState(
    frozenInitial?.qualifyingValue !== null && frozenInitial?.qualifyingValue !== undefined
      ? String(frozenInitial.qualifyingValue)
      : '',
  );
  const [affiliatedBasis, setAffiliatedBasis] = useState<string>(
    frozenInitial?.affiliatedAssociationBasis === true
      ? 'YES'
      : frozenInitial?.affiliatedAssociationBasis === false
        ? 'NO'
        : '',
  );
  const [evidenceSummary, setEvidenceSummary] = useState(frozenInitial?.evidenceSummary ?? '');
  const [evidenceReference, setEvidenceReference] = useState(
    frozenInitial?.evidenceReference ?? '',
  );
  const [notes, setNotes] = useState(frozenInitial?.notes ?? '');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<readonly FieldErrorDetail[]>([]);
  const [reloadRequired, setReloadRequired] = useState(false);
  const feedbackRef = useDialogFeedback(error);

  function clearValidationFeedback() {
    if (!reloadRequired) {
      if (error) setError('');
      if (errorDetails.length > 0) setErrorDetails([]);
    }
  }

  const selectedPlayer = references.players.find((p) => p.id === playerId);
  const effectiveReg = references.effectiveRegulation;
  const playerIsU21 =
    !!selectedPlayer &&
    !!effectiveReg?.u21Cutoff &&
    selectedPlayer.birthDate >= effectiveReg.u21Cutoff;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setErrorDetails([]);
    if (!clubId) {
      setError('Vui lòng chọn câu lạc bộ.');
      return;
    }
    if (!playerId) {
      setError('Vui lòng chọn cầu thủ.');
      return;
    }

    let parsedShirt: number | null = null;
    if (shirtNumber.trim()) {
      const n = Number(shirtNumber.trim());
      if (!Number.isInteger(n) || n < 1 || n > 99) {
        setError('Số áo đăng ký phải là số nguyên từ 1 đến 99.');
        return;
      }
      parsedShirt = n;
    }

    let startIso: string | null = null;
    if (playingStart.trim()) {
      const converted = hcmInputToUtcInstant(playingStart.trim());
      if (!converted) {
        setError('Thời điểm bắt đầu hiệu lực thi đấu không hợp lệ (định dạng DD/MM/YYYY HH:mm).');
        return;
      }
      startIso = converted;
    }

    let endIso: string | null = null;
    if (playingEnd.trim()) {
      const converted = hcmInputToUtcInstant(playingEnd.trim());
      if (!converted) {
        setError('Thời điểm kết thúc dự kiến không hợp lệ (định dạng DD/MM/YYYY HH:mm).');
        return;
      }
      endIso = converted;
    }

    if (startIso && endIso && new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      setError('Thời điểm kết thúc dự kiến phải lớn hơn thời điểm bắt đầu hiệu lực thi đấu.');
      return;
    }

    let parsedQualifying: number | null = null;
    if (qualifyingValue.trim()) {
      const q = Number(qualifyingValue.trim());
      if (!Number.isInteger(q) || q < 0 || q > 1000) {
        setError('Giá trị tích lũy đào tạo nội địa phải là số nguyên từ 0 đến 1000.');
        return;
      }
      parsedQualifying = q;
    }

    const parsedAffiliated =
      affiliatedBasis === 'YES' ? true : affiliatedBasis === 'NO' ? false : null;

    const payload = {
      shirtNumber: parsedShirt,
      playingStart: startIso,
      playingEnd: endIso,
      nonHomegrownOptIn,
      evidenceBranch:
        evidenceBranch === 'SEASONS' || evidenceBranch === 'MONTHS' ? evidenceBranch : null,
      qualifyingValue: parsedQualifying,
      evidenceSummary: evidenceSummary.trim() || null,
      evidenceReference: evidenceReference.trim() || null,
      affiliatedAssociationBasis: parsedAffiliated,
      notes: notes.trim() || null,
    };

    setBusy(true);
    setError('');
    setErrorDetails([]);
    setReloadRequired(false);
    try {
      if (mode === 'edit' && frozenInitial) {
        const res = await client.request<{ caseId: string }>(
          `/player-registrations/${frozenInitial.caseId}/draft`,
          {
            method: 'PATCH',
            body: {
              versionId: frozenInitial.versionId,
              expectedRevision: frozenInitial.versionRevision,
              ...payload,
            },
          },
        );
        onSaved(res.data.caseId);
      } else {
        const res = await client.request<{ caseId: string }>(
          `/seasons/${seasonId}/player-registrations`,
          {
            method: 'POST',
            body: {
              clubId,
              playerId,
              ...payload,
            },
          },
        );
        onSaved(res.data.caseId);
      }
    } catch (caught) {
      if (caught instanceof HttpFailure) {
        setError(caught.message);
        setErrorDetails(caught.details ?? []);
        if (
          caught.code === 'REVISION_CONFLICT' ||
          caught.code === 'STATE_CONFLICT' ||
          caught.code === 'BASIS_CHANGED'
        ) {
          setReloadRequired(true);
        }
      } else {
        setError('Không thể lưu bản nháp đăng ký cầu thủ. Vui lòng thử lại.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      title={
        mode === 'edit' && frozenInitial
          ? `Chỉnh sửa bản nháp (Phiên bản ${frozenInitial.versionNumber})`
          : 'Tạo bản nháp đăng ký cầu thủ'
      }
      width={760}
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
        onChange={clearValidationFeedback}
        className={`${css.form} ${dialogCss.form}`}
        noValidate
      >
        {error && (
          <div role="alert" className={css.error}>
            <p style={{ margin: 0 }}>{error}</p>
            {errorDetails.length > 0 && (
              <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
                {errorDetails.map((item, idx) => (
                  <li key={`${item.field}-${idx}`}>{item.message ?? item.code}</li>
                ))}
              </ul>
            )}
            {reloadRequired && onConflictReload && (
              <div style={{ marginTop: 8 }}>
                <button type="button" onClick={onConflictReload}>
                  Tải lại hồ sơ mới nhất
                </button>
              </div>
            )}
          </div>
        )}

        <div className={regPageCss.twoColRow}>
          <div>
            <AdminSelect
              label="Câu lạc bộ *"
              hideLabel={false}
              value={clubId}
              disabled={mode === 'edit' || busy}
              searchable
              options={[
                { value: '', label: 'Chọn câu lạc bộ' },
                ...references.clubs.map((club) => ({
                  value: club.id,
                  label: clubOptionLabel(club),
                })),
              ]}
              onChange={setClubId}
            />
            {mode === 'edit' && (
              <p className={pageCss.metaNote} style={{ marginTop: 4 }}>
                Câu lạc bộ cố định theo hồ sơ đăng ký đã tạo.
              </p>
            )}
          </div>
          <div>
            <AdminSelect
              label="Cầu thủ *"
              hideLabel={false}
              value={playerId}
              disabled={mode === 'edit' || busy}
              searchable
              options={[
                { value: '', label: 'Chọn cầu thủ' },
                ...references.players.map((player) => ({
                  value: player.id,
                  label: `${player.fullName} (${player.code} · ${formatDisplayDate(player.birthDate)})`,
                })),
              ]}
              onChange={setPlayerId}
            />
            {mode === 'edit' && (
              <p className={pageCss.metaNote} style={{ marginTop: 4 }}>
                Hồ sơ cầu thủ cố định theo lượt đăng ký này.
              </p>
            )}
          </div>
        </div>

        <div className={regPageCss.twoColRow}>
          <label>
            Số áo đăng ký (1–99)
            <input
              type="number"
              min={1}
              max={99}
              inputMode="numeric"
              value={shirtNumber}
              disabled={busy}
              placeholder="Ví dụ: 10"
              onChange={(event) => setShirtNumber(event.target.value)}
            />
          </label>
          <div className={regPageCss.checkboxField}>
            <span className={regPageCss.checkboxLabelTitle}>Tùy chọn diện đào tạo nội địa</span>
            <label className={regPageCss.checkboxCard}>
              <input
                type="checkbox"
                checked={nonHomegrownOptIn}
                disabled={busy}
                onChange={(event) => setNonHomegrownOptIn(event.target.checked)}
              />
              <span>Xử lý diện cầu thủ ngoài đào tạo nội địa</span>
            </label>
          </div>
        </div>

        <div className={regPageCss.twoColRow}>
          <label>
            Bắt đầu hiệu lực thi đấu
            <DateTimePicker
              label="Bắt đầu hiệu lực thi đấu"
              value={playingStart}
              disabled={busy}
              onChange={setPlayingStart}
            />
            <span className={regPageCss.cellSub}>
              Định dạng DD/MM/YYYY HH:mm (giờ Việt Nam). Cần lớn hơn hoặc bằng thời điểm xác nhận.
            </span>
          </label>
          <label>
            Kết thúc hiệu lực dự kiến (tùy chọn)
            <DateTimePicker
              label="Kết thúc hiệu lực dự kiến"
              value={playingEnd}
              disabled={busy}
              onChange={setPlayingEnd}
            />
            <span className={regPageCss.cellSub}>Để trống nếu chưa ấn định ngày kết thúc.</span>
          </label>
        </div>

        <section className={regPageCss.evidenceSection} aria-label="Xác minh đào tạo nội địa">
          <div className={regPageCss.evidenceHeader}>
            <h3>Xác minh điều kiện đào tạo nội địa</h3>
            {effectiveReg && (
              <span className={regPageCss.cellSub}>
                Ngưỡng hiện hành: tối thiểu {effectiveReg.homegrownSeasons ?? '—'} mùa hoặc{' '}
                {effectiveReg.homegrownMonths ?? '—'} tháng
                {effectiveReg.homegrownAgeStart !== null && effectiveReg.homegrownAgeEnd !== null
                  ? ` (độ tuổi ${effectiveReg.homegrownAgeStart}–${effectiveReg.homegrownAgeEnd})`
                  : ''}
              </span>
            )}
          </div>

          {nonHomegrownOptIn ? (
            <p className={pageCss.metaNote}>
              Cầu thủ đang được chọn xử lý theo diện ngoài đào tạo nội địa nên không yêu cầu minh
              chứng đào tạo nội địa.
            </p>
          ) : playerIsU21 ? (
            <p className={pageCss.metaNote}>
              Cầu thủ sinh ngày {formatDisplayDate(selectedPlayer.birthDate)}, đạt diện cầu thủ trẻ
              U21 theo quy định hiện hành (từ {formatDisplayDate(effectiveReg!.u21Cutoff!)} trở về
              sau) nên không bắt buộc xác minh đào tạo nội địa.
            </p>
          ) : (
            <p className={pageCss.metaNote}>
              Quốc tịch không thay thế căn cứ đào tạo nội địa. Cần xác minh đầy đủ minh chứng hoặc
              chọn xử lý diện ngoài đào tạo nội địa nếu còn hạn mức.
            </p>
          )}

          <div className={regPageCss.evidenceGridThree}>
            <AdminSelect
              label="Nhánh xác minh"
              hideLabel={false}
              value={evidenceBranch}
              disabled={busy || nonHomegrownOptIn}
              options={[
                { value: '', label: 'Chưa chọn nhánh' },
                { value: 'SEASONS', label: 'Theo số mùa giải' },
                { value: 'MONTHS', label: 'Theo số tháng đào tạo' },
              ]}
              onChange={setEvidenceBranch}
            />
            <label>
              Giá trị tích lũy
              <input
                type="number"
                min={0}
                max={1000}
                inputMode="numeric"
                value={qualifyingValue}
                disabled={busy || nonHomegrownOptIn}
                placeholder="Ví dụ: 3 hoặc 36"
                onChange={(event) => setQualifyingValue(event.target.value)}
              />
            </label>
            <AdminSelect
              label="CLB thuộc LĐBĐ Anh / Xứ Wales"
              hideLabel={false}
              value={affiliatedBasis}
              disabled={busy || nonHomegrownOptIn}
              options={[
                { value: '', label: 'Chưa xác nhận' },
                { value: 'YES', label: 'Đáp ứng điều kiện' },
                { value: 'NO', label: 'Không đáp ứng' },
              ]}
              onChange={setAffiliatedBasis}
            />
          </div>

          <div className={regPageCss.twoColRow}>
            <label>
              Tóm tắt minh chứng đào tạo
              <input
                type="text"
                maxLength={1000}
                value={evidenceSummary}
                disabled={busy || nonHomegrownOptIn}
                placeholder="Mô tả ngắn quá trình đào tạo hợp lệ…"
                onChange={(event) => setEvidenceSummary(event.target.value)}
              />
            </label>
            <label>
              Mã tham chiếu hồ sơ xác minh
              <input
                type="text"
                maxLength={300}
                value={evidenceReference}
                disabled={busy || nonHomegrownOptIn}
                placeholder="Ví dụ: HS-DTND-2026-01"
                onChange={(event) => setEvidenceReference(event.target.value)}
              />
            </label>
          </div>
        </section>

        <label>
          Ghi chú nội bộ
          <textarea
            rows={2}
            maxLength={2000}
            value={notes}
            disabled={busy}
            placeholder="Thông tin bổ sung cho quá trình rà soát đăng ký…"
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>

        <div className={css.actions}>
          <button type="button" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className={css.primary} disabled={busy}>
            {busy ? 'Đang lưu…' : 'Lưu bản nháp'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
