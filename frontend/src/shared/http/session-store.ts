export type SessionView = {
  account: { id: string; personnelCode: string; fullName: string; username: string };
  changeRequired: boolean;
};
export type SessionSnapshot = { session: SessionView | null; epoch: number; notice: string | null };

/** Session and internal view memory have one owner and one invalidation path. */
export class SessionStore {
  private state: SessionSnapshot = { session: null, epoch: 0, notice: null };
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
  clear(notice: string | null = null): void {
    this.replace(null, notice);
  }
  private replace(session: SessionView | null, notice: string | null): void {
    this.memory.clear();
    this.csrfToken = null;
    this.state = { session, notice, epoch: this.state.epoch + 1 };
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
  acceptCsrf(token: string, epoch: number): void {
    if (this.state.epoch === epoch) this.csrfToken = token;
  }
}
