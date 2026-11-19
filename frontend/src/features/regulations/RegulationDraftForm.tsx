import { WorkspaceDialog as Modal } from '../accounts/WorkspaceDialog';
import { isValidElement } from 'react';
import { AdminSelect } from '../accounts/AdminSelect';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { HttpFailure } from '../../shared/http/client';
import { useSession } from '../../shared/http/use-session';
import { DateOnlyPicker, DateTimePicker } from '../../shared/DatePickers';
import { parseDisplayDate } from '../../shared/date-format';
import type { FieldErrorDetail } from '../../shared/http/client';
import {
  applySourceProposedValues,
  codePointLength,
  draftContentFromForm,
  formatRegulationDate,
  formValuesFromContent,
  hcmInputToUtcInstant,
  intakeKindLabels,
  normalizeRegulationCode,
  normalizeRegulationText,
  rankingCriterionLabels,
  type CardMeaning,
  type EffectiveMode,
  type RankingCriterion,
  type RegulationFormValues,
  type RegulationVersionDetail,
} from './regulation-model';
import css from './RegulationVersionsPage.module.css';

type Props = {
  detail: RegulationVersionDetail;
  canEdit: boolean;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
};

type Baseline = { revision: string; values: RegulationFormValues };
type ConflictReview = {
  latest: RegulationVersionDetail;
  latestValues: RegulationFormValues;
  attemptedValues: RegulationFormValues;
  changedFields: FormField[];
};
type FieldErrors = Record<string, string>;
type FormField = keyof RegulationFormValues;
type ProposalKind = 'source-values' | 'relegation-count' | null;

const fieldKeys: FormField[] = [
  'effectiveMode',
  'proposedEffectiveAt',
  'squadLimit',
  'nonHomegrownLimit',
  'homegrownSeasons',
  'homegrownMonths',
  'homegrownAgeStart',
  'homegrownAgeEnd',
  'u21Cutoff',
  'clubCount',
  'formatCode',
  'legs',
  'plannedMinutes',
  'preparationMinutes',
  'releaseMinutes',
  'winPoints',
  'drawPoints',
  'lossPoints',
  'qualificationCount',
  'relegationCount',
  'registrationWindows',
  'rankingPriority',
  'goalTypes',
  'cardTypes',
];

const fieldLabels: Record<FormField, string> = {
  effectiveMode: 'Cách đề xuất hiệu lực',
  proposedEffectiveAt: 'Thời điểm hiệu lực dự kiến',
  squadLimit: 'Giới hạn danh sách cầu thủ',
  nonHomegrownLimit: 'Giới hạn cầu thủ không thuộc diện đào tạo trong nước',
  homegrownSeasons: 'Số mùa đào tạo tối thiểu',
  homegrownMonths: 'Số tháng đào tạo tối thiểu',
  homegrownAgeStart: 'Độ tuổi đào tạo từ',
  homegrownAgeEnd: 'Độ tuổi đào tạo đến',
  u21Cutoff: 'Ngày sinh giới hạn U21',
  clubCount: 'Số câu lạc bộ',
  formatCode: 'Thể thức',
  legs: 'Số lượt',
  plannedMinutes: 'Thời lượng thi đấu dự kiến (phút)',
  preparationMinutes: 'Thời gian chuẩn bị (phút)',
  releaseMinutes: 'Thời gian nghỉ sau trận (phút)',
  winPoints: 'Điểm thắng',
  drawPoints: 'Điểm hòa',
  lossPoints: 'Điểm thua',
  qualificationCount: 'Số vị trí giành quyền tham dự (Q)',
  relegationCount: 'Số vị trí xuống hạng (R)',
  registrationWindows: 'Đợt tiếp nhận hồ sơ',
  rankingPriority: 'Thứ tự tiêu chí xếp hạng',
  goalTypes: 'Danh mục loại bàn thắng',
  cardTypes: 'Danh mục loại thẻ',
};

const numberFields: {
  key: Exclude<
    FormField,
    | 'effectiveMode'
    | 'proposedEffectiveAt'
    | 'u21Cutoff'
    | 'formatCode'
    | 'registrationWindows'
    | 'rankingPriority'
    | 'goalTypes'
    | 'cardTypes'
  >;
  label: string;
  positive?: boolean;
  allowNegative?: boolean;
}[] = [
  { key: 'squadLimit', label: 'Giới hạn danh sách cầu thủ' },
  { key: 'nonHomegrownLimit', label: 'Giới hạn cầu thủ không thuộc diện đào tạo trong nước' },
  { key: 'homegrownSeasons', label: 'Số mùa đào tạo tối thiểu', positive: true },
  { key: 'homegrownMonths', label: 'Số tháng đào tạo tối thiểu', positive: true },
  { key: 'homegrownAgeStart', label: 'Độ tuổi đào tạo từ', positive: true },
  { key: 'homegrownAgeEnd', label: 'Độ tuổi đào tạo đến', positive: true },
  { key: 'clubCount', label: 'Số câu lạc bộ' },
  { key: 'legs', label: 'Số lượt' },
  { key: 'plannedMinutes', label: 'Thời lượng thi đấu dự kiến (phút)', positive: true },
  { key: 'preparationMinutes', label: 'Thời gian chuẩn bị (phút)' },
  { key: 'releaseMinutes', label: 'Thời gian nghỉ sau trận (phút)' },
  { key: 'winPoints', label: 'Điểm thắng', allowNegative: true },
  { key: 'drawPoints', label: 'Điểm hòa', allowNegative: true },
  { key: 'lossPoints', label: 'Điểm thua', allowNegative: true },
  { key: 'qualificationCount', label: 'Số vị trí giành quyền tham dự (Q)' },
  { key: 'relegationCount', label: 'Số vị trí xuống hạng (R)' },
];

const criteria: RankingCriterion[] = ['POINTS', 'GOAL_DIFFERENCE', 'GOALS_FOR'];
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

function cloneValues(values: RegulationFormValues): RegulationFormValues {
  return structuredClone(values);
}

function changedFields(left: RegulationFormValues, right: RegulationFormValues): FormField[] {
  return fieldKeys.filter((key) => JSON.stringify(left[key]) !== JSON.stringify(right[key]));
}

function errorMap(details: readonly FieldErrorDetail[] | undefined): FieldErrors {
  const errors: FieldErrors = {};
  for (const detail of details ?? [])
    errors[detail.field] = detail.message ?? 'Vui lòng kiểm tra giá trị.';
  return errors;
}

function validate(values: RegulationFormValues): FieldErrors {
  const errors: FieldErrors = {};
  for (const item of numberFields) {
    const value = values[item.key];
    if (value === null) continue;
    if (!Number.isSafeInteger(value) || Math.abs(value) > 2_147_483_647)
      errors[item.key] = `${item.label} vượt phạm vi số nguyên được hỗ trợ.`;
    else if (item.positive ? value <= 0 : !item.allowNegative && value < 0)
      errors[item.key] = item.positive
        ? `${item.label} phải lớn hơn 0.`
        : `${item.label} không được nhỏ hơn 0.`;
  }
  if (
    values.homegrownAgeStart !== null &&
    values.homegrownAgeEnd !== null &&
    values.homegrownAgeStart >= values.homegrownAgeEnd
  )
    errors.homegrownAgeEnd = 'Độ tuổi kết thúc phải lớn hơn độ tuổi bắt đầu.';
  if (
    values.clubCount !== null &&
    (values.clubCount < 4 || values.clubCount > 20 || values.clubCount % 2 !== 0)
  )
    errors.clubCount = 'Số câu lạc bộ phải là số chẵn từ 4 đến 20.';
  if (values.legs !== null && values.legs !== 2) errors.legs = 'Thể thức hiện hỗ trợ 2 lượt.';
  if (values.u21Cutoff !== null && !validCalendarDate(values.u21Cutoff))
    errors.u21Cutoff = 'Nhập ngày hợp lệ theo định dạng DD/MM/YYYY.';
  if (values.effectiveMode === 'IMMEDIATE' && values.proposedEffectiveAt)
    errors.proposedEffectiveAt = 'Đề xuất hiệu lực ngay không nhận thời điểm do người dùng chọn.';
  if (
    values.effectiveMode === 'SCHEDULED' &&
    values.proposedEffectiveAt &&
    !hcmInputToUtcInstant(values.proposedEffectiveAt)
  )
    errors.proposedEffectiveAt = 'Nhập thời điểm hợp lệ theo giờ Việt Nam.';
  if (
    values.winPoints !== null &&
    values.drawPoints !== null &&
    values.lossPoints !== null &&
    !(values.winPoints > values.drawPoints && values.drawPoints > values.lossPoints)
  )
    errors.winPoints = 'Điểm thắng phải lớn hơn điểm hòa, và điểm hòa phải lớn hơn điểm thua.';
  if (
    values.clubCount !== null &&
    values.qualificationCount !== null &&
    values.relegationCount !== null &&
    (values.relegationCount >= values.clubCount ||
      values.qualificationCount + values.relegationCount > values.clubCount)
  )
    errors.relegationCount = 'Q và R không được vượt số câu lạc bộ; R phải nhỏ hơn N.';

  const utcRegistrationWindows = values.registrationWindows.map((window) => ({
    opensAt: hcmInputToUtcInstant(window.opensAt),
    closesAt: hcmInputToUtcInstant(window.closesAt),
  }));
  values.registrationWindows.forEach((window, index) => {
    const currentInstants = utcRegistrationWindows[index];
    if (!window.opensAt) errors[`registrationWindows[${index}].opensAt`] = 'Chọn thời điểm mở.';
    else if (!currentInstants.opensAt)
      errors[`registrationWindows[${index}].opensAt`] = 'Thời điểm mở không hợp lệ.';
    if (!window.closesAt) errors[`registrationWindows[${index}].closesAt`] = 'Chọn thời điểm đóng.';
    else if (!currentInstants.closesAt)
      errors[`registrationWindows[${index}].closesAt`] = 'Thời điểm đóng không hợp lệ.';
    if (
      currentInstants.opensAt &&
      currentInstants.closesAt &&
      currentInstants.opensAt >= currentInstants.closesAt
    )
      errors[`registrationWindows[${index}].closesAt`] = 'Thời điểm đóng phải sau thời điểm mở.';
    values.registrationWindows.slice(0, index).forEach((prior, priorIndex) => {
      const priorInstants = utcRegistrationWindows[priorIndex];
      if (
        prior.intakeKind === window.intakeKind &&
        currentInstants.opensAt &&
        currentInstants.closesAt &&
        priorInstants.opensAt &&
        priorInstants.closesAt &&
        currentInstants.opensAt < priorInstants.closesAt &&
        priorInstants.opensAt < currentInstants.closesAt
      )
        errors[`registrationWindows[${index}].opensAt`] =
          `Khoảng thời gian bị trùng với đợt ${priorIndex + 1} cùng nhóm.`;
    });
  });

  const selectedCriteria = values.rankingPriority.map((item) => item.criterionCode);
  if (new Set(selectedCriteria).size !== selectedCriteria.length)
    errors.rankingPriority = 'Mỗi tiêu chí xếp hạng chỉ được chọn một lần.';

  values.goalTypes.forEach((goal, index) => {
    const code = normalizeRegulationCode(goal.code);
    if (!code) errors[`goalTypes[${index}].code`] = 'Nhập mã loại bàn thắng.';
    else if (!/^[A-Z0-9][A-Z0-9_-]{0,31}$/.test(code))
      errors[`goalTypes[${index}].code`] =
        'Mã gồm chữ Latin, số, gạch dưới hoặc gạch nối; tối đa 32 ký tự.';
    const baselineOwnGoal: Record<string, boolean> = { A: false, B: false, C: true, D: false };
    if (Object.hasOwn(baselineOwnGoal, code) && goal.isOwnGoal !== baselineOwnGoal[code])
      errors[`goalTypes[${index}].isOwnGoal`] = `Mã ${code} giữ ý nghĩa bàn thắng cơ bản.`;
    const name = normalizeRegulationText(goal.name);
    if (!name || name.includes('\0'))
      errors[`goalTypes[${index}].name`] = 'Nhập tên loại bàn thắng.';
    else if (codePointLength(name) > 200)
      errors[`goalTypes[${index}].name`] = 'Tên không được vượt quá 200 ký tự.';
  });
  values.cardTypes.forEach((card, index) => {
    const code = normalizeRegulationCode(card.code);
    if (!code) errors[`cardTypes[${index}].code`] = 'Nhập mã loại thẻ.';
    else if (!/^[A-Z0-9][A-Z0-9_-]{0,31}$/.test(code))
      errors[`cardTypes[${index}].code`] =
        'Mã gồm chữ Latin, số, gạch dưới hoặc gạch nối; tối đa 32 ký tự.';
    const name = normalizeRegulationText(card.name);
    if (!name || name.includes('\0')) errors[`cardTypes[${index}].name`] = 'Nhập tên loại thẻ.';
    else if (codePointLength(name) > 200)
      errors[`cardTypes[${index}].name`] = 'Tên không được vượt quá 200 ký tự.';
  });
  for (const [field, rows] of [
    ['goalTypes', values.goalTypes],
    ['cardTypes', values.cardTypes],
  ] as const) {
    const codes = rows.map((row) => normalizeRegulationCode(row.code));
    if (new Set(codes).size !== codes.length)
      errors[field] = 'Mỗi mã chỉ được xuất hiện một lần trong danh mục.';
  }
  return errors;
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  const Container = isValidElement(children) && children.type === AdminSelect ? 'div' : 'label';
  return (
    <Container className={css.field}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
      {error && <small className={css.fieldError}>{error}</small>}
    </Container>
  );
}

export function RegulationDraftForm({ detail, canEdit, onSaved, onDirtyChange }: Props) {
  const { client } = useSession();
  const initialValues = useMemo(() => formValuesFromContent(detail.content), [detail.content]);
  const [values, setValues] = useState(initialValues);
  const [dateReset, setDateReset] = useState(0);
  const [baseline, setBaseline] = useState<Baseline>(() => ({
    revision: detail.revision,
    values: cloneValues(initialValues),
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<'needs-refresh' | ConflictReview | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [proposal, setProposal] = useState<ProposalKind>(null);
  const [inspectedLatest, setInspectedLatest] = useState<RegulationVersionDetail>();
  const dirty = changedFields(baseline.values, values);
  const editable =
    canEdit && detail.capabilities.canEditDraft && detail.state === 'DRAFT' && !conflict;
  const mutationDisabled = !editable || saving;

  useEffect(() => {
    onDirtyChange(dirty.length > 0);
  }, [dirty.length, onDirtyChange]);

  function change<K extends FormField>(
    key: K,
    value:
      RegulationFormValues[K] | ((previous: RegulationFormValues[K]) => RegulationFormValues[K]),
  ) {
    setValues((current) => ({
      ...current,
      [key]: typeof value === 'function' ? value(current[key]) : value,
    }));
    setSuccess(undefined);
    setFormError(undefined);
    setErrors((current) => {
      const next = { ...current };
      for (const errorKey of Object.keys(next))
        if (errorKey === key || errorKey.startsWith(`${key}[`)) delete next[errorKey];
      return next;
    });
  }

  function updateWindow(
    index: number,
    field: 'intakeKind' | 'opensAt' | 'closesAt',
    value: string,
  ) {
    change('registrationWindows', (windows) =>
      windows.map((window, itemIndex) =>
        itemIndex === index ? { ...window, [field]: value } : window,
      ),
    );
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editable || saving || dirty.length === 0) return;
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      setFormError('Vui lòng sửa các trường được đánh dấu rồi lưu lại bản nháp.');
      return;
    }
    const payload = draftContentFromForm(values);
    const body: Record<string, unknown> = { expectedRevision: baseline.revision };
    for (const field of dirty) body[field] = payload[field];
    setSaving(true);
    setFormError(undefined);
    setErrors({});
    setSuccess(undefined);
    try {
      await client.request<{ id: string; revision: string }>(`/regulation-versions/${detail.id}`, {
        method: 'PATCH',
        body,
      });
      setSuccess('Đã lưu bản nháp. Nội dung chưa được gửi thẩm định và chưa có hiệu lực.');
      setBaseline({ revision: baseline.revision, values: cloneValues(values) });
      onSaved();
    } catch (error) {
      if (error instanceof HttpFailure && error.code === 'REVISION_CONFLICT') {
        setConflict('needs-refresh');
        setFormError(
          'Bản nháp đã được cập nhật ở nơi khác. Nội dung đang nhập được giữ lại để đối chiếu.',
        );
      } else if (error instanceof HttpFailure && error.details?.length) {
        setErrors(errorMap(error.details));
        setFormError(error.message);
      } else {
        setFormError(error instanceof Error ? error.message : 'Không thể lưu bản nháp.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function refreshConflict() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const { data: latest } = await client.request<RegulationVersionDetail>(
        `/regulation-versions/${detail.id}`,
      );
      const latestValues = formValuesFromContent(latest.content);
      const attemptedValues = cloneValues(values);
      const touched = changedFields(baseline.values, attemptedValues);
      setInspectedLatest(latest);
      setConflict({ latest, latestValues, attemptedValues, changedFields: touched });
      setFormError(undefined);
    } catch (error) {
      setFormError(
        `${error instanceof Error ? error.message : 'Không thể tải lại bản nháp.'} Nội dung đang nhập vẫn được giữ lại.`,
      );
    } finally {
      setRefreshing(false);
    }
  }

  function resumeReviewedChanges() {
    if (!conflict || conflict === 'needs-refresh' || !conflict.latest.capabilities.canEditDraft)
      return;
    const rebased = cloneValues(conflict.latestValues);
    for (const field of conflict.changedFields) {
      (rebased as Record<FormField, unknown>)[field] = conflict.attemptedValues[field];
    }
    setValues(rebased);
    setDateReset((value) => value + 1);
    setBaseline({ revision: conflict.latest.revision, values: cloneValues(conflict.latestValues) });
    setInspectedLatest(undefined);
    setConflict(null);
    setErrors({});
    setFormError(undefined);
    setSuccess(undefined);
  }

  function discardLocalChanges() {
    setDateReset((value) => value + 1);
    const latest = inspectedLatest;
    if (latest) {
      const latestValues = formValuesFromContent(latest.content);
      setValues(latestValues);
      setBaseline({ revision: latest.revision, values: cloneValues(latestValues) });
      setInspectedLatest(undefined);
    } else {
      setValues(cloneValues(baseline.values));
    }
    setConflict(null);
    setErrors({});
    setFormError(undefined);
    setSuccess(undefined);
  }

  function showProposal(kind: Exclude<ProposalKind, null>) {
    setProposal(kind);
  }

  function confirmProposal() {
    if (proposal === 'source-values') setValues((current) => applySourceProposedValues(current));
    if (proposal === 'relegation-count') change('relegationCount', 3);
    setProposal(null);
    setErrors({});
    setFormError(undefined);
    setSuccess('Đã điền giá trị đề xuất vào bản nháp. Hãy kiểm tra và lưu khi phù hợp.');
  }

  const conflictReview = conflict && conflict !== 'needs-refresh' ? conflict : null;

  return (
    <form className={css.draftForm} onSubmit={(event) => void save(event)}>
      <div className={css.draftNotice}>
        <strong>Bản nháp có thể chưa đầy đủ.</strong>
        <span>
          Bạn có thể lưu khi chưa nhập đủ thông tin. Chỉ nội dung đã lưu mới được gửi thẩm định.
        </span>
      </div>
      {!canEdit && (
        <p className={css.readOnlyNotice}>
          Phiên bản này chỉ xem được. Chỉ bản nháp hiện tại có quyền sửa mới mở biểu mẫu chỉnh sửa.
        </p>
      )}
      {formError && (
        <p className={css.formError} role="alert">
          {formError}
        </p>
      )}
      {success && (
        <p className={css.formSuccess} role="status">
          {success}
        </p>
      )}

      {conflict === 'needs-refresh' && (
        <div className={css.conflictReview} role="region" aria-label="Xem lại bản nháp mới nhất">
          <strong>Hãy tải lại bản mới nhất trước khi tiếp tục.</strong>
          <span>Nội dung đã nhập vẫn được giữ lại; chưa có yêu cầu PATCH nào khác được gửi.</span>
          <div className={css.toolbar}>
            <button type="button" disabled={refreshing} onClick={() => void refreshConflict()}>
              {refreshing ? 'Đang tải…' : 'Tải lại và so sánh'}
            </button>
            <button type="button" onClick={discardLocalChanges}>
              Bỏ nội dung đã nhập
            </button>
          </div>
        </div>
      )}
      {conflictReview && (
        <div className={css.conflictReview} role="region" aria-label="So sánh nội dung đã nhập">
          <h3>So sánh bản mới nhất với nội dung đang nhập</h3>
          {conflictReview.changedFields.length === 0 ? (
            <p>Không có thay đổi cục bộ cần áp dụng lại.</p>
          ) : (
            conflictReview.changedFields.map((field) => (
              <div className={css.comparison} key={field}>
                <strong>{fieldLabels[field]}</strong>
                <span>Hiện tại: {displayValue(field, conflictReview.latestValues[field])}</span>
                <span>Đã nhập: {displayValue(field, conflictReview.attemptedValues[field])}</span>
              </div>
            ))
          )}
          {!conflictReview.latest.capabilities.canEditDraft && (
            <p role="alert">Bản mới nhất không còn là bản nháp có thể sửa.</p>
          )}
          <div className={css.toolbar}>
            {conflictReview.latest.capabilities.canEditDraft && (
              <button type="button" className={css.primary} onClick={resumeReviewedChanges}>
                Tiếp tục với thay đổi đã xem xét
              </button>
            )}
            <button type="button" onClick={discardLocalChanges}>
              Bỏ nội dung đã nhập
            </button>
          </div>
        </div>
      )}

      <section className={css.formSection} aria-labelledby="regulation-effective-heading">
        <div className={css.groupHeading}>
          <div>
            <span className={css.step}>01</span>
            <h3 id="regulation-effective-heading">Thời điểm đề xuất</h3>
          </div>
          <p>Nhập ngày giờ theo giờ Việt Nam (UTC+7).</p>
        </div>
        <div className={css.fieldGrid}>
          <Field label="Cách đề xuất hiệu lực" error={errors.effectiveMode}>
            <AdminSelect
              label="Cách đề xuất hiệu lực"
              value={values.effectiveMode ?? ''}
              disabled={mutationDisabled}
              onChange={(value) => {
                const mode = (value || null) as EffectiveMode | null;
                change('effectiveMode', mode);
                if (mode === 'IMMEDIATE') change('proposedEffectiveAt', '');
              }}

              options={[
                { value: '', label: 'Chưa chọn' },
                { value: 'IMMEDIATE', label: 'Hiệu lực ngay sau khi được duyệt' },
                { value: 'SCHEDULED', label: 'Hiệu lực tại thời điểm đã chọn' },
              ]}
            />
          </Field>
          <Field
            label="Thời điểm hiệu lực dự kiến"
            error={errors.proposedEffectiveAt}
            hint="Chỉ nhập cho đề xuất có thời điểm hiệu lực trong tương lai."
          >
            <DateTimePicker
              label="Thời điểm hiệu lực dự kiến"
              value={values.proposedEffectiveAt}
              disabled={mutationDisabled || values.effectiveMode !== 'SCHEDULED'}
              onChange={(value) => change('proposedEffectiveAt', value)}
            />
          </Field>
        </div>
      </section>

      <section className={css.formSection} aria-labelledby="regulation-eligibility-heading">
        <div className={css.groupHeading}>
          <div>
            <span className={css.step}>02</span>
            <h3 id="regulation-eligibility-heading">Điều kiện đăng ký</h3>
          </div>
          <p>
            Giữ riêng các ngưỡng số mùa và số tháng; ngày U21 và độ tuổi đào tạo cần nhập theo quyết
            định của mùa giải.
          </p>
        </div>
        {editable && (
          <button
            type="button"
            disabled={mutationDisabled}
            onClick={() => showProposal('source-values')}
          >
            Xem và xác nhận giá trị đề xuất từ nguồn
          </button>
        )}
        <div className={css.fieldGrid}>
          {numberFields.slice(0, 6).map((item) => (
            <NumberField
              key={item.key}
              label={item.label}
              value={values[item.key]}
              error={errors[item.key]}
              disabled={mutationDisabled}
              onChange={(value) => change(item.key, value)}
            />
          ))}
          <Field
            label="Ngày sinh giới hạn U21"
            error={errors.u21Cutoff}
            hint="Nhập hoặc chọn ngày theo định dạng DD/MM/YYYY."
          >
            <DateOnlyPicker
              key={dateReset}
              label="Ngày sinh giới hạn U21"
              initialDate={values.u21Cutoff}
              disabled={mutationDisabled}
              invalid={!!errors.u21Cutoff}
              onDateTextChange={(text) => {
                const date = text ? parseDisplayDate(text) : null;
                if (editable && !saving && date !== values.u21Cutoff) change('u21Cutoff', date);
              }}
            />
          </Field>
        </div>
      </section>

      <section className={css.formSection} aria-labelledby="regulation-structure-heading">
        <div className={css.groupHeading}>
          <div>
            <span className={css.step}>03</span>
            <h3 id="regulation-structure-heading">Cấu trúc và kế hoạch thi đấu</h3>
          </div>
          <p>
            Số câu lạc bộ và kế hoạch được nhập rõ ràng; hệ thống hiện chỉ hỗ trợ vòng tròn hai
            lượt.
          </p>
        </div>
        <div className={css.fieldGrid}>
          <NumberField
            label="Số câu lạc bộ"
            value={values.clubCount}
            error={errors.clubCount}
            disabled={mutationDisabled}
            onChange={(value) => change('clubCount', value)}
          />
          <Field label="Thể thức" error={errors.formatCode}>
            <AdminSelect
              label="Thể thức"
              value={values.formatCode ?? ''}
              disabled={mutationDisabled}
              onChange={(value) => change('formatCode', value ? 'DOUBLE_ROUND_ROBIN' : null)}

              options={[
                { value: '', label: 'Chưa chọn' },
                { value: 'DOUBLE_ROUND_ROBIN', label: 'Vòng tròn hai lượt' },
              ]}
            />
          </Field>
          <Field label="Số lượt" error={errors.legs} hint="Thể thức hiện chỉ hỗ trợ hai lượt.">
            <AdminSelect
              label="Số lượt"
              value={values.legs?.toString() ?? ''}
              disabled={mutationDisabled}
              onChange={(value) => change('legs', value ? Number(value) : null)}

              options={[
                { value: '', label: 'Chưa chọn' },
                { value: '2', label: 'Hai lượt' },
              ]}
            />
          </Field>
          {numberFields.slice(8, 11).map((item) => (
            <NumberField
              key={item.key}
              label={item.label}
              value={values[item.key]}
              error={errors[item.key]}
              disabled={mutationDisabled}
              onChange={(value) => change(item.key, value)}
            />
          ))}
        </div>
      </section>

      <section className={css.formSection} aria-labelledby="regulation-windows-heading">
        <div className={css.groupHeading}>
          <div>
            <span className={css.step}>04</span>
            <h3 id="regulation-windows-heading">Các đợt tiếp nhận</h3>
          </div>
          <p>Mỗi nhóm có thể có nhiều đợt tiếp nhận. Thời điểm đóng phải sau thời điểm mở.</p>
        </div>
        <div className={css.windowList}>
          {values.registrationWindows.map((window, index) => (
            <div className={css.repeater} key={`window-${index}`}>
              <div className={css.repeaterHeading}>
                <strong>Đợt {index + 1}</strong>
                {editable && (
                  <button
                    type="button"
                    disabled={mutationDisabled}
                    className={css.linkButton}
                    onClick={() =>
                      change('registrationWindows', (windows) =>
                        windows.filter((_item, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    Xóa đợt
                  </button>
                )}
              </div>
              <div className={css.fieldGrid}>
                <Field
                  label="Nhóm tiếp nhận"
                  error={errors[`registrationWindows[${index}].intakeKind`]}
                >
                  <AdminSelect
                    label={`Nhóm tiếp nhận đợt ${index + 1}`}
                    value={window.intakeKind}
                    disabled={mutationDisabled}
                    onChange={(value) => updateWindow(index, 'intakeKind', value)}

                    options={[
                      { value: 'CLUB_APPLICATION', label: intakeKindLabels.CLUB_APPLICATION },
                      { value: 'PLAYER_CHANGE', label: intakeKindLabels.PLAYER_CHANGE },
                    ]}
                  />
                </Field>
                <Field
                  label="Mở từ (giờ Việt Nam)"
                  error={errors[`registrationWindows[${index}].opensAt`]}
                >
                  <DateTimePicker
                    label={`Mở từ đợt ${index + 1}`}
                    value={window.opensAt}
                    disabled={mutationDisabled}
                    onChange={(value) => updateWindow(index, 'opensAt', value)}
                  />
                </Field>
                <Field
                  label="Đóng trước (giờ Việt Nam)"
                  error={errors[`registrationWindows[${index}].closesAt`]}
                >
                  <DateTimePicker
                    label={`Đóng trước đợt ${index + 1}`}
                    value={window.closesAt}
                    disabled={mutationDisabled}
                    onChange={(value) => updateWindow(index, 'closesAt', value)}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
        {editable && (
          <button
            type="button"
            disabled={mutationDisabled}
            onClick={() =>
              change('registrationWindows', (windows) => [
                ...windows,
                { intakeKind: 'CLUB_APPLICATION', opensAt: '', closesAt: '' },
              ])
            }
          >
            Thêm đợt tiếp nhận
          </button>
        )}
      </section>

      <section className={css.formSection} aria-labelledby="regulation-catalog-heading">
        <div className={css.groupHeading}>
          <div>
            <span className={css.step}>05</span>
            <h3 id="regulation-catalog-heading">Danh mục bàn thắng và thẻ</h3>
          </div>
          <p>
            Mã và ý nghĩa đã được tham chiếu cần được giữ nguyên. Bật/tắt chỉ điều khiển khả năng
            chọn cho dữ liệu mới.
          </p>
        </div>
        <CatalogEditor
          kind="goal"
          rows={values.goalTypes}
          disabled={mutationDisabled}
          errors={errors}
          onChange={(rows) => change('goalTypes', rows)}
        />
        <CatalogEditor
          kind="card"
          rows={values.cardTypes}
          disabled={mutationDisabled}
          errors={errors}
          onChange={(rows) => change('cardTypes', rows)}
        />
      </section>

      <section className={css.formSection} aria-labelledby="regulation-points-heading">
        <div className={css.groupHeading}>
          <div>
            <span className={css.step}>06</span>
            <h3 id="regulation-points-heading">Điểm số và thứ hạng</h3>
          </div>
          <p>
            Q được nhập rõ ràng; R = 3 chỉ là giá trị đề xuất khi mùa giải có đúng 20 câu lạc bộ.
          </p>
        </div>
        <div className={css.fieldGrid}>
          {numberFields.slice(11).map((item) => (
            <NumberField
              key={item.key}
              label={item.label}
              value={values[item.key]}
              error={errors[item.key]}
              disabled={mutationDisabled}
              onChange={(value) => change(item.key, value)}
            />
          ))}
        </div>
        {editable && values.clubCount === 20 && values.relegationCount === null && (
          <button
            type="button"
            disabled={mutationDisabled}
            onClick={() => showProposal('relegation-count')}
          >
            Xem và xác nhận giá trị đề xuất R = 3
          </button>
        )}
        {errors.rankingPriority && (
          <p className={css.fieldError} role="alert">
            {errors.rankingPriority}
          </p>
        )}
        <div className={css.windowList}>
          {values.rankingPriority.map((item, index) => (
            <div className={css.rankingRow} key={`rank-${index}`}>
              <strong>Ưu tiên {index + 1}</strong>
              <AdminSelect
                label={`Tiêu chí ưu tiên ${index + 1}`}
                value={item.criterionCode}
                disabled={mutationDisabled}
                onChange={(value) => {
                  const selected = value as RankingCriterion;
                  change(
                    'rankingPriority',
                    values.rankingPriority.map((row, itemIndex) =>
                      itemIndex === index ? { ...row, criterionCode: selected } : row,
                    ),
                  );
                }}

                options={criteria.map((criterion) => ({
                  value: criterion,
                  label: rankingCriterionLabels[criterion],
                  disabled: values.rankingPriority.some(
                    (row, itemIndex) => itemIndex !== index && row.criterionCode === criterion,
                  ),
                }))}
              />
              {editable && (
                <button
                  type="button"
                  disabled={mutationDisabled}
                  className={css.linkButton}
                  onClick={() =>
                    change(
                      'rankingPriority',
                      values.rankingPriority
                        .filter((_row, itemIndex) => itemIndex !== index)
                        .map((row, nextIndex) => ({ ...row, position: nextIndex + 1 })),
                    )
                  }
                >
                  Xóa tiêu chí
                </button>
              )}
            </div>
          ))}
        </div>
        {editable && values.rankingPriority.length < criteria.length && (
          <button
            type="button"
            disabled={mutationDisabled}
            onClick={() => {
              const criterion = criteria.find(
                (option) => !values.rankingPriority.some((row) => row.criterionCode === option),
              );
              if (criterion)
                change('rankingPriority', [
                  ...values.rankingPriority,
                  { position: values.rankingPriority.length + 1, criterionCode: criterion },
                ]);
            }}
          >
            Thêm tiêu chí xếp hạng
          </button>
        )}
      </section>

      <div className={css.formActions}>
        <span>
          {dirty.length
            ? `Có ${dirty.length} nhóm thay đổi chưa lưu.`
            : 'Không có thay đổi chưa lưu.'}
        </span>
        {editable && (
          <button className={css.primary} type="submit" disabled={saving || dirty.length === 0}>
            {saving ? 'Đang lưu…' : 'Lưu bản nháp'}
          </button>
        )}
      </div>

      <Modal
        open={proposal !== null}
        centered
        title="Xác nhận điền giá trị đề xuất"
        cancelText="Quay lại"
        okText="Xác nhận điền"
        okButtonProps={{ disabled: mutationDisabled }}
        onOk={confirmProposal}
        onCancel={() => setProposal(null)}
      >
        {proposal === 'source-values' ? (
          <p>
            Điền 20 câu lạc bộ, 25 cầu thủ, 17 cầu thủ không thuộc diện đào tạo trong nước, tối
            thiểu 3 mùa đào tạo và 36 tháng đào tạo. Đây là các giá trị đề xuất có thể sửa; chúng
            không trở thành quy định hiệu lực khi lưu nháp.
          </p>
        ) : (
          <p>
            Điền R = 3 theo giá trị đề xuất chỉ áp dụng khi số câu lạc bộ là 20. Q vẫn phải được
            nhập riêng. Giá trị này chưa có hiệu lực khi lưu nháp.
          </p>
        )}
      </Modal>
    </form>
  );
}

function NumberField<K extends (typeof numberFields)[number]['key']>({
  label,
  value,
  error,
  disabled,
  onChange,
}: {
  label: string;
  value: RegulationFormValues[K];
  error?: string;
  disabled: boolean;
  onChange: (value: RegulationFormValues[K]) => void;
}) {
  return (
    <Field label={label} error={error}>
      <input
        aria-label={label}
        type="number"
        step="1"
        inputMode="numeric"
        value={value ?? ''}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value === ''
              ? null
              : (Number(event.target.value) as RegulationFormValues[K]),
          )
        }
      />
    </Field>
  );
}

function CatalogEditor(
  props:
    | {
        kind: 'goal';
        rows: RegulationFormValues['goalTypes'];
        disabled: boolean;
        errors: FieldErrors;
        onChange: (rows: RegulationFormValues['goalTypes']) => void;
      }
    | {
        kind: 'card';
        rows: RegulationFormValues['cardTypes'];
        disabled: boolean;
        errors: FieldErrors;
        onChange: (rows: RegulationFormValues['cardTypes']) => void;
      },
) {
  if (props.kind === 'goal') {
    const { rows, disabled, errors, onChange } = props;
    return (
      <div className={css.catalogGroup}>
        <div className={css.repeaterHeading}>
          <h4>Loại bàn thắng</h4>
          {!disabled && (
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                onChange([...rows, { code: '', name: '', isOwnGoal: false, enabled: true }])
              }
            >
              Thêm loại bàn thắng
            </button>
          )}
        </div>
        {rows.length === 0 ? (
          <p className={css.emptyGroup}>
            Chưa khai báo danh mục. Không có danh mục mẫu được tự động thêm.
          </p>
        ) : (
          rows.map((row, index) => (
            <div className={css.repeater} key={`goal-${index}`}>
              <div className={css.repeaterHeading}>
                <strong>Loại bàn thắng {index + 1}</strong>
                {!disabled && (
                  <button
                    type="button"
                    disabled={disabled}
                    className={css.linkButton}
                    onClick={() => onChange(rows.filter((_item, rowIndex) => rowIndex !== index))}
                  >
                    Xóa
                  </button>
                )}
              </div>
              <div className={css.fieldGrid}>
                <Field label="Mã" error={errors[`goalTypes[${index}].code`]}>
                  <input
                    aria-label={`Mã loại bàn thắng ${index + 1}`}
                    value={row.code}
                    disabled={disabled}
                    onChange={(event) =>
                      onChange(
                        rows.map((item, rowIndex) =>
                          rowIndex === index ? { ...item, code: event.target.value } : item,
                        ),
                      )
                    }
                  />
                </Field>
                <Field
                  label="Tên"
                  error={errors[`goalTypes[${index}].name`]}
                  hint="Tối đa 200 ký tự Unicode."
                >
                  <input
                    aria-label={`Tên loại bàn thắng ${index + 1}`}
                    value={row.name}
                    disabled={disabled}
                    onChange={(event) =>
                      onChange(
                        rows.map((item, rowIndex) =>
                          rowIndex === index ? { ...item, name: event.target.value } : item,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="Bàn phản lưới nhà">
                  <AdminSelect
                    label={`Bàn phản lưới nhà ${index + 1}`}
                    value={row.isOwnGoal ? 'true' : 'false'}
                    disabled={disabled}
                    onChange={(value) =>
                      onChange(
                        rows.map((item, rowIndex) =>
                          rowIndex === index ? { ...item, isOwnGoal: value === 'true' } : item,
                        ),
                      )
                    }

                    options={[
                      { value: 'false', label: 'Không' },
                      { value: 'true', label: 'Có' },
                    ]}
                  />
                </Field>
                <Field label="Cho phép chọn">
                  <AdminSelect
                    label={`Cho phép chọn loại bàn thắng ${index + 1}`}
                    value={row.enabled ? 'true' : 'false'}
                    disabled={disabled}
                    onChange={(value) =>
                      onChange(
                        rows.map((item, rowIndex) =>
                          rowIndex === index ? { ...item, enabled: value === 'true' } : item,
                        ),
                      )
                    }

                    options={[
                      { value: 'true', label: 'Có' },
                      { value: 'false', label: 'Không' },
                    ]}
                  />
                </Field>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  const { rows, disabled, errors, onChange } = props;
  return (
    <div className={css.catalogGroup}>
      <div className={css.repeaterHeading}>
        <h4>Loại thẻ</h4>
        {!disabled && (
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              onChange([...rows, { code: '', name: '', meaning: 'YELLOW', enabled: true }])
            }
          >
            Thêm loại thẻ
          </button>
        )}
      </div>
      {rows.length === 0 ? (
        <p className={css.emptyGroup}>
          Chưa khai báo danh mục. Không có danh mục mẫu được tự động thêm.
        </p>
      ) : (
        rows.map((row, index) => (
          <div className={css.repeater} key={`card-${index}`}>
            <div className={css.repeaterHeading}>
              <strong>Loại thẻ {index + 1}</strong>
              {!disabled && (
                <button
                  type="button"
                  disabled={disabled}
                  className={css.linkButton}
                  onClick={() => onChange(rows.filter((_item, rowIndex) => rowIndex !== index))}
                >
                  Xóa
                </button>
              )}
            </div>
            <div className={css.fieldGrid}>
              <Field label="Mã" error={errors[`cardTypes[${index}].code`]}>
                <input
                  aria-label={`Mã loại thẻ ${index + 1}`}
                  value={row.code}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange(
                      rows.map((item, rowIndex) =>
                        rowIndex === index ? { ...item, code: event.target.value } : item,
                      ),
                    )
                  }
                />
              </Field>
              <Field
                label="Tên"
                error={errors[`cardTypes[${index}].name`]}
                hint="Tối đa 200 ký tự Unicode."
              >
                <input
                  aria-label={`Tên loại thẻ ${index + 1}`}
                  value={row.name}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange(
                      rows.map((item, rowIndex) =>
                        rowIndex === index ? { ...item, name: event.target.value } : item,
                      ),
                    )
                  }
                />
              </Field>
              <Field label="Ý nghĩa" error={errors[`cardTypes[${index}].meaning`]}>
                <AdminSelect
                  label={`Ý nghĩa loại thẻ ${index + 1}`}
                  value={row.meaning}
                  disabled={disabled}
                  onChange={(value) =>
                    onChange(
                      rows.map((item, rowIndex) =>
                        rowIndex === index ? { ...item, meaning: value as CardMeaning } : item,
                      ),
                    )
                  }

                  options={[
                    { value: 'YELLOW', label: 'Thẻ vàng' },
                    { value: 'RED', label: 'Thẻ đỏ' },
                  ]}
                />
              </Field>
              <Field label="Cho phép chọn">
                <AdminSelect
                  label={`Cho phép chọn loại thẻ ${index + 1}`}
                  value={row.enabled ? 'true' : 'false'}
                  disabled={disabled}
                  onChange={(value) =>
                    onChange(
                      rows.map((item, rowIndex) =>
                        rowIndex === index ? { ...item, enabled: value === 'true' } : item,
                      ),
                    )
                  }

                  options={[
                    { value: 'true', label: 'Có' },
                    { value: 'false', label: 'Không' },
                  ]}
                />
              </Field>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function displayLocalTime(value: string): string {
  const [date, time] = value.split('T');
  return time ? formatRegulationDate(date) + ' ' + time : value;
}

function displayValue(field: FormField, value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Chưa nhập';
  if (typeof value === 'string' && /^\d{4}-\d\d-\d\d$/.test(value))
    return formatRegulationDate(value);
  if (field === 'proposedEffectiveAt' && typeof value === 'string') return displayLocalTime(value);
  if (Array.isArray(value)) {
    if (!value.length) return 'Danh sách rỗng';
    if (field === 'registrationWindows')
      return (value as RegulationFormValues['registrationWindows'])
        .map(
          ({ intakeKind, opensAt, closesAt }) =>
            intakeKindLabels[intakeKind] +
            ': ' +
            displayLocalTime(opensAt) +
            ' → ' +
            displayLocalTime(closesAt),
        )
        .join('; ');
    if (field === 'rankingPriority')
      return (value as RegulationFormValues['rankingPriority'])
        .map(
          ({ position, criterionCode }) => position + '. ' + rankingCriterionLabels[criterionCode],
        )
        .join('; ');
    return (
      value as (
        RegulationFormValues['goalTypes'][number] | RegulationFormValues['cardTypes'][number]
      )[]
    )
      .map((row) =>
        [
          row.code,
          row.name,
          'isOwnGoal' in row
            ? row.isOwnGoal
              ? 'Phản lưới nhà'
              : 'Không phải phản lưới nhà'
            : row.meaning === 'YELLOW'
              ? 'Thẻ vàng'
              : 'Thẻ đỏ',
          row.enabled ? 'Cho phép chọn' : 'Không cho chọn',
        ].join(' · '),
      )
      .join('; ');
  }
  return String(value);
}
