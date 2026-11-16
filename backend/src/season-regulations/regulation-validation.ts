import { isISO8601 } from 'class-validator';
import { ApplicationError, type ApplicationErrorDetail } from '../platform/application-error';

export const regulationEffectiveModes = ['IMMEDIATE', 'SCHEDULED'] as const;
export const regulationIntakeKinds = ['CLUB_APPLICATION', 'PLAYER_CHANGE'] as const;
export const regulationRankingCriteria = ['POINTS', 'GOAL_DIFFERENCE', 'GOALS_FOR'] as const;
export const regulationGoalCodes = ['A', 'B', 'C', 'D'] as const;
export const regulationCardMeanings = ['YELLOW', 'RED'] as const;

export type RegulationEffectiveMode = (typeof regulationEffectiveModes)[number];
export type RegulationIntakeKind = (typeof regulationIntakeKinds)[number];
export type RegulationRankingCriterion = (typeof regulationRankingCriteria)[number];
export type RegulationCardMeaning = (typeof regulationCardMeanings)[number];

export type RegistrationWindowInput = {
  intakeKind: RegulationIntakeKind;
  opensAt: string;
  closesAt: string;
};

export type RankingPriorityInput = {
  position: number;
  criterionCode: RegulationRankingCriterion;
};

export type GoalTypeInput = {
  code: string;
  name: string;
  isOwnGoal: boolean;
  enabled: boolean;
};

export type CardTypeInput = {
  code: string;
  name: string;
  meaning: RegulationCardMeaning;
  enabled: boolean;
};

/** Partial values are a persisted editable proposal; null clears a nullable scalar. */
export type RegulationDraftContent = {
  effectiveMode?: RegulationEffectiveMode | null;
  proposedEffectiveAt?: string | null;
  squadLimit?: number | null;
  nonHomegrownLimit?: number | null;
  homegrownSeasons?: number | null;
  homegrownMonths?: number | null;
  homegrownAgeStart?: number | null;
  homegrownAgeEnd?: number | null;
  u21Cutoff?: string | null;
  registrationWindows?: RegistrationWindowInput[];
  clubCount?: number | null;
  formatCode?: 'DOUBLE_ROUND_ROBIN' | null;
  legs?: number | null;
  plannedMinutes?: number | null;
  preparationMinutes?: number | null;
  releaseMinutes?: number | null;
  winPoints?: number | null;
  drawPoints?: number | null;
  lossPoints?: number | null;
  rankingPriority?: RankingPriorityInput[];
  qualificationCount?: number | null;
  relegationCount?: number | null;
  goalTypes?: GoalTypeInput[];
  cardTypes?: CardTypeInput[];
};

export type CompleteRegulationContent = {
  effectiveMode: RegulationEffectiveMode;
  proposedEffectiveAt: string | null;
  squadLimit: number;
  nonHomegrownLimit: number;
  homegrownSeasons: number;
  homegrownMonths: number;
  homegrownAgeStart: number;
  homegrownAgeEnd: number;
  u21Cutoff: string;
  registrationWindows: RegistrationWindowInput[];
  clubCount: number;
  formatCode: 'DOUBLE_ROUND_ROBIN';
  legs: 2;
  plannedMinutes: number;
  preparationMinutes: number;
  releaseMinutes: number;
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
  rankingPriority: RankingPriorityInput[];
  qualificationCount: number;
  relegationCount: number;
  goalTypes: GoalTypeInput[];
  cardTypes: CardTypeInput[];
};

type DraftAnalysis = { content: RegulationDraftContent; errors: ApplicationErrorDetail[] };
type IndexedValue<T> = { index: number; value: T };
type NormalizedArray<T> = { values: T[]; indexed: IndexedValue<T>[] };

const scalarFields = [
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
] as const;
const contentFields = new Set<string>([
  ...scalarFields,
  'registrationWindows',
  'rankingPriority',
  'goalTypes',
  'cardTypes',
]);
const nonnegativeFields = new Set([
  'squadLimit',
  'nonHomegrownLimit',
  'qualificationCount',
  'relegationCount',
  'preparationMinutes',
  'releaseMinutes',
]);
const positiveFields = new Set(['homegrownSeasons', 'homegrownMonths', 'plannedMinutes']);
const fieldLabels: Record<string, string> = {
  effectiveMode: 'Chế độ hiệu lực không hợp lệ.',
  proposedEffectiveAt: 'Thời điểm phải là UTC ISO-8601 kết thúc bằng Z.',
  squadLimit: 'Giới hạn đội hình phải là số nguyên không âm.',
  nonHomegrownLimit: 'Giới hạn cầu thủ không thuộc diện đào tạo phải là số nguyên không âm.',
  homegrownSeasons: 'Số mùa đào tạo phải là số nguyên dương.',
  homegrownMonths: 'Số tháng đào tạo phải là số nguyên dương.',
  homegrownAgeStart: 'Tuổi bắt đầu phải là số nguyên dương.',
  homegrownAgeEnd: 'Tuổi kết thúc phải là số nguyên dương và lớn hơn tuổi bắt đầu.',
  u21Cutoff: 'Ngày giới hạn phải theo định dạng YYYY-MM-DD hợp lệ.',
  clubCount: 'Số câu lạc bộ phải là số chẵn từ 4 đến 20.',
  formatCode: 'Thể thức duy nhất được hỗ trợ là DOUBLE_ROUND_ROBIN.',
  legs: 'Số lượt thi đấu phải bằng 2.',
  plannedMinutes: 'Thời lượng dự kiến phải là số nguyên dương.',
  preparationMinutes: 'Thời gian chuẩn bị phải là số nguyên không âm.',
  releaseMinutes: 'Thời gian giải phóng sân phải là số nguyên không âm.',
  winPoints: 'Điểm thắng phải lớn hơn điểm hòa và điểm thua.',
  drawPoints: 'Điểm hòa phải nhỏ hơn điểm thắng và lớn hơn điểm thua.',
  lossPoints: 'Điểm thua phải nhỏ hơn điểm hòa và điểm thắng.',
  qualificationCount: 'Số suất tham dự phải là số nguyên không âm.',
  relegationCount: 'Số suất xuống hạng phải là số nguyên không âm và nhỏ hơn số câu lạc bộ.',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function addError(
  errors: ApplicationErrorDetail[],
  field: string,
  code: string,
  message: string,
): void {
  if (errors.length < 64) errors.push({ field, code, message });
}

function throwErrors(errors: ApplicationErrorDetail[]): never {
  throw new ApplicationError(
    400,
    'VALIDATION_FAILED',
    'Vui lòng kiểm tra dữ liệu quy định đã nhập.',
    errors,
  );
}

function validBusinessInteger(value: unknown): value is number {
  return (
    Number.isInteger(value) &&
    Number.isSafeInteger(value) &&
    Math.abs(value as number) <= 2_147_483_647
  );
}

function normalizeDateOnly(value: unknown, field: string, errors: ApplicationErrorDetail[]) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !isISO8601(value, { strict: true, strictSeparator: true })
  ) {
    addError(errors, field, 'isDateString', fieldLabels[field] ?? 'Ngày không hợp lệ.');
    return undefined;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    addError(errors, field, 'isDateString', fieldLabels[field] ?? 'Ngày không hợp lệ.');
    return undefined;
  }
  return value;
}

function normalizeUtcInstant(value: unknown, field: string, errors: ApplicationErrorDetail[]) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?Z$/.test(value) ||
    !isISO8601(value, { strict: true, strictSeparator: true })
  ) {
    addError(errors, field, 'isDateString', fieldLabels[field] ?? 'Thời điểm không hợp lệ.');
    return undefined;
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    addError(errors, field, 'isDateString', fieldLabels[field] ?? 'Thời điểm không hợp lệ.');
    return undefined;
  }
  return parsed.toISOString();
}

function normalizeName(value: unknown, field: string, errors: ApplicationErrorDetail[]) {
  if (typeof value !== 'string') {
    addError(errors, field, 'isString', 'Giá trị phải là chuỗi.');
    return undefined;
  }
  const normalized = value.normalize('NFC').trim().replace(/\s+/gu, ' ');
  if (
    !normalized ||
    normalized.includes('\0') ||
    Buffer.from(normalized).toString() !== normalized
  ) {
    addError(
      errors,
      field,
      'isNotEmpty',
      'Tên không được để trống hoặc chứa dữ liệu không hợp lệ.',
    );
    return undefined;
  }
  if ([...normalized].length > 200) {
    addError(errors, field, 'maxLength', 'Tên không được dài quá 200 ký tự Unicode.');
    return undefined;
  }
  return normalized;
}

function normalizeCode(value: unknown, field: string, errors: ApplicationErrorDetail[]) {
  if (typeof value !== 'string') {
    addError(errors, field, 'isString', 'Mã phải là chuỗi.');
    return undefined;
  }
  const normalized = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/.test(normalized)) {
    addError(
      errors,
      field,
      'matches',
      'Mã chỉ gồm chữ Latin, số, gạch dưới hoặc gạch nối, tối đa 32 ký tự.',
    );
    return undefined;
  }
  return normalized.toUpperCase();
}

function normalizeScalar(
  field: (typeof scalarFields)[number],
  value: unknown,
  errors: ApplicationErrorDetail[],
): unknown {
  if (value === null) return null;
  if (field === 'effectiveMode') {
    if (regulationEffectiveModes.includes(value as RegulationEffectiveMode)) return value;
    addError(errors, field, 'isIn', fieldLabels[field]);
    return undefined;
  }
  if (field === 'proposedEffectiveAt') return normalizeUtcInstant(value, field, errors);
  if (field === 'u21Cutoff') return normalizeDateOnly(value, field, errors);
  if (field === 'formatCode') {
    if (value === 'DOUBLE_ROUND_ROBIN') return value;
    addError(errors, field, 'isIn', fieldLabels[field]);
    return undefined;
  }
  if (!validBusinessInteger(value)) {
    addError(errors, field, 'isInt', 'Giá trị phải là số nguyên trong phạm vi được hỗ trợ.');
    return undefined;
  }
  const number = value as number;
  if (nonnegativeFields.has(field) && number < 0)
    addError(errors, field, 'min', fieldLabels[field] ?? 'Giá trị phải không âm.');
  if (positiveFields.has(field) && number <= 0)
    addError(errors, field, 'min', fieldLabels[field] ?? 'Giá trị phải dương.');
  if (field === 'homegrownAgeStart' && number <= 0)
    addError(errors, field, 'min', fieldLabels[field]);
  if (field === 'homegrownAgeEnd' && number <= 0)
    addError(errors, field, 'min', fieldLabels[field]);
  if (field === 'clubCount' && (number < 4 || number > 20 || number % 2 !== 0))
    addError(errors, field, 'isSupportedCount', fieldLabels[field]);
  if (field === 'legs' && number !== 2) addError(errors, field, 'isIn', fieldLabels[field]);
  return number;
}

function normalizeWindow(value: unknown, index: number, errors: ApplicationErrorDetail[]) {
  const prefix = `registrationWindows[${index}]`;
  if (!isRecord(value)) {
    addError(errors, prefix, 'isObject', 'Kalender phải là một đối tượng.');
    return undefined;
  }
  for (const key of Object.keys(value))
    if (!['intakeKind', 'opensAt', 'closesAt'].includes(key))
      addError(errors, `${prefix}.${key}`, 'whitelistValidation', 'Trường này không được hỗ trợ.');
  const intakeKind = value.intakeKind;
  if (!regulationIntakeKinds.includes(intakeKind as RegulationIntakeKind))
    addError(errors, `${prefix}.intakeKind`, 'isIn', 'Nhóm lịch đăng ký không hợp lệ.');
  const opensAt = normalizeUtcInstant(value.opensAt, `${prefix}.opensAt`, errors);
  const closesAt = normalizeUtcInstant(value.closesAt, `${prefix}.closesAt`, errors);
  if (opensAt && closesAt && opensAt >= closesAt)
    addError(
      errors,
      `${prefix}.closesAt`,
      'isAfter',
      'Thời điểm kết thúc phải sau thời điểm bắt đầu.',
    );
  if (!opensAt || !closesAt || !regulationIntakeKinds.includes(intakeKind as RegulationIntakeKind))
    return undefined;
  return { intakeKind: intakeKind as RegulationIntakeKind, opensAt, closesAt };
}

function normalizeRanking(value: unknown, index: number, errors: ApplicationErrorDetail[]) {
  const prefix = `rankingPriority[${index}]`;
  if (!isRecord(value)) {
    addError(errors, prefix, 'isObject', 'Tiêu chí xếp hạng phải là một đối tượng.');
    return undefined;
  }
  for (const key of Object.keys(value))
    if (!['position', 'criterionCode'].includes(key))
      addError(errors, `${prefix}.${key}`, 'whitelistValidation', 'Trường này không được hỗ trợ.');
  const position = value.position;
  if (!validBusinessInteger(position) || position < 1)
    addError(errors, `${prefix}.position`, 'min', 'Thứ tự tiêu chí phải là số nguyên dương.');
  const criterionCode = value.criterionCode;
  if (!regulationRankingCriteria.includes(criterionCode as RegulationRankingCriterion))
    addError(errors, `${prefix}.criterionCode`, 'isIn', 'Tiêu chí xếp hạng không được hỗ trợ.');
  if (
    !validBusinessInteger(position) ||
    position < 1 ||
    !regulationRankingCriteria.includes(criterionCode as RegulationRankingCriterion)
  )
    return undefined;
  return { position, criterionCode: criterionCode as RegulationRankingCriterion };
}

function normalizeGoalType(value: unknown, index: number, errors: ApplicationErrorDetail[]) {
  const prefix = `goalTypes[${index}]`;
  if (!isRecord(value)) {
    addError(errors, prefix, 'isObject', 'Loại bàn thắng phải là một đối tượng.');
    return undefined;
  }
  for (const key of Object.keys(value))
    if (!['code', 'name', 'isOwnGoal', 'enabled'].includes(key))
      addError(errors, `${prefix}.${key}`, 'whitelistValidation', 'Trường này không được hỗ trợ.');
  const code = normalizeCode(value.code, `${prefix}.code`, errors);
  const name = normalizeName(value.name, `${prefix}.name`, errors);
  if (typeof value.isOwnGoal !== 'boolean')
    addError(errors, `${prefix}.isOwnGoal`, 'isBoolean', 'Giá trị phải là đúng hoặc sai.');
  if (typeof value.enabled !== 'boolean')
    addError(errors, `${prefix}.enabled`, 'isBoolean', 'Giá trị phải là đúng hoặc sai.');
  const baselineOwnGoal: Record<string, boolean> = { A: false, B: false, C: true, D: false };
  if (
    code !== undefined &&
    Object.hasOwn(baselineOwnGoal, code) &&
    value.isOwnGoal !== baselineOwnGoal[code]
  )
    addError(
      errors,
      `${prefix}.isOwnGoal`,
      'matches',
      'Không thể thay đổi ý nghĩa bàn thắng cơ bản của mã này.',
    );
  if (
    code === undefined ||
    name === undefined ||
    typeof value.isOwnGoal !== 'boolean' ||
    typeof value.enabled !== 'boolean'
  )
    return undefined;
  return { code, name, isOwnGoal: value.isOwnGoal, enabled: value.enabled };
}

function normalizeCardType(value: unknown, index: number, errors: ApplicationErrorDetail[]) {
  const prefix = `cardTypes[${index}]`;
  if (!isRecord(value)) {
    addError(errors, prefix, 'isObject', 'Loại thẻ phải là một đối tượng.');
    return undefined;
  }
  for (const key of Object.keys(value))
    if (!['code', 'name', 'meaning', 'enabled'].includes(key))
      addError(errors, `${prefix}.${key}`, 'whitelistValidation', 'Trường này không được hỗ trợ.');
  const code = normalizeCode(value.code, `${prefix}.code`, errors);
  const name = normalizeName(value.name, `${prefix}.name`, errors);
  const meaning = value.meaning;
  if (!regulationCardMeanings.includes(meaning as RegulationCardMeaning))
    addError(
      errors,
      `${prefix}.meaning`,
      'isIn',
      'Ý nghĩa loại thẻ chỉ có thể là YELLOW hoặc RED.',
    );
  if (typeof value.enabled !== 'boolean')
    addError(errors, `${prefix}.enabled`, 'isBoolean', 'Giá trị phải là đúng hoặc sai.');
  if (
    code === undefined ||
    name === undefined ||
    !regulationCardMeanings.includes(meaning as RegulationCardMeaning) ||
    typeof value.enabled !== 'boolean'
  )
    return undefined;
  return { code, name, meaning: meaning as RegulationCardMeaning, enabled: value.enabled };
}

function normalizeArray<T>(
  record: Record<string, unknown>,
  field: string,
  errors: ApplicationErrorDetail[],
  normalize: (value: unknown, index: number, errors: ApplicationErrorDetail[]) => T | undefined,
): NormalizedArray<T> | undefined {
  if (!Object.hasOwn(record, field) || record[field] === undefined) return undefined;
  const input = record[field];
  if (!Array.isArray(input)) {
    addError(errors, field, 'isArray', 'Giá trị phải là danh sách.');
    return undefined;
  }
  const indexed = input.flatMap((value, index) => {
    const result = normalize(value, index, errors);
    return result === undefined ? [] : [{ index, value: result }];
  });
  return { values: indexed.map(({ value }) => value), indexed };
}

function validateUniqueArrayKeys<T>(
  values: readonly IndexedValue<T>[] | undefined,
  field: string,
  keyOf: (value: T) => string | number,
  nestedKey: string,
  errors: ApplicationErrorDetail[],
): void {
  const seen = new Set<string | number>();
  values?.forEach(({ value, index }) => {
    const key = keyOf(value);
    if (seen.has(key))
      addError(
        errors,
        `${field}[${index}].${nestedKey}`,
        'isUnique',
        'Giá trị phải duy nhất trong danh sách.',
      );
    seen.add(key);
  });
}

function validateWindowOverlap(
  values: readonly IndexedValue<RegistrationWindowInput>[] | undefined,
  errors: ApplicationErrorDetail[],
): void {
  for (const kind of regulationIntakeKinds) {
    const group = (values ?? [])
      .filter(({ value }) => value.intakeKind === kind)
      .sort((left, right) => left.value.opensAt.localeCompare(right.value.opensAt));
    for (let index = 1; index < group.length; index++) {
      const prior = group[index - 1];
      const current = group[index];
      if (current.value.opensAt < prior.value.closesAt)
        addError(
          errors,
          `registrationWindows[${current.index}].opensAt`,
          'overlap',
          'Các khoảng trong cùng một nhóm không được chồng lấn.',
        );
    }
  }
}

function validatePartialCrossFields(
  content: RegulationDraftContent,
  errors: ApplicationErrorDetail[],
): void {
  if (
    content.homegrownAgeStart !== undefined &&
    content.homegrownAgeStart !== null &&
    content.homegrownAgeEnd !== undefined &&
    content.homegrownAgeEnd !== null &&
    content.homegrownAgeStart >= content.homegrownAgeEnd
  )
    addError(errors, 'homegrownAgeEnd', 'isAfter', fieldLabels.homegrownAgeEnd);

  if (
    content.effectiveMode === 'IMMEDIATE' &&
    content.proposedEffectiveAt !== undefined &&
    content.proposedEffectiveAt !== null
  )
    addError(
      errors,
      'proposedEffectiveAt',
      'isEmpty',
      'Hiệu lực IMMEDIATE không nhận thời điểm do người dùng chọn.',
    );

  if (
    content.winPoints !== undefined &&
    content.winPoints !== null &&
    content.drawPoints !== undefined &&
    content.drawPoints !== null &&
    content.lossPoints !== undefined &&
    content.lossPoints !== null &&
    !(content.winPoints > content.drawPoints && content.drawPoints > content.lossPoints)
  ) {
    addError(errors, 'winPoints', 'isGreaterThan', fieldLabels.winPoints);
    addError(errors, 'drawPoints', 'isGreaterThan', fieldLabels.drawPoints);
    addError(errors, 'lossPoints', 'isLessThan', fieldLabels.lossPoints);
  }

  if (
    content.clubCount !== undefined &&
    content.clubCount !== null &&
    content.qualificationCount !== undefined &&
    content.qualificationCount !== null &&
    content.relegationCount !== undefined &&
    content.relegationCount !== null
  ) {
    if (content.relegationCount >= content.clubCount)
      addError(errors, 'relegationCount', 'isLessThan', fieldLabels.relegationCount);
    if (content.qualificationCount + content.relegationCount > content.clubCount)
      addError(
        errors,
        'relegationCount',
        'isWithinClubCount',
        'Suất tham dự và xuống hạng không được vượt quá số câu lạc bộ.',
      );
  }
}

function analyzeDraft(input: RegulationDraftContent): DraftAnalysis {
  const errors: ApplicationErrorDetail[] = [];
  if (!isRecord(input)) {
    addError(errors, 'input', 'isObject', 'Dữ liệu quy định phải là một đối tượng.');
    return { content: {}, errors };
  }
  for (const key of Object.keys(input))
    if (!contentFields.has(key))
      addError(errors, key, 'whitelistValidation', 'Trường này không được hỗ trợ.');

  const normalized: Record<string, unknown> = {};
  for (const field of scalarFields) {
    if (!Object.hasOwn(input, field) || input[field] === undefined) continue;
    normalized[field] = normalizeScalar(field, input[field], errors);
  }

  const registrationWindows = normalizeArray(input, 'registrationWindows', errors, normalizeWindow);
  const rankingPriority = normalizeArray(input, 'rankingPriority', errors, normalizeRanking);
  const goalTypes = normalizeArray(input, 'goalTypes', errors, normalizeGoalType);
  const cardTypes = normalizeArray(input, 'cardTypes', errors, normalizeCardType);
  if (registrationWindows) normalized.registrationWindows = registrationWindows.values;
  if (rankingPriority) normalized.rankingPriority = rankingPriority.values;
  if (goalTypes) normalized.goalTypes = goalTypes.values;
  if (cardTypes) normalized.cardTypes = cardTypes.values;

  const content = Object.fromEntries(
    Object.entries(normalized).filter(([, value]) => value !== undefined),
  ) as RegulationDraftContent;

  validateUniqueArrayKeys(
    rankingPriority?.indexed,
    'rankingPriority',
    (value) => value.position,
    'position',
    errors,
  );
  validateUniqueArrayKeys(
    rankingPriority?.indexed,
    'rankingPriority',
    (value) => value.criterionCode,
    'criterionCode',
    errors,
  );
  validateUniqueArrayKeys(goalTypes?.indexed, 'goalTypes', (value) => value.code, 'code', errors);
  validateUniqueArrayKeys(cardTypes?.indexed, 'cardTypes', (value) => value.code, 'code', errors);
  validateWindowOverlap(registrationWindows?.indexed, errors);
  validatePartialCrossFields(content, errors);
  return { content, errors };
}

/** Normalizes supplied editable values and validates only local/fully-present draft constraints. */
export function validateDraftContent(input: RegulationDraftContent): RegulationDraftContent {
  const result = analyzeDraft(input);
  if (result.errors.length) throwErrors(result.errors);
  return result.content;
}

/** Checks one complete typed configuration; trusted effectivity freshness remains a transaction check. */
export function validateCompleteRegulationContent(
  input: RegulationDraftContent,
): CompleteRegulationContent {
  const result = analyzeDraft(input);
  const normalized: Record<string, unknown> = { ...result.content };
  const errors = [...result.errors];

  if (
    normalized.clubCount === 20 &&
    (normalized.relegationCount === undefined || normalized.relegationCount === null)
  )
    normalized.relegationCount = 3;

  for (const field of scalarFields) {
    if (field === 'proposedEffectiveAt') continue;
    if (normalized[field] === undefined || normalized[field] === null)
      addError(errors, field, 'isDefined', fieldLabels[field] ?? 'Trường này là bắt buộc.');
  }

  if (normalized.effectiveMode === undefined || normalized.effectiveMode === null)
    addError(errors, 'effectiveMode', 'isDefined', 'Chế độ hiệu lực là bắt buộc.');
  if (normalized.effectiveMode === 'SCHEDULED') {
    if (normalized.proposedEffectiveAt === undefined || normalized.proposedEffectiveAt === null)
      addError(errors, 'proposedEffectiveAt', 'isDefined', 'Lịch hiệu lực cần có thời điểm UTC.');
  } else if (normalized.effectiveMode === 'IMMEDIATE') {
    normalized.proposedEffectiveAt = null;
  }

  const windows = normalized.registrationWindows as RegistrationWindowInput[] | undefined;
  if (!windows)
    addError(errors, 'registrationWindows', 'isDefined', 'Lịch của hai nhóm đăng ký là bắt buộc.');
  else
    for (const kind of regulationIntakeKinds)
      if (!windows.some(({ intakeKind }) => intakeKind === kind))
        addError(
          errors,
          'registrationWindows',
          'missingGroup',
          'Cần có lịch cho từng nhóm đăng ký.',
        );

  const ranking = normalized.rankingPriority as RankingPriorityInput[] | undefined;
  if (!ranking) addError(errors, 'rankingPriority', 'isDefined', 'Thứ tự xếp hạng là bắt buộc.');
  else if (
    ranking.length !== regulationRankingCriteria.length ||
    regulationRankingCriteria.some(
      (criterion) => !ranking.some(({ criterionCode }) => criterionCode === criterion),
    ) ||
    [...ranking]
      .sort((left, right) => left.position - right.position)
      .some((item, index) => item.position !== index + 1)
  )
    addError(
      errors,
      'rankingPriority',
      'isComplete',
      'Cần đúng ba tiêu chí POINTS, GOAL_DIFFERENCE và GOALS_FOR theo thứ tự liên tục.',
    );

  const goals = normalized.goalTypes as GoalTypeInput[] | undefined;
  if (!goals || goals.length === 0)
    addError(errors, 'goalTypes', 'arrayNotEmpty', 'Cần chọn ít nhất một loại bàn thắng.');
  const cards = normalized.cardTypes as CardTypeInput[] | undefined;
  if (!cards || cards.length === 0)
    addError(errors, 'cardTypes', 'arrayNotEmpty', 'Cần chọn ít nhất một loại thẻ.');

  validatePartialCrossFields(normalized as RegulationDraftContent, errors);
  if (errors.length) throwErrors(errors);

  return normalized as CompleteRegulationContent;
}
