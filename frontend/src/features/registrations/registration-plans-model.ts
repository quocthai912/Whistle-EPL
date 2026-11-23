export type PlanSideVersion = {
  id: string;
  versionNumber: number;
  shirtNumber: number | null;
  playingStart: string | null;
  playingEnd: string | null;
  playingDisposition: string | null;
};

export type PlanTransferItem = {
  id: string;
  operationKind: 'TRANSFER' | 'PLAN_CHANGE' | 'PLAN_CANCEL';
  effectiveAt: string;
  reason: string;
  supersedesOperationId: string | null;
  isSuperseded: boolean;
  createdAt: string;
  actor: { id: string; fullName: string; personnelCode: string };
  direction: 'OUTGOING' | 'INCOMING';
  canManageBothSides: boolean;
  counterpartAccessRestricted: boolean;
  oldSide: {
    accessRestricted?: boolean;
    caseId: string | null;
    season: { id: string; code: string; name: string; state: 'OPEN' | 'CLOSED' } | null;
    club: {
      id: string;
      code: string;
      name: string;
      abbreviation: string;
      discontinuedAt: string | null;
    } | null;
    beforeVersion: PlanSideVersion | null;
    afterVersion: PlanSideVersion | null;
  };
  newSide: {
    accessRestricted?: boolean;
    caseId: string | null;
    season: { id: string; code: string; name: string; state: 'OPEN' | 'CLOSED' } | null;
    club: {
      id: string;
      code: string;
      name: string;
      abbreviation: string;
      discontinuedAt: string | null;
    } | null;
    version: PlanSideVersion | null;
  };
};

export function resolvePreTransferEnd(
  activePlan: PlanTransferItem | null,
  history: readonly PlanTransferItem[],
): { known: boolean; endIso: string | null } {
  if (!activePlan) return { known: false, endIso: null };
  const byId = new Map(history.map((item) => [item.id, item]));
  let cursor: PlanTransferItem = activePlan;
  const visited = new Set<string>([cursor.id]);
  let guard = 0;
  while (cursor.supersedesOperationId && guard < 50) {
    guard += 1;
    if (visited.has(cursor.supersedesOperationId)) {
      return { known: false, endIso: null };
    }
    const prev = byId.get(cursor.supersedesOperationId);
    if (!prev) break;
    visited.add(prev.id);
    cursor = prev;
  }
  if (
    cursor.supersedesOperationId ||
    cursor.operationKind !== 'TRANSFER' ||
    !cursor.oldSide.beforeVersion
  ) {
    return { known: false, endIso: null };
  }
  return { known: true, endIso: cursor.oldSide.beforeVersion.playingEnd };
}
