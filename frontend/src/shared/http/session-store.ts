export type SessionView = {
  account: { id: string; personnelCode: string; fullName: string; username: string };
  changeRequired: boolean;
  systemAdministrator?: boolean;
  seasonManagerIds?: string[];
  canCreateSeason?: boolean;
  sharedMasterKinds?: SharedMasterKind[];
  seasonRoles?: SeasonRoleHint[];
  preparationCapabilities?: PreparationCapabilities;
};
export type SharedMasterKind = 'CLUB_MASTER' | 'STADIUM_MASTER' | 'PLAYER_MASTER';
export type SeasonRoleCode =
  'SEASON_MANAGER' | 'REGISTRATION_OFFICER' | 'SCHEDULING_OFFICER' | 'RESULTS_OFFICER';
export type SeasonRoleHint = { seasonId: string; roleCode: SeasonRoleCode };
export type PreparationActionCode = 'PREPARE_REGULATION_CHANGE';
export type PreparationCapability = { seasonId: string; actionCode: PreparationActionCode };
export type PreparationCapabilities = {
  direct: PreparationCapability[];
  delegated: PreparationCapability[];
};
type NoticeTone = 'warning' | 'success';
export type SessionSnapshot = {
  session: SessionView | null;
  epoch: number;
  notice: string | null;
  noticeTone: NoticeTone;
};

/** Session and internal view memory have one owner and one invalidation path. */
export class SessionStore {
  private state: SessionSnapshot = { session: null, epoch: 0, notice: null, noticeTone: 'warning' };
  private readonly listeners = new Set<() => void>();
  private readonly memory = new Map<string, unknown>();
  private csrfToken: string | null = null;
  getSnapshot = (): SessionSnapshot => this.state;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  acceptSession(session: SessionView): void {
    this.replace(session, null);
  }
  clear(notice: string | null = null, noticeTone: NoticeTone = 'warning'): void {
    this.replace(null, notice, noticeTone);
  }
  private replace(
    session: SessionView | null,
    notice: string | null,
    noticeTone: NoticeTone = 'warning',
  ): void {
    this.memory.clear();
    this.csrfToken = null;
    this.state = { session, notice, noticeTone, epoch: this.state.epoch + 1 };
    // React may resubscribe while a keyed subtree remounts; notify the original snapshot.
    for (const listener of [...this.listeners]) listener();
  }
  remember(key: string, value: unknown): void {
    this.memory.set(key, value);
  }
  recall(key: string): unknown {
    return this.memory.get(key);
  }
  getCsrf(): string | null {
    return this.csrfToken;
  }
  forgetCsrf(): void {
    this.csrfToken = null;
  }
  acceptCsrf(token: string, epoch: number): void {
    if (this.state.epoch === epoch) this.csrfToken = token;
  }
}
