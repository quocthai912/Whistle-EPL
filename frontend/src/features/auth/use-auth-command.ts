import { useRef, useState } from 'react';
import { HttpFailure } from '../../shared/http/client';
import { useSession } from '../../shared/http/use-session';

/** One user action, one write. Uncertain outcomes require an explicit session read. */
export function useAuthCommand() {
  const { client } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const pending = useRef(false);
  async function execute(path: string, body?: unknown) {
    if (pending.current || uncertain) return null;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      return await client.request<unknown>(path, {
        method: 'POST',
        ...(body === undefined ? {} : { body }),
      });
    } catch (failure) {
      setUncertain(failure instanceof HttpFailure && failure.unknownOutcome);
      setError(failure instanceof Error ? failure.message : 'Không thể hoàn tất yêu cầu.');
      return null;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return {
    error,
    busy,
    uncertain,
    execute,
    reject: setError,
    resolved: () => {
      setUncertain(false);
      setError(null);
    },
  };
}
