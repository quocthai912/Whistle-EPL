export type SeasonState = 'OPEN' | 'CLOSED';

export type SeasonListItem = {
  id: string;
  code: string;
  name: string;
  competitionName: string;
  startDate: string;
  endDate: string;
  state: SeasonState;
  revision: string;
  effectiveRegulation: {
    versionId: string;
    versionNumber: number;
    activeFrom: string | null;
    activeUntil: string | null;
  } | null;
  capabilities: { canEditMetadata: boolean };
};

export type SeasonList = {
  items: SeasonListItem[];
};

export type SeasonPageMeta = {
  page: number;
  pageSize: number;
  total: number;
};

export type SeasonDetailRecord = SeasonListItem & {
  effectiveRegulation: {
    versionId: string;
    versionNumber: number;
    activeFrom: string | null;
    activeUntil: string | null;
  } | null;
  waitingRegulation: {
    versionId: string;
    versionNumber: number;
    proposedEffectiveAt: string | null;
  } | null;
};

export type SeasonHistoryItem = {
  id: string;
  actorKind: string;
  actorName: string | null;
  operatorIdentity: string | null;
  occurredAt: string;
  actionCode: string;
  outcome: string;
  reason: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
};

export type SeasonHistory = {
  items: SeasonHistoryItem[];
};

export type SeasonHistoryMeta = {
  page: number;
  pageSize: number;
  total: number;
};

/** The REST contract returns date-only values; render them without timezone conversion. */
export function formatSeasonDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '—';
}

export function formatSeasonInstant(value: string | null): string {
  if (!value || !Number.isFinite(Date.parse(value))) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function normalizeSeasonText(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/gu, ' ');
}
