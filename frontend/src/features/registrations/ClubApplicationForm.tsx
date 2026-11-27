import { useId, useState, type FormEvent } from 'react';
import { HttpFailure } from '../../shared/http/client';
import { useSession } from '../../shared/http/use-session';
import { AdminSelect } from '../accounts/AdminSelect';
import css from '../accounts/Administration.module.css';
import { useDialogFeedback } from '../accounts/use-dialog-feedback';
import { WorkspaceDialog as Modal } from '../accounts/WorkspaceDialog';
import reviewCss from '../masters/MasterForms.module.css';
import dialogCss from '../seasons/SeasonCreateForm.module.css';
import pageCss from './ClubApplicationsPage.module.css';

export type ReferenceClub = {
  id: string;
  code: string;
  name: string;
  abbreviation: string;
  discontinuedAt: string | null;
};

export type ReferenceStadium = {
  id: string;
  code: string;
  name: string;
  location: string | null;
  discontinuedAt: string | null;
};

export type ReferencePlayer = {
  id: string;
  code: string;
  fullName: string;
  birthDate: string;
  nationalityCode: string;
  positionCode: string;
};

export type ClubApplicationReferences = {
  season: { id: string; code: string; name: string; state: 'OPEN' | 'CLOSED' };
  effectiveRegulation: {
    id: string;
    versionNumber: number;
    activeFrom: string | null;
    windows: { id: string; intakeKind: string; opensAt: string; closesAt: string }[];
  } | null;
  clubs: ReferenceClub[];
  stadiums: ReferenceStadium[];
  players: ReferencePlayer[];
  capabilities: { canPrepare: boolean; canApprove: boolean };
};

type DraftPlayerRow = {
  key: string;
  playerId: string;
  shirtNumber: string;
  notes: string;
};

export type InitialDraftValues = {
  caseId?: string;
  versionId?: string;
  versionNumber?: number;
  versionRevision?: string;
  clubId: string;
  coachName: string;
  homeStadiumId: string;
  representativeName: string;
  representativePhone: string;
  contactAddress: string;
  notes: string;
  proposedPlayers: { playerId: string; shirtNumber: number | null; notes: string | null }[];
};

export function ClubApplicationForm({
  seasonId,
  references,
  mode,
  initial,
  onClose,
  onSaved,
  onConflictReload,
}: {
  seasonId: string;
  references: ClubApplicationReferences;
  mode: 'create' | 'edit' | 'new-round';
  initial?: InitialDraftValues;
  onClose: () => void;
  onSaved: (caseId: string) => void;
  onConflictReload?: () => void;
}) {
  const { client } = useSession();
  const formId = useId();
  const [frozenInitial] = useState(() => initial);
  const [clubId, setClubId] = useState(frozenInitial?.clubId ?? '');
  const [coachName, setCoachName] = useState(frozenInitial?.coachName ?? '');
  const [homeStadiumId, setHomeStadiumId] = useState(frozenInitial?.homeStadiumId ?? '');
  const [representativeName, setRepresentativeName] = useState(
    frozenInitial?.representativeName ?? '',
  );
  const [representativePhone, setRepresentativePhone] = useState(
    frozenInitial?.representativePhone ?? '',
  );
  const [contactAddress, setContactAddress] = useState(frozenInitial?.contactAddress ?? '');
  const [notes, setNotes] = useState(frozenInitial?.notes ?? '');
  const [rows, setRows] = useState<DraftPlayerRow[]>(
    (frozenInitial?.proposedPlayers ?? []).map((item, idx) => ({
      key: `init-${idx}-${item.playerId}`,
      playerId: item.playerId,
      shirtNumber: item.shirtNumber ? String(item.shirtNumber) : '',
      notes: item.notes ?? '',
    })),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reloadRequired, setReloadRequired] = useState(false);
  const feedbackRef = useDialogFeedback(error);

  function addPlayerRow() {
    setRows((current) => [
      ...current,
      { key: `row-${Date.now()}-${current.length}`, playerId: '', shirtNumber: '', notes: '' },
    ]);
  }

  function updateRow(key: string, patch: Partial<DraftPlayerRow>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function removeRow(key: string) {
    setRows((current) => current.filter((row) => row.key !== key));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || reloadRequired) return;
    if (!clubId) {
      setError('Vui lòng chọn câu lạc bộ.');
      return;
    }

    const proposedPlayers: {
      playerId: string;
      shirtNumber: number | null;
      notes: string | null;
    }[] = [];
    const seen = new Set<string>();
    for (const row of rows) {
      if (!row.playerId) continue;
      if (seen.has(row.playerId)) {
        setError('Danh sách cầu thủ dự kiến không được chứa cầu thủ trùng lặp.');
        return;
      }
      seen.add(row.playerId);
      let parsedShirt: number | null = null;
      if (row.shirtNumber.trim()) {
        const num = Number(row.shirtNumber.trim());
        if (!Number.isInteger(num) || num < 1 || num > 99) {
          setError('Số áo dự kiến phải là số nguyên từ 1 đến 99.');
          return;
        }
        parsedShirt = num;
      }
      proposedPlayers.push({
        playerId: row.playerId,
        shirtNumber: parsedShirt,
        notes: row.notes.trim() || null,
      });
    }

    setBusy(true);
    setError('');
    try {
      if (
        mode === 'edit' &&
        frozenInitial?.caseId &&
        frozenInitial?.versionId &&
        frozenInitial?.versionRevision
      ) {
        await client.request(`/club-applications/${frozenInitial.caseId}/draft`, {
          method: 'PATCH',
          body: {
            versionId: frozenInitial.versionId,
            expectedRevision: frozenInitial.versionRevision,
            coachName: coachName.trim() || null,
            homeStadiumId: homeStadiumId || null,
            representativeName: representativeName.trim() || null,
            representativePhone: representativePhone.trim() || null,
            contactAddress: contactAddress.trim() || null,
            notes: notes.trim() || null,
            proposedPlayers,
          },
        });
        onSaved(frozenInitial.caseId);
      } else {
        const response = await client.request<{ caseId: string }>(
          `/seasons/${seasonId}/club-applications`,
          {
            method: 'POST',
            body: {
              clubId,
              coachName: coachName.trim() || null,
              homeStadiumId: homeStadiumId || null,
              representativeName: representativeName.trim() || null,
              representativePhone: representativePhone.trim() || null,
              contactAddress: contactAddress.trim() || null,
              notes: notes.trim() || null,
              proposedPlayers,
            },
          },
        );
        onSaved(response.data.caseId);
      }
    } catch (failure) {
      if (
        failure instanceof HttpFailure &&
        (failure.unknownOutcome || failure.code === 'REVISION_CONFLICT')
      ) {
        setReloadRequired(true);
        setError('Hồ sơ đã thay đổi từ một phiên làm việc khác. Vui lòng tải lại trước khi lưu.');
      } else {
        setError(failure instanceof Error ? failure.message : 'Không thể lưu bản nháp hồ sơ.');
      }
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === 'edit'
      ? 'Chỉnh sửa bản nháp hồ sơ tham dự'
      : mode === 'new-round'
        ? 'Tạo phiên bản bổ sung mới trong cùng hồ sơ'
        : 'Tạo hồ sơ đăng ký tham dự câu lạc bộ';

  return (
    <Modal
      open
      title={title}
      width={740}
      className={pageCss.phase3Modal}
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

        {mode === 'new-round' && frozenInitial?.versionNumber && (
          <p className={pageCss.metaNote}>
            Khởi tạo từ Phiên bản {frozenInitial.versionNumber}.
          </p>
        )}

        <AdminSelect
          label="Câu lạc bộ"
          hideLabel={false}
          searchable
          required
          disabled={mode !== 'create' || busy}
          value={clubId}
          options={[
            { value: '', label: 'Chọn câu lạc bộ' },
            ...references.clubs.map((c) => ({
              value: c.id,
              label: `${c.name} (${c.code})${c.discontinuedAt ? ' · Đã ngừng sử dụng' : ''}`,
              disabled: mode === 'create' && !!c.discontinuedAt,
            })),
          ]}
          onChange={setClubId}
        />

        <div className={pageCss.formGrid2}>
          <label>
            <span>Huấn luyện viên trưởng</span>
            <input
              value={coachName}
              disabled={busy}
              maxLength={200}
              placeholder="Nhập họ tên huấn luyện viên trưởng"
              onChange={(event) => setCoachName(event.target.value)}
            />
          </label>

          <AdminSelect
            label="Sân nhà đăng ký"
            hideLabel={false}
            searchable
            disabled={busy}
            value={homeStadiumId}
            options={[
              { value: '', label: 'Chọn sân nhà đăng ký' },
              ...references.stadiums.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.code})${s.discontinuedAt ? ' · Đã ngừng sử dụng' : ''}`,
                disabled: !!s.discontinuedAt && s.id !== homeStadiumId,
              })),
            ]}
            onChange={setHomeStadiumId}
          />
        </div>

        <div className={pageCss.formGrid2}>
          <label>
            <span>Người đại diện</span>
            <input
              value={representativeName}
              disabled={busy}
              maxLength={200}
              placeholder="Nhập họ tên người đại diện câu lạc bộ"
              onChange={(event) => setRepresentativeName(event.target.value)}
            />
          </label>

          <label>
            <span>Số điện thoại đại diện</span>
            <input
              value={representativePhone}
              disabled={busy}
              maxLength={32}
              placeholder="Ví dụ: +44 (20) 7946-0123 hoặc 0901234567"
              onChange={(event) => setRepresentativePhone(event.target.value)}
            />
          </label>
        </div>

        <div className={pageCss.formGrid2}>
          <label>
            <span>Địa chỉ liên hệ</span>
            <textarea
              rows={2}
              value={contactAddress}
              disabled={busy}
              maxLength={500}
              placeholder="Nhập địa chỉ trụ sở hoặc địa chỉ liên hệ chính thức"
              onChange={(event) => setContactAddress(event.target.value)}
            />
          </label>

          <label>
            <span>Ghi chú (không bắt buộc)</span>
            <textarea
              rows={2}
              value={notes}
              disabled={busy}
              maxLength={2000}
              placeholder="Thông tin bổ sung cho quá trình tiếp nhận"
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </div>

        <div className={reviewCss.review}>
          <div className={css.sectionHeader} style={{ marginBottom: rows.length > 0 ? 10 : 0 }}>
            <strong>Danh sách cầu thủ dự kiến ({rows.length})</strong>
            <button type="button" onClick={addPlayerRow} disabled={busy}>
              Thêm cầu thủ
            </button>
          </div>
          {rows.length > 0 && (
            <div className={pageCss.proposedList}>
              {rows.map((row) => (
                <div key={row.key} className={pageCss.proposedRow}>
                  <AdminSelect
                    label="Chọn cầu thủ dự kiến"
                    searchable
                    disabled={busy}
                    value={row.playerId}
                    options={[
                      { value: '', label: 'Chọn cầu thủ' },
                      ...references.players.map((p) => ({
                        value: p.id,
                        label: `${p.fullName} (${p.code} · ${p.positionCode})`,
                      })),
                    ]}
                    onChange={(value) => updateRow(row.key, { playerId: value })}
                  />
                  <input
                    aria-label="Số áo dự kiến"
                    value={row.shirtNumber}
                    disabled={busy}
                    inputMode="numeric"
                    placeholder="Số áo"
                    onChange={(event) => updateRow(row.key, { shirtNumber: event.target.value })}
                  />
                  <button
                    type="button"
                    className={css.danger}
                    disabled={busy}
                    onClick={() => removeRow(row.key)}
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={css.actions}>
          <button type="button" onClick={onClose} disabled={busy}>
            Hủy
          </button>
          {reloadRequired ? (
            <button
              type="button"
              className={css.primary}
              data-primary
              onClick={onConflictReload ?? onClose}
            >
              {onConflictReload ? 'Tải lại hồ sơ' : 'Tải lại danh sách'}
            </button>
          ) : (
            <button type="submit" className={css.primary} disabled={busy}>
              {busy ? 'Đang lưu…' : 'Lưu bản nháp'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
