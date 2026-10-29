import { useContext, useSyncExternalStore } from 'react';
import SessionContext from './session-context';

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('SessionProvider is required.');
  return {
    ...context,
    ...useSyncExternalStore(context.store.subscribe, context.store.getSnapshot),
  };
}
