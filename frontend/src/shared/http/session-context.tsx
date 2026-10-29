import { createContext, Fragment, useState, useSyncExternalStore, type ReactNode } from 'react';
import { SessionStore } from './session-store';
import { HttpClient } from './client';

// The context value is isolated to a provider instance; no cross-account global cache.
const SessionContext = createContext<{ store: SessionStore; client: HttpClient } | null>(null);
export default SessionContext;
export function SessionProvider({ children }: { children: ReactNode }) {
  const [value] = useState(() => {
    const store = new SessionStore();
    return { store, client: new HttpClient(store) };
  });
  const { epoch } = useSyncExternalStore(value.store.subscribe, value.store.getSnapshot);
  return (
    <SessionContext.Provider value={value}>
      <Fragment key={epoch}>{children}</Fragment>
    </SessionContext.Provider>
  );
}
