import {
  createContext,
  Fragment,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { SessionStore } from './session-store';
import { HttpClient, HttpFailure } from './client';
import { sessionView } from './session-view';

// The context value is isolated to a provider instance; no cross-account global cache.
const SessionContext = createContext<{
  store: SessionStore;
  client: HttpClient;
  ready: boolean;
  bootstrapError: string | null;
  retry: () => void;
} | null>(null);
export default SessionContext;
export function SessionProvider({ children }: { children: ReactNode }) {
  const [value] = useState(() => {
    const store = new SessionStore();
    return { store, client: new HttpClient(store) };
  });
  const [ready, setReady] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void value.client
      .request<unknown>('/auth/session')
      .then(({ data }) => {
        if (active) value.store.acceptSession(sessionView(data));
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof HttpFailure && error.status === 401) {
          if (error.code === 'AUTH_REQUIRED') value.store.clear();
        } else
          setBootstrapError(
            error instanceof Error ? error.message : 'Không thể kiểm tra phiên đăng nhập.',
          );
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [value, attempt]);
  useEffect(() => {
    const refresh = () => {
      if (!value.store.getSnapshot().session || document.visibilityState === 'hidden') return;
      void value.client
        .request<unknown>('/auth/session')
        .then(({ data: raw }) => {
          const data = sessionView(raw);
          const current = value.store.getSnapshot().session;
          if (
            current &&
            (current.account.id !== data.account.id ||
              current.changeRequired !== data.changeRequired)
          )
            value.store.acceptSession(data);
        })
        .catch(() => {
          /* The HTTP layer owns session-loss feedback. No write is replayed. */
        });
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [value]);
  const { epoch } = useSyncExternalStore(value.store.subscribe, value.store.getSnapshot);
  return (
    <SessionContext.Provider
      value={{
        ...value,
        ready,
        bootstrapError,
        retry: () => {
          setReady(false);
          setBootstrapError(null);
          setAttempt((count) => count + 1);
        },
      }}
    >
      <Fragment key={epoch}>{children}</Fragment>
    </SessionContext.Provider>
  );
}
