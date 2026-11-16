export type RegulationState =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'RETURNED'
  | 'WITHDRAWN'
  | 'REJECTED'
  | 'APPROVED_WAITING'
  | 'EFFECTIVE'
  | 'SUPERSEDED'
  | 'CANCELLED'
  | 'ACTIVATION_BLOCKED';

export type EffectiveMode = 'IMMEDIATE' | 'SCHEDULED';
export type IntakeKind = 'CLUB_APPLICATION' | 'PLAYER_CHANGE';
export type RankingCriterion = 'POINTS' | 'GOAL_DIFFERENCE' | 'GOALS_FOR';
export type CardMeaning = 'YELLOW' | 'RED';

export type RegulationVersionSummary = {
  id: string;
  versionNumber: number;
  revision: string;
  state: RegulationState;
  predecessorVersionId: string | null;
  effectiveMode: EffectiveMode | null;
  proposedEffectiveAt: string | null;
  approvedAt: string | null;
  activationProcessedAt: string | null;
  activeFrom: string | null;
  activeUntil: string | null;
  isCurrentEffective: boolean;
  isCurrentDraft: boolean;
  preparedBy: { id: string; fullName: string };
  capabilities: {
    canEditDraft: boolean;
    canSubmit: boolean;
    canWithdraw: boolean;
    canReturn: boolean;
    canReject: boolean;
    canApprove?: boolean;
    approvalExcluded?: boolean;
    canCreateSuccessor: boolean;
  };
};

export type RegulationVersionsData = {
  items: RegulationVersionSummary[];
  capabilities: { canCreateDraft: boolean; canManageChanges?: boolean };
  overview: {
    currentEffective: RegulationOverviewSummary | null;
    waiting: RegulationOverviewSummary | null;
  };
};

export type RegulationOverviewSummary = {
  id: string;
  versionNumber: number;
  state: RegulationState;
  effectiveMode: EffectiveMode | null;
  proposedEffectiveAt: string | null;
  approvedAt: string | null;
  activeFrom: string | null;
  activeUntil: string | null;
};

export type RegulationPageMeta = { page: number; pageSize: number; total: number };

export type RegulationWindow = {
  id?: string;
  intakeKind: IntakeKind;
  opensAt: string;
  closesAt: string;
};

export type RankingPriority = {
  id?: string;
  position: number;
  criterionCode: RankingCriterion;
};

export type GoalType = {
  id?: string;
  code: string;
  name: string;
  isOwnGoal: boolean;
  enabled: boolean;
};

export type CardType = {
  id?: string;
  code: string;
  name: string;
  meaning: CardMeaning;
  enabled: boolean;
};

export type RegulationContent = {
  effectiveMode: EffectiveMode | null;
  proposedEffectiveAt: string | null;
  squadLimit: number | null;
  nonHomegrownLimit: number | null;
  homegrownSeasons: number | null;
  homegrownMonths: number | null;
  homegrownAgeStart: number | null;
  homegrownAgeEnd: number | null;
  u21Cutoff: string | null;
  clubCount: number | null;
  formatCode: 'DOUBLE_ROUND_ROBIN' | null;
  legs: number | null;
  plannedMinutes: number | null;
  preparationMinutes: number | null;
  releaseMinutes: number | null;
  winPoints: number | null;
  drawPoints: number | null;
  lossPoints: number | null;
  qualificationCount: number | null;
  relegationCount: number | null;
  registrationWindows: RegulationWindow[];
  rankingPriority: RankingPriority[];
  goalTypes: GoalType[];
  cardTypes: CardType[];
};

export type RegulationVersionDetail = {
  id: string;
  seasonId: string;
  versionNumber: number;
  revision: string;
  state: RegulationState;
  predecessorVersionId: string | null;
  submittedAt: string | null;
  decidedAt: string | null;
  decidedBy: { id: string; fullName: string } | null;
  decisionReason: string | null;
  effectiveMode: EffectiveMode | null;
  proposedEffectiveAt: string | null;
  approvedAt: string | null;
  activationProcessedAt: string | null;
  activeFrom: string | null;
  activeUntil: string | null;
  preparedBy: { id: string; fullName: string };
  editors: { accountId: string; firstEditedAt: string }[];
  content: RegulationContent;
  capabilities: {
    canEditDraft: boolean;
    canSubmit: boolean;
    canWithdraw: boolean;
    canReturn: boolean;
    canReject: boolean;
    canApprove?: boolean;
    approvalExcluded?: boolean;
    canCreateSuccessor: boolean;
  };
};

export type RegulationVersionHistoryItem = {
  id: string;
  actorId: string | null;
  actorKind: string;
  operatorIdentity: string | null;
  occurredAt: string;
  actionCode: string;
  objectKind: string;
  objectId: string;
  seasonId: string | null;
  outcome: string;
  actorName: string | null;
  seasonCode: string | null;
  reason: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
};

export type RegulationVersionHistory = { items: RegulationVersionHistoryItem[] };

export type RegulationFormValues = Omit<
  RegulationContent,
  'proposedEffectiveAt' | 'registrationWindows'
> & {
  /** datetime-local value in the approved Asia/Ho_Chi_Minh display/input zone. */
  proposedEffectiveAt: string;
  registrationWindows: {
    intakeKind: IntakeKind;
    opensAt: string;
    closesAt: string;
  }[];
};

export type RegulationDraftContent = Omit<RegulationContent, 'registrationWindows'> & {
  registrationWindows: Omit<RegulationWindow, 'id'>[];
  rankingPriority: Omit<RankingPriority, 'id'>[];
  goalTypes: Omit<GoalType, 'id'>[];
  cardTypes: Omit<CardType, 'id'>[];
};

export const regulationStateLabels: Record<RegulationState, string> = {
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Đã gửi thẩm định',
  RETURNED: 'Đã trả lại',
  WITHDRAWN: 'Đã rút',
  REJECTED: 'Đã từ chối',
  APPROVED_WAITING: 'Đã duyệt, chờ hiệu lực',
  EFFECTIVE: 'Đang hiệu lực',
  SUPERSEDED: 'Đã thay thế',
  CANCELLED: 'Đã hủy',
  ACTIVATION_BLOCKED: 'Bị chặn khi kích hoạt',
};

export const rankingCriterionLabels: Record<RankingCriterion, string> = {
  POINTS: 'Điểm số',
  GOAL_DIFFERENCE: 'Hiệu số bàn thắng',
  GOALS_FOR: 'Số bàn thắng',
};

export const intakeKindLabels: Record<IntakeKind, string> = {
  CLUB_APPLICATION: 'Hồ sơ câu lạc bộ',
  PLAYER_CHANGE: 'Thay đổi đăng ký cầu thủ',
};

export function formatRegulationDate(value: string | null | undefined): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '—';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export function utcInstantToHcmInput(value: string | null | undefined): string {
  if (!value || !Number.isFinite(Date.parse(value))) return '';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}.${get('fractionalSecond')}`;
}

export function hcmInputToUtcInstant(value: string): string | null {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value);
  if (!match) return null;
  const [, date, hour, minute, second = '00', fraction = ''] = match;
  const calendarDate = new Date(`${date}T00:00:00.000Z`);
  if (
    !Number.isFinite(calendarDate.getTime()) ||
    calendarDate.toISOString().slice(0, 10) !== date ||
    Number(hour) > 23 ||
    Number(minute) > 59 ||
    Number(second) > 59
  )
    return null;
  const normalized = `${date}T${hour}:${minute}:${second}.${fraction.padEnd(3, '0')}`;
  const instant = new Date(`${normalized}+07:00`);
  if (!Number.isFinite(instant.getTime())) return null;
  const utc = instant.toISOString();
  return utcInstantToHcmInput(utc) === normalized ? utc : null;
}

export function blankRegulationContent(): RegulationContent {
  return {
    effectiveMode: null,
    proposedEffectiveAt: null,
    squadLimit: null,
    nonHomegrownLimit: null,
    homegrownSeasons: null,
    homegrownMonths: null,
    homegrownAgeStart: null,
    homegrownAgeEnd: null,
    u21Cutoff: null,
    clubCount: null,
    formatCode: null,
    legs: null,
    plannedMinutes: null,
    preparationMinutes: null,
    releaseMinutes: null,
    winPoints: null,
    drawPoints: null,
    lossPoints: null,
    qualificationCount: null,
    relegationCount: null,
    registrationWindows: [],
    rankingPriority: [],
    goalTypes: [],
    cardTypes: [],
  };
}

export function formValuesFromContent(content: RegulationContent): RegulationFormValues {
  return {
    ...content,
    proposedEffectiveAt: utcInstantToHcmInput(content.proposedEffectiveAt),
    registrationWindows: content.registrationWindows.map((window) => ({
      intakeKind: window.intakeKind,
      opensAt: utcInstantToHcmInput(window.opensAt),
      closesAt: utcInstantToHcmInput(window.closesAt),
    })),
    rankingPriority: [...content.rankingPriority]
      .sort((left, right) => left.position - right.position)
      .map((item, index) => ({ ...item, position: index + 1 })),
    goalTypes: content.goalTypes.map(({ code, name, isOwnGoal, enabled }) => ({
      code,
      name,
      isOwnGoal,
      enabled,
    })),
    cardTypes: content.cardTypes.map(({ code, name, meaning, enabled }) => ({
      code,
      name,
      meaning,
      enabled,
    })),
  };
}

export function draftContentFromForm(values: RegulationFormValues): RegulationDraftContent {
  return {
    effectiveMode: values.effectiveMode,
    proposedEffectiveAt: values.proposedEffectiveAt
      ? hcmInputToUtcInstant(values.proposedEffectiveAt)
      : null,
    squadLimit: values.squadLimit,
    nonHomegrownLimit: values.nonHomegrownLimit,
    homegrownSeasons: values.homegrownSeasons,
    homegrownMonths: values.homegrownMonths,
    homegrownAgeStart: values.homegrownAgeStart,
    homegrownAgeEnd: values.homegrownAgeEnd,
    u21Cutoff: values.u21Cutoff,
    clubCount: values.clubCount,
    formatCode: values.formatCode,
    legs: values.legs,
    plannedMinutes: values.plannedMinutes,
    preparationMinutes: values.preparationMinutes,
    releaseMinutes: values.releaseMinutes,
    winPoints: values.winPoints,
    drawPoints: values.drawPoints,
    lossPoints: values.lossPoints,
    qualificationCount: values.qualificationCount,
    relegationCount: values.relegationCount,
    registrationWindows: values.registrationWindows.map((window) => ({
      intakeKind: window.intakeKind,
      opensAt: hcmInputToUtcInstant(window.opensAt) ?? '',
      closesAt: hcmInputToUtcInstant(window.closesAt) ?? '',
    })),
    rankingPriority: values.rankingPriority.map((item, index) => ({
      position: index + 1,
      criterionCode: item.criterionCode,
    })),
    goalTypes: values.goalTypes.map(({ code, name, isOwnGoal, enabled }) => ({
      code: normalizeRegulationCode(code),
      name: normalizeRegulationText(name),
      isOwnGoal,
      enabled,
    })),
    cardTypes: values.cardTypes.map(({ code, name, meaning, enabled }) => ({
      code: normalizeRegulationCode(code),
      name: normalizeRegulationText(name),
      meaning,
      enabled,
    })),
  };
}

export function applySourceProposedValues(values: RegulationFormValues): RegulationFormValues {
  return {
    ...values,
    clubCount: 20,
    squadLimit: 25,
    nonHomegrownLimit: 17,
    homegrownSeasons: 3,
    homegrownMonths: 36,
  };
}

export function codePointLength(value: string): number {
  return Array.from(value.normalize('NFC')).length;
}

export function normalizeRegulationText(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/gu, ' ');
}

export function normalizeRegulationCode(value: string): string {
  const trimmed = value.normalize('NFC').trim();
  return Array.from(trimmed).every((character) => (character.codePointAt(0) ?? 0) <= 0x7f)
    ? trimmed.toUpperCase()
    : trimmed;
}
